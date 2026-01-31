# COI System UI/UX Improvement Plan

**Date:** January 19, 2026  
**Version:** 2.0  
**Status:** Comprehensive Assessment & Implementation Guide

---

## Executive Summary

This document provides a detailed UI/UX improvement plan for the COI System, covering:
1. **Reports Module** - Enhanced data visualization and export capabilities
2. **Forms Functionality** - Improved form UX with validation and guidance
3. **Dashboard Improvements** - Better information architecture
4. **Accessibility Compliance** - WCAG 2.1 AA compliance
5. **Mobile Responsiveness** - Full mobile support

---

## Part 1: Reports Module Improvements

### Current State Analysis
The Reports module (`Reports.vue`) has a solid foundation with:
- ✅ Report catalog with role-based filtering
- ✅ Date range filters
- ✅ Export to PDF/Excel
- ✅ Print preview functionality
- ✅ Summary cards with nested data display

### Recommended Improvements

#### 1.1 Data Visualization Enhancements

**Add Interactive Charts**
```vue
<!-- Add to Reports.vue after summary section -->
<div v-if="reportData?.summary" class="mt-8">
  <h3 class="text-lg font-semibold mb-4">Visual Analytics</h3>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
    <!-- Status Distribution Pie Chart -->
    <div class="bg-white rounded-xl border p-6">
      <h4 class="text-sm font-medium text-gray-700 mb-4">Status Distribution</h4>
      <Pie :data="statusChartData" :options="chartOptions" />
    </div>
    
    <!-- Trend Line Chart -->
    <div class="bg-white rounded-xl border p-6">
      <h4 class="text-sm font-medium text-gray-700 mb-4">Request Trends</h4>
      <Line :data="trendChartData" :options="chartOptions" />
    </div>
  </div>
</div>
```

**Implementation Priority:** HIGH  
**Effort:** 4-6 hours

#### 1.2 Advanced Filtering

**Add Multi-Select Filters**
```vue
<template>
  <!-- Replace single select with multi-select -->
  <div class="filter-group">
    <label class="block text-xs font-semibold text-gray-700 mb-2">
      Status (Multiple)
    </label>
    <div class="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-3">
      <label 
        v-for="status in statusOptions" 
        :key="status"
        class="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded"
      >
        <input 
          type="checkbox" 
          :value="status"
          v-model="filters.statuses"
          class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <span class="text-sm text-gray-700">{{ status }}</span>
      </label>
    </div>
  </div>
</template>
```

**Implementation Priority:** MEDIUM  
**Effort:** 2-3 hours

#### 1.3 Saved Report Templates

**Add Report Presets**
```typescript
// Add to reportService.ts
interface ReportPreset {
  id: string;
  name: string;
  reportType: string;
  filters: ReportFilters;
  createdAt: Date;
  isDefault: boolean;
}

export async function saveReportPreset(preset: ReportPreset): Promise<void> {
  const presets = JSON.parse(localStorage.getItem('reportPresets') || '[]');
  presets.push(preset);
  localStorage.setItem('reportPresets', JSON.stringify(presets));
}

export function getReportPresets(): ReportPreset[] {
  return JSON.parse(localStorage.getItem('reportPresets') || '[]');
}
```

**UI Component:**
```vue
<div class="mb-4">
  <label class="block text-xs font-semibold text-gray-700 mb-2">
    Saved Presets
  </label>
  <div class="flex gap-2">
    <select 
      v-model="selectedPreset"
      @change="loadPreset"
      class="flex-1 px-3 py-2 border rounded-lg text-sm"
    >
      <option value="">Select a preset...</option>
      <option v-for="preset in presets" :key="preset.id" :value="preset.id">
        {{ preset.name }}
      </option>
    </select>
    <button 
      @click="showSavePresetModal = true"
      class="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg"
      title="Save current filters as preset"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
              d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/>
      </svg>
    </button>
  </div>
</div>
```

**Implementation Priority:** LOW  
**Effort:** 3-4 hours

#### 1.4 Report Scheduling (Future Enhancement)

```typescript
// Backend: Add scheduled report endpoint
// POST /api/reports/schedule
interface ScheduledReport {
  reportType: string;
  filters: ReportFilters;
  schedule: 'daily' | 'weekly' | 'monthly';
  recipients: string[];
  format: 'pdf' | 'excel';
}
```

**Implementation Priority:** LOW (Phase 2)  
**Effort:** 8-10 hours

---

## Part 2: Forms Functionality Improvements

### Current State Analysis
The COI Request Form (`COIRequestForm.vue`) has:
- ✅ Multi-section wizard layout
- ✅ Progress indicator
- ✅ Auto-save functionality
- ✅ Section navigation
- ⚠️ Basic validation (needs enhancement)
- ⚠️ No inline validation feedback

### Recommended Improvements

#### 2.1 Real-Time Field Validation

**Create Validation Composable**
```typescript
// composables/useFormValidation.ts
import { ref, computed, watch } from 'vue';

interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean | string;
}

interface FieldValidation {
  value: any;
  rules: ValidationRule;
  touched: boolean;
  error: string | null;
}

export function useFormValidation() {
  const fields = ref<Record<string, FieldValidation>>({});
  
  function registerField(name: string, rules: ValidationRule) {
    fields.value[name] = {
      value: null,
      rules,
      touched: false,
      error: null
    };
  }
  
  function validateField(name: string, value: any): string | null {
    const field = fields.value[name];
    if (!field) return null;
    
    const { rules } = field;
    
    if (rules.required && !value) {
      return 'This field is required';
    }
    
    if (rules.minLength && value?.length < rules.minLength) {
      return `Minimum ${rules.minLength} characters required`;
    }
    
    if (rules.maxLength && value?.length > rules.maxLength) {
      return `Maximum ${rules.maxLength} characters allowed`;
    }
    
    if (rules.pattern && !rules.pattern.test(value)) {
      return 'Invalid format';
    }
    
    if (rules.custom) {
      const result = rules.custom(value);
      if (typeof result === 'string') return result;
      if (!result) return 'Invalid value';
    }
    
    return null;
  }
  
  function touchField(name: string) {
    if (fields.value[name]) {
      fields.value[name].touched = true;
    }
  }
  
  const isFormValid = computed(() => {
    return Object.values(fields.value).every(f => !f.error);
  });
  
  return {
    fields,
    registerField,
    validateField,
    touchField,
    isFormValid
  };
}
```

**Validated Input Component**
```vue
<!-- components/ui/ValidatedInput.vue -->
<template>
  <div class="form-field">
    <label 
      :for="id" 
      class="block text-sm font-medium text-gray-700 mb-1.5"
    >
      {{ label }}
      <span v-if="required" class="text-red-500 ml-0.5">*</span>
    </label>
    
    <div class="relative">
      <input
        :id="id"
        :type="type"
        :value="modelValue"
        @input="$emit('update:modelValue', $event.target.value)"
        @blur="handleBlur"
        :placeholder="placeholder"
        :disabled="disabled"
        :aria-invalid="!!error"
        :aria-describedby="error ? `${id}-error` : undefined"
        class="w-full px-3 py-2 border rounded-lg text-sm transition-colors"
        :class="{
          'border-red-500 focus:ring-red-500 focus:border-red-500': error && touched,
          'border-green-500 focus:ring-green-500 focus:border-green-500': !error && touched && modelValue,
          'border-gray-300 focus:ring-blue-500 focus:border-blue-500': !touched || (!error && !modelValue)
        }"
      />
      
      <!-- Validation Icon -->
      <div class="absolute right-3 top-1/2 -translate-y-1/2">
        <svg v-if="error && touched" class="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
        </svg>
        <svg v-else-if="!error && touched && modelValue" class="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
        </svg>
      </div>
    </div>
    
    <!-- Error Message -->
    <p 
      v-if="error && touched" 
      :id="`${id}-error`"
      class="mt-1.5 text-sm text-red-600 flex items-center gap-1"
      role="alert"
    >
      <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
      </svg>
      {{ error }}
    </p>
    
    <!-- Help Text -->
    <p v-else-if="helpText" class="mt-1.5 text-sm text-gray-500">
      {{ helpText }}
    </p>
    
    <!-- Character Counter -->
    <p v-if="maxLength" class="mt-1 text-xs text-gray-400 text-right">
      {{ modelValue?.length || 0 }}/{{ maxLength }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{
  id: string;
  label: string;
  modelValue: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string | null;
  helpText?: string;
  maxLength?: number;
}>();

const emit = defineEmits(['update:modelValue', 'blur']);

const touched = ref(false);

function handleBlur() {
  touched.value = true;
  emit('blur');
}
</script>
```

**Implementation Priority:** HIGH  
**Effort:** 4-5 hours

#### 2.2 Form Section Progress Enhancement

**Enhanced Progress Component**
```vue
<!-- components/form/FormProgress.vue -->
<template>
  <div class="form-progress">
    <!-- Progress Bar -->
    <div class="mb-4">
      <div class="flex items-center justify-between mb-2">
        <span class="text-sm font-medium text-gray-700">
          Form Progress
        </span>
        <span class="text-sm text-gray-500">
          {{ completedSections }}/{{ totalSections }} sections
        </span>
      </div>
      <div class="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div 
          class="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500"
          :style="{ width: `${progressPercentage}%` }"
        ></div>
      </div>
    </div>
    
    <!-- Section Steps -->
    <div class="space-y-1">
      <button
        v-for="(section, index) in sections"
        :key="section.id"
        @click="$emit('navigate', section.id)"
        class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left"
        :class="{
          'bg-blue-50 border-l-4 border-blue-600': activeSection === section.id,
          'hover:bg-gray-50': activeSection !== section.id
        }"
      >
        <!-- Step Number/Check -->
        <div 
          class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 transition-colors"
          :class="{
            'bg-green-500 text-white': section.isComplete,
            'bg-blue-600 text-white': activeSection === section.id && !section.isComplete,
            'bg-gray-200 text-gray-600': activeSection !== section.id && !section.isComplete
          }"
        >
          <svg v-if="section.isComplete" class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
          </svg>
          <span v-else>{{ index + 1 }}</span>
        </div>
        
        <!-- Section Info -->
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-gray-900 truncate">
            {{ section.label }}
          </p>
          <p class="text-xs text-gray-500">
            {{ section.isComplete ? 'Completed' : `${section.completedFields}/${section.totalFields} fields` }}
          </p>
        </div>
        
        <!-- Status Badge -->
        <span 
          v-if="section.hasErrors"
          class="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded-full"
        >
          Errors
        </span>
      </button>
    </div>
  </div>
</template>
```

**Implementation Priority:** MEDIUM  
**Effort:** 2-3 hours

#### 2.3 Smart Form Assistance

**Add Contextual Help Tooltips**
```vue
<!-- components/ui/HelpTooltip.vue -->
<template>
  <div class="relative inline-block">
    <button
      @mouseenter="showTooltip = true"
      @mouseleave="showTooltip = false"
      @focus="showTooltip = true"
      @blur="showTooltip = false"
      type="button"
      class="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full"
      :aria-label="ariaLabel"
    >
      <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd"/>
      </svg>
    </button>
    
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
        class="absolute z-50 w-64 p-3 bg-gray-900 text-white text-sm rounded-lg shadow-lg"
        :class="positionClasses"
        role="tooltip"
      >
        <p>{{ content }}</p>
        <div v-if="example" class="mt-2 pt-2 border-t border-gray-700">
          <p class="text-xs text-gray-400">Example:</p>
          <p class="text-xs text-gray-300 mt-1">{{ example }}</p>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

const props = defineProps<{
  content: string;
  example?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  ariaLabel?: string;
}>();

const showTooltip = ref(false);

const positionClasses = computed(() => {
  switch (props.position) {
    case 'top': return 'bottom-full left-1/2 -translate-x-1/2 mb-2';
    case 'left': return 'right-full top-1/2 -translate-y-1/2 mr-2';
    case 'right': return 'left-full top-1/2 -translate-y-1/2 ml-2';
    default: return 'top-full left-1/2 -translate-x-1/2 mt-2';
  }
});
</script>
```

**Implementation Priority:** MEDIUM  
**Effort:** 2 hours

#### 2.4 Auto-Save Enhancement

**Visual Auto-Save Indicator**
```vue
<!-- Add to COIRequestForm.vue -->
<template>
  <div class="auto-save-indicator flex items-center gap-2 text-sm">
    <Transition mode="out-in">
      <div v-if="saveStatus === 'saving'" class="flex items-center gap-2 text-yellow-600">
        <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
        <span>Saving...</span>
      </div>
      
      <div v-else-if="saveStatus === 'saved'" class="flex items-center gap-2 text-green-600">
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
        </svg>
        <span>Saved {{ lastSavedTime }}</span>
      </div>
      
      <div v-else-if="saveStatus === 'error'" class="flex items-center gap-2 text-red-600">
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
        </svg>
        <span>Save failed</span>
        <button @click="retrySave" class="underline">Retry</button>
      </div>
      
      <div v-else class="flex items-center gap-2 text-gray-500">
        <div class="w-2 h-2 bg-gray-400 rounded-full"></div>
        <span>Unsaved changes</span>
      </div>
    </Transition>
  </div>
</template>
```

**Implementation Priority:** MEDIUM  
**Effort:** 2 hours

---

## Part 3: Dashboard Improvements

### 3.1 Enhanced Stats Cards

**Animated Stats Component**
```vue
<!-- components/dashboard/AnimatedStatCard.vue -->
<template>
  <div 
    @click="$emit('click')"
    class="bg-white rounded-xl shadow-sm border border-gray-200 p-5 cursor-pointer 
           hover:shadow-lg hover:border-blue-300 transition-all duration-300 
           transform hover:-translate-y-1"
  >
    <div class="flex items-center justify-between">
      <div>
        <p class="text-sm font-medium text-gray-500">{{ label }}</p>
        <p class="text-3xl font-bold text-gray-900 mt-2">
          <span ref="countRef">{{ displayValue }}</span>
        </p>
        <p v-if="trend" class="text-xs mt-2 flex items-center gap-1">
          <span :class="trend > 0 ? 'text-green-600' : 'text-red-600'">
            {{ trend > 0 ? '↑' : '↓' }} {{ Math.abs(trend) }}%
          </span>
          <span class="text-gray-400">vs last month</span>
        </p>
      </div>
      <div 
        class="w-12 h-12 rounded-xl flex items-center justify-center"
        :class="iconBgClass"
      >
        <slot name="icon">
          <svg class="w-6 h-6" :class="iconClass" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="iconPath"/>
          </svg>
        </slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';

const props = defineProps<{
  label: string;
  value: number;
  trend?: number;
  iconPath?: string;
  iconBgClass?: string;
  iconClass?: string;
}>();

const displayValue = ref(0);

function animateCount(target: number) {
  const duration = 1000;
  const start = displayValue.value;
  const startTime = performance.now();
  
  function update(currentTime: number) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Easing function
    const easeOutQuart = 1 - Math.pow(1 - progress, 4);
    displayValue.value = Math.round(start + (target - start) * easeOutQuart);
    
    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }
  
  requestAnimationFrame(update);
}

onMounted(() => {
  animateCount(props.value);
});

watch(() => props.value, (newVal) => {
  animateCount(newVal);
});
</script>
```

**Implementation Priority:** LOW  
**Effort:** 2 hours

### 3.2 Quick Actions Panel

```vue
<!-- components/dashboard/QuickActions.vue -->
<template>
  <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
    <h3 class="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
    
    <div class="grid grid-cols-2 gap-3">
      <button
        v-for="action in actions"
        :key="action.id"
        @click="handleAction(action)"
        class="flex flex-col items-center gap-2 p-4 rounded-lg border-2 border-dashed 
               border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-all"
      >
        <div class="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
          <component :is="action.icon" class="w-5 h-5 text-gray-600" />
        </div>
        <span class="text-sm font-medium text-gray-700">{{ action.label }}</span>
      </button>
    </div>
    
    <!-- Keyboard Shortcuts Hint -->
    <div class="mt-4 pt-4 border-t border-gray-100">
      <p class="text-xs text-gray-500 flex items-center gap-2">
        <kbd class="px-1.5 py-0.5 bg-gray-100 rounded text-xs">?</kbd>
        <span>Press for keyboard shortcuts</span>
      </p>
    </div>
  </div>
</template>
```

**Implementation Priority:** MEDIUM  
**Effort:** 2 hours

---

## Part 4: Accessibility Improvements

### 4.1 ARIA Labels Checklist

| Component | Current | Required | Priority |
|-----------|---------|----------|----------|
| Icon buttons | ⚠️ Partial | aria-label on all | HIGH |
| Form inputs | ⚠️ Partial | aria-describedby for errors | HIGH |
| Tabs | ⚠️ Partial | role="tablist", aria-selected | HIGH |
| Modals | ✅ Good | aria-modal, aria-labelledby | DONE |
| Status badges | ⚠️ Missing | aria-label for color meaning | MEDIUM |
| Loading states | ⚠️ Missing | aria-busy, aria-live | MEDIUM |

### 4.2 Keyboard Navigation

**Add Keyboard Shortcuts**
```typescript
// composables/useKeyboardShortcuts.ts
import { onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';

export function useKeyboardShortcuts() {
  const router = useRouter();
  
  const shortcuts: Record<string, () => void> = {
    'n': () => router.push('/coi/request/new'),
    's': () => document.querySelector<HTMLInputElement>('[type="search"]')?.focus(),
    'r': () => router.push('/coi/reports'),
    '?': () => showShortcutsModal(),
    'Escape': () => closeModals(),
  };
  
  function handleKeydown(e: KeyboardEvent) {
    // Don't trigger when typing in inputs
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
      return;
    }
    
    const key = e.key.toLowerCase();
    if (shortcuts[key]) {
      e.preventDefault();
      shortcuts[key]();
    }
  }
  
  onMounted(() => {
    window.addEventListener('keydown', handleKeydown);
  });
  
  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeydown);
  });
}
```

**Implementation Priority:** MEDIUM  
**Effort:** 3 hours

### 4.3 Focus Management

```typescript
// composables/useFocusTrap.ts
import { ref, onMounted, onUnmounted } from 'vue';

export function useFocusTrap(containerRef: Ref<HTMLElement | null>) {
  const focusableElements = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
  
  function trapFocus(e: KeyboardEvent) {
    if (e.key !== 'Tab' || !containerRef.value) return;
    
    const focusable = containerRef.value.querySelectorAll(focusableElements);
    const firstFocusable = focusable[0] as HTMLElement;
    const lastFocusable = focusable[focusable.length - 1] as HTMLElement;
    
    if (e.shiftKey && document.activeElement === firstFocusable) {
      e.preventDefault();
      lastFocusable.focus();
    } else if (!e.shiftKey && document.activeElement === lastFocusable) {
      e.preventDefault();
      firstFocusable.focus();
    }
  }
  
  onMounted(() => {
    document.addEventListener('keydown', trapFocus);
  });
  
  onUnmounted(() => {
    document.removeEventListener('keydown', trapFocus);
  });
}
```

**Implementation Priority:** HIGH  
**Effort:** 2 hours

---

## Part 5: Mobile Responsiveness

### 5.1 Responsive Table Component

```vue
<!-- components/ui/ResponsiveTable.vue -->
<template>
  <div>
    <!-- Desktop Table -->
    <div class="hidden md:block overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th 
              v-for="column in columns" 
              :key="column.key"
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              {{ column.label }}
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-for="row in data" :key="row.id" class="hover:bg-gray-50">
            <td 
              v-for="column in columns" 
              :key="column.key"
              class="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
            >
              <slot :name="`cell-${column.key}`" :row="row" :value="row[column.key]">
                {{ row[column.key] }}
              </slot>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <!-- Mobile Cards -->
    <div class="md:hidden space-y-4">
      <div 
        v-for="row in data" 
        :key="row.id"
        class="bg-white rounded-lg border border-gray-200 p-4 shadow-sm"
      >
        <div 
          v-for="column in columns" 
          :key="column.key"
          class="flex justify-between py-2 border-b border-gray-100 last:border-0"
        >
          <span class="text-sm font-medium text-gray-500">{{ column.label }}</span>
          <span class="text-sm text-gray-900">
            <slot :name="`cell-${column.key}`" :row="row" :value="row[column.key]">
              {{ row[column.key] }}
            </slot>
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
```

**Implementation Priority:** HIGH  
**Effort:** 3 hours

### 5.2 Mobile Navigation

```vue
<!-- components/layout/MobileNav.vue -->
<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition ease-out duration-300"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition ease-in duration-200"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div 
        v-if="isOpen" 
        class="fixed inset-0 z-50 md:hidden"
      >
        <!-- Backdrop -->
        <div 
          class="absolute inset-0 bg-black/50"
          @click="$emit('close')"
        ></div>
        
        <!-- Drawer -->
        <Transition
          enter-active-class="transition ease-out duration-300"
          enter-from-class="-translate-x-full"
          enter-to-class="translate-x-0"
          leave-active-class="transition ease-in duration-200"
          leave-from-class="translate-x-0"
          leave-to-class="-translate-x-full"
        >
          <div 
            v-if="isOpen"
            class="absolute left-0 top-0 bottom-0 w-72 bg-white shadow-xl"
          >
            <!-- Header -->
            <div class="flex items-center justify-between p-4 border-b">
              <h2 class="text-lg font-semibold">Menu</h2>
              <button 
                @click="$emit('close')"
                class="p-2 rounded-lg hover:bg-gray-100"
                aria-label="Close menu"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
            
            <!-- Navigation -->
            <nav class="p-4">
              <slot />
            </nav>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>
```

**Implementation Priority:** HIGH  
**Effort:** 3 hours

---

## Implementation Roadmap

### Phase 1: Critical Fixes (Week 1)
| Task | Priority | Effort | Status |
|------|----------|--------|--------|
| Real-time form validation | HIGH | 4-5h | Pending |
| Mobile responsive tables | HIGH | 3h | Pending |
| ARIA labels on buttons | HIGH | 2h | Pending |
| Focus management | HIGH | 2h | Pending |
| **Total** | | **11-12h** | |

### Phase 2: UX Enhancements (Week 2)
| Task | Priority | Effort | Status |
|------|----------|--------|--------|
| Enhanced progress indicator | MEDIUM | 2-3h | Pending |
| Help tooltips | MEDIUM | 2h | Pending |
| Auto-save indicator | MEDIUM | 2h | Pending |
| Keyboard shortcuts | MEDIUM | 3h | Pending |
| Quick actions panel | MEDIUM | 2h | Pending |
| **Total** | | **11-12h** | |

### Phase 3: Reports Enhancement (Week 3)
| Task | Priority | Effort | Status |
|------|----------|--------|--------|
| Interactive charts | HIGH | 4-6h | Pending |
| Multi-select filters | MEDIUM | 2-3h | Pending |
| Saved report presets | LOW | 3-4h | Pending |
| **Total** | | **9-13h** | |

### Phase 4: Polish (Week 4)
| Task | Priority | Effort | Status |
|------|----------|--------|--------|
| Animated stats cards | LOW | 2h | Pending |
| Mobile navigation drawer | HIGH | 3h | Pending |
| Dark mode (optional) | LOW | 4-6h | Pending |
| **Total** | | **9-11h** | |

---

## Testing Checklist

### Automated E2E Tests Created
- [x] Authentication flow tests
- [x] Requester dashboard tests
- [x] COI request form tests
- [x] Reports page tests
- [x] Director dashboard tests
- [x] Compliance dashboard tests
- [x] Finance dashboard tests
- [x] UI/UX validation tests
- [x] Responsive design tests
- [x] Error handling tests
- [x] Performance tests

### Manual Testing Required
- [ ] Cross-browser testing (Chrome, Firefox, Safari, Edge)
- [ ] Screen reader testing (VoiceOver, NVDA)
- [ ] Touch device testing
- [ ] Print functionality testing
- [ ] Export functionality testing

---

## Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Lighthouse Accessibility Score | ~75 | 95+ |
| Lighthouse Performance Score | ~80 | 90+ |
| Form Completion Rate | Unknown | 85%+ |
| Mobile Usability | Partial | Full |
| E2E Test Coverage | ~40% | 80%+ |

---

## Conclusion

This comprehensive UI/UX improvement plan addresses:
1. **Reports Module** - Enhanced visualization and filtering
2. **Forms** - Real-time validation and better UX
3. **Dashboards** - Improved information architecture
4. **Accessibility** - WCAG 2.1 AA compliance
5. **Mobile** - Full responsive support

**Estimated Total Effort:** 40-48 hours over 4 weeks

**Recommendation:** Start with Phase 1 (Critical Fixes) immediately, as these have the highest impact on user experience and accessibility compliance.
