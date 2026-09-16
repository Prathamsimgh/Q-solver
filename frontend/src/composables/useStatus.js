import { ref, watch } from 'vue'

export function useStatus(settings) {
  const statusText = ref('Ready')
  const statusIcon = ref('📝')

  function resetStatus() {
    if (!settings.apiKey) {
      statusText.value = 'Unconfigured'
      statusIcon.value = '⚠️'
      return
    }

    // Show connected state when an API key is configured.
    statusText.value = 'Connected'
    statusIcon.value = '✅'
  }
  
  function setConnected() {
    statusText.value = 'Connected'
    statusIcon.value = '✅'
  }
  
  function setDisconnected() {
    statusText.value = 'Connection Failed'
    statusIcon.value = '❌'
  }
  
  function setInvalidKey() {
    statusText.value = 'Invalid Key'
    statusIcon.value = '🚫'
  }

  // Keep the status in sync with the configured API key.
  watch(() => settings.apiKey, (newVal) => {
    resetStatus()
  }, { immediate: true })

  return {
    statusText,
    statusIcon,
    resetStatus,
    setConnected,
    setDisconnected,
    setInvalidKey
  }
}
