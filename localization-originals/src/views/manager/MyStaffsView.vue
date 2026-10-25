<template>
  <div class="page-container">
    <!-- Header Section -->
    <header class="page-header mb-5">
      <div class="header-content">
        <h1 class="page-title text-dark fw-bold mb-1">បុគ្គលិករបស់ខ្ញុំ</h1>
        <p class="page-subtitle text-muted mb-0">គ្រប់គ្រង និងមើលព័ត៌មានលម្អិតនៃបុគ្សិកក្រោមឱវាទរបស់អ្នក</p>
      </div>
    </header>

    <!-- Staff Table Card -->
    <div class="card border-0 shadow-sm rounded-4 overflow-hidden">
      <div class="table-responsive">
        <table class="table table-hover align-middle mb-0">
          <thead class="bg-light-subtle">
            <tr>
              <th class="ps-4 py-3 text-secondary fw-semibold small">ឈ្មោះពេញ</th>
              <th class="py-3 text-secondary fw-semibold small">អ៊ីមែល</th>
              <th class="py-3 text-secondary fw-semibold small">លេខទូរស័ព្ទ</th>
              <th class="py-3 text-secondary fw-semibold small">ប្រាក់បៀវត្សរ៍</th>
              <th class="py-3 text-secondary fw-semibold small">ស្ថានភាព</th>
              <th class="pe-4 py-3 text-secondary fw-semibold small text-center">សកម្មភាព</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="userStore.loading">
              <td colspan="6" class="p-0">
                <SkeletonLoader type="table" :rows="6" :columns="6" />
              </td>
            </tr>
            <tr v-else-if="userStore.myStaff.length === 0">
              <td colspan="6" class="text-center py-5 text-muted">មិនមានទិន្នន័យបុគ្គលិកទេ</td>
            </tr>
            <tr v-for="staff in userStore.myStaff" :key="staff.id">
              <td class="ps-4 py-3">
                <div class="d-flex align-items-center gap-3">
                  <img :src="staff.avatar || 'https://ui-avatars.com/api/?name=' + staff.fullname" 
                       class="rounded-circle object-fit-cover" 
                       width="40" height="40" alt="avatar">
                  <span class="fw-medium text-dark">{{ staff.fullname }}</span>
                </div>
              </td>
              <td class="py-3 text-muted">{{ staff.email }}</td>
              <td class="py-3 text-muted">{{ staff.phone || 'N/A' }}</td>
              <td class="py-3 fw-bold text-dark">{{ formatCurrency(staff.salary) }}</td>
              <td class="py-3">
                <span :class="['status-badge', staff.status === 'ACTIVATED' ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger']">
                  {{ staff.status === 'ACTIVATED' ? 'សកម្ម' : 'អសកម្ម' }}
                </span>
              </td>
              <td class="pe-4 py-3 text-center">
                <button class="btn btn-link text-primary-custom p-0" @click="viewStaffDetails(staff)">
                  <i class="bi bi-eye fs-5"></i>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Staff Details Modal -->
    <BaseModal :show="showDetailModal" title="លម្អិតអំពីបុគ្គលិក" @close="showDetailModal = false">
      <div class="text-center mb-4">
        <div class="avatar-container mx-auto mb-3">
          <img :src="selectedStaff?.avatar || 'https://ui-avatars.com/api/?name=' + selectedStaff?.fullname" 
               class="rounded-circle object-fit-cover shadow-sm border" 
               width="100" height="100" alt="avatar">
        </div>
        <h4 class="fw-bold text-dark mb-0">{{ selectedStaff?.fullname }}</h4>
        <p class="text-muted small">{{ selectedStaff?.email }}</p>
      </div>

      <div class="row g-3">
        <div class="col-6">
          <div class="info-box p-3 rounded-3 bg-light">
            <label class="small text-muted mb-1 d-block">លេខទូរស័ព្ទ</label>
            <span class="fw-medium text-dark">{{ selectedStaff?.phone || 'N/A' }}</span>
          </div>
        </div>
        <div class="col-6">
          <div class="info-box p-3 rounded-3 bg-light">
            <label class="small text-muted mb-1 d-block">ស្ថានភាព</label>
            <span :class="['status-badge small', selectedStaff?.status === 'ACTIVATED' ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger']">
              {{ selectedStaff?.status === 'ACTIVATED' ? 'សកម្ម' : 'អសកម្ម' }}
            </span>
          </div>
        </div>
        <div class="col-6">
          <div class="info-box p-3 rounded-3 bg-light">
            <label class="small text-muted mb-1 d-block">ប្រាក់បៀវត្សរ៍</label>
            <span class="fw-bold text-success">{{ formatCurrency(selectedStaff?.salary) }}</span>
          </div>
        </div>
        <div class="col-6">
          <div class="info-box p-3 rounded-3 bg-light">
            <label class="small text-muted mb-1 d-block">ថ្ងៃចូលធ្វើការ</label>
            <span class="fw-medium text-dark">{{ formatDate(selectedStaff?.hireDate) }}</span>
          </div>
        </div>
      </div>

      <template #footer>
        <button class="btn btn-primary-custom rounded-pill px-4" @click="showDetailModal = false">បិទ</button>
      </template>
    </BaseModal>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useUserStore } from '@/stores/userStore'
import BaseModal from '@/components/ui/base/BaseModal.vue'
import SkeletonLoader from '@/components/common/SkeletonLoader.vue'

const userStore = useUserStore()
const showDetailModal = ref(false)
const selectedStaff = ref(null)

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0
  }).format(value || 0)
}

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('en-US').format(date)
}

const viewStaffDetails = (staff) => {
  selectedStaff.value = staff
  showDetailModal.value = true
}

onMounted(() => {
  userStore.fetchMyStaff()
})
</script>

<style scoped>
.page-container {
  max-width: 1200px;
  margin: 0 auto;
}
.text-primary-custom {
  color: #52796F;
}
.btn-primary-custom {
  background-color: #84A98C;
  color: white;
  border: none;
  transition: all 0.2s;
}
.btn-primary-custom:hover {
  background-color: #52796F;
}
.status-badge {
  padding: 4px 12px;
  border-radius: 99px;
  font-size: 0.85rem;
  font-weight: 500;
}
.bg-success-subtle {
  background-color: #e6fcf5;
}
.bg-danger-subtle {
  background-color: #fff5f5;
}
.info-box {
  border: 1px solid #f1f1f1;
}
</style>
