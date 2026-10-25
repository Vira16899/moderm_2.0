<template>
  <div class="notif-page p-4">
    <!-- Header Section -->
    <div class="header-section mb-4 sticky-top bg-white py-2">
      <div class="d-flex justify-content-between align-items-center">
        <div>
          <h2 class="fw-bold text-dark mb-1">ការជូនដំណឹង</h2>
          <div class="d-flex align-items-center gap-2">
            <span class="text-muted small">សរុបទាំងអស់</span>
            <BaseBadge type="success">{{ notificationStore.unreadCount }} មិនទាន់អាន</BaseBadge>
          </div>
        </div>
        <div class="d-flex gap-2">
          <BaseButton v-if="notificationStore.unreadCount > 0" @click="handleMarkAllAsRead" class="btn-sm">
            <template #icon><i class="bi bi-check-all"></i></template>
            កត់សម្គាល់ថាបានអានទាំងអស់
          </BaseButton>
        </div>
      </div>

      <!-- Search & Filter Bar -->
      <div class="row mt-4 g-3 align-items-center">
        <div class="col-md-8">
          <div class="d-flex gap-2">
            <button 
              v-for="filter in filters" 
              :key="filter.value"
              class="btn filter-btn rounded-pill px-4 py-2" 
              :class="currentFilter === filter.value ? 'btn-success shadow-sm' : 'btn-outline-success'"
              @click="setFilter(filter.value)"
            >
              {{ filter.label }}
            </button>
          </div>
        </div>
        <div class="col-md-4">
          <div class="search-wrapper">
            <i class="bi bi-search search-icon"></i>
            <input 
              v-model="searchQuery" 
              type="text" 
              class="form-control search-input rounded-pill ps-5" 
              placeholder="ស្វែងរកការជូនដំណឹង..."
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Notification List Container -->
    <div class="notif-container">
      <!-- Loading State (Skeletons) -->
      <div v-if="notificationStore.isLoading" class="skeleton-list">
        <div v-for="i in 5" :key="i" class="skeleton-item mb-3 p-4 rounded-4 shadow-sm border-0">
          <div class="d-flex align-items-center gap-3">
            <div class="skeleton-icon"></div>
            <div class="flex-grow-1">
              <div class="skeleton-line title mb-2"></div>
              <div class="skeleton-line text"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredNotifications.length === 0" class="empty-state text-center py-5 bg-white rounded-4 shadow-sm">
        <div class="empty-icon-box mb-3">
          <i class="bi bi-bell-slash text-success opacity-25"></i>
        </div>
        <h5 class="fw-bold text-dark">មិនទាន់មានការជូនដំណឹងនៅឡើយទេ</h5>
        <p class="text-muted">នៅពេលអ្នកមានការជូនដំណឹង វានឹងបង្ហាញនៅទីនេះ។</p>
        <BaseButton v-if="currentFilter !== 'all'" @click="setFilter('all')" class="mt-2">
          បង្ហាញទាំងអស់
        </BaseButton>
      </div>

      <!-- Notification List -->
      <div v-else class="notif-list">
        <TransitionGroup name="notif-fade">
          <div 
            v-for="notif in filteredNotifications" 
            :key="notif.id" 
            :class="['notif-card mb-3 p-4 d-flex align-items-center gap-3 shadow-sm rounded-4', { 'unread': !notif.isRead }]"
          >
            <!-- Status Indicator -->
            <div class="status-indicator" v-if="!notif.isRead"></div>

            <!-- Icon -->
            <div class="notif-icon-box shadow-sm" :class="notif.isRead ? 'bg-light text-muted' : 'bg-success-light text-success'">
              <i :class="['bi', notif.isRead ? 'bi-envelope-open' : 'bi-envelope-fill']"></i>
            </div>

            <!-- Content -->
            <div class="flex-grow-1 overflow-hidden">
              <div class="d-flex justify-content-between align-items-start mb-1">
                <h6 class="mb-0 fw-bold text-truncate" :class="notif.isRead ? 'text-secondary' : 'text-dark'">{{ notif.title }}</h6>
                <small class="text-muted ms-2 flex-shrink-0">{{ formatTime(notif.created_at) }}</small>
              </div>
              <p class="mb-0 text-secondary text-wrap small lh-sm">{{ notif.message }}</p>
            </div>

            <!-- Hover Actions -->
            <div class="notif-actions d-flex gap-2">
              <button 
                v-if="!notif.isRead"
                @click.stop="handleMarkAsRead(notif.id)" 
                class="btn btn-action-round shadow-sm" 
                v-tooltip="'កត់សម្គាល់ថាបានអាន'"
              >
                <i class="bi bi-check2"></i>
              </button>
              <button 
                v-else
                @click.stop="handleMarkAsUnread(notif.id)" 
                class="btn btn-action-round shadow-sm" 
                v-tooltip="'កត់សម្គាល់ថាមិនទាន់អាន'"
              >
                <i class="bi bi-envelope"></i>
              </button>
              <button @click.stop="handleDelete(notif.id)" class="btn btn-action-round delete shadow-sm" v-tooltip="'លុប'">
                <i class="bi bi-trash"></i>
              </button>
            </div>
          </div>
        </TransitionGroup>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="filteredNotifications.length > 0" class="mt-5 d-flex justify-content-center">
      <BasePagination 
        :current-page="notificationStore.pagination.page" 
        :total-pages="totalPages"
        @change-page="handlePageChange"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useNotificationStore } from '@/stores/useNotificationStore';
import BaseButton from '@/components/ui/base/BaseButton.vue';
import BasePagination from '@/components/ui/base/BasePagination.vue';
import BaseBadge from '@/components/ui/base/BaseBadge.vue';
import Swal from 'sweetalert2';

const notificationStore = useNotificationStore();
const currentFilter = ref('all');
const searchQuery = ref('');

const filters = [
  { label: 'ទាំងអស់', value: 'all' },
  { label: 'មិនទាន់អាន', value: 'unread' },
  { label: 'អានរួច', value: 'read' }
];

const totalPages = computed(() => {
  return Math.ceil(notificationStore.pagination.total / notificationStore.pagination.per_page) || 1;
});

const filteredNotifications = computed(() => {
  let list = notificationStore.notifications;
  
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    list = list.filter(n => 
      n.title?.toLowerCase().includes(q) || 
      n.message?.toLowerCase().includes(q)
    );
  }
  
  return list;
});

const loadNotifications = async (page = 1) => {
  const isRead = currentFilter.value === 'all' ? undefined : (currentFilter.value === 'read');
  await notificationStore.fetchNotifications({ 
    page, 
    isRead 
  });
};

onMounted(() => {
  loadNotifications();
});

const setFilter = (filter) => {
  currentFilter.value = filter;
  loadNotifications(1);
};

const handlePageChange = (page) => {
  loadNotifications(page);
};

const formatTime = (date) => {
  if (!date) return '—';
  const d = new Date(date);
  const now = new Date();
  const diffInSeconds = Math.floor((now - d) / 1000);

  if (diffInSeconds < 60) return 'ឥឡូវនេះ';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} នាទីមុន`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} ម៉ោងមុន`;
  
  return d.toLocaleDateString('km-KH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

const handleMarkAllAsRead = async () => {
  const success = await notificationStore.markAllAsRead();
  if (success) {
    Swal.fire({
      icon: 'success',
      title: 'ជោគជ័យ',
      text: 'រាល់ការជូនដំណឹងទាំងអស់ត្រូវបានកត់សម្គាល់ថាអានរួច',
      timer: 1500,
      showConfirmButton: false,
      background: '#fff',
      color: '#1b4332'
    });
  }
};

const handleMarkAsRead = async (id) => {
  await notificationStore.markAsRead(id);
};

const handleMarkAsUnread = async (id) => {
  await notificationStore.markAsUnread(id);
};

const handleDelete = async (id) => {
  const result = await Swal.fire({
    title: 'តើអ្នកប្រាកដទេ?',
    text: "ការជូនដំណឹងនេះនឹងត្រូវលុបចេញជារៀងរហូត!",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#2D6A4F',
    cancelButtonColor: '#d33',
    confirmButtonText: 'បាទ លុបវា!',
    cancelButtonText: 'បោះបង់',
    reverseButtons: true
  });

  if (result.isConfirmed) {
    await notificationStore.deleteNotification(id);
  }
};
</script>

<style scoped>
.notif-page {
  max-width: 900px;
  margin: 0 auto;
  min-height: 100vh;
}

.header-section {
  z-index: 100;
  border-bottom: 1px solid #f0f0f0;
}

/* Search Box */
.search-wrapper {
  position: relative;
}
.search-icon {
  position: absolute;
  left: 1.25rem;
  top: 50%;
  transform: translateY(-50%);
  color: #adb5bd;
}
.search-input {
  border: 1.5px solid #eee;
  padding-top: 0.6rem;
  padding-bottom: 0.6rem;
  transition: all 0.2s;
  background-color: #fbfbfb;
}
.search-input:focus {
  background-color: #fff;
  border-color: #2D6A4F;
  box-shadow: 0 0 0 0.25rem rgba(45, 106, 79, 0.1);
}

/* Filters */
.filter-btn {
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
.filter-btn:not(.btn-success):hover {
  background-color: #f0fdf4;
}

/* Notif Card */
.notif-card {
  position: relative;
  background: white;
  border: 1px solid #f1f1f1;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: default;
}

.notif-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 20px rgba(0,0,0,0.05) !important;
  border-color: #e0e0e0;
}

.notif-card.unread {
  background-color: #f0fdf4;
  border-color: #dcfce7;
}

.status-indicator {
  position: absolute;
  left: 0;
  top: 25%;
  bottom: 25%;
  width: 4px;
  background: #2D6A4F;
  border-radius: 0 4px 4px 0;
}

.notif-icon-box {
  width: 52px;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
  font-size: 1.4rem;
  flex-shrink: 0;
}

.bg-success-light {
  background-color: #dcfce7;
}

/* Action Buttons */
.btn-action-round {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1px solid #eee;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6c757d;
  transition: all 0.2s;
  opacity: 0;
  transform: scale(0.8);
}

.notif-card:hover .btn-action-round {
  opacity: 1;
  transform: scale(1);
}

.btn-action-round:hover {
  background: #f8f9fa;
  color: #2D6A4F;
  border-color: #2D6A4F;
}

.btn-action-round.delete:hover {
  background: #fff5f5;
  color: #dc3545;
  border-color: #dc3545;
}

/* Animations */
.notif-fade-enter-active,
.notif-fade-leave-active {
  transition: all 0.4s ease;
}
.notif-fade-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}
.notif-fade-leave-to {
  opacity: 0;
  transform: scale(0.9);
}
.notif-fade-move {
  transition: transform 0.4s ease;
}

/* Skeletons */
.skeleton-item {
  background: white;
  border: 1px solid #eee;
}
.skeleton-icon {
  width: 52px;
  height: 52px;
  border-radius: 16px;
  background: #f0f0f0;
  animation: pulse 1.5s infinite;
}
.skeleton-line {
  background: #f0f0f0;
  border-radius: 4px;
  animation: pulse 1.5s infinite;
}
.skeleton-line.title { width: 40%; height: 16px; }
.skeleton-line.text { width: 85%; height: 12px; }

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
}

.empty-icon-box i {
  font-size: 5rem;
}

@media (max-width: 768px) {
  .btn-action-round {
    opacity: 1;
    transform: scale(1);
    width: 36px;
    height: 36px;
  }
  .notif-card {
    flex-wrap: wrap;
  }
  .notif-actions {
    width: 100%;
    justify-content: flex-end;
    margin-top: 10px;
  }
}
</style>
