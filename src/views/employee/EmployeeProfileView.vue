<script setup>
import { computed, nextTick, onMounted, onBeforeUnmount, reactive, ref, watch } from 'vue';
import { UserRound, UsersRound, Mail, Phone, CalendarDays, ShieldCheck, BadgeCheck, Pencil, LockKeyhole, X, Save, Banknote, Upload, Trash2, LoaderCircle } from 'lucide-vue-next';
import BaseModal from '../../components/base/BaseModal.vue';
import BaseButton from '../../components/base/BaseButton.vue';
import BaseSkeleton from '../../components/base/BaseSkeleton.vue';
import { labels } from '../../data/labels';
import { auth } from '../../auth/index.js';
import { PASSWORD_RULE } from '../../auth/passwordReset.js';
import http, { API_BASE_URL } from '../../api/http.js';
import { createProfileApi, profileDraft, profileValidation, profileError, passwordValidation, displayValue, displayDate, displaySalary, avatarUrl, NOT_PROVIDED } from '../../api/profile.js';
import { localToday } from '../../api/employeeData.js';
import { notify } from '../../stores/toasts.js';
defineProps({ currentUser: Object });
const api = createProfileApi({ request: config => http.request(config), session: auth });
const user = computed(() => auth.state.user || {});
const loading = ref(false), loaded = ref(false), loadError = ref('');
const editing = ref(false), saving = ref(false), editError = ref('');
const passwordOpen = ref(false), changingPassword = ref(false), passwordError = ref('');
const imageFailed = ref(false);
const avatarInput = ref(null), changingAvatar = ref(false), avatarError = ref('');
const draft = reactive(profileDraft({}));
const fieldErrors = ref({});
const dirty = computed(() => JSON.stringify(draft) !== JSON.stringify(profileDraft(user.value)));
const credentials = reactive({ oldPassword: '', newPassword: '', confirmPass: '' });
let disposed = false;
onBeforeUnmount(() => { disposed = true; clearPasswords(); });
watch(() => user.value.avatar, () => { imageFailed.value = false; });
async function loadProfile() {
  if (loading.value) return;
  loading.value = true; loadError.value = '';
  try { await api.load(); loaded.value = true; }
  catch (error) { loadError.value = profileError(error); }
  finally { loading.value = false; }
}
onMounted(loadProfile);
async function changeAvatar(file) {
  if (changingAvatar.value || loading.value || loadError.value) return;
  avatarError.value = '';
  if (file && !file.type.startsWith('image/')) {
    avatarError.value = 'សូមជ្រើសរើសឯកសាររូបភាព។';
    return;
  }
  changingAvatar.value = true;
  try {
    if (file) await (user.value.avatar ? api.updateAvatar(file) : api.uploadAvatar(file));
    else await api.deleteAvatar();
    if (disposed) return;
    imageFailed.value = false;
    notify(file ? 'រូបប្រវត្តិរូបត្រូវបានរក្សាទុកដោយជោគជ័យ។' : 'រូបប្រវត្តិរូបត្រូវបានលុបដោយជោគជ័យ។');
    await loadProfile();
    if (loadError.value) notify(loadError.value, 'error');
  } catch (error) {
    if (!disposed) { avatarError.value = profileError(error); notify(avatarError.value, 'error'); }
  } finally { changingAvatar.value = false; }
}
function selectAvatar(event) {
  const file = event.target.files?.[0];
  event.target.value = '';
  if (file) changeAvatar(file);
}
function startEditing() { Object.assign(draft, profileDraft(user.value)); editError.value = ''; fieldErrors.value = {}; editing.value = true; }
function cancelEditing() { if (!saving.value) editing.value = false; }
async function save() {
  if (saving.value) return;
  fieldErrors.value = profileValidation(draft, localToday());
  if (Object.keys(fieldErrors.value).length) {
    await nextTick();
    document.getElementById('profile-field-' + Object.keys(fieldErrors.value)[0])?.focus();
    return;
  }
  saving.value = true; editError.value = '';
  try {
    await api.update(draft);
    if (disposed) return;
    editing.value = false;
    notify('ព័ត៌មានប្រវត្តិរូបត្រូវបានរក្សាទុកដោយជោគជ័យ។');
    await loadProfile();
    if (loadError.value) notify(loadError.value, 'error');
  } catch (error) { editError.value = profileError(error); if (!disposed) notify(editError.value, 'error'); }
  finally { saving.value = false; }
}
function clearPasswords() { Object.assign(credentials, { oldPassword: '', newPassword: '', confirmPass: '' }); }
function openPassword() { clearPasswords(); passwordError.value = ''; passwordOpen.value = true; }
function closePassword() { if (!changingPassword.value) { passwordOpen.value = false; clearPasswords(); } }
async function savePassword() {
  if (changingPassword.value) return;
  passwordError.value = passwordValidation(credentials);
  if (passwordError.value) return;
  changingPassword.value = true;
  try {
    await api.changePassword(credentials);
    clearPasswords(); passwordOpen.value = false;
    if (!disposed) notify('ពាក្យសម្ងាត់ត្រូវបានប្តូរដោយជោគជ័យ។');
  } catch (error) { passwordError.value = profileError(error); if (!disposed) notify(passwordError.value, 'error'); }
  finally { changingPassword.value = false; }
}
const role = computed(() => labels[user.value.role] || displayValue(user.value.role));
const avatar = computed(() => avatarUrl(user.value.avatar, API_BASE_URL));
const inactive = computed(() => user.value.is_active != null && Number(user.value.is_active) === 0);
const details = computed(() => [
  { label: 'ឈ្មោះជាភាសាខ្មែរ', value: displayValue(user.value.khmer_name), icon: UserRound },
  { label: 'ឈ្មោះជាឡាតាំង', value: displayValue(user.value.Eng_name), icon: UserRound },
  { label: 'អ៊ីមែល', value: displayValue(user.value.email), icon: Mail },
  { label: 'លេខទូរស័ព្ទ', value: displayValue(user.value.phone), icon: Phone },
  { label: 'ភេទ', value: ({ MALE: 'ប្រុស', FEMALE: 'ស្រី' })[user.value.gender] || displayValue(user.value.gender), icon: UserRound },
  { label: 'ថ្ងៃខែឆ្នាំកំណើត', value: displayDate(user.value.date_of_birth), icon: CalendarDays },
  { label: 'អាសយដ្ឋាន', value: displayValue(user.value.address), icon: UserRound },
  { label: 'ឈ្មោះទំនាក់ទំនងបន្ទាន់', value: displayValue(user.value.emergency_contact_name), icon: UserRound },
  { label: 'លេខទូរស័ព្ទទំនាក់ទំនងបន្ទាន់', value: displayValue(user.value.emergency_contact_phone), icon: Phone },
  { label: 'ទំនាក់ទំនងជាមួយបុគ្គលបន្ទាន់', value: displayValue(user.value.emergency_contact_relationship), icon: UsersRound },
].map(detail => ({ ...detail, value: detail.value === NOT_PROVIDED ? '—' : detail.value })));
const fields = [
  { key: 'newkhmer_name', label: 'ឈ្មោះជាភាសាខ្មែរ', required: true, max: 100 },
  { key: 'newEng_name', label: 'ឈ្មោះជាឡាតាំង', required: true, max: 100 },
  { key: 'newphone', label: 'លេខទូរស័ព្ទ', type: 'tel', required: true, max: 20 },
  { key: 'date_of_birth', label: 'ថ្ងៃខែឆ្នាំកំណើត', type: 'date' },
];
const emergencyFields = [
  { key: 'emergency_contact_name', label: 'ឈ្មោះទំនាក់ទំនងបន្ទាន់', max: 100 },
  { key: 'emergency_contact_phone', label: 'លេខទូរស័ព្ទទំនាក់ទំនងបន្ទាន់', type: 'tel', max: 25 },
  { key: 'emergency_contact_relationship', label: 'ទំនាក់ទំនងជាមួយបុគ្គលបន្ទាន់', max: 100 },
];
</script>
<template>
  <div class="dashboard profile-page" :aria-busy="loading">
    <div class="page-heading"><div><h1>ព័ត៌មានប្រវត្តិរូបរបស់ខ្ញុំ</h1><p>គ្រប់គ្រងព័ត៌មានផ្ទាល់ខ្លួន និងគណនីរបស់អ្នក</p></div></div>
    <div v-if="loading && !loaded" class="profile-layout"><BaseSkeleton :lines="7"/><BaseSkeleton :lines="9"/></div>
    <p v-else-if="loading" class="profile-loading" role="status">កំពុងទាញយកព័ត៌មានប្រវត្តិរូប…</p>
    <div v-if="loadError" class="profile-load-error" role="alert"><p>{{ loadError }}</p><button class="profile-secondary" :disabled="loading" @click="loadProfile">ព្យាយាមម្តងទៀត</button></div>
    <div v-if="loaded" class="profile-layout">
      <aside class="dashboard-panel profile-summary">
        <div class="profile-cover" aria-hidden="true"></div>
        <div class="profile-avatar-controls" :aria-busy="changingAvatar">
          <input ref="avatarInput" type="file" accept="image/*" hidden :disabled="changingAvatar || loading || !!loadError" @change="selectAvatar" />
          <button type="button" class="profile-avatar-button" :title="user.avatar ? 'ប្តូររូបប្រវត្តិរូប' : 'បញ្ចូលរូបប្រវត្តិរូប'" :aria-label="user.avatar ? 'ប្តូររូបប្រវត្តិរូប' : 'បញ្ចូលរូបប្រវត្តិរូប'" :disabled="changingAvatar || loading || !!loadError" @click="avatarInput?.click()"><LoaderCircle v-if="changingAvatar" :size="18" class="profile-avatar-spinner" /><Pencil v-else-if="user.avatar" :size="18" /><Upload v-else :size="18" /></button>
          <div class="profile-portrait"><img v-if="avatar && !imageFailed" :src="avatar" :alt="user.khmer_name || 'រូបប្រវត្តិរូប'" @error="imageFailed = true" /><UserRound v-else :size="48" aria-label="រូបប្រវត្តិរូបលំនាំដើម" /></div>
          <button type="button" class="profile-avatar-button profile-avatar-delete" title="លុបរូបប្រវត្តិរូប" aria-label="លុបរូបប្រវត្តិរូប" :disabled="!user.avatar || changingAvatar || loading || !!loadError" @click="changeAvatar()"><Trash2 :size="18" /></button>
        </div>
        <p v-if="changingAvatar" class="profile-avatar-message" role="status">កំពុងរក្សាទុករូបប្រវត្តិរូប…</p>
        <p v-if="avatarError" class="profile-form-error" role="alert">{{ avatarError }}</p>
        <h2>{{ displayValue(user.khmer_name) }}</h2><p class="profile-latin-name">{{ displayValue(user.Eng_name) }}</p><p class="profile-email">{{ displayValue(user.email) }}</p>
        <span class="profile-role"><ShieldCheck :size="15" />{{ role }}</span>
        <dl class="profile-account-facts" aria-label="ព័ត៌មានគណនី"><div><dt><Banknote :size="17"/>ប្រាក់ខែគោល</dt><dd>{{ displaySalary(user.base_salary) === NOT_PROVIDED ? '—' : displaySalary(user.base_salary) }}</dd></div><div><dt><BadgeCheck :size="17"/>ស្ថានភាពគណនី</dt><dd><span v-if="user.is_active != null" class="profile-status" :class="{inactive}"><i></i>{{ inactive ? 'អសកម្ម' : 'សកម្ម' }}</span><span v-else>—</span></dd></div></dl>
        <div class="profile-actions"><button class="small-primary" :disabled="loading || !!loadError" @click="startEditing"><Pencil :size="16" />កែប្រែព័ត៌មាន</button><button class="profile-secondary" :disabled="loading || !!loadError" @click="openPassword"><LockKeyhole :size="16" />ប្តូរពាក្យសម្ងាត់</button></div>
      </aside>
      <section class="dashboard-panel profile-details" aria-labelledby="profile-details-title">
        <div class="panel-heading"><div><h2 id="profile-details-title">ព័ត៌មានផ្ទាល់ខ្លួន</h2><p>ព័ត៌មានអ្នកប្រើប្រាស់ និងតួនាទីក្នុងប្រព័ន្ធ</p></div><span class="profile-section-icon"><UserRound :size="20" /></span></div>
        <dl class="profile-detail-grid"><div v-for="detail in details" :key="detail.label" class="profile-detail-tile"><dt><span><component :is="detail.icon" :size="17" /></span>{{ detail.label }}</dt><dd><span v-if="detail.status" class="profile-status" :class="{ inactive }"><i></i>{{ detail.value }}</span><template v-else>{{ detail.value }}</template></dd></div></dl>
      </section>
    </div>
    <BaseModal v-slot="{ close }" :busy="saving" :dirty="dirty" v-model="editing" title="កែប្រែព័ត៌មានផ្ទាល់ខ្លួន" class="account-action-modal profile-update-modal" :close-on-backdrop="!saving" :close-on-escape="!saving" @close="cancelEditing">
      <div class="account-dialog-heading"><span class="profile-section-icon"><Pencil :size="20" /></span><div><h2>កែប្រែព័ត៌មានផ្ទាល់ខ្លួន</h2><p>{{ user.email }}</p></div><button class="icon-button" aria-label="បិទ" :disabled="saving" @click="close"><X :size="20" /></button></div>
      <form class="profile-edit-form" novalidate :aria-busy="saving" @submit.prevent="save">
        <fieldset class="profile-fields" :disabled="saving"><label v-for="field in fields" :key="field.key" :for="'profile-field-'+field.key">{{ field.label }}<input :id="'profile-field-'+field.key" v-model="draft[field.key]" :name="field.key" :type="field.type || 'text'" :required="field.required" :maxlength="field.max" :max="field.type === 'date' ? localToday() : undefined" :aria-invalid="!!fieldErrors[field.key]" :aria-describedby="fieldErrors[field.key] ? 'profile-error-'+field.key : undefined"/><span v-if="fieldErrors[field.key]" :id="'profile-error-'+field.key" class="profile-field-error">{{ fieldErrors[field.key] }}</span></label><label for="profile-field-gender">ភេទ<select id="profile-field-gender" v-model="draft.gender" name="gender" :aria-invalid="!!fieldErrors.gender"><option value="" disabled>មិនបានផ្តល់</option><option value="MALE">ប្រុស</option><option value="FEMALE">ស្រី</option></select><span v-if="fieldErrors.gender" class="profile-field-error">{{ fieldErrors.gender }}</span></label><label for="profile-field-address" class="profile-field-wide">អាសយដ្ឋាន<textarea id="profile-field-address" v-model="draft.address" name="address" rows="2" maxlength="500"/></label><h3 class="profile-emergency-heading">ព័ត៌មានទំនាក់ទំនងបន្ទាន់</h3><label v-for="field in emergencyFields" :key="field.key" :for="'profile-field-'+field.key">{{ field.label }}<input :id="'profile-field-'+field.key" v-model="draft[field.key]" :name="field.key" :type="field.type || 'text'" :maxlength="field.max" :aria-invalid="!!fieldErrors[field.key]" :aria-describedby="fieldErrors[field.key] ? 'profile-error-'+field.key : undefined"/><span v-if="fieldErrors[field.key]" :id="'profile-error-'+field.key" class="profile-field-error">{{ fieldErrors[field.key] }}</span></label></fieldset>
        <p v-if="editError" class="profile-form-error" role="alert">{{ editError }}</p>
        <div class="profile-form-actions"><button type="button" class="profile-secondary" :disabled="saving" @click="close">បោះបង់</button><BaseButton type="submit" :loading="saving"><Save :size="16"/>រក្សាទុកការកែប្រែ</BaseButton></div>
      </form>
    </BaseModal>
    <BaseModal v-slot="{ close }" :busy="changingPassword" :dirty="Object.values(credentials).some(Boolean)" v-model="passwordOpen" title="ប្តូរពាក្យសម្ងាត់" class="account-action-modal" :close-on-backdrop="!changingPassword" :close-on-escape="!changingPassword" @close="closePassword">
      <div class="account-dialog-heading"><span class="profile-section-icon"><LockKeyhole :size="20" /></span><div><h2>ប្តូរពាក្យសម្ងាត់</h2><p>{{ user.email }}</p></div><button class="icon-button" aria-label="បិទ" :disabled="changingPassword" @click="close"><X :size="20" /></button></div>
      <form class="profile-edit-form" :aria-busy="changingPassword" @submit.prevent="savePassword">
        <fieldset class="profile-fields password-fields" :disabled="changingPassword"><label>ពាក្យសម្ងាត់បច្ចុប្បន្ន<input v-model="credentials.oldPassword" type="password" autocomplete="current-password" required /></label><label>ពាក្យសម្ងាត់ថ្មី<input v-model="credentials.newPassword" type="password" autocomplete="new-password" minlength="8" maxlength="30" aria-describedby="profile-password-rule" required /></label><label>ផ្ទៀងផ្ទាត់ពាក្យសម្ងាត់ថ្មី<input v-model="credentials.confirmPass" type="password" autocomplete="new-password" minlength="8" maxlength="30" required /></label></fieldset>
        <p id="profile-password-rule" class="profile-password-rule">{{ PASSWORD_RULE }}</p><p v-if="passwordError" class="profile-form-error" role="alert">{{ passwordError }}</p>
        <div class="profile-form-actions"><button type="button" class="profile-secondary" :disabled="changingPassword" @click="close">បោះបង់</button><BaseButton type="submit" :loading="changingPassword">ប្តូរពាក្យសម្ងាត់</BaseButton></div>
      </form>
    </BaseModal>
  </div>
</template>

<style scoped>
.profile-account-facts { width:100%; margin:20px 0 24px; padding:4px 0; border-top:1px solid var(--line); border-bottom:1px solid var(--line); text-align:left; }
.profile-account-facts>div { display:flex; align-items:center; justify-content:space-between; gap:14px; padding:14px 0; }
.profile-account-facts>div+div { border-top:1px solid var(--line); }
.profile-account-facts dt { display:flex; align-items:center; gap:8px; color:var(--muted); font-size:13px; line-height:1.8; }
.profile-account-facts dt svg { flex-shrink:0; color:var(--blue); }
.profile-account-facts dd { margin:0; font-size:15px; font-weight:600; color:var(--ink); white-space:nowrap; }
.profile-field-wide,.profile-emergency-heading { grid-column:1/-1; }
.profile-emergency-heading { font-size:15px; color:var(--ink); font-weight:600; padding-top:18px; margin:4px 0 0; border-top:1px solid var(--line); }
.profile-fields textarea { min-width:0; width:100%; resize:vertical; min-height:80px; padding:10px 12px; border:1px solid var(--line); border-radius:12px; background:var(--surface); color:var(--ink); }
.profile-field-error { color:#be3450; font-size:12px; line-height:1.7; }
.profile-fields [aria-invalid="true"] { border-color:#be3450; }
</style>
