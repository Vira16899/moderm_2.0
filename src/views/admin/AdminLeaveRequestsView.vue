<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { CalendarDays, Check, CheckCircle2, Clock3, FileText, Search, Trash2, XCircle, LoaderCircle, ArrowRight, History } from 'lucide-vue-next';
import BaseTable from '../../components/base/BaseTable.vue';
import BaseButton from '../../components/base/BaseButton.vue';
import BaseModal from '../../components/base/BaseModal.vue';
import BaseSkeleton from '../../components/base/BaseSkeleton.vue';
import UserAvatar from '../../components/common/UserAvatar.vue';
import { notify } from '../../stores/toasts.js';
import { adminErrorMessage } from '../../utils/adminMessages.js';
import { newestLeaveRequests, splitLeaveRequests } from '../../api/leaveRequestHistory.js';
const props = defineProps({ onList: Function, onGetById: Function, onApprove: Function, onReject: Function, onDelete: Function });
const requests = ref([]), loading = ref(true), error = ref('');
const scopeRequests = computed(() => splitLeaveRequests(requests.value).recent);
const userHistory = ref([]);
const search = ref(''), activeFilter = ref('all'), typeFilter = ref('all');
const selectedRequest = ref(null), detail = ref(null), detailLoading = ref(false), detailError = ref('');
const busyId = ref(''), confirmation = ref(null);
let listVersion = 0, detailVersion = 0;
onBeforeUnmount(() => { listVersion++; detailVersion++; });
const filters = [
  { id: 'all', label: 'សំណើទាំងអស់', icon: FileText },
  { id: 'pending', label: 'រង់ចាំអនុម័ត', icon: Clock3 },
  { id: 'approved', label: 'បានអនុម័ត', icon: CheckCircle2 },
  { id: 'rejected', label: 'បានបដិសេធ', icon: XCircle },
];
const counts = computed(() => Object.fromEntries(filters.map(filter => [filter.id, scopeRequests.value.filter(row => filter.id === 'all' || row.status === filter.id).length])));
const typeOptions = computed(() => [...new Set(scopeRequests.value.map(row => row.leaveType).filter(Boolean))]);
const visibleRequests = computed(() => {
  const query = search.value.trim().toLowerCase();
  return scopeRequests.value.filter(row => (activeFilter.value === 'all' || row.status === activeFilter.value)
    && (typeFilter.value === 'all' || row.leaveType === typeFilter.value)
    && (!query || [row.employeeNameKh, row.employeeNameEn, row.employeeId, row.leaveType, leaveLabel(row.leaveType)].some(value => String(value || '').toLowerCase().includes(query))));
});
const hasFilters = computed(() => search.value || activeFilter.value !== 'all' || typeFilter.value !== 'all');
function resetFilters() { search.value = ''; activeFilter.value = 'all'; typeFilter.value = 'all'; }
const columns = [
 { key: 'employeeNameKh', label: 'បុគ្គលិក', sortable: true },
 { key: 'startDate', label: 'រយៈពេលសុំច្បាប់', sortable: true },
 { key: 'createdAt', label: 'ថ្ងៃដាក់សំណើ', sortable: true },
 { key: 'status', label: 'ស្ថានភាព', sortable: true },
 { key: 'actions', label: 'សកម្មភាព', align: 'right' },
];
function listFrom(payload) {
  for (const candidate of [payload, payload?.data, payload?.data?.data]) {
    if (Array.isArray(candidate)) return candidate;
    for (const key of ['leaveRequests', 'leave_requests', 'requests', 'data']) {
      if (Array.isArray(candidate?.[key])) return candidate[key];
    }
  }
  return [];
}
function normalize(request) {
  return {
    ...request,
    id: String(request.id ?? request.leave_request_id ?? ''),
    employeeId: String(request.employeeId ?? request.user_id ?? ''),
    employeeNameKh: request.employeeNameKh ?? request.khmer_name ?? request.nameKh ?? '',
    employeeNameEn: request.employeeNameEn ?? request.Eng_name ?? request.nameEn ?? '',
    leaveType: String(request.leaveType ?? request.leave_type ?? '').toLowerCase(),
    startDate: request.startDate ?? request.start_date ?? '',
    endDate: request.endDate ?? request.end_date ?? '',
    reason: request.reason ?? request.description ?? '',
    status: String(request.status ?? 'pending').toLowerCase(),
    createdAt: request.createdAt || request.created_at || request.appliedDate || request.request_date || '',
  };
}
function statusLabel(status) {
  return ({ pending: 'រង់ចាំ', approved: 'បានអនុម័ត', rejected: 'បានបដិសេធ', cancelled: 'បានលុបចោល' })[status] || status || 'មិនស្គាល់';
}
function leaveLabel(type) {
  return ({ annual: 'ច្បាប់ប្រចាំឆ្នាំ', sick: 'ច្បាប់ឈឺ', casual: 'ច្បាប់ផ្ទាល់ខ្លួន', maternity: 'ច្បាប់មាតុភាព', unpaid: 'ច្បាប់គ្មានប្រាក់ខែ', marriage: 'ច្បាប់អាពាហ៍ពិពាហ៍' })[type] || type || 'មិនបានបញ្ជាក់';
}
function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : new Intl.DateTimeFormat('km-KH', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
}


async function refresh() {
 const version = ++listVersion;
 loading.value = true; error.value = '';
 try {
   if (!props.onList) throw new Error('មិនអាចទាញយកសំណើបានទេ។');
   const result = await props.onList();
   if (result?.ok === false || result?.result === false) throw new Error(result.error || result.message);
   if (version === listVersion) requests.value = listFrom(result).map(normalize);
 } catch (cause) { if (version === listVersion) error.value = adminErrorMessage(cause); }
 finally { if (version === listVersion) loading.value = false; }
}
const currentDetail = computed(() => detail.value || selectedRequest.value);
const previousRequests = computed(() => newestLeaveRequests(userHistory.value.filter(row => row.id !== selectedRequest.value?.id)));
const historyColumns = columns.filter(column => !['employeeNameKh', 'actions'].includes(column.key));
async function loadDetail(request) {
 const version = ++detailVersion;
 selectedRequest.value = request; detail.value = null; detailError.value = ''; detailLoading.value = false;
 userHistory.value = requests.value.filter(row => row.employeeId === request.employeeId);
 if (!props.onGetById || !request.employeeId) return;
 detailLoading.value = true;
 try {
   const payload = await props.onGetById(request.employeeId);
   if (payload?.ok === false || payload?.result === false) throw new Error(payload.error || payload.message);
   const fetched = listFrom(payload);
   const candidate = fetched.find(row => String(row.id ?? row.leave_request_id) === request.id);
   const data = payload?.data?.data ?? payload?.data ?? payload;
   const single = data?.leaveRequest ?? data?.leave_request ?? data;
   const match = candidate || (single && String(single.id ?? single.leave_request_id) === request.id ? single : null);
   if (version === detailVersion) {
     const rows = fetched.length ? fetched : match ? [match] : [];
     const byId = new Map(userHistory.value.map(row => [row.id, row]));
     for (const row of rows) {
       const normalized = normalize(row);
       if (normalized.employeeId && normalized.employeeId !== request.employeeId) continue;
       byId.set(normalized.id, { ...normalized, employeeId: request.employeeId, employeeNameKh: normalized.employeeNameKh || request.employeeNameKh, employeeNameEn: normalized.employeeNameEn || request.employeeNameEn });
     }
     userHistory.value = newestLeaveRequests([...byId.values()]);
   }
   if (version === detailVersion && match) detail.value = normalize({ ...request, ...match,
     startDate: match.startDate ?? match.start_date ?? request.startDate,
     endDate: match.endDate ?? match.end_date ?? request.endDate,
     leaveType: match.leaveType ?? match.leave_type ?? request.leaveType,
     reason: match.reason ?? match.description ?? request.reason,
   });
 } catch(cause) { if (version === detailVersion) detailError.value = adminErrorMessage(cause); }
 finally { if (version === detailVersion) detailLoading.value = false; }
}
function closeDetail() { selectedRequest.value = null; detail.value = null; userHistory.value = []; detailVersion++; }
function requestAction(request, action) { if (!busyId.value) confirmation.value = { request, action }; }
async function mutate(request, actionName) {
 const action = { approve: props.onApprove, reject: props.onReject, delete: props.onDelete }[actionName];
 if (!action || busyId.value) return;
 busyId.value = request.id;
 try {
   const result = await action(request.id);
   if (result?.ok === false || result?.result === false) throw new Error(result.error || result.message);
   confirmation.value = null;
   if (selectedRequest.value?.id === request.id) closeDetail();
   notify({approve:'សំណើសុំច្បាប់ត្រូវបានអនុម័តដោយជោគជ័យ។',reject:'សំណើសុំច្បាប់ត្រូវបានបដិសេធ។',delete:'សំណើសុំច្បាប់ត្រូវបានលុបដោយជោគជ័យ។'}[actionName]);
   await refresh();
 } catch (cause) { notify(adminErrorMessage(cause), 'error'); }
 finally { busyId.value = ''; }
}
onMounted(refresh);
</script>

<template>
 <section class="leave-page">
  <header class="leave-page-heading"><div><h1>សំណើសុំច្បាប់</h1><p>ពិនិត្យ និងគ្រប់គ្រងសំណើសុំច្បាប់របស់បុគ្គលិក។</p></div></header>
  <div class="leave-summary" aria-label="ស្ថិតិសំណើសុំច្បាប់">
   <button v-for="item in filters" :key="item.id" type="button" class="leave-summary-card" :class="[item.id, {active: activeFilter === item.id}]" :aria-pressed="activeFilter === item.id" @click="activeFilter = item.id"><span class="summary-icon"><component :is="item.icon" :size="21"/></span><span class="summary-copy"><span>{{ item.label }}</span><span v-if="loading" class="summary-skeleton" aria-hidden="true"></span><strong v-else>{{ counts[item.id] }}</strong></span></button>
  </div>
  <section class="leave-panel" aria-labelledby="leave-list-title">
   <div class="leave-toolbar"><div class="leave-list-title"><h2 id="leave-list-title">សំណើថ្មីៗ</h2><span v-if="!loading" class="leave-count">{{ visibleRequests.length }} សំណើ</span></div><div class="leave-toolbar-controls"><label class="leave-search"><Search :size="18" aria-hidden="true"/><input v-model="search" type="search" placeholder="ស្វែងរកឈ្មោះ ឬលេខបុគ្គលិក…" aria-label="ស្វែងរកសំណើ"/></label><select v-model="typeFilter" aria-label="តម្រងប្រភេទច្បាប់"><option value="all">គ្រប់ប្រភេទច្បាប់</option><option v-for="type in typeOptions" :key="type" :value="type">{{ leaveLabel(type) }}</option></select><BaseButton v-if="hasFilters" variant="ghost" size="sm" @click="resetFilters">សម្អាតតម្រង</BaseButton></div></div>
   <BaseTable :columns="columns" :rows="visibleRequests" :loading="loading" :error="error" row-clickable :row-label="row => 'មើលសំណើរបស់ ' + (row.employeeNameKh || row.employeeNameEn || row.employeeId)" caption="បញ្ជីសំណើសុំច្បាប់" :empty-text="hasFilters ? 'មិនមានសំណើត្រូវនឹងការស្វែងរករបស់អ្នកទេ។' : 'មិនទាន់មានសំណើសុំច្បាប់ទេ។'" @retry="refresh" @row-click="loadDetail">
    <template #cell-employeeNameKh="{row}"><div class="leave-employee"><UserAvatar :src="row.avatar || row.profile_image" :name="row.employeeNameEn || row.employeeNameKh" :size="32"/><div><strong :title="row.employeeNameKh || row.employeeNameEn">{{ row.employeeNameKh || row.employeeNameEn || 'បុគ្គលិក ' + row.employeeId }}</strong><small v-if="row.employeeNameKh && row.employeeNameEn && row.employeeNameKh !== row.employeeNameEn" :title="row.employeeNameEn">{{ row.employeeNameEn }}</small></div></div></template>
    <template #cell-startDate="{row}"><div class="leave-dates"><span>{{ formatDate(row.startDate) }}</span><small><ArrowRight :size="12"/>{{ formatDate(row.endDate) }}</small></div></template>
    <template #cell-createdAt="{value}">{{ formatDate(value) }}</template>
    <template #cell-status="{row}"><span class="leave-status" :class="row.status"><Clock3 v-if="row.status === 'pending'" :size="14"/><CheckCircle2 v-else-if="row.status === 'approved'" :size="14"/><XCircle v-else :size="14"/>{{ statusLabel(row.status) }}</span></template>
    <template #cell-actions="{row}"><div class="leave-actions"><button v-if="onApprove && row.status === 'pending'" type="button" class="leave-action approve" :disabled="!!busyId" :aria-label="'អនុម័តសំណើរបស់ ' + (row.employeeNameKh || row.employeeNameEn || row.employeeId)" title="អនុម័តសំណើ" @click="mutate(row, 'approve')"><LoaderCircle v-if="busyId === row.id" :size="18" class="animate-spin"/><Check v-else :size="18"/></button><button v-if="onReject && row.status === 'pending'" type="button" class="leave-action reject" :disabled="!!busyId" :aria-label="'បដិសេធសំណើរបស់ ' + (row.employeeNameKh || row.employeeNameEn || row.employeeId)" title="បដិសេធសំណើ" @click="requestAction(row, 'reject')"><XCircle :size="18"/></button><button v-if="onDelete" type="button" class="leave-action delete" :disabled="!!busyId" :aria-label="'លុបសំណើរបស់ ' + (row.employeeNameKh || row.employeeNameEn || row.employeeId)" title="លុបសំណើ" @click="requestAction(row, 'delete')"><Trash2 :size="17"/></button><span v-if="busyId === row.id" role="status" class="sr-only">កំពុងដំណើរការ…</span></div></template>
    <template #empty-action><BaseButton v-if="hasFilters" variant="outline" @click="resetFilters">សម្អាតតម្រង</BaseButton></template>
   </BaseTable>
  </section>
  <BaseModal v-if="selectedRequest" model-value title="ព័ត៌មានសំណើសុំច្បាប់" show-header size="lg" :busy="!!busyId" @close="closeDetail">
   <div class="leave-detail-person"><UserAvatar :name="selectedRequest.employeeNameEn || selectedRequest.employeeNameKh" :size="44"/><div><h3>{{ selectedRequest.employeeNameKh || selectedRequest.employeeNameEn || 'បុគ្គលិក ' + selectedRequest.employeeId }}</h3><p>{{ selectedRequest.employeeNameEn }}</p></div><span class="leave-status" :class="currentDetail.status">{{ statusLabel(selectedRequest.status) }}</span></div>
   <BaseSkeleton v-if="detailLoading" :lines="3"/>
   <div v-if="detailError" class="form-error" role="alert">{{ detailError }} <BaseButton variant="ghost" @click="loadDetail(selectedRequest)">ព្យាយាមម្ដងទៀត</BaseButton></div>
   <dl class="leave-detail-grid"><div><dt>ប្រភេទច្បាប់</dt><dd>{{ leaveLabel(currentDetail.leaveType) }}</dd></div><div><dt>ចាប់ពី</dt><dd>{{ formatDate(currentDetail.startDate) }}</dd></div><div><dt>ដល់</dt><dd>{{ formatDate(currentDetail.endDate) }}</dd></div><div class="leave-reason"><dt>មូលហេតុ</dt><dd>{{ currentDetail.reason || 'មិនបានបញ្ជាក់មូលហេតុ។' }}</dd></div></dl>

   <section class="leave-user-history" aria-labelledby="leave-user-history-title"><h3 id="leave-user-history-title"><History :size="18"/>ប្រវត្តិសំណើរបស់បុគ្គលិក</h3><BaseTable :columns="historyColumns" :rows="previousRequests" :loading="detailLoading" row-clickable :row-label="row => 'មើលសំណើ ' + row.id" caption="ប្រវត្តិសំណើរបស់បុគ្គលិក" empty-text="មិនមានសំណើមុនផ្សេងទៀតទេ។" @row-click="loadDetail"><template #cell-startDate="{row}"><div class="leave-dates"><span>{{ formatDate(row.startDate) }}</span><small><ArrowRight :size="12"/>{{ formatDate(row.endDate) }}</small></div></template><template #cell-createdAt="{value}">{{ formatDate(value) }}</template><template #cell-status="{value}"><span class="leave-status" :class="value">{{ statusLabel(value) }}</span></template></BaseTable></section>
   <template #footer><BaseButton variant="outline" @click="closeDetail" :disabled="!!busyId">បិទ</BaseButton><BaseButton v-if="onReject && selectedRequest.status === 'pending'" variant="outline" :disabled="!!busyId" @click="requestAction(selectedRequest,'reject')"><XCircle :size="16"/>បដិសេធ</BaseButton><BaseButton v-if="onApprove && selectedRequest.status === 'pending'" :loading="busyId === selectedRequest.id" @click="mutate(selectedRequest,'approve')"><Check :size="16"/>អនុម័តសំណើ</BaseButton></template>
  </BaseModal>
  <BaseModal v-if="confirmation" model-value :title="confirmation.action === 'delete' ? 'លុបសំណើសុំច្បាប់?' : 'បដិសេធសំណើសុំច្បាប់?'" show-header size="sm" :busy="!!busyId" @close="confirmation = null"><p class="leave-confirm-copy">{{ confirmation.action === 'delete' ? 'តើអ្នកចង់លុបសំណើសុំច្បាប់នេះមែនទេ? សកម្មភាពនេះមិនអាចត្រឡប់ក្រោយបានទេ។' : 'តើអ្នកចង់បដិសេធសំណើសុំច្បាប់នេះមែនទេ?' }}</p><p class="leave-confirm-name">{{ confirmation.request.employeeNameKh || confirmation.request.employeeNameEn }}</p><template #footer><BaseButton variant="outline" :disabled="!!busyId" @click="confirmation = null">បោះបង់</BaseButton><BaseButton variant="danger" :loading="!!busyId" @click="mutate(confirmation.request, confirmation.action)">{{ confirmation.action === 'delete' ? 'លុបសំណើ' : 'បដិសេធសំណើ' }}</BaseButton></template></BaseModal>
 </section>
</template>
<style scoped>
.leave-user-history { margin-top:24px; border-top:1px solid var(--line); padding-top:20px; }
.leave-user-history h3 { display:flex; align-items:center; gap:8px; margin:0 0 16px; font-size:16px; font-weight:600; }
.leave-user-history :deep(.base-table) { min-width:500px; }
.leave-page { display:grid; gap:24px; min-width:0; }
.leave-page-heading { display:flex; justify-content:space-between; align-items:center; gap:20px; }
.leave-page-heading h1 { margin:0 0 8px; color:var(--ink); font-size:clamp(24px,2.3vw,30px); font-weight:700; }
.leave-page-heading p { margin:0; color:var(--muted); font-size:14px; line-height:1.8; }
.leave-summary { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:16px; }
.leave-summary-card { display:flex; align-items:center; gap:16px; min-width:0; padding:20px; text-align:left; border:1px solid var(--line); border-radius:18px; background:var(--surface); color:var(--ink); cursor:pointer; transition:background .15s,border-color .15s; }
.leave-summary-card:hover { border-color:#72b9bf; }
.leave-summary-card.active { border-color:#008c9b; background:var(--soft); box-shadow:0 0 0 1px #008c9b24; }
.summary-icon { width:46px; height:46px; flex-shrink:0; display:grid; place-items:center; border-radius:14px; background:#e3f3f5; color:#008596; }
.pending .summary-icon { background:#fff5df; color:#a46a13; }
.approved .summary-icon { background:#e4f6ec; color:#18744f; }
.rejected .summary-icon { background:#fff0f2; color:#af3e54; }
.summary-copy { display:grid; gap:6px; min-width:0; }
.summary-copy>span:first-child { color:var(--muted); font-size:13px; line-height:1.7; }
.summary-copy strong { font-size:27px; font-weight:700; line-height:1.2; }
.summary-skeleton { display:block; width:48px; height:30px; border-radius:6px; background:var(--line); }
.leave-panel { min-width:0; border:1px solid var(--line); border-radius:20px; background:var(--surface); overflow:hidden; }
.leave-toolbar { padding:20px; display:flex; align-items:center; justify-content:space-between; gap:20px; }
.leave-list-title { display:flex; align-items:center; gap:12px; flex-shrink:0; }
.leave-list-title h2 { margin:0; font-size:17px; font-weight:650; color:var(--ink); }
.leave-count { padding:4px 10px; border-radius:8px; color:var(--blue); background:var(--soft); font-size:12px; white-space:nowrap; }
.leave-toolbar-controls { display:flex; align-items:center; justify-content:flex-end; gap:12px; flex-wrap:wrap; }
.leave-search { display:flex; align-items:center; gap:10px; min-height:44px; width:300px; max-width:100%; padding:0 14px; border:1px solid var(--line); border-radius:12px; color:var(--muted); background:var(--soft); }
.leave-search input { width:100%; min-width:0; padding:10px 0; border:0; background:transparent; outline:0; font-size:13px; color:var(--ink); }
.leave-search:focus-within { outline:2px solid var(--blue); outline-offset:2px; }
.leave-toolbar select { min-height:44px; max-width:100%; padding:8px 34px 8px 12px; background:var(--surface); color:var(--ink); border:1px solid var(--line); border-radius:12px; font-size:13px; }
.leave-panel :deep(.base-table-panel) { border:0; border-radius:0; box-shadow:none; }
.leave-panel :deep(.base-table td), .leave-user-history :deep(.base-table td) { padding:10px 18px; height:64px; }
.leave-panel :deep(.base-table th), .leave-user-history :deep(.base-table th) { padding:11px 18px; }
.leave-employee { display:flex; align-items:center; gap:10px; min-width:180px; max-width:260px; }
.leave-employee>div { min-width:0; display:grid; gap:2px; }
.leave-employee strong { color:var(--ink); font-size:13px; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; line-height:1.6; }
.leave-employee small { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.leave-employee small,.leave-dates small { color:var(--muted); font-size:12px; }
.leave-type { display:inline-flex; gap:8px; align-items:center; font-size:13px; color:var(--ink); white-space:nowrap; }
.leave-type svg { color:var(--blue); }
.leave-dates { display:flex; align-items:center; gap:8px; white-space:nowrap; font-size:12px; line-height:1.7; }
.leave-dates small { display:flex; align-items:center; gap:8px; }
.leave-status { display:inline-flex; align-items:center; gap:6px; width:max-content; padding:4px 9px; border-radius:999px; background:#fff5df; color:#936113; font-size:12px; font-weight:600; white-space:nowrap; }
.leave-status.approved { color:#18744f; background:#e4f6ec; }
.leave-status.rejected,.leave-status.cancelled { color:#a53b50; background:#fff0f2; }
.leave-actions { display:flex; justify-content:flex-end; align-items:center; gap:6px; min-width:114px; }
.leave-action { width:36px; min-height:36px; display:grid; place-items:center; border-radius:9px; border:1px solid transparent; background:transparent; color:var(--muted); cursor:pointer; }
.leave-action.approve { color:#18744f; }
.leave-action.reject { color:#a46a13; }
.leave-action.delete { color:#c03953; }
.leave-action:hover:not(:disabled) { background:var(--soft); border-color:currentColor; }
.leave-action:disabled { opacity:.4; cursor:wait; }
.leave-page button:focus-visible,.leave-toolbar select:focus-visible { outline:2px solid var(--blue); outline-offset:3px; }
.leave-detail-person { display:flex; align-items:center; flex-wrap:wrap; gap:14px; padding:16px; background:var(--soft); border-radius:14px; margin-bottom:24px; }
.leave-detail-person>div { flex:1; min-width:140px; }
.leave-detail-person h3 { margin:0 0 5px; font-size:16px; font-weight:600; }
.leave-detail-person p { margin:0; font-size:13px; color:var(--muted); }
.leave-detail-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:24px; }
.leave-detail-grid dt { color:var(--muted); font-size:13px; margin-bottom:8px; }
.leave-detail-grid dd { margin:0; font-size:14px; color:var(--ink); line-height:1.8; overflow-wrap:anywhere; white-space:pre-wrap; }
.leave-reason { grid-column:1/-1; padding-top:20px; border-top:1px solid var(--line); }
.leave-confirm-copy { font-size:14px; color:var(--muted); line-height:1.9; }
.leave-confirm-name { font-weight:600; margin-top:12px; }
:global(.dark) .summary-icon { background:#153a41; color:#68d2db; }
:global(.dark) .pending .summary-icon,:global(.dark) .leave-status { background:#3a3020; color:#f5ce80; }
:global(.dark) .approved .summary-icon,:global(.dark) .leave-status.approved { background:#183b30; color:#83dfb4; }
:global(.dark) .rejected .summary-icon,:global(.dark) .leave-status.rejected,:global(.dark) .leave-status.cancelled { background:#422630; color:#f5a5b5; }
@media(max-width:1100px) { .leave-toolbar { align-items:flex-start; flex-direction:column; } .leave-toolbar-controls { width:100%; justify-content:flex-start; } .leave-search { flex:1; width:auto; } .leave-summary-card { gap:10px; padding:16px; } }
@media(max-width:640px) { .leave-page { gap:18px; } .leave-page-heading { align-items:flex-start; flex-direction:column; gap:12px; } .leave-page-heading p { font-size:13px; } .leave-summary { grid-template-columns:repeat(2,minmax(0,1fr)); gap:10px; } .leave-summary-card { padding:14px 12px; gap:10px; border-radius:14px; } .summary-icon { width:36px; height:36px; border-radius:10px; } .summary-copy>span:first-child { font-size:11px; } .summary-copy strong { font-size:23px; } .leave-toolbar { padding:16px; gap:14px; } .leave-toolbar-controls { gap:10px; } .leave-search { width:100%; flex-basis:100%; } .leave-toolbar select { flex:1; } .leave-detail-person .leave-status { margin-left:58px; } }
</style>
