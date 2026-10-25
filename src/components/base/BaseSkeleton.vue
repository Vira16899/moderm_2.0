<script setup>
defineProps({ inline: Boolean, lines: { type: Number, default: 4 }, label: { type: String, default: 'កំពុងទាញយកព័ត៌មាន…' } });
</script>
<template>
  <component :is="inline ? 'span' : 'div'" class="base-skeleton-panel" :class="{ 'base-skeleton-inline': inline }" role="status"><span class="sr-only">{{ label }}</span><span aria-hidden="true" class="skeleton-lines"><span v-for="line in lines" :key="line" class="skeleton-bar" :style="{ width: line === lines ? '65%' : '100%' }"></span></span></component>
</template>

<style scoped>
.base-skeleton-inline { display:block; padding:0; border:0; border-radius:0; background:transparent; min-width:64px; }
.base-skeleton-inline .skeleton-lines { gap:8px; }
.base-skeleton-inline .skeleton-bar:first-child { height:1.15em; min-height:18px; margin:0; }
.base-skeleton-inline .skeleton-bar:last-child { width:100% !important; }
</style>
