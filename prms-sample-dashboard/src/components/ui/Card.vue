<template>
  <section class="bg-white border border-gray-200 rounded-xl shadow-card">
    <header v-if="$slots.header" class="px-4 py-3 border-b border-gray-100">
      <slot name="header" />
    </header>
    <div class="p-4">
      <slot />
    </div>
    <footer v-if="$slots.footer" class="px-4 py-3 border-t border-gray-100 bg-gray-50 rounded-b-xl">
      <slot name="footer" />
    </footer>
  </section>
</template>


