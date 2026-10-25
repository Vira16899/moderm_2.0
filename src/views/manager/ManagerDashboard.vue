<script setup>
import { computed, ref } from 'vue';
import { Users, UserCheck, UserX, TrendingUp, ChartColumnIncreasing, ArrowUpRight, Check } from 'lucide-vue-next';
import DashboardMetric from '../../components/common/DashboardMetric.vue';
import BaseSkeleton from '../../components/base/BaseSkeleton.vue';
import UserAvatar from '../../components/common/UserAvatar.vue';
import { localToday } from '../../api/employeeData.js';
import { managerInsights } from '../../api/managerInsights.js';
const props = defineProps({ currentUser: Object, dashboard: Object, employees: { type: Array, default: () => [] }, loading: Boolean, error: String, onRetry: Function, onNavigateEmployees: Function, onNavigateLeaves: Function });
const today = localToday(), monthCount = ref(6), selectedMonth = ref(''), selectedStatus = ref('');
const unavailable = computed(() => props.loading || Boolean(props.error));
const insights = computed(() => managerInsights(props.employees, today, monthCount.value));
const maxHires = computed(() => Math.max(1, ...insights.value.months.map(month => month.count)));
const selected = computed(() => insights.value.months.find(month => month.key === selectedMonth.value));
const monthsKh = ['មករា','កុម្ភៈ','មីនា','មេសា','ឧសភា','មិថុនា','កក្កដា','សីហា','កញ្ញា','តុលា','វិច្ឆិកា','ធ្នូ'];
const monthLabel = key => `${monthsKh[Number(key.slice(5)) - 1]} ${key.slice(0, 4)}`;
const number = value => new Intl.NumberFormat('km-KH').format(value);
const statuses = computed(() => [
  { key: 'active', label: 'គណនីសកម្ម', color: '#1ca5a3', count: insights.value.status.active },
  { key: 'inactive', label: 'គណនីអសកម្ម', color: '#e9b746', count: insights.value.status.inactive },
  { key: 'unknown', label: 'មិនបានបញ្ជាក់', color: 'var(--muted)', count: insights.value.status.unknown },
].filter(item => item.key !== 'unknown' || item.count));
const ring = computed(() => {
  const total = insights.value.team.length;
  if (!total || unavailable.value) return 'var(--line)';
  let start = 0;
  return `conic-gradient(${statuses.value.map(item => { const end = start + item.count / total * 100; const part = `${item.color} ${start}% ${end}%`; start = end; return part; }).join(',')})`;
});
const members = computed(() => (selected.value?.members ?? insights.value.team).filter(employee => {
  const status = String(employee.status ?? '').toLowerCase();
  const key = ['active', 'inactive'].includes(status) ? status : 'unknown';
  return !selectedStatus.value || key === selectedStatus.value;
}));
const metrics = computed(() => [
  { title: 'បុគ្គលិកក្នុងផ្នែក', value: insights.value.team.length, icon: Users, color: 'blue', note: 'ចំនួនបុគ្គលិកបច្ចុប្បន្ន ដោយមិនរាប់ស្ទួន' },
  { title: 'គណនីសកម្ម', value: insights.value.status.active, icon: UserCheck, color: 'green', note: 'បុគ្គលិកដែលមានគណនីសកម្មក្នុងផ្នែក' },
  { title: 'គណនីអសកម្ម', value: insights.value.status.inactive, icon: UserX, color: 'amber', note: 'បុគ្គលិកដែលមានគណនីអសកម្មក្នុងផ្នែក' },
  { title: 'បុគ្គលិកចូលថ្មី', value: selected.value?.count ?? insights.value.hires, icon: TrendingUp, color: 'violet', note: selected.value ? monthLabel(selected.value.key) : `${number(monthCount.value)} ខែចុងក្រោយ · ផ្លាស់ប្ដូរតាមរយៈពេលក្រាហ្វ` },
]);
function changePeriod() { selectedMonth.value = ''; }
function toggleMonth(key) { selectedMonth.value = selectedMonth.value === key ? '' : key; }
</script>

<template>
  <div class="dashboard role-dashboard manager-overview">
    <header class="mi-heading"><div><h1>ផ្ទាំងគ្រប់គ្រងផ្នែក</h1><p>សូមស្វាគមន៍ {{ currentUser?.nameKh }} · ព័ត៌មានសំខាន់ៗសម្រាប់រៀបចំក្រុមការងាររបស់អ្នក</p></div><button class="mi-button mi-primary" @click="onNavigateEmployees?.()"><Users :size="17" />បុគ្គលិកក្នុងផ្នែក<ArrowUpRight :size="16" /></button></header>
    <div v-if="error" role="alert" class="form-error">{{ error }} <button class="mi-button" @click="onRetry?.()">ព្យាយាមម្ដងទៀត</button></div>
    <div class="metrics-grid"><DashboardMetric v-for="metric in metrics" :key="metric.title" :loading="loading" :title="metric.title" :value="unavailable ? '—' : metric.value ?? '—'" :icon="metric.icon" :color="metric.color" :note="unavailable || metric.value == null ? 'មិនមានទិន្នន័យ' : metric.note" /></div>
    <div v-if="loading" class="mi-loading" aria-busy="true">
      <div class="mi-charts"><BaseSkeleton class="mi-chart-loading" :lines="6" label="កំពុងទាញយកក្រាហ្វបុគ្គលិក…" /><BaseSkeleton class="mi-chart-loading" :lines="6" label="កំពុងទាញយកស្ថានភាពគណនី…" /></div>
      <BaseSkeleton :lines="3" label="កំពុងទាញយកព័ត៌មានក្រុម…" />
    </div>
    <template v-else-if="!error">
      <div class="mi-charts">
        <section class="dashboard-panel mi-trend" aria-labelledby="manager-trend-title"><div class="mi-panel-heading"><div><h2 id="manager-trend-title"><TrendingUp :size="20" />និន្នាការចូលបម្រើការងារ</h2><p>ចំនួនបុគ្គលិកបច្ចុប្បន្ន តាមខែចូលធ្វើការ</p></div><select v-model.number="monthCount" aria-label="រយៈពេលក្រាហ្វ" @change="changePeriod"><option :value="6">៦ ខែ</option><option :value="12">១២ ខែ</option></select></div>
          <div class="mi-trend-total" aria-live="polite"><strong>{{ number(selected ? selected.count : insights.hires) }}</strong><div><span>{{ selected ? monthLabel(selected.key) : 'បុគ្គលិកចូលថ្មីក្នុងរយៈពេលនេះ' }}</span><small>ចុចខែនីមួយៗ ដើម្បីមើលបុគ្គលិកខាងក្រោម</small></div><button v-if="selected" class="mi-clear" @click="selectedMonth = ''">សម្អាត</button></div>
          <div class="mi-chart" :style="{ '--months': monthCount }" role="group" aria-label="ចំនួនបុគ្គលិកតាមខែ"><button v-for="month in insights.months" :key="month.key" :aria-label="`${monthLabel(month.key)}: ${month.count} បុគ្គលិក`" :aria-pressed="selectedMonth === month.key" :class="{ selected: selectedMonth === month.key }" @click="toggleMonth(month.key)"><span class="mi-bar-track"><span class="mi-bar" :style="{ height: `${month.count / maxHires * 100}%` }"><span>{{ number(month.count) }}</span></span></span><span class="mi-month-label">{{ monthsKh[Number(month.key.slice(5)) - 1] }}</span></button></div>
          <p v-if="!insights.hires" class="mi-source">មិនមានបុគ្គលិកចូលថ្មីក្នុងរយៈពេលនេះទេ។</p><p class="mi-source">ផ្អែកលើថ្ងៃចូលធ្វើការរបស់បុគ្គលិកដែលមានក្នុងផ្នែក។</p>
        </section>
        <section class="dashboard-panel" aria-labelledby="manager-status-title"><div class="mi-panel-heading"><div><h2 id="manager-status-title"><ChartColumnIncreasing :size="20" />ស្ថានភាពគណនីបុគ្គលិក</h2><p>សមាមាត្រគណនីក្នុងក្រុមរបស់អ្នក</p></div></div><div class="mi-donut-wrap"><div class="mi-donut" :style="{ background: ring }" role="img" :aria-label="statuses.map(item => `${item.label}: ${item.count}`).join(', ')"><div><strong>{{ number(insights.team.length) }}</strong><span>បុគ្គលិកសរុប</span></div></div></div><div class="mi-status-list"><button v-for="status in statuses" :key="status.key" :aria-pressed="selectedStatus === status.key" :class="{ selected: selectedStatus === status.key }" @click="selectedStatus = selectedStatus === status.key ? '' : status.key"><i :style="{ background: status.color }"></i><span>{{ status.label }}</span><strong>{{ number(status.count) }}</strong><Check v-if="selectedStatus === status.key" :size="15" /></button></div></section>
      </div>
      <section class="dashboard-panel"><div class="mi-panel-heading"><div><h2><Users :size="19" />បុគ្គលិកក្នុងទិដ្ឋភាពនេះ<span class="mi-count">{{ number(members.length) }}</span></h2><p>{{ selected ? monthLabel(selected.key) : 'បុគ្គលិកទាំងអស់ក្នុងផ្នែក' }}{{ selectedStatus ? ' · ' + statuses.find(item => item.key === selectedStatus)?.label : '' }}</p></div><button v-if="selectedMonth || selectedStatus" class="mi-clear" @click="selectedMonth = ''; selectedStatus = ''">សម្អាតតម្រង</button></div><div v-if="members.length" class="mi-members"><div v-for="employee in members.slice(0, 6)" :key="employee.id" class="mi-member"><UserAvatar :src="employee.avatar" :name="employee.nameEn || employee.nameKh" :size="36" /><div><strong>{{ employee.nameKh || employee.nameEn || 'បុគ្គលិក' }}</strong><small>{{ employee.positionKh || employee.positionEn || 'មិនទាន់មានមុខតំណែង' }}</small></div></div></div><p v-else class="mi-empty">មិនមានបុគ្គលិកត្រូវនឹងតម្រងនេះទេ។</p><p v-if="members.length > 6" class="mi-source">បង្ហាញ ៦ នៃ {{ number(members.length) }} បុគ្គលិក។</p></section>
    </template>
  </div>
</template>

<style scoped>
.mi-loading { display:grid; gap:22px; }
.mi-chart-loading { min-height:430px; }
.manager-overview { display:grid; gap:22px; min-width:0; }
.mi-heading { display:flex; align-items:center; justify-content:space-between; gap:20px; }
.mi-heading h1 { font-size:clamp(24px,2.3vw,30px); font-weight:700; margin:5px 0 8px; }
.mi-heading p,.mi-panel-heading p { color:var(--muted); font-size:12px; line-height:1.8; margin-top:6px; }
.mi-button,.mi-clear { display:inline-flex; align-items:center; justify-content:center; gap:9px; min-height:44px; padding:9px 14px; border:1px solid var(--line); border-radius:12px; color:var(--blue); font-size:12px; cursor:pointer; }
.mi-primary { background:var(--action-fill,var(--blue)); color:white; border-color:transparent; flex-shrink:0; }
.mi-charts { display:grid; grid-template-columns:minmax(0,1.65fr) minmax(280px,1fr); gap:22px; align-items:stretch; }
.dashboard-panel { min-width:0; }
.mi-panel-heading { display:flex; align-items:flex-start; justify-content:space-between; gap:14px; }
h2 { display:flex; align-items:center; flex-wrap:wrap; gap:8px; font-size:16px; font-weight:650; }
h2 svg { color:var(--blue); flex-shrink:0; }
select { min-height:42px; border:1px solid var(--line); border-radius:10px; padding:8px 12px; color:var(--ink); background:var(--surface); font-size:12px; }
.mi-trend-total { display:flex; align-items:center; gap:14px; margin:22px 0 10px; min-height:56px; }
.mi-trend-total>strong { font-size:34px; font-weight:750; color:var(--ink); }
.mi-trend-total>div { display:grid; gap:5px; }
.mi-trend-total span { font-size:12px; } .mi-trend-total small { color:var(--muted); font-size:10px; }
.mi-clear { margin-left:auto; padding:5px 10px; border:0; background:var(--soft); }
.mi-chart { display:grid; grid-template-columns:repeat(var(--months),minmax(0,1fr)); gap:10px; min-height:226px; padding-top:24px; background:repeating-linear-gradient(to top,transparent 0,transparent 48px,var(--line) 49px,transparent 50px); }
.mi-chart button { display:flex; flex-direction:column; justify-content:flex-end; align-items:center; min-width:0; padding:0 4px; cursor:pointer; border-radius:9px; }
.mi-chart button:hover,.mi-chart button.selected { background:color-mix(in srgb,var(--soft) 60%,transparent); }
.mi-bar-track { display:flex; align-items:flex-end; width:100%; max-width:48px; height:168px; }
.mi-bar { display:block; position:relative; width:100%; background:linear-gradient(to top,#008c9b,#53c5ca); border-radius:7px 7px 2px 2px; transition:height .25s; }
.mi-chart button.selected .mi-bar { background:var(--blue); }
.mi-bar>span { position:absolute; bottom:100%; left:0; width:100%; text-align:center; color:var(--ink); font-size:11px; padding-bottom:5px; }
.mi-month-label { display:block; min-height:38px; padding-top:12px; font-size:10px; color:var(--muted); white-space:nowrap; }
.mi-source { color:var(--muted); font-size:11px; line-height:1.8; margin-top:14px; }
.mi-donut-wrap { display:grid; place-items:center; padding:24px 0 16px; }
.mi-donut { display:grid; place-items:center; width:174px; height:174px; border-radius:50%; }
.mi-donut>div { display:grid; place-content:center; gap:5px; text-align:center; width:132px; height:132px; border-radius:50%; background:var(--surface); }
.mi-donut strong { font-size:30px; font-weight:700; } .mi-donut span { color:var(--muted); font-size:11px; }
.mi-status-list { display:grid; gap:4px; }
.mi-status-list button { display:flex; align-items:center; gap:9px; min-height:44px; padding:8px 10px; border:1px solid transparent; border-radius:10px; font-size:12px; cursor:pointer; }
.mi-status-list button.selected { background:var(--soft); border-color:var(--line); }
.mi-status-list i { width:8px; height:8px; border-radius:50%; } .mi-status-list strong { margin-left:auto; }
.mi-empty { color:var(--muted); font-size:12px; line-height:1.9; padding:24px 0 8px; }
.mi-members { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:16px; margin-top:22px; }
.mi-member { display:flex; align-items:center; gap:10px; padding:12px; border:1px solid var(--line); border-radius:12px; min-width:0; }
.mi-member>div { display:grid; gap:5px; min-width:0; } .mi-member strong,.mi-member small { overflow:hidden; white-space:nowrap; text-overflow:ellipsis; } .mi-member strong { font-size:12px; } .mi-member small { color:var(--muted); font-size:10px; }
.mi-count { padding:3px 8px; color:var(--blue); background:var(--soft); border-radius:7px; font-size:12px; }
button:focus-visible,select:focus-visible { outline:2px solid var(--blue); outline-offset:3px; }
@media(max-width:1100px) { .mi-members { grid-template-columns:repeat(2,minmax(0,1fr)); } }
@media(max-width:760px) { .mi-charts { grid-template-columns:1fr; } .mi-heading { align-items:flex-start; flex-direction:column; } .mi-chart { gap:3px; } .mi-chart button { padding:0 2px; } .mi-month-label { font-size:9px; writing-mode:vertical-rl; min-height:54px; } .mi-members { grid-template-columns:1fr; } .mi-panel-heading { flex-wrap:wrap; } }
@media(prefers-reduced-motion:reduce) { .mi-bar { transition:none; } }
</style>
