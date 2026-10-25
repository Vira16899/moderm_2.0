<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { employeeApi } from '@/api/employeeApi';
import { dateOnly, money, salaryHistory } from '@/api/employeeData';
import { Wallet, History, CalendarDays, ShieldCheck } from 'lucide-vue-next';
import BaseSkeleton from '@/components/base/BaseSkeleton.vue';
import BaseTable from '@/components/base/BaseTable.vue';
import { employeeError } from '@/utils/employeeMessages';

defineOptions({ inheritAttrs: false });
const rows = ref([]), loading = ref(true), error = ref('');
let requestVersion = 0;
onBeforeUnmount(() => { requestVersion++; });
const latest = computed(() => rows.value[0]);
const dateLabel = value => {
  const date = dateOnly(value);
  return /^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isFinite(Date.parse(date))
    ? new Intl.DateTimeFormat('km-KH', { timeZone:'UTC', day:'numeric', month:'short', year:'numeric' }).format(new Date(date + 'T12:00:00Z')) : '—';
};
const columns = [
  { key:'date', label:'កាលបរិច្ឆេទ', sortable:true },
  { key:'description', label:'មូលហេតុ / ការពិពណ៌នា' },
  { key:'salary', label:'ប្រាក់ខែ (USD)', sortable:true, align:'right' },
];
async function load() {
  const version = ++requestVersion;
  loading.value = true; error.value = '';
  try {
    const result = salaryHistory(await employeeApi.getSalaryHistory());
    if (version === requestVersion) rows.value = result;
  } catch (cause) {
    if (version === requestVersion) error.value = employeeError(cause, 'មិនអាចទាញយកប្រវត្តិប្រាក់ខែបានទេ។ សូមព្យាយាមម្ដងទៀត។');
  } finally { if (version === requestVersion) loading.value = false; }
}
onMounted(load);
</script>

<template>
  <div class="salary-page">
    <header class="workspace-page-header page-heading salary-heading"><div><h1>ប្រវត្តិប្រាក់ខែរបស់ខ្ញុំ</h1><p>តាមដានប្រាក់ខែចុងក្រោយ និងកំណត់ត្រាការផ្លាស់ប្ដូររបស់អ្នក។</p></div></header>
    <section class="salary-overview" :aria-busy="loading" aria-label="សង្ខេបប្រាក់ខែ">
      <div class="salary-balance"><span class="salary-overline"><Wallet :size="18" />ប្រាក់ខែចុងក្រោយ<span class="salary-currency">USD</span></span><strong><BaseSkeleton v-if="loading" inline :lines="1" /><template v-else>{{ error ? '—' : money(latest?.salary) }}</template></strong><p>តាមកំណត់ត្រាចុងក្រោយពីប្រព័ន្ធ</p></div>
      <div class="salary-overview-details">
        <div class="salary-fact"><span class="salary-fact-icon"><CalendarDays :size="19" /></span><div><span>កែប្រែចុងក្រោយ</span><strong><BaseSkeleton v-if="loading" inline :lines="1" /><template v-else>{{ error ? '—' : dateLabel(latest?.date) }}</template></strong></div></div>
        <div class="salary-fact"><span class="salary-fact-icon"><History :size="19" /></span><div><span>កំណត់ត្រាសរុប</span><strong><BaseSkeleton v-if="loading" inline :lines="1" /><template v-else>{{ error ? '—' : rows.length }}<small v-if="!error"> កំណត់ត្រា</small></template></strong></div></div>
      </div>
    </section>
    <section class="salary-history" aria-labelledby="salary-history-title">
      <div class="salary-table-heading"><div><h2 id="salary-history-title"><History :size="19" />កំណត់ត្រាប្រាក់ខែ</h2><p>ព័ត៌មានកាលបរិច្ឆេទ មូលហេតុ និងចំនួនប្រាក់ខែនីមួយៗ</p></div><span v-if="!loading && !error" class="salary-count">{{ rows.length }} កំណត់ត្រា</span></div>
      <BaseTable :columns="columns" :rows="rows" :loading="loading" :error="error" caption="ប្រវត្តិប្រាក់ខែរបស់ខ្ញុំ" empty-text="មិនទាន់មានកំណត់ត្រាប្រាក់ខែទេ។" @retry="load">
        <template #cell-date="{value,row}"><div class="salary-date"><span class="salary-date-icon"><CalendarDays :size="16" /></span><span>{{ dateLabel(value) }}</span><span v-if="row.id === latest?.id" class="salary-latest">ចុងក្រោយ</span></div></template>
        <template #cell-salary="{value}"><strong class="salary-amount">{{ money(value) }}</strong></template>
        <template #cell-description="{value}"><span class="salary-description">{{ value || '—' }}</span></template>
      </BaseTable>
    </section>
    <p class="salary-privacy"><ShieldCheck :size="16" />ព័ត៌មាននេះបង្ហាញតែប្រវត្តិប្រាក់ខែរបស់គណនីអ្នកប៉ុណ្ណោះ។</p>
  </div>
</template>

<style scoped>
.salary-page { display:grid; gap:24px; min-width:0; }
.salary-heading { display:flex; align-items:center; gap:15px; }
.salary-heading h1 { font-size:clamp(23px,2.4vw,30px); font-weight:700; margin-bottom:8px; }
.salary-heading p,.salary-table-heading p { color:var(--muted); font-size:12px; line-height:1.8; }
.salary-overview { display:grid; grid-template-columns:1.2fr 1fr; align-items:center; gap:30px; padding:30px 32px; border:1px solid var(--line); border-radius:22px; background:linear-gradient(110deg,var(--soft),var(--surface) 65%); position:relative; overflow:hidden; }
.salary-overview::before { content:''; position:absolute; left:0; top:26px; bottom:26px; width:4px; border-radius:0 4px 4px 0; background:var(--blue); }
.salary-balance { min-width:0; }
.salary-overline { display:flex; align-items:center; gap:9px; font-size:13px; color:var(--muted); }
.salary-overline svg { color:var(--blue); }
.salary-currency { margin-left:4px; font-size:10px; font-weight:650; padding:4px 7px; border:1px solid var(--line); border-radius:6px; letter-spacing:.5px; }
.salary-balance>strong { display:block; max-width:360px; margin:14px 0 10px; font-size:clamp(30px,3.4vw,42px); line-height:1.25; font-weight:750; letter-spacing:-1px; font-variant-numeric:tabular-nums; color:var(--ink); overflow-wrap:anywhere; }
.salary-balance>p { color:var(--muted); font-size:11px; line-height:1.8; }
.salary-overview-details { display:grid; gap:22px; padding-left:30px; border-left:1px solid var(--line); }
.salary-fact { display:flex; align-items:center; gap:12px; min-width:0; }
.salary-fact-icon { display:grid; place-items:center; width:40px; height:40px; flex-shrink:0; border:1px solid var(--line); border-radius:12px; background:var(--surface); color:var(--blue); }
.salary-fact>div { display:grid; gap:7px; min-width:0; }
.salary-fact>div>span { color:var(--muted); font-size:11px; }
.salary-fact strong { font-size:15px; font-weight:650; line-height:1.6; }
.salary-fact small { color:var(--muted); font-size:11px; font-weight:400; }
.salary-history { min-width:0; border:1px solid var(--line); background:var(--surface); border-radius:20px; overflow:hidden; }
.salary-table-heading { display:flex; align-items:center; justify-content:space-between; gap:14px; padding:22px 24px; }
.salary-table-heading h2 { display:flex; align-items:center; gap:9px; font-size:17px; font-weight:650; margin-bottom:6px; }
.salary-table-heading h2 svg { color:var(--blue); }
.salary-count { padding:7px 11px; border-radius:9px; background:var(--soft); color:var(--blue); font-size:11px; white-space:nowrap; }
.salary-history :deep(.base-table-panel) { border:0; box-shadow:none; border-radius:0; }
.salary-history :deep(.base-table td) { padding:12px 24px; height:64px; }
.salary-date { display:flex; align-items:center; gap:10px; white-space:nowrap; font-size:12px; }
.salary-date-icon { display:grid; place-items:center; width:32px; height:32px; border-radius:9px; background:var(--soft); flex-shrink:0; }
.salary-latest { font-size:10px; color:var(--blue); background:var(--soft); border-radius:6px; padding:3px 7px; }
.salary-date svg { color:var(--blue); }
.salary-amount { color:var(--ink); font-size:14px; font-weight:650; font-variant-numeric:tabular-nums; white-space:nowrap; }
.salary-description { display:block; min-width:160px; max-width:560px; overflow-wrap:anywhere; font-size:12px; line-height:1.8; }
.salary-privacy { display:flex; align-items:center; justify-content:center; gap:8px; color:var(--muted); font-size:11px; line-height:1.8; }
.salary-privacy svg { flex-shrink:0; }
@media(max-width:1000px) { .salary-overview { gap:22px; padding:26px; } .salary-overview-details { padding-left:22px; } }
@media(max-width:600px) { .salary-overview { grid-template-columns:1fr; gap:22px; padding:24px; } .salary-overview-details { border-left:0; border-top:1px solid var(--line); padding:20px 0 0; gap:18px; } .salary-overview::before { top:24px; bottom:auto; height:100px; } .salary-page { gap:18px; } .salary-heading { align-items:flex-start; } .salary-table-heading { padding:18px; } .salary-privacy { justify-content:flex-start; } }
</style>
