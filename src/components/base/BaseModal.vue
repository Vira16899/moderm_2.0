<script setup>
import { onBeforeUnmount, ref, useId, watch } from 'vue';
import { X } from 'lucide-vue-next';

defineOptions({ inheritAttrs: false });

const props = defineProps({
  modelValue: Boolean,
  title: { type: String, required: true },
  closeOnBackdrop: { type: Boolean, default: true },
  closeOnEscape: { type: Boolean, default: true },
  size: { type: String, default: 'md', validator: value => ['sm', 'md', 'lg', 'xl'].includes(value) },
  description: String,
  showHeader: Boolean,
  busy: Boolean,
  dirty: Boolean,
  error: String,
});
const emit = defineEmits(['update:modelValue', 'close']);
const dialog = ref(null);
const titleId = useId();
const descriptionId = useId();
let returnFocus;

function close() {
  if (props.busy) return;
  emit('update:modelValue', false);
  emit('close');
}
function onCancel(event) {
  event.preventDefault();
  if (props.closeOnEscape) close();
}
function onBackdrop(event) {
  if (event.target !== dialog.value || !props.closeOnBackdrop) return;
  const rect = dialog.value.getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) close();
}
watch(() => props.modelValue, open => {
  if (!dialog.value) return;
  if (open && !dialog.value.open) {
    returnFocus = document.activeElement;
    dialog.value.showModal();
  } else if (!open && dialog.value.open) {
    dialog.value.close();
    returnFocus?.focus?.();
  }
}, { immediate: true, flush: 'post' });
// The immediate watcher can run before the template ref is available.
watch(dialog, element => {
  if (element && props.modelValue && !element.open) {
    returnFocus = document.activeElement;
    element.showModal();
  }
}, { flush: 'post' });
onBeforeUnmount(() => {
  if (dialog.value?.open) {
    dialog.value.close();
    returnFocus?.focus?.();
  }
});
</script>

<template>
  <Teleport to="body">
    <dialog ref="dialog" v-bind="$attrs" :data-size="size" :aria-busy="busy" :aria-labelledby="titleId" :aria-describedby="description ? descriptionId : undefined" class="base-modal modal-surface rounded-2xl border border-slate-200 bg-white p-6 text-slate-900 shadow-xl dark:border-slate-800 dark:bg-slate-900 dark:text-white" @cancel="onCancel" @click="onBackdrop">
      <header v-if="showHeader" class="base-modal-header"><h2 :id="titleId">{{ title }}</h2><button type="button" class="icon-button modal-close-button" aria-label="បិទ" :disabled="busy" @click="close"><X :size="20" aria-hidden="true" /></button></header>
      <h2 v-else :id="titleId" class="sr-only">{{ title }}</h2>
      <p v-if="description" :id="descriptionId" class="base-modal-description">{{ description }}</p>
      <p v-if="error" role="alert" class="form-error">{{ error }}</p>
      <slot :close="close" :busy="busy" />
      <footer v-if="$slots.footer" class="base-modal-footer"><slot name="footer" :close="close" :busy="busy" /></footer>
    </dialog>
  </Teleport>
</template>

<style scoped>
.base-modal { margin: auto; width: calc(100% - 2rem); max-width: 32rem; max-height: calc(100dvh - 2rem); overflow-y: auto; }
.base-modal::backdrop { background: rgb(15 23 42 / 40%); backdrop-filter: blur(4px); }
.base-modal[data-size="sm"] { max-width: 26rem; }
.base-modal[data-size="lg"] { max-width: 44rem; }
.base-modal[data-size="xl"] { max-width: 60rem; }
.base-modal-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 20px; }
.base-modal-header h2 { font-size: 18px; font-weight: 600; }
.base-modal-header .modal-close-button { display:grid; place-items:center; width:44px; height:44px; padding:0; flex-shrink:0; border:0; border-radius:11px; background:transparent; color:var(--muted); transition:background-color 150ms,color 150ms; }
.base-modal-header .modal-close-button:hover:not(:disabled) { background:var(--soft); color:var(--ink); }
.base-modal-header .modal-close-button:focus-visible { outline:2px solid var(--blue); outline-offset:3px; }
.base-modal-description { color: var(--muted); margin-bottom: 20px; }
.base-modal-footer { display: flex; justify-content: flex-end; flex-wrap: wrap; gap: 10px; margin-top: 24px; padding-top: 16px; border-top: 1px solid var(--line); }
@media (max-width: 540px) { .base-modal { padding: 20px; } }
</style>
