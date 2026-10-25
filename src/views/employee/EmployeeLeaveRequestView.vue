<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { employeeApi } from '@/api/employeeApi';
import { leaveBody, leaveErrors, leaveDays, nextLeaveDate, leaveHistory, localToday, statusLabels } from '@/api/employeeData';
import BaseModal from '@/components/base/BaseModal.vue';
import BaseTable from '@/components/base/BaseTable.vue';
import BaseButton from '@/components/base/BaseButton.vue';
import BaseSkeleton from '@/components/base/BaseSkeleton.vue';
import { Plus, CalendarDays, X, Send, Pencil, TriangleAlert, Search, Clock3, CheckCircle2, XCircle, FileText, ArrowUpRight, Paperclip, Ban } from 'lucide-vue-next';
import { notify } from '@/stores/toasts';
import { employeeError } from '@/utils/employeeMessages';
defineOptions({ inheritAttrs: false });
const props = defineProps({ manager: Boolean });

const rows = ref([]);
const loading = ref(false);
const busy = ref(false);
const error = ref('');
const formOpen = ref(false);
const editing = ref(null);
const cancelling = ref(null);
const filter = ref('all');
const search = ref('');
const selected = ref(null);
const number = value => new Intl.NumberFormat('km-KH').format(value);
const formatDate = value => {
  if (!value) return '—';
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('km-KH', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
};
const safeFileUrl = value => /^https?:\/\//i.test(String(value ?? '')) ? value : null;
const summaries = computed(() => [
  { value: 'all', label: 'សំណើសរុប', icon: FileText, count: rows.value.length, color: 'teal' },
  { value: 'pending', label: 'កំពុងរង់ចាំ', icon: Clock3, count: rows.value.filter(row => row.status === 'pending').length, color: 'amber' },
  { value: 'approved', label: 'បានអនុម័ត', icon: CheckCircle2, count: rows.value.filter(row => row.status === 'approved').length, color: 'green' },
  { value: 'rejected', label: 'បានបដិសេធ', icon: XCircle, count: rows.value.filter(row => row.status === 'rejected').length, color: 'rose' },
]);
const form = reactive({ startDate: '', endDate: '', reason: '', fileUrl: '' });
const fieldErrors = ref({});
const visibleRows = computed(() => {
  const query = props.manager ? '' : search.value.trim().toLowerCase();
  return rows.value.filter(row => (filter.value === 'all' || row.status === filter.value)
    && (!query || [row.id, row.reason, row.startDate, row.endDate, statusLabels[row.status]]
      .some(value => String(value ?? '').toLowerCase().includes(query))));
});
const days = computed(() => leaveDays(form.startDate, form.endDate));
const attachmentRequired = computed(() => days.value > 2);
const columns = [
  { key: 'reason', label: 'សំណើសុំច្បាប់' },
  { key: 'startDate', label: 'រយៈពេលសុំច្បាប់', sortable: true },
  { key: 'appliedDate', label: 'ថ្ងៃដាក់សំណើ', sortable: true },
  { key: 'status', label: 'ស្ថានភាព', sortable: true },
  { key: 'actions', label: 'សកម្មភាព', align: 'right' },
];
watch([() => form.startDate, () => form.endDate, () => form.fileUrl], () => {
  if ('fileUrl' in fieldErrors.value) fieldErrors.value = { ...fieldErrors.value, fileUrl: leaveErrors(form).fileUrl || '' };
});
const canChange = row => row.id != null && row.status === 'pending';

async function load() {
  if (loading.value) return;
  loading.value = true;
  error.value = '';
  try { rows.value = leaveHistory(await employeeApi.getLeaveHistory()); }
  catch (cause) { error.value = employeeError(cause, 'មិនអាចទាញយកប្រវត្តិសុំច្បាប់បានទេ។'); notify(error.value, 'error'); }
  finally { loading.value = false; }
}
function openForm(row = null) {
  editing.value = row;
  fieldErrors.value = {};
  Object.assign(form, row ? { startDate: row.startDate, endDate: row.endDate, reason: row.reason, fileUrl: row.fileUrl } : { startDate: localToday(), endDate: nextLeaveDate(localToday()), reason: '', fileUrl: '' });
  formOpen.value = true;
}
async function submit() {
  if (busy.value) return;
  try {
    fieldErrors.value = leaveErrors(form);
    if (Object.keys(fieldErrors.value).length) return;
    const body = leaveBody(form);
    busy.value = true;
    if (editing.value) await employeeApi.updateLeave(editing.value.id, body);
    else await employeeApi.createLeave(body);
    formOpen.value = false;
    notify(editing.value ? 'បានកែប្រែសំណើដោយជោគជ័យ។' : 'បានដាក់សំណើដោយជោគជ័យ។');
    await load();
  } catch (cause) { notify(employeeError(cause, 'មិនអាចរក្សាទុកសំណើបានទេ។ សូមព្យាយាមម្ដងទៀត។'), 'error'); }
  finally { busy.value = false; }
}
async function cancel() {
  if (busy.value || !cancelling.value) return;
  busy.value = true;
  try {
    await employeeApi.cancelLeave(cancelling.value.id);
    cancelling.value = null;
    notify('បានលុបចោលសំណើដោយជោគជ័យ។');
    await load();
  } catch (cause) { notify(employeeError(cause, 'មិនអាចលុបចោលសំណើបានទេ។ សូមព្យាយាមម្ដងទៀត។'), 'error'); }
  finally { busy.value = false; }
}
onMounted(load);
</script>

<template>
  <div class="ess-page employee-leave-page compact-leave-page" :class="{ 'manager-leave-page': manager }">
    <header class="ml-heading"><div><h1>{{ manager ? 'សំណើសុំច្បាប់' : 'ស្នើសុំច្បាប់ឈប់សម្រាក' }}</h1><p>ដាក់សំណើ កែប្រែ និងតាមដានស្ថានភាពឈប់សម្រាករបស់អ្នក។</p></div><div class="ml-heading-actions"><BaseButton :disabled="busy" @click="openForm()"><Plus :size="17" />ស្នើសុំច្បាប់ថ្មី</BaseButton></div></header>
    <div class="el-summary" aria-label="សង្ខេបសំណើសុំច្បាប់">
      <div v-for="item in summaries" :key="item.value" class="el-summary-card" :class="item.color" :aria-busy="loading">
        <span class="el-summary-icon"><component :is="item.icon" :size="21" /></span><div><span>{{ item.label }}</span><strong><BaseSkeleton v-if="loading" inline :lines="1" /><template v-else>{{ error ? '—' : number(item.count) }}</template></strong></div>
      </div>
    </div>
    <section class="el-history" :aria-busy="loading" :aria-labelledby="manager ? 'manager-leave-history-title' : 'employee-leave-history-title'">
      <div v-if="!manager" class="el-panel-heading"><div class="el-heading-copy"><span class="el-heading-icon"><FileText :size="21" /></span><div><h2 id="employee-leave-history-title">ប្រវត្តិសុំច្បាប់</h2><p>ព័ត៌មានសំណើ និងស្ថានភាពនៃការអនុម័ត</p></div></div></div>
      <div class="el-toolbar"><div v-if="manager" class="ml-list-title"><h2 id="manager-leave-history-title">សំណើរបស់ខ្ញុំ</h2><span>{{ loading || error ? '—' : number(visibleRows.length) }} សំណើ</span></div>
        <label v-if="!manager" class="el-search"><Search :size="18" /><input v-model="search" type="search" placeholder="ស្វែងរកមូលហេតុ ឬកាលបរិច្ឆេទ…" aria-label="ស្វែងរកសំណើសុំច្បាប់" /></label>
        <div class="el-filters"><select v-model="filter" class="filter-select" aria-label="ស្ថានភាពសំណើ"><option value="all">ស្ថានភាពទាំងអស់</option><option v-for="(label, value) in statusLabels" :key="value" :value="value">{{ label }}</option></select></div>
      </div>
      <BaseTable :columns="columns" :rows="visibleRows" :loading="loading" :error="error" row-clickable :row-label="row => 'មើលសំណើ ' + (row.reason || formatDate(row.startDate))" caption="បញ្ជីសំណើសុំច្បាប់របស់ខ្ញុំ" empty-text="មិនមានសំណើត្រូវបង្ហាញទេ។" @retry="load" @row-click="row => selected = row">
        <template #cell-startDate="{row}"><div class="ml-compact-dates"><span>{{ formatDate(row.startDate) }} <span class="ml-date-separator" aria-hidden="true">→</span> {{ formatDate(row.endDate) }}</span><small>{{ number(leaveDays(row.startDate, row.endDate)) }} ថ្ងៃ</small></div></template>
        <template #cell-reason="{row}"><div class="ml-request-summary"><span class="ml-request-icon"><CalendarDays :size="18" /></span><strong :title="row.reason">{{ row.reason || 'សំណើសុំច្បាប់' }}</strong><a v-if="safeFileUrl(row.fileUrl)" class="ml-file-link" :href="safeFileUrl(row.fileUrl)" target="_blank" rel="noopener noreferrer" aria-label="មើលឯកសារបញ្ជាក់" title="មើលឯកសារបញ្ជាក់"><Paperclip :size="16" /></a></div></template>
        <template #cell-appliedDate="{value}">{{ formatDate(value) }}</template>
        <template #cell-status="{value}"><span class="ess-status el-status" :class="value"><i></i>{{ statusLabels[value] || value }}</span></template>
        <template #cell-actions="{row}"><div v-if="canChange(row)" class="el-row-actions"><BaseButton variant="ghost" size="sm" :disabled="busy" :aria-label="`កែប្រែសំណើ ${row.id}`" @click="openForm(row)"><Pencil :size="17" /></BaseButton><BaseButton class="el-cancel" variant="ghost" size="sm" :disabled="busy" :aria-label="`លុបចោលសំណើ ${row.id}`" @click="cancelling = row"><Ban :size="17" /></BaseButton></div><span v-else class="ml-muted">—</span></template>
      </BaseTable>

    </section>
    <p class="el-help"><Clock3 :size="15" /> អ្នកអាចកែប្រែ ឬលុបចោលសំណើដែលកំពុងរង់ចាំការអនុម័ត។</p>
    <BaseModal :model-value="Boolean(selected)" class="account-action-modal employee-action-modal el-detail-modal" title="ព័ត៌មានសំណើសុំច្បាប់" @update:model-value="value => { if (!value) selected = null; }">
      <div v-if="selected" class="ess-dialog">
        <div class="account-dialog-heading"><span class="profile-section-icon"><FileText :size="22" /></span><div><h2>ព័ត៌មានសំណើសុំច្បាប់</h2><p>សំណើ #{{ selected.id ?? '—' }} · {{ formatDate(selected.appliedDate) }}</p></div><button class="icon-button" aria-label="បិទព័ត៌មាន" @click="selected = null"><X :size="20" /></button></div>
        <div class="el-detail-overview"><strong>សំណើសុំច្បាប់</strong><span class="ess-status el-status" :class="selected.status"><i></i>{{ statusLabels[selected.status] || selected.status || '—' }}</span></div>
        <div class="el-detail-dates"><div><small>ថ្ងៃចាប់ផ្តើម</small><strong>{{ formatDate(selected.startDate) }}</strong></div><div><small>ថ្ងៃបញ្ចប់</small><strong>{{ formatDate(selected.endDate) }}</strong></div><div><small>ចំនួនថ្ងៃ</small><strong>{{ number(leaveDays(selected.startDate, selected.endDate)) }} ថ្ងៃ</strong></div></div>
        <div class="el-detail-text"><h3>មូលហេតុសុំច្បាប់</h3><p>{{ selected.reason || '—' }}</p></div>
        <div v-if="selected.rejectionReason" class="el-detail-text"><h3>មូលហេតុបដិសេធ</h3><p>{{ selected.rejectionReason }}</p></div>
        <a v-if="safeFileUrl(selected.fileUrl)" class="el-detail-file" :href="safeFileUrl(selected.fileUrl)" target="_blank" rel="noopener noreferrer"><Paperclip :size="18" /><span>មើលឯកសារភ្ជាប់</span><ArrowUpRight :size="17" /></a>
        <div class="profile-form-actions"><button class="profile-secondary" @click="selected = null">បិទ</button><button v-if="canChange(selected)" class="small-primary" :disabled="busy" @click="openForm(selected); selected = null"><Pencil :size="16" /> កែប្រែសំណើ</button></div>
      </div>
    </BaseModal>
    <BaseModal v-model="formOpen" class="account-action-modal employee-action-modal" :title="editing ? 'កែប្រែសំណើ' : 'ដាក់ពាក្យសុំច្បាប់ថ្មី'" :busy="busy" :close-on-backdrop="!busy" :close-on-escape="!busy">
      <div class="ess-dialog">
        <div class="account-dialog-heading"><span class="profile-section-icon"><component :is="editing ? Pencil : CalendarDays" :size="22" /></span><div><h2>{{ editing ? 'កែប្រែសំណើសុំច្បាប់' : 'ដាក់ពាក្យសុំច្បាប់ថ្មី' }}</h2><p>បំពេញព័ត៌មានសម្រាប់ការស្នើសុំច្បាប់របស់អ្នក</p></div><button class="icon-button" aria-label="បិទ" :disabled="busy" @click="formOpen = false"><X :size="20" /></button></div>
        <form class="ess-form" novalidate :aria-busy="busy" @submit.prevent="submit"><fieldset :disabled="busy">

          <div class="ess-grid"><label>ថ្ងៃចាប់ផ្តើម<input v-model="form.startDate" type="date" required :aria-invalid="Boolean(fieldErrors.startDate)" /><small v-if="fieldErrors.startDate" class="el-field-error" role="alert">{{ fieldErrors.startDate }}</small></label><label>ថ្ងៃបញ្ចប់<input v-model="form.endDate" type="date" :min="nextLeaveDate(form.startDate)" required :aria-invalid="Boolean(fieldErrors.endDate)" /><small v-if="fieldErrors.endDate" class="el-field-error" role="alert">{{ fieldErrors.endDate }}</small></label></div>
          <p class="employee-days" aria-live="polite"><CalendarDays :size="18" /><span>រយៈពេលឈប់សម្រាក <strong>{{ number(days) }} ថ្ងៃ</strong></span></p>
          <label>មូលហេតុ<textarea v-model="form.reason" placeholder="សូមពណ៌នាមូលហេតុដែលអ្នកចង់សុំច្បាប់…" required :aria-invalid="Boolean(fieldErrors.reason)" /><small v-if="fieldErrors.reason" class="el-field-error" role="alert">{{ fieldErrors.reason }}</small></label>
          <label class="el-url-label">តំណឯកសារបញ្ជាក់ {{ attachmentRequired ? '(ត្រូវការ)' : '(មិនចាំបាច់)' }}<input v-model="form.fileUrl" type="url" inputmode="url" placeholder="https://example.com/document.pdf" :required="attachmentRequired" :aria-required="attachmentRequired" :aria-invalid="Boolean(fieldErrors.fileUrl)" aria-describedby="leave-url-help leave-url-error" /><small id="leave-url-help">បញ្ចូលតំណរូបភាព ឬឯកសារបញ្ជាក់។ ការសុំច្បាប់លើសពី ២ ថ្ងៃ ត្រូវបញ្ចូលតំណឯកសារ។</small><small v-if="fieldErrors.fileUrl" id="leave-url-error" class="el-field-error" role="alert">{{ fieldErrors.fileUrl }}</small></label>
          <a v-if="safeFileUrl(form.fileUrl) && !fieldErrors.fileUrl" class="el-detail-file" :href="safeFileUrl(form.fileUrl.trim())" target="_blank" rel="noopener noreferrer"><Paperclip :size="18" /><span>មើលឯកសារតាមតំណ</span><ArrowUpRight :size="17" /></a>
        </fieldset><div class="profile-form-actions"><button type="button" class="profile-secondary" :disabled="busy" @click="formOpen = false">បោះបង់</button><button class="small-primary" :disabled="busy"><Send :size="16" />{{ busy ? 'កំពុងរក្សាទុក…' : 'រក្សាទុកសំណើ' }}</button></div></form>
      </div>
    </BaseModal>
    <BaseModal :model-value="Boolean(cancelling)" class="account-action-modal employee-action-modal employee-cancel-modal" title="បញ្ជាក់ការលុបចោលសំណើ" :busy="busy" :close-on-backdrop="!busy" :close-on-escape="!busy" @update:model-value="value => { if (!value) cancelling = null; }">
      <div class="ess-dialog"><div class="account-dialog-heading"><span class="profile-section-icon employee-warning-icon"><TriangleAlert :size="22" /></span><div><h2>បញ្ជាក់ការលុបចោលសំណើ</h2><p>សូមពិនិត្យសំណើមុនពេលបញ្ជាក់</p></div><button class="icon-button" aria-label="បិទ" :disabled="busy" @click="cancelling = null"><X :size="20" /></button></div><div class="employee-cancel-summary"><strong>{{ cancelling?.reason || 'សំណើសុំច្បាប់' }}</strong><p>{{ cancelling?.startDate }} → {{ cancelling?.endDate }}</p></div><p>តើអ្នកចង់លុបចោលសំណើនេះមែនទេ?</p><p class="ess-muted">អ្នកអាចដាក់សំណើថ្មីនៅពេលក្រោយ។</p><div class="profile-form-actions"><button class="profile-secondary" :disabled="busy" @click="cancelling = null">រក្សាសំណើ</button><button class="ess-button ess-danger" :disabled="busy" @click="cancel">{{ busy ? 'កំពុងលុបចោល…' : 'បញ្ជាក់ការលុបចោល' }}</button></div></div>
    </BaseModal>
  </div>
</template>

<style scoped>
.ml-request-summary { display:flex; align-items:center; gap:10px; max-width:360px; min-width:190px; }
.ml-request-icon { display:grid; place-items:center; flex-shrink:0; width:34px; height:34px; border-radius:10px; background:var(--soft); color:var(--blue); }
.ml-request-summary strong { display:block; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:13px; font-weight:600; line-height:1.6; color:var(--ink); }
.ml-file-link { display:grid; place-items:center; width:36px; height:36px; flex-shrink:0; color:var(--blue); border-radius:8px; }
.ml-file-link:hover { background:var(--soft); }
.ml-file-link:focus-visible { outline:2px solid var(--blue); outline-offset:2px; }
.ml-compact-dates { display:flex; align-items:center; flex-wrap:wrap; gap:6px 10px; font-size:12px; line-height:1.7; }
.ml-compact-dates>span { white-space:nowrap; }
.ml-date-separator { margin:0 6px; color:var(--muted); }
.ml-compact-dates small { padding:2px 7px; border-radius:6px; color:var(--blue); background:var(--soft); font-size:10px; white-space:nowrap; }
.compact-leave-page :deep(.base-table td) { padding:10px 18px; height:64px; }
.compact-leave-page :deep(.base-table th) { padding:11px 18px; }
.compact-leave-page .el-status { padding:4px 9px; }
.compact-leave-page .el-summary-card { box-shadow:none; }
.compact-leave-page .el-history { box-shadow:0 3px 14px #16354a04; }
.employee-days>span { display:flex; align-items:center; justify-content:space-between; flex:1; gap:16px; }
.employee-days strong { font-size:16px; }

.ml-heading { display:flex; align-items:center; justify-content:space-between; gap:20px; }
.ml-heading h1 { font-size:clamp(24px,2.3vw,30px); font-weight:700; margin:0 0 8px; }
.ml-heading p { color:var(--muted); font-size:14px; line-height:1.8; }
.ml-heading-actions { display:flex; flex-wrap:wrap; gap:10px; flex-shrink:0; }
.ml-list-title { display:flex; align-items:center; gap:12px; flex-shrink:0; }
.ml-list-title h2 { font-size:17px; font-weight:650; }
.ml-list-title>span { color:var(--blue); background:var(--soft); padding:4px 10px; border-radius:8px; font-size:12px; }
.compact-leave-page .el-toolbar { padding:20px; flex-wrap:wrap; }
.compact-leave-page .el-search { max-width:340px; }
.compact-leave-page .el-summary-card { border-radius:18px; padding:20px; }
.compact-leave-page .el-history { border-radius:20px; }
.compact-leave-page :deep(.base-table-panel) { border:0; border-radius:0; box-shadow:none; }
.compact-leave-page .el-row-actions { justify-content:flex-end; }
.ml-muted { color:var(--muted); }
@media(max-width:760px) { .ml-heading { align-items:flex-start; flex-direction:column; } .ml-heading-actions { width:100%; } .ml-heading-actions>* { flex:1; } .compact-leave-page .el-search { max-width:none; } .compact-leave-page .el-toolbar { padding:16px; } }

.el-field-error { color: #be123c; font-size: 12px; line-height: 1.8; }
.el-url-label small { color: var(--muted); font-size: 12px; line-height: 1.8; }
.el-url-label .el-field-error { color: #be123c; }
.employee-leave-page { gap: 20px; }
.profile-form-actions .small-primary { min-width: 158px; }
.el-icon-button:focus-visible, .el-create:focus-visible, .el-refresh:focus-visible { outline: 2px solid var(--blue); outline-offset: 3px; }
.el-hero { position: relative; isolation: isolate; overflow: hidden; display: flex; align-items: center; justify-content: space-between; gap: 24px; padding: 28px 30px; border-radius: 22px; background: linear-gradient(110deg, #078795, #086e7d); color: white; }
.el-hero-copy { position: relative; z-index: 1; }
.el-hero h1 { font-size: clamp(23px, 2.4vw, 29px); margin: 12px 0 6px; line-height: 1.7; }
.el-hero p { color: #d4f5f7; font-size: 13px; line-height: 1.8; }
.el-hero-art { position: absolute; right: 18%; top: -14px; transform: rotate(-16deg); opacity: .09; z-index: -1; }
.el-create { display: inline-flex; align-items: center; justify-content: center; gap: 9px; flex-shrink: 0; padding: 13px 18px; border-radius: 12px; background: #fff; color: #087985; font-size: 13px; font-weight: 650; box-shadow: 0 4px 12px #003c4822; cursor: pointer; }
.el-create:hover { background: #e6fcff; }
.el-summary { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; }
.el-summary-card { display: flex; align-items: center; gap: 14px; padding: 20px; border: 1px solid var(--line); border-radius: 17px; background: var(--surface); }
.el-summary-icon { display: grid; place-items: center; width: 44px; height: 44px; flex-shrink: 0; border-radius: 14px; color: #087f8c; background: #e0f1f3; }
.amber .el-summary-icon { color: #aa7416; background: #faf0dd; }
.green .el-summary-icon { color: #16846b; background: #e3f2eb; }
.rose .el-summary-icon { color: #b54863; background: #fbe9ee; }
.el-summary-card>div { display: grid; gap: 5px; min-width: 0; }
.el-summary-card>div>span { color: var(--muted); font-size: 12px; }
.el-summary-card strong { color: var(--ink); font-size: 26px; line-height: 1.25; }
.el-history { min-width: 0; overflow: hidden; border: 1px solid var(--line); border-radius: 20px; background: var(--surface); box-shadow: var(--workspace-shadow); }
.el-panel-heading { display: flex; align-items: center; justify-content: space-between; gap: 14px; padding: 22px 24px; }
.el-heading-copy { display: flex; align-items: center; gap: 12px; }
.el-heading-icon { display: grid; place-items: center; width: 42px; height: 42px; border-radius: 13px; background: var(--soft); color: var(--blue); flex-shrink: 0; }
.el-heading-copy h2 { font-size: 17px; }
.el-heading-copy p { color: var(--muted); font-size: 12px; margin-top: 5px; }
.el-refresh { display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-height: 40px; padding: 8px 12px; border: 1px solid var(--line); border-radius: 11px; color: var(--muted); font-size: 12px; cursor: pointer; }
.el-refresh:hover:not(:disabled) { color: var(--blue); background: var(--soft); }
.el-toolbar { display: flex; align-items: center; gap: 14px; justify-content: space-between; padding: 0 24px 20px; }
.el-search { display: flex; align-items: center; gap: 10px; max-width: 430px; flex: 1; border: 1px solid var(--line); border-radius: 12px; padding: 0 12px; color: var(--muted); background: var(--surface); }
.el-search:focus-within { outline: 2px solid var(--blue); outline-offset: 2px; }
.el-search input { width: 100%; min-width: 0; border: 0; outline: 0; padding: 12px 0; background: transparent; color: var(--ink); font-size: 12px; }
.el-search input::placeholder { color: var(--muted); }
.el-filters { display: flex; align-items: center; gap: 10px; }
.el-filters select { font-size: 12px; font-weight: 500; }
.el-table-wrap { overflow-x: auto; }
.el-table { width: 100%; border-collapse: collapse; text-align: left; font-size: 12px; }
.el-table th { padding: 13px 20px; color: var(--muted); font-weight: 600; background: var(--soft); white-space: nowrap; border-block: 1px solid var(--line); }
.el-table td { padding: 19px 20px; border-bottom: 1px solid var(--line); vertical-align: middle; }
.el-table tbody tr:last-child td { border-bottom: 0; }
.el-table tbody tr:hover { background: color-mix(in srgb, var(--soft) 45%, transparent); }
.el-request { display: flex; align-items: center; gap: 10px; min-width: 165px; }
.el-type-icon { display: grid; place-items: center; width: 36px; height: 36px; flex-shrink: 0; border: 1px solid var(--line); border-radius: 11px; color: var(--blue); background: var(--soft); }
.el-request strong { display: block; font-size: 12px; font-weight: 650; color: var(--ink); }
.el-request small { display: block; margin-top: 6px; color: var(--muted); font-size: 10px; }
.el-dates { display: grid; gap: 5px; min-width: 135px; }
.el-dates strong { font-size: 12px; font-weight: 600; }
.el-dates>span { color: var(--muted); font-size: 11px; }
.el-dates small { color: var(--blue); font-size: 10px; }
.el-reason { min-width: 100px; max-width: 220px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; overflow-wrap: anywhere; line-height: 1.9; color: var(--muted); }
.el-attachment { display: flex; align-items: center; gap: 5px; margin-top: 7px; color: var(--blue); font-size: 10px; }
.el-status { display: inline-flex; align-items: center; gap: 6px; font-size: 11px; padding: 5px 10px; }
.el-status i { width: 5px; height: 5px; border-radius: 50%; background: currentColor; flex-shrink: 0; }
.el-row-actions { display: flex; gap: 6px; }
.el-icon-button { display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; width: 40px; height: 40px; border: 1px solid var(--line); border-radius: 10px; background: var(--surface); color: var(--muted); cursor: pointer; }
.el-icon-button:hover:not(:disabled) { border-color: var(--blue); color: var(--blue); background: var(--soft); }
.el-cancel { color: #be123c; }
.el-row-actions :deep(button.el-cancel) { color: #be123c !important; }
:global(.dark) .el-row-actions :deep(button.el-cancel), :global(.dark) .el-icon-button.el-cancel { color: #fda4af !important; }
.el-cancel:hover:not(:disabled) { border-color: #f1abb8; color: #be123c; background: #fff1f2; }
.el-icon-button:disabled, .el-refresh:disabled, .el-create:disabled { opacity: .45; cursor: not-allowed; }
.el-empty { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 55px 20px; color: var(--muted); text-align: center; border-top: 1px solid var(--line); }
.el-empty-icon { display: grid; place-items: center; width: 64px; height: 64px; border-radius: 22px; background: var(--soft); color: var(--blue); margin-bottom: 6px; }
.el-empty h3 { color: var(--ink); font-size: 15px; font-weight: 600; }
.el-empty p { font-size: 12px; line-height: 1.8; }
.el-empty button { margin-top: 6px; }
.el-pagination { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 15px 24px; border-top: 1px solid var(--line); font-size: 11px; color: var(--muted); }
.el-pagination>div { display: flex; align-items: center; gap: 12px; }
.el-help { display: flex; align-items: center; justify-content: center; gap: 7px; font-size: 12px; color: var(--muted); line-height: 1.9; }
.el-detail-overview { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.el-detail-overview>strong { font-size: 16px; }
.el-detail-dates { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; padding: 16px; background: var(--soft); border-radius: 14px; }
.el-detail-dates small { display: block; font-size: 11px; color: var(--muted); margin-bottom: 8px; }
.el-detail-dates strong { font-size: 12px; font-weight: 600; }
.el-detail-text h3 { font-size: 12px; color: var(--muted); margin-bottom: 8px; }
.el-detail-text p { white-space: pre-wrap; overflow-wrap: anywhere; font-size: 13px; line-height: 1.9; }
.el-detail-file { display: flex; align-items: center; gap: 10px; padding: 14px; border: 1px solid var(--line); border-radius: 12px; color: var(--blue); font-size: 12px; }
.el-detail-file span { flex: 1; }
:global(.dark .employee-leave-page .el-summary-icon) { background: #163e50; color: #35ccdf; }
:global(.dark .employee-leave-page .amber .el-summary-icon) { background: #39351d; color: #ffd33d; }
:global(.dark .employee-leave-page .green .el-summary-icon) { background: #17483e; color: #00e5a0; }
:global(.dark .employee-leave-page .rose .el-summary-icon) { background: #452a37; color: #fda4af; }
@media (max-width: 1150px) { .el-toolbar { flex-wrap: wrap; } .el-search { max-width: none; flex-basis: 100%; } .el-filters { width: 100%; } .el-filters select { flex: 1; min-width: 0; } }
@media (max-width: 760px) {
  .el-hero { align-items: flex-start; flex-direction: column; padding: 24px; gap: 18px; } .el-hero-art { right: 8%; top: 16px; }
  .el-summary { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; } .el-summary-card { padding: 15px; gap: 10px; } .el-summary-card strong { font-size: 23px; }
  .el-panel-heading { padding: 18px 16px; } .el-toolbar { padding: 0 16px 16px; } .el-heading-copy p { display: none; } .el-refresh>span { display: none; }
  .el-table thead { display: none; } .el-table, .el-table tbody, .el-table tr { display: block; } .el-table tr { padding: 16px; border-top: 1px solid var(--line); } .el-table td { display: flex; justify-content: space-between; align-items: flex-start; gap: 14px; border: 0; padding: 8px 0; } .el-table td::before { content: attr(data-label); flex-shrink: 0; color: var(--muted); font-size: 11px; padding-top: 3px; } .el-table td:first-child::before { display: none; } .el-table td:first-child { padding-bottom: 14px; } .el-table .el-request { width: 100%; } .el-dates { text-align: right; } .el-reason { max-width: 240px; text-align: right; } .el-table td[data-label="មូលហេតុ"] { flex-wrap: wrap; } .el-attachment { margin: 0 0 0 auto; }
  .el-pagination { padding: 14px 16px; } .el-help { align-items: flex-start; text-align: center; font-size: 11px; } .el-help svg { flex-shrink: 0; margin-top: 3px; }
}
@media (max-width: 420px) { .el-summary-card { gap: 8px; padding: 12px; } .el-summary-icon { width: 34px; height: 34px; border-radius: 10px; } .el-summary-card>div>span { font-size: 10px; } .el-filters { flex-direction: column; align-items: stretch; } .el-pagination { flex-wrap: wrap; } .el-detail-dates { grid-template-columns: 1fr; } }
</style>
