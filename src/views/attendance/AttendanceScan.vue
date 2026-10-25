<script setup>
import { computed, onMounted, ref } from "vue";
import AttendanceScanner from "@/components/attendance/AttendanceScanner.vue";
import { apiRequest } from "@/api/client";
import { API_ENDPOINTS } from "@/api/endpoints";
import { employeeApi } from "@/api/employeeApi";
import { attendanceHistory as normalizeHistory, localToday } from '@/api/employeeData';
import { CalendarDays, CheckCircle2, QrCode, ScanLine } from "lucide-vue-next";

const showScanner = ref(false);
const attendance = ref(null);
const isLoading = ref(false);
const isSubmitting = ref(false);
const errorMessage = ref("");
const successMessage = ref("");
const attendanceHistory = ref([]);

const sessionLabels = {
  MORNING_CHECK_IN: "ចូលពេលព្រឹក",
  MORNING_CHECK_OUT: "ចេញពេលព្រឹក",
  AFTERNOON_CHECK_IN: "ចូលពេលរសៀល",
  AFTERNOON_CHECK_OUT: "ចេញពេលរសៀល",
};

const attendanceRows = computed(() => Object.entries(sessionLabels).map(([key, label]) => {
  const isCheckIn = key.endsWith("CHECK_IN");
  return {
    key,
    label,
    value: attendance.value?.[key]
      ?? attendance.value?.[key.toLowerCase()]
      ?? attendance.value?.[key.replaceAll("_", "").toLowerCase()]
      ?? (isCheckIn ? attendance.value?.checkInTime ?? attendance.value?.check_in : attendance.value?.checkOutTime ?? attendance.value?.check_out),
  };
}));

function unwrapAttendance(payload) {
  return payload?.data?.attendance
    ?? payload?.data?.record
    ?? payload?.data
    ?? payload?.attendance
    ?? payload?.record
    ?? payload;
}

const openScanner = () => {
  errorMessage.value = "";
  successMessage.value = "";
  showScanner.value = true;
};

const closeScanner = () => {
  showScanner.value = false;
};

const loadToday = async () => {
  isLoading.value = true;
  try {
    const payload = await employeeApi.getAttendance();
    const list = normalizeHistory(payload);
    attendanceHistory.value = list;
    attendance.value = list.find(record => record.date === localToday()) ?? null;
    errorMessage.value = '';
  } catch (error) {
    errorMessage.value = error.message || "មិនអាចទាញយកប្រវត្តិវត្តមានបានទេ។";
  } finally {
    isLoading.value = false;
  }
};

const handleScanned = async (qrToken) => {
  isSubmitting.value = true;
  errorMessage.value = "";
  successMessage.value = "";
  showScanner.value = false;

  try {
    const payload = await apiRequest(API_ENDPOINTS.attendance.scan, {
      body: { qr_token: qrToken },
    });
    attendance.value = unwrapAttendance(payload) || attendance.value;
    successMessage.value = payload?.message || payload?.msg || "បានកត់ត្រាវត្តមានដោយជោគជ័យ។";
    await loadToday();
  } catch (error) {
    errorMessage.value = error.message || "មិនអាចកត់ត្រាវត្តមានបានទេ។";
  } finally {
    isSubmitting.value = false;
  }
};

onMounted(loadToday);
</script>

<template>
  <div class="attendance-page">

    <!-- Page Header -->
    <div class="page-header">
      <div>
        <span class="page-eyebrow"><ScanLine :size="14" /> វត្តមានបុគ្គលិក</span>
        <h1>វត្តមានរបស់ខ្ញុំ</h1>

        <p>
          គ្រប់គ្រង និងកត់ត្រាការចូលរួមការងាររបស់អ្នក
        </p>
      </div>
      <div class="attendance-date"><CalendarDays :size="16" /><span>ថ្ងៃនេះ</span></div>
    </div>

    <section class="attendance-overview">
      <!-- Scan Card -->
      <div class="scan-card">
        <div class="scan-card-content">
          <span class="scan-icon"><QrCode :size="28" /></span>
          <span class="scan-label">កត់ត្រាវត្តមាន</span>
          <h2>ស្កេន QR Code របស់ថ្ងៃនេះ</h2>
          <p>ស្កេន QR Code ដែលបង្ហាញនៅ Factory TV ដើម្បីកត់ត្រាម៉ោងចូល ឬម៉ោងចេញ។</p>
          <button type="button" class="scan-button" :disabled="isSubmitting" @click="openScanner">
            <ScanLine :size="18" />
            <span>{{ isSubmitting ? "កំពុងរក្សាទុក..." : "បើកម៉ាស៊ីនស្កេន" }}</span>
          </button>
        </div>
        <div class="scan-card-mark" aria-hidden="true"><QrCode :size="132" :stroke-width="1" /></div>
      </div>

      <!-- Today's Attendance -->
      <div class="attendance-card today-card">
        <div class="card-heading">
          <div><span class="card-kicker">សង្ខេប</span><h2>វត្តមានថ្ងៃនេះ</h2></div>
          
        </div>
        <div class="attendance-rows">
          <div v-for="row in attendanceRows" :key="row.key" class="attendance-row">
            <span class="row-label"><i :class="{ recorded: row.value }"><CheckCircle2 :size="15" /></i>{{ row.label }}</span>
            <span class="status" :class="{ recorded: row.value, pending: !row.value }">{{ row.value || "មិនទាន់កត់ត្រា" }}</span>
          </div>
        </div>
      </div>
    </section>

    <div v-if="isLoading" class="message">កំពុងទាញយកវត្តមានថ្ងៃនេះ...</div>
    <div
      v-if="successMessage"
      class="scan-success"
      role="status"
      aria-live="polite"
    >
      <CheckCircle2 :size="24" aria-hidden="true" />
      <span>{{ successMessage }}</span>
    </div>
    <div v-if="errorMessage" class="message error" role="alert">{{ errorMessage }}</div>

    <p v-if="!isLoading && !errorMessage && !attendanceHistory.length" class="message">មិនទាន់មានប្រវត្តិវត្តមានទេ។</p>
    <button v-if="errorMessage" type="button" class="scan-button" :disabled="isLoading" @click="loadToday">ព្យាយាមម្ដងទៀត</button>
    <div v-if="attendanceHistory.length" class="attendance-card history-card">
      <div class="card-heading history-heading"><div><span class="card-kicker">កំណត់ត្រា</span><h2>ប្រវត្តិវត្តមាន</h2></div><span class="history-count">{{ attendanceHistory.length }} កំណត់ត្រា</span></div>
      <div class="history-table">
        <div class="history-table-head"><span>កាលបរិច្ឆេទ</span><span>ម៉ោងចូល</span><span>ម៉ោងចេញ</span></div>
        <div v-for="(record, index) in attendanceHistory" :key="record.id || record.attendance_id || index" class="history-row">
          <strong>{{ record.date || record.attendance_date || record.created_at || "—" }}</strong>
          <span>{{ record.checkInTime || record.check_in || record.clockIn || "មិនមានម៉ោងចូល" }}</span>
          <span>{{ record.checkOutTime || record.check_out || record.clockOut || "មិនមានម៉ោងចេញ" }}</span>
        </div>
      </div>
    </div>

    <!-- Scanner -->
    <AttendanceScanner
      v-if="showScanner"
      @scanned="handleScanned"
      @close="closeScanner"
    />

  </div>
</template>

<style scoped>
.attendance-page {
  min-height: 100%;
  padding: 0;
  color: var(--ink);
  background: transparent;
}

.page-header h1 {
  margin: 0;

  font-size: 30px;
  font-weight: 700;
}

.page-header p {
  margin-top: 6px;

  color: var(--muted);
}

.scan-card {
  margin-top: 30px;

  padding: 40px;

  background: var(--surface);
  border: 1px solid var(--line);

  border-radius: 20px;

  text-align: center;

  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
}

.scan-icon {
  font-size: 50px;
}

.scan-card h2 {
  margin-top: 15px;

  font-size: 24px;
  font-weight: 700;
  color: var(--ink);
}

.scan-card p {
  max-width: 500px;

  margin: 10px auto 25px;

  color: var(--muted);

  line-height: 1.6;
}

.scan-button {
  display: inline-flex;

  align-items: center;
  justify-content: center;

  gap: 10px;

  padding: 13px 28px;

  border: none;
  border-radius: 10px;

  background: var(--action-fill);
  color: white;

  font-size: 16px;
  font-weight: 600;

  cursor: pointer;

  transition: 0.2s;
}

.scan-button:hover {
  transform: translateY(-1px);
  opacity: 0.9;
}

.scan-button:disabled {
  cursor: wait;
  opacity: 0.65;
}

.message {
  margin-top: 18px;
  padding: 12px 16px;
  border-radius: 10px;
  background: var(--soft);
  color: var(--muted);
}

.message.success {
  background: #e8faf3;
  color: #08764f;
}

.scan-success {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 18px;
  padding: 16px 20px;
  border: 1px solid #a7e3c8;
  border-radius: 14px;
  background: #e8faf3;
  color: #08764f;
  font-size: 16px;
  font-weight: 700;
  box-shadow: 0 6px 18px #08764f14;
}

.message.error {
  background: #fff0f2;
  color: #a62d42;
}

.attendance-card {
  margin-top: 30px;

  padding: 25px;

  background: var(--surface);
  border: 1px solid var(--line);

  border-radius: 20px;

  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
}

.attendance-card h2 {
  margin-bottom: 20px;

  font-size: 20px;
  font-weight: 700;
  color: var(--ink);
}

.attendance-row {
  display: flex;

  justify-content: space-between;
  align-items: center;

  padding: 16px 0;

  border-bottom: 1px solid var(--line);
}

.attendance-row:last-child {
  border-bottom: none;
}

.status {
  padding: 5px 12px;

  border-radius: 20px;

  font-size: 13px;
  font-weight: 600;
}

.pending {
  background: var(--soft);
  color: var(--muted);
}

.recorded {
  background: #e8faf3;
  color: #08764f;
}

.history-card {
  margin-top: 20px;
}

.history-row {
  display: grid;
  grid-template-columns: 1.2fr 1fr 1fr;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid var(--line);
  color: var(--muted);
  font-size: 13px;
}

.history-row:last-child {
  border-bottom: none;
}

.page-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 22px;
}

.page-eyebrow,
.scan-label,
.card-kicker {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--blue);
  font-size: 11px;
  font-weight: 700;
}

.page-eyebrow { margin-bottom: 5px; }
.page-header h1 { font-size: 26px; letter-spacing: -0.02em; }
.attendance-date,
.history-count {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 9px 12px;
  border: 1px solid var(--line);
  border-radius: 12px;
  color: var(--muted);
  background: var(--surface);
  font-size: 11px;
  white-space: nowrap;
}

.attendance-overview {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(320px, 0.8fr);
  gap: 18px;
  align-items: stretch;
}

.scan-card {
  min-height: 300px;
  position: relative;
  isolation: isolate;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 34px 38px;
  text-align: left;
  background: var(--action-fill);
  border: 0;
  box-shadow: var(--action-shadow);
}

.scan-card::after {
  position: absolute;
  z-index: -1;
  content: '';
  width: 310px;
  height: 310px;
  right: -100px;
  bottom: -180px;
  border: 1px solid #ffffff28;
  border-radius: 50%;
  box-shadow: 0 0 0 35px #ffffff08, 0 0 0 70px #ffffff05;
}

.scan-card-content { position: relative; z-index: 1; max-width: 540px; }
.scan-label { color: #d6ffff; text-transform: uppercase; letter-spacing: .06em; }
.scan-card h2 { margin: 10px 0 6px; color: #fff; font-size: clamp(22px, 2.5vw, 30px); line-height: 1.35; }
.scan-card p { max-width: 480px; margin: 0 0 22px; color: #d8f7f8; font-size: 12px; line-height: 1.8; }
.scan-icon { width: 48px; height: 48px; display: grid; place-items: center; margin-bottom: 10px; border: 1px solid #ffffff42; border-radius: 15px; color: #fff; background: #ffffff18; }
.scan-card-mark { position: relative; z-index: 1; margin-right: 8%; color: #c8ffff; opacity: .72; }
.scan-button { min-height: 44px; padding: 10px 17px; border: 1px solid #ffffff45; border-radius: 12px; background: #fff; color: #087f8c; font-size: 12px; font-weight: 750; box-shadow: 0 6px 14px #005e6928; }
.scan-button:hover { opacity: 1; transform: translateY(-1px); background: #efffff; }

.today-card { margin-top: 0; padding: 22px; border-radius: 18px; box-shadow: var(--workspace-shadow); }
.card-heading { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding-bottom: 15px; border-bottom: 1px solid var(--line); }
.card-heading h2 { margin: 1px 0 0; font-size: 17px; }
.refresh-button { width: 32px; height: 32px; display: grid; place-items: center; border: 1px solid var(--line); border-radius: 10px; color: var(--blue); background: var(--soft); }
.refresh-button:disabled { opacity: .5; }
.refresh-button .spinning { animation: attendance-spin .8s linear infinite; }
.attendance-rows { padding-top: 4px; }
.attendance-row { min-height: 52px; padding: 10px 0; }
.row-label { display: inline-flex; align-items: center; gap: 8px; color: var(--ink); font-size: 12px; font-weight: 600; }
.row-label i { width: 26px; height: 26px; display: grid; place-items: center; border-radius: 9px; color: var(--muted); background: var(--soft); }
.row-label i.recorded { color: #087f8c; background: #e0f1f3; }
.status { padding: 5px 9px; font-size: 10px; }
.history-card { margin-top: 18px; padding: 22px; border-radius: 18px; box-shadow: var(--workspace-shadow); }
.history-heading { margin-bottom: 5px; }
.history-table-head, .history-row { display: grid; grid-template-columns: 1.2fr 1fr 1fr; gap: 12px; align-items: center; }
.history-table-head { padding: 12px 0 8px; color: var(--muted); font-size: 10px; font-weight: 700; }
.history-row { min-height: 48px; padding: 10px 0; font-size: 11px; }
.history-row strong { color: var(--ink); font-weight: 650; }
.history-row span { color: var(--muted); }
@keyframes attendance-spin { to { transform: rotate(360deg); } }

.dark .scan-card { background: var(--action-fill); }
.dark .scan-button { color: #075d69; background: #e8ffff; }
.dark .row-label i.recorded { color: #8ce7c4; background: #14362f; }

.dark .message.success,
.dark .recorded {
  background: #14362f;
  color: #8ce7c4;
}

.dark .message.error {
  background: #3e272d;
  color: #ffabb8;
}

@media (max-width: 640px) {
  .history-row {
    grid-template-columns: 1fr;
    gap: 3px;
  }
}

@media (max-width: 640px) {
  .attendance-page {
    padding: 15px;
  }

  .scan-card {
    padding: 25px 15px;
  }
}

@media (max-width: 860px) {
  .attendance-overview {
    grid-template-columns: 1fr;
  }

  .today-card {
    margin-top: 0;
  }

  .scan-card-mark {
    margin-right: 5%;
  }
}

@media (max-width: 560px) {
  .attendance-page {
    padding: 0;
  }

  .page-header {
    align-items: flex-start;
    flex-direction: column;
    gap: 10px;
  }

  .page-header h1 {
    font-size: 23px;
  }

  .scan-card {
    min-height: 0;
    padding: 24px;
  }

  .scan-card-mark {
    display: none;
  }

  .history-table-head {
    display: none;
  }

  .history-row {
    grid-template-columns: 1fr 1fr;
    gap: 4px 12px;
  }

  .history-row strong {
    grid-column: 1 / -1;
  }
}
</style>
