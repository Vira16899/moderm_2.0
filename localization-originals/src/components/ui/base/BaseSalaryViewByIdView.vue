<template>

  <!-- Loading -->
  <div v-if="loading" class="salary-detail-wrapper">
    <SkeletonLoader type="detail" framed />
  </div>

  <!-- Empty -->
  <div v-else-if="!record" class="text-center py-5 text-muted">
    <div>
      <h3 class="fw-bold mb-1 d-flex align-items-center gap-2">
        <i class="bi bi-cash-stack text-primary fs-4"></i>
        ប្រវត្តិប្រាក់បៀវត្សន៍
      </h3>
      <p class="text-muted small mb-0">ព័ត៌មានលម្អិតអំពីការកែសម្រួលប្រាក់បៀវត្សន៍</p>
    </div>
    <i class="bi bi-wallet2 fs-1 d-block mb-3"></i>
    មិនមានប្រវត្តិប្រាក់បៀវត្សន៍ត្រូវបានរកឃើញទេ
  </div>

  <!-- Content -->
  <div v-else class="salary-detail-wrapper">

    <!-- Header -->
    <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">

      <div>
        <h3 class="fw-bold mb-1 d-flex align-items-center gap-2">
          <i class="bi bi-cash-stack text-primary fs-4"></i>
          ប្រវត្តិប្រាក់បៀវត្សន៍
        </h3>
        <p class="text-muted small mb-0">ព័ត៌មានលម្អិតអំពីការកែសម្រួលប្រាក់បៀវត្សន៍</p>
      </div>

      <div class="record-badge">
        <i class="bi bi-hash"></i>
        {{ record?.id || "-" }}
      </div>

    </div>

    <!-- Stats -->
    <div class="row g-4 mb-4">

      <!-- Previous Salary -->
      <div class="col-md-4">
        <div class="salary-stat-card">

          <div class="d-flex justify-content-between align-items-start">

            <div>
              <div class="stat-title d-flex align-items-center gap-2">
                <i class="bi bi-wallet2 text-success"></i>
                ប្រាក់បៀវត្សន៍ចាស់
              </div>

              <div class="stat-value">
                {{ formatCurrency(record?.previousSalary || 0) }}
              </div>
            </div>

            <div class="icon-box green-soft">
              <i class="bi bi-cash-coin"></i>
            </div>

          </div>

        </div>
      </div>

      <!-- New Salary -->
      <div class="col-md-4">
        <div class="salary-stat-card">

          <div class="d-flex justify-content-between align-items-start">

            <div>
              <div class="stat-title d-flex align-items-center gap-2">
                <i class="bi bi-cash text-primary"></i>
                ប្រាក់បៀវត្សន៍ថ្មី
              </div>

              <div class="stat-value">
                {{ formatCurrency(record?.newSalary || 0) }}
              </div>
            </div>

            <div class="icon-box blue-soft">
              <i class="bi bi-graph-up-arrow"></i>
            </div>

          </div>

        </div>
      </div>

      <!-- Change -->
      <div class="col-md-4">
        <div class="salary-stat-card">

          <div class="d-flex justify-content-between align-items-start">

            <div>
              <div class="stat-title d-flex align-items-center gap-2">
                <i class="bi bi-arrow-left-right text-warning"></i>
                បម្រែបម្រួល
              </div>

              <div class="stat-value" :class="changeClass">
                {{ salaryDifference }}
              </div>
            </div>

            <div class="icon-box orange-soft">
              <i class="bi bi-activity"></i>
            </div>

          </div>

        </div>
      </div>

    </div>

    <!-- Detail -->
    <div class="card border-0 shadow-sm salary-card">

      <div class="card-body">

        <div class="row g-4">

          <!-- Effective Date -->
          <div class="col-md-6">

            <label class="detail-label d-flex align-items-center gap-2">
              <i class="bi bi-calendar-event text-primary"></i>
              កាលបរិច្ឆេទអនុវត្ត
            </label>

            <div class="detail-value">
              {{ formatDate(record?.effectiveDate) }}
            </div>

          </div>

          <!-- Created At -->
          <div class="col-md-6">

            <label class="detail-label d-flex align-items-center gap-2">
              <i class="bi bi-clock-history text-secondary"></i>
              កាលបរិច្ឆេទទទួលទិន្នន័យ
            </label>

            <div class="detail-value">
              {{ formatDateTime(record?.createdAt) }}
            </div>

          </div>

          <!-- Reason -->
          <div class="col-12">

            <label class="detail-label d-flex align-items-center gap-2">
              <i class="bi bi-chat-left-text text-info"></i>
              មូលហេតុ
            </label>

            <div class="reason-box">
              {{ record?.changeReason || "មិនមានការបញ្ជាក់មូលហេតុទេ" }}
            </div>

          </div>

        </div>

      </div>

    </div>

  </div>

</template>

<script setup>
import { computed } from "vue";
import SkeletonLoader from "@/components/common/SkeletonLoader.vue";

const props = defineProps({
  record: { type: Object, default: null },
  loading: { type: Boolean, default: false }
});

const difference = computed(() => {
  if (!props.record) return 0;

  return (
    Number(props.record.newSalary || 0) -
    Number(props.record.previousSalary || 0)
  );
});

const salaryDifference = computed(() => {
  const sign = difference.value > 0 ? "+" : "";
  return `${sign}${formatCurrency(difference.value)}`;
});

const changeClass = computed(() => {
  if (difference.value > 0) return "text-success";
  if (difference.value < 0) return "text-danger";
  return "text-secondary";
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

const formatDateTime = (date) => {
  if (!date) return "-";
  return new Date(date).toLocaleString();
};
</script>

<style scoped>
.salary-detail-wrapper {
  padding: 1.5rem;
}

/* Header */
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
  box-shadow: 0 4px 10px rgba(37, 99, 235, 0.08);
}

/* Stat Card */
.salary-stat-card {
  background: white;
  border-radius: 18px;
  padding: 1.5rem;
  border: 1px solid #edf2f7;
  box-shadow: 0 4px 18px rgba(0, 0, 0, 0.04);
  transition: all 0.25s ease;
  height: 100%;
}

.salary-stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 26px rgba(0, 0, 0, 0.07);
}

/* Text */
.stat-title {
  font-size: 14px;
  font-weight: 600;
  color: #64748b;
}

.stat-value {
  font-size: 2rem;
  font-weight: 800;
  line-height: 1.2;
  margin-top: 8px;
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
  background: #e8f7ee;
  color: #16a34a;
}

.blue-soft {
  background: #eaf4ff;
  color: #0ea5e9;
}

/* Detail */
.salary-card {
  border-radius: 18px;
}

.detail-label {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #64748b;
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 10px;
}

.detail-value {
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
}

.reason-box {
  background: #f8fafc;
  padding: 1rem;
  border-radius: 14px;
  color: #334155;
  line-height: 1.7;
}

.card {
  border-radius: 16px;
}
</style>
