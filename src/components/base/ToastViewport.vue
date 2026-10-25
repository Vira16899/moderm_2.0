<script setup>
import { ref, watch, nextTick } from 'vue';
import { CheckCircle2, CircleAlert, X } from 'lucide-vue-next';
import { toasts, dismissToast, pauseToast, resumeToast } from '../../stores/toasts.js';
const viewport = ref(null), visible = ref(false);
function afterLeave() { if (!toasts.length) { visible.value = false; viewport.value?.hidePopover?.(); } }
watch(() => toasts.length, async length => {
  await nextTick();
  if (length) {
    visible.value = true;
    if (viewport.value?.showPopover && !viewport.value.matches(':popover-open')) viewport.value.showPopover();
  }
}, { flush: 'post' });
</script>
<template>
  <Teleport to="body">
    <div ref="viewport" popover="manual" class="toast-viewport" :class="{ 'has-toasts': visible }" aria-label="ការជូនដំណឹង">
      <TransitionGroup name="toast" @after-leave="afterLeave">
        <div v-for="toast in toasts" :key="toast.id" class="factory-toast" :class="toast.type" @pointerenter="pauseToast(toast.id)" @pointerleave="resumeToast(toast.id)" @focusin="pauseToast(toast.id, 'focus')" @focusout="event => { if (!event.currentTarget.contains(event.relatedTarget)) resumeToast(toast.id, 'focus'); }" :role="toast.type === 'error' ? 'alert' : 'status'">
          <component :is="toast.type === 'error' ? CircleAlert : CheckCircle2" :size="22" />
          <p>{{ toast.message }}</p>
          <button type="button" aria-label="បិទការជូនដំណឹង" @click="dismissToast(toast.id)"><X :size="17" /></button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>
<style scoped>
.toast-viewport { position: fixed; inset: 20px 20px auto auto; margin: 0; width: min(390px, calc(100vw - 32px)); padding: 0; border: 0; background: transparent; overflow: visible; z-index: 9999; pointer-events: none; }
.toast-viewport::backdrop { background: transparent; pointer-events: none; }
.factory-toast { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 12px; padding: 16px; border: 1px solid #c5edf0; border-left: 4px solid #00afc2; border-radius: 16px; background: #f4fdfe; color: #16556b; box-shadow: 0 12px 32px #14374a24; pointer-events: auto; }
.factory-toast>svg { flex-shrink: 0; color: #009bad; margin-top: 2px; }
.factory-toast p { margin: 0; font-size: 13px; line-height: 1.8; overflow-wrap: anywhere; flex: 1; }
.factory-toast button { border: 0; background: transparent; color: inherit; padding: 3px; cursor: pointer; }
.factory-toast.error { background: #fff6f6; border-color: #f0d5d9; border-left-color: #c74b64; color: #91374b; }
.factory-toast.error>svg { color: #c74b64; }
.toast-enter-active, .toast-leave-active { transition: opacity 180ms ease-out, transform 180ms ease-out; }
.toast-move { transition:transform 180ms ease-out; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateX(12px); }
@supports not selector(:popover-open) { .toast-viewport { display: none; } .toast-viewport.has-toasts { display: block; } }
@media (max-width: 540px) { .toast-viewport { inset: 16px 16px auto auto; } }
@media (prefers-reduced-motion: reduce) { .toast-enter-active, .toast-leave-active, .toast-move { transition: none; } }
</style>
