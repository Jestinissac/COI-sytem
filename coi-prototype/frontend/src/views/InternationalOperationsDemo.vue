<template>
  <div class="min-h-screen bg-gray-100 py-8">
    <div class="max-w-7xl mx-auto px-6">
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">International Operations - Design Options</h1>
        <p class="text-gray-600">Compare three different design approaches for the International Operations section</p>
      </div>

      <!-- Tabs for switching between options -->
      <div class="mb-6">
        <div class="border-b border-gray-200">
          <nav class="-mb-px flex space-x-8">
            <button
              v-for="(option, index) in options"
              :key="index"
              @click="activeTab = index"
              :class="[
                'py-4 px-1 border-b-2 font-medium text-sm transition-colors',
                activeTab === index
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              ]"
            >
              {{ option.name }}
            </button>
          </nav>
        </div>
      </div>

      <!-- Option 1: Card-Based Design -->
      <div v-show="activeTab === 0" class="space-y-6">
        <div class="bg-white rounded-lg shadow-sm border border-gray-200">
          <div class="px-6 py-4 border-b border-gray-200">
            <h2 class="text-lg font-semibold text-gray-900">Option 1: Card-Based Design</h2>
            <p class="text-sm text-gray-500 mt-1">Clean, organized view with expandable country cards</p>
          </div>
          <div class="p-6">
            <Option1CardDesign />
          </div>
        </div>
      </div>

      <!-- Option 2: Table-Based Design -->
      <div v-show="activeTab === 1" class="space-y-6">
        <div class="bg-white rounded-lg shadow-sm border border-gray-200">
          <div class="px-6 py-4 border-b border-gray-200">
            <h2 class="text-lg font-semibold text-gray-900">Option 2: Table-Based Design</h2>
            <p class="text-sm text-gray-500 mt-1">Compact table layout for easy scanning</p>
          </div>
          <div class="p-6">
            <Option2TableDesign />
          </div>
        </div>
      </div>

      <!-- Option 3: Accordion Design -->
      <div v-show="activeTab === 2" class="space-y-6">
        <div class="bg-white rounded-lg shadow-sm border border-gray-200">
          <div class="px-6 py-4 border-b border-gray-200">
            <h2 class="text-lg font-semibold text-gray-900">Option 3: Accordion with Nested Cards</h2>
            <p class="text-sm text-gray-500 mt-1">Maximum organization with clear visual hierarchy (Recommended)</p>
          </div>
          <div class="p-6">
            <Option3AccordionDesign />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import Option1CardDesign from '@/components/coi/demo/Option1CardDesign.vue'
import Option2TableDesign from '@/components/coi/demo/Option2TableDesign.vue'
import Option3AccordionDesign from '@/components/coi/demo/Option3AccordionDesign.vue'

const activeTab = ref(0)

const options = [
  { name: 'Option 1: Card-Based' },
  { name: 'Option 2: Table-Based' },
  { name: 'Option 3: Accordion (Recommended)' }
]
</script>
