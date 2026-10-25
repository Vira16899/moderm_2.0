<script setup>
import { computed, ref } from 'vue';
import { Users, UserCheck, UserX, CalendarDays, ChevronLeft, ChevronRight, Gift, Clock3 } from 'lucide-vue-next';
import DashboardMetric from '../../components/common/DashboardMetric.vue';
import { localToday } from '../../api/employeeData.js';
import { calendarDays, shiftMonth, eventsOnDay } from '../../api/managerCalendar.js';
const props = defineProps({ currentUser: Object, dashboard: Object, employees: { type: Array, default: () => [] }, loading: Boolean, error: String, onRetry: Function, onNavigateEmployees: Function, onNavigateLeaves: Function });
const today = localToday();
const month = ref(today.slice(0, 7));
const selected = ref(today);
const dateLabel = day => new Intl.DateTimeFormat('km-KH', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${day}T00:00:00Z`));
const monthLabel = computed(() => new Intl.DateTimeFormat('km-KH', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${month.value}-01T00:00:00Z`)));
const unavailable = computed(() => props.loading || Boolean(props.error));
const events = day => unavailable.value ? [] : eventsOnDay(day, props.employees, props.dashboard?.leaveRequests ?? []);
const days = computed(() => calendarDays(month.value).map(day => ({ day, events: events(day), current: day.startsWith(month.value) })));
const agenda = computed(() => events(selected.value));
const pending = computed(() => unavailable.value ? null : props.dashboard?.pendingLeaves);
const metrics = computed(() => [
  { title: 'បុគ្គលិកសរុប', value: props.dashboard?.total, icon: Users, color: 'blue' },
  { title: 'មកធ្វើការ', value: props.dashboard?.present, icon: UserCheck, color: 'green' },
  { title: 'អវត្តមាន', value: props.dashboard?.absent, icon: UserX, color: 'amber' },
  { title: 'ច្បាប់រង់ចាំ', value: props.dashboard?.pending, icon: Clock3, color: 'violet' },
]);
function moveMonth(offset) { month.value = shiftMonth(month.value, offset); selected.value = `${month.value}-01`; }
function goToday() { month.value = today.slice(0, 7); selected.value = today; }
</script>

<template>
  <div class="dashboard role-dashboard manager-overview">
    <header class="page-heading"><div><h1>ផ្ទាំងគ្រប់គ្រងផ្នែក</h1><p>សូមស្វាគមន៍ {{ currentUser?.nameKh }} · តាមដានបុគ្គលិក និងរៀបចំការងារប្រចាំថ្ងៃ</p></div></header>
    <p v-if="error" role="alert" class="form-error">{{ error }}</p>
    <p v-if="loading" role="status" class="md-muted">កំពុងទាញយកព័ត៌មានផ្នែក…</p>
    <div class="metrics-grid"><DashboardMetric v-for="metric in metrics" :key="metric.title" :title="metric.title" :value="unavailable ? '—' : metric.value ?? '—'" :icon="metric.icon" :color="metric.color" :note="unavailable || metric.value == null ? 'មិនមានទិន្នន័យ' : 'ក្នុងផ្នែករបស់អ្នក'" /></div>
    <div class="md-columns">
      <section class="dashboard-panel md-calendar" :aria-busy="loading" aria-labelledby="manager-calendar-title">
        <div class="md-heading"><div><h2 id="manager-calendar-title"><CalendarDays :size="20" /> ប្រតិទិនក្រុមការងារ</h2><p class="md-muted">ខួបកំណើត ថ្ងៃចូលធ្វើការ និងសំណើសុំច្បាប់ដែលបានទទួល</p></div><button class="md-button" @click="goToday">ថ្ងៃនេះ</button></div>
        <div class="md-month"><button class="md-icon" aria-label="ខែមុន" @click="moveMonth(-1)"><ChevronLeft :size="20" /></button><h3 aria-live="polite">{{ monthLabel }}</h3><button class="md-icon" aria-label="ខែបន្ទាប់" @click="moveMonth(1)"><ChevronRight :size="20" /></button></div>
        <div class="md-week" aria-hidden="true"><span v-for="day in ['ចន្ទ','អង្គារ','ពុធ','ព្រហស្បតិ៍','សុក្រ','សៅរ៍','អាទិត្យ']" :key="day">{{ day }}</span></div>
        <div class="md-grid" role="group" aria-label="ជ្រើសរើសថ្ងៃ"><button v-for="cell in days" :key="cell.day" :aria-label="`${dateLabel(cell.day)} · ${cell.events.length} ព្រឹត្តិការណ៍`" :aria-pressed="selected === cell.day" :aria-current="cell.day === today ? 'date' : undefined" :class="{ outside: !cell.current, today: cell.day === today, selected: cell.day === selected }" @click="selected = cell.day"><span>{{ new Intl.NumberFormat('km-KH').format(Number(cell.day.slice(8))) }}</span><span class="md-dots" aria-hidden="true"><i v-for="kind in [...new Set(cell.events.map(event => event.kind))]" :key="kind" :class="kind"></i></span></button></div>
        <div class="md-legend"><span><i class="birthday"></i>ខួបកំណើត</span><span><i class="hire"></i>ចូលធ្វើការ</span><span><i class="approved"></i>បានអនុម័ត</span><span><i class="pending"></i>រង់ចាំ</span></div>
        <p v-if="!loading && !error && dashboard?.leaveRequests == null" class="md-muted md-source">ទិន្នន័យសុំច្បាប់របស់ក្រុមមិនទាន់មានពីប្រព័ន្ធ។ ប្រតិទិនបង្ហាញព័ត៌មានបុគ្គលិកដែលមាន។</p>
      </section>
      <div class="md-aside">
        <section class="dashboard-panel" aria-labelledby="manager-agenda-title"><div class="md-heading"><h2 id="manager-agenda-title"><Gift :size="20" /> កម្មវិធីប្រចាំថ្ងៃ</h2></div><p class="md-date">{{ dateLabel(selected) }}</p><ul v-if="agenda.length" class="md-events"><li v-for="event in agenda" :key="event.key"><i :class="event.kind"></i><div><strong>{{ event.title }}</strong><p>{{ event.detail }}</p></div></li></ul><p v-else class="md-empty">{{ unavailable ? 'មិនទាន់អាចបង្ហាញទិន្នន័យបានទេ។' : 'មិនមានព្រឹត្តិការណ៍ក្នុងទិន្នន័យសម្រាប់ថ្ងៃនេះទេ។' }}</p></section>
        <section class="dashboard-panel"><div class="md-heading"><h2><Clock3 :size="20" /> ច្បាប់ក្រុមកំពុងរង់ចាំ</h2><span class="md-count">{{ pending?.length ?? '—' }}</span></div><ul v-if="pending?.length" class="md-events"><li v-for="request in pending.slice(0, 3)" :key="request.id"><i class="pending"></i><div><strong>{{ request.userNameKh || request.employeeNameKh || request.khmer_name || 'បុគ្គលិក' }}</strong><p>{{ request.reason || '—' }}</p><small>{{ String(request.start_date || request.startDate || '').slice(0, 10) }} → {{ String(request.end_date || request.endDate || '').slice(0, 10) }}</small></div></li></ul><p v-else class="md-empty">{{ pending == null ? 'មិនមានទិន្នន័យសំណើពីប្រព័ន្ធ។' : 'មិនមានសំណើកំពុងរង់ចាំទេ។' }}</p></section>
        <nav class="md-quick" aria-label="សកម្មភាពរហ័ស"><button class="md-button" @click="onNavigateEmployees?.()"><Users :size="18" /> បុគ្គលិកក្នុងផ្នែក</button><button class="md-button" @click="onNavigateLeaves?.()"><CalendarDays :size="18" /> សំណើសុំច្បាប់របស់ខ្ញុំ</button></nav>
      </div>
    </div>
  </div>
</template>

<style scoped>
.manager-overview { display: grid; gap: 24px; }
.page-heading h1 { font-size: clamp(22px, 2vw, 30px); font-weight: 700; }
.page-heading p, .md-muted { color: var(--muted); font-size: 12px; line-height: 1.9; margin-top: 6px; }
.md-columns { display: grid; grid-template-columns: minmax(0, 1.5fr) minmax(280px, 1fr); gap: 24px; align-items: start; }
.md-aside { display: grid; gap: 20px; min-width: 0; }
.md-heading { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
h2 { display: flex; align-items: center; gap: 9px; font-size: 16px; font-weight: 650; }
h2 svg { color: var(--blue); flex-shrink: 0; }
.md-button, .md-icon { display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-height: 44px; padding: 9px 13px; border: 1px solid var(--line); border-radius: 12px; background: var(--surface); color: var(--blue); font-size: 12px; cursor: pointer; }
.md-button:hover, .md-icon:hover { background: var(--soft); }
button:focus-visible { outline: 2px solid var(--blue); outline-offset: 3px; }
.md-month { display: flex; align-items: center; justify-content: space-between; margin: 24px 0 16px; }
.md-month h3 { font-size: 17px; font-weight: 650; }
.md-icon { width: 44px; padding: 0; }
.md-week, .md-grid { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 5px; text-align: center; }
.md-week { color: var(--muted); font-size: 11px; margin-bottom: 10px; }
.md-grid button { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 58px; border-radius: 12px; border: 1px solid transparent; font-size: 14px; color: var(--ink); cursor: pointer; }
.md-grid button:hover { background: var(--soft); }
.md-grid .outside { opacity: .4; }
.md-grid .today { border-color: var(--blue); }
.md-grid .selected { background: var(--blue); color: white; opacity: 1; }
.md-grid .selected:hover { background: var(--blue); }
.md-dots { display: flex; gap: 3px; height: 6px; margin-top: 5px; }
i { display: inline-block; width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
i.birthday { background: #a779d0; } i.hire { background: #248fd1; } i.approved { background: #1ca5a3; } i.pending { background: #e9b746; }
.md-legend { display: flex; flex-wrap: wrap; gap: 14px; padding-top: 20px; border-top: 1px solid var(--line); margin-top: 16px; }
.md-legend span { display: flex; align-items: center; gap: 6px; color: var(--muted); font-size: 11px; }
.md-date { color: var(--blue); font-size: 12px; margin-top: 16px; }
.md-events { list-style: none; padding: 0; margin: 12px 0 0; }
.md-events li { display: flex; align-items: baseline; gap: 12px; padding: 15px 0; border-bottom: 1px solid var(--line); }
.md-events li:last-child { border: 0; padding-bottom: 0; }
.md-events strong { font-size: 13px; } .md-events p, .md-events small { color: var(--muted); font-size: 12px; line-height: 1.9; margin-top: 5px; overflow-wrap: anywhere; }
.md-empty { padding: 26px 0 10px; color: var(--muted); font-size: 12px; line-height: 1.9; }
.md-count { background: var(--soft); color: var(--blue); padding: 5px 10px; border-radius: 8px; }
.md-quick { display: flex; flex-wrap: wrap; gap: 10px; } .md-quick button { flex: 1; }
.md-source { margin-top: 14px; font-size: 11px; }
button:disabled { opacity: .5; cursor: wait; }
.spinning { animation: spin 1s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) { .spinning { animation: none; } }
@media (max-width: 1100px) { .md-columns { grid-template-columns: 1fr; } }
@media (max-width: 600px) { .md-grid button { min-height: 44px; border-radius: 8px; } .md-week { font-size: 9px; } .md-heading { flex-wrap: wrap; } .md-legend { gap: 10px; } }
</style>
