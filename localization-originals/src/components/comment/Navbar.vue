<template>
  <header class="topbar d-flex justify-content-between align-items-center px-4">
    <!-- Toggle -->
    <button class="toggle-btn" @click="$emit('toggle')">
      <i class="bi bi-list fs-4"></i>
    </button>

    <!-- Welcome -->
    <span class="topbar-welcome">សូមស្វាគមន៍ <strong>{{ displayName }}</strong>!</span>

    <!-- Profile Dropdown -->
    <div class="position-relative" ref="dropRef">
      <div class="profile-pill" @click="dropOpen = !dropOpen">
        <div class="nav-avatar">
          <img v-if="authStore.profile?.avatar" :src="authStore.profile.avatar" />
          <span v-else>{{ initial }}</span>
        </div>
        <span class="nav-name d-none d-md-inline">{{ displayName }}</span>
        <i class="bi" :class="dropOpen ? 'bi-chevron-up' : 'bi-chevron-down'" style="font-size:11px;opacity:.7"></i>
      </div>

      <!-- Dropdown -->
      <div v-if="dropOpen" class="nav-dropdown">
        <div class="nav-drop-header d-flex align-items-center gap-3 ">
          <div class="nav-avatar nav-avatar-lg ">
            <img v-if="authStore.profile?.avatar" :src="authStore.profile.avatar" />
            <span v-else>{{ initial }}</span>
          </div>
          <div class="d-flex flex-column justify-content-center" style="transform: translateY(-9px);">
            <div class="fw-bold small " style="font-size:12px;color:#84A98C">{{ displayName }}</div>
            <div style="font-size:12px;color:#84A98C">{{ roleLabel }}</div>
          </div>
        </div>
        <div class="nav-drop-divider"></div>
        <RouterLink :to="profileRoute" class="nav-drop-item" @click="dropOpen=false">
          <i class="bi bi-person-circle"></i> ប្រវត្តិរូប
        </RouterLink>
        <div class="nav-drop-divider"></div>
        <button class="nav-drop-item nav-drop-logout" @click="doLogout">
          <i class="bi bi-box-arrow-right"></i> ចេញពីប្រព័ន្ធ
        </button>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/useAuth'
import { getRoleKey } from '@/utils/roles'
import Swal from 'sweetalert2'
import { useToast } from 'vue-toastification'
defineEmits(['toggle'])

const authStore = useAuthStore()
const router    = useRouter()
const toast     = useToast()
const dropOpen  = ref(false)
const dropRef   = ref(null)

const displayName = computed(() => {
  const p = authStore.profile
  if (!p) return 'User'
  return (p.fullname || `${p.firstName||''} ${p.lastName||''}`).trim() || p.email || 'User'
})

const initial = computed(() => displayName.value.charAt(0).toUpperCase())

const roleLabel = computed(() => {
  switch (getRoleKey(authStore.profile)) {
    case 'admin': return 'ADMIN'
    case 'manager': return 'MANAGER'
    case 'staff': return 'STAFF'
    default: return 'USER'
  }
})

const profileRoute = computed(() => {
  switch (getRoleKey(authStore.profile)) {
    case 'admin': return { name: 'adminProfile' }
    case 'manager': return { name: 'managerProfile' }
    case 'staff': return { name: 'staffProfile' }
    default: return { name: 'Login' }
  }
})

const doLogout = () => {
  Swal.fire({
    title: 'តើអ្នកប្រាកដទេ?',
    text: 'អ្នកនឹងត្រូវចាកចេញពីប្រព័ន្ធ!',
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

// Close dropdown on outside click
function handleOutside(e) {
  if (dropRef.value && !dropRef.value.contains(e.target)) dropOpen.value = false
}
onMounted(()   => document.addEventListener('click', handleOutside))
onBeforeUnmount(()=> document.removeEventListener('click', handleOutside))
</script>

<style scoped>
.topbar {
  font-family: var(--bs-body-font-family); 
  height: 64px;
  background: var(--sidebar-bg);
  color: white;
  position: sticky;
  top: 0;
  z-index: 999;
  box-shadow: 0 2px 8px rgba(0,0,0,.12);
}

.toggle-btn {
  font-family: inherit;
  background: none; border: none; color: white; cursor: pointer;
  width: 38px; height: 38px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  transition: background .15s;
}
.toggle-btn:hover { background: rgba(255,255,255,.15); }

.topbar-welcome { 
  font-size: 18px;             
  font-weight: 500;          
  margin-right: auto;         
  margin-left: 15px;          
  opacity: 1;                
}

.topbar-welcome strong {
  font-weight: 700;
  color: #fff;
}

.profile-pill {
  display: flex; align-items: center; gap: 8px;
  background: rgba(255,255,255,.18); border-radius: 99px;
  padding: 5px 12px 5px 5px; cursor: pointer;
  transition: background .15s; user-select: none;
}
.profile-pill:hover { background: rgba(255,255,255,.28); }

.nav-avatar {
  width: 34px; height: 34px; border-radius: 50%;
  background: rgba(255,255,255,.35);
  display: flex; align-items: center; justify-content: center;
  font-weight: 700; font-size: 14px; color: #fff;
  overflow: hidden; flex-shrink: 0;
}
.nav-avatar img { width: 100%; height: 100%; object-fit: cover; }
.nav-avatar-lg  { width: 44px; height: 44px; font-size: 18px; }

.nav-name { 
  font-family: var(--bs-body-font-family);
  font-size: 13.5px; 
  font-weight: 600; 
  color: #fff; 
}

.nav-dropdown {
  position: absolute; top: calc(100% + 10px); right: 0;
  background: #fff; border-radius: 14px;
  box-shadow: 0 8px 32px rgba(0,0,0,.16);
  min-width: 220px; z-index: 2000;
  overflow: hidden;
  animation: fadeDown .15s ease;

}
@keyframes fadeDown { from{ opacity:0; transform:translateY(-6px) } to{ opacity:1; transform:none } }

.nav-drop-header {
  display: flex; align-items: center; gap: 10px;
  padding: 14px 16px;
}
.nav-drop-header .nav-avatar { background: #84A98C; }

.nav-drop-divider { height: 1px; background: #f1f5f9; margin: 0; }

.nav-drop-item {
  font-family: var(--bs-body-font-family); 
  display: flex; align-items: center; gap: 9px;
  padding: 10px 16px; font-size: 13.5px;
  color: #374151; text-decoration: none; cursor: pointer;
  background: none; border: none; width: 100%; text-align: left;
  transition: background .12s;
  
}
.nav-drop-item:hover { background: #f0fdf4; color: #52796F; }
.nav-drop-item i { font-size: 15px; width: 18px; }

.nav-drop-logout { color: #dc2626; }
.nav-drop-logout:hover { background: #fef2f2; color: #dc2626; }
</style>
