<script setup>
import AdminUserManagement from '../admin/AdminUserManagement.vue';
defineProps({
  employees: { type: Array, default: () => [] },
  loading: Boolean,
  error: String,
  onRetry: Function,
  onGetEmployee: Function,
});
</script>
<template>
  <div>
    <AdminUserManagement :users="employees" :loading="loading" :load-error="error" :on-retry="onRetry" read-only :on-get-user="onGetEmployee" />
  </div>
</template>
