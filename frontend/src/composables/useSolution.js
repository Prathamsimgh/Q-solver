import { ref, reactive, nextTick, computed } from 'vue'
import { marked } from 'marked'
import { SaveImageToFile } from '../../wailsjs/go/main/App'

export function useSolution(settings) {
  // 移除全局 renderedContent，改用 currentRounds 计算属性
  const history = ref([])
  const activeHistoryIndex = ref(0)
  const isLoading = ref(false)
  const isAppending = ref(false)
  const shouldOverwriteHistory = ref(false)
  const isThinking = ref(false)  // 是否正在显示思维链
  let streamBuffer = ''
  let thinkingBuffer = ''  // 思维链缓冲区
  let thinkingStartTime = 0 // 思考开始时间
  let pendingUserScreenshot = ''  // 待关联到历史记录的用户截图

  const errorState = reactive({
    show: false,
    icon: '⚠️',
    title: 'Something went wrong',
    desc: 'An unknown error occurred',
    rawError: '',
    showDetails: false
  })

  // ==================== 辅助函数（低耦合） ====================

  /**
   * 渲染 Markdown 为 HTML
   */
  function renderMarkdown(md) {
    if (!md) return ''
    return marked.parse(md)
  }

  /**
   * 获取历史项的完整内容（合并所有轮次）
   */
  function getFullContent(item) {
    if (!item) return ''
    if (!item.rounds?.length) return item.full || ''
    return item.rounds
      .map(r => r.aiResponse || '')
      .join('\n\n---\n\n')
  }

  /**
   * 获取历史项的摘要（最后一轮的前30字）
   */
  function getSummary(item) {
    if (!item) return ''
    if (!item.rounds?.length) return item.summary || ''
    const lastRound = item.rounds[item.rounds.length - 1]
    const text = lastRound?.aiResponse || ''
    return text.substring(0, 30).replace(/\n/g, ' ') + '...'
  }

  /**
   * 获取历史项的轮次数量
   */
  function getRoundsCount(item) {
    if (!item?.rounds?.length) return 1
    return item.rounds.length
  }

  /**
   * 创建新的历史项
   */
  function createHistoryItem(userScreenshot) {
    return {
      time: new Date().toLocaleTimeString('en-US'),
      rounds: [{
        userScreenshot: userScreenshot || '',
        thinking: '',           // 思维链
        thinkingDuration: 0,    // 思考时长(秒)
        aiResponse: ''          // AI 回复
      }]
    }
  }

  /**
   * 向历史项添加新轮次
   */
  function addRoundToItem(item, userScreenshot) {
    if (!item.rounds) {
      item.rounds = []
    }
    item.rounds.push({
      userScreenshot: userScreenshot || '',
      thinking: '',
      thinkingDuration: 0,
      aiResponse: ''
    })
  }

  /**
   * 获取当前轮次
   */
  function getCurrentRound(item) {
    if (!item?.rounds?.length) return null
    return item.rounds[item.rounds.length - 1]
  }

  // ==================== 核心逻辑 ====================

  // 计算属性：获取当前选中历史项的 rounds
  const currentRounds = computed(() => {
    const item = history.value[activeHistoryIndex.value]
    return item?.rounds || []
  })

  function selectHistory(idx) {
    const item = history.value[idx]
    if (item) {
      activeHistoryIndex.value = idx
      // Vue 响应式自动更新视图
    }
  }

  function handleStreamStart() {
    // 重置缓冲区
    streamBuffer = ''
    thinkingBuffer = ''
    thinkingStartTime = 0
    isThinking.value = false

    if (settings.keepContext && history.value.length > 0 && !shouldOverwriteHistory.value) {
      // 追加模式：向当前历史项添加新轮次
      const currentItem = history.value[0]
      addRoundToItem(currentItem, pendingUserScreenshot)
      activeHistoryIndex.value = 0
      pendingUserScreenshot = ''
    } else {
      // 新建模式
      if (shouldOverwriteHistory.value && history.value.length > 0) {
        // 覆盖现有第一条
        history.value[0] = createHistoryItem(pendingUserScreenshot)
        shouldOverwriteHistory.value = false
      } else {
        // 创建新历史项
        history.value.unshift(createHistoryItem(pendingUserScreenshot))
      }
      activeHistoryIndex.value = 0
      pendingUserScreenshot = ''
    }
  }

  function handleStreamChunk(token) {
    if (isLoading.value) isLoading.value = false
    if (isAppending.value) isAppending.value = false
    isThinking.value = false  // 收到正文时关闭思维链状态

    streamBuffer += token

    // 更新当前轮次的 aiResponse
    if (history.value.length > 0) {
      const round = getCurrentRound(history.value[0])
      if (round) {
        round.aiResponse = streamBuffer
      }
    }

    nextTick(() => {
      const contentDiv = document.getElementById('content')
      if (contentDiv) {
        contentDiv.scrollTop = contentDiv.scrollHeight
      }
    })
  }

  // 处理思维链 token
  function handleThinkingChunk(token) {
    if (isLoading.value) isLoading.value = false
    if (isAppending.value) isAppending.value = false

    // 记录思考开始时间
    if (!isThinking.value) {
      thinkingStartTime = Date.now()
    }
    isThinking.value = true

    thinkingBuffer += token

    // 更新当前轮次的 thinking
    if (history.value.length > 0) {
      const round = getCurrentRound(history.value[0])
      if (round) {
        round.thinking = thinkingBuffer
        // 实时更新思考时长
        if (thinkingStartTime > 0) {
          round.thinkingDuration = (Date.now() - thinkingStartTime) / 1000
        }
      }
    }

    nextTick(() => {
      const contentDiv = document.getElementById('content')
      if (contentDiv) {
        contentDiv.scrollTop = contentDiv.scrollHeight
      }
    })
  }

  function handleSolution(data) {
    isLoading.value = false

    // 记录最终思考时长
    if (isThinking.value && thinkingStartTime > 0 && history.value.length > 0) {
      const round = getCurrentRound(history.value[0])
      if (round) {
        round.thinkingDuration = (Date.now() - thinkingStartTime) / 1000
      }
    }
    isThinking.value = false
    thinkingStartTime = 0

    if (history.value.length > 0) {
      const round = getCurrentRound(history.value[0])
      if (round && !round.aiResponse) {
        round.aiResponse = data
      }
    }
  }

  function setStreamBuffer(val) {
    streamBuffer = val
  }

  function setUserScreenshot(screenshot) {
    pendingUserScreenshot = screenshot
  }

  /**
   * 删除指定索引的历史记录
   */
  function deleteHistory(index) {
    if (index < 0 || index >= history.value.length) return

    history.value.splice(index, 1)

    // 调整活动索引
    if (history.value.length === 0) {
      activeHistoryIndex.value = 0
    } else if (index <= activeHistoryIndex.value) {
      activeHistoryIndex.value = Math.max(0, activeHistoryIndex.value - 1)
    }
    // Vue 响应式自动更新视图
  }

  // ==================== 导出图片 ====================

  /**
   * 创建轮次卡片 DOM
   */
  function createRoundCard(round, roundIndex, totalRounds) {
    const card = document.createElement('div')
    card.style.cssText = `
      display: flex;
      gap: 24px;
      align-items: stretch;
      margin-bottom: ${roundIndex < totalRounds - 1 ? '24px' : '0'};
      padding-bottom: ${roundIndex < totalRounds - 1 ? '24px' : '0'};
      border-bottom: ${roundIndex < totalRounds - 1 ? '1px dashed #cbd5e1' : 'none'};
    `

    // 左侧：用户输入
    const leftPanel = document.createElement('div')
    leftPanel.style.cssText = `
      flex: 0 0 240px;
      background: white;
      border-radius: 12px;
      padding: 16px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
      border: 1px solid #e2e8f0;
    `

    // 用户头像和标签
    const userHeader = document.createElement('div')
    userHeader.style.cssText = `
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
      padding-bottom: 10px;
      border-bottom: 1px solid #f1f5f9;
    `
    userHeader.innerHTML = `
      <div style="
        width: 28px;
        height: 28px;
        border-radius: 50%;
        background: linear-gradient(135deg, #10b981, #059669);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 12px;
      ">👤</div>
      <div>
        <div style="font-weight: 600; font-size: 12px; color: #334155;">Question ${roundIndex + 1}</div>
      </div>
    `
    leftPanel.appendChild(userHeader)

    // 用户截图
    if (round.userScreenshot) {
      const imgContainer = document.createElement('div')
      imgContainer.innerHTML = `
        <img src="${round.userScreenshot}" style="
          width: 100%;
          border-radius: 6px;
          border: 1px solid #e2e8f0;
        " />
      `
      leftPanel.appendChild(imgContainer)
    } else {
      const placeholder = document.createElement('div')
      placeholder.style.cssText = `
        padding: 20px;
        text-align: center;
        color: #94a3b8;
        font-size: 12px;
        background: #f8fafc;
        border-radius: 6px;
      `
      placeholder.textContent = 'No screenshot'
      leftPanel.appendChild(placeholder)
    }

    card.appendChild(leftPanel)

    // 右侧：AI 回复
    const rightPanel = document.createElement('div')
    rightPanel.style.cssText = `
      flex: 1;
      background: white;
      border-radius: 12px;
      padding: 16px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
      border: 1px solid #e2e8f0;
      overflow: hidden;
    `

    // AI 头像和标签
    const aiHeader = document.createElement('div')
    aiHeader.style.cssText = `
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
      padding-bottom: 10px;
      border-bottom: 1px solid #f1f5f9;
    `
    aiHeader.innerHTML = `
      <div style="
        width: 28px;
        height: 28px;
        border-radius: 50%;
        background: linear-gradient(135deg, #3b82f6, #8b5cf6);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 12px;
      ">🤖</div>
      <div>
        <div style="font-weight: 600; font-size: 12px; color: #334155;">AI Response</div>
      </div>
    `
    rightPanel.appendChild(aiHeader)

    // AI 回复内容
    const aiContent = document.createElement('div')
    aiContent.style.cssText = `
      font-size: 13px;
      line-height: 1.6;
      color: #334155;
    `
    aiContent.innerHTML = renderMarkdown(round.aiResponse || '')
    rightPanel.appendChild(aiContent)

    card.appendChild(rightPanel)

    return card
  }

  /**
   * 导出为图片（支持多轮对话）
   */
  async function exportImage(index) {
    const item = history.value[index]
    if (!item) return

    const rounds = item.rounds || []
    if (rounds.length === 0) return

    try {
      const { default: html2canvas } = await import('html2canvas')

      // 创建临时容器
      const container = document.createElement('div')
      container.style.cssText = `
        position: fixed;
        left: -9999px;
        top: 0;
        width: 900px;
        padding: 28px;
        background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
        font-family: 'Nunito', 'Segoe UI', Arial, sans-serif;
        color: #1e293b;
        border-radius: 16px;
      `

      // 标题
      if (rounds.length > 1) {
        const title = document.createElement('div')
        title.style.cssText = `
          font-size: 14px;
          font-weight: 600;
          color: #64748b;
          margin-bottom: 20px;
          padding-bottom: 12px;
          border-bottom: 1px solid #cbd5e1;
        `
        title.textContent = `${rounds.length} conversation rounds`
        container.appendChild(title)
      }

      // 渲染每轮对话
      rounds.forEach((round, idx) => {
        const card = createRoundCard(round, idx, rounds.length)
        container.appendChild(card)
      })

      // 底部水印
      const footer = document.createElement('div')
      footer.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 20px;
        padding-top: 14px;
        border-top: 1px solid #cbd5e1;
        font-size: 11px;
        color: #64748b;
      `
      footer.innerHTML = `
        <div style="display: flex; align-items: center; gap: 6px;">
          <span style="font-weight: 600;">Q-Solver</span>
        </div>
        <div>${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
      `
      container.appendChild(footer)

      document.body.appendChild(container)

      const canvas = await html2canvas(container, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
        logging: false
      })

      document.body.removeChild(container)

      const base64Data = canvas.toDataURL('image/png')

      // 使用后端保存对话框
      const result = await SaveImageToFile(base64Data)
      if (!result) {
        console.log('Save canceled by user')
      }
    } catch (e) {
      console.error('Image export failed:', e)
      alert('Image export failed: ' + e.message)
    }
  }

  return {
    currentRounds,
    history,
    activeHistoryIndex,
    isLoading,
    isAppending,
    isThinking,
    shouldOverwriteHistory,
    errorState,
    // 辅助函数
    renderMarkdown,
    getFullContent,
    getSummary,
    getRoundsCount,
    // 核心函数
    selectHistory,
    handleStreamStart,
    handleStreamChunk,
    handleThinkingChunk,
    handleSolution,
    setStreamBuffer,
    setUserScreenshot,
    deleteHistory,
    exportImage
  }
}
