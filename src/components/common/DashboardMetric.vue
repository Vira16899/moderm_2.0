<script setup>
defineProps({
  title: String,
  value: [String, Number],
  note: String,
  icon: [Object, Function],
  color: { type: String, default: 'blue' },
  action: Function,
  textValue: Boolean,
});
</script>
<template>
  <div class="metric-card metric-card-static" :class="color">
    <span class="metric-icon"><component :is="icon" :size="21" /></span>
    <span class="metric-info">
      <span>{{ title }}</span>
      <strong :class="{ 'metric-text-value': textValue }">{{ value }}</strong>
      <small>{{ note }}</small>
    </span>
  </div>
</template>

<style scoped>
.metric-card-static { cursor: default; }
.metric-card-static:hover { transform: none; }
</style>
