<template>
  <div class="container-fluid p-4">
    <!-- Header Section -->
    <header
      class="page-header mb-5 d-flex justify-content-between align-items-center"
    >
      <div>
        <h3 class="fw-bold text-dark mb-1">ផ្ទាំងគ្រប់គ្រងអ្នកគ្រប់គ្រង</h3>
        <p class="text-muted small mb-0">
          សួស្តី {{ authStore.profile?.fullname || "អ្នកគ្រប់គ្រង" }}!
          សុខសប្បាយជាទេ Tangleat!
        </p>
      </div>
      <div class="d-none d-md-block">
        <span class="badge bg-light text-dark border px-3 py-2 rounded-pill">
          <i class="bi bi-calendar3 me-2"></i> {{ currentDate }}
        </span>
      </div>
    </header>

    <!-- Stats Section -->
    <div class="row g-4 mb-5">
      <div class="col-12 col-md-6 col-xl-3">
        <StatCard
          title="បុគ្គលិកសកម្ម"
          :value="groupStore.myStaffs.length"
          icon="bi bi-people"
          iconColor="text-primary"
          bgColor="bg-light-blue"
        />
      </div>

      <div class="col-12 col-md-6 col-xl-3">
        <StatCard
          title="ក្រុម"
          :value="groupStore.myGroups.length"
          icon="bi bi-diagram-3"
          iconColor="text-success"
          bgColor="bg-light-green"
        />
      </div>

      <div class="col-12 col-md-6 col-xl-3">
        <StatCard
          title="របាយការណ៍ដែលមិនទាន់បើក"
          :value="reportStore.reportStats.open"
          icon="bi bi-file-earmark-text"
          iconColor="text-warning"
          bgColor="bg-light-orange"
        />
      </div>

      <div class="col-12 col-md-6 col-xl-3">
        <StatCard
          title="កំពុងរង់ចាំការអនុម័ត"
          :value="reportStore.reportStats.pending"
          icon="bi bi-bell"
          iconColor="text-danger"
          bgColor="bg-light-danger"
        />
      </div>

      <div class="col-12 col-md-6 col-xl-3">
        <StatCard
          title="បានបញ្ចប់"
          :value="reportStore.reportStats.reviewed"
          icon="bi bi-check-circle"
          iconColor="text-success"
          bgColor="bg-light-green"
        />
      </div>
    </div>

    <!-- Charts & Activity Section -->
    <div class="row g-4">
      <!-- Left Column: Reports Analysis -->
      <div class="col-12 col-lg-8">
        <div class="row g-4">
          <!-- Weekly Reports Graph (Simple Bar Chart) -->
          <div class="col-12">
            <BaseCard title="លំហូររបាយការណ៍">
              <template #headerAction>
                <span class="badge bg-light text-secondary border-0 fw-bold"
                  >{{ reportStore.reports.length }} សរុប</span
                >
              </template>
              <div class="chart-container py-3">
                <div
                  class="d-flex align-items-end justify-content-between gap-2 h-200"
                >
                  <div class="bar-wrapper text-center flex-grow-1">
                    <div
                      class="bar bg-secondary rounded-top transition-all"
                      :style="{ height: `${reportFlowData.draft.percentage}%` }"
                      :title="`${reportFlowData.draft.count} ព្រាង`"
                    >
                      <span
                        class="bar-value text-white small fw-bold"
                        v-if="reportFlowData.draft.count > 0"
                        >{{ reportFlowData.draft.count }}</span
                      >
                    </div>
                    <div class="mt-2 text-muted small fw-medium">ព្រាង</div>
                  </div>

                  <div class="bar-wrapper text-center flex-grow-1">
                    <div
                      class="bar bg-warning rounded-top transition-all"
                      :style="{
                        height: `${reportFlowData.submitted.percentage}%`,
                      }"
                      :title="`${reportFlowData.submitted.count} បានដាក់ជូន`"
                    >
                      <span
                        class="bar-value text-white small fw-bold"
                        v-if="reportFlowData.submitted.count > 0"
                        >{{ reportFlowData.submitted.count }}</span
                      >
                    </div>
                    <div class="mt-2 text-muted small fw-medium">
                      បានដាក់ជូន
                    </div>
                  </div>

                  <div class="bar-wrapper text-center flex-grow-1">
                    <div
                      class="bar bg-success rounded-top transition-all"
                      :style="{
                        height: `${reportFlowData.reviewed.percentage}%`,
                      }"
                      :title="`${reportFlowData.reviewed.count} បានពិនិត្យ`"
                    >
                      <span
                        class="bar-value text-white small fw-bold"
                        v-if="reportFlowData.reviewed.count > 0"
                        >{{ reportFlowData.reviewed.count }}</span
                      >
                    </div>
                    <div class="mt-2 text-muted small fw-medium">
                      បានពិនិត្យ
                    </div>
                  </div>
                </div>
              </div>
            </BaseCard>
          </div>

          <!-- Recent Reports Table -->
          <div class="col-12">
            <BaseCard title="របាយការណ៍ថ្មីៗ">
              <template #headerAction>
                <router-link
                  :to="{ name: 'managerReports' }"
                  class="btn btn-sm btn-link text-primary p-0 text-decoration-none"
                  >មើលទាំងអស់</router-link
                >
              </template>
              <div class="table-responsive">
                <table class="table table-hover align-middle mb-0">
                  <thead class="bg-light">
                    <tr>
                      <th class="border-0 small text-muted">បុគ្គលិក</th>
                      <th class="border-0 small text-muted">ចំណងជើង</th>
                      <th class="border-0 small text-muted">ស្ថានភាព</th>
                      <th class="border-0 small text-muted text-end">
                        សកម្មភាព
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="report in recentReports" :key="report.id">
                      <td>
                        <div class="d-flex align-items-center gap-2">
                          <div
                            class="avatar-sm bg-light-blue rounded-circle d-flex align-items-center justify-content-center text-primary fw-bold"
                            style="width: 32px; height: 32px; font-size: 12px"
                          >
                            {{
                              (
                                report.staff?.fullname ||
                                report.staffName ||
                                "?"
                              ).charAt(0)
                            }}
                          </div>
                          <span class="small fw-medium">{{
                            report.staff?.fullname || report.staffName || "N/A"
                          }}</span>
                        </div>
                      </td>
                      <td>
                        <div
                          class="text-truncate small"
                          style="max-width: 150px"
                          :title="report.title"
                        >
                          {{ report.title }}
                        </div>
                      </td>
                      <td>
                        <span
                          :class="
                            getStatusBadgeClass(report.status.toUpperCase())
                          "
                          class="smaller"
                        >
                          {{ getStatusLabel(report.status.toUpperCase()) }}
                        </span>
                      </td>
                      <td class="text-end">
                        <router-link
                          :to="{ name: 'managerReports' }"
                          class="btn btn-sm btn-light-primary rounded-pill px-3 smaller"
                        >
                          មើល
                        </router-link>
                      </td>
                    </tr>
                    <tr v-if="recentReports.length === 0">
                      <td colspan="4" class="text-center py-4 text-muted small">
                        មិនមានរបាយការណ៍ថ្មីៗទេ
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </BaseCard>
          </div>
        </div>
      </div>

      <!-- Right Column: Distribution & Quick Stats -->
      <div class="col-12 col-lg-4">
        <div class="row g-4">
          <!-- Workspace Mix (Doughnut Chart) -->
          <div class="col-12">
            <BaseCard title="សមាសភាពការងារ">
              <div class="d-flex flex-column align-items-center py-4">
                <div class="position-relative mb-4">
                  <svg
                    width="180"
                    height="180"
                    viewBox="0 0 42 42"
                    class="doughnut-svg"
                  >
                    <circle
                      class="doughnut-hole"
                      cx="21"
                      cy="21"
                      r="15.91549430918954"
                      fill="#fff"
                    ></circle>
                    <circle
                      class="doughnut-ring"
                      cx="21"
                      cy="21"
                      r="15.91549430918954"
                      fill="transparent"
                      stroke="#f1f1f1"
                      stroke-width="3"
                    ></circle>

                    <!-- Segment: Staff -->
                    <circle
                      class="doughnut-segment transition-all"
                      cx="21"
                      cy="21"
                      r="15.91549430918954"
                      fill="transparent"
                      stroke="#007bff"
                      stroke-width="3"
                      :stroke-dasharray="`${workspaceMix.staff.percentage} ${
                        100 - workspaceMix.staff.percentage
                      }`"
                      stroke-dashoffset="25"
                    ></circle>

                    <!-- Segment: Groups -->
                    <circle
                      class="doughnut-segment transition-all"
                      cx="21"
                      cy="21"
                      r="15.91549430918954"
                      fill="transparent"
                      stroke="#28a745"
                      stroke-width="3"
                      :stroke-dasharray="`${workspaceMix.groups.percentage} ${
                        100 - workspaceMix.groups.percentage
                      }`"
                      :stroke-dashoffset="25 - workspaceMix.staff.percentage"
                    ></circle>

                    <!-- Segment: Reports -->
                    <circle
                      class="doughnut-segment transition-all"
                      cx="21"
                      cy="21"
                      r="15.91549430918954"
                      fill="transparent"
                      stroke="#ffc107"
                      stroke-width="3"
                      :stroke-dasharray="`${workspaceMix.reports.percentage} ${
                        100 - workspaceMix.reports.percentage
                      }`"
                      :stroke-dashoffset="
                        25 -
                        workspaceMix.staff.percentage -
                        workspaceMix.groups.percentage
                      "
                    ></circle>
                  </svg>
                  <div
                    class="doughnut-content position-absolute top-50 start-50 translate-middle text-center"
                  >
                    <h4 class="mb-0 fw-bold">
                      {{ workspaceMix.totalRecords }}
                    </h4>
                    <small class="text-muted smaller">កំណត់ត្រា</small>
                  </div>
                </div>

                <div class="w-100">
                  <div
                    class="d-flex justify-content-between align-items-center mb-2 px-2"
                  >
                    <div class="d-flex align-items-center gap-2">
                      <span class="dot bg-primary"></span>
                      <span class="small text-muted">បុគ្គលិក</span>
                    </div>
                    <span class="small fw-bold">{{
                      workspaceMix.staff.count
                    }}</span>
                  </div>
                  <div
                    class="d-flex justify-content-between align-items-center mb-2 px-2"
                  >
                    <div class="d-flex align-items-center gap-2">
                      <span class="dot bg-success"></span>
                      <span class="small text-muted">ក្រុម</span>
                    </div>
                    <span class="small fw-bold">{{
                      workspaceMix.groups.count
                    }}</span>
                  </div>
                  <div
                    class="d-flex justify-content-between align-items-center mb-2 px-2"
                  >
                    <div class="d-flex align-items-center gap-2">
                      <span class="dot bg-warning"></span>
                      <span class="small text-muted">របាយការណ៍</span>
                    </div>
                    <span class="small fw-bold">{{
                      workspaceMix.reports.count
                    }}</span>
                  </div>
                </div>
              </div>
            </BaseCard>
          </div>

          <!-- Top Groups -->
          <div class="col-12">
            <BaseCard title="ក្រុមឆ្នើម">
              <div class="activity-list">
                <div v-for="group in topGroups" :key="group.id" class="mb-3">
                  <div
                    class="d-flex justify-content-between align-items-center mb-1"
                  >
                    <span class="text-dark small fw-medium">{{
                      group.name
                    }}</span>
                    <span class="fw-bold text-success smaller"
                      >{{ group.performance }}%</span
                    >
                  </div>
                  <div class="progress" style="height: 6px">
                    <div
                      class="progress-bar bg-success rounded-pill"
                      role="progressbar"
                      :style="{ width: `${group.performance}%` }"
                      :aria-valuenow="group.performance"
                      aria-valuemin="0"
                      aria-valuemax="100"
                    ></div>
                  </div>
                </div>
                <div
                  v-if="topGroups.length === 0"
                  class="text-center py-3 text-muted small"
                >
                  មិនមានទិន្នន័យក្រុម
                </div>
              </div>
            </BaseCard>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import StatCard from "@/components/ui/base/StatCard.vue";
import BaseCard from "@/components/ui/base/BaseCard.vue";
import { useGroupManagerStore } from "@/stores/useGroupManagerStore";
import { useReportManagerStore } from "@/stores/useReportManagerStore";
import { useNotificationStore } from "@/stores/useNotificationStore";
import { useAuthStore } from "@/stores/useAuth";

const groupStore = useGroupManagerStore();
const reportStore = useReportManagerStore();
const notiStore = useNotificationStore();
const authStore = useAuthStore();

const currentDate = computed(() => {
  return new Date().toLocaleDateString("km-KH", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
});

const reportFlowData = computed(() => {
  const totalReports = reportStore.reports.length;
  const draftCount = reportStore.reportStats.open;
  const submittedCount = reportStore.reportStats.pending;
  const reviewedCount = reportStore.reportStats.reviewed;

  const calculatePercentage = (count) =>
    totalReports === 0 || count === 0
      ? 0
      : Math.max(15, Math.round((count / totalReports) * 100));

  return {
    draft: { count: draftCount, percentage: calculatePercentage(draftCount) },
    submitted: {
      count: submittedCount,
      percentage: calculatePercentage(submittedCount),
    },
    reviewed: {
      count: reviewedCount,
      percentage: calculatePercentage(reviewedCount),
    },
  };
});

const recentReports = computed(() => {
  return reportStore.reports.slice(0, 5);
});

const workspaceMix = computed(() => {
  const staffCount = groupStore.myStaffs.length;
  const groupCount = groupStore.myGroups.length;
  const reportCount = reportStore.reports.length;
  const totalRecords = staffCount + groupCount + reportCount;

  const calculatePercentage = (count) =>
    totalRecords === 0 ? 0 : Math.round((count / totalRecords) * 100);

  return {
    staff: { count: staffCount, percentage: calculatePercentage(staffCount) },
    groups: { count: groupCount, percentage: calculatePercentage(groupCount) },
    reports: {
      count: reportCount,
      percentage: calculatePercentage(reportCount),
    },
    totalRecords,
  };
});

// Mock group performance data
const topGroups = computed(() => {
  return groupStore.myGroups.slice(0, 3).map((g) => ({
    id: g.id,
    name: g.name,
    performance: Math.floor(Math.random() * (95 - 70 + 1) + 70), // Random percentage between 70-95
  }));
});

const getStatusBadgeClass = (status) => {
  switch (status) {
    case "REVIEWED":
      return "badge bg-light-success text-success border-0";
    case "SUBMITTED":
      return "badge bg-light-warning text-warning border-0";
    case "DRAFT":
      return "badge bg-light-secondary text-secondary border-0";
    default:
      return "badge bg-light text-secondary border-0";
  }
};

const getStatusLabel = (status) => {
  switch (status) {
    case "REVIEWED":
      return "បានពិនិត្យ";
    case "DRAFT":
      return "ព្រាង";
    case "SUBMITTED":
      return "បានដាក់ជូន";
    default:
      return status;
  }
};

const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("km-KH", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

onMounted(async () => {
  await Promise.all([
    groupStore.fetchMyGroups(),
    groupStore.fetchMyStaffs(),
    reportStore.fetchReports({ _per_page: 20 }),
    notiStore.fetchNotifications(),
  ]);
});
</script>

<style scoped>
.page-header h3 {
  letter-spacing: -0.02em;
}

.h-200 {
  height: 200px;
}

.bar-wrapper {
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}

.bar {
  width: 100%;
  min-width: 30px;
  position: relative;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 8px;
  cursor: pointer;
}

.bar-value {
  opacity: 0;
  transition: opacity 0.3s;
}

.bar:hover {
  filter: brightness(1.1);
  transform: scaleY(1.02);
}

.bar:hover .bar-value {
  opacity: 1;
}

.bg-primary-gradient {
  background: linear-gradient(180deg, #52796f 0%, #354f52 100%);
}

.bg-light-danger {
  background-color: #ffebee !important;
}

.bg-light-warning {
  background-color: #fff8e1 !important;
}

.bg-light-success {
  background-color: #e8f5e9 !important;
}

.bg-light-blue {
  background-color: #e3f2fd !important;
}

.bg-light-green {
  background-color: #e8f5e9 !important;
}

.bg-light-orange {
  background-color: #fff3e0 !important;
}

.btn-light-primary {
  background-color: #e3f2fd;
  color: #0d6efd;
  border: none;
}

.btn-light-primary:hover {
  background-color: #0d6efd;
  color: white;
}

.border-bottom-light {
  border-bottom: 1px solid #f8f9fa;
}

.hover-bg-light:hover {
  background-color: #f8f9fa;
}

.transition-all {
  transition: all 0.3s ease;
}

.smallest {
  font-size: 0.7rem;
}

.smaller {
  font-size: 0.8rem;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}

.doughnut-svg {
  transform: rotate(-90deg);
}

.doughnut-segment {
  stroke-linecap: round;
}

.progress {
  background-color: #f0f2f5;
  overflow: visible;
}

.progress-bar {
  transition: width 1s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.container-fluid {
  animation: fadeIn 0.5s ease-out;
}
</style>
