<template>
  <button class="base-button" :disabled="loading">
    <span
      v-if="loading"
      class="spinner-border spinner-border-sm me-2"
      role="status"
      aria-hidden="true"
    ></span>

    <span v-if="!loading" class="btn-icon">
      <slot name="icon"></slot>
    </span>

    <span class="btn-text">
      <slot name="default">Default Label</slot>
    </span>
  </button>
</template>

<script setup>
defineProps({
  loading: {
    type: Boolean,
    default: false,
  },
});
</script>

<style scoped>
.base-button {
  /* Layout & Styling */
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 14px 18px;
  border-radius: 8px;
  border: none;
  cursor: pointer;

  /* Brand Colors */
  background-color: #2d6a4f; /* The green from your image */
  color: #ffffff;

  /* Text Styling */
  font-family: "Inter", sans-serif;
  font-size: 16px;
  font-weight: 500;

  /* Animation Prep */
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

/* --- Animations --- */

/* Hover: Lighten background and lift slightly */
.base-button:hover {
  background-color: #94b59d;
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.15);
}
/* Active: Press down effect when clicked */
.base-button:active {
  transform: translateY(1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  background-color: #76967f;
}

/* Icon specific sizing */
.btn-icon {
  display: flex;
  align-items: center;
  font-size: 18px;
  line-height: 0;
}
</style>
