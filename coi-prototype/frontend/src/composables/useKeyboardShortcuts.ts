import { onMounted, onUnmounted, ref } from 'vue'

export interface Shortcut {
  key: string
  description: string
  handler: () => void
  modifier?: 'ctrl' | 'cmd' | 'shift' | 'alt'
  group?: string
}

export interface ShortcutGroup {
  name: string
  shortcuts: Shortcut[]
}

// Singleton state - shared across all instances
const shortcuts = new Map<string, Shortcut>()
let isListenerAttached = false
let sequenceBuffer: string[] = []
let sequenceTimeout: number | null = null
const showHelpModal = ref(false)

/**
 * Keyboard Shortcuts Composable
 * 
 * How it works:
 * 1. Register shortcuts with key combinations (e.g., 'k', 'ctrl+k', 'g o')
 * 2. Listen to keyboard events globally (singleton pattern)
 * 3. Match key combinations and execute handlers
 * 4. Support sequence shortcuts (e.g., 'g' then 'o' for "go overview")
 * 
 * Usage:
 * ```ts
 * const { registerShortcut, showHelp } = useKeyboardShortcuts()
 * 
 * registerShortcut({
 *   key: 'k',
 *   description: 'Open search',
 *   handler: () => openSearch(),
 *   modifier: 'ctrl'
 * })
 * ```
 */
export function useKeyboardShortcuts() {
  const isInputFocused = ref(false)

  // Check if user is typing in an input field
  function checkInputFocus() {
    const activeElement = document.activeElement
    const tagName = activeElement?.tagName.toLowerCase()
    const isInput = tagName === 'input' || tagName === 'textarea' || 
                    activeElement?.getAttribute('contenteditable') === 'true'
    isInputFocused.value = isInput
  }

  // Normalize key for cross-platform support
  function normalizeKey(event: KeyboardEvent): string {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
    const modifier = isMac ? 'cmd' : 'ctrl'
    
    if (event.metaKey || event.ctrlKey) {
      return `${modifier}+${event.key.toLowerCase()}`
    }
    if (event.shiftKey) {
      return `shift+${event.key.toLowerCase()}`
    }
    if (event.altKey) {
      return `alt+${event.key.toLowerCase()}`
    }
    return event.key.toLowerCase()
  }

  // Register a keyboard shortcut
  function registerShortcut(shortcut: Shortcut) {
    // Normalize modifier for platform (Mac uses 'cmd', others use 'ctrl')
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
    let normalizedModifier = shortcut.modifier
    
    // Convert 'ctrl' to platform-appropriate modifier
    if (shortcut.modifier === 'ctrl') {
      normalizedModifier = isMac ? 'cmd' : 'ctrl'
    }
    
    const key = normalizedModifier 
      ? `${normalizedModifier}+${shortcut.key}` 
      : shortcut.key
    
    shortcuts.set(key, shortcut)
    console.log('[Keyboard Shortcuts] Registered:', key, shortcut.description, {
      originalModifier: shortcut.modifier,
      normalizedModifier,
      isMac
    })
  }

  // Register multiple shortcuts
  function registerShortcuts(shortcutsList: Shortcut[]) {
    shortcutsList.forEach(registerShortcut)
  }

  // Handle sequence shortcuts (e.g., 'g' then 'o')
  function handleSequence(key: string) {
    // Clear previous timeout
    if (sequenceTimeout) {
      clearTimeout(sequenceTimeout)
    }

    sequenceBuffer.push(key)

    // Check for sequence matches
    const sequence = sequenceBuffer.join(' ')
    
    // Find matching shortcut
    for (const [shortcutKey, shortcut] of shortcuts.entries()) {
      if (shortcutKey === sequence) {
        // Exact match - execute
        shortcut.handler()
        sequenceBuffer = []
        sequenceTimeout = null
        return
      }
    }

    // Check if this could be start of a longer sequence
    const hasPotentialSequence = Array.from(shortcuts.keys()).some(
      k => k.startsWith(sequence + ' ')
    )

    if (!hasPotentialSequence) {
      // No potential sequence, reset
      sequenceBuffer = []
      sequenceTimeout = null
    } else {
      // Reset sequence after 1 second of inactivity
      sequenceTimeout = window.setTimeout(() => {
        sequenceBuffer = []
        sequenceTimeout = null
      }, 1000)
    }
  }

  // Main keyboard event handler (singleton)
  function handleKeydown(event: KeyboardEvent) {
    // Debug logging for troubleshooting
    console.log('[Keyboard] Key pressed:', event.key, {
      ctrlKey: event.ctrlKey,
      metaKey: event.metaKey,
      shiftKey: event.shiftKey,
      altKey: event.altKey,
      shortcutsCount: shortcuts.size,
      activeElement: document.activeElement?.tagName
    })

    // Check if user is typing in input
    const activeElement = document.activeElement
    const tagName = activeElement?.tagName.toLowerCase()
    const isInput = tagName === 'input' || tagName === 'textarea' || 
                    activeElement?.getAttribute('contenteditable') === 'true'
    
    // Don't intercept if user is typing in input (except modifier keys)
    if (isInput && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) {
      return
    }

    const normalizedKey = normalizeKey(event)
    console.log('[Keyboard] Normalized key:', normalizedKey, 'Available shortcuts:', Array.from(shortcuts.keys()))

    // Special case: Escape key always closes help modal
    if (normalizedKey === 'escape') {
      if (showHelpModal.value) {
        showHelpModal.value = false
        event.preventDefault()
        return
      }
    }

    // Check for modifier shortcuts first
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      const shortcut = shortcuts.get(normalizedKey)
      console.log('[Keyboard] Checking modifier shortcut:', normalizedKey, 'Found:', !!shortcut)
      if (shortcut) {
        if (import.meta.env.DEV) console.log('[Keyboard] Matched modifier shortcut:', normalizedKey, shortcut.description)
        event.preventDefault()
        event.stopPropagation()
        try {
          shortcut.handler()
        } catch (error) {
          console.error('[Keyboard] Error executing handler:', error)
        }
        return
      }
    }

    // Check for single key shortcuts (only if not in input)
    if (!isInput) {
      const shortcut = shortcuts.get(normalizedKey)
      if (shortcut && !shortcut.modifier) {
        // Check if this is part of a sequence
        const hasSequence = Array.from(shortcuts.keys()).some(
          k => k.startsWith(normalizedKey + ' ')
        )
        
        if (hasSequence) {
          // This might be a sequence
          // console.log('[Keyboard] Starting sequence:', normalizedKey)
          handleSequence(normalizedKey)
          event.preventDefault()
          event.stopPropagation()
          return
        } else {
          // Single key shortcut
          // console.log('[Keyboard] Matched single key shortcut:', normalizedKey)
          event.preventDefault()
          event.stopPropagation()
          shortcut.handler()
          return
        }
      }
    }
  }

  // Get all shortcuts grouped by category
  function getShortcutGroups(): ShortcutGroup[] {
    const groups = new Map<string, Shortcut[]>()
    
    shortcuts.forEach((shortcut) => {
      const groupName = shortcut.group || 'General'
      if (!groups.has(groupName)) {
        groups.set(groupName, [])
      }
      groups.get(groupName)!.push(shortcut)
    })

    return Array.from(groups.entries()).map(([name, shortcuts]) => ({
      name,
      shortcuts
    }))
  }

  // Format shortcut key for display
  function formatShortcutKey(shortcut: Shortcut): string {
    const parts: string[] = []
    
    if (shortcut.modifier) {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
      if (shortcut.modifier === 'cmd' || (shortcut.modifier === 'ctrl' && isMac)) {
        parts.push('⌘')
      } else if (shortcut.modifier === 'ctrl') {
        parts.push('Ctrl')
      } else if (shortcut.modifier === 'shift') {
        parts.push('Shift')
      } else if (shortcut.modifier === 'alt') {
        parts.push('Alt')
      }
    }
    
    if (shortcut.key.includes(' ')) {
      // Sequence shortcut
      const keys = shortcut.key.split(' ')
      parts.push(...keys.map(k => k.toUpperCase()))
      return parts.join(' then ')
    }
    
    parts.push(shortcut.key.toUpperCase())
    return parts.join(' + ')
  }

  // Toggle help modal
  function toggleHelp() {
    showHelpModal.value = !showHelpModal.value
  }

  // Attach event listener (singleton - only once)
  // Use onMounted to ensure DOM is ready
  onMounted(() => {
    if (!isListenerAttached) {
      document.addEventListener('keydown', handleKeydown, true) // Use capture phase
      isListenerAttached = true
      console.log('[Keyboard Shortcuts] Event listener attached', {
        platform: navigator.platform,
        isMac: navigator.platform.toUpperCase().indexOf('MAC') >= 0,
        shortcutsRegistered: shortcuts.size
      })
    } else {
      console.log('[Keyboard Shortcuts] Listener already attached, skipping')
    }
  })

  return {
    registerShortcut,
    registerShortcuts,
    showHelpModal,
    toggleHelp,
    getShortcutGroups,
    formatShortcutKey
  }
}
