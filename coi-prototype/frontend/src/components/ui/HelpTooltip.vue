<template>
  <div class="relative inline-flex items-center">
    <button
      ref="triggerRef"
      @mouseenter="showTooltip = true"
      @mouseleave="showTooltip = false"
      @focus="showTooltip = true"
      @blur="showTooltip = false"
      @keydown.escape="showTooltip = false"
      type="button"
      class="inline-flex items-center justify-center w-5 h-5 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-full transition-colors"
      :aria-label="ariaLabel || `Help: ${content}`"
      :aria-expanded="showTooltip"
      aria-haspopup="true"
    >
      <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd"/>
      </svg>
    </button>
    
    <Teleport to="body">
      <Transition
        enter-active-class="transition ease-out duration-200"
        enter-from-class="opacity-0 translate-y-1"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition ease-in duration-150"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 translate-y-1"
      >
        <div 
          v-if="showTooltip"
          ref="tooltipRef"
          :style="tooltipStyle"
          class="fixed z-[9999] w-64 p-3 bg-gray-900 text-white text-sm rounded-lg shadow-xl"
          role="tooltip"
          :id="tooltipId"
        >
          <!-- Arrow -->
          <div 
            class="absolute w-2 h-2 bg-gray-900 transform rotate-45"
            :class="arrowClasses"
          ></div>
          
          <!-- Content -->
          <p class="relative z-10">{{ content }}</p>
          
          <!-- Example -->
          <div v-if="example" class="mt-2 pt-2 border-t border-gray-700 relative z-10">
            <p class="text-xs text-gray-400 font-medium">Example:</p>
            <p class="text-xs text-gray-300 mt-1">{{ example }}</p>
          </div>
          
          <!-- Link -->
          <a 
            v-if="learnMoreUrl"
            :href="learnMoreUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="mt-2 text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 relative z-10"
          >
            Learn more
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
            </svg>
          </a>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';

interface Props {
  content: string;
  example?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  ariaLabel?: string;
  learnMoreUrl?: string;
}

const props = withDefaults(defineProps<Props>(), {
  position: 'bottom',
});

const showTooltip = ref(false);
const triggerRef = ref<HTMLElement | null>(null);
const tooltipRef = ref<HTMLElement | null>(null);
const tooltipPosition = ref({ top: 0, left: 0 });

const tooltipId = computed(() => `tooltip-${Math.random().toString(36).substr(2, 9)}`);

const tooltipStyle = computed(() => ({
  top: `${tooltipPosition.value.top}px`,
  left: `${tooltipPosition.value.left}px`,
}));

const arrowClasses = computed(() => {
  switch (props.position) {
    case 'top':
      return 'bottom-[-4px] left-1/2 -translate-x-1/2';
    case 'left':
      return 'right-[-4px] top-1/2 -translate-y-1/2';
    case 'right':
      return 'left-[-4px] top-1/2 -translate-y-1/2';
    default:
      return 'top-[-4px] left-1/2 -translate-x-1/2';
  }
});

function calculatePosition() {
  if (!triggerRef.value || !tooltipRef.value) return;
  
  const triggerRect = triggerRef.value.getBoundingClientRect();
  const tooltipRect = tooltipRef.value.getBoundingClientRect();
  const padding = 8;
  
  let top = 0;
  let left = 0;
  
  switch (props.position) {
    case 'top':
      top = triggerRect.top - tooltipRect.height - padding;
      left = triggerRect.left + (triggerRect.width / 2) - (tooltipRect.width / 2);
      break;
    case 'left':
      top = triggerRect.top + (triggerRect.height / 2) - (tooltipRect.height / 2);
      left = triggerRect.left - tooltipRect.width - padding;
      break;
    case 'right':
      top = triggerRect.top + (triggerRect.height / 2) - (tooltipRect.height / 2);
      left = triggerRect.right + padding;
      break;
    default: // bottom
      top = triggerRect.bottom + padding;
      left = triggerRect.left + (triggerRect.width / 2) - (tooltipRect.width / 2);
  }
  
  // Keep tooltip within viewport
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  
  if (left < padding) left = padding;
  if (left + tooltipRect.width > viewportWidth - padding) {
    left = viewportWidth - tooltipRect.width - padding;
  }
  if (top < padding) top = padding;
  if (top + tooltipRect.height > viewportHeight - padding) {
    top = viewportHeight - tooltipRect.height - padding;
  }
  
  tooltipPosition.value = { top, left };
}

watch(showTooltip, async (newValue) => {
  if (newValue) {
    await nextTick();
    calculatePosition();
  }
});

// Recalculate on scroll/resize
let scrollHandler: () => void;
let resizeHandler: () => void;

onMounted(() => {
  scrollHandler = () => {
    if (showTooltip.value) {
      calculatePosition();
    }
  };
  resizeHandler = scrollHandler;
  
  window.addEventListener('scroll', scrollHandler, true);
  window.addEventListener('resize', resizeHandler);
});

onUnmounted(() => {
  window.removeEventListener('scroll', scrollHandler, true);
  window.removeEventListener('resize', resizeHandler);
});
</script>
