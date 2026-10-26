<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { CalendarDays, ScanLine, Search, Users, LogIn, LogOut, ArrowUpRight } from 'lucide-vue-next';
import { RouterLink } from 'vue-router';
import BaseButton from '../../components/base/BaseButton.vue';
import BaseSkeleton from '../../components/base/BaseSkeleton.vue';
import BaseTable from '../../components/base/BaseTable.vue';
import UserAvatar from '../../components/common/UserAvatar.vue';
import { attendanceRecords, attendanceStatus } from '../../api/adminAttendance.js';
import { localToday } from '../../api/employeeData.js';
import { attendanceTime } from '../../api/attendancePresentation.js';
import { adminErrorMessage } from '../../utils/adminMessages.js';
const props = defineProps({ onRecords: Function });
const records = ref([]), recordsLoading = ref(true), recordsError = ref('');
const search = ref(''), recordDate = ref(''), status = ref('all');
let recordsVersion = 0;
onBeforeUnmount(() => { recordsVersion++; });
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
const formatTime = attendanceTime;
const columns = [
 {key:'name',label:'បុគ្គលិក',sortable:true},

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
onMounted(refreshRecords);
</script>
<template>
 <section class="attendance-page">
  <header class="workspace-page-header attendance-heading"><div><h1>វត្តមាន និង QR</h1><p>គ្រប់គ្រង QR ប្រចាំថ្ងៃ និងតាមដានកំណត់ត្រាវត្តមានរបស់បុគ្គលិក។</p></div><span class="attendance-today"><CalendarDays :size="17"/>{{ localToday() }}</span></header>
  <section class="active-qr-panel" aria-labelledby="active-qr-title"><span class="active-qr-icon"><ScanLine :size="24" /></span><div><h2 id="active-qr-title">QR សកម្ម</h2><p>បង្ហាញ QR សម្រាប់ឱ្យបុគ្គលិកស្កេនតាមវេនរបស់ពួកគេ។</p></div><RouterLink class="active-qr-link" to="/attendanceQrDisplay" target="_blank" rel="noopener noreferrer"><ScanLine :size="18" />បង្ហាញ QR សកម្ម<ArrowUpRight :size="16" /></RouterLink></section>
  <section class="attendance-records" aria-labelledby="attendance-records-title"><div class="records-heading"><div><h2 id="attendance-records-title">កំណត់ត្រាវត្តមាន</h2><p>ស្វែងរក និងពិនិត្យម៉ោងចូលចេញរបស់បុគ្គលិក</p></div></div>
   <div class="attendance-summary" :aria-busy="recordsLoading"><div v-for="item in summary" :key="item.label" class="attendance-stat"><span class="stat-icon"><component :is="item.icon" :size="20"/></span><div><span>{{ item.label }}</span><strong><BaseSkeleton v-if="recordsLoading" inline :lines="1" /><template v-else>{{ recordsError ? '—' : item.value }}</template></strong></div></div></div>
   <section class="records-panel"><div class="records-toolbar"><label class="records-search"><Search :size="18" aria-hidden="true"/><input v-model="search" type="search" placeholder="ស្វែងរកឈ្មោះ ឬនាយកដ្ឋាន…" aria-label="ស្វែងរកកំណត់ត្រាវត្តមាន"/></label><label class="records-date"><span>កាលបរិច្ឆេទ</span><input v-model="recordDate" type="date" aria-label="តម្រងកាលបរិច្ឆេទវត្តមាន"/></label><select v-model="status" aria-label="តម្រងស្ថានភាពវត្តមាន"><option value="all">គ្រប់ស្ថានភាព</option><option v-for="value in statusOptions" :key="value" :value="value">{{ attendanceStatus(value) }}</option></select><BaseButton v-if="hasFilters" variant="ghost" size="sm" @click="resetFilters">សម្អាតតម្រង</BaseButton></div>
    <BaseTable :columns="columns" :rows="filtered" :loading="recordsLoading" :error="recordsError" caption="កំណត់ត្រាវត្តមាន" :empty-text="hasFilters ? 'មិនមានកំណត់ត្រាត្រូវនឹងការស្វែងរករបស់អ្នកទេ។' : 'មិនទាន់មានកំណត់ត្រាវត្តមានទេ។'" @retry="refreshRecords"><template #cell-name="{row}"><div class="record-employee"><UserAvatar :src="row.avatar" :name="row.nameEn || row.name" :size="36"/><div><strong>{{ row.name || row.nameEn || 'បុគ្គលិក ' + row.employeeId }}</strong><small>{{ row.nameEn || 'លេខបុគ្គលិក: ' + (row.employeeId || '—') }}</small></div></div></template><template #cell-date="{value}"><span class="record-time">{{ formatDate(value) }}</span></template><template #cell-checkIn="{value}"><span class="record-time" :class="{'checked-in':value}">{{ formatTime(value) }}</span></template><template #cell-checkOut="{value}"><span class="record-time">{{ formatTime(value) }}</span></template><template #cell-status="{value}"><span class="attendance-status" :class="value">{{ attendanceStatus(value) }}</span></template><template #empty-action><BaseButton v-if="hasFilters" variant="outline" @click="resetFilters">សម្អាតតម្រង</BaseButton></template></BaseTable>
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
.active-qr-panel { display:flex; align-items:center; gap:18px; padding:24px; border:1px solid var(--line); border-radius:18px; background:var(--surface); }
.active-qr-panel>div { flex:1; min-width:0; }
.active-qr-panel h2 { font-size:18px; font-weight:650; margin-bottom:7px; }
.active-qr-panel p { color:var(--muted); font-size:12px; line-height:1.8; }
.active-qr-icon,.stat-icon { display:grid; place-items:center; flex-shrink:0; width:48px; height:48px; border-radius:14px; background:var(--soft); color:var(--blue); }
.active-qr-link { display:inline-flex; align-items:center; justify-content:center; gap:9px; min-height:46px; padding:12px 18px; border-radius:12px; background:var(--action-fill,var(--blue)); color:white; font-size:13px; flex-shrink:0; }
.active-qr-link:focus-visible { outline:2px solid var(--blue); outline-offset:3px; }
.records-heading h2 { font-size:18px; font-weight:650; margin-bottom:6px; }
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
.records-panel :deep(.base-table td) { padding-top:10px; padding-bottom:10px; }
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
.dark .checked-in { color:#83dfb4; }
.dark .ready-badge,.dark .attendance-status.present,.dark .attendance-status.on_time,.dark .attendance-status.checked_in,.dark .attendance-status.checked_out { background:#183b30; color:#83dfb4; }
.dark .attendance-status.late,.dark .attendance-status.early { background:#3a3020; color:#f5ce80; }
.dark .attendance-status.absent { background:#422630; color:#f5a5b5; }
@media(max-width:760px) { .active-qr-panel { flex-wrap:wrap; padding:20px; } .attendance-summary { gap:10px; } .attendance-stat { padding:14px; gap:10px; } }
@media(max-width:540px) { .active-qr-link { width:100%; } .attendance-heading,.records-heading { align-items:flex-start; flex-direction:column; gap:12px; } .attendance-summary { grid-template-columns:1fr; } .attendance-stat>div { display:flex; align-items:center; justify-content:space-between; width:100%; } .records-toolbar { padding:16px; } .records-search { flex-basis:100%; min-width:0; } .records-date { width:100%; justify-content:space-between; } .records-toolbar select { flex:1; } }
</style>
