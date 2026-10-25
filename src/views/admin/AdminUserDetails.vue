<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { ArrowLeft, UserRound, BriefcaseBusiness, History, Mail, Phone, Banknote } from 'lucide-vue-next';
import { labels } from '../../data/labels';
import { salaryHistory, money, dateOnly } from '../../api/employeeData';
import { userIdentityFields } from '../../api/adminUsers.js';
import UserAvatar from '../../components/common/UserAvatar.vue';
import BaseTable from '../../components/base/BaseTable.vue';
import BaseButton from '../../components/base/BaseButton.vue';
import BaseSkeleton from '../../components/base/BaseSkeleton.vue';
const props = defineProps({ user: { type: Object, required: true }, onBack: { type: Function, required: true }, onGetUser: Function, onSalaryHistory: Function, onEditSalary: Function, salaryVersion: Number, employeeView: Boolean });
const heading = ref(null), detailUser = ref(null), loading = ref(false), loadError = ref(''), reload = ref(0);
const history = ref([]), historyLoading = ref(false), historyError = ref(''), historyReload = ref(0);
watch([() => props.user.id, () => props.salaryVersion, reload], async (_value, _old, onCleanup) => {
  let active = true;
  onCleanup(() => { active = false; });
  loading.value = true; loadError.value = ''; detailUser.value = null;
  try {
    const user = props.onGetUser ? await props.onGetUser(props.user.id) : props.user;
    if (active) detailUser.value = user ? { ...props.user, ...user, ...userIdentityFields(user, props.user) } : null;
  } catch (error) { if (active) loadError.value = error.message || 'មិនអាចទាញយកព័ត៌មានបានទេ។'; }
  finally { if (active) loading.value = false; }
}, { immediate: true });
watch([() => props.user.id, () => props.onSalaryHistory, () => props.salaryVersion, historyReload], async (_value, _old, onCleanup) => {
  let active = true;
  onCleanup(() => { active = false; });
  history.value = []; historyError.value = ''; historyLoading.value = false;
  if (!props.onSalaryHistory) return;
  historyLoading.value = true;
  try {
    const result = salaryHistory(await props.onSalaryHistory(props.user.id));
    if (active) history.value = result;
  } catch (error) { if (active) historyError.value = error.message || 'មិនអាចទាញយកប្រវត្តិប្រាក់ខែបានទេ។'; }
  finally { if (active) historyLoading.value = false; }
}, { immediate: true });
const personal = computed(() => {
  const u = detailUser.value || {};
  return [
    { label: 'លេខអត្តសញ្ញាណបណ្ណ', value: u.idCardNumber },
    { label: 'ឈ្មោះជាអង់គ្លេស', value: u.nameEn },
    { label: 'ភេទ', value: { male: 'ប្រុស', female: 'ស្រី' }[String(u.gender || '').toLowerCase()] },
    { label: 'ថ្ងៃខែឆ្នាំកំណើត', value: dateOnly(u.dob) },
    { label: 'អាសយដ្ឋាន', value: u.address, wide: true },
  ];
});
const employment = computed(() => {
  const u = detailUser.value || {};
  return [
    { label: 'នាយកដ្ឋាន', value: u.departmentKh },
    ...(String(u.role).toUpperCase() === 'MANAGER' ? [] : [{ label: 'មុខតំណែង', value: u.positionKh }]),
    { label: 'កាលបរិច្ឆេទចូលធ្វើការ', value: dateOnly(u.joinedDate) },
    { label: 'ប្រាក់បៀវត្សគោល', value: u.salary == null ? null : money(u.salary) },
  ];
});
const historyColumns = computed(() => [
  { key: 'date', label: 'កាលបរិច្ឆេទ', sortable: true },
  { key: 'previous', label: 'ប្រាក់ខែមុន', align: 'right' },
  { key: 'salary', label: 'ប្រាក់ខែថ្មី', align: 'right' },
  { key: 'description', label: 'ការពិពណ៌នា' },
].filter(column => column.key !== 'previous' || history.value.some(row => row.previous != null)));
onMounted(() => {
  document.getElementById('main-content-scrollable')?.scrollTo({ top: 0 });
  heading.value?.focus({ preventScroll: true });
});
</script>
<template>
  <div class="dashboard user-details-page" :id="employeeView ? 'manager-employee-details-page' : 'admin-user-details-page'" :aria-busy="loading">
    <div class="detail-page-heading"><BaseButton variant="ghost" size="sm" @click="onBack"><ArrowLeft :size="17"/>{{ employeeView ? 'ត្រឡប់ទៅបញ្ជីបុគ្គលិក' : 'ត្រឡប់ទៅបញ្ជីអ្នកប្រើប្រាស់' }}</BaseButton><h1 ref="heading" tabindex="-1">{{ employeeView ? 'ព័ត៌មានបុគ្គលិក' : 'ព័ត៌មានអ្នកប្រើប្រាស់' }}</h1></div>
    <div v-if="loadError" class="profile-load-error" role="alert"><p>{{ loadError }}</p><BaseButton variant="outline" @click="reload++">ព្យាយាមម្ដងទៀត</BaseButton></div>
    <BaseSkeleton v-if="loading" :lines="6"/>
    <p v-else-if="!loadError && !detailUser" class="dashboard-panel text-center">រកមិនឃើញអ្នកប្រើប្រាស់នេះទេ។</p>
    <template v-if="detailUser && !loading && !loadError">
      <section class="dashboard-panel detail-identity" aria-labelledby="user-details-name">
        <UserAvatar :src="detailUser.avatar" :name="detailUser.nameEn || detailUser.nameKh" :size="64"/>
        <div class="detail-identity-copy"><h2 id="user-details-name">{{ detailUser.nameKh || detailUser.nameEn }}</h2><p v-if="detailUser.nameEn">{{ detailUser.nameEn }}</p><div class="detail-contact"><span v-if="detailUser.email"><Mail :size="14"/>{{ detailUser.email }}</span><span v-if="detailUser.phone"><Phone :size="14"/>{{ detailUser.phone }}</span></div></div>
        <div class="detail-identity-badges"><BaseButton v-if="onEditSalary" variant="outline" size="sm" @click="onEditSalary(detailUser)"><Banknote :size="17"/>កែប្រែប្រាក់បៀវត្ស</BaseButton><span class="status-pill">{{ labels[detailUser.role] || detailUser.role }}</span><span class="status-pill" :class="detailUser.status === 'active' ? 'approved' : 'rejected'">{{ labels[detailUser.status] || detailUser.status }}</span></div>
      </section>
      <div class="user-detail-columns">
        <section class="dashboard-panel detail-section" aria-labelledby="user-personal-title"><h2 id="user-personal-title"><UserRound :size="18"/>ព័ត៌មានផ្ទាល់ខ្លួន</h2><dl class="user-detail-fields"><div v-for="field in personal" :key="field.label" :class="{ 'detail-field-wide': field.wide }"><dt>{{ field.label }}</dt><dd>{{ field.value || '—' }}</dd></div></dl></section>
        <section class="dashboard-panel detail-section" aria-labelledby="user-work-title"><h2 id="user-work-title"><BriefcaseBusiness :size="18"/>ព័ត៌មានការងារ</h2><dl class="user-detail-fields"><div v-for="field in employment" :key="field.label"><dt>{{ field.label }}</dt><dd>{{ field.value || '—' }}</dd></div></dl></section>
      </div>
      <section v-if="onSalaryHistory" class="detail-salary-section" aria-labelledby="user-salary-title">
        <div class="salary-section-heading"><div><h2 id="user-salary-title"><History :size="19"/>ប្រវត្តិប្រាក់បៀវត្ស</h2><p>ការផ្លាស់ប្តូរប្រាក់បៀវត្សរបស់អ្នកប្រើប្រាស់នេះ</p></div></div>
        <BaseTable class="salary-history-table" :columns="historyColumns" :rows="history" :loading="historyLoading" :error="historyError" caption="ប្រវត្តិប្រាក់បៀវត្ស" empty-text="មិនទាន់មានប្រវត្តិប្រាក់បៀវត្សទេ។" @retry="historyReload++"><template #cell-date="{ value }">{{ dateOnly(value) || '—' }}</template><template #cell-previous="{ value }"><span class="salary-amount muted">{{ money(value) }}</span></template><template #cell-salary="{ value }"><span class="salary-amount">{{ money(value) }}</span></template><template #cell-description="{ value }"><span class="salary-description">{{ value || '—' }}</span></template></BaseTable>
      </section>
    </template>
  </div>
</template>
