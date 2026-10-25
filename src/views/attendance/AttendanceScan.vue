<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import AttendanceScanner from '@/components/attendance/AttendanceScanner.vue';
import BaseButton from '@/components/base/BaseButton.vue';
import BaseTable from '@/components/base/BaseTable.vue';
import BaseSkeleton from '@/components/base/BaseSkeleton.vue';
import { apiRequest } from '@/api/client';
import { API_ENDPOINTS } from '@/api/endpoints';
import { employeeApi } from '@/api/employeeApi';
import { attendanceHistory as normalizeHistory, localToday } from '@/api/employeeData';
import { attendanceSlots, attendanceTime, attendanceState, attendanceStateLabel } from '@/api/attendancePresentation.js';
import { employeeError } from '@/utils/employeeMessages.js';
import { notify } from '@/stores/toasts.js';
import { CalendarDays, CheckCircle2, QrCode, ScanLine, Clock3, LogIn, LogOut, FileText } from 'lucide-vue-next';
defineProps({ manager: Boolean });
const emit = defineEmits(['recorded']);
const showScanner = ref(false), isLoading = ref(true), isSubmitting = ref(false), errorMessage = ref(''), history = ref([]), state = ref('all');
let loadVersion = 0;
onBeforeUnmount(() => { loadVersion++; });
const today = localToday();
const current = computed(() => history.value.find(record => record.date === today) ?? null);
const slots = computed(() => attendanceSlots(current.value));
const recordedSlots = computed(() => slots.value.filter(slot => slot.value != null && slot.value !== '').length);
const filtered = computed(() => history.value.filter(record => (state.value === 'all' || attendanceState(record) === state.value)));
const summary = computed(() => [
  { label: 'ថ្ងៃដែលមានកំណត់ត្រា', value: new Set(history.value.map(record => record.date).filter(Boolean)).size, icon: CalendarDays, tone: 'teal' },
  { label: 'កំណត់ត្រាម៉ោងចូល', value: history.value.filter(record => record.checkInTime).length, icon: LogIn, tone: 'green' },
  { label: 'កំណត់ត្រាម៉ោងចេញ', value: history.value.filter(record => record.checkOutTime).length, icon: LogOut, tone: 'blue' },
  { label: 'កំណត់ត្រាយឺត', value: history.value.filter(record => attendanceState(record) === 'late').length, icon: Clock3, tone: 'amber' },
]);
const columns = [{key:'date',label:'កាលបរិច្ឆេទ',sortable:true},{key:'checkInTime',label:'ម៉ោងចូល',sortable:true},{key:'checkOutTime',label:'ម៉ោងចេញ',sortable:true},{key:'status',label:'ស្ថានភាព',sortable:true}];
const number = value => new Intl.NumberFormat('km-KH').format(value);
const dateLabel = value => value && Number.isFinite(Date.parse(value)) ? new Intl.DateTimeFormat('km-KH', {timeZone:'UTC',day:'numeric',month:'short',year:'numeric'}).format(new Date(`${value.slice(0,10)}T12:00:00Z`)) : value || '—';
async function loadToday() {
  const version = ++loadVersion;
  isLoading.value = true; errorMessage.value = '';
  try { const rows = normalizeHistory(await employeeApi.getAttendance()); if (version === loadVersion) history.value = rows.map((record, index) => ({ ...record, id: record.id ?? record.attendance_id ?? `${record.date}-${index}` })); }
  catch(cause) { if (version === loadVersion) errorMessage.value = employeeError(cause,'មិនអាចទាញយកប្រវត្តិវត្តមានបានទេ។'); }
  finally { if (version === loadVersion) isLoading.value = false; }
}
function openScanner() { if (isSubmitting.value) return; showScanner.value = true; }
async function handleScanned(qrToken) {
  if (isSubmitting.value) return;
  showScanner.value = false; isSubmitting.value = true;
  try {
    await apiRequest(API_ENDPOINTS.attendance.scan, {body:{qr_token:qrToken}});
    notify('បានកត់ត្រាវត្តមានដោយជោគជ័យ។');
    await loadToday(); emit('recorded');
  } catch(cause) { notify(employeeError(cause,'មិនអាចកត់ត្រាវត្តមានបានទេ។ សូមព្យាយាមម្ដងទៀត។'), 'error'); }
  finally { isSubmitting.value = false; }
}
onMounted(loadToday);
</script>

<template>
  <section class="personal-attendance" :class="{ 'employee-attendance-page': !manager }">
    <header class="workspace-page-header pa-heading"><div><h1>វត្តមានរបស់ខ្ញុំ</h1><p>កត់ត្រាម៉ោងចូលចេញ និងពិនិត្យប្រវត្តិការងាររបស់អ្នក។</p></div><span class="pa-date"><CalendarDays :size="17" />{{ dateLabel(today) }}</span></header>
    <div class="pa-overview">
      <section class="pa-scan"><div class="pa-scan-copy"><span class="pa-scan-icon"><QrCode :size="26" /></span><h2>កត់ត្រាវត្តមានថ្ងៃនេះ</h2><p>ស្កេន QR សកម្មដែលបង្ហាញនៅកន្លែងធ្វើការ ដើម្បីកត់ត្រាម៉ោងចូល ឬម៉ោងចេញ។</p><BaseButton :loading="isSubmitting" :disabled="isSubmitting" @click="openScanner"><ScanLine :size="18" />បើកម៉ាស៊ីនស្កេន QR</BaseButton><small>សូមអនុញ្ញាតឱ្យប្រើកាមេរ៉ា នៅពេលបើកម៉ាស៊ីនស្កេន។</small></div><QrCode class="pa-scan-art" :size="150" :stroke-width="1" aria-hidden="true" /></section>
      <section class="pa-today" :aria-busy="isLoading" aria-labelledby="personal-today-title"><div class="pa-panel-heading"><div><h2 id="personal-today-title">វត្តមានថ្ងៃនេះ</h2><p>ម៉ោងដែលប្រព័ន្ធបានកត់ត្រា</p></div><span v-if="!isLoading && !errorMessage" class="pa-count">{{ number(recordedSlots) }}/{{ number(slots.length) }}</span></div><BaseSkeleton v-if="isLoading" :lines="2" /><p v-else-if="errorMessage" class="pa-muted">មិនទាន់អាចបង្ហាញវត្តមានបានទេ។</p><div v-else class="pa-slots"><div v-for="slot in slots" :key="slot.key"><span><CheckCircle2 v-if="slot.value" :size="17" /><Clock3 v-else :size="17" />{{ slot.label }}</span><strong :class="{recorded:slot.value}">{{ slot.value ? attendanceTime(slot.value) : 'មិនទាន់កត់ត្រា' }}</strong></div></div></section>
    </div>
    <div class="pa-summary" :aria-busy="isLoading" aria-label="សង្ខេបប្រវត្តិវត្តមាន"><div v-for="item in summary" :key="item.label" class="pa-metric"><span class="pa-metric-icon" :class="item.tone"><component :is="item.icon" :size="20" /></span><div><span>{{ item.label }}</span><strong><BaseSkeleton v-if="isLoading" inline :lines="1" /><template v-else>{{ errorMessage ? '—' : number(item.value) }}</template></strong></div></div></div>
    <section class="pa-history" aria-labelledby="personal-history-title"><div class="pa-toolbar"><div class="pa-panel-heading"><span class="pa-section-icon"><FileText :size="20" /></span><div><h2 id="personal-history-title">ប្រវត្តិវត្តមានរបស់ខ្ញុំ</h2><p>កំណត់ត្រាចូលចេញតាមកាលបរិច្ឆេទ</p></div></div><div class="pa-filters"><select v-model="state" aria-label="តម្រងស្ថានភាពវត្តមានរបស់ខ្ញុំ"><option value="all">គ្រប់ស្ថានភាព</option><option value="present">មានវត្តមាន</option><option value="late">យឺត</option><option value="absent">អវត្តមាន</option><option value="leave">ឈប់សម្រាក</option><option value="recorded">បានកត់ត្រា</option></select><BaseButton v-if="state !== 'all'" variant="ghost" size="sm" @click="state = 'all'">សម្អាតតម្រង</BaseButton></div></div>
      <BaseTable :columns="columns" :rows="filtered" :loading="isLoading" :error="errorMessage" caption="ប្រវត្តិវត្តមានរបស់ខ្ញុំ" :empty-text="state !== 'all' ? 'មិនមានកំណត់ត្រាត្រូវនឹងតម្រងនេះទេ។' : 'មិនទាន់មានប្រវត្តិវត្តមានទេ។'" @retry="loadToday"><template #cell-date="{value}"><span class="pa-table-date"><CalendarDays :size="15" />{{ dateLabel(value) }}</span></template><template #cell-checkInTime="{value}"><span class="pa-time" :class="{recorded:value}">{{ attendanceTime(value) }}</span></template><template #cell-checkOutTime="{value}"><span class="pa-time">{{ attendanceTime(value) }}</span></template><template #cell-status="{row}"><span class="pa-status" :class="attendanceState(row)"><i></i>{{ attendanceStateLabel(row) }}</span></template><template #empty-action><BaseButton v-if="state !== 'all'" variant="outline" @click="state = 'all'">សម្អាតតម្រង</BaseButton></template></BaseTable>
    </section>
    <AttendanceScanner v-if="showScanner" @scanned="handleScanned" @close="showScanner = false" />
  </section>
</template>

<style scoped>
.personal-attendance { display:grid; gap:22px; min-width:0; color:var(--ink); }
.pa-heading { display:flex; align-items:center; justify-content:space-between; gap:20px; }
.pa-heading h1 { font-size:clamp(24px,2.3vw,30px); font-weight:700; margin:6px 0 8px; }
.pa-heading p,.pa-panel-heading p { color:var(--muted); font-size:12px; line-height:1.8; }
.pa-date { display:inline-flex; align-items:center; gap:8px; border:1px solid var(--line); border-radius:11px; padding:10px 13px; color:var(--muted); font-size:12px; white-space:nowrap; }
.pa-overview { display:grid; grid-template-columns:minmax(0,1.2fr) minmax(0,1fr); gap:22px; }
.pa-scan { position:relative; overflow:hidden; border:1px solid var(--line); border-radius:20px; padding:26px; background:var(--surface); }
.pa-scan-copy { position:relative; z-index:1; max-width:400px; }
.pa-scan-icon { display:grid; place-items:center; width:48px; height:48px; background:var(--soft); color:var(--blue); border-radius:14px; margin-bottom:18px; }
.pa-scan h2 { font-size:21px; font-weight:650; margin-bottom:10px; }
.pa-scan p { font-size:13px; line-height:1.9; color:var(--muted); margin-bottom:20px; }
.pa-scan small { display:block; margin-top:12px; font-size:11px; line-height:1.8; color:var(--muted); }
.pa-scan-art { position:absolute; right:-22px; bottom:-20px; color:var(--blue); opacity:.055; transform:rotate(-12deg); }
.pa-today { padding:24px; border:1px solid var(--line); border-radius:20px; background:var(--surface); }
.pa-panel-heading { display:flex; align-items:center; gap:10px; }
.pa-today>.pa-panel-heading { justify-content:space-between; margin-bottom:20px; }
.pa-panel-heading h2 { font-size:17px; font-weight:650; margin-bottom:6px; }
.pa-count { border-radius:8px; background:var(--soft); color:var(--blue); padding:5px 9px; font-size:12px; }
.pa-slots { display:grid; }
.pa-slots>div { display:flex; align-items:center; justify-content:space-between; gap:12px; padding:16px 0; border-bottom:1px solid var(--line); }
.pa-slots>div:last-child { border:0; } .pa-slots>div>span { display:flex; align-items:center; gap:8px; color:var(--muted); font-size:12px; }
.pa-slots strong { font-size:12px; color:var(--muted); font-weight:500; }
.pa-slots svg { color:var(--blue); }
.recorded { color:#18744f !important; font-weight:600 !important; }
.pa-summary { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:16px; }
.pa-metric { display:flex; align-items:center; gap:12px; padding:18px; background:var(--surface); border:1px solid var(--line); border-radius:16px; min-width:0; }
.pa-metric-icon,.pa-section-icon { display:grid; place-items:center; width:40px; height:40px; border-radius:12px; flex-shrink:0; background:var(--soft); color:var(--blue); }
.pa-metric-icon.green { background:#e4f6ec; color:#18744f; } .pa-metric-icon.blue { background:#e6f1fc; color:#248fd1; } .pa-metric-icon.amber { background:#fff5df; color:#a46a13; }
.pa-metric>div>span { display:block; color:var(--muted); font-size:11px; line-height:1.8; } .pa-metric strong { display:block; font-size:25px; font-weight:700; margin-top:5px; }
.pa-history { min-width:0; border:1px solid var(--line); border-radius:18px; overflow:hidden; background:var(--surface); }
.pa-toolbar { display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:18px; padding:20px; }
.pa-filters { display:flex; align-items:center; flex-wrap:wrap; gap:10px; }
select { min-height:44px; border:1px solid var(--line); border-radius:10px; padding:8px 10px; font-size:12px; color:var(--ink); background:var(--surface); }
.pa-history :deep(.base-table-panel) { border:0; border-radius:0; box-shadow:none; } .pa-history :deep(.base-table td) { padding:11px 18px; height:60px; }
.pa-table-date { display:inline-flex; align-items:center; gap:8px; white-space:nowrap; font-size:12px; } .pa-table-date svg { color:var(--muted); }
.pa-time { font-size:13px; font-variant-numeric:tabular-nums; }
.pa-status { display:inline-flex; align-items:center; gap:6px; padding:4px 9px; border-radius:20px; font-size:11px; color:var(--muted); background:var(--soft); white-space:nowrap; }
.pa-status i { width:5px; height:5px; background:currentColor; border-radius:50%; }
.pa-status.present { background:#e4f6ec; color:#18744f; } .pa-status.late { background:#fff5df; color:#936113; } .pa-status.absent { background:#fff0f2; color:#a53b50; }
.pa-muted { font-size:12px; line-height:1.9; color:var(--muted); }
input:focus-visible,select:focus-visible { outline:2px solid var(--blue); outline-offset:3px; }
.dark .recorded { color:#83dfb4 !important; } .dark .pa-status.present,.dark .pa-metric-icon.green { color:#83dfb4; background:#183b30; } .dark .pa-status.late,.dark .pa-metric-icon.amber { color:#f5ce80; background:#3a3020; } .dark .pa-status.absent { color:#f5a5b5; background:#422630; }
@media(max-width:1100px) { .pa-summary { grid-template-columns:repeat(2,minmax(0,1fr)); } .pa-toolbar { align-items:flex-start; } }
@media(max-width:760px) { .pa-overview { grid-template-columns:1fr; gap:16px; } .pa-heading { flex-direction:column; align-items:flex-start; gap:12px; } .pa-scan,.pa-today { padding:22px; } .pa-filters { width:100%; } select { flex:1; } .pa-toolbar { padding:16px; } .pa-metric { padding:14px; gap:9px; } }
@media(max-width:400px) { .pa-metric-icon { width:32px; height:32px; } .pa-metric>div>span { font-size:10px; } .pa-summary { gap:10px; } }
.employee-attendance-page .pa-scan { background:linear-gradient(120deg,var(--soft),var(--surface) 75%); }
.employee-attendance-page .pa-scan-icon { width:42px; height:42px; margin-bottom:14px; background:var(--surface); border:1px solid var(--line); }
.employee-attendance-page .pa-scan h2 { font-size:19px; }
.employee-attendance-page .pa-scan p { font-size:12px; margin-bottom:18px; }
.employee-attendance-page .pa-scan-art { display:none; }
.employee-attendance-page .pa-today { display:flex; flex-direction:column; }
.employee-attendance-page .pa-slots { flex:1; display:grid; align-content:center; }
.employee-attendance-page .pa-slots>div { min-height:52px; }
.employee-attendance-page .pa-slots strong.recorded { font-size:20px; font-variant-numeric:tabular-nums; }
.employee-attendance-page .pa-metric { box-shadow:none; border-radius:16px; }
.employee-attendance-page .pa-toolbar { padding:18px 22px; }
.employee-attendance-page .pa-history :deep(.base-table td) { padding:12px 22px; }
@media(max-width:760px) { .employee-attendance-page .pa-scan,.employee-attendance-page .pa-today { padding:20px; } .employee-attendance-page .pa-toolbar { padding:16px; } }
</style>
