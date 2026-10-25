<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue';
import { Moon, Sun, Menu, ChevronRight, ChevronDown, Search, UserRound, LogOut } from 'lucide-vue-next';
import UserAvatar from '../common/UserAvatar.vue';
import { getNavigationItems } from '../../data/navigation';
const props = defineProps(['currentRole', 'currentUser', 'activeSection', 'onNavigate', 'theme', 'onToggleTheme', 'notifications', 'onOpenNotifications', 'onOpenProfile', 'onLogoutClick', 'onToggleSidebar', 'sidebarOpen']);
const profile = ref(null);
const profileTrigger = ref(null);
const profileOpen = ref(false);
const name = computed(() => props.currentUser?.nameKh || props.currentUser?.nameEn || 'គណនីរបស់ខ្ញុំ');
const role = computed(() => ({ ADMIN: 'អ្នកគ្រប់គ្រងប្រព័ន្ធ', MANAGER: 'ប្រធានផ្នែក', EMPLOYEE: 'បុគ្គលិក' })[props.currentRole]);

async function toggleProfile() {
  profileOpen.value = !profileOpen.value;
  searchOpen.value = false;
  if (profileOpen.value) { await nextTick(); profile.value?.querySelector('.profile-menu button')?.focus(); }
}
function closeProfile(restore = false) { profileOpen.value = false; if (restore) profileTrigger.value?.focus(); }
function profileAction(action) { closeProfile(true); action?.(); }
function profileKeys(event) {
  if (event.key === 'Escape') { event.stopPropagation(); closeProfile(true); }
  if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
    event.preventDefault();
    const buttons = [...profile.value.querySelectorAll('.profile-menu button')];
    const index = buttons.indexOf(document.activeElement);
    buttons[event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : (index + (event.key === 'ArrowUp' ? -1 : 1) + buttons.length) % buttons.length]?.focus();
  }
}
const search = ref(null);
const query = ref('');
const searchOpen = ref(false);
const navigation = computed(() => getNavigationItems(props.currentRole));
const results = computed(() => navigation.value.filter(item => item.labelKh.includes(query.value.trim())));
const currentPage = computed(() => navigation.value.find(item => item.id === props.activeSection)?.labelKh || 'ទិដ្ឋភាពទូទៅ');
function navigate(item) {
  if (!item) return;
  props.onNavigate(item.id);
  query.value = '';
  searchOpen.value = false;
}

function close(event) {
  if (!search.value?.contains(event.target)) searchOpen.value = false;
  if (!profile.value?.contains(event.target)) closeProfile();
}
onMounted(() => document.addEventListener('pointerdown', close));
onUnmounted(() => document.removeEventListener('pointerdown', close));
</script>
<template>
  <header id="main-app-header" class="app-header">
    <div class="header-leading"><button id="header-sidebar-toggle-btn" class="icon-button" aria-label="បើក ឬបិទម៉ឺនុយ" :aria-expanded="sidebarOpen" aria-controls="workspace-sidebar" @click="onToggleSidebar"><Menu :size="19"/></button><nav aria-label="ទីតាំងទំព័រ" class="header-breadcrumb"><span>កន្លែងការងារ</span><ChevronRight :size="12" aria-hidden="true"/><strong aria-current="page">{{ currentPage }}</strong></nav></div>
    <div class="header-controls">
      <form ref="search" role="search" class="header-search" @submit.prevent="navigate(results[0])" @keydown.esc="searchOpen = false" @focusout="event => { if (!search?.contains(event.relatedTarget)) searchOpen = false; }">
        <Search :size="17" aria-hidden="true" />
        <input v-model="query" type="search" aria-label="ស្វែងរកទំព័រ" placeholder="ស្វែងរក..." autocomplete="off" @focus="searchOpen = true" @input="searchOpen = true" />
        <div v-if="searchOpen" class="search-results">
          <span class="search-caption">ទំព័ររបស់អ្នក</span>
          <button v-for="item in results" :key="item.id" type="button" @click="navigate(item)"><component :is="item.icon" :size="16" />{{ item.labelKh }}<ChevronRight :size="13" /></button>
          <p v-if="!results.length">រកមិនឃើញទំព័រទេ។</p>
        </div>
      </form>
      <button id="header-theme-toggle-btn" class="icon-button" :aria-label="theme === 'dark' ? 'ប្រើផ្ទៃភ្លឺ' : 'ប្រើផ្ទៃងងឹត'" @click="onToggleTheme"><Sun v-if="theme === 'dark'" :size="18"/><Moon v-else :size="18"/></button>
      <span class="header-divider"></span>
      <div ref="profile" class="header-profile" @keydown="profileKeys" @focusout="event => { if (!profile?.contains(event.relatedTarget)) closeProfile(); }">
        <button id="header-profile-menu-btn" ref="profileTrigger" class="header-avatar" :aria-expanded="profileOpen" aria-controls="header-profile-panel" aria-label="ម៉ឺនុយគណនីរបស់ខ្ញុំ" @click="toggleProfile"><UserAvatar :src="currentUser?.avatar" :name="name" :size="34"/><span class="header-user-name">{{ name }}</span><ChevronDown :size="14" aria-hidden="true"/></button>
        <div v-if="profileOpen" id="header-profile-panel" class="profile-menu">
          <div><strong>{{ name }}</strong><small>{{ currentUser?.email || role }}</small><small v-if="currentUser?.email">{{ role }}</small></div>
          <button type="button" @click="profileAction(onOpenProfile)"><UserRound :size="17"/>ព័ត៌មានគណនីខ្ញុំ</button>
          <button type="button" class="danger-link" @click="profileAction(onLogoutClick)"><LogOut :size="17"/>ចាកចេញពីប្រព័ន្ធ</button>
        </div>
      </div>
    </div>
  </header>
</template>
