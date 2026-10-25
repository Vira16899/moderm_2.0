<script setup>
import { computed, onMounted, ref } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import DashboardMetric from '@/components/common/DashboardMetric.vue';
import { notify } from '@/stores/toasts';
import { employeeError } from '@/utils/employeeMessages';
import { employeeApi } from '@/api/employeeApi';
import { attendanceHistory, leaveHistory, leaveTypes, localToday, money, salaryHistory, statusLabels } from '@/api/employeeData';
import { CalendarDays, Clock, Wallet, ArrowUpRight, ClipboardList } from 'lucide-vue-next';
defineOptions({ inheritAttrs: false });
const props = defineProps({ currentUser: { type: Object, default: () => ({}) } });
const router = useRouter();
const navigate = path => router.push(path);
const leaves = ref(null);
const salaries = ref(null);
const attendance = ref(null);
const loading = ref(false);
const today = computed(() => attendance.value?.find(row => row.date === localToday()));
const pending = computed(() => leaves.value?.filter(row => row.status === 'pending').length);
const latest = computed(() => salaries.value?.[0]);
async function load() {
  if (loading.value) return;
  loading.value = true;
  const tasks = [
    { name: 'សំណើសុំច្បាប់', fetch: employeeApi.getLeaveHistory, parse: leaveHistory, state: leaves },
    { name: 'ប្រាក់បៀវត្ស', fetch: employeeApi.getSalaryHistory, parse: salaryHistory, state: salaries },
    { name: 'វត្តមាន', fetch: employeeApi.getAttendance, parse: attendanceHistory, state: attendance },
  ];
  const results = await Promise.allSettled(tasks.map(task => task.fetch()));
  results.forEach((result, index) => {
    const task = tasks[index];
    if (result.status === 'fulfilled') task.state.value = task.parse(result.value);
    else { task.state.value = null; notify(employeeError(result.reason, `មិនអាចទាញយកព័ត៌មាន${task.name}បានទេ។ សូមព្យាយាមម្ដងទៀត។`), 'error'); }
  });
  loading.value = false;
}
onMounted(load);
</script>
<template>
  <div class="dashboard role-dashboard employee-dashboard">
    <header class="page-heading">
      <div><h1>ផ្ទាំងគ្រប់គ្រងផ្ទាល់ខ្លួន</h1><p>សូមស្វាគមន៍ {{ props.currentUser.nameKh || props.currentUser.nameEn || 'បុគ្គលិក' }} · {{ props.currentUser.positionKh || 'ព័ត៌មានការងាររបស់ខ្ញុំ' }}</p></div>
      <div class="ess-actions"><span class="date-badge"><CalendarDays :size="16" /> {{ localToday() }}</span></div>
    </header>
    <p v-if="loading" class="ess-muted" role="status">កំពុងទាញយកព័ត៌មានផ្ទាល់ខ្លួន…</p>
    <div class="metrics-grid">
      <DashboardMetric title="វត្តមានថ្ងៃនេះ" :value="attendance === null ? '—' : today?.checkInTime ? 'មានវត្តមាន' : 'មិនទាន់ស្កេនចូល'" :note="`ចូល៖ ${today?.checkInTime || '—'} · ចេញ៖ ${today?.checkOutTime || '—'}`" :icon="Clock" color="blue" text-value :action="() => navigate('/attendance')" />
      <DashboardMetric title="ប្រាក់បៀវត្សចុងក្រោយ" :value="money(latest?.salary)" note="មើលប្រវត្តិប្រាក់បៀវត្សរបស់ខ្ញុំ" :icon="Wallet" color="green" :action="() => navigate('/employee/salary')" />
      <DashboardMetric title="សំណើសុំច្បាប់រង់ចាំ" :value="pending ?? '—'" note="រង់ចាំការអនុម័ត" :icon="CalendarDays" color="amber" :action="() => navigate('/employee/leave-request')" />
      <DashboardMetric title="សំណើសុំច្បាប់សរុប" :value="leaves?.length ?? '—'" note="មើលប្រវត្តិសំណើសុំច្បាប់" :icon="ClipboardList" color="violet" :action="() => navigate('/employee/leave-history')" />
    </div>
    <div class="employee-dashboard-columns">
      <section class="dashboard-panel employee-recent-panel">
        <div class="panel-heading"><div><h2>សំណើសុំច្បាប់ថ្មីៗ</h2><p>តាមដានស្ថានភាព និងកាលបរិច្ឆេទសុំច្បាប់</p></div><RouterLink class="ess-link" to="/employee/leave-history">មើលទាំងអស់</RouterLink></div>
        <div v-if="leaves?.length" class="ess-table-wrap"><table class="ess-table"><thead><tr><th>ប្រភេទច្បាប់</th><th>កាលបរិច្ឆេទ</th><th>ស្ថានភាព</th></tr></thead><tbody><tr v-for="(row, index) in leaves.slice(0, 5)" :key="row.id ?? index"><td>{{ leaveTypes.find(type => type.value === row.leaveType)?.label || row.leaveType }}</td><td>{{ row.startDate }} → {{ row.endDate }}</td><td><span class="ess-status" :class="row.status">{{ statusLabels[row.status] || row.status || '—' }}</span></td></tr></tbody></table></div>
        <p v-else class="ess-empty">{{ leaves === null ? 'មិនទាន់មានទិន្នន័យ។' : 'មិនទាន់មានសំណើសុំច្បាប់ទេ។' }}</p>
      </section>
      <section class="dashboard-panel employee-shortcuts">
        <div class="panel-heading"><div><h2>សេវាកម្មបុគ្គលិក</h2><p>ចូលប្រើសេវាកម្មរបស់អ្នកបានរហ័ស</p></div></div>
        <RouterLink class="employee-shortcut" to="/employee/leave-request"><span class="employee-shortcut-icon amber"><CalendarDays :size="21" /></span><span><strong>ស្នើសុំច្បាប់ឈប់សម្រាក</strong><small>ដាក់សំណើ និងពិនិត្យប្រវត្តិ</small></span><ArrowUpRight :size="18" /></RouterLink>
        <RouterLink class="employee-shortcut" to="/attendance"><span class="employee-shortcut-icon blue"><Clock :size="21" /></span><span><strong>វត្តមានរបស់ខ្ញុំ</strong><small>ស្កេនចូល ចេញ និងមើលវត្តមាន</small></span><ArrowUpRight :size="18" /></RouterLink>
        <RouterLink class="employee-shortcut" to="/employee/salary"><span class="employee-shortcut-icon green"><Wallet :size="21" /></span><span><strong>ប្រវត្តិប្រាក់បៀវត្ស</strong><small>មើលព័ត៌មានប្រាក់បៀវត្សរបស់អ្នក</small></span><ArrowUpRight :size="18" /></RouterLink>
      </section>
    </div>
  </div>
</template>
