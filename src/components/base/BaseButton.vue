<script setup>
defineProps({
  type: { type: String, default: 'button' },
  variant: { type: String, default: 'primary', validator: value => ['primary', 'secondary', 'outline', 'ghost', 'danger'].includes(value) },
  size: { type: String, default: 'md', validator: value => ['sm', 'md', 'lg'].includes(value) },
  loading: Boolean,
  loadingLabel: { type: String, default: 'កំពុងដំណើរការ…' },
  disabled: Boolean,
});
const variants = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700',
  secondary: 'secondary-button border border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800',
  danger: 'danger-button bg-rose-600 text-white hover:bg-rose-700',
  outline: 'secondary-button',
  ghost: 'ghost-button',
};
</script>

<template>
  <button :type="type" :disabled="disabled || loading" :aria-busy="loading" :aria-label="loading ? loadingLabel : undefined" :data-variant="variant" :data-size="size" :class="variants[variant]" class="base-button rounded-xl px-4 py-2.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
    <span class="base-button-content" :class="{ 'is-loading': loading }"><slot name="icon" /><slot /></span>
    <span v-if="loading" class="base-button-spinner" aria-hidden="true"></span>
  </button>
</template>

<style scoped>
.base-button { position: relative; display: inline-flex; align-items: center; justify-content: center; min-height: 44px; gap: 8px; border: 1px solid transparent; border-radius: 12px; }
.base-button-content { display: inline-flex; align-items: center; justify-content: center; gap: 8px; }
.is-loading { visibility: hidden; }
.base-button[data-size="sm"] { min-height: 36px; padding: 6px 12px; }
.base-button[data-size="lg"] { min-height: 48px; padding: 12px 22px; }
.base-button[data-variant="outline"] { background: transparent; border-color: var(--line); color: var(--ink); }
.base-button[data-variant="ghost"] { background: transparent; color: var(--blue); box-shadow: none; }
.base-button:is([data-variant="outline"], [data-variant="ghost"]):hover:not(:disabled) { background: var(--soft); }
.base-button-spinner { position: absolute; width: 18px; height: 18px; border: 2px solid currentColor; border-right-color: transparent; border-radius: 50%; animation: button-spin .7s linear infinite; }
@keyframes button-spin { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) { .base-button-spinner { animation: none; } }
</style>
