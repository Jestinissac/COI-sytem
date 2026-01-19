<template>
  <div class="form-field">
    <label 
      v-if="label"
      :for="id" 
      class="block text-sm font-medium text-gray-700 mb-1.5"
    >
      {{ label }}
      <span v-if="required" class="text-red-500 ml-0.5" aria-hidden="true">*</span>
      <span v-if="required" class="sr-only">(required)</span>
    </label>
    
    <div class="relative">
      <input
        :id="id"
        :type="type"
        :value="modelValue"
        @input="handleInput"
        @blur="handleBlur"
        @focus="handleFocus"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :aria-invalid="hasError"
        :aria-describedby="ariaDescribedBy"
        :aria-required="required"
        :maxlength="maxLength"
        class="w-full px-3 py-2 border rounded-lg text-sm transition-all duration-200 focus:outline-none focus:ring-2"
        :class="inputClasses"
      />
      
      <!-- Validation Icon -->
      <div v-if="showValidationIcon" class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
        <svg 
          v-if="hasError && touched" 
          class="w-5 h-5 text-red-500" 
          fill="currentColor" 
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
        </svg>
        <svg 
          v-else-if="isValid && touched && modelValue" 
          class="w-5 h-5 text-green-500" 
          fill="currentColor" 
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
        </svg>
      </div>
    </div>
    
    <!-- Error Message -->
    <p 
      v-if="hasError && touched" 
      :id="`${id}-error`"
      class="mt-1.5 text-sm text-red-600 flex items-center gap-1"
      role="alert"
      aria-live="polite"
    >
      <svg class="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
      </svg>
      <span>{{ errorMessage }}</span>
    </p>
    
    <!-- Help Text -->
    <p 
      v-else-if="helpText && !hasError" 
      :id="`${id}-help`"
      class="mt-1.5 text-sm text-gray-500"
    >
      {{ helpText }}
    </p>
    
    <!-- Character Counter -->
    <p 
      v-if="maxLength && showCharCount" 
      class="mt-1 text-xs text-right"
      :class="charCountClass"
      aria-live="polite"
    >
      {{ charCount }}/{{ maxLength }} characters
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';

interface Props {
  id: string;
  modelValue: string | number | null;
  label?: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  readonly?: boolean;
  helpText?: string;
  maxLength?: number;
  minLength?: number;
  pattern?: string;
  patternMessage?: string;
  showCharCount?: boolean;
  validateOnBlur?: boolean;
  validateOnInput?: boolean;
  customValidator?: (value: any) => string | null;
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  required: false,
  disabled: false,
  readonly: false,
  showCharCount: false,
  validateOnBlur: true,
  validateOnInput: false,
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'blur', event: FocusEvent): void;
  (e: 'focus', event: FocusEvent): void;
  (e: 'validation', isValid: boolean, error: string | null): void;
}>();

const touched = ref(false);
const focused = ref(false);
const internalError = ref<string | null>(null);

// Computed properties
const hasError = computed(() => !!internalError.value);
const isValid = computed(() => !hasError.value && !!props.modelValue);
const errorMessage = computed(() => internalError.value);

const charCount = computed(() => {
  if (typeof props.modelValue === 'string') {
    return props.modelValue.length;
  }
  return 0;
});

const charCountClass = computed(() => {
  if (!props.maxLength) return 'text-gray-400';
  const remaining = props.maxLength - charCount.value;
  if (remaining <= 0) return 'text-red-500 font-medium';
  if (remaining <= 10) return 'text-yellow-600';
  return 'text-gray-400';
});

const showValidationIcon = computed(() => {
  return touched.value && !props.disabled && !props.readonly;
});

const inputClasses = computed(() => {
  const base = [];
  
  if (props.disabled) {
    base.push('bg-gray-100 text-gray-500 cursor-not-allowed border-gray-200');
  } else if (props.readonly) {
    base.push('bg-gray-50 text-gray-700 border-gray-300');
  } else if (hasError.value && touched.value) {
    base.push('border-red-500 focus:ring-red-500 focus:border-red-500 pr-10');
  } else if (isValid.value && touched.value) {
    base.push('border-green-500 focus:ring-green-500 focus:border-green-500 pr-10');
  } else {
    base.push('border-gray-300 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400');
  }
  
  return base.join(' ');
});

const ariaDescribedBy = computed(() => {
  const ids = [];
  if (hasError.value && touched.value) {
    ids.push(`${props.id}-error`);
  } else if (props.helpText) {
    ids.push(`${props.id}-help`);
  }
  return ids.length > 0 ? ids.join(' ') : undefined;
});

// Validation function
function validate(value: any): string | null {
  // Required validation
  if (props.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
    return 'This field is required';
  }
  
  // Skip other validations if empty and not required
  if (!value) return null;
  
  const strValue = String(value);
  
  // Min length validation
  if (props.minLength && strValue.length < props.minLength) {
    return `Minimum ${props.minLength} characters required`;
  }
  
  // Max length validation
  if (props.maxLength && strValue.length > props.maxLength) {
    return `Maximum ${props.maxLength} characters allowed`;
  }
  
  // Pattern validation
  if (props.pattern) {
    const regex = new RegExp(props.pattern);
    if (!regex.test(strValue)) {
      return props.patternMessage || 'Invalid format';
    }
  }
  
  // Email validation for email type
  if (props.type === 'email' && value) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(strValue)) {
      return 'Please enter a valid email address';
    }
  }
  
  // Custom validator
  if (props.customValidator) {
    const customError = props.customValidator(value);
    if (customError) return customError;
  }
  
  return null;
}

// Event handlers
function handleInput(event: Event) {
  const target = event.target as HTMLInputElement;
  const value = target.value;
  
  emit('update:modelValue', value);
  
  if (props.validateOnInput && touched.value) {
    internalError.value = validate(value);
    emit('validation', !internalError.value, internalError.value);
  }
}

function handleBlur(event: FocusEvent) {
  touched.value = true;
  focused.value = false;
  
  if (props.validateOnBlur) {
    internalError.value = validate(props.modelValue);
    emit('validation', !internalError.value, internalError.value);
  }
  
  emit('blur', event);
}

function handleFocus(event: FocusEvent) {
  focused.value = true;
  emit('focus', event);
}

// Watch for external value changes
watch(() => props.modelValue, (newValue) => {
  if (touched.value && (props.validateOnInput || props.validateOnBlur)) {
    internalError.value = validate(newValue);
    emit('validation', !internalError.value, internalError.value);
  }
});

// Expose validation method for parent components
defineExpose({
  validate: () => {
    touched.value = true;
    internalError.value = validate(props.modelValue);
    emit('validation', !internalError.value, internalError.value);
    return !internalError.value;
  },
  reset: () => {
    touched.value = false;
    internalError.value = null;
  },
  setError: (error: string) => {
    touched.value = true;
    internalError.value = error;
  }
});
</script>

<style scoped>
.form-field {
  @apply w-full;
}

/* Screen reader only class */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
