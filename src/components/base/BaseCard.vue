<script setup>
defineProps({
  title: { type: String, default: '' },
  unstyled: { type: Boolean, default: false },
});
</script>

<template>
  <section :class="{ 'rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900': !unstyled }">
    <header v-if="title || $slots.header" class="mb-4">
      <slot name="header"><h2 class="text-base font-semibold">{{ title }}</h2></slot>
    </header>
    <slot />
    <footer v-if="$slots.footer" class="mt-4"><slot name="footer" /></footer>
  </section>
</template>
