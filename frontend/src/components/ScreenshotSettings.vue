<template>
  <div class="screenshot-settings">
    <div class="preview-area">
      <div v-if="loading" class="loading">Loading...</div>
      <img v-else-if="previewImage" :src="previewImage" class="preview-img" @click="showLightbox = true" title="Click to enlarge" />
      <div v-else class="placeholder">Click Refresh to preview</div>
    </div>
    
    <div class="controls">
      <div class="form-group">
        <div class="label-row">
          <label>Screenshot Mode</label>
          <div class="help-icon" @mouseenter="showTooltip($event, 'Select area.\nWindow: Only active window.\nFullscreen: Entire screen.')" @mouseleave="hideTooltip">?</div>
        </div>
        
        <div class="mode-selector">
          <div 
            class="selector-item" 
            :class="{ active: screenshotMode === 'window' }"
            @click="setMode('window')"
          >
            <span class="icon">🔲</span>
            <span class="text">Window</span>
          </div>
          <div 
            class="selector-item" 
            :class="{ active: screenshotMode === 'fullscreen' }"
            @click="setMode('fullscreen')"
          >
            <span class="icon">🖥️</span>
            <span class="text">Fullscreen</span>
          </div>
        </div>
      </div>

      <div class="form-group checkbox-group">
        <div class="checkbox-wrapper">
          <label>
            <input type="checkbox" v-model="noCompression" @change="updatePreview" />
            No Compression (Original)
          </label>
          <div class="help-icon" @mouseenter="showTooltip($event, 'Uploads original screenshot.\nLargest size, best detail. Good for complex formulas or code.')" @mouseleave="hideTooltip">?</div>
        </div>
      </div>

      <div class="form-group" :class="{ disabled: noCompression }">
        <div class="label-row">
          <label>Quality ({{ quality }})</label>
          <div class="help-icon" @mouseenter="showTooltip($event, 'Balance clarity and size.\nOCR recommended 70-80. Too low affects text recognition.')" @mouseleave="hideTooltip">?</div>
        </div>
        <input type="range" v-model.number="quality" min="1" max="90" step="1" @change="updatePreview" :disabled="noCompression" />
      </div>

      <div class="form-group" :class="{ disabled: noCompression }">
        <div class="label-row">
          <label>Sharpen ({{ sharpen }})</label>
          <div class="help-icon" @mouseenter="showTooltip($event, 'Enhance edges.\nGood for blurry inputs, but too high creates noise.')" @mouseleave="hideTooltip">?</div>
        </div>
        <input type="range" v-model.number="sharpen" min="0" max="5" step="0.1" @change="updatePreview" :disabled="noCompression" />
      </div>

      <div class="form-group checkbox-group" :class="{ disabled: noCompression }">
        <div class="checkbox-wrapper">
          <label>
            <input type="checkbox" v-model="isGrayscale" @change="updatePreview" :disabled="noCompression" />
            Enable Grayscale
          </label>
          <div class="help-icon" @mouseenter="showTooltip($event, 'Remove color.\nReduces size significantly, usually does not affect OCR.')" @mouseleave="hideTooltip">?</div>
        </div>
        <span v-if="imageSize" class="size-badge">{{ imageSize }}</span>
      </div>
      
      <button class="btn-secondary" @click="updatePreview">Refresh Preview</button>
    </div>

    <Teleport to="body">
      <div v-if="showLightbox" class="lightbox-overlay" @click="showLightbox = false">
        <img :src="previewImage" class="lightbox-img" />
        <div class="lightbox-hint">Click anywhere to close</div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div v-if="tooltip.visible" class="custom-tooltip" :class="tooltip.class" :style="tooltip.style">
        {{ tooltip.text }}
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, reactive } from 'vue'
import { GetScreenshotPreview } from '../../wailsjs/go/main/App'

const props = defineProps(['modelValue'])
const emit = defineEmits(['update:modelValue'])

const quality = ref(80)
const sharpen = ref(0)
const previewImage = ref('')
const imageSize = ref('')
const loading = ref(false)
const isGrayscale = ref(true)
const noCompression = ref(false)
const showLightbox = ref(false)
const screenshotMode = ref('window')

// Tooltip state
const tooltip = reactive({
  visible: false,
  text: '',
  style: {},
  class: ''
})

function showTooltip(e, text) {
  const rect = e.target.getBoundingClientRect()
  // Determine side based on screen center
  const isRightSide = rect.left > window.innerWidth / 2
  
  tooltip.text = text
  tooltip.class = isRightSide ? 'left' : 'right'
  
  // Base vertical centering
  const top = rect.top + rect.height / 2
  
  tooltip.style = {
    top: `${top}px`,
    transform: 'translateY(-50%)'
  }
  
  if (isRightSide) {
    // Show on left of icon
    tooltip.style.right = `${window.innerWidth - rect.left + 12}px`
    tooltip.style.left = 'auto'
  } else {
    // Show on right of icon
    tooltip.style.left = `${rect.right + 12}px`
    tooltip.style.right = 'auto'
  }
  
  tooltip.visible = true
}

function hideTooltip() {
  tooltip.visible = false
}

function setMode(mode) {
    screenshotMode.value = mode
    updatePreview()
}

// Sync with parent settings
watch(() => props.modelValue, (val) => {
    if (val) {
        quality.value = val.compressionQuality || 80
        sharpen.value = val.sharpening || 0
        isGrayscale.value = val.grayscale !== undefined ? val.grayscale : true
        noCompression.value = val.noCompression || false
        screenshotMode.value = val.screenshotMode || 'window'
    }
}, { immediate: true, deep: true })

watch([quality, sharpen, isGrayscale, noCompression, screenshotMode], () => {
    emit('update:modelValue', {
        ...props.modelValue,
        compressionQuality: quality.value,
        sharpening: sharpen.value,
        grayscale: isGrayscale.value,
        noCompression: noCompression.value,
        screenshotMode: screenshotMode.value
    })
})

async function updatePreview() {
    loading.value = true
    try {
        const result = await GetScreenshotPreview(quality.value, sharpen.value, isGrayscale.value, noCompression.value, screenshotMode.value)
        // 带有格式的base图片 例如：data:image/png;base64
        previewImage.value = result.base64
        imageSize.value = result.size
    } catch (e) {
        console.error(e)
    } finally {
        loading.value = false
    }
}

onMounted(() => {
    updatePreview()
})
</script>

<style scoped>
.screenshot-settings {
    display: flex;
    flex-direction: column;
    gap: 15px;
}
.preview-area {
    height: 200px;
    background: #000;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    border: 1px solid rgba(255,255,255,0.1);
}
.preview-img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
    cursor: zoom-in;
}
.loading, .placeholder {
    color: #888;
    font-size: 12px;
}
.btn-secondary {
    background: rgba(255,255,255,0.1);
    border: 1px solid rgba(255,255,255,0.2);
    color: #fff;
    padding: 6px 12px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
    margin-top: 5px;
}
.btn-secondary:hover {
    background: rgba(255,255,255,0.2);
}

/* --- 新增布局样式 --- */
.label-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 5px;
}

/* --- Tooltip (问号图标) 样式 --- */
.help-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.15);
    color: #ccc;
    font-size: 11px;
    font-weight: bold;
    cursor: help;
    position: relative; /* 关键：作为 tooltip 定位的父级 */
    margin-left: 6px;
}

.help-icon:hover {
    background: rgba(255, 255, 255, 0.4);
    color: #fff;
}

/* --- Checkbox 样式微调 --- */
.checkbox-group {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

/* --- Mode Selector 样式 --- */
.mode-selector {
    display: flex;
    gap: 10px;
    margin-top: 8px;
}

.selector-item {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 8px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
    user-select: none;
}

.selector-item:hover {
    background: rgba(255, 255, 255, 0.1);
}

.selector-item.active {
    background: rgba(100, 108, 255, 0.2);
    border-color: #646cff;
    color: #fff;
}

.selector-item .icon {
    font-size: 16px;
}

.selector-item .text {
    font-size: 13px;
}

.checkbox-wrapper {
    display: flex;
    align-items: center;
}

.checkbox-wrapper label {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
}

.checkbox-group input[type="checkbox"] {
    margin: 0;
    width: 16px;
    height: 16px;
    cursor: pointer;
}

.size-badge {
    background: var(--color-primary-light);
    color: var(--color-primary);
    padding: 2px 8px;
    border-radius: var(--radius-full);
    font-size: 11px;
    border: 1px solid rgba(16, 185, 129, 0.3);
}

/* --- Lightbox 样式 --- */
.lightbox-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.85);
    z-index: 100000;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    cursor: zoom-out;
    animation: fadeIn 0.2s ease-out;
}

.lightbox-img {
    max-width: 90%;
    max-height: 90%;
    object-fit: contain;
    box-shadow: 0 0 20px rgba(0,0,0,0.5);
}

.lightbox-hint {
    color: rgba(255,255,255,0.7);
    margin-top: 15px;
    font-size: 14px;
}

@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

/* --- 新增禁用样式 --- */
.disabled {
    opacity: 0.5;
    pointer-events: none;
}
</style>

<!-- Global styles for tooltip (Teleported to body) -->
<style>
.custom-tooltip {
    position: fixed;
    z-index: 99999;
    background: rgba(30, 30, 30, 0.95);
    backdrop-filter: blur(10px);
    color: #eee;
    padding: 10px 14px;
    border-radius: 8px;
    font-size: 12px;
    line-height: 1.5;
    max-width: 220px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.5);
    border: 1px solid rgba(255,255,255,0.15);
    pointer-events: none;
    white-space: pre-wrap;
    text-align: justify;
    animation: tooltipFadeIn 0.2s ease-out;
}

@keyframes tooltipFadeIn {
    from { opacity: 0; transform: translateY(-50%) scale(0.95); }
    to { opacity: 1; transform: translateY(-50%) scale(1); }
}

/* Arrow */
.custom-tooltip::before {
    content: '';
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    border-style: solid;
}

/* Tooltip on the Right (Arrow on Left) */
.custom-tooltip.right::before {
    left: -6px;
    border-width: 6px 6px 6px 0;
    border-color: transparent rgba(30, 30, 30, 0.95) transparent transparent;
}

/* Tooltip on the Left (Arrow on Right) */
.custom-tooltip.left::before {
    right: -6px;
    border-width: 6px 0 6px 6px;
    border-color: transparent transparent transparent rgba(30, 30, 30, 0.95);
}
</style>