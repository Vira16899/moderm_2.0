<template>
  <div
    class="sidebar-shell flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-white/15 bg-[#52796F] text-white shadow-xl shadow-black/10"
    :class="isCollapsed ? 'w-20' : 'w-64'"
  >
    <!-- Logo -->
    <div
      class="border-b border-white/10"
      :class="isCollapsed ? 'px-3 py-4' : 'px-5 py-5'"
    >
      <div
        class="flex items-center gap-3 transition-all duration-300 ease-out"
        :class="isCollapsed ? 'justify-center' : ''"
      >
        <div
          class="sidebar-logo flex items-center justify-center overflow-hidden border border-white/15 bg-white/10"
          :class="
            isCollapsed
              ? 'h-14 w-14 rounded-[1.35rem]'
              : 'h-14 w-14 rounded-2xl'
          "
        >
          <img
            src="@/assets/logo.png"
            alt="NoamSar logo"
            class="h-full w-full object-cover"
          />
        </div>
        <Transition name="sidebar-label">
          <div v-if="!isCollapsed" class="min-w-0">
            <h1 class="sidebar-brand-title truncate text-sm font-semibold text-white">NoamSar</h1>
            <p class="truncate text-[11px] text-white/60">
              Staff alert and safety hub
            </p>
          </div>
        </Transition>
      </div>
    </div>

    <div :class="isCollapsed ? 'px-3 pt-3' : 'px-4 pt-4'">
      <button
        type="button"
        class="sidebar-toggle flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/10 text-white hover:bg-white/15"
        :class="isCollapsed ? 'h-11' : 'h-10'"
        :title="isCollapsed ? 'Open sidebar' : 'Close sidebar'"
        @click="$emit('toggle')"
      >
        <Transition name="sidebar-icon" mode="out-in">
          <PanelLeftOpenIcon v-if="isCollapsed" key="open" class="h-5 w-5" />
          <PanelLeftCloseIcon v-else key="close" class="h-5 w-5" />
        </Transition>
        <Transition name="sidebar-label">
          <span v-if="!isCollapsed" class="text-xs font-medium">Sidebar</span>
        </Transition>
      </button>
    </div>

    <!-- Navigation -->
    <nav
      class="flex-1 overflow-y-auto"
      :class="isCollapsed ? 'space-y-2 px-3 py-3' : 'space-y-2 p-4'"
    >
      <router-link
        v-for="item in filteredNavItems"
        :key="item.path"
        :to="item.path"
        class="sidebar-nav-item group flex items-center gap-3 rounded-2xl border border-transparent"
        :class="[
          isCollapsed ? 'justify-center px-1.5 py-2' : 'px-3 py-2.5',
          $route.path === item.path || $route.path.startsWith(item.path + '/')
            ? 'border-white/15 bg-[#84A98C] text-white shadow-md shadow-black/10'
            : 'text-white/80 hover:border-white/10 hover:bg-white/10 hover:text-white',
        ]"
      >
        <span
          class="sidebar-icon-tile flex shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/10"
          :class="isCollapsed ? 'h-10 w-10' : 'h-9 w-9'"
        >
          <component :is="item.icon" class="w-5 h-5" />
        </span>
        <Transition name="sidebar-label">
          <span
            v-if="!isCollapsed"
            class="min-w-0 flex-1 truncate text-sm font-medium"
            >{{ item.label }}</span
          >
        </Transition>
      </router-link>
    </nav>

    <!-- អ្នកប្រើប្រាស់ Info -->
    <div class="border-t border-white/10" :class="isCollapsed ? 'p-3' : 'p-4'">
      <div
        class="rounded-3xl border border-white/10 bg-white/10"
        :class="
          isCollapsed
            ? 'flex flex-col items-center gap-3 px-2 py-3'
            : 'flex items-center gap-3 px-3 py-3'
        "
      >
        <div
          class="sidebar-avatar w-10 h-10 rounded-xl flex items-center justify-center text-white bg-[#84A98C] overflow-hidden"
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
        <Transition name="sidebar-label">
          <div v-if="!isCollapsed" class="min-w-0 flex-1">
            <p class="truncate text-sm text-white font-medium">
              {{ user?.fullName || "អ្នកប្រើប្រាស់" }}
            </p>
            <p class="text-xs text-white/60 uppercase tracking-wider">
              {{ user?.role || "បុគ្គលិក" }}
            </p>
          </div>
        </Transition>
        <button
          type="button"
          class="sidebar-logout flex shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-red-200 hover:bg-white/15"
          :class="isCollapsed ? 'h-11 w-11' : 'h-9 w-9'"
          title="Logout"
          @click="showLogoutDialog = true"
        >
          <LogOutIcon class="h-4 w-4" />
        </button>
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
      @confirm="handleLogout"
    />
  </div>
</template>

<script setup>
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { useToastStore } from "@/stores/toast";
import {
  LayoutDashboard as LayoutDashboardIcon,
  Users as UsersIcon,
  UsersRound as UsersRoundIcon,
  FileText as FileTextIcon,
  Bell as BellIcon,
  User as UserIcon,
  MessageSquare as MessageSquareIcon,
  DollarSign as DollarSignIcon,
  LogOut as LogOutIcon,
  PanelLeftClose as PanelLeftCloseIcon,
  PanelLeftOpen as PanelLeftOpenIcon,
} from "lucide-vue-next";
import ConfirmDialog from "@/components/common/ConfirmDialog.vue";

defineProps({
  isCollapsed: {
    type: Boolean,
    default: false,
  },
});

defineEmits(["toggle"]);

const authStore = useAuthStore();
const toastStore = useToastStore();
const router = useRouter();
const user = computed(() => authStore.user);
const showLogoutDialog = ref(false);

const handleLogout = async () => {
  try {
    showLogoutDialog.value = false;
    await authStore.logout();
    toastStore.success("ចាកចេញបានជោគជ័យ");
    router.push("/login");
  } catch (err) {
    toastStore.error("មានបញ្ហាក្នុងការចាកចេញ");
  }
};

const navItems = [
  {
    path: "/dashboard",
    label: "ផ្ទាំងគ្រប់គ្រង",
    icon: LayoutDashboardIcon,
    roles: ["ADMIN", "MANAGER", "STAFF"],
  },
  {
    path: "/admin/users",
    label: "អ្នកប្រើប្រាស់",
    icon: UsersIcon,
    roles: ["ADMIN"],
  },
  {
    path: "/admin/groups",
    label: "ក្រុម",
    icon: UsersRoundIcon,
    roles: ["ADMIN"],
  },
  {
    path: "/admin/reports",
    label: "របាយការណ៍លទ្ធផលការងារ",
    icon: FileTextIcon,
    roles: ["ADMIN"],
  },
  {
    path: "/manager/staff",
    label: "បុគ្គលិករបស់ខ្ញុំ",
    icon: UsersIcon,
    roles: ["MANAGER"],
  },
  {
    path: "/manager/groups",
    label: "ក្រុមរបស់ខ្ញុំ",
    icon: UsersRoundIcon,
    roles: ["MANAGER"],
  },
  {
    path: "/manager/reports",
    label: "របាយការណ៍លទ្ធផលការងារ",
    icon: FileTextIcon,
    roles: ["MANAGER"],
  },
  {
    path: "/staff/salary-history",
    label: "ប្រវត្តិប្រាក់បៀវត្ស",
    icon: DollarSignIcon,
    roles: ["STAFF"],
  },
  {
    path: "/notifications",
    label: "ការជូនដំណឹង",
    icon: BellIcon,
    roles: ["ADMIN", "MANAGER"],
  },
  {
    path: "/profile",
    label: "ព័ត៌មានផ្ទាល់ខ្លួន",
    icon: UserIcon,
    roles: ["ADMIN", "MANAGER", "STAFF"],
  },
  {
    path: "/telegram",
    label: "តេឡេក្រាម",
    icon: MessageSquareIcon,
    roles: ["ADMIN", "MANAGER"],
  },
];

const filteredNavItems = computed(() => {
  return navItems.filter((item) =>
    user.value?.role ? item.roles.includes(user.value.role) : false,
  );
});
</script>

<style scoped>
.sidebar-shell {
  transition: width 0.38s cubic-bezier(0.22, 1, 0.36, 1);
  will-change: width;
}

.sidebar-logo,
.sidebar-toggle,
.sidebar-nav-item,
.sidebar-icon-tile,
.sidebar-avatar,
.sidebar-logout {
  transition:
    width 0.28s cubic-bezier(0.22, 1, 0.36, 1),
    height 0.28s cubic-bezier(0.22, 1, 0.36, 1),
    padding 0.28s cubic-bezier(0.22, 1, 0.36, 1),
    border-radius 0.28s ease,
    background-color 0.18s ease,
    border-color 0.18s ease,
    color 0.18s ease,
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.sidebar-nav-item:hover .sidebar-icon-tile,
.sidebar-toggle:hover,
.sidebar-logout:hover {
  transform: translateY(-1px);
}

.sidebar-icon-enter-active,
.sidebar-icon-leave-active {
  transition:
    opacity 0.12s ease,
    transform 0.16s cubic-bezier(0.22, 1, 0.36, 1);
}

.sidebar-icon-enter-from {
  opacity: 0;
  transform: rotate(-12deg) scale(0.86);
}

.sidebar-icon-leave-to {
  opacity: 0;
  transform: rotate(12deg) scale(0.86);
}

.sidebar-brand-title {
  color: #ffffff !important;
}

.sidebar-label-enter-active {
  transition:
    opacity 0.2s ease 0.12s,
    transform 0.26s cubic-bezier(0.22, 1, 0.36, 1) 0.12s;
}

.sidebar-label-leave-active {
  transition:
    opacity 0.14s ease,
    transform 0.18s ease;
}

.sidebar-label-enter-from,
.sidebar-label-leave-to {
  opacity: 0;
  transform: translateX(-0.5rem);
}

.sidebar-label-enter-to,
.sidebar-label-leave-from {
  opacity: 1;
  transform: translateX(0);
}
</style>
