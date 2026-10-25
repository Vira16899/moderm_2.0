<template>
  <nav id="sidebar" :class="{ closed: !isOpen && !isMobile, open: isOpen && isMobile }">

    <!-- Logo -->
    <div class="sidebar-brand">
      <img src="../../assets/logo.png" class="brand-logo" alt="AlertGo" />
      <span class="brand-name">NOAM-SAR</span>
    </div>

    <!-- Nav Links -->
    <div class="sidebar-nav px-2">

      <template v-if="roleKey === 'admin'">
        <RouterLink :to="{ name: 'adminDashboard' }" class="nav-item-custom">
          <i class="bi bi-grid-fill"></i><span>ផ្ទាំងគ្រប់គ្រង</span>
        </RouterLink>
        <RouterLink :to="{ name: 'adminUsers' }" class="nav-item-custom">
          <i class="bi bi-people-fill"></i><span>អ្នកប្រើប្រាស់</span>
        </RouterLink>
        <RouterLink :to="{ name: 'adminGroups' }" class="nav-item-custom">
          <i class="bi bi-diagram-3-fill"></i><span>ក្រុម</span>
        </RouterLink>
        <!-- <RouterLink :to="{ name: 'adminHistorySalary' }" class="nav-item-custom">
          <i class="bi bi-clock-history"></i><span>ប្រវត្តិប្រាក់ខែ</span>
        </RouterLink> -->
        <RouterLink :to="{ name: 'adminReports' }" class="nav-item-custom">
          <i class="bi bi-file-earmark-bar-graph-fill"></i><span>របាយការណ៍</span>
        </RouterLink>
        <RouterLink :to="{ name: 'adminNotifications' }" class="nav-item-custom">
          <i class="bi bi-bell-fill"></i><span>ការជូនដំណឹង</span>
        </RouterLink>
        <RouterLink :to="{ name: 'adminProfile' }" class="nav-item-custom">
          <i class="bi bi-person-circle"></i><span>ប្រវត្តិរូប</span>
        </RouterLink>
      </template>

      <!-- ផ្នែក MANAGER (role.id === 2) -->
      <template v-if="roleKey === 'manager'">
        <RouterLink :to="{ name: 'managerDashboard' }" class="nav-item-custom">
          <i class="bi bi-grid-fill"></i><span>ផ្ទាំងគ្រប់គ្រង</span>
        </RouterLink>
        <RouterLink :to="{ name: 'managerStaffs' }" class="nav-item-custom">
          <i class="bi bi-person-lines-fill"></i><span>បុគ្គលិករបស់ខ្ញុំ</span>
        </RouterLink>
        <RouterLink :to="{ name: 'managersGroups' }" class="nav-item-custom">
          <i class="bi bi-diagram-3-fill"></i><span>ក្រុម</span>
        </RouterLink>

        <RouterLink :to="{ name: 'managerReports' }" class="nav-item-custom">
          <i class="bi bi-file-earmark-bar-graph-fill"></i><span>របាយការណ៍</span>
        </RouterLink>
        <RouterLink :to="{ name: 'managerNotifications' }" class="nav-item-custom">
          <i class="bi bi-bell-fill"></i><span>ការជូនដំណឹង</span>
        </RouterLink>
        <RouterLink :to="{ name: 'managerProfile' }" class="nav-item-custom">
          <i class="bi bi-person-circle"></i><span>ប្រវត្តិរូប</span>
        </RouterLink>
        <RouterLink :to="{ name: 'managerTelegram' }" class="nav-item-custom">
          <i class="bi bi-telegram"></i><span>តេលេក្រាម</span>
        </RouterLink>
      </template>

      <!-- ── STAFF (role.id === 3) ── -->
      <template v-if="roleKey === 'staff'">
        <RouterLink :to="{ name: 'staffDashboard' }" class="nav-item-custom">
          <i class="bi bi-grid-fill"></i><span>ផ្ទាំងគ្រប់គ្រង</span>
        </RouterLink>
        <RouterLink :to="{ name: 'staffSalary' }" class="nav-item-custom">
          <i class="bi bi-cash-stack"></i><span>ប្រាក់ខែ</span>
        </RouterLink>


        <RouterLink :to="{ name: 'staffProfile' }" class="nav-item-custom">
          <i class="bi bi-person-circle"></i><span>ប្រវត្តិរូប</span>
        </RouterLink>
      </template>

    </div>

    <!-- Footer -->
    <div class="sidebar-footer">
      <div class="sidebar-user">
        <div class="user-avatar-box">
          <img v-if="authStore.profile?.avatar" :src="authStore.profile.avatar" />
          <span v-else>{{ userInitial }}</span>
        </div>
        <div class="overflow-hidden">
          <div class="user-name">{{ userName }}</div>
          <div class="user-role">{{ userRole }}</div>
        </div>
      </div>
      <button class="logout-btn" @click="doLogout" title="ចេញ">
        <i class="bi bi-box-arrow-right"></i>
      </button>
    </div>

  </nav>
</template>

<script setup>
import { computed } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/useAuth'
import { getRoleKey } from '@/utils/roles'
import Swal from 'sweetalert2'
import { useToast } from 'vue-toastification'


defineProps({ isOpen: Boolean, isMobile: Boolean })

const authStore = useAuthStore()
const router = useRouter()

const roleKey = computed(() => getRoleKey(authStore.profile))

const userName = computed(() => {
  const p = authStore.profile
  if (!p) return 'User'
  return (p.fullname || `${p.firstName || ''} ${p.lastName || ''}`).trim() || 'User'
})
const userInitial = computed(() => userName.value.charAt(0).toUpperCase())
const userRole = computed(() => ({
  admin: 'ADMIN',
  manager: 'MANAGER',
  staff: 'STAFF',
}[roleKey.value] || 'USER'))

const doLogout = () => {
  Swal.fire({
    title: 'តើអ្នកប្រាកដទេ?',
    text: "អ្នកនឹងត្រូវចាកចេញពីប្រព័ន្ធ!",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#2D6A4F',
    confirmButtonText: 'បាទ ចាកចេញ!',
    cancelButtonText: 'បោះបង់',
    reverseButtons: true,

    background: '#ffffff',
    color: '#1b4332'
  }).then(async (result) => {
    if (result.isConfirmed) {
      await authStore.logout()
      toast.success('ចាកចេញបានជោគជ័យ។', { timeout: 1500 })

      router.replace('/')
    }
  })
}
</script>

<style scoped>
#sidebar {
  position: fixed;
  width: var(--sidebar-width, 260px);
  height: 100vh;
  background: var(--sidebar-bg);
  display: flex;
  flex-direction: column;
  transition: transform .3s cubic-bezier(.4, 0, .2, 1);
  z-index: 1050;
  overflow-y: auto;
  overflow-x: hidden;
}

#sidebar.closed {
  transform: translateX(-100%);
}

#sidebar.open {
  transform: translateX(0);
}

/* Brand */
.sidebar-brand {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1.5rem 1rem 1.25rem;
  border-bottom: 1px solid rgba(255, 255, 255, .15);
  gap: 8px;
}

.brand-logo {
  width: 88px;
  height: 88px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid rgba(255, 255, 255, .3);
}

.brand-name {
  color: #fff;
  font-size: 25px;
  font-weight: 700;
  letter-spacing: .3px;
}

/* Nav */
.sidebar-nav {
  flex: 1;
  padding: .75rem 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.nav-item-custom {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 11px 14px;
  border-radius: 10px;
  color: rgba(255, 255, 255, .75);
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;
  cursor: pointer;
  transition: all .15s;
  font-size: 18px;
  margin: 0 6px;
}

.nav-item-custom i {
  font-size: 16px;
  flex-shrink: 0;
}

.nav-item-custom:hover,
.nav-item-custom.router-link-active {
  background: rgba(255, 255, 255, .22);
  color: #fff;
}

/* Footer */
.sidebar-footer {
  border-top: 1px solid rgba(255, 255, 255, .15);
  padding: .75rem .85rem;
  display: flex;
  align-items: center;
  gap: 8px;
}

.sidebar-user {
  display: flex;
  align-items: center;
  gap: 9px;
  flex: 1;
  min-width: 0;
}

.user-avatar-box {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: rgba(255, 255, 255, .25);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 14px;
  color: #fff;
  overflow: hidden;
  flex-shrink: 0;
}

.user-avatar-box img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-name {
  font-size: 13px;
  font-weight: 600;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-role {
  font-size: 10.5px;
  color: rgba(255, 255, 255, .55);
}

.logout-btn {
  background: rgba(255, 255, 255, .12);
  border: none;
  border-radius: 8px;
  color: rgba(255, 255, 255, .7);
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  font-size: 16px;
  transition: all .15s;
}

.logout-btn:hover {
  background: rgba(239, 68, 68, .3);
  color: #fff;
}
</style>
