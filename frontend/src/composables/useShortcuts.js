import { reactive, ref } from 'vue'
import { StartRecordingKey } from '../../wailsjs/go/main/App'

export function useShortcuts() {
  const shortcuts = reactive({})
  const tempShortcuts = reactive({})
  const recordingAction = ref(null)
  const recordingText = ref('')

  const shortcutActions = [
    { action: 'solve', label: 'Solve Now', default: 'Alt+~' },
    { action: 'toggle', label: 'Show / Hide', default: 'Alt+H' },
    { action: 'clickthrough', label: 'Click Through', default: 'Alt+T' },
    { action: 'move_up', label: 'Move Up', default: 'Alt+↑' },
    { action: 'move_down', label: 'Move Down', default: 'Alt+↓' },
    { action: 'move_left', label: 'Move Left', default: 'Alt+←' },
    { action: 'move_right', label: 'Move Right', default: 'Alt+→' },
    { action: 'scroll_up', label: 'Scroll Up', default: 'Alt+PgUp' },
    { action: 'scroll_down', label: 'Scroll Down', default: 'Alt+PgDn' },
  ]

  function recordKey(action) {
    recordingAction.value = action
    recordingText.value = 'Press a key...'
    StartRecordingKey(action)
  }

  return {
    shortcuts,
    tempShortcuts,
    recordingAction,
    recordingText,
    shortcutActions,
    recordKey
  }
}
