<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { Users, Search, LogIn, Clock3 } from 'lucide-vue-next';
import { apiRequest } from '@/api/client';
import { API_ENDPOINTS } from '@/api/endpoints';
import AttendanceScan from '@/views/attendance/AttendanceScan.vue';
import BaseSkeleton from '@/components/base/BaseSkeleton.vue';
import BaseTable from '@/components/base/BaseTable.vue';
import BaseButton from '@/components/base/BaseButton.vue';
import UserAvatar from '@/components/common/UserAvatar.vue';
import { departmentAttendanceRows, attendanceTime, attendanceState, attendanceStateLabel, withEmployeeAvatars } from '@/api/attendancePresentation.js';
import { employeeError } from '@/utils/employeeMessages.js';
const props = defineProps({ employees: { type: Array, default: () => [] }, onRecords: { type: Function, default: () => apiRequest(API_ENDPOINTS.attendance.getDepartment) } });
const records = ref([]), loading = ref(true), error = ref(''), search = ref(''), status = ref('all');
let requestVersion = 0;
onBeforeUnmount(() => { requestVersion++; });
async function loadAttendance() {
  const version = ++requestVersion;
  loading.value = true; error.value = '';
  try {
    const data = departmentAttendanceRows(await props.onRecords());
    if (version === requestVersion) records.value = data;
  } catch(cause) { if (version === requestVersion) error.value = employeeError(cause,'មិនអាចទាញយកវត្តមានក្នុងផ្នែកបានទេ។'); }
  finally { if (version === requestVersion) loading.value = false; }
}
const filtered = computed(() => {
  const query = search.value.trim().toLowerCase();
  return withEmployeeAvatars(records.value, props.employees).filter(record => (status.value === 'all' || attendanceState(record) === status.value) && (!query || [record.name,record.nameEn,record.employeeId].some(value => String(value ?? '').toLowerCase().includes(query))));
});
const hasFilters = computed(() => search.value || status.value !== 'all');
const headcount = computed(() => {
  const ids = filtered.value.map(record => record.employeeId).filter(value => value != null && String(value).trim());
  return filtered.value.length && !ids.length ? '—' : new Set(ids.map(String)).size;
});
const summary = computed(() => [
  {label:'បុគ្គលិកក្នុងកំណត់ត្រា',value:headcount.value,icon:Users},
  {label:'កំណត់ត្រាម៉ោងចូល',value:filtered.value.filter(record => record.checkIn).length,icon:LogIn},
  {label:'កំណត់ត្រាយឺត',value:filtered.value.filter(record => attendanceState(record) === 'late').length,icon:Clock3},
]);
const columns = [{key:'name',label:'បុគ្គលិក',sortable:true},{key:'date',label:'កាលបរិច្ឆេទ',sortable:true},{key:'checkIn',label:'ម៉ោងចូល',sortable:true},{key:'checkOut',label:'ម៉ោងចេញ',sortable:true},{key:'status',label:'ស្ថានភាព',sortable:true}];
function resetFilters() { search.value = ''; status.value = 'all'; }
onMounted(loadAttendance);
</script>

<template>
  <div class="manager-attendance-page">
    <AttendanceScan manager @recorded="loadAttendance" />
    <section class="department-attendance" aria-labelledby="department-attendance-title">
      <header class="da-heading"><span class="da-icon"><Users :size="22" /></span><div><h2 id="department-attendance-title">វត្តមានក្នុងផ្នែក</h2><p>តាមដានកំណត់ត្រាចូលចេញរបស់បុគ្គលិកដែលអ្នកគ្រប់គ្រង។</p></div></header>
      <div class="da-summary" :aria-busy="loading" aria-label="សង្ខេបវត្តមានក្នុងផ្នែក"><div v-for="item in summary" :key="item.label"><component :is="item.icon" :size="18" /><span>{{ item.label }}</span><strong><BaseSkeleton v-if="loading" inline :lines="1" /><template v-else>{{ error ? '—' : item.value }}</template></strong></div></div>
      <section class="da-panel"><div class="da-toolbar"><label class="da-search"><Search :size="17" /><input v-model="search" type="search" placeholder="ស្វែងរកឈ្មោះបុគ្គលិក…" aria-label="ស្វែងរកវត្តមានបុគ្គលិកក្នុងផ្នែក" /></label><select v-model="status" aria-label="តម្រងស្ថានភាពក្នុងផ្នែក"><option value="all">គ្រប់ស្ថានភាព</option><option value="present">មានវត្តមាន</option><option value="late">យឺត</option><option value="absent">អវត្តមាន</option><option value="leave">ឈប់សម្រាក</option><option value="recorded">បានកត់ត្រា</option></select><BaseButton v-if="hasFilters" variant="ghost" size="sm" @click="resetFilters">សម្អាតតម្រង</BaseButton></div>
        <BaseTable :columns="columns" :rows="filtered" :loading="loading" :error="error" caption="កំណត់ត្រាវត្តមានក្នុងផ្នែក" :empty-text="hasFilters ? 'មិនមានកំណត់ត្រាត្រូវនឹងតម្រងនេះទេ។' : 'មិនទាន់មានកំណត់ត្រាវត្តមានក្នុងផ្នែកទេ។'" @retry="loadAttendance"><template #cell-name="{row}"><div class="da-employee"><UserAvatar :src="row.avatar" :name="row.nameEn || row.name" :size="32" /><div><strong>{{ row.name || row.nameEn || 'បុគ្គលិក' }}</strong><small v-if="row.name && row.nameEn">{{ row.nameEn }}</small></div></div></template><template #cell-date="{value}"><span class="da-time">{{ value || '—' }}</span></template><template #cell-checkIn="{value}"><span class="da-time" :class="{ 'da-present': value }">{{ attendanceTime(value) }}</span></template><template #cell-checkOut="{value}"><span class="da-time">{{ attendanceTime(value) }}</span></template><template #cell-status="{row}"><span class="da-status" :class="attendanceState(row)">{{ attendanceStateLabel(row) }}</span></template><template #empty-action><BaseButton v-if="hasFilters" variant="outline" @click="resetFilters">សម្អាតតម្រង</BaseButton></template></BaseTable>
      </section>
    </section>
  </div>
</template>

<style scoped>
.manager-attendance-page { display:grid; gap:32px; min-width:0; }
.department-attendance { display:grid; gap:18px; border-top:1px solid var(--line); padding-top:28px; }
.da-heading { display:flex; align-items:center; gap:13px; }
.da-icon { width:44px; height:44px; flex-shrink:0; display:grid; place-items:center; border-radius:13px; color:var(--blue); background:var(--soft); }
.da-heading h2 { font-size:21px; font-weight:650; margin-bottom:6px; } .da-heading p { color:var(--muted); font-size:12px; line-height:1.8; }
.da-summary { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:14px; }
.da-summary>div { display:flex; align-items:center; gap:10px; min-width:0; padding:16px 18px; border:1px solid var(--line); border-radius:13px; background:var(--surface); }
.da-summary svg { color:var(--blue); flex-shrink:0; } .da-summary span { color:var(--muted); font-size:12px; line-height:1.8; } .da-summary strong { margin-left:auto; font-size:23px; font-weight:700; }
.da-panel { min-width:0; border:1px solid var(--line); border-radius:18px; background:var(--surface); overflow:hidden; }
.da-toolbar { display:flex; align-items:center; flex-wrap:wrap; gap:10px; padding:18px; }
.da-search { display:flex; align-items:center; gap:8px; min-height:44px; border:1px solid var(--line); border-radius:10px; padding:0 12px; color:var(--muted); }
.da-search { flex:1; min-width:180px; max-width:420px; } .da-search input { width:100%; min-width:0; }
input { border:0; background:transparent; color:var(--ink); font-size:12px; padding:10px 0; }
.da-toolbar>select { margin-left:auto; }
select { min-height:44px; padding:8px 10px; border:1px solid var(--line); border-radius:10px; background:var(--surface); color:var(--ink); font-size:12px; }
.da-search:focus-within,input:focus-visible,select:focus-visible { outline:2px solid var(--blue); outline-offset:2px; }
.da-panel :deep(.base-table-panel) { border:0; border-radius:0; box-shadow:none; } .da-panel :deep(.base-table td) { padding:10px 18px; height:60px; }
.da-employee { display:flex; align-items:center; gap:10px; min-width:170px; } .da-employee>div { display:grid; gap:3px; } .da-employee strong { font-size:13px; font-weight:600; } .da-employee small { font-size:11px; color:var(--muted); }
.da-time { font-variant-numeric:tabular-nums; white-space:nowrap; font-size:12px; } .da-present { color:#18744f; font-weight:600; }
.da-status { display:inline-flex; align-items:center; padding:4px 9px; font-size:11px; border-radius:20px; color:var(--muted); background:var(--soft); white-space:nowrap; }
.da-status.present { color:#18744f; background:#e4f6ec; } .da-status.late { color:#936113; background:#fff5df; } .da-status.absent { color:#a53b50; background:#fff0f2; }
.dark .da-present { color:#83dfb4; } .dark .da-status.present { background:#183b30; color:#83dfb4; } .dark .da-status.late { background:#3a3020; color:#f5ce80; } .dark .da-status.absent { background:#422630; color:#f5a5b5; }
@media(max-width:760px) { .da-summary { grid-template-columns:1fr; gap:10px; } .da-search { max-width:none; flex-basis:100%; } select { flex:1; } .da-toolbar { padding:16px; } .da-heading h2 { font-size:19px; } }
</style>
