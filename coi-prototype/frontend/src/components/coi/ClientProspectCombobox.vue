<template>
  <div class="relative flex-1" ref="rootRef">
    <div
      class="flex w-full rounded-md border border-gray-300 bg-white shadow-sm focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-primary-500"
    >
      <input
        ref="inputRef"
        type="text"
        :value="displayText"
        @input="query = ($event.target as HTMLInputElement).value"
        @focus="open = true"
        @keydown.down.prevent="focusNext()"
        @keydown.up.prevent="focusPrev()"
        @keydown.enter.prevent="selectFocused()"
        @keydown.escape="open = false; inputRef?.blur()"
        :placeholder="placeholder"
        :disabled="disabled"
        :aria-required="ariaRequired"
        aria-autocomplete="list"
        :aria-expanded="open"
        aria-controls="client-prospect-listbox"
        role="combobox"
        class="flex-1 rounded-md border-0 py-2 pl-3 pr-3 text-sm text-gray-900 placeholder-gray-500 focus:ring-0 focus:outline-none disabled:bg-gray-50 disabled:text-gray-500"
      />
      <button
        type="button"
        @click="open = !open; open && inputRef?.focus()"
        class="flex items-center rounded-r-md border-l border-gray-300 px-2 text-gray-400 hover:text-gray-600"
        aria-label="Toggle list"
      >
        <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    </div>

    <ul
      ref="listRef"
      v-show="open && (filteredOptions.length > 0 || filteredProspects.length > 0 || showNewOption)"
      id="client-prospect-listbox"
      role="listbox"
      class="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-200 bg-white py-1 shadow-lg"
    >
      <template v-if="filteredOptions.length > 0">
        <li class="px-3 py-1.5 text-xs font-medium text-gray-500 uppercase tracking-wide">PRMS Clients</li>
        <li
          v-for="(opt, idx) in filteredOptions"
          :key="'c-' + opt.value"
          role="option"
          :aria-selected="focusedIndex === getClientOptionIndex(idx)"
          :class="[
            'cursor-pointer px-3 py-2 text-sm',
            focusedIndex === getClientOptionIndex(idx)
              ? 'bg-primary-600 text-white'
              : 'text-gray-900 hover:bg-gray-100'
          ]"
          @click="select('client', String(opt.id))"
          @mouseenter="focusedIndex = getClientOptionIndex(idx)"
        >
          {{ opt.label }}
        </li>
      </template>
      <template v-if="filteredProspects.length > 0">
        <li class="mt-1 border-t border-gray-100 px-3 py-1.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Prospects (CRM)</li>
        <li
          v-for="(opt, idx) in filteredProspects"
          :key="'p-' + opt.value"
          role="option"
          :aria-selected="focusedIndex === getProspectOptionIndex(idx)"
          :class="[
            'cursor-pointer px-3 py-2 text-sm',
            focusedIndex === getProspectOptionIndex(idx)
              ? 'bg-primary-600 text-white'
              : 'text-gray-900 hover:bg-gray-100'
          ]"
          @click="select('prospect', String(opt.id))"
          @mouseenter="focusedIndex = getProspectOptionIndex(idx)"
        >
          {{ opt.label }}
        </li>
      </template>
      <template v-if="showNewOption">
        <li class="mt-1 border-t border-gray-100 px-3 py-1.5 text-xs font-medium text-gray-500 uppercase tracking-wide">New</li>
        <li
          role="option"
          :aria-selected="focusedIndex === newOptionIndex"
          :class="[
            'cursor-pointer px-3 py-2 text-sm',
            focusedIndex === newOptionIndex ? 'bg-primary-600 text-white' : 'text-gray-900 hover:bg-gray-100'
          ]"
          @click="select('new', 'prospect')"
          @mouseenter="focusedIndex = newOptionIndex"
        >
          + Create New Prospect
        </li>
      </template>
    </ul>

    <p v-if="noResults && query.trim()" class="mt-1 text-xs text-gray-500">No matches. Try a different search.</p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue: string
    clients: { id: number; client_name?: string; name?: string; client_code?: string; code?: string }[]
    prospects: { id: number; prospect_name: string }[]
    placeholder?: string
    disabled?: boolean
    loading?: boolean
    error?: string
    ariaRequired?: boolean
  }>(),
  { placeholder: 'Search or select...', disabled: false, loading: false, error: '', ariaRequired: true }
)

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const rootRef = ref<HTMLElement | null>(null)
const inputRef = ref<HTMLInputElement | null>(null)
const listRef = ref<HTMLElement | null>(null)
const open = ref(false)
const query = ref('')
const focusedIndex = ref(0)

const clientOptions = computed(() =>
  props.clients.map((c) => ({
    id: c.id,
    value: `client:${c.id}`,
    label: `${c.client_name || c.name || ''} (${c.client_code || c.code || ''})`.trim() || `Client ${c.id}`
  }))
)

const prospectOptions = computed(() =>
  props.prospects.map((p) => ({
    id: p.id,
    value: `prospect:${p.id}`,
    label: `${p.prospect_name} [Prospect]`
  }))
)

const filterByQuery = (label: string) => {
  const q = query.value.trim().toLowerCase()
  if (!q) return true
  return label.toLowerCase().includes(q)
}

const filteredOptions = computed(() =>
  clientOptions.value.filter((o) => filterByQuery(o.label))
)

const filteredProspects = computed(() =>
  prospectOptions.value.filter((o) => filterByQuery(o.label))
)

const showNewOption = computed(() => true)

const totalOptionsCount = computed(
  () => filteredOptions.value.length + filteredProspects.value.length + (showNewOption.value ? 1 : 0)
)

const newOptionIndex = computed(
  () => filteredOptions.value.length + filteredProspects.value.length
)

function getClientOptionIndex(idx: number) {
  return idx
}

function getProspectOptionIndex(idx: number) {
  return filteredOptions.value.length + idx
}

const displayText = computed(() => {
  if (!props.modelValue) return ''
  const [type, id] = props.modelValue.split(':')
  if (type === 'client') {
    const c = props.clients.find((x) => x.id === parseInt(id, 10))
    return c ? `${c.client_name || c.name || ''} (${c.client_code || c.code || ''})`.trim() : props.modelValue
  }
  if (type === 'prospect') {
    const p = props.prospects.find((x) => x.id === parseInt(id, 10))
    return p ? `${p.prospect_name} [Prospect]` : props.modelValue
  }
  // 'new:prospect' etc. – parent typically resets; show nothing
  return ''
})

const noResults = computed(
  () =>
    open.value &&
    query.value.trim() &&
    filteredOptions.value.length === 0 &&
    filteredProspects.value.length === 0
)

function select(type: 'client' | 'prospect' | 'new', id: string) {
  if (type === 'new' && id === 'prospect') {
    emit('update:modelValue', 'new:prospect')
  } else {
    emit('update:modelValue', `${type}:${id}`)
  }
  open.value = false
  query.value = ''
  focusedIndex.value = 0
}

function focusNext() {
  focusedIndex.value = (focusedIndex.value + 1) % Math.max(1, totalOptionsCount.value)
}

function focusPrev() {
  focusedIndex.value =
    (focusedIndex.value - 1 + totalOptionsCount.value) % Math.max(1, totalOptionsCount.value)
}

function selectFocused() {
  if (totalOptionsCount.value === 0) return
  if (focusedIndex.value < filteredOptions.value.length) {
    const opt = filteredOptions.value[focusedIndex.value]
    select('client', String(opt.id))
    return
  }
  if (focusedIndex.value < filteredOptions.value.length + filteredProspects.value.length) {
    const opt = filteredProspects.value[focusedIndex.value - filteredOptions.value.length]
    select('prospect', String(opt.id))
    return
  }
  select('new', 'prospect')
}

function handleClickOutside(e: MouseEvent) {
  if (rootRef.value && !rootRef.value.contains(e.target as Node)) {
    open.value = false
  }
}

// Scroll focused option into view on keyboard navigation
watch(focusedIndex, () => {
  nextTick(() => {
    const focused = listRef.value?.querySelector('[aria-selected="true"]') as HTMLElement | null
    focused?.scrollIntoView({ block: 'nearest' })
  })
})

watch(open, (isOpen) => {
  if (isOpen) {
    focusedIndex.value = 0
    setTimeout(() => document.addEventListener('click', handleClickOutside))
  } else {
    document.removeEventListener('click', handleClickOutside)
  }
})

watch(
  () => props.modelValue,
  () => {
    query.value = ''
  }
)

onMounted(() => {
  if (open.value) document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>
