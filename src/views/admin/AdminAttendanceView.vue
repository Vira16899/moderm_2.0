<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { CalendarDays, CheckCircle2, Clock3, QrCode, RefreshCw, ScanLine, Search, Users, LogIn, LogOut } from 'lucide-vue-next';
import QrcodeVue from 'qrcode.vue';
import BaseButton from '../../components/base/BaseButton.vue';
import BaseTable from '../../components/base/BaseTable.vue';
import UserAvatar from '../../components/common/UserAvatar.vue';
import { attendanceQrItems, attendanceRecords, attendanceStatus } from '../../api/adminAttendance.js';
import { localToday } from '../../api/employeeData.js';
import { adminErrorMessage } from '../../utils/adminMessages.js';
import { notify } from '../../stores/toasts.js';
const props = defineProps({ onGenerate: Function, onDisplay: Function, onRecords: Function });
const date = ref(localToday()), dateError = ref(''), result = ref(null), busy = ref(''), qrError = ref(''), lastAction = ref('');
const records = ref([]), recordsLoading = ref(true), recordsError = ref('');
const search = ref(''), recordDate = ref(''), status = ref('all');
const failedImages = ref(new Set());
let recordsVersion = 0, qrVersion = 0;
onBeforeUnmount(() => { recordsVersion++; qrVersion++; });
watch(date, () => { dateError.value = ''; });
const qrItems = computed(() => attendanceQrItems(result.value));
const statusOptions = computed(() => [...new Set(records.value.map(row => row.status).filter(Boolean))]);
const filtered = computed(() => {
 const term = search.value.trim().toLowerCase();
 return records.value.filter(row => (!recordDate.value || row.date === recordDate.value) && (status.value === 'all' || row.status === status.value) && (!term || [row.name, row.nameEn, row.employeeId, row.department].some(value => String(value).toLowerCase().includes(term))));
});
const hasFilters = computed(() => search.value || recordDate.value || status.value !== 'all');
const summary = computed(() => [
 { label:'កំណត់ត្រាសរុប', value:filtered.value.length, icon:Users },
 { label:'បានកត់ត្រាចូល', value:filtered.value.filter(row => row.checkIn).length, icon:LogIn },
 { label:'បានកត់ត្រាចេញ', value:filtered.value.filter(row => row.checkOut).length, icon:LogOut },
]);
function resetFilters() { search.value = ''; recordDate.value = ''; status.value = 'all'; }
function formatDate(value) { return value ? String(value).slice(0,10) : '—'; }
function formatTime(value) {
 if (!value) return '—';
 const text = String(value);
 const match = text.match(/(?:T|\s|^)(\d{2}:\d{2})(?::\d{2})?/);
 return match ? match[1] : text;
}
function imageFailed(id) { failedImages.value = new Set([...failedImages.value, id]); }
const columns = [
 {key:'name',label:'បុគ្គលិក',sortable:true},
 {key:'department',label:'នាយកដ្ឋាន',sortable:true},
 {key:'date',label:'កាលបរិច្ឆេទ',sortable:true},
 {key:'checkIn',label:'ម៉ោងចូល',sortable:true},
 {key:'checkOut',label:'ម៉ោងចេញ',sortable:true},
 {key:'status',label:'ស្ថានភាព',sortable:true},
];
async function refreshRecords() {
 const version = ++recordsVersion;
 recordsLoading.value = true; recordsError.value = '';
 try {
   if (!props.onRecords) throw new Error('មិនអាចទាញយកកំណត់ត្រាវត្តមានបានទេ។');
   const payload = await props.onRecords();
   if (payload?.ok === false || payload?.result === false) throw new Error(payload.error || payload.message);
   const rows = attendanceRecords(payload);
   if (version === recordsVersion) records.value = rows;
 } catch(cause) { if(version === recordsVersion) recordsError.value = adminErrorMessage(cause); }
 finally { if(version === recordsVersion) recordsLoading.value = false; }
}
async function run(type) {
 if (busy.value) return;
 if (type === 'generate' && (!/^\d{4}-\d{2}-\d{2}$/.test(date.value) || Number.isNaN(Date.parse(date.value)))) { dateError.value = 'សូមជ្រើសរើសកាលបរិច្ឆេទត្រឹមត្រូវ។'; return; }
 const action = type === 'generate' ? props.onGenerate : props.onDisplay;
 if (!action) return;
 const version = ++qrVersion;
 busy.value = type; qrError.value = ''; result.value = null; failedImages.value = new Set(); lastAction.value = type;
 try {
   const payload = await action(...(type === 'generate' ? [date.value] : []));
   if (payload?.ok === false || payload?.result === false) throw new Error(payload.error || payload.message);
   if (version === qrVersion) {
     result.value = payload ?? {};
     if (type === 'generate') notify('វេនវត្តមានត្រូវបានបង្កើតដោយជោគជ័យ។');
   }
 } catch(cause) { if (version === qrVersion) { qrError.value = adminErrorMessage(cause); notify(qrError.value,'error'); } }
 finally { if (version === qrVersion) busy.value = ''; }
}
onMounted(refreshRecords);
</script>
<template>
 <section class="attendance-page">
  <header class="attendance-heading"><div><h1>វត្តមាន និង QR</h1><p>គ្រប់គ្រង QR ប្រចាំថ្ងៃ និងតាមដានកំណត់ត្រាវត្តមានរបស់បុគ្គលិក។</p></div><span class="attendance-today"><CalendarDays :size="17"/>{{ localToday() }}</span></header>
  <div class="attendance-grid">
   <section class="attendance-panel attendance-controls" aria-labelledby="attendance-control-title"><div class="panel-heading"><span class="panel-icon"><CalendarDays :size="21"/></span><div><h2 id="attendance-control-title">កំណត់ QR វត្តមាន</h2><p>ជ្រើសរើសកាលបរិច្ឆេទសម្រាប់បង្កើតវេន</p></div></div>
    <form novalidate @submit.prevent="run('generate')"><label for="attendance-date" class="date-label">កាលបរិច្ឆេទវត្តមាន</label><input id="attendance-date" v-model="date" type="date" required :disabled="!!busy" :aria-invalid="!!dateError" :aria-describedby="dateError ? 'attendance-date-error' : undefined"/><p v-if="dateError" id="attendance-date-error" class="field-error">{{ dateError }}</p><BaseButton type="submit" class="control-button" :loading="busy === 'generate'" :disabled="!!busy || !onGenerate"><QrCode :size="18"/>បង្កើត QR សម្រាប់ថ្ងៃដែលបានជ្រើស</BaseButton></form>
    <div class="control-divider"><span>QR ដែលមានស្រាប់</span></div><BaseButton variant="outline" class="control-button" :loading="busy === 'display'" :disabled="!!busy || !onDisplay" @click="run('display')"><RefreshCw :size="17"/>បង្ហាញ QR សកម្ម</BaseButton><p class="control-help">បន្ទាប់ពីបង្កើតវេន សូមបង្ហាញ QR សកម្មឱ្យបុគ្គលិកស្កេនតាមវេនរបស់ពួកគេ។</p>
   </section>
   <section class="attendance-panel qr-panel" aria-labelledby="attendance-qr-title" :aria-busy="!!busy"><div class="panel-heading"><span class="panel-icon"><ScanLine :size="21"/></span><div><h2 id="attendance-qr-title">QR វត្តមាន</h2><p>{{ qrItems.length ? 'ស្កេន QR តាមវេនដែលត្រូវគ្នា' : 'QR សម្រាប់កត់ត្រាវត្តមានរបស់បុគ្គលិក' }}</p></div><span v-if="qrItems.length && !busy" class="ready-badge"><CheckCircle2 :size="14"/>{{ qrItems.length }} QR</span></div>
    <div v-if="busy" class="qr-loading" role="status"><div class="qr-skeleton"></div><span>{{ busy === 'generate' ? 'កំពុងបង្កើតវេនវត្តមាន…' : 'កំពុងទាញយក QR…' }}</span></div>
    <div v-else-if="qrItems.length" class="qr-cards"><article v-for="item in qrItems" :key="item.id" class="qr-card"><h3>{{ item.label }}</h3><div class="qr-frame"><img v-if="item.image && !failedImages.has(item.id)" :src="item.image" alt="QR សម្រាប់កត់ត្រាវត្តមាន" @error="imageFailed(item.id)"/><QrcodeVue v-else-if="item.value" :value="item.value" :size="192" level="H" render-as="svg" :aria-label="item.label" role="img"/><p v-else class="field-error">មិនអាចបង្ហាញរូបភាព QR បានទេ។ សូមទាញយកម្ដងទៀត។</p></div><p v-if="item.date" class="qr-meta"><CalendarDays :size="14"/>{{ formatDate(item.date) }}</p><p v-if="item.from || item.until" class="qr-meta"><Clock3 :size="14"/>{{ formatTime(item.from) }} – {{ formatTime(item.until) }}</p></article></div>
    <div v-else class="qr-empty"><span class="qr-empty-icon"><QrCode :size="40" :stroke-width="1.5"/></span><h3>{{ qrError ? 'មិនអាចបង្ហាញ QR បានទេ' : result ? lastAction === 'generate' ? 'វេនវត្តមានត្រូវបានបង្កើតរួចហើយ' : 'មិនមាន QR សកម្មនៅពេលនេះទេ' : 'QR នឹងបង្ហាញនៅទីនេះ' }}</h3><p>{{ qrError || (result ? 'ចុច «បង្ហាញ QR សកម្ម» ដើម្បីទាញយក QR ដែលអាចប្រើបាននៅពេលនេះ។' : 'បង្កើតវេនសម្រាប់កាលបរិច្ឆេទដែលបានជ្រើស ឬបង្ហាញ QR ដែលមានស្រាប់។') }}</p><BaseButton v-if="qrError" variant="outline" @click="run(lastAction)"><RefreshCw :size="16"/>ព្យាយាមម្ដងទៀត</BaseButton></div>
   </section>
  </div>
  <section class="attendance-records" aria-labelledby="attendance-records-title"><div class="records-heading"><div><h2 id="attendance-records-title">កំណត់ត្រាវត្តមាន</h2><p>ស្វែងរក និងពិនិត្យម៉ោងចូលចេញរបស់បុគ្គលិក</p></div></div>
   <div class="attendance-summary"><div v-for="item in summary" :key="item.label" class="attendance-stat"><span class="stat-icon"><component :is="item.icon" :size="20"/></span><div><span>{{ item.label }}</span><strong v-if="!recordsLoading && !recordsError">{{ item.value }}</strong><span v-else class="stat-placeholder">—</span></div></div></div>
   <section class="records-panel"><div class="records-toolbar"><label class="records-search"><Search :size="18" aria-hidden="true"/><input v-model="search" type="search" placeholder="ស្វែងរកឈ្មោះ ឬនាយកដ្ឋាន…" aria-label="ស្វែងរកកំណត់ត្រាវត្តមាន"/></label><label class="records-date"><span>កាលបរិច្ឆេទ</span><input v-model="recordDate" type="date" aria-label="តម្រងកាលបរិច្ឆេទវត្តមាន"/></label><select v-model="status" aria-label="តម្រងស្ថានភាពវត្តមាន"><option value="all">គ្រប់ស្ថានភាព</option><option v-for="value in statusOptions" :key="value" :value="value">{{ attendanceStatus(value) }}</option></select><BaseButton v-if="hasFilters" variant="ghost" size="sm" @click="resetFilters">សម្អាតតម្រង</BaseButton></div>
    <BaseTable :columns="columns" :rows="filtered" :loading="recordsLoading" :error="recordsError" caption="កំណត់ត្រាវត្តមាន" :empty-text="hasFilters ? 'មិនមានកំណត់ត្រាត្រូវនឹងការស្វែងរករបស់អ្នកទេ។' : 'មិនទាន់មានកំណត់ត្រាវត្តមានទេ។'" @retry="refreshRecords"><template #cell-name="{row}"><div class="record-employee"><UserAvatar :src="row.avatar" :name="row.nameEn || row.name" :size="36"/><div><strong>{{ row.name || row.nameEn || 'បុគ្គលិក ' + row.employeeId }}</strong><small>{{ row.nameEn || 'លេខបុគ្គលិក: ' + (row.employeeId || '—') }}</small></div></div></template><template #cell-department="{value}">{{ value || '—' }}</template><template #cell-date="{value}"><span class="record-time">{{ formatDate(value) }}</span></template><template #cell-checkIn="{value}"><span class="record-time" :class="{'checked-in':value}">{{ formatTime(value) }}</span></template><template #cell-checkOut="{value}"><span class="record-time">{{ formatTime(value) }}</span></template><template #cell-status="{value}"><span class="attendance-status" :class="value">{{ attendanceStatus(value) }}</span></template><template #empty-action><BaseButton v-if="hasFilters" variant="outline" @click="resetFilters">សម្អាតតម្រង</BaseButton></template></BaseTable>
   </section>
  </section>
 </section>
</template>
<style scoped>
.attendance-page { display:grid; gap:24px; min-width:0; }
.attendance-heading,.records-heading { display:flex; justify-content:space-between; align-items:center; gap:20px; }
.attendance-heading h1 { margin:0 0 8px; color:var(--ink); font-size:clamp(24px,2.3vw,30px); font-weight:700; }
.attendance-heading p,.records-heading p { margin:0; color:var(--muted); font-size:14px; line-height:1.8; }
.attendance-today { display:flex; align-items:center; gap:8px; padding:10px 14px; border:1px solid var(--line); border-radius:12px; color:var(--muted); font-size:13px; white-space:nowrap; }
.attendance-grid { display:grid; grid-template-columns:340px minmax(0,1fr); gap:24px; align-items:stretch; }
.attendance-panel { min-width:0; border:1px solid var(--line); border-radius:20px; background:var(--surface); padding:24px; }
.panel-heading { display:flex; align-items:center; gap:12px; margin-bottom:24px; }
.panel-icon,.stat-icon { width:44px; height:44px; display:grid; place-items:center; flex-shrink:0; border-radius:13px; background:var(--soft); color:var(--blue); }
.panel-heading h2,.records-heading h2 { margin:0 0 6px; color:var(--ink); font-size:18px; font-weight:650; }
.panel-heading p { margin:0; color:var(--muted); font-size:12px; line-height:1.8; }
.date-label { display:block; margin-bottom:10px; color:var(--ink); font-size:13px; font-weight:600; }
.attendance-controls input { width:100%; height:46px; padding:10px 12px; border:1px solid var(--line); border-radius:12px; background:var(--soft); color:var(--ink); font-size:14px; margin-bottom:16px; }
.attendance-controls input[aria-invalid="true"] { border-color:#c13a53; }
.control-button { width:100%; }
.control-divider { display:flex; align-items:center; gap:12px; margin:24px 0 18px; color:var(--muted); font-size:12px; }
.control-divider:before,.control-divider:after { content:''; height:1px; background:var(--line); flex:1; }
.control-help { margin:18px 0 0; color:var(--muted); font-size:12px; line-height:1.9; }
.field-error { color:#c13a53; font-size:13px; line-height:1.8; margin:0 0 12px; }
.qr-panel { display:flex; flex-direction:column; }
.qr-panel .panel-heading>div { flex:1; }
.ready-badge { display:flex; align-items:center; gap:5px; padding:6px 10px; border-radius:999px; background:#e4f6ec; color:#18744f; font-size:12px; white-space:nowrap; }
.qr-empty,.qr-loading { flex:1; min-height:260px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:14px; padding:24px; border:1px dashed var(--line); border-radius:16px; background:var(--soft); text-align:center; }
.qr-empty-icon { display:grid; place-items:center; width:72px; height:72px; border-radius:20px; color:var(--blue); background:var(--surface); }
.qr-empty h3 { margin:0; color:var(--ink); font-size:16px; font-weight:600; }
.qr-empty p { max-width:360px; margin:0; color:var(--muted); font-size:13px; line-height:1.9; }
.qr-loading { font-size:13px; color:var(--muted); }
.qr-skeleton { width:150px; height:150px; border-radius:12px; background:var(--line); animation:qr-pulse 1.4s ease-in-out infinite; }
.qr-cards { display:grid; grid-template-columns:repeat(auto-fit,minmax(225px,1fr)); gap:18px; }
.qr-card { padding:18px 12px; border:1px solid var(--line); border-radius:16px; text-align:center; background:var(--soft); min-width:0; }
.qr-card h3 { margin:0 0 16px; color:var(--ink); font-size:14px; font-weight:600; }
.qr-frame { width:224px; max-width:100%; min-height:224px; display:flex; justify-content:center; align-items:center; margin:0 auto 14px; padding:16px; border-radius:12px; background:white; }
.qr-frame img { width:192px; height:192px; max-width:100%; object-fit:contain; }
.qr-frame :deep(svg) { max-width:100%; height:auto; }
.qr-meta { display:flex; justify-content:center; align-items:center; gap:7px; margin:8px 0 0; color:var(--muted); font-size:12px; }
.attendance-records { display:grid; gap:20px; min-width:0; }
.attendance-summary { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:16px; }
.attendance-stat { display:flex; align-items:center; gap:14px; padding:18px 20px; border:1px solid var(--line); border-radius:16px; background:var(--surface); }
.attendance-stat>div { display:grid; gap:6px; }
.attendance-stat>div>span { color:var(--muted); font-size:13px; }
.attendance-stat strong,.stat-placeholder { font-size:25px; line-height:1.2; font-weight:700; color:var(--ink); }
.records-panel { min-width:0; border:1px solid var(--line); border-radius:20px; background:var(--surface); overflow:hidden; }
.records-toolbar { display:flex; align-items:center; gap:12px; padding:20px; flex-wrap:wrap; }
.records-search { display:flex; align-items:center; gap:10px; min-height:44px; min-width:200px; flex:1; padding:0 14px; border:1px solid var(--line); border-radius:12px; background:var(--soft); color:var(--muted); }
.records-search input { width:100%; min-width:0; border:0; outline:0; background:transparent; color:var(--ink); padding:10px 0; font-size:13px; }
.records-date { display:flex; align-items:center; gap:8px; color:var(--muted); font-size:12px; }
.records-date input,.records-toolbar select { min-height:44px; padding:8px 12px; border:1px solid var(--line); border-radius:12px; background:var(--surface); color:var(--ink); font-size:13px; max-width:100%; }
.records-panel :deep(.base-table-panel) { border:0; border-radius:0; box-shadow:none; }
.records-panel :deep(.base-table td) { padding-top:16px; padding-bottom:16px; }
.record-employee { display:flex; align-items:center; gap:12px; min-width:175px; }
.record-employee>div { display:grid; gap:5px; }
.record-employee strong { color:var(--ink); font-size:14px; font-weight:600; }
.record-employee small { color:var(--muted); font-size:12px; }
.record-time { font-variant-numeric:tabular-nums; white-space:nowrap; }
.checked-in { color:#18744f; font-weight:600; }
.attendance-status { display:inline-flex; padding:6px 10px; border-radius:999px; font-size:12px; background:var(--soft); color:var(--muted); white-space:nowrap; }
.attendance-status.present,.attendance-status.on_time,.attendance-status.checked_in,.attendance-status.checked_out { background:#e4f6ec; color:#18744f; }
.attendance-status.late,.attendance-status.early { background:#fff5df; color:#936113; }
.attendance-status.absent { background:#fff0f2; color:#a53b50; }
.attendance-page input:focus-visible,.attendance-page select:focus-visible,.records-search:focus-within { outline:2px solid var(--blue); outline-offset:2px; }
:global(.dark) .checked-in { color:#83dfb4; }
:global(.dark) .ready-badge,:global(.dark) .attendance-status.present,:global(.dark) .attendance-status.on_time,:global(.dark) .attendance-status.checked_in,:global(.dark) .attendance-status.checked_out { background:#183b30; color:#83dfb4; }
:global(.dark) .attendance-status.late,:global(.dark) .attendance-status.early { background:#3a3020; color:#f5ce80; }
:global(.dark) .attendance-status.absent { background:#422630; color:#f5a5b5; }
@keyframes qr-pulse { 50% { opacity:.4; } }
@media(prefers-reduced-motion:reduce) { .qr-skeleton { animation:none; } }
@media(max-width:1000px) { .attendance-grid { grid-template-columns:300px minmax(0,1fr); gap:18px; } .attendance-panel { padding:20px; } }
@media(max-width:800px) { .attendance-grid { grid-template-columns:1fr; } .attendance-controls { max-width:none; } .attendance-summary { gap:10px; } .attendance-stat { gap:10px; padding:16px; } }
@media(max-width:540px) { .attendance-page { gap:20px; } .attendance-heading,.records-heading { align-items:flex-start; flex-direction:column; gap:12px; } .attendance-heading p,.records-heading p { font-size:13px; } .attendance-today { font-size:12px; padding:8px 12px; } .attendance-panel { padding:18px; } .attendance-summary { grid-template-columns:1fr; } .attendance-stat { padding:14px 16px; } .attendance-stat>div { display:flex; align-items:center; justify-content:space-between; width:100%; } .attendance-stat strong { font-size:23px; } .records-toolbar { padding:16px; gap:12px; } .records-search { flex-basis:100%; min-width:0; } .records-date { width:100%; justify-content:space-between; } .records-toolbar select { flex:1; } .qr-panel .panel-heading { flex-wrap:wrap; } .qr-cards { grid-template-columns:1fr; } }
</style>
