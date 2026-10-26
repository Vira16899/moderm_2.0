<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import { RouterLink } from 'vue-router';
import DashboardMetric from '@/components/common/DashboardMetric.vue';
import BaseSkeleton from '@/components/base/BaseSkeleton.vue';
import BaseButton from '@/components/base/BaseButton.vue';
import BaseTable from '@/components/base/BaseTable.vue';
import { employeeError } from '@/utils/employeeMessages';
import { employeeApi } from '@/api/employeeApi';
import { apiRequest } from '@/api/client';
import { API_ENDPOINTS } from '@/api/endpoints';
import { attendanceHistory, leaveHistory, localToday, money, salaryHistory, statusLabels, currentProfileSalary } from '@/api/employeeData';
import { attendanceSlots, attendanceTime } from '@/api/attendancePresentation';
import { employeeAttendanceTrend } from '@/api/employeeInsights';
import { CalendarDays, Clock3, Wallet, ArrowUpRight, ClipboardList, ChartColumnIncreasing, ScanLine, CheckCircle2 } from 'lucide-vue-next';
defineOptions({ inheritAttrs:false });
const props = defineProps({ currentUser: { type:Object, default:() => ({}) } });
const leaves = ref([]), salaries = ref([]), attendance = ref([]);
const profileSalary = ref(null);
const salaryBalance = computed(() => profileSalary.value ?? salaries.value[0]?.salary);
const loading = reactive({ leaves:true, salary:true, attendance:true });
const errors = reactive({ leaves:'', salary:'', attendance:'' });
const period = ref(6);
const todayDate = localToday();
const today = computed(() => attendance.value.find(row => row.date === todayDate));
const slots = computed(() => attendanceSlots(today.value));
const recorded = computed(() => slots.value.filter(slot => slot.value).length);
const pending = computed(() => leaves.value.filter(row => row.status === 'pending').length);
const trend = computed(() => employeeAttendanceTrend(attendance.value, todayDate, period.value));
const maxCount = computed(() => Math.max(1, ...trend.value.map(month => month.count)));
const monthly = computed(() => trend.value.at(-1)?.count ?? 0);
const number = value => new Intl.NumberFormat('km-KH').format(value);
const dateLabel = value => {
  const date = String(value ?? '').slice(0,10);
  return /^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isFinite(Date.parse(date)) ? new Intl.DateTimeFormat('km-KH', {timeZone:'UTC',day:'numeric',month:'short',year:'numeric'}).format(new Date(date + 'T12:00:00Z')) : '—';
};
const monthLabel = value => new Intl.DateTimeFormat('km-KH', {timeZone:'UTC',month:'short',year:'2-digit'}).format(new Date(value + '-01T12:00:00Z'));
const sources = {
  leaves:{ fetch:employeeApi.getLeaveHistory, parse:leaveHistory, state:leaves, label:'សំណើសុំច្បាប់' },
  salary:{ fetch:employeeApi.getSalaryHistory, parse:salaryHistory, state:salaries, label:'ប្រាក់ខែ' },
  attendance:{ fetch:employeeApi.getAttendance, parse:attendanceHistory, state:attendance, label:'វត្តមាន' },
};
let disposed = false;
const inFlight = new Set();
onBeforeUnmount(() => { disposed = true; });
async function loadSource(key) {
  if (inFlight.has(key)) return;
  inFlight.add(key); loading[key] = true; errors[key] = '';
  const source = sources[key];
  try {
    let data;
    if (key === 'salary') {
      const [history, profile] = await Promise.allSettled([source.fetch(), apiRequest(API_ENDPOINTS.profile.getMe)]);
      if (disposed) return;
      profileSalary.value = profile.status === 'fulfilled' ? currentProfileSalary(profile.value) : null;
      if (history.status === 'rejected' && profileSalary.value == null) throw history.reason;
      data = history.status === 'fulfilled' ? source.parse(history.value) : [];
    } else {
      data = source.parse(await source.fetch());
    }
    if (!disposed) source.state.value = data;
  } catch (cause) { if (!disposed) errors[key] = employeeError(cause, `មិនអាចទាញយកព័ត៌មាន${source.label}បានទេ។ សូមព្យាយាមម្ដងទៀត។`); }
  finally { inFlight.delete(key); if (!disposed) loading[key] = false; }
}
onMounted(() => { for (const key of Object.keys(sources)) loadSource(key); });
const columns = [{key:'reason',label:'សំណើសុំច្បាប់'},{key:'startDate',label:'រយៈពេល'},{key:'status',label:'ស្ថានភាព'}];
</script>

<template>
  <div class="dashboard role-dashboard employee-home">
    <header class="workspace-page-header page-heading"><div><h1>ផ្ទាំងគ្រប់គ្រងផ្ទាល់ខ្លួន</h1><p>សូមស្វាគមន៍ {{ props.currentUser.nameKh || props.currentUser.nameEn || 'បុគ្គលិក' }} · ព័ត៌មានការងារសម្រាប់អ្នក</p></div><span class="date-badge"><CalendarDays :size="16" />{{ dateLabel(todayDate) }}</span></header>
    <div class="metrics-grid">
      <DashboardMetric title="ថ្ងៃមានកំណត់ត្រាក្នុងខែនេះ" :value="errors.attendance ? '—' : monthly" note="រាប់ថ្ងៃដែលមានកំណត់ត្រា មិនរាប់ស្ទួន" :icon="CalendarDays" color="blue" :loading="loading.attendance" />
      <DashboardMetric title="ប្រាក់ខែចុងក្រោយ" :value="errors.salary ? '—' : money(salaryBalance)" :note="profileSalary != null ? 'តាមព័ត៌មានគណនីបច្ចុប្បន្នរបស់អ្នក' : salaries.length && !errors.salary ? dateLabel(salaries[0].date) : 'មិនទាន់មានទិន្នន័យ'" :icon="Wallet" color="green" :loading="loading.salary" />
      <DashboardMetric title="សំណើកំពុងរង់ចាំ" :value="errors.leaves ? '—' : pending" note="រង់ចាំការអនុម័ត" :icon="Clock3" color="amber" :loading="loading.leaves" />
      <DashboardMetric title="សំណើសរុប" :value="errors.leaves ? '—' : leaves.length" note="កំណត់ត្រាសំណើសុំច្បាប់របស់ខ្ញុំ" :icon="ClipboardList" color="violet" :loading="loading.leaves" />
    </div>
    <div v-if="errors.salary" class="eh-error" role="alert"><p>{{ errors.salary }}</p><BaseButton variant="outline" size="sm" @click="loadSource('salary')">ព្យាយាមម្ដងទៀត</BaseButton></div>
    <div class="eh-main-grid">
      <section class="dashboard-panel eh-trend" :aria-busy="loading.attendance" aria-labelledby="employee-trend-title">
        <div class="eh-panel-heading"><div><h2 id="employee-trend-title"><ChartColumnIncreasing :size="20" />និន្នាការកំណត់ត្រាវត្តមាន</h2><p>ចំនួនថ្ងៃដែលមានកំណត់ត្រា តាមខែ</p></div><select v-model.number="period" aria-label="រយៈពេលក្រាហ្វវត្តមាន" :disabled="loading.attendance || !!errors.attendance"><option :value="6">៦ ខែ</option><option :value="12">១២ ខែ</option></select></div>
        <BaseSkeleton v-if="loading.attendance" class="eh-chart-loading" :lines="5" label="កំពុងទាញយកក្រាហ្វវត្តមាន…" />
        <div v-else-if="errors.attendance" class="eh-state" role="alert"><p>{{ errors.attendance }}</p><BaseButton variant="outline" @click="loadSource('attendance')">ព្យាយាមម្ដងទៀត</BaseButton></div>
        <template v-else><div class="eh-chart" :class="{ 'eh-chart-dense': period === 12 }" :style="{'--months':period}" role="img" :aria-label="trend.map(month => monthLabel(month.key) + ': ' + number(month.count) + ' ថ្ងៃ').join(', ')"><div v-for="month in trend" :key="month.key" class="eh-column"><div class="eh-track"><span class="eh-bar" :style="{height:month.count / maxCount * 100 + '%'}"><strong>{{ number(month.count) }}</strong></span></div><span class="eh-month">{{ monthLabel(month.key) }}</span></div></div><p class="eh-source">ផ្អែកលើប្រវត្តិវត្តមានដែលប្រព័ន្ធបានផ្ដល់។ មិនរាប់ជាអត្រាវត្តមាន ឬថ្ងៃធ្វើការសរុបទេ។</p></template>
      </section>
      <section class="dashboard-panel eh-today" :aria-busy="loading.attendance" aria-labelledby="employee-today-title"><div class="eh-panel-heading"><div><h2 id="employee-today-title"><ScanLine :size="20" />វត្តមានថ្ងៃនេះ</h2><p>{{ dateLabel(todayDate) }}</p></div><span v-if="!loading.attendance && !errors.attendance" class="eh-count">{{ number(recorded) }}/{{ number(slots.length) }}</span></div>
        <BaseSkeleton v-if="loading.attendance" :lines="3" label="កំពុងទាញយកម៉ោងវត្តមាន…" /><p v-else-if="errors.attendance" class="eh-source">មិនទាន់អាចបង្ហាញម៉ោងបានទេ។</p><div v-else class="eh-slots"><div v-for="slot in slots" :key="slot.key" :class="{ 'slot-complete': slot.value }"><span><CheckCircle2 v-if="slot.value" :size="17" /><Clock3 v-else :size="17" />{{ slot.label }}</span><strong :class="{recorded:slot.value}">{{ slot.value ? attendanceTime(slot.value) : 'មិនទាន់កត់ត្រា' }}</strong></div></div>
        <RouterLink class="eh-scan-link" to="/attendance"><ScanLine :size="18" />ស្កេន QR វត្តមាន<ArrowUpRight :size="16" /></RouterLink>
      </section>
    </div>
    <div class="eh-bottom-grid">
      <section class="eh-recent" aria-labelledby="employee-recent-title"><div class="eh-panel-heading"><div><h2 id="employee-recent-title"><ClipboardList :size="19" />សំណើសុំច្បាប់ថ្មីៗ</h2><p>តាមដានការអនុម័តសំណើរបស់អ្នក</p></div><RouterLink class="eh-text-link" to="/employee/leave-request">មើលទាំងអស់<ArrowUpRight :size="15" /></RouterLink></div><BaseTable :columns="columns" :rows="leaves.slice(0,5)" :loading="loading.leaves" :error="errors.leaves" caption="សំណើសុំច្បាប់ថ្មីៗ" empty-text="មិនទាន់មានសំណើសុំច្បាប់ទេ។" @retry="loadSource('leaves')"><template #cell-reason="{value}"><span class="eh-reason">{{ value || 'សំណើសុំច្បាប់' }}</span></template><template #cell-startDate="{row}"><span class="eh-date-range">{{ dateLabel(row.startDate) }} → {{ dateLabel(row.endDate) }}</span></template><template #cell-status="{value}"><span class="ess-status" :class="value">{{ statusLabels[value] || '—' }}</span></template></BaseTable></section>
      <section class="dashboard-panel eh-shortcuts"><h2>សេវាកម្មរបស់ខ្ញុំ</h2><RouterLink to="/employee/leave-request"><span class="eh-shortcut-icon"><CalendarDays :size="20" /></span><span><strong>ស្នើសុំច្បាប់ឈប់សម្រាក</strong><small>ដាក់សំណើ និងមើលប្រវត្តិ</small></span><ArrowUpRight :size="17" /></RouterLink><RouterLink to="/attendance"><span class="eh-shortcut-icon"><ScanLine :size="20" /></span><span><strong>វត្តមានរបស់ខ្ញុំ</strong><small>កត់ត្រាម៉ោងចូល និងចេញ</small></span><ArrowUpRight :size="17" /></RouterLink><RouterLink to="/employee/salary"><span class="eh-shortcut-icon"><Wallet :size="20" /></span><span><strong>ប្រវត្តិប្រាក់ខែ</strong><small>ព័ត៌មានប្រាក់ខែចុងក្រោយ</small></span><ArrowUpRight :size="17" /></RouterLink></section>
    </div>
  </div>
</template>

<style scoped>
.employee-home { min-width:0; }
.eh-main-grid { display:grid; grid-template-columns:minmax(0,1.6fr) minmax(300px,1fr); gap:22px; }
.eh-bottom-grid { display:grid; grid-template-columns:minmax(0,1.7fr) minmax(270px,1fr); gap:22px; }
.dashboard-panel { min-width:0; }
.eh-panel-heading { display:flex; align-items:flex-start; justify-content:space-between; gap:15px; margin-bottom:20px; }
h2 { display:flex; align-items:center; gap:8px; font-size:17px; font-weight:650; line-height:1.7; }
h2 svg { color:var(--blue); flex-shrink:0; }
.eh-panel-heading p,.eh-source { color:var(--muted); font-size:11px; line-height:1.9; margin-top:5px; }
select { min-height:42px; border:1px solid var(--line); border-radius:10px; background:var(--surface); color:var(--ink); padding:8px 12px; font-size:12px; }
.eh-chart-loading { min-height:240px; }
.eh-chart { display:grid; grid-template-columns:repeat(var(--months),minmax(0,1fr)); gap:10px; padding-top:28px; background:repeating-linear-gradient(to top,transparent 0,transparent 48px,var(--line) 49px,transparent 50px); }
.eh-column { display:flex; flex-direction:column; align-items:center; min-width:0; }
.eh-track { display:flex; align-items:flex-end; width:100%; max-width:42px; height:180px; }
.eh-bar { display:block; position:relative; width:100%; border-radius:7px 7px 2px 2px; background:linear-gradient(to top,#008c9b,#53c5ca); transition:height .35s; }
.eh-bar strong { position:absolute; bottom:100%; width:100%; text-align:center; font-size:11px; padding-bottom:6px; }
.eh-month { font-size:10px; color:var(--muted); padding:12px 0 8px; white-space:nowrap; }
.eh-chart-dense .eh-month { writing-mode:vertical-rl; min-height:64px; }
.eh-today { display:flex; flex-direction:column; }
.eh-count { background:var(--soft); color:var(--blue); padding:5px 9px; border-radius:8px; font-size:12px; }
.eh-slots { display:grid; flex:1; align-content:center; margin-bottom:18px; }
.eh-slots>div { display:flex; align-items:center; justify-content:space-between; gap:15px; padding:16px 0; border-bottom:1px solid var(--line); }
.eh-slots>div:last-child { border:0; }
.eh-slots span { display:flex; align-items:center; gap:8px; font-size:12px; color:var(--muted); }
.eh-slots svg { color:var(--blue); }
.eh-slots strong { font-size:11px; color:var(--muted); font-weight:500; }
.eh-slots strong.recorded { color:var(--blue); font-size:20px; font-weight:650; }
.eh-scan-link { display:flex; align-items:center; justify-content:center; gap:9px; min-height:46px; border-radius:12px; background:var(--action-fill,var(--blue)); color:white; font-size:12px; margin-top:auto; }
.eh-text-link { display:inline-flex; align-items:center; gap:5px; min-height:40px; color:var(--blue); font-size:12px; white-space:nowrap; }
.eh-recent { min-width:0; background:var(--surface); border:1px solid var(--line); border-radius:20px; overflow:hidden; }
.eh-recent>.eh-panel-heading { padding:22px 22px 0; }
.eh-recent :deep(.base-table-panel) { border:0; border-radius:0; box-shadow:none; }
.eh-recent :deep(.base-table td) { padding:12px 18px; height:60px; }
.eh-reason { display:block; max-width:230px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:12px; }
.eh-date-range { white-space:nowrap; font-size:11px; }
.eh-shortcuts>a { display:flex; align-items:center; gap:10px; padding:17px 0; border-bottom:1px solid var(--line); }
.eh-shortcuts>a:last-child { border:0; }
.eh-shortcuts>a>span:nth-child(2) { flex:1; min-width:0; }
.eh-shortcuts strong { display:block; font-size:12px; font-weight:600; }
.eh-shortcuts small { display:block; font-size:10px; line-height:1.8; margin-top:5px; color:var(--muted); }
.eh-shortcuts>a>svg { color:var(--muted); flex-shrink:0; }
.eh-shortcut-icon { display:grid; place-items:center; width:38px; height:38px; background:var(--soft); color:var(--blue); border-radius:11px; flex-shrink:0; }
.eh-error { display:flex; align-items:center; justify-content:space-between; gap:12px; padding:15px; border:1px solid var(--line); border-radius:12px; background:var(--surface); color:var(--muted); font-size:12px; }
.eh-state { display:grid; place-items:center; align-content:center; gap:16px; min-height:240px; text-align:center; color:var(--muted); font-size:12px; }
a:focus-visible,select:focus-visible { outline:2px solid var(--blue); outline-offset:3px; }
@media(max-width:1100px) { .eh-main-grid,.eh-bottom-grid { grid-template-columns:1fr; } }
@media(max-width:600px) { .eh-main-grid,.eh-bottom-grid { gap:16px; } .eh-panel-heading { flex-wrap:wrap; } .eh-chart { gap:5px; } .eh-month { writing-mode:vertical-rl; font-size:9px; } .eh-recent>.eh-panel-heading { padding:18px 18px 0; } .eh-error { align-items:flex-start; flex-direction:column; } }
@media(prefers-reduced-motion:reduce) { .eh-bar { transition:none; } }
</style>

<style scoped>
.eh-slots .slot-complete>span,.eh-slots .slot-complete>span svg,.eh-slots .slot-complete strong { color:#18744f !important; }
.dark .eh-slots .slot-complete>span,.dark .eh-slots .slot-complete>span svg,.dark .eh-slots .slot-complete strong { color:#83dfb4 !important; }
</style>
