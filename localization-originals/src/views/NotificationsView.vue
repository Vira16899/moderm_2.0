<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-3xl font-normal text-gray-900 mb-2">ការជូនដំណឹង</h1>
        <p class="text-gray-500">
          {{
            unreadCount > 0
              ? `អ្នកមាន ${unreadCount} ការជូនដំណឹងដែលមិនទាន់អាន`
              : "អ្នកបានអានការជូនដំណឹងទាំងអស់ហើយ!"
          }}
        </p>
        <p class="text-xs text-gray-400 mt-1">
          Birthday and work anniversary alerts are generated daily at 08:00 AM.
        </p>
      </div>
      <button
        v-if="unreadCount > 0"
        @click="handleMarkAllAsRead"
        class="flex items-center gap-2 px-6 py-2.5 bg-[#84A98C] text-white rounded-lg font-normal hover:opacity-90 transition-all shadow-md"
      >
        <CheckCheckIcon class="w-4 h-4" />
        សម្គាល់ទាំងអស់ថាបានអាន
      </button>
    </div>

    <div class="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
      <label class="flex items-center gap-3 text-sm text-gray-600">
        <input
          v-model="showUnreadOnly"
          type="checkbox"
          class="h-4 w-4 rounded border-gray-300 text-[#84A98C] focus:ring-[#84A98C]"
        />
        បង្ហាញតែការជូនដំណឹងមិនទាន់អាន
      </label>
    </div>

    <div
      v-if="isLoadingNotifications"
      class="bg-white border border-gray-100 rounded-xl p-5 shadow-sm"
    >
      <SkeletonLoader type="list" :rows="6" />
    </div>

    <div
      v-else-if="sortedNotifications.length > 0"
      class="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm divide-y divide-gray-50"
    >
      <div
        v-for="notification in sortedNotifications"
        :key="notification.id"
        class="p-5 flex items-start gap-4 hover:bg-gray-50/50 transition-all group"
        :class="{ 'bg-gray-50/50': !notification.isRead }"
      >
        <div class="mt-1 flex-shrink-0">
          <div
            class="w-10 h-10 rounded-full flex items-center justify-center border transition-colors"
            :class="
              notification.isRead
                ? 'bg-gray-50 border-gray-100 text-gray-400'
                : 'bg-[#84A98C]/20 border-[#84A98C]/40 text-[#84A98C]'
            "
          >
            <MailOpenIcon v-if="notification.isRead" class="w-5 h-5" />
            <MailIcon v-else class="w-5 h-5" />
          </div>
        </div>

        <div class="flex-1 min-w-0">
          <div class="flex flex-wrap items-center gap-2 mb-1">
            <p
              class="text-gray-900 text-sm md:text-base"
              :class="{ 'font-normal': !notification.isRead }"
            >
              {{ notification.title || notification.message }}
            </p>
            <span
              v-if="notification.type"
              class="text-xs text-[#52796F] bg-[#84A98C]/10 border border-[#84A98C]/20 px-2 py-0.5 rounded-full"
            >
              {{ notification.type }}
            </span>
          </div>
          <p v-if="notification.title && notification.message" class="text-sm text-gray-500">
            {{ notification.message }}
          </p>
          <p class="text-xs text-gray-400 mt-1 font-normal">
            {{ notification.createdAt ? new Date(notification.createdAt).toLocaleString() : "-" }}
          </p>
        </div>

        <div class="flex items-center gap-2 transition-opacity">
          <button
            v-if="notification.isRead"
            @click="handleMarkAsUnread(notification.id)"
            class="p-2 hover:bg-gray-100 rounded-lg transition-all text-gray-400 hover:text-gray-600"
            title="សម្គាល់ថាមិនទាន់អាន"
          >
            <MailIcon class="w-4 h-4" />
          </button>
          <button
            v-else
            @click="handleMarkAsRead(notification.id)"
            class="p-2 hover:bg-gray-100 rounded-lg transition-all text-[#84A98C]"
            title="សម្គាល់ថាបានអាន"
          >
            <MailOpenIcon class="w-4 h-4" />
          </button>
          <button
            v-if="isAdmin"
            @click="handleDelete(notification.id)"
            class="p-2 hover:bg-red-50 rounded-lg transition-all text-red-400 hover:text-red-600"
            title="លុប"
          >
            <Trash2Icon class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    <div
      v-else
      class="bg-white border border-gray-100 rounded-xl p-12 shadow-sm"
    >
      <EmptyState
        :icon="BellIcon"
        :title="isLoadingNotifications ? 'កំពុងទាញយកការជូនដំណឹង...' : 'មិនមានការជូនដំណឹង'"
        :description="
          isLoadingNotifications
            ? 'សូមរង់ចាំបន្តិច'
            : 'អ្នកបានអានការជូនដំណឹងទាំងអស់ហើយ! សូមពិនិត្យមើលម្តងទៀតនៅពេលក្រោយ។'
        "
      />
    </div>

    <div
      v-if="totalPages > 1"
      class="bg-white border border-gray-100 rounded-xl px-6 py-4 shadow-sm flex items-center justify-between"
    >
      <p class="text-sm text-gray-400 font-medium">
        ទំព័រ <span class="text-gray-900 font-bold">{{ currentPage }}</span> នៃ
        <span class="text-gray-900 font-bold">{{ totalPages }}</span>
      </p>
      <div class="flex items-center gap-2">
        <button
          @click="handlePageChange(currentPage - 1)"
          :disabled="currentPage === 1"
          class="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          មុន
        </button>
        <button
          @click="handlePageChange(currentPage + 1)"
          :disabled="currentPage === totalPages"
          class="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          បន្ទាប់
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import {
  Bell as BellIcon,
  CheckCheck as CheckCheckIcon,
  Trash2 as Trash2Icon,
  Mail as MailIcon,
  MailOpen as MailOpenIcon,
} from "lucide-vue-next";
import EmptyState from "@/components/common/EmptyState.vue";
import SkeletonLoader from "@/components/common/SkeletonLoader.vue";
import { useAuthStore } from "@/stores/auth";
import { useToastStore } from "@/stores/toast";
import { notificationsApi } from "@/api/api";

const authStore = useAuthStore();
const toastStore = useToastStore();

const notifications = ref([]);
const currentPage = ref(1);
const totalNotifications = ref(0);
const itemsPerPage = 20;
const isLoadingNotifications = ref(false);
const showUnreadOnly = ref(false);

const isAdmin = computed(() => authStore.user?.role === "ADMIN");

const unreadCount = computed(
  () => notifications.value.filter((notification) => !notification.isRead).length,
);

const totalPages = computed(() =>
  Math.max(1, Math.ceil(totalNotifications.value / itemsPerPage)),
);

const sortedNotifications = computed(() =>
  [...notifications.value].sort(
    (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
  ),
);

const getResponseData = (response) => response.data?.data || response.data;

const getNotificationsList = (data) =>
  data?.notifications ||
  data?.alerts ||
  data?.items ||
  data?.results ||
  data?.records ||
  data?.data ||
  (Array.isArray(data) ? data : []);

const getNotificationsTotal = (data, list) =>
  Number(
    data?.total ||
      data?.totalItems ||
      data?.totalNotifications ||
      data?.totalRecords ||
      data?.meta?.total ||
      data?.pagination?.total ||
      list.length,
  );

const normalizeNotification = (notification) => ({
  ...notification,
  id: String(
    notification.id ||
      notification.alertId ||
      notification.alert_id ||
      notification.notificationId ||
      notification.notification_id ||
      notification._id ||
      notification.uuid ||
      "",
  ),
  title: notification.title || notification.subject || "",
  message:
    notification.message ||
    notification.body ||
    notification.description ||
    notification.content ||
    "",
  type: notification.type || notification.alertType || notification.alert_type || "",
  isRead: Boolean(notification.isRead ?? notification.is_read ?? notification.read),
  createdAt:
    notification.createdAt ||
    notification.created_at ||
    notification.generatedAt ||
    notification.generated_at ||
    notification.date ||
    "",
});

const fetchNotifications = async () => {
  isLoadingNotifications.value = true;

  try {
    const response = await notificationsApi.getNotifications({
      params: {
        _page: currentPage.value,
        _per_page: itemsPerPage,
        isRead: showUnreadOnly.value ? false : undefined,
      },
    });
    const data = getResponseData(response);
    const list = getNotificationsList(data);

    notifications.value = list.map(normalizeNotification);
    totalNotifications.value = getNotificationsTotal(data, list);
  } catch (err) {
    toastStore.error(err.response?.data?.message || "Unable to load notifications");
    notifications.value = [];
    totalNotifications.value = 0;
  } finally {
    isLoadingNotifications.value = false;
  }
};

const updateNotificationReadState = (id, isRead) => {
  const notification = notifications.value.find((item) => item.id === id);
  if (notification) {
    notification.isRead = isRead;
  }
};

const handlePageChange = (page) => {
  currentPage.value = page;
};

watch(currentPage, fetchNotifications);

watch(showUnreadOnly, () => {
  currentPage.value = 1;
  fetchNotifications();
});

const handleMarkAsRead = async (id) => {
  try {
    await notificationsApi.markAsRead(id);
    updateNotificationReadState(id, true);
    if (showUnreadOnly.value) {
      notifications.value = notifications.value.filter((item) => item.id !== id);
    }
  } catch (err) {
    toastStore.error(err.response?.data?.message || "Unable to mark as read");
  }
};

const handleMarkAsUnread = async (id) => {
  try {
    await notificationsApi.markAsUnread(id);
    updateNotificationReadState(id, false);
  } catch (err) {
    toastStore.error(err.response?.data?.message || "Unable to mark as unread");
  }
};

const handleMarkAllAsRead = async () => {
  try {
    await notificationsApi.markAllAsRead();
    notifications.value.forEach((notification) => {
      notification.isRead = true;
    });
    if (showUnreadOnly.value) {
      notifications.value = [];
    }
    toastStore.success("បានសម្គាល់ទាំងអស់ថាបានអាន");
  } catch (err) {
    toastStore.error(err.response?.data?.message || "Unable to mark all as read");
  }
};

const handleDelete = async (id) => {
  try {
    await notificationsApi.deleteNotification(id);
    notifications.value = notifications.value.filter((notification) => notification.id !== id);
    totalNotifications.value = Math.max(0, totalNotifications.value - 1);
    toastStore.success("បានលុបការជូនដំណឹង");
  } catch (err) {
    toastStore.error(err.response?.data?.message || "Unable to delete notification");
  }
};

onMounted(() => {
  fetchNotifications();
});
</script>

