<template>
  <Teleport to="body">
    <div class="toast-stack" aria-live="polite" aria-atomic="true">
      <TransitionGroup name="toast-list" tag="div">
        <div
          v-for="toast in toastStore.toasts"
          :key="toast.id"
          class="app-toast shadow-sm"
          :class="toastClass(toast.type)"
          role="alert"
        >
          <i :class="toastIcon(toast.type)"></i>
          <span class="toast-message">{{ toast.message }}</span>
          <button
            type="button"
            class="toast-close"
            aria-label="Close"
            @click="toastStore.remove(toast.id)"
          >
            <i class="bi bi-x"></i>
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup>
import { useToastStore } from '@/stores/toast'

const toastStore = useToastStore()

const toastClass = (type) => ({
  'toast-success': type === 'success',
  'toast-error': type === 'error'
})

const toastIcon = (type) => {
  return type === 'error' ? 'bi bi-x-circle-fill' : 'bi bi-check-circle-fill'
}
</script>

<style scoped>
.toast-stack {
  position: fixed;
  top: 18px;
  right: 18px;
  z-index: 2000;
  width: min(360px, calc(100vw - 32px));
  pointer-events: none;
}

.app-toast {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 10px;
  min-height: 52px;
  padding: 12px 14px;
  margin-bottom: 10px;
  color: #243b35;
  background: #ffffff;
  border-left: 4px solid #52796f;
  border-radius: 8px;
  pointer-events: auto;
}

.toast-success {
  border-left-color: #2e7d32;
}

.toast-success > .bi {
  color: #2e7d32;
}

.toast-error {
  border-left-color: #c62828;
}

.toast-error > .bi {
  color: #c62828;
}

.toast-message {
  line-height: 1.35;
  overflow-wrap: anywhere;
}

.toast-close {
  width: 28px;
  height: 28px;
  border: 0;
  border-radius: 6px;
  color: #5f6f69;
  background: transparent;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.toast-close:hover {
  background: #eef4f1;
  color: #243b35;
}

.toast-list-enter-active,
.toast-list-leave-active {
  transition: all 0.18s ease;
}

.toast-list-enter-from,
.toast-list-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
