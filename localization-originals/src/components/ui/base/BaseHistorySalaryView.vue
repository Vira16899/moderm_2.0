<template>
  <div class="salary-wrapper fade-in">



    <!-- Loading -->
    <div v-if="loading" class="card border-0 shadow-sm">
      <div class="card-body p-0">
        <SkeletonLoader type="table" :rows="6" :columns="6" />
      </div>
    </div>

    <!-- Empty -->
    <div v-else-if="!salaryHistory.length" class="card border-0 shadow-sm">
      <div class="card-body py-5 text-center text-muted">
        <i class="bi bi-wallet2 fs-1 mb-3 d-block text-secondary"></i>
        <h5 class="fw-semibold">មិនមានប្រវត្តិប្រាក់បៀវត្សន៍ទេ</h5>
        <p class="small mb-0">មិនមានទិន្នន័យស្តីពីការកែសម្រួលប្រាក់បៀវត្សន៍ដែលអាចប្រើប្រាស់បានឡើយ។</p>
      </div>
    </div>

    <!-- Data -->
    <template v-else>


      <!-- Table -->
      <div class="card border-0 shadow-sm history-card">

        <div class="table-responsive">
          <table class="table align-middle mb-0 history-table">

            <thead class="table-light">
              <tr>
                <th>#</th>
                <th>កាលបរិច្ឆេទអនុវត្ត</th>
                <th>ប្រាក់បៀវត្សន៍ចាស់</th>
                <th>ប្រាក់បៀវត្សន៍ថ្មី</th>
                <th>ផលខុសគ្នា</th>
                <th>មូលហេតុ</th>
              </tr>
            </thead>

            <tbody>
              <tr v-for="(salary, index) in salaryHistory" :key="salary?.id || index">

                <td class="fw-semibold">#{{ index + 1 }}</td>

                <td>{{ formatDate(salary?.effectiveDate) }}</td>

                <td>{{ formatCurrency(salary?.previousSalary || 0) }}</td>

                <td class="fw-bold text-primary">
                  {{ formatCurrency(salary?.newSalary || 0) }}
                </td>

                <td>
                  <span class="badge rounded-pill px-3 py-2"
                        :class="getBadgeClass(salary)">
                    {{ formatSalaryChange(salary) }}
                  </span>
                </td>

                <td class="text-muted reason-column">
                  {{ salary?.changeReason || "មិនមានបញ្ជាក់មូលហេតុ" }}
                </td>

              </tr>
            </tbody>

          </table>
        </div>

        <!-- Pagination -->
        <div class="card-footer bg-white border-0 py-3">

          <div class="d-flex justify-content-between align-items-center flex-wrap gap-2">

            <button class="btn btn-outline-secondary btn-sm rounded-pill px-3"
                    :disabled="!pagination?.hasPreviousPage"
                    @click="$emit('change-page', pagination.currentPage - 1)">
              <i class="bi bi-arrow-left me-1"></i>
              ថយក្រោយ
            </button>

            <small class="text-muted fw-semibold">
              ទំព័រទី {{ pagination?.currentPage || 1 }}
              នៃ {{ pagination?.totalPages || 1 }}
            </small>

            <button class="btn btn-primary btn-sm rounded-pill px-3"
                    :disabled="!pagination?.hasNextPage"
                    @click="$emit('change-page', pagination.currentPage + 1)">
              បន្ទាប់
              <i class="bi bi-arrow-right ms-1"></i>
            </button>

          </div>

        </div>

      </div>

    </template>

  </div>
</template>

<script setup>
import { computed } from "vue";
import SkeletonLoader from "@/components/common/SkeletonLoader.vue";

defineEmits(["change-page"]);

const props = defineProps({
  data: { type: Array, default: () => [] },
  pagination: { type: Object, default: () => ({}) },
  loading: { type: Boolean, default: false }
});

const salaryHistory = computed(() => props.data || []);

const latestSalary = computed(() => {
  return salaryHistory.value.length ? salaryHistory.value[0] : null;
});

const salaryChange = computed(() => {
  if (!latestSalary.value) return 0;

  return (
    Number(latestSalary.value.newSalary || 0) -
    Number(latestSalary.value.previousSalary || 0)
  );
});

const changeClass = computed(() => {
  if (salaryChange.value > 0) return "text-success";
  if (salaryChange.value < 0) return "text-danger";
  return "text-secondary";
});

const formattedSalaryChange = computed(() => {
  const sign = salaryChange.value > 0 ? "+" : "";
  return `${sign}${formatCurrency(salaryChange.value)}`;
});

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
  }).format(Number(value || 0));

const formatDate = (date) => {
  if (!date) return "-";
  return new Date(date).toLocaleDateString();
};

const formatSalaryChange = (salary = {}) => {
  const diff =
    Number(salary.newSalary || 0) -
    Number(salary.previousSalary || 0);

  const sign = diff > 0 ? "+" : "";
  return `${sign}${formatCurrency(diff)}`;
};

const getBadgeClass = (salary = {}) => {
  const diff =
    Number(salary.newSalary || 0) -
    Number(salary.previousSalary || 0);

  if (diff > 0) return "bg-success-subtle text-success";
  if (diff < 0) return "bg-danger-subtle text-danger";
  return "bg-secondary-subtle text-secondary";
};
</script>
<style scoped>
.salary-wrapper {
  padding: 1.5rem;
}

/* Header Badge */
.record-badge {
  background: #eff6ff;
  color: #2563eb;
  padding: 10px 16px;
  border-radius: 999px;
  font-weight: 700;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 6px;
}

/* Summary Cards */
.salary-stat-card {
  background: white;
  border-radius: 18px;
  padding: 1.5rem;
  border: 1px solid #edf2f7;
  box-shadow: 0 4px 14px rgba(0,0,0,0.04);
  transition: all 0.25s ease;
  height: 100%;
}

.salary-stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 26px rgba(0,0,0,0.07);
}

.stat-title {
  font-size: 14px;
  font-weight: 600;
  color: #64748b;
}

.stat-value {
  font-size: 2rem;
  font-weight: 800;
  margin-top: 8px;
  line-height: 1.2;
}

.stat-subtitle {
  font-size: 13px;
  margin-top: 4px;
}

/* Icons */
.icon-box {
  width: 58px;
  height: 58px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
}

.green-soft {
  background: #e8f8ee;
  color: #16a34a;
}

.blue-soft {
  background: #eaf4ff;
  color: #2563eb;
}

.orange-soft {
  background: #fff7ed;
  color: #f97316;
}

/* Table */
.history-card {
  border-radius: 18px;
  overflow: hidden;
}

.history-table th {
  font-size: 14px;
  color: #64748b;
  font-weight: 700;
  white-space: nowrap;
}

.history-table td {
  vertical-align: middle;
}

.history-table tbody tr {
  transition: 0.2s;
}

.history-table tbody tr:hover {
  background: #f8fafc;
}

.reason-column {
  max-width: 250px;
  white-space: normal;
}

/* Responsive */
@media (max-width: 768px) {

  .stat-value {
    font-size: 1.5rem;
  }

  .history-table {
    min-width: 760px;
  }

}
</style>
