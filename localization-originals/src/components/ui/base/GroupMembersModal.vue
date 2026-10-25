<template>
  <BaseModal
    :is-open="isOpen"
    :title="`គ្រប់គ្រងសមាជិក - ${groupName}`"
    size="lg"
    @close="$emit('close')"
  >
    <div class="space-y-8">
      <!-- Add Members -->
      <div>
        <h4
          class="text-sm font-normal text-gray-400 uppercase tracking-widest mb-4"
        >
          បន្ថែមសមាជិកថ្មី
        </h4>
        <div
          class="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar"
        >
          <div
            v-for="user in availableUsers"
            :key="user.id"
            class="flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer"
            :class="
              selectedUsersToAdd.includes(user.id)
                ? 'bg-[#84A98C]/10 border-[#84A98C]/30'
                : 'bg-gray-50 border-gray-100 hover:border-gray-200'
            "
            @click="toggleUserToAdd(user.id)"
          >
            <div
              class="relative w-8 h-8 shrink-0 overflow-hidden rounded-full bg-[#84A98C] flex items-center justify-center text-xs font-normal text-white"
            >
              <span>{{ getInitial(user) }}</span>
              <img
                v-if="getAvatarUrl(user)"
                :src="getAvatarUrl(user)"
                :alt="`${user.fullName || user.email || 'User'} avatar`"
                class="absolute inset-0 h-full w-full object-cover"
                @error="hideBrokenAvatar"
              />
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-normal text-gray-900 truncate">
                {{ user.fullName }}
              </p>
              <p class="text-xs text-gray-500 truncate">{{ user.email }}</p>
            </div>
            <div
              class="w-5 h-5 rounded border flex items-center justify-center transition-colors"
              :class="
                selectedUsersToAdd.includes(user.id)
                  ? 'bg-[#84A98C] border-[#84A98C]'
                  : 'border-gray-300'
              "
            >
              <CheckIcon
                v-if="selectedUsersToAdd.includes(user.id)"
                class="w-3 h-3 text-white"
              />
            </div>
          </div>
        </div>
        <button
          v-if="selectedUsersToAdd.length > 0"
          @click="handleAddMembers"
          :disabled="loading"
          class="mt-4 w-full py-2.5 bg-[#84A98C] text-white rounded-lg font-normal hover:opacity-90 transition-all shadow-md disabled:opacity-50"
        >
          បន្ថែមសមាជិកដែលបានជ្រើសរើសចំនួន {{ selectedUsersToAdd.length }}
        </button>
      </div>

      <!-- Current Members -->
      <div>
        <h4
          class="text-sm font-normal text-gray-400 uppercase tracking-widest mb-4"
        >
          សមាជិកបច្ចុប្បន្ន ({{ currentMembers.length }})
        </h4>
        <div
          v-if="currentMembers.length > 0"
          class="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar"
        >
          <div
            v-for="user in currentMembers"
            :key="user.id"
            class="flex items-center gap-3 p-3 rounded-lg border bg-gray-50 border-gray-100 group"
          >
            <div
              class="relative w-8 h-8 shrink-0 overflow-hidden rounded-full bg-gray-200 flex items-center justify-center text-xs font-normal text-gray-500"
            >
              <span>{{ getInitial(user) }}</span>
              <img
                v-if="getAvatarUrl(user)"
                :src="getAvatarUrl(user)"
                :alt="`${user.fullName || user.email || 'User'} avatar`"
                class="absolute inset-0 h-full w-full object-cover"
                @error="hideBrokenAvatar"
              />
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-normal text-gray-900 truncate">
                {{ user.fullName }}
              </p>
              <p class="text-xs text-gray-500 truncate">{{ user.email }}</p>
            </div>
            <button
              @click="$emit('remove-member', user.id)"
              class="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
            >
              <UserMinusIcon class="w-4 h-4" />
            </button>
          </div>
        </div>
        <p
          v-else
          class="text-center py-8 text-gray-400 italic border border-dashed border-gray-200 rounded-xl"
        >
          មិនមានសមាជិកក្នុងក្រុមនេះទេ។
        </p>
      </div>
    </div>
  </BaseModal>
</template>

<script setup>
import { ref, watch } from "vue";
import {
  Check as CheckIcon,
  UserMinus as UserMinusIcon,
} from "lucide-vue-next";
import { DEFAULT_API_BASE_URL } from "@/api/api";
import BaseModal from "@/components/ui/base/BaseModal.vue";

const props = defineProps({
  isOpen: Boolean,
  loading: Boolean,
  groupName: {
    type: String,
    default: "",
  },
  availableUsers: {
    type: Array,
    default: () => [],
  },
  currentMembers: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(["close", "add-members", "remove-member"]);

const selectedUsersToAdd = ref([]);

const toggleUserToAdd = (id) => {
  const index = selectedUsersToAdd.value.indexOf(id);
  if (index === -1) selectedUsersToAdd.value.push(id);
  else selectedUsersToAdd.value.splice(index, 1);
};

const handleAddMembers = () => {
  if (!selectedUsersToAdd.value.length || props.loading) return;

  emit("add-members", [...selectedUsersToAdd.value]);
  selectedUsersToAdd.value = [];
};

watch(
  () => props.isOpen,
  (isOpen) => {
    if (!isOpen) {
      selectedUsersToAdd.value = [];
    }
  },
);

watch(
  () => props.availableUsers.map((user) => String(user.id)),
  (availableIds) => {
    const availableIdSet = new Set(availableIds);
    selectedUsersToAdd.value = selectedUsersToAdd.value.filter((id) =>
      availableIdSet.has(String(id)),
    );
  },
);

const getInitial = (user) =>
  String(user?.fullName || user?.email || "?").trim().charAt(0).toUpperCase();

const getAvatarUrl = (user) => {
  const avatar =
    user?.avatar ||
    user?.avatarUrl ||
    user?.avatar_url ||
    user?.profileImage ||
    user?.profile_image ||
    user?.photo ||
    "";

  if (!avatar) return "";

  try {
    return new URL(avatar, DEFAULT_API_BASE_URL).href;
  } catch {
    return avatar;
  }
};

const hideBrokenAvatar = (event) => {
  event.currentTarget.style.display = "none";
};
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.2);
}
</style>
