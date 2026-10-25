<template>
  <div
    class="creative-topbar mx-3 mt-3 flex min-h-20 items-center justify-between gap-4 rounded-[1.75rem] border px-6 transition-colors"
  >
    <div class="relative z-10 min-w-0 flex-1">
      <div
        class="creative-breadcrumb inline-flex min-w-0 items-center gap-2 rounded-2xl px-3 py-2 text-sm font-semibold"
      >
        <span class="truncate uppercase">{{ user?.role || "STAFF" }}</span>
        <ChevronRightIcon class="h-4 w-4 shrink-0 opacity-60" />
        <span class="truncate">{{ pageTitle }}</span>
      </div>
    </div>

    <div
      class="creative-date-pill relative z-10 hidden items-center gap-3 rounded-full border px-4 py-2.5 md:flex"
    >
      <CalendarDaysIcon class="h-4 w-4 text-[#2f8f68]" />
      <span class="text-sm font-semibold">Today, {{ todayLabel }}</span>
    </div>

    <div class="relative z-10 flex items-center gap-3">
      <button
        type="button"
        class="theme-switch"
        :class="{ 'theme-switch--dark': isDark }"
        :title="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
        :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
        :aria-pressed="isDark"
        @click="toggleTheme"
      >
        <span class="theme-switch__icon theme-switch__icon--sun">
          <SunIcon class="h-3.5 w-3.5" />
        </span>
        <span class="theme-switch__thumb">
          <SunIcon v-if="!isDark" class="h-3.5 w-3.5" />
          <MoonIcon v-else class="h-3.5 w-3.5" />
        </span>
        <span class="theme-switch__icon theme-switch__icon--moon">
          <MoonIcon class="h-3.5 w-3.5" />
        </span>
      </button>

      <div ref="profileMenuRef" class="relative">
        <button
          type="button"
          @click="showProfileMenu = !showProfileMenu"
          class="creative-profile-button flex items-center gap-2 rounded-full border p-1.5 pr-3 transition-colors"
          :aria-expanded="showProfileMenu"
          aria-haspopup="menu"
        >
          <div
            class="w-8 h-8 rounded-lg flex items-center justify-center text-white bg-[#84A98C] overflow-hidden"
          >
            <img
              v-if="user?.avatar"
              :src="user.avatar"
              class="w-full h-full object-cover"
              alt="Avatar"
            />
            <span v-else>
              {{ user?.fullName?.charAt(0) || "U" }}
            </span>
          </div>
          <span
            class="hidden sm:block max-w-40 truncate text-sm font-semibold"
            >{{ user?.fullName || "អ្នកប្រើប្រាស់" }}</span
          >
          <ChevronDownIcon
            class="h-4 w-4 opacity-60 transition-transform duration-200"
            :class="{ 'rotate-180': showProfileMenu }"
          />
        </button>

        <!-- Dropdown Menu -->
        <Transition name="profile-menu">
          <div
            v-if="showProfileMenu"
            class="creative-profile-menu absolute right-0 mt-3 w-72 overflow-hidden rounded-3xl border shadow-xl"
            role="menu"
          >
            <div class="p-4 border-b">
              <p class="truncate font-semibold">
                {{ user?.fullName || "អ្នកប្រើប្រាស់" }}
              </p>
              <p class="truncate text-sm opacity-70">
                {{ user?.email || "" }}
              </p>
              <p class="mt-1 text-xs uppercase tracking-wider opacity-50">
                {{ user?.role || "បុគ្គលិក" }}
              </p>
            </div>
            <div class="p-2">
              <router-link
                to="/profile"
                class="creative-profile-menu-item flex items-center gap-2 rounded-2xl px-3 py-2 transition-colors"
                role="menuitem"
                @click="showProfileMenu = false"
              >
                <UserIcon class="w-4 h-4" />
                <span class="text-sm">ព័ត៌មានផ្ទាល់ខ្លួន</span>
              </router-link>
            </div>
            <div class="p-2 border-t">
              <button
                type="button"
                @click="handleLogoutClick"
                class="creative-profile-menu-item creative-profile-menu-item--danger flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-left transition-colors"
                role="menuitem"
              >
                <LogOutIcon class="w-4 h-4" />
                <span class="text-sm">ចាកចេញ</span>
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </div>

    <ConfirmDialog
      :is-open="showLogoutDialog"
      title="បញ្ជាក់ការចាកចេញ"
      message="តើអ្នកប្រាកដជាចង់ចាកចេញមែនទេ?"
      confirm-text="ចាកចេញ"
      cancel-text="បោះបង់"
      variant="danger"
      @close="showLogoutDialog = false"
      @confirm="confirmLogout"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { useToastStore } from "@/stores/toast";
import {
  ChevronRight as ChevronRightIcon,
  ChevronDown as ChevronDownIcon,
  User as UserIcon,
  LogOut as LogOutIcon,
  Moon as MoonIcon,
  Sun as SunIcon,
  CalendarDays as CalendarDaysIcon,
} from "lucide-vue-next";
import ConfirmDialog from "../common/ConfirmDialog.vue";
import { useTheme } from "@/composables/useTheme";

const authStore = useAuthStore();
const toastStore = useToastStore();
const router = useRouter();
const route = useRoute();

const user = computed(() => authStore.user);
const showProfileMenu = ref(false);
const showLogoutDialog = ref(false);
const profileMenuRef = ref(null);
const { isDark, toggleTheme } = useTheme();

const pageTitles = {
  Dashboard: "Dashboard",
  AdminUsers: "Users",
  AdminUserDetail: "User Detail",
  AdminGroups: "Groups",
  AdminReports: "Reports",
  ManagerStaff: "Staff",
  ManagerStaffDetail: "Staff Detail",
  ManagerGroups: "Groups",
  ManagerReports: "Reports",
  StaffSalaryHistory: "Salary History",
  Notifications: "Notifications",
  Profile: "Profile",
  Telegram: "Telegram",
};

const pageTitle = computed(() => pageTitles[route.name] || "Menu");
const todayLabel = new Date().toLocaleDateString(undefined, {
  weekday: "short",
  month: "short",
  day: "numeric",
});

const handleLogoutClick = () => {
  showLogoutDialog.value = true;
  showProfileMenu.value = false;
};

const confirmLogout = async () => {
  try {
    await authStore.logout();
    toastStore.success("ចាកចេញបានជោគជ័យ");
    router.push("/login");
  } catch (err) {
    toastStore.error("មានបញ្ហាក្នុងការចាកចេញ");
  }
};

const handleClickOutside = (e) => {
  if (showProfileMenu.value && !profileMenuRef.value?.contains(e.target)) {
    showProfileMenu.value = false;
  }
};

onMounted(() => {
  window.addEventListener("click", handleClickOutside);
});

onUnmounted(() => {
  window.removeEventListener("click", handleClickOutside);
});
</script>
