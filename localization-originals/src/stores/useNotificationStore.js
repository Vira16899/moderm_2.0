import { defineStore } from "pinia";
import api from "@/api/api";
import { useAuthStore } from "./useAuth";

export const useNotificationStore = defineStore("notification", {
  state: () => ({
    notifications: [],
    isLoading: false,
    unreadCount: 0,
    pagination: {
      total: 0,
      page: 1,
      per_page: 20,
    },
  }),

  actions: {
    addLocalNotification(notification) {
      const localNotification = {
        ...notification,
        id: notification.id || `local-${Date.now()}`,
        title: notification.title || "Notification",
        message: notification.message || "",
        isRead: Boolean(notification.isRead),
        time: notification.time || new Date().toLocaleString(),
        icon: notification.icon || "bi bi-bell",
        typeClass: notification.typeClass || "bg-info bg-opacity-10 text-info",
      };

      this.notifications = [
        localNotification,
        ...this.notifications.filter((item) => String(item.id) !== String(localNotification.id)),
      ];

      if (!localNotification.isRead) {
        this.unreadCount += 1;
      }

      this.pagination.total += 1;
      return localNotification;
    },

    async fetchNotifications(params = {}) {
      this.isLoading = true;
      try {
        const response = await api.get("/notifications", {
          params: {
            _page: params.page || this.pagination.page,
            _per_page: params.per_page || this.pagination.per_page,
            isRead: params.isRead !== undefined ? params.isRead : false,
          },
        });

        this.notifications = response.data?.data?.items || [];
         this.unreadCount = response.data?.data?.unread_count ?? this.notifications.filter(n => !n.isRead).length;
         this.pagination.total = response.data?.data?.total || 0;
         this.pagination.page = params.page || this.pagination.page;
       } catch (error) {
        console.error("Fetch Notifications Error:", error);
      } finally {
        this.isLoading = false
      }
    },

    async markAsRead(notiId) {
      try {
        await api.put(`/notifications/${notiId}/read`);
        const notification = this.notifications.find((n) => String(n.id) === String(notiId));
        if (notification) {
          const wasUnread = !notification.isRead;
          notification.isRead = true;
          if (wasUnread) {
            this.unreadCount = Math.max(0, this.unreadCount - 1);
          }
        }
        return true;
      } catch (error) {
        console.error("Mark as read error:", error);
        return false;
      }
    },

    async markAsUnread(notiId) {
      try {
        await api.put(`/notifications/${notiId}/unread`);
        const notification = this.notifications.find((n) => String(n.id) === String(notiId));
        if (notification) {
          const wasRead = notification.isRead;
          notification.isRead = false;
          if (wasRead) {
            this.unreadCount++;
          }
        }
        return true;
      } catch (error) {
        console.error("Mark as unread error:", error);
        return false;
      }
    },

    async markAllAsRead() {
      try {
        await api.put("/notifications/read-all");
        this.notifications.forEach((n) => (n.isRead = true));
        this.unreadCount = 0;
        return true;
      } catch (error) {
        console.error("Mark all as read error:", error);
        return false;
      }
    },

    async deleteNotification(id) {
      try {
        await api.delete(`/notifications/${id}`);
        this.notifications = this.notifications.filter((n) => n.id !== id);
      } catch (error) {
        console.error("Delete Error:", error);
      }
    },
  },
});
