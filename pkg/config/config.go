package config

import (
	"Q-Solver/pkg/shortcut"
	"encoding/json"
)

type Config struct {
	APIKey             string                         `json:"apiKey,omitempty"`
	Provider           string                         `json:"provider,omitempty"`
	Model              string                         `json:"model,omitempty"`
	BaseURL            string                         `json:"baseURL,omitempty"`
	Prompt             string                         `json:"prompt,omitempty"`
	Opacity            float64                        `json:"opacity,omitempty"`
	NoCompression      bool                           `json:"noCompression,omitempty"`
	CompressionQuality int                            `json:"compressionQuality,omitempty"`
	Sharpening         float64                        `json:"sharpening,omitempty"`
	Grayscale          bool                           `json:"grayscale,omitempty"`
	KeepContext        bool                           `json:"keepContext,omitempty"`
	InterruptThinking  bool                           `json:"interruptThinking,omitempty"`
	ScreenshotMode     string                         `json:"screenshotMode,omitempty"`
	ResumePath         string                         `json:"resumePath,omitempty"`
	ResumeBase64       string                         `json:"-"`
	ResumeContent      string                         `json:"resumeContent,omitempty"`
	UseMarkdownResume  bool                           `json:"useMarkdownResume,omitempty"`
	Shortcuts          map[string]shortcut.KeyBinding `json:"shortcuts,omitempty"`

	// LLM 生成参数
	Temperature    float64 `json:"temperature,omitempty"`
	TopP           float64 `json:"topP,omitempty"`
	TopK           int     `json:"topK,omitempty"`
	MaxTokens      int     `json:"maxTokens,omitempty"`
	ThinkingBudget int     `json:"thinkingBudget,omitempty"`

	// Live API
	UseLiveApi bool `json:"useLiveApi,omitempty"`
}

const DefaultModel = "gemini-2.5-flash"

func NewDefaultConfig() Config {
	return Config{
		APIKey:             "",
		Model:              DefaultModel,
		BaseURL:            "",
		ResumePath:         "",
		Prompt:             "",
		Opacity:            1.0,
		KeepContext:        false,
		InterruptThinking:  false,
		ScreenshotMode:     "window",
		NoCompression:      false,
		CompressionQuality: 80,
		Sharpening:         0.0,
		Grayscale:          false,
		UseMarkdownResume:  false,
		ResumeBase64:       "",
		ResumeContent:      "",
		Provider:           "google",

		Shortcuts: map[string]shortcut.KeyBinding{
			"solve":        {ComboID: "119", KeyName: "F8"},
			"toggle":       {ComboID: "120", KeyName: "F9"},
			"clickthrough": {ComboID: "121", KeyName: "F10"},
			"move_up":      {ComboID: "38+164", KeyName: "Alt+↑"},
			"move_down":    {ComboID: "40+164", KeyName: "Alt+↓"},
			"move_left":    {ComboID: "37+164", KeyName: "Alt+←"},
			"move_right":   {ComboID: "39+164", KeyName: "Alt+→"},
			"scroll_up":    {ComboID: "33+164", KeyName: "Alt+PgUp"},
			"scroll_down":  {ComboID: "34+164", KeyName: "Alt+PgDn"},
		},

		// LLM 生成参数默认值
		Temperature:    1.0,
		TopP:           0.95,
		TopK:           40,
		MaxTokens:      8192,
		ThinkingBudget: 16000,

		// Live API
		UseLiveApi: false,
	}
}

func (c *Config) ToJSON() string {
	data, _ := json.MarshalIndent(c, "", "  ")
	return string(data)
}

func (c *Config) Validate() error {
	if c.ScreenshotMode != "" && c.ScreenshotMode != "fullscreen" && c.ScreenshotMode != "window" {
		return &ValidationError{Field: "screenshotMode", Message: "Screenshot mode must be 'fullscreen' or 'window'"}
	}
	if c.Opacity < 0 || c.Opacity > 1 {
		return &ValidationError{Field: "opacity", Message: "Opacity must be between 0 and 1"}
	}
	if c.CompressionQuality < 1 || c.CompressionQuality > 100 {
		return &ValidationError{Field: "compressionQuality", Message: "Compression quality must be between 1 and 100"}
	}
	return nil
}

type ValidationError struct {
	Field   string
	Message string
}

func (e *ValidationError) Error() string {
	return e.Field + ": " + e.Message
}
