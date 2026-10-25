<script setup>
import { watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { auth } from './auth/index.js';
import { dashboardPath } from './auth/session.js';
import ToastViewport from './components/base/ToastViewport.vue';
const route = useRoute();
const router = useRouter();
watch(() => auth.state.user?.role, (role) => {
  if (!route.meta.requiresAuth) return;
  if (!role) router.replace(auth.getChallenge() ? '/verify-admin-otp' : '/login');
  else if (route.meta.role && route.meta.role !== role) router.replace(dashboardPath(auth.state.user));
});
</script>
<template>
  <router-view />
  <ToastViewport />
</template>
