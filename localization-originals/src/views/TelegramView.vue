<template>
  <div class="space-y-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">ការតភ្ជាប់ Telegram</h1>
      <p class="text-gray-500">
        ភ្ជាប់គណនី Telegram របស់អ្នកដើម្បីទទួលបានការជូនដំណឹង
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <!-- Status Card -->
      <div class="bg-white border border-gray-100 rounded-xl p-8 shadow-sm">
        <div class="flex items-center gap-4 mb-8">
          <div
            class="w-14 h-14 bg-[#84A98C] rounded-full flex items-center justify-center shadow-lg"
          >
            <MessageSquareIcon class="w-7 h-7 text-white" />
          </div>
          <div>
            <h3 class="text-xl font-bold text-gray-900">ស្ថានភាពការតភ្ជាប់</h3>
            <p
              class="text-sm"
              :class="isConnected ? 'text-emerald-500' : 'text-gray-400'"
            >
              {{ isConnected ? "បានតភ្ជាប់" : "មិនទាន់បានតភ្ជាប់" }}
            </p>
          </div>
        </div>

        <div v-if="isConnected" class="space-y-6">
          <div class="bg-emerald-50 border border-emerald-100 rounded-lg p-4">
            <div class="flex items-start gap-3">
              <CheckCircleIcon
                class="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5"
              />
              <div>
                <p class="text-sm font-bold text-emerald-600 mb-1">
                  បានតភ្ជាប់ដោយជោគជ័យ
                </p>
                <p class="text-xs text-emerald-600/70">
                  គណនី Telegram របស់អ្នកត្រូវបានភ្ជាប់។
                  អ្នកនឹងទទួលបានការជូនដំណឹងតាមរយៈ Telegram។
                </p>
              </div>
            </div>
          </div>

          <div class="bg-gray-50 rounded-lg p-4 border border-gray-100">
            <h4
              class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2"
            >
              គណនីដែលបានភ្ជាប់
            </h4>
            <p class="text-sm text-gray-900 font-bold">
              @{{ user?.email?.split("@")[0] }}_telegram
            </p>
          </div>

          <button
            @click="handleDisconnect"
            :disabled="disconnecting"
            class="w-full bg-red-50 text-red-600 border border-red-100 py-3 rounded-lg font-semibold hover:bg-red-100 transition-all disabled:opacity-50"
          >
            {{
              disconnecting
                ? "កំពុងផ្តាច់ការតភ្ជាប់..."
                : "ផ្តាច់ការតភ្ជាប់ Telegram"
            }}
          </button>
        </div>

        <div v-else class="space-y-6">
          <div class="bg-gray-50 border border-gray-100 rounded-lg p-6">
            <p class="text-sm text-gray-600 font-medium mb-4">
              ភ្ជាប់គណនី Telegram របស់អ្នកដើម្បីទទួលបានការជូនដំណឹងភ្លាមៗអំពី៖
            </p>
            <ul class="space-y-3 text-sm text-gray-500">
              <li class="flex items-center gap-3 font-medium">
                <span class="w-1.5 h-1.5 bg-[#84A98C] rounded-full" />
                ការធ្វើបច្ចុប្បន្នភាពរបាយការណ៍លទ្ធផលការងារ
              </li>
              <li class="flex items-center gap-3 font-medium">
                <span class="w-1.5 h-1.5 bg-[#84A98C] rounded-full" />
                ការជូនដំណឹងអំពីសកម្មភាពក្រុម
              </li>
              <li class="flex items-center gap-3 font-medium">
                <span class="w-1.5 h-1.5 bg-[#84A98C] rounded-full" />
                ការដាស់តឿនប្រព័ន្ធ និងការប្រកាស
              </li>
            </ul>
          </div>

          <button
            @click="handleGetLinkingUrl"
            :disabled="loading"
            class="w-full flex items-center justify-center gap-2 bg-[#84A98C] text-white py-3 rounded-lg font-semibold hover:opacity-90 transition-all disabled:opacity-50 shadow-lg"
          >
            <LinkIcon class="w-4 h-4" />
            {{ loading ? "កំពុងបង្កើតតំណភ្ជាប់..." : "ភ្ជាប់ Telegram" }}
          </button>
        </div>
      </div>

      <!-- How to Connect -->
      <div class="bg-white border border-gray-100 rounded-xl p-8 shadow-sm">
        <h3 class="text-xl font-bold text-gray-900 mb-8">របៀបភ្ជាប់</h3>
        <div class="space-y-8">
          <div v-for="(step, index) in steps" :key="index" class="flex gap-4">
            <div
              class="w-8 h-8 bg-[#84A98C]/10 text-[#84A98C] rounded-full flex items-center justify-center flex-shrink-0 font-bold border border-[#84A98C]/20"
            >
              {{ index + 1 }}
            </div>
            <div>
              <p class="text-gray-900 font-bold mb-1">{{ step.title }}</p>
              <p class="text-sm text-gray-500 font-medium">{{ step.desc }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Connect Modal -->
    <TelegramConnectModal
      :is-open="showConnectModal"
      :linking-url="linkingUrl"
      @close="handleConnectModalClose"
      @copy="handleCopyLink"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useAuthStore } from "@/stores/auth";
import { useToastStore } from "@/stores/toast";
import {
  MessageSquare as MessageSquareIcon,
  Link as LinkIcon,
  CheckCircle as CheckCircleIcon,
} from "lucide-vue-next";
import TelegramConnectModal from "@/components/ui/base/TelegramConnectModal.vue";
import { telegramApi } from "@/api/api";

const authStore = useAuthStore();
const toastStore = useToastStore();
const user = computed(() => authStore.user);

const isConnected = ref(false);
const showConnectModal = ref(false);
const linkingUrl = ref("");
const loading = ref(false);
const disconnecting = ref(false);

const steps = [
  {
    title: 'ចុចលើ "ភ្ជាប់ Telegram"',
    desc: "វានឹងបង្កើតតំណភ្ជាប់ URL តែមួយគត់សម្រាប់គណនីរបស់អ្នក",
  },
  {
    title: "បើកតំណភ្ជាប់",
    desc: "ចុចប៊ូតុង ឬចម្លងតំណភ្ជាប់ទៅកាន់កម្មវិធី Telegram របស់អ្នក",
  },
  {
    title: "ចាប់ផ្តើម Bot",
    desc: 'ចុចលើ "Start" ក្នុងប្រអប់សារ Telegram ដើម្បីបញ្ចប់ការតភ្ជាប់',
  },
];

const getResponseData = (response) => response.data?.data || response.data;

const getTelegramLink = (data) =>
  data.link || data.url || data.linkingUrl || data.linking_url || "";

const getTelegramConnectedStorageKey = () => {
  const userId =
    user.value?.id || user.value?._id || user.value?.email || "current";

  return `telegram-connected:${userId}`;
};

const hasTelegramConnectionData = (profile) => {
  if (!profile) return false;

  return Boolean(
    profile.telegramConnected ||
      profile.telegram_connected ||
      profile.isTelegramConnected ||
      profile.is_telegram_connected ||
      profile.hasTelegramConnected ||
      profile.telegramChatId ||
      profile.telegram_chat_id ||
      profile.telegramId ||
      profile.telegram_id ||
      profile.telegramUsername ||
      profile.telegram_username ||
      profile.telegram?.connected ||
      profile.telegram?.chatId ||
      profile.telegram?.chat_id ||
      profile.telegram?.id ||
      profile.telegram?.username,
  );
};

const getStoredConnectionState = () =>
  localStorage.getItem(getTelegramConnectedStorageKey()) === "true";

const setStoredConnectionState = (connected) => {
  const storageKey = getTelegramConnectedStorageKey();

  if (connected) {
    localStorage.setItem(storageKey, "true");
    return;
  }

  localStorage.removeItem(storageKey);
};

const syncConnectionState = () => {
  isConnected.value =
    hasTelegramConnectionData(user.value) || getStoredConnectionState();
};

onMounted(async () => {
  syncConnectionState();

  try {
    await authStore.fetchProfile();
    syncConnectionState();
  } catch {
    // Keep the stored connection state if profile refresh fails.
  }
});

const handleGetLinkingUrl = async () => {
  loading.value = true;

  try {
    const response = await telegramApi.connect();
    const link = getTelegramLink(getResponseData(response));

    if (!link) {
      toastStore.error("មិនអាចបង្កើតតំណភ្ជាប់ Telegram បានទេ");
      return;
    }

    linkingUrl.value = link;
    showConnectModal.value = true;
  } catch (err) {
    toastStore.error(
      err.response?.data?.message || "មិនអាចភ្ជាប់ Telegram បានទេ",
    );
  } finally {
    loading.value = false;
  }
};

const handleCopyLink = () => {
  navigator.clipboard
    .writeText(linkingUrl.value)
    .then(() => toastStore.success("បានចម្លងតំណភ្ជាប់ទៅកាន់ Clipboard"))
    .catch(() => toastStore.error("ការចម្លងតំណភ្ជាប់បានបរាជ័យ"));
};

const handleConnectModalClose = () => {
  showConnectModal.value = false;
  isConnected.value = true;
  setStoredConnectionState(true);
};

const handleDisconnect = async () => {
  disconnecting.value = true;

  try {
    await telegramApi.disconnect();
    isConnected.value = false;
    setStoredConnectionState(false);
    linkingUrl.value = "";
    toastStore.success("បានផ្តាច់ការតភ្ជាប់ Telegram ដោយជោគជ័យ");
  } catch (err) {
    toastStore.error(
      err.response?.data?.message || "មិនអាចផ្តាច់ការតភ្ជាប់ Telegram បានទេ",
    );
  } finally {
    disconnecting.value = false;
  }
};
</script>
