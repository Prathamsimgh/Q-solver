<template>
  <div class="top-bar-wrapper" style="--wails-draggable:drag">
    <div class="top-bar">
      <div class="control-group" :class="{ active: activeButtons.toggle }">
        <span class="key-hint">{{ shortcuts.toggle?.keyName || 'Alt+H' }}</span>
        <span class="label">Show/Hide</span>
      </div>
      <div class="control-group" :class="{ active: activeButtons.solve }">
        <span class="key-hint">{{ shortcuts.solve?.keyName || 'Alt+~' }}</span>
        <span class="label">Solve Now</span>
      </div>
      <div class="control-group" :class="{ active: activeButtons.clickthrough || isClickThrough }">
        <span class="key-hint">{{ shortcuts.clickthrough?.keyName || 'Alt+T' }}</span>
        <span class="label">Click Thru</span>
      </div>
      <div class="control-group" style="cursor: default;">
        <span class="key-hint">Alt+Move</span>
        <span class="label">Move/Scroll</span>
      </div>
      <div class="divider"></div>
      <div class="control-group" @click="$emit('openSettings')" style="cursor: pointer;"
        @mouseenter="showSettingsTooltip" @mouseleave="hideSettingsTooltip" ref="settingsBtnRef">
        <span class="label">⚙️ Settings</span>
      </div>
      <div class="divider"></div>
      <div class="status-group" ref="statusGroupRef" @mouseenter="showTooltip" @mouseleave="hideTooltip">
        <div class="status-indicator" :class="statusClass">
          <svg class="status-svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <!-- 已连接/就绪/解题完成: 信号满格 -->
            <template v-if="isConnectedStatus">
              <rect x="2" y="16" width="4" height="6" rx="1" fill="currentColor"/>
              <rect x="8" y="11" width="4" height="11" rx="1" fill="currentColor"/>
              <rect x="14" y="6" width="4" height="16" rx="1" fill="currentColor"/>
              <rect x="20" y="2" width="2" height="20" rx="1" fill="currentColor"/>
            </template>
            <!-- 未配置: 齿轮 -->
            <template v-else-if="isUnconfigured">
              <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
              <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </template>
            <!-- Key无效: 警告 -->
            <template v-else-if="isInvalidKey">
              <path d="M12 9v4M12 17h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
            </template>
            <!-- 连接失败/出错: X -->
            <template v-else>
              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
              <path d="M15 9l-6 6M9 9l6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </template>
          </svg>
        </div>
      </div>
      <div class="divider"></div>
      <div class="control-group" style="cursor: pointer;" @click="$emit('quit')">
        <span class="label">❌ Quit</span>
      </div>
    </div>
  </div>

  <Teleport to="body">
    <div class="status-tooltip" v-if="showStatusTooltip" :style="tooltipStyle">
      <div class="tooltip-row">
        <span class="tooltip-label">Status:</span>
        <span class="tooltip-value">{{ statusText }}</span>
      </div>
      <div class="tooltip-row">
        <span class="tooltip-label">API Status:</span>
        <span class="tooltip-value">
          {{ statusText === 'Connected' ? '✅ Connected' : (statusText === 'Invalid Key' ? '🚫 Invalid Key' : (statusText === 'Connection Failed' ? '❌ Failed'
            : 'Unconfigured')) }} </span>
      </div>
      <div class="tooltip-row">
        <span class="tooltip-label">Model:</span>
        <span class="tooltip-value">{{ settings.model }}</span>
      </div>
      <div class="tooltip-row">
        <span class="tooltip-label">Stealth:</span>
        <span class="tooltip-value" :style="{ color: isStealthMode ? '#52c41a' : '#ff4d4f' }">
          {{ isStealthMode ? 'On' : 'Off' }}
        </span>
      </div>
    </div>
    <div class="settings-tooltip" v-if="showSettingsTip" :style="settingsTooltipStyle">
      <div class="tooltip-warning">
        ⚠️ Note: Settings will grab focus<br>Do not use during screen recording
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'

const props = defineProps({
  shortcuts: Object,
  activeButtons: Object,
  isClickThrough: Boolean,
  statusIcon: String,
  statusText: String,

  settings: Object,
  isStealthMode: Boolean
})

defineEmits(['openSettings', 'quit'])

// 根据状态文本计算状态类名
const statusClass = computed(() => {
  const text = props.statusText || ''
  if (text === 'Connected' || text === 'Ready' || text === 'Done') return 'connected'
  if (text.includes('Unconfigured')) return 'unconfigured'
  if (text.includes('Invalid') || text.includes('Key')) return 'invalid-key'
  if (text.includes('Failed') || text.includes('Error')) return 'disconnected'
  if (text.includes('Thinking') || text.includes('Copied')) return 'connected'
  return 'unconfigured'
})

// 判断状态是否为已连接类
const isConnectedStatus = computed(() => {
  const text = props.statusText || ''
  return text === 'Connected' || text === 'Ready' || text === 'Done' || text.includes('Thinking') || text.includes('Copied')
})

// 判断是否未配置
const isUnconfigured = computed(() => {
  const text = props.statusText || ''
  return text.includes('Unconfigured')
})

// 判断是否Key无效
const isInvalidKey = computed(() => {
  const text = props.statusText || ''
  return text.includes('Invalid')
})

const showStatusTooltip = ref(false)
const statusGroupRef = ref(null)
const tooltipStyle = reactive({ top: '0px', left: '0px' })

const showSettingsTip = ref(false)
const settingsBtnRef = ref(null)
const settingsTooltipStyle = reactive({ top: '0px', left: '0px' })

function showTooltip() {
  if (statusGroupRef.value) {
    const rect = statusGroupRef.value.getBoundingClientRect()
    tooltipStyle.top = `${rect.bottom + 10}px`
    tooltipStyle.left = `${rect.left + rect.width / 2}px`
    showStatusTooltip.value = true
  }
}

function hideTooltip() {
  showStatusTooltip.value = false
}

function showSettingsTooltip() {
  if (settingsBtnRef.value) {
    const rect = settingsBtnRef.value.getBoundingClientRect()
    settingsTooltipStyle.top = `${rect.bottom + 10}px`
    settingsTooltipStyle.left = `${rect.left + rect.width / 2}px`
    showSettingsTip.value = true
  }
}

function hideSettingsTooltip() {
  showSettingsTip.value = false
}
</script>

<style scoped>
/* ========================================
   TopBar Styles
   ======================================== */

.top-bar-wrapper {
  pointer-events: auto;
}

.status-group {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0 var(--space-2);
}

.status-indicator {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
}

.status-indicator.connected {
  color: var(--color-success);
}

.status-indicator.unconfigured {
  color: var(--color-warning);
}

.status-indicator.invalid-key {
  color: var(--color-error);
}

.status-indicator.disconnected {
  color: var(--text-tertiary);
}

.status-svg {
  width: 18px;
  height: 18px;
}

/* ========================================
   Tooltips
   ======================================== */

.status-tooltip {
  position: fixed;
  transform: translateX(-50%);
  background: var(--bg-elevated);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  padding: var(--space-3) var(--space-4);
  min-width: 180px;
  z-index: 99999;
  box-shadow: var(--shadow-lg);
  backdrop-filter: blur(16px);
  pointer-events: none;
  animation: tooltipIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.settings-tooltip {
  position: fixed;
  transform: translateX(-50%);
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, var(--bg-elevated) 100%);
  border: 1px solid rgba(245, 158, 11, 0.4);
  border-radius: var(--radius-md);
  padding: var(--space-3) var(--space-4);
  z-index: 99999;
  box-shadow: var(--shadow-lg), 0 0 20px rgba(245, 158, 11, 0.1);
  backdrop-filter: blur(16px);
  pointer-events: none;
  animation: tooltipIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  text-align: center;
}

.settings-tooltip::before {
  content: '';
  position: absolute;
  top: -6px;
  left: 50%;
  transform: translateX(-50%);
  border-width: 0 6px 6px 6px;
  border-style: solid;
  border-color: transparent transparent rgba(245, 158, 11, 0.4) transparent;
}

.tooltip-warning {
  color: var(--color-warning);
  font-size: var(--text-sm);
  line-height: 1.6;
  font-weight: 600;
}

.status-tooltip::before {
  content: '';
  position: absolute;
  top: -6px;
  left: 50%;
  transform: translateX(-50%);
  border-width: 0 6px 6px 6px;
  border-style: solid;
  border-color: transparent transparent var(--bg-elevated) transparent;
}

.tooltip-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-2);
  font-size: var(--text-sm);
  white-space: nowrap;
}

.tooltip-row:last-child {
  margin-bottom: 0;
}

.tooltip-label {
  color: var(--text-muted);
  margin-right: var(--space-4);
}

.tooltip-value {
  color: var(--text-primary);
  font-weight: 600;
  font-family: var(--font-mono);
}

@keyframes tooltipIn {
  from {
    opacity: 0;
    transform: translate(-50%, -6px);
  }
  to {
    opacity: 1;
    transform: translate(-50%, 0);
  }
}
</style>
