<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50 overflow-y-auto"
        @click.self="close"
      >
        <!-- Backdrop -->
        <div class="fixed inset-0 bg-black bg-opacity-50" @click="close"></div>

        <!-- Modal -->
        <div class="flex min-h-full items-center justify-center p-4">
          <div
            class="relative bg-white rounded-lg shadow-lg border border-gray-200 w-full max-w-2xl"
            @click.stop
          >
            <!-- Header -->
            <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 class="text-lg font-semibold text-gray-900">Keyboard Shortcuts</h2>
                <p class="text-sm text-gray-500 mt-1">Press <kbd class="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs font-mono">?</kbd> to toggle this help</p>
              </div>
              <button
                @click="close"
                class="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <!-- Content -->
            <div class="px-6 py-4 max-h-96 overflow-y-auto">
              <div
                v-for="group in shortcutGroups"
                :key="group.name"
                class="mb-6 last:mb-0"
              >
                <h3 class="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">
                  {{ group.name }}
                </h3>
                <div class="space-y-2">
                  <div
                    v-for="shortcut in group.shortcuts"
                    :key="shortcut.key"
                    class="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                  >
                    <span class="text-sm text-gray-600">{{ shortcut.description }}</span>
                    <kbd class="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs font-mono text-gray-700">
                      {{ formatKey(shortcut) }}
                    </kbd>
                  </div>
                </div>
              </div>

              <div v-if="shortcutGroups.length === 0" class="text-center py-8">
                <p class="text-sm text-gray-500">No keyboard shortcuts available</p>
              </div>
            </div>

            <!-- Footer -->
            <div class="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <p class="text-xs text-gray-500">
                <strong>Tip:</strong> Shortcuts are disabled when typing in input fields. 
                Sequence shortcuts (like <kbd class="px-1 py-0.5 bg-white border border-gray-300 rounded text-xs font-mono">G</kbd> then <kbd class="px-1 py-0.5 bg-white border border-gray-300 rounded text-xs font-mono">O</kbd>) must be pressed within 1 second.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ShortcutGroup } from '@/composables/useKeyboardShortcuts'

interface Props {
  isOpen: boolean
  shortcutGroups: ShortcutGroup[]
  formatKey: (shortcut: any) => string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

function close() {
  emit('close')
}
</script>

<style scoped>
kbd {
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace;
}
</style>
