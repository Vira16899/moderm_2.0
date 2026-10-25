<template>
  <main class="not-found d-flex align-items-center justify-content-center min-vh-100 bg-body-tertiary">
    <div class="text-center px-3">

      <div class="glitch-wrap mb-4" aria-hidden="true">
        <span class="glitch display-1 fw-bold text-primary" data-text="404">404</span>
      </div>

      <div class="mb-4">
        <span class="badge bg-primary-subtle text-primary rounded-pill px-3 py-2 fs-6">
          Page not found
        </span>
      </div>

      <h1 class="h3 fw-semibold mb-2">Oops! You've hit a dead end.</h1>
      <p class="text-muted mx-auto mb-5" style="max-width: 380px;">
        The page you're looking for doesn't exist, was moved, or the URL was mistyped.
      </p>

      <div class="d-flex flex-column flex-sm-row gap-2 justify-content-center">
        <RouterLink :to="dashboardRoute" class="btn btn-primary px-4">
          <i class="bi bi-house-door me-2"></i>Go to dashboard
        </RouterLink>
        <button class="btn btn-outline-secondary px-4" @click="$router.back()">
          <i class="bi bi-arrow-left me-2"></i>Go back
        </button>
      </div>

    </div>
  </main>
</template>

<script setup>
import { RouterLink, useRouter } from 'vue-router'
import { computed } from 'vue'
import { useAuthStore } from '@/stores/useAuth'
import { getRoleKey } from '@/utils/roles'

const $router = useRouter()
const authStore = useAuthStore()

const dashboardRouteByRole = {
  admin: 'adminDashboard',
  manager: 'managerDashboard',
  staff: 'staffDashboard',
}

const dashboardRoute = computed(() => {
  const routeName = dashboardRouteByRole[getRoleKey(authStore.profile)]
  return routeName ? { name: routeName } : { name: 'Login' }
})
</script>

<style scoped>
.not-found {
  font-family: inherit;
}

/* Glitch effect on the 404 number */
.glitch-wrap {
  position: relative;
  display: inline-block;
}

.glitch {
  position: relative;
  font-size: clamp(5rem, 18vw, 9rem);
  letter-spacing: -4px;
  color: var(--bs-primary);
}

.glitch::before,
.glitch::after {
  content: attr(data-text);
  position: absolute;
  inset: 0;
  font-size: inherit;
  font-weight: inherit;
  letter-spacing: inherit;
}

.glitch::before {
  color: #ff4d6d;
  clip-path: polygon(0 0, 100% 0, 100% 40%, 0 40%);
  transform: translateX(-3px);
  animation: glitch-top 3s infinite linear;
}

.glitch::after {
  color: #48cae4;
  clip-path: polygon(0 60%, 100% 60%, 100% 100%, 0 100%);
  transform: translateX(3px);
  animation: glitch-bottom 3s infinite linear;
}

@keyframes glitch-top {
  0%, 90%, 100% { transform: translateX(-3px); opacity: 1; }
  92%            { transform: translateX(3px) skewX(-5deg); opacity: 0.8; }
  94%            { transform: translateX(-6px); opacity: 0.6; }
  96%            { transform: translateX(3px); opacity: 1; }
}

@keyframes glitch-bottom {
  0%, 90%, 100% { transform: translateX(3px); opacity: 1; }
  92%            { transform: translateX(-3px) skewX(5deg); opacity: 0.8; }
  94%            { transform: translateX(6px); opacity: 0.6; }
  96%            { transform: translateX(-3px); opacity: 1; }
}
</style>
