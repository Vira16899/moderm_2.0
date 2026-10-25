<template>
  <div class="container py-4 bg-light min-vh-100">
    <div class="row justify-content-center">
      <div class="col-xl-9">

        <div class="card border-0 shadow-sm rounded-4 overflow-hidden">

          <!-- Header -->
          <div class="card-header bg-white py-3 border-bottom">
            <div class="d-flex justify-content-between align-items-center">
              <div>
                <h4 class="fw-bold mb-1">
                  <i class="bi bi-bell-fill me-2" style="color: #78a081;"></i>
                  Notification Center
                </h4>
                <small class="text-muted">Staff events and system updates</small>
              </div>

              <button
                class="btn btn-success btn-sm rounded-pill px-3"
                @click="handleMarkAllRead"
                :disabled="store.unreadCount === 0"
              >
                <i class="bi bi-check2-all me-1"></i>
                Mark all
              </button>
            </div>
          </div>

          <!-- Tabs -->
          <div class="px-4 pt-3 bg-white border-bottom">
            <ul class="nav nav-pills gap-2 pb-3">
              <li class="nav-item">
                <button
                  class="nav-link rounded-pill"
                  :class="{ active: currentTab === 'all' }"
                  @click="currentTab = 'all'"
                >
                  All
                </button>
              </li>

              <li class="nav-item">
                <button
                  class="nav-link rounded-pill"
                  :class="{ active: currentTab === 'unread' }"
                  @click="currentTab = 'unread'"
                >
                  Unread
                  <span class="badge bg-danger ms-1">{{ store.unreadCount }}</span>
                </button>
              </li>

              <li class="nav-item">
                <button
                  class="nav-link rounded-pill"
                  :class="{ active: currentTab === 'read' }"
                  @click="currentTab = 'read'"
                >
                  Read
                </button>
              </li>
            </ul>
          </div>

          <!-- Body -->
          <div class="card-body p-0">

            <div
              v-if="filteredNotifications.length === 0"
              class="text-center py-5"
            >
              <i class="bi bi-bell-slash fs-1 text-muted"></i>
              <p class="text-muted mt-3 mb-0">No notifications</p>
            </div>

            <div v-else>

              <div
                v-for="item in filteredNotifications"
                :key="item.id"
                class="notification-row px-4 py-3 border-bottom"
                :class="{ unread: !item.isRead }"
              >
                <div class="d-flex gap-3 align-items-start">

                  <div class="icon-box" :class="item.typeClass">
                    <i :class="item.icon"></i>
                  </div>

                  <div class="flex-grow-1">

                    <div class="d-flex justify-content-between align-items-start">
                      <div>
                        <h6 class="fw-bold mb-1">
                          {{ item.title }}
                        </h6>

                        <p class="text-muted mb-0 small">
                          {{ item.message }}
                        </p>
                      </div>

                      <small class="text-muted">
                        {{ item.time || item.createdAt }}
                      </small>
                    </div>

                    <div class="mt-3 d-flex gap-2">

                      <button
                        v-if="!item.isRead"
                        class="btn btn-sm btn-outline-success rounded-pill"
                        @click="handleMarkRead(item)"
                      >
                        <i class="bi bi-check2 me-1"></i>
                        Read
                      </button>

                      <button
                        v-else
                        class="btn btn-sm btn-outline-warning rounded-pill"
                        @click="store.markAsUnread(item.id)"
                      >
                        <i class="bi bi-arrow-counterclockwise me-1"></i>
                        Unread
                      </button>

                      <button
                        class="btn btn-sm btn-outline-danger rounded-pill"
                        @click="handleDelete(item.id)"
                      >
                        <i class="bi bi-trash me-1"></i>
                        Delete
                      </button>

                    </div>

                  </div>

                </div>
              </div>

            </div>

          </div>

        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useNotificationStore } from '@/stores/useNotificationStore'

const store = useNotificationStore()
const currentTab = ref('all')

onMounted(async () => {
  await store.fetchNotifications()
})

const filteredNotifications = computed(() => {
  const list = store.notifications || []

  if (currentTab.value === 'unread') {
    return list.filter(n => !n.isRead)
  }

  if (currentTab.value === 'read') {
    return list.filter(n => n.isRead)
  }

  return list
})

const handleMarkRead = async (item) => {
  await store.markAsRead(item.id)
}

const handleDelete = async (id) => {
  await store.deleteNotification(id)
}

const handleMarkAllRead = async () => {
  await store.markAllAsRead()
}
</script><style scoped>
.notification-row {
  transition: all 0.2s ease;
}

.notification-row:hover {
  background: #f8faf9;
}

.unread {
  background: #f1f8f4;
  border-left: 4px solid #78a081;
}

.icon-box {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
}

.nav-link {
  color: #6c757d;
}

.nav-link.active {
  background: #78a081;
  color: white;
}
</style>