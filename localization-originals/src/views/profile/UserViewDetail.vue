<template>
  <div class="container-fluid py-4 bg-light min-vh-100">

    <!-- Back -->
    <div class="mb-4">
      <button class="btn btn-outline-success rounded-3 px-3" @click="$emit('back')">
        ← ត្រឡប់ក្រោយ
      </button>
    </div>

    <!-- Header -->
    <div class="card border-0 shadow-sm rounded-4 p-4 mb-4 position-relative">
      <div class="d-flex flex-column flex-md-row align-items-center align-items-md-start justify-content-between gap-3">

        <div class="d-flex flex-column flex-sm-row align-items-center align-items-sm-start gap-4">
          <div class="position-relative">
            <div class="avatar-placeholder d-flex align-items-center justify-content-center bg-opacity-20 rounded-4">
              <img :src="employee?.avatar" alt="រូបភាពប្រវត្តិរូប" class="rounded-4"
                style="width: 120px; height: 120px; object-fit: cover;">
            </div>
          </div>

          <div class="text-center text-sm-start mt-2">
            <div class="d-flex flex-wrap align-items-center gap-2 mb-2">
              <h2 class="fw-bold m-0 text-dark">{{ employee?.fullname }}</h2>

              <span class="badge bg-success bg-opacity-10 text-success border border-success border-opacity-10">
                {{ employee?.role?.name }}
              </span>

              <span class="badge bg-opacity-10 border" :class="employee?.status === 'ACTIVATED'
                ? 'bg-success text-success border-success'
                : 'bg-danger text-danger border-danger'">
                {{ employee?.status === 'ACTIVATED' ? 'ACTIVATED' : employee?.status }}
              </span>
            </div>

            <div class="text-secondary d-flex flex-wrap gap-3 small mt-3">
              <span>
                អត្តសញ្ញាណប័ណ្ណបុគ្គលិក:
                <strong class="text-dark">{{ employee?.id }}</strong>
              </span>

              <span>
                កាលបរិច្ឆេទចូលបម្រើការងារ: <strong class="text-dark">{{ employee?.hireDate }}</strong>
              </span>
            </div>

          </div>
        </div>

      </div>
    </div>

    <!-- Body -->
    <div class="row g-4">

      <!-- Personal -->
      <div class="col-md-6">
        <h5 class="fw-bold mb-3">ព័ត៌មានផ្ទាល់ខ្លួន</h5>

        <div class="card border-0 shadow-sm rounded-4 p-4 h-100">

          <div class="mb-4">
            <small class="text-muted">អ៊ីមែល</small>
            <div class="fw-bold">{{ employee?.email }}</div>
          </div>

          <div class="mb-4">
            <small class="text-muted">លេខទូរស័ព្ទ</small>
            <div class="fw-bold">{{ employee?.phone }}</div>
          </div>

          <div class="mb-4">
            <small class="text-muted">ថ្ងៃខែឆ្នាំកំណើត</small>
            <div class="fw-bold">{{ employee?.birthday }}</div>
          </div>

          <div>
            <small class="text-muted">ភេទ</small>
            <div class="fw-bold">{{ employee?.gender }}</div>
          </div>

        </div>
      </div>

      <!-- Professional -->
      <div class="col-md-6">
        <h5 class="fw-bold mb-3">ព័ត៌មានការងារ</h5>

        <div class="card border-0 shadow-sm rounded-4 p-4 h-100">
          <div class="d-flex">
            <div class="mb-4 me-3">
              <small class="text-muted">ប្រាក់បៀវត្សន៍</small>
              <div class="fw-bold">{{ formatSalary(employee?.salary) }}</div>
            </div>
            <BaseButton @click="openUpdate" variant="warning" class="m-0 py-1 px-2 mt-2"
              style="font-size: 12px; height: 28px;">
              <i class="bi bi-pencil-square me-2"></i>កែប្រែប្រាក់បៀវត្សន៍
            </BaseButton>

          </div>

          <div class="mb-4">
            <small class="text-muted">តួនាទី</small>
            <div class="fw-bold">{{ employee?.role?.name }}</div>
          </div>

          <div v-if="employee?.role.id == 3" class="mb-4">
            <small class="text-muted">អត្តសញ្ញាណប័ណ្ណអ្នកគ្រប់គ្រង</small>
            <div class="fw-bold">{{ employee?.manager?.id }}</div>
          </div>

          <div>
            <small class="text-muted">ស្ថានភាព</small>
            <div class="fw-bold">{{ employee?.status === 'ACTIVATED' ? 'ACTIVATED' : employee?.status }}</div>
          </div>

        </div>
      </div>

    </div>

    <!-- Modal update  -->
    <BaseModal :show="showUpdateModal" v-if="showUpdateModal" :title="'កែប្រែព័ត៌មាន ' + employee.fullname"
      @close="closeUpdate">
      <template #body>

        <div class="row g-3">

          <!-- Salary -->
          <div class="col-md-12">
            <label class="form-label">
              ប្រាក់បៀវត្សន៍ *
            </label>

            <input v-model="updateForm.salary" type="number" class="form-control"
              :class="{ 'is-invalid': updateErrors.salary }" />

            <small v-if="updateErrors.salary" class="text-danger">
              {{ updateErrors.salary }}
            </small>
          </div>

          <!-- Effective Date -->
          <div class="col-md-12">
            <label class="form-label">
              កាលបរិច្ឆេទអនុវត្ត *
            </label>

            <input v-model="updateForm.effectiveDate" type="date" class="form-control"
              :class="{ 'is-invalid': updateErrors.effectiveDate }" />

            <small v-if="updateErrors.effectiveDate" class="text-danger">
              {{ updateErrors.effectiveDate }}
            </small>
          </div>

          <!-- Change Reason -->
          <div class="col-md-12">
            <label class="form-label">
              មូលហេតុដែលធ្វើបច្ចុប្បន្នភាពប្រាក់ខែ *
            </label>

            <input v-model="updateForm.changeReason" type="text" class="form-control"
              placeholder="បញ្ជាក់មូលហេតុ (ឧ. ដំឡើងប្រាក់ខែប្រចាំឆ្នាំ)"
              :class="{ 'is-invalid': updateErrors.changeReason }" />

            <small v-if="updateErrors.changeReason" class="text-danger">
              {{ updateErrors.changeReason }}
            </small>
          </div>

        </div>

        <!-- Footer -->
        <div class="d-flex justify-content-end gap-2 mt-4">

          <button class="btn btn-secondary" @click="closeUpdate">
            បោះបង់
          </button>

          <button class="btn btn-success" @click="handleUpdate">
            រក្សាទុកការកែប្រែ
          </button>

        </div>

      </template>
    </BaseModal>

    <!-- Modal delete  -->
    <BaseModal :show="showDeleteModal" v-if="showDeleteModal" title="ការបញ្ជាក់ការលុប" @close="closeDelete">
      <template #body>
        <p>តើអ្នកពិតជាចង់លុបទិន្នន័យរបស់លោក/លោកស្រី <strong>{{ employee.fullname }}</strong> មែនទេ?</p>

        <div class="d-flex justify-content-end gap-2 mt-4">
          <button class="btn btn-secondary" @click="closeDelete">
            បោះបង់
          </button>

          <button class="btn btn-danger" @click="confirmDelete">
            លុបចេញ
          </button>
        </div>
      </template>
    </BaseModal>
  </div>
</template>

<script setup>
import BaseButton from '@/components/ui/base/BaseButton.vue'
import BaseModal from '@/components/ui/base/BaseModal.vue'
import { ref, watch, reactive } from 'vue'

const props = defineProps({
  employee: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['back', 'update', 'delete'])

const showUpdateModal = ref(false)
const showDeleteModal = ref(false)

const updateForm = ref({
  salary: '',
  effectiveDate: '',
  changeReason: ''
})

  //  VALIDATION ERRORS
const updateErrors = reactive({
  salary: '',
  effectiveDate: '',
  changeReason: ''
})

  //  OPEN UPDATE
const openUpdate = () => {

  // preload old data
  updateForm.value = {
    salary: props.employee?.salary || '',
    effectiveDate: '',
    changeReason: ''
  }

  // clear old errors
  updateErrors.salary = ''
  updateErrors.effectiveDate = ''
  updateErrors.changeReason = ''

  showUpdateModal.value = true
}

  //  CLOSE UPDATE
const closeUpdate = () => {
  showUpdateModal.value = false
}

  //  WATCH EMPLOYEE
watch(
  () => props.employee,
  (newVal) => {
    if (newVal) {
      updateForm.value = {
        salary: newVal.salary || '',
        effectiveDate: '',
        changeReason: ''
      }
    }
  },
  { immediate: true }
)

   //  VALIDATE UPDATE FORM
const validateUpdateForm = () => {

  updateErrors.salary = ''
  updateErrors.effectiveDate = ''
  updateErrors.changeReason = ''

  let valid = true

  if (
    !updateForm.value.salary ||
    Number(updateForm.value.salary) <= 0
  ) {
    updateErrors.salary = 'Salary must be greater than 0'
    valid = false
  }

  if (!updateForm.value.effectiveDate) {
    updateErrors.effectiveDate = 'Effective date is required'
    valid = false
  }

  if (!updateForm.value.changeReason?.trim()) {
    updateErrors.changeReason = 'Change reason is required'
    valid = false
  }

  return valid
}

// UPDATE
const handleUpdate = () => {

  const isValid = validateUpdateForm()

  if (!isValid) return

  emit('update', {
    id: props.employee.id,
    salary: Number(updateForm.value.salary),
    effectiveDate: updateForm.value.effectiveDate,
    changeReason: updateForm.value.changeReason.trim()
  })

  closeUpdate()
}

  //  FORMAT SALARY
const formatSalary = (val) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(val || 0)
}
</script>
<style scoped>
.bg-light {
background-color: #f8fafc !important;
}

.avatar-placeholder {
width: 120px;
height: 120px;
}

.custom-check-badge {
background-color: #497164 !important;
transform: translate(25%, 25%) !important;
}

.badge {
padding: 6px 12px;
border-radius: 10px;
}
</style>