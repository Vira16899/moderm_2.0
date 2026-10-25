<script setup>
import { Inbox, TriangleAlert } from 'lucide-vue-next';
defineProps({
  kind: { type:String, default:'empty', validator:value => ['empty','error'].includes(value) },
  title: String,
  description: String,
});
</script>
<template>
  <div class="base-state" :class="'base-state-' + kind" :role="kind === 'error' ? 'alert' : undefined">
    <span class="base-state-icon" aria-hidden="true"><TriangleAlert v-if="kind === 'error'" :size="24" /><Inbox v-else :size="24" /></span>
    <div class="base-state-copy"><h3>{{ title || (kind === 'error' ? 'មិនអាចទាញយកព័ត៌មានបានទេ' : 'មិនទាន់មានទិន្នន័យ') }}</h3><p v-if="description">{{ description }}</p></div>
    <div v-if="$slots.default" class="base-state-actions"><slot /></div>
  </div>
</template>
<style scoped>
.base-state { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:16px; min-height:250px; padding:28px 20px; text-align:center; white-space:normal; }
.base-state-icon { display:grid; place-items:center; width:52px; height:52px; border-radius:15px; background:var(--soft); color:var(--blue); flex-shrink:0; }
.base-state-error .base-state-icon { color:#a53b50; background:#fff0f2; }
.base-state-copy { display:grid; gap:8px; max-width:460px; }
h3 { margin:0; font-size:15px; line-height:1.7; color:var(--ink); font-weight:650; }
p { margin:0; font-size:12px; line-height:1.9; color:var(--muted); overflow-wrap:anywhere; }
.base-state-actions { display:flex; align-items:center; justify-content:center; flex-wrap:wrap; gap:10px; }
.dark .base-state-error .base-state-icon { color:#f5a5b5; background:#422630; }
</style>
