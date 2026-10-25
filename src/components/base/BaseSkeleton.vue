<script setup>
defineProps({ lines: { type: Number, default: 4 }, label: { type: String, default: 'កំពុងទាញយកព័ត៌មាន…' } });
</script>
<template>
  <div class="base-skeleton-panel" role="status"><span class="sr-only">{{ label }}</span><div aria-hidden="true" class="skeleton-lines"><span v-for="line in lines" :key="line" class="skeleton-bar" :style="{ width: line === lines ? '65%' : '100%' }"></span></div></div>
</template>
