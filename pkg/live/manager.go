package live

import (
	"Q-Solver/pkg/audio"
	"Q-Solver/pkg/config"
	"Q-Solver/pkg/llm"
	"Q-Solver/pkg/logger"
	"Q-Solver/pkg/screen"
	"context"
	"encoding/base64"
	"strings"
	"sync"
)

// LiveSessionManager 管理 Live API 会话的完整生命周期
type LiveSessionManager struct {
	// 依赖注入
	ctx           context.Context
	llmService    *llm.Service
	configManager *config.ConfigManager
	screenService *screen.Service
	emitEvent     func(string, ...any)

	// Live Session 状态
	session      llm.LiveSession
	audioCapture *audio.LoopbackCapture
	mu           sync.Mutex

	// 协程管理
	stopChan chan struct{}
	wg       sync.WaitGroup
}

// NewLiveSessionManager 创建 Live Session 管理器
func NewLiveSessionManager(
	ctx context.Context,
	llmService *llm.Service,
	configManager *config.ConfigManager,
	screenService *screen.Service,
	emitEvent func(string, ...any),
) *LiveSessionManager {
	return &LiveSessionManager{
		ctx:           ctx,
		llmService:    llmService,
		configManager: configManager,
		screenService: screenService,
		emitEvent:     emitEvent,
		stopChan:      make(chan struct{}),
	}
}

// Start 启动 Live API 会话
func (m *LiveSessionManager) Start() error {
	m.mu.Lock()
	defer m.mu.Unlock()

	cfg := m.configManager.Get()

	// 检查 Provider 是否支持 Live
	provider := m.llmService.GetProvider()
	liveProvider, ok := provider.(llm.LiveProvider)
	if !ok {
		m.emitEvent("live:error", "Current model does not support Live API")
		return nil
	}

	m.emitEvent("live:status", "connecting")

	// 连接 Live Session
	liveCfg := llm.GetLiveConfig(cfg)
	session, err := liveProvider.ConnectLive(m.ctx, liveCfg)
	if err != nil {
		logger.Println("liveApi connection failed", err)
		m.emitEvent("live:status", "error")
		m.emitEvent("live:error", err.Error())
		return err
	}

	m.emitEvent("live:status", "connected")

	// 保存 session
	m.session = session

	// 初始化音频采集
	m.audioCapture, err = audio.NewLoopbackCapture(nil)
	if err != nil {
		logger.Printf("Audio capture initialization failed: %v", err)
		m.emitEvent("live:error", "Audio capture initialization failed: "+err.Error())
		// 音频采集失败，关闭会话
		session.Close()
		m.session = nil
		m.emitEvent("live:status", "error")
		return err
	}

	if err := m.audioCapture.Start(); err != nil {
		logger.Printf("Audio capture start failed: %v", err)
		m.emitEvent("live:error", "Audio capture start failed: "+err.Error())
		// 音频采集失败，关闭会话和音频设备
		m.audioCapture.Close()
		m.audioCapture = nil
		session.Close()
		m.session = nil
		m.emitEvent("live:status", "error")
		return err
	}

	// 启动音频发送协程
	m.wg.Add(1)
	go m.audioSender(session, m.audioCapture.GetAudioChannel())

	// 启动接收协程
	m.wg.Add(1)
	go m.receiveLoop(session)

	return nil
}

// Stop 停止 Live API 会话
func (m *LiveSessionManager) Stop() {
	m.mu.Lock()
	defer m.mu.Unlock()

	logger.Println("Live: StopLiveSession called")

	// 停止音频采集
	if m.audioCapture != nil {
		logger.Println("Live: Stopping audio capture")
		m.audioCapture.Close()
		m.audioCapture = nil
	}

	// 关闭会话
	if m.session != nil {
		logger.Println("Live: Closing session")
		m.session.Close()
		m.session = nil
	}

	// 等待协程结束
	m.wg.Wait()

	m.emitEvent("live:status", "disconnected")
}

// IsActive 检查 Live Session 是否活跃
func (m *LiveSessionManager) IsActive() bool {
	m.mu.Lock()
	defer m.mu.Unlock()
	return m.session != nil
}

// audioSender 从音频 channel 读取数据并发送给 Live Session
func (m *LiveSessionManager) audioSender(session llm.LiveSession, audioChan <-chan []byte) {
	defer m.wg.Done()

	logger.Println("Live: Audio sender goroutine started")
	for audioData := range audioChan {
		if session != nil {
			if err := session.SendAudio(audioData); err != nil {
				logger.Printf("Live: Failed to send audio: %v", err)
				// 连接可能已断开，退出循环
				return
			}
		}
	}
	logger.Println("Live: Audio sender goroutine ended")
}

// receiveLoop 接收 Live 消息的循环
func (m *LiveSessionManager) receiveLoop(session llm.LiveSession) {
	defer m.wg.Done()

	logger.Println("Live: Receive loop started")
	defer func() {
		logger.Println("Live: Receive loop ended")
		session.Close()
	}()

	for {
		msg, err := session.Receive()
		if err != nil {
			logger.Printf("Live: Receive error: %v", err)
			m.emitEvent("live:status", "disconnected")
			m.emitEvent("live:error", err.Error())
			return
		}
		if msg == nil {
			continue
		}

		switch msg.Type {
		case llm.LiveInterrupted:
			logger.Println("Interruption detected")
			m.emitEvent("live:Interrupted", msg.Text)
		case llm.LiveMsgTranscript:
			m.emitEvent("live:transcript", msg.Text)
		case llm.LiveMsgInterviewerDone:
			logger.Println("Live: Interviewer finished speaking")
			m.emitEvent("live:interviewer-done")
		case llm.LiveMsgAIText:
			m.emitEvent("live:ai-text", msg.Text)
		case llm.LiveMsgToolCall:
			logger.Printf("Live: Tool call %s (ID=%s)", msg.ToolName, msg.ToolID)
			if msg.ToolName == "get_screenshot" {
				m.handleScreenshot(session, msg.ToolID)
			}
		case llm.LiveMsgDone:
			logger.Println("Live: Turn complete")
			m.emitEvent("live:done")
		case llm.LiveMsgError:
			logger.Printf("Live: Error: %s", msg.Text)
			m.emitEvent("live:error", msg.Text)
		}
	}
}

// handleScreenshot 处理 Live API 的截图请求
func (m *LiveSessionManager) handleScreenshot(session llm.LiveSession, toolID string) {
	cfg := m.configManager.Get()

	preview, err := m.screenService.CapturePreview(
		cfg.CompressionQuality,
		cfg.Sharpening,
		cfg.Grayscale,
		cfg.NoCompression,
		cfg.ScreenshotMode,
	)
	if err != nil {
		logger.Printf("Live screenshot failed: %v", err)
		_ = session.SendToolResponse(toolID, "Screenshot failed: "+err.Error())
		return
	}

	// 解析 data URL 格式: data:image/jpeg;base64,xxxxx
	base64Str := preview.Base64
	mimeType := "image/jpeg" // 默认

	if strings.HasPrefix(base64Str, "data:") {
		// 提取 MIME 类型
		if idx := strings.Index(base64Str, ";base64,"); idx > 5 {
			mimeType = base64Str[5:idx]   // 提取 "image/jpeg" 或 "image/png"
			base64Str = base64Str[idx+8:] // 去掉前缀，保留纯 base64
		}
	}

	// 解码 Base64 为原始图片数据
	imageData, err := base64.StdEncoding.DecodeString(base64Str)
	if err != nil {
		logger.Printf("Live Base64 decode failed: %v", err)
		_ = session.SendToolResponse(toolID, "Image decode failed")
		return
	}

	// 发送图片数据给模型
	err = session.SendToolResponseWithImage(toolID, imageData, mimeType)
	if err != nil {
		logger.Printf("Live send screenshot failed: %v", err)
	} else {
		logger.Printf("Live: Sent screenshot to model (%d bytes, %s)", len(imageData), mimeType)
	}
}
