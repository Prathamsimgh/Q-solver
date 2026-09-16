<template>
  <div v-if="show" class="modal" id="settings-modal" style="display: flex">
    <div class="modal-content">
      <div class="modal-warning-banner"
        style="background: rgba(255, 169, 64, 0.15); border: 1px solid rgba(255, 169, 64, 0.3); border-radius: 50px; padding: 6px 20px; color: #ffc069; font-size: 12px; display: flex; align-items: center; justify-content: center; margin: 12px auto 4px auto; width: fit-content;">
        ⚠️ The current window has focus. Anti-focus snatching mode will automatically restore after closing settings.
      </div>
      <div class="modal-header">
        <div class="tabs">
          <div class="tab" :class="{ active: activeTab === 'general' }" @click="activeTab = 'general'">
            General</div>
          <div class="tab" :class="{ active: activeTab === 'model' }" @click="activeTab = 'model'">Model
          </div>
          <div class="tab" :class="{ active: activeTab === 'params' }" @click="activeTab = 'params'">Params</div>
          <div class="tab" :class="{ active: activeTab === 'screenshot' }" @click="activeTab = 'screenshot'">Screenshot</div>
          <div class="tab" :class="{ active: activeTab === 'resume' }" @click="activeTab = 'resume'">
            Resume</div>
          <div class="tab" :class="{ active: activeTab === 'account' }" @click="activeTab = 'account'">
            Provider</div>
        </div>
        <span class="close-btn" @click="$emit('close')">&times;</span>
      </div>
      <div class="modal-body">
        <div v-show="activeTab === 'account'">
          <ProviderSelect v-model:provider="tempSettings.provider" v-model:apiKey="tempSettings.apiKey"
            v-model:baseURL="tempSettings.baseURL" />
        </div>

        <div v-show="activeTab === 'model'">
          <div class="form-group">
            <div class="model-header">
              <label>Select Model</label>
              <div class="model-actions">
                <button class="btn-icon" @click="$emit('refresh-models')"
                  :disabled="isLoadingModels || !tempSettings.apiKey" title="Refresh Models">
                  <span :class="{ spin: isLoadingModels }">🔄</span>
                </button>
                <button class="btn-icon" @click="$emit('test-connection')"
                  :disabled="isTestingConnection || !tempSettings.model" title="Test Connection">
                  <span :class="{ spin: isTestingConnection }">{{ isTestingConnection ? '⏳' : '▶️'
                  }}</span>
                </button>
              </div>
            </div>
            <ModelSelect v-model="tempSettings.model" :models="availableModels" :loading="isLoadingModels" />

            <!-- 连通性测试结果 -->
            <div v-if="connectionStatus" class="connection-status" :class="connectionStatus.type">
              <span class="status-icon">{{ connectionStatus.icon }}</span>
              <span class="status-text">{{ connectionStatus.message }}</span>
            </div>

            <p v-if="!tempSettings.apiKey" class="hint-text warning-hint">
              ⚠️ Please enter API Key first
            </p>
          </div>

          <div class="form-group">
            <div class="prompt-header">
              <label for="prompt-text" style="margin-bottom: 0">System Prompt</label>
              <div class="prompt-tabs">
                <div class="prompt-tab" :class="{ active: promptTab === 'edit' }" @click="promptTab = 'edit'">Edit
                </div>
                <div class="prompt-tab" :class="{ active: promptTab === 'preview' }" @click="promptTab = 'preview'">Preview
                </div>
              </div>
            </div>

            <textarea v-show="promptTab === 'edit'" id="prompt-text" class="prompt-textarea" rows="10"
              v-model="tempSettings.prompt" placeholder="Enter system prompt (Markdown supported)..."></textarea>

            <div v-show="promptTab === 'preview'" class="prompt-preview markdown-body" v-html="renderedPrompt">
            </div>
          </div>
        </div>

        <div v-show="activeTab === 'params'">
          <LLMParamsConfig v-model:temperature="tempSettings.temperature" v-model:topP="tempSettings.topP"
            v-model:topK="tempSettings.topK" v-model:maxTokens="tempSettings.maxTokens"
            v-model:thinkingBudget="tempSettings.thinkingBudget" />
        </div>

        <div v-show="activeTab === 'general'">
          <div class="form-group">
            <div class="context-setting">
              <div class="setting-row">
                <div class="setting-info">
                  <span class="setting-title">Keep Context</span>
                  <span class="setting-desc">Include previous history in each new conversation</span>
                </div>
                <label class="switch">
                  <input type="checkbox" v-model="tempSettings.keepContext">
                  <span class="slider round"></span>
                </label>
              </div>

              <div class="setting-row" style="margin-top: 12px;">
                <div class="setting-info">
                  <span class="setting-title">Enable Live API Mode</span>
                  <span class="setting-desc">Capture audio to answer questions in real-time</span>
                </div>
                <label class="switch">
                  <input type="checkbox" v-model="tempSettings.useLiveApi">
                  <span class="slider round"></span>
                </label>
              </div>
            </div>
          </div>

          <div class="form-group">
            <label>Shortcut Configuration (Click to Record)</label>
            <div class="shortcut-list">
              <div class="shortcut-item" v-for="key in shortcutActions" :key="key.action">
                <span>{{ key.label }}</span>
                <button class="btn-record" :class="{ recording: recordingAction === key.action }"
                  @click="$emit('record-key', key.action)">
                  {{ recordingAction === key.action ? recordingText : (tempShortcuts[key.action]?.keyName ||
                    key.default) }}
                </button>
              </div>
            </div>
          </div>

          <div class="form-group">
            <label for="opacity-slider">Window Opacity: <span>{{ Math.round(tempSettings.transparency * 100) }}%</span></label>
            <input type="range" id="opacity-slider" min="0.0" max="1.0" step="0.05"
              v-model.number="tempSettings.transparency" />
          </div>
        </div>

        <div v-show="activeTab === 'screenshot'">
          <ScreenshotSettings :modelValue="tempSettings" @update:modelValue="Object.assign(tempSettings, $event)" />
        </div>

        <div v-show="activeTab === 'resume'" style="height: 100%">
          <ResumeImport :resumePath="tempSettings.resumePath" :rawContent="resumeRawContent"
            :isParsing="isResumeParsing" :currentModel="tempSettings.model"
            v-model:useMarkdownResume="tempSettings.useMarkdownResume"
            @update:rawContent="$emit('update:resumeRawContent', $event)" @select-resume="$emit('select-resume')"
            @clear-resume="$emit('clear-resume')" @parse-resume="$emit('parse-resume')" />
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn-primary" @click="$emit('save')">Save</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import ResumeImport from './ResumeImport.vue'
import ScreenshotSettings from './ScreenshotSettings.vue'
import ProviderSelect from './ProviderSelect.vue'
import ModelSelect from './ModelSelect.vue'
import LLMParamsConfig from './LLMParamsConfig.vue'

const props = defineProps({
  show: Boolean,
  tempSettings: Object,
  tempShortcuts: Object,
  shortcutActions: Array,
  recordingAction: String,
  recordingText: String,
  availableModels: Array,
  isLoadingModels: Boolean,
  isTestingConnection: Boolean,
  connectionStatus: Object,
  renderedPrompt: String,
  resumeRawContent: String,
  isResumeParsing: Boolean,
})

defineEmits([
  'close',
  'save',
  'refresh-models',
  'test-connection',
  'record-key',
  'select-resume',
  'clear-resume',
  'parse-resume',
  'update:resumeRawContent',
])

const activeTab = ref('general')
const promptTab = ref('edit')
</script>
