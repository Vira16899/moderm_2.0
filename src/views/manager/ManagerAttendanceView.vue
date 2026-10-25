<script setup>
import { computed, onMounted, ref } from "vue";
import { CalendarDays, Users } from "lucide-vue-next";
import { apiRequest } from "@/api/client";
import { API_ENDPOINTS } from "@/api/endpoints";
import AttendanceScan from "@/views/attendance/AttendanceScan.vue";

const records = ref([]);
const loading = ref(true);
const error = ref("");
const selectedDate = ref("");

function unwrapRows(payload) {
  const value = payload?.data?.data ?? payload?.data ?? payload;
  if (Array.isArray(value)) return value;
  for (const key of ["attendance", "records", "employees", "data"]) {
    if (Array.isArray(value?.[key])) return value[key];
  }
  return [];
}

async function loadAttendance() {
  loading.value = true;
  error.value = "";
  try {
    records.value = unwrapRows(await apiRequest(API_ENDPOINTS.attendance.getDepartment));
  } catch (cause) {
    error.value = cause.message || "Unable to load department attendance.";
  } finally {
    loading.value = false;
  }
}

onMounted(loadAttendance);

const filteredRecords = computed(() => {
  if (!selectedDate.value) return records.value;
  return records.value.filter((record) => {
    const date = record.attendance_date ?? record.date ?? record.created_at;
    return date && String(date).slice(0, 10) === selectedDate.value;
  });
});

const presentCount = computed(() => records.value.filter((record) => /present|on.?time|late|វត្តមាន/i.test(String(record.status ?? ""))).length);
const uniqueEmployees = computed(() => new Set(records.value.map((record) => record.user_id ?? record.employee_id ?? record.employee?.id ?? record.id)).size);

function employeeName(record) {
  const employee = record.employee ?? record.user ?? record;
  return employee.khmer_name ?? employee.nameKh ?? employee.Eng_name ?? employee.nameEn ?? employee.name ?? "—";
}
function statusClass(record) {
  const status = String(record.status ?? "").toLowerCase();
  if (/absent|missing|អវត្តមាន/.test(status)) return "status-absent";
  if (/leave|ច្បាប់/.test(status)) return "status-leave";
  if (/late|យឺត/.test(status)) return "status-late";
  return "status-present";
}
function displayDate(record) {
  const value = record.attendance_date ?? record.date ?? record.created_at;
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value).slice(0, 10) : date.toLocaleDateString("en-CA");
}
</script>

<template>
  <main class="attendance-page">
    <AttendanceScan />
    <div class="attendance-wrap">
      <header class="attendance-hero">
        <div>
          <span class="eyebrow"><CalendarDays :size="15" /> ការគ្រប់គ្រងផ្នែក</span>
          <h1>វត្តមានក្នុងផ្នែក</h1>
          <p>មើលកំណត់ត្រាវត្តមានរបស់បុគ្គលិកក្នុងផ្នែករបស់អ្នក</p>
        </div>
        <div class="hero-icon"><Users :size="34" /></div>
      </header>

      <section class="summary-grid" aria-label="Attendance summary">
        <article class="summary-card"><span class="summary-icon people"><Users :size="19" /></span><div><small>បុគ្គលិក</small><strong>{{ uniqueEmployees }}</strong></div></article>
        <article class="summary-card"><span class="summary-icon present"><CalendarDays :size="19" /></span><div><small>មានកំណត់ត្រាវត្តមាន</small><strong>{{ presentCount }}</strong></div></article>
      </section>

      <section class="records-panel">
        <div class="panel-head">
          <div><h2>កំណត់ត្រាវត្តមាន</h2><p>ទិន្នន័យសម្រាប់ផ្នែកដែលអ្នកគ្រប់គ្រង</p></div>
          <div class="filters">
            <label class="date-control"><CalendarDays :size="16" /><input v-model="selectedDate" type="date" aria-label="Filter by date" /></label>
            
          </div>
        </div>

        <div v-if="error" class="state error" role="alert">{{ error }}</div>
        <div v-else-if="loading" class="state">កំពុងទាញយកទិន្នន័យវត្តមាន…</div>
        <div v-else-if="!filteredRecords.length" class="state">មិនមានកំណត់ត្រាវត្តមានសម្រាប់កាលបរិច្ឆេទនេះទេ។</div>
        <div v-else class="table-scroll">
          <table>
            <thead><tr><th>បុគ្គលិក</th><th>កាលបរិច្ឆេទ</th><th>ម៉ោងចូល</th><th>ម៉ោងចេញ</th><th>ស្ថានភាព</th></tr></thead>
            <tbody>
              <tr v-for="(record, index) in filteredRecords" :key="record.id ?? record.attendance_id ?? index">
                <td class="employee-name">{{ employeeName(record) }}</td>
                <td>{{ displayDate(record) }}</td>
                <td>{{ record.check_in ?? record.checkInTime ?? record.clock_in ?? "—" }}</td>
                <td>{{ record.check_out ?? record.checkOutTime ?? record.clock_out ?? "—" }}</td>
                <td><span class="status-pill" :class="statusClass(record)"><i></i>{{ record.status ?? "បានកត់ត្រា" }}</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </main>
</template>

<style scoped>
.attendance-page{min-height:100%;padding:24px;background:transparent;color:var(--ink)}.attendance-wrap{max-width:1200px;margin:auto;display:grid;gap:20px}.attendance-hero{position:relative;overflow:hidden;display:flex;justify-content:space-between;align-items:center;padding:28px 32px;border:1px solid #078795;border-radius:18px;background:var(--action-fill);box-shadow:var(--action-shadow)}.eyebrow{display:inline-flex;align-items:center;gap:8px;color:#d6ffff;font-size:12px;font-weight:700}.attendance-hero h1{margin:8px 0 4px;font-size:28px;font-weight:750;color:#fff}.attendance-hero p,.panel-head p{margin:0;color:#d8f7f8;font-size:14px}.hero-icon{display:grid;place-items:center;width:68px;height:68px;border:1px solid #ffffff42;border-radius:18px;color:#fff;background:#ffffff18}.summary-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.summary-card{display:flex;align-items:center;gap:14px;padding:18px;border:1px solid var(--line);border-radius:14px;background:var(--surface);box-shadow:var(--workspace-shadow)}.summary-card small{display:block;color:var(--muted);font-size:12px}.summary-card strong{display:block;margin-top:3px;color:var(--ink);font-size:24px}.summary-icon{display:grid;place-items:center;width:42px;height:42px;border-radius:12px}.people{color:var(--blue);background:var(--soft)}.present{color:#08764f;background:#e8faf3}.records-panel{overflow:hidden;border:1px solid var(--line);border-radius:16px;background:var(--surface);box-shadow:var(--workspace-shadow)}.panel-head{display:flex;justify-content:space-between;align-items:center;gap:16px;padding:20px;border-bottom:1px solid var(--line)}.panel-head h2{margin:0 0 5px;color:var(--ink);font-size:17px;font-weight:700}.filters{display:flex;align-items:center;gap:9px}.date-control,.refresh-button{display:flex;align-items:center;gap:8px;min-height:38px;padding:0 11px;border:1px solid var(--line);border-radius:9px;color:var(--ink);background:var(--soft)}.date-control svg,.refresh-button{color:var(--blue)}.date-control input{width:130px;border:0;outline:none;color:var(--ink);background:transparent}.refresh-button{cursor:pointer;font-size:13px}.refresh-button:hover{border-color:var(--blue)}.refresh-button:disabled{opacity:.55;cursor:wait}.state{padding:36px 20px;text-align:center;color:var(--muted)}.state.error{color:#a62d42}.table-scroll{overflow:auto}table{width:100%;border-collapse:collapse;text-align:left;font-size:13px}th{padding:12px 18px;background:var(--soft);color:var(--muted);font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.04em}td{padding:14px 18px;border-top:1px solid var(--line);color:var(--muted);white-space:nowrap}.employee-name{color:var(--ink);font-weight:600}.status-pill{display:inline-flex;align-items:center;gap:7px;padding:5px 9px;border-radius:999px;font-size:11px;font-weight:700}.status-pill i{width:6px;height:6px;border-radius:50%;background:currentColor}.status-present{color:#08764f;background:#e8faf3}.status-late{color:#946200;background:#fff4d6}.status-absent{color:#a62d42;background:#fff0f2}.status-leave{color:#2563a8;background:#e7f2ff}.spinning{animation:spin 1s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}@media(max-width:640px){.attendance-page{padding:14px}.attendance-hero{padding:22px}.attendance-hero h1{font-size:23px}.hero-icon{width:52px;height:52px}.summary-grid{gap:10px}.summary-card{padding:13px}.panel-head{align-items:flex-start;flex-direction:column}.filters{width:100%}.date-control{flex:1}.date-control input{width:100%}.refresh-button{white-space:nowrap}}

.dark .attendance-page .present{color:#8ce7c4;background:#14362f}.dark .attendance-page .status-present{color:#8ce7c4;background:#14362f}.dark .attendance-page .status-late{color:#fbbf24;background:#4a3412}.dark .attendance-page .status-absent{color:#ffabb8;background:#3e272d}.dark .attendance-page .status-leave{color:#7dd3fc;background:#123b5c}
</style>
