<script setup>
import BaseSkeleton from '../base/BaseSkeleton.vue';
defineProps({
  loading: Boolean,
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
  <div class="metric-card metric-card-static" :class="color" :aria-busy="loading">
    <span class="metric-icon"><component :is="icon" :size="21" /></span>
    <span class="metric-info">
      <span>{{ title }}</span>
      <strong :class="{ 'metric-text-value': textValue }"><BaseSkeleton v-if="loading" inline :lines="1" /><template v-else>{{ value }}</template></strong>
      <small><BaseSkeleton v-if="loading" inline :lines="1" /><template v-else>{{ note }}</template></small>
    </span>
  </div>
</template>

<style scoped>
.metric-card-static { cursor: default; }
.metric-card-static:hover { transform: none; }
</style>
