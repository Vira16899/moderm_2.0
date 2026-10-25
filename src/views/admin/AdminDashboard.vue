<script setup>
import { computed, ref, useId, watch } from 'vue';
import { Users, UserRound, Crown, Building2, CalendarDays, Plus, TrendingUp, UserPlus, ShieldCheck, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-vue-next';
import DashboardMetric from '../../components/common/DashboardMetric.vue';
import BaseButton from '../../components/base/BaseButton.vue';
import BaseSkeleton from '../../components/base/BaseSkeleton.vue';
import UserAvatar from '../../components/common/UserAvatar.vue';
import { formatKhmerDate } from '../../data/labels';
import { localToday } from '../../api/employeeData.js';
import { dashboardInsights } from '../../api/adminDashboard.js';
const props = defineProps({users:{type:Array,default:()=>[]},departments:{type:Array,default:()=>[]},loading:Boolean,error:String,onRetry:Function,onNavigateUsers:Function,onNavigateDepartments:Function});
const today = localToday(), monthCount = ref(6), selectedMonth = ref(-1), departmentLimit = ref(5), selectedRole = ref('');
const gradientId = useId();
const insights = computed(() => dashboardInsights(props.users,props.departments,today,monthCount.value));
const unavailable = computed(() => props.loading || !!props.error);
const metrics = computed(() => [
 {title:'អ្នកប្រើប្រាស់សរុប',value:unavailable.value?'—':props.users.length,note:unavailable.value?'កំពុងពិនិត្យទិន្នន័យ':`${insights.value.active} គណនីសកម្ម`,icon:Users,color:'blue'},
 {title:'បុគ្គលិក / កម្មករ',value:unavailable.value?'—':props.users.filter(u=>u.role==='EMPLOYEE').length,note:'បុគ្គលិកប្រតិបត្តិការ',icon:UserRound,color:'green'},
 {title:'អ្នកគ្រប់គ្រង',value:unavailable.value?'—':props.users.filter(u=>u.role==='MANAGER').length,note:'អ្នកគ្រប់គ្រងនាយកដ្ឋាន',icon:Crown,color:'amber'},
 {title:'នាយកដ្ឋាន',value:unavailable.value?'—':props.departments.length,note:'ផ្នែកប្រតិបត្តិការទាំងអស់',icon:Building2,color:'violet'},
]);
const maxMonth = computed(()=>Math.max(2,Math.ceil(Math.max(0,...insights.value.months.map(row=>row.count))/2)*2));
const points = computed(()=>insights.value.months.map((row,index)=>({...row,x:38+index*564/(monthCount.value-1),y:180-row.count/maxMonth.value*140})));
const line = computed(()=>points.value.map((point,index)=>`${index?'L':'M'} ${point.x} ${point.y}`).join(' '));
const area = computed(()=>`${line.value} L 602 180 L 38 180 Z`);
const highlighted = computed(()=>points.value[selectedMonth.value] || points.value[points.value.length-1]);
const hiresTotal = computed(()=>insights.value.months.reduce((sum,row)=>sum+row.count,0));
watch(monthCount,()=>{selectedMonth.value=-1;});
const monthsKh = ['មករា','កុម្ភៈ','មីនា','មេសា','ឧសភា','មិថុនា','កក្កដា','សីហា','កញ្ញា','តុលា','វិច្ឆិកា','ធ្នូ'];
function monthLabel(key,withYear=false){const [year,month]=key.split('-');return monthsKh[Number(month)-1]+(withYear?' '+year:'');}
const roles = computed(()=>[
 {id:'EMPLOYEE',name:'បុគ្គលិក',count:props.users.filter(user=>user.role==='EMPLOYEE').length,color:'var(--chart-blue, #248fd1)'},
 {id:'MANAGER',name:'អ្នកគ្រប់គ្រង',count:props.users.filter(user=>user.role==='MANAGER').length,color:'var(--chart-teal, #1ca5a3)'},
 {id:'ADMIN',name:'រដ្ឋបាល',count:props.users.filter(user=>user.role==='ADMIN').length,color:'var(--chart-amber, #e9b746)'},
]);
const donut = computed(()=>{if(!props.users.length)return 'var(--line)';let end=0;return `conic-gradient(${roles.value.map(role=>{const start=end;end+=role.count/props.users.length*100;return `${role.color} ${start}% ${end}%`;}).join(',')})`;});
const highlightedRole = computed(()=>roles.value.find(role=>role.id===selectedRole.value));
const departmentRows = computed(()=>insights.value.departmentRows.slice(0,departmentLimit.value));
const maxDepartment = computed(()=>Math.max(1,...insights.value.departmentRows.map(row=>row.count)));
const attention = computed(()=>[
 {label:'នាយកដ្ឋានមិនទាន់មានអ្នកគ្រប់គ្រង',count:insights.value.unmanaged,icon:Building2},
 {label:'បុគ្គលិកមិនទាន់មាននាយកដ្ឋាន',count:insights.value.unassigned,icon:UserRound},
 {label:'គណនីអសកម្ម',count:insights.value.inactive,icon:ShieldCheck},
]);
function hireDate(user){return String(user.joinedDate || user.hireDate || user.hire_date || '').slice(0,10);}
</script>
<template>
 <section class="dashboard admin-overview">
  <header class="workspace-page-header page-heading"><div><h1>ផ្ទាំងគ្រប់គ្រងទូទៅ</h1><p>ទិដ្ឋភាពបុគ្គលិក និងព័ត៌មានសំខាន់សម្រាប់ការគ្រប់គ្រងប្រចាំថ្ងៃ។</p></div><div class="overview-actions"><span class="date-badge"><CalendarDays :size="15"/>{{ formatKhmerDate(new Date(today+'T12:00:00')) }}</span><BaseButton v-if="onNavigateUsers" @click="onNavigateUsers"><Plus :size="16"/>គ្រប់គ្រងបុគ្គលិក</BaseButton></div></header>
  <div v-if="error" class="overview-error" role="alert"><AlertCircle :size="20"/><p>{{ error }}</p><BaseButton v-if="onRetry" variant="outline" @click="onRetry">ព្យាយាមម្ដងទៀត</BaseButton></div>
  <div class="metrics-grid"><DashboardMetric v-for="metric in metrics" :key="metric.color" v-bind="metric" :loading="loading"/></div>
  <div v-if="loading" class="overview-charts" role="status" aria-label="កំពុងទាញយកទិន្នន័យ"><section v-for="index in 2" :key="index" class="dashboard-panel"><BaseSkeleton :lines="6"/></section></div>
  <template v-else-if="!error">
   <div class="overview-charts">
    <section class="dashboard-panel hiring-panel" aria-labelledby="hiring-chart-title"><header class="overview-panel-heading"><div><h2 id="hiring-chart-title"><TrendingUp :size="19"/>បុគ្គលិកចូលថ្មីតាមខែ</h2><p>តាមកាលបរិច្ឆេទចូលធ្វើការរបស់បុគ្គលិក និងអ្នកគ្រប់គ្រង</p></div><select v-model.number="monthCount" aria-label="រយៈពេលក្រាហ្វិក"><option :value="6">៦ ខែចុងក្រោយ</option><option :value="12">១២ ខែចុងក្រោយ</option></select></header>
     <div class="trend-summary"><div><strong>{{ hiresTotal }}</strong><span>នាក់ ក្នុង {{ monthCount }} ខែ</span></div><span class="trend-selection" aria-live="polite">{{ monthLabel(highlighted.key,true) }} <b>{{ highlighted.count }} នាក់</b></span></div>
     <div class="trend-scroll"><svg class="hiring-chart" viewBox="0 0 640 225" role="group" aria-label="ក្រាហ្វិកបុគ្គលិកចូលថ្មីតាមខែ"><defs><linearGradient :id="gradientId" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#078795" stop-opacity=".25"/><stop offset="100%" stop-color="#078795" stop-opacity=".02"/></linearGradient></defs><g v-for="fraction in [0,.5,1]" :key="fraction"><line x1="38" x2="602" :y1="180-fraction*140" :y2="180-fraction*140" class="chart-grid"/><text x="22" :y="184-fraction*140" text-anchor="end" class="chart-label">{{ Math.round(fraction*maxMonth) }}</text></g><path :key="'area-'+area" class="trend-area" :d="area" :fill="`url(#${gradientId})`"/><path :key="'line-'+line" pathLength="1" :d="line" class="trend-line"/><line :x1="highlighted.x" :x2="highlighted.x" y1="30" y2="180" class="chart-guide"/><g v-for="(point,index) in points" :key="point.key" tabindex="0" role="button" :aria-label="monthLabel(point.key,true)+': '+point.count+' នាក់'" class="chart-point" @mouseenter="selectedMonth=index" @focus="selectedMonth=index" @click="selectedMonth=index" @keydown.enter.prevent="selectedMonth=index" @keydown.space.prevent="selectedMonth=index"><title>{{ monthLabel(point.key,true) }}: {{ point.count }} នាក់</title><circle :cx="point.x" :cy="point.y" r="14" fill="transparent"/><circle :cx="point.x" :cy="point.y" :r="highlighted.key===point.key?6:4" class="trend-dot"/><text :x="point.x" y="210" text-anchor="middle" class="chart-label">{{ monthCount===12 ? Number(point.key.slice(-2)) : monthLabel(point.key) }}</text></g></svg></div>
     <p class="chart-footnote">{{ insights.missingHireDate ? insights.missingHireDate+' នាក់មិនទាន់មានកាលបរិច្ឆេទចូលធ្វើការ និងមិនត្រូវបានរាប់ក្នុងក្រាហ្វិក។' : 'គិតត្រឹមកាលបរិច្ឆេទបច្ចុប្បន្ន។' }}</p>
    </section>
    <section class="dashboard-panel composition-panel" aria-labelledby="roles-chart-title"><header class="overview-panel-heading"><div><h2 id="roles-chart-title">សមាសភាពអ្នកប្រើប្រាស់</h2><p>ចំនួនគណនីតាមតួនាទី</p></div></header><div class="role-donut" :style="{background:donut}" role="img" :aria-label="roles.map(role=>role.name+': '+role.count).join(', ')"><div><strong>{{ highlightedRole ? highlightedRole.count : users.length }}</strong><small>{{ highlightedRole ? highlightedRole.name : 'គណនីសរុប' }}</small></div></div><div class="role-legend"><button v-for="role in roles" :key="role.id" type="button" :class="{selected:selectedRole===role.id}" :aria-pressed="selectedRole===role.id" @click="selectedRole=selectedRole===role.id?'':role.id"><i :style="{background:role.color}"></i><span>{{ role.name }}</span><small>{{ users.length ? Math.round(role.count/users.length*100) : 0 }}%</small><strong>{{ role.count }}</strong></button></div></section>
   </div>
   <div class="overview-charts lower-charts">
    <section class="dashboard-panel" aria-labelledby="department-chart-title"><header class="overview-panel-heading"><div><h2 id="department-chart-title"><Building2 :size="18"/>បុគ្គលិកតាមនាយកដ្ឋាន</h2><p>ចំនួនបុគ្គលិកដែលបានចាត់តាំងក្នុងនាយកដ្ឋាននីមួយៗ</p></div><span class="overview-chip">{{ insights.departmentRows.reduce((sum,row)=>sum+row.count,0) }} នាក់</span></header><div v-if="departmentRows.length" class="overview-departments"><div v-for="department in departmentRows" :key="department.id" class="overview-department"><div><span>{{ department.nameKh || department.nameEn }}</span><strong>{{ department.count }}</strong></div><div class="overview-bar-track" role="meter" aria-label="ចំនួនបុគ្គលិក" :aria-valuenow="department.count" :aria-valuemin="0" :aria-valuemax="maxDepartment"><span :style="{width:department.count/maxDepartment*100+'%'}"></span></div></div></div><p v-else class="overview-empty">មិនទាន់មាននាយកដ្ឋានទេ។</p><BaseButton v-if="departments.length>5" variant="ghost" class="all-departments" @click="departmentLimit=departmentLimit===5?departments.length:5">{{ departmentLimit===5?'បង្ហាញនាយកដ្ឋានទាំងអស់':'បង្ហាញតែ ៥ នាយកដ្ឋាន' }}</BaseButton></section>
    <section class="dashboard-panel attention-panel" aria-labelledby="attention-title"><header class="overview-panel-heading"><div><h2 id="attention-title"><ShieldCheck :size="19"/>ព័ត៌មានត្រូវពិនិត្យ</h2><p>ព័ត៌មានគណនី និងការចាត់តាំងបុគ្គលិក</p></div></header><div class="attention-list"><div v-for="item in attention" :key="item.label"><span class="attention-icon" :class="{warning:item.count}"><component :is="item.icon" :size="19"/></span><span>{{ item.label }}</span><strong :class="{warning:item.count}">{{ item.count }}</strong></div></div><p class="attention-note"><CheckCircle2 v-if="!attention.some(item=>item.count)" :size="16"/><AlertCircle v-else :size="16"/>{{ attention.some(item=>item.count)?'សូមពិនិត្យទិន្នន័យនៅទំព័រអ្នកប្រើប្រាស់ និងនាយកដ្ឋាន។':'ព័ត៌មានគណនី និងការចាត់តាំងគ្រប់គ្រាន់។' }}</p></section>
   </div>
   <section class="dashboard-panel recent-hires" aria-labelledby="recent-hires-title"><header class="overview-panel-heading"><div><h2 id="recent-hires-title"><UserPlus :size="19"/>បុគ្គលិកចូលថ្មីចុងក្រោយ</h2><p>បង្ហាញតាមកាលបរិច្ឆេទចូលធ្វើការថ្មីបំផុត</p></div><BaseButton v-if="onNavigateUsers" variant="ghost" @click="onNavigateUsers">មើលអ្នកប្រើប្រាស់<ArrowRight :size="16"/></BaseButton></header><div v-if="insights.recentHires.length" class="recent-hire-list"><article v-for="user in insights.recentHires" :key="user.id"><UserAvatar :src="user.avatar" :name="user.nameEn || user.nameKh" :size="38"/><div><strong>{{ user.nameKh || user.nameEn }}</strong><small>{{ user.departmentKh || (user.role==='MANAGER'?'អ្នកគ្រប់គ្រង':'បុគ្គលិក') }}</small></div><time :datetime="hireDate(user)">{{ hireDate(user) }}</time></article></div><p v-else class="overview-empty">មិនទាន់មានទិន្នន័យកាលបរិច្ឆេទចូលធ្វើការទេ។</p></section>
  </template>
 </section>
</template>
<style scoped>
.admin-overview { display:grid; gap:24px; }
.overview-actions { display:flex; align-items:center; flex-wrap:wrap; justify-content:flex-end; gap:10px; }
.overview-error { display:flex; align-items:center; gap:12px; padding:18px; border-radius:14px; background:#fff0f2; color:#a53b50; }
.overview-error p { flex:1; margin:0; font-size:13px; }
.overview-charts { display:grid; grid-template-columns:minmax(0,1.65fr) minmax(300px,1fr); gap:24px; }
.admin-overview .dashboard-panel { min-width:0; padding:24px; }
.overview-panel-heading { display:flex; align-items:flex-start; justify-content:space-between; gap:16px; margin-bottom:24px; }
.overview-panel-heading h2 { display:flex; align-items:center; gap:8px; margin:0 0 8px; color:var(--ink); font-size:18px; font-weight:650; }
.overview-panel-heading h2 svg { color:var(--blue); flex-shrink:0; }
.overview-panel-heading p { margin:0; color:var(--muted); font-size:12px; line-height:1.9; }
.overview-panel-heading select { min-height:40px; padding:8px 12px; background:var(--surface); color:var(--ink); border:1px solid var(--line); border-radius:10px; font-size:12px; }
.trend-summary { display:flex; align-items:center; flex-wrap:wrap; justify-content:space-between; gap:12px; }
.trend-summary>div { display:flex; align-items:baseline; gap:10px; }
.trend-summary strong { font-size:32px; line-height:1; font-weight:700; }
.trend-summary span { font-size:12px; color:var(--muted); }
.trend-selection { display:flex; align-items:center; gap:10px; padding:8px 10px; border-radius:8px; background:var(--soft); }
.trend-selection b { color:var(--blue); }
.trend-scroll { overflow-x:auto; margin-top:16px; }
.hiring-chart { width:100%; min-width:480px; display:block; }
.chart-grid { stroke:var(--line); stroke-dasharray:4 5; }
.chart-label { fill:var(--muted); font-size:11px; }
.trend-line { fill:none; stroke:#078795; stroke-width:3; stroke-linecap:round; stroke-linejoin:round; }
.trend-dot { fill:var(--surface); stroke:#078795; stroke-width:3; transition:r .15s; }
.chart-point { cursor:pointer; outline:none; }
.chart-point:focus-visible .trend-dot { stroke-width:6; }
.chart-guide { stroke:#078795; stroke-dasharray:3 5; opacity:.35; }
.chart-footnote { margin:10px 0 0; color:var(--muted); font-size:11px; line-height:1.8; }
.role-donut { width:180px; height:180px; border-radius:50%; padding:20px; margin:0 auto 20px; transform:rotate(-90deg); }
.role-donut>div { width:100%; height:100%; border-radius:50%; background:var(--surface); display:flex; flex-direction:column; align-items:center; justify-content:center; gap:6px; transform:rotate(90deg); }
.role-donut strong { font-size:32px; line-height:1.2; }
.role-donut small { font-size:12px; color:var(--muted); }
.role-legend { display:grid; gap:6px; }
.role-legend button { display:flex; align-items:center; gap:10px; min-height:40px; padding:8px 10px; background:transparent; border:1px solid transparent; border-radius:10px; color:var(--ink); cursor:pointer; text-align:left; }
.role-legend button.selected,.role-legend button:hover { border-color:var(--line); background:var(--soft); }
.role-legend i { width:9px; height:9px; border-radius:50%; }
.role-legend span { flex:1; font-size:13px; }
.role-legend small { color:var(--muted); font-size:12px; }
.role-legend strong { min-width:24px; text-align:right; font-size:14px; }
.overview-chip { padding:7px 10px; border-radius:10px; font-size:12px; color:var(--blue); background:var(--soft); white-space:nowrap; }
.overview-departments { display:grid; gap:20px; }
.overview-department>div:first-child { display:flex; align-items:center; gap:16px; justify-content:space-between; margin-bottom:9px; font-size:13px; }
.overview-department span { color:var(--muted); overflow-wrap:anywhere; }
.overview-department strong { color:var(--ink); }
.overview-bar-track { height:10px; border-radius:999px; background:var(--soft); overflow:hidden; }
.overview-bar-track span { display:block; height:100%; border-radius:999px; background:linear-gradient(90deg,#078795,#37b2b7); transition:width .35s ease; }
.all-departments { margin-top:18px; }
.attention-list { display:grid; gap:18px; }
.attention-list>div { display:flex; align-items:center; gap:12px; }
.attention-icon { width:40px; height:40px; display:grid; place-items:center; border-radius:12px; background:var(--soft); color:var(--blue); flex-shrink:0; }
.attention-icon.warning { color:#a56c15; background:#fff5df; }
.attention-list>div>span:nth-child(2) { flex:1; font-size:13px; line-height:1.8; color:var(--muted); }
.attention-list strong { font-size:19px; }
.attention-list strong.warning { color:#a56c15; }
.attention-note { display:flex; align-items:flex-start; gap:8px; padding-top:18px; margin:24px 0 0; border-top:1px solid var(--line); font-size:12px; color:var(--muted); line-height:1.9; }
.attention-note svg { flex-shrink:0; margin-top:4px; }
.recent-hire-list { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:12px 24px; }
.recent-hire-list article { display:flex; align-items:center; gap:12px; padding:14px 0; border-bottom:1px solid var(--line); }
.recent-hire-list article>div { display:grid; gap:5px; min-width:0; flex:1; }
.recent-hire-list strong { font-size:14px; font-weight:600; overflow-wrap:anywhere; }
.recent-hire-list small { color:var(--muted); font-size:12px; }
.recent-hire-list time { color:var(--muted); font-size:12px; white-space:nowrap; }
.overview-empty { text-align:center; padding:30px 16px; color:var(--muted); font-size:13px; }
.admin-overview select:focus-visible,.admin-overview button:focus-visible { outline:2px solid var(--blue); outline-offset:3px; }
.dark .attention-icon.warning { background:#3a3020; color:#f5ce80; }
.dark .attention-list strong.warning { color:#f5ce80; }
@media(max-width:1100px) { .overview-charts { grid-template-columns:1fr; } .composition-panel { display:grid; grid-template-columns:1fr 1fr; gap:20px; align-items:center; } .composition-panel .overview-panel-heading { grid-column:1/-1; margin-bottom:0; } .role-donut { margin:0 auto; } .overview-actions { justify-content:flex-start; } }
@media(max-width:640px) { .admin-overview { gap:18px; } .admin-overview .dashboard-panel { padding:18px; } .overview-charts { gap:18px; } .overview-panel-heading { flex-wrap:wrap; gap:12px; margin-bottom:20px; } .overview-panel-heading h2 { font-size:16px; } .recent-hire-list { grid-template-columns:1fr; } .composition-panel { display:block; } .role-donut { margin:22px auto; } .overview-actions .date-badge { display:none; } .overview-actions { gap:8px; } .trend-selection { padding:6px 8px; } }
@media(prefers-reduced-motion:reduce) { .overview-bar-track span,.trend-dot { transition:none; } }
</style>
