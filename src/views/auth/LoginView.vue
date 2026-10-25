<script setup>
import { computed, onUnmounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ArrowRight, ArrowLeft, Mail, LockKeyhole, Eye, EyeOff, Users, Zap, TrendingUp, ShieldCheck, Moon, Sun } from 'lucide-vue-next';
import { applyTheme } from '../../utils/theme.js';
import BrandLogo from '../../components/common/BrandLogo.vue';
import OtpInput from '../../components/common/OtpInput.vue';
import { validEmail } from '../../auth/passwordReset.js';
import { notify } from '../../stores/toasts.js';
import { auth, passwordReset } from '../../auth/index.js';
import { authError, dashboardPath } from '../../auth/session.js';
const route = useRoute();
const router = useRouter();
const isOtp = computed(() => Boolean(route.meta.adminOtp));
const email = ref(localStorage.getItem('garmentpro_email') || '');
const password = ref('');
const remember = ref(true);
const visible = ref(false);
const otp = ref('');
const errors = ref({});
function validate(field) {
  if (field === 'email') errors.value.email = !email.value.trim() ? 'សូមបញ្ចូលអាសយដ្ឋានអ៊ីមែល។' : !validEmail(email.value.trim()) ? 'សូមបញ្ចូលអាសយដ្ឋានអ៊ីមែលដែលត្រឹមត្រូវ។' : '';
  if (field === 'password') errors.value.password = !password.value ? 'សូមបញ្ចូលពាក្យសម្ងាត់។' : '';
}
watch(email, () => { if (errors.value.email) validate('email'); });
watch(password, () => { if (errors.value.password) validate('password'); });
watch(otp, () => { errors.value.otp = ''; });
watch(() => auth.state.message, message => { if (message) notify(authError(new Error(message), 'session'), 'error'); }, { immediate: true });
watch(() => passwordReset.state.notice, message => { if (message) { notify(message); passwordReset.state.notice = ''; } }, { immediate: true });
const busy = ref(false);
const remaining = ref(0);
const theme = ref(localStorage.getItem('app_theme') || 'light');
watch(theme, value => applyTheme(value), { immediate: true });
function onToggleTheme() { theme.value = theme.value === 'dark' ? 'light' : 'dark'; }
watch(isOtp, () => { errors.value = {}; otp.value = ''; });
const timer = setInterval(() => { if (remaining.value > 0) remaining.value--; }, 1000);
onUnmounted(() => clearInterval(timer));
async function forgotPassword() { password.value = ''; await router.push('/forgot-password'); }
async function login() {
  if (busy.value) return;
  validate('email'); validate('password');
  if (errors.value.email || errors.value.password) { document.getElementById(errors.value.email ? 'login-email' : 'login-password')?.focus(); return; }
  passwordReset.clear();
  busy.value = true;
  try {
    const user = await auth.login(email.value, password.value);
    if (remember.value) localStorage.setItem('garmentpro_email', email.value.trim());
    else localStorage.removeItem('garmentpro_email');
    password.value = '';
    remaining.value = user ? 0 : 30;
    await router.replace(user ? dashboardPath(user) : '/verify-admin-otp');
    if (user) notify('បានចូលប្រើប្រាស់ដោយជោគជ័យ។ សូមស្វាគមន៍!');
  } catch (cause) { notify(authError(cause), 'error'); }
  finally { busy.value = false; }
}
async function verify() {
  if (busy.value) return;
  if (!/^\d{6}$/.test(otp.value)) { errors.value.otp = 'សូមបញ្ចូលលេខកូដ ៦ ខ្ទង់។'; document.getElementById('admin-otp')?.focus(); return; }
  busy.value = true;
  try { const user = await auth.verifyOtp(otp.value); otp.value = ''; await router.replace(dashboardPath(user)); notify('បានចូលប្រើប្រាស់ដោយជោគជ័យ។ សូមស្វាគមន៍!'); }
  catch (cause) { notify(authError(cause, 'verify'), 'error'); }
  finally { busy.value = false; }
}
async function resend() {
  if (busy.value || remaining.value) return;
  busy.value = true;
  try { await auth.resendOtp(); otp.value = ''; remaining.value = 30; notify('បានផ្ញើលេខកូដថ្មី។ សូមពិនិត្យអ៊ីមែលរបស់អ្នក។'); }
  catch (cause) { notify(authError(cause, 'resend'), 'error'); }
  finally { busy.value = false; }
}
async function backToLogin() { auth.clear(); await router.replace('/login'); }
async function retrySession() {
  if (busy.value) return;
  busy.value = true;
  try { const user = await auth.verifyUser(); if (user) await router.replace(dashboardPath(user)); }
  catch (cause) { notify(authError(cause, 'session'), 'error'); }
  finally { busy.value = false; }
}
</script>
<template>
  <div lang="km" class="auth-page" :class="{ dark: theme === 'dark' }">
    <div class="auth-topline"><span>បុគ្គលិក និងការងារ នៅក្នុងកន្លែងតែមួយ</span><button class="icon-button" aria-label="ប្តូរផ្ទៃពណ៌" @click="onToggleTheme"><Sun v-if="theme === 'dark'" :size="18"/><Moon v-else :size="18"/></button></div>
    <main class="auth-card">
      <aside class="auth-story">
        <BrandLogo />
        <div class="story-copy"><span class="eyebrow">រួមគ្នាបង្កើនប្រសិទ្ធភាពការងារ</span><h1>{{ isOtp ? 'ផ្ទៀងផ្ទាត់គណនី' : 'គ្រប់គ្រងក្រុមរបស់អ្នក' }}<br/><span>{{ isOtp ? 'ដើម្បីសុវត្ថិភាពរបស់អ្នក' : 'រួមគ្នាបង្កើតភាពអស្ចារ្យ' }}</span></h1><p>{{ 'វិធីងាយស្រួលក្នុងការភ្ជាប់បុគ្គលិក ផលិតកម្ម និងការងារប្រចាំថ្ងៃរបស់អ្នក។' }}</p>
          <div class="story-features"><span><Users :size="16"/>{{ 'បុគ្គលិក' }}</span><span><Zap :size="16"/>{{ 'ដំណើរការ' }}</span><span><TrendingUp :size="16"/>{{ 'ការរីកចម្រើន' }}</span></div>
        </div>
        <div class="factory-art" aria-hidden="true"><div class="art-orbit"></div><div class="art-sun"></div>
          <svg viewBox="0 0 540 300" fill="none"><defs><linearGradient id="building" x1="110" y1="30" x2="300" y2="300" gradientUnits="userSpaceOnUse"><stop stop-color="#a9d3f9"/><stop offset="1" stop-color="#326aab"/></linearGradient><linearGradient id="glass" x1="200" y1="70" x2="400" y2="290" gradientUnits="userSpaceOnUse"><stop stop-color="#1b5189"/><stop offset="1" stop-color="#102e5d"/></linearGradient></defs><path d="M0 274 350 152 540 225V300H0Z" fill="#0c3773"/><path d="m80 142 180-70 192 64v151L260 238 80 297Z" fill="url(#building)"/><path d="m260 72 192 64v151l-192-49Z" fill="url(#glass)"/><path d="m94 159 151-56v124L94 277Z" fill="#2d6198"/><path d="m260 106 192 63M260 150l192 59M260 195l192 55M307 90v159M354 106v155M402 122v150M130 145v122M170 130v124M210 115v124M94 195l151-54M94 234l151-52" stroke="#acd7f7" stroke-opacity=".4" stroke-width="2"/><path d="m65 140 195-80 210 70-18 9-192-64-180 75Z" fill="#d4e9fa"/><path d="M333 221v36l37 10v-35Z" fill="#96c3e7"/><text x="286" y="142" fill="white" font-size="19" font-family="Arial" transform="rotate(18 286 142)">Garmora</text><path d="M34 296v-56M478 292v-66" stroke="#2a638b" stroke-width="7"/><circle cx="34" cy="230" r="30" fill="#3987a1"/><circle cx="478" cy="217" r="37" fill="#327a97"/><circle cx="499" cy="238" r="23" fill="#3a91a3"/></svg>
        </div>
        <div class="story-footer"><span>ធ្វើការរួមគ្នា<br/><strong>រីកចម្រើនរួមគ្នា</strong></span><span class="story-dots"><i></i><i></i><i></i></span></div>
      </aside>
      <section class="auth-form-panel">
        <div class="auth-panel-top"><button v-if="isOtp" class="text-button" :disabled="busy" @click="backToLogin"><ArrowLeft :size="15"/>ត្រឡប់ទៅចូលប្រព័ន្ធ</button><span v-else class="workspace-label">កន្លែងការងាររបស់អ្នក</span></div>
        <div class="auth-form-content">
          <h2>{{ isOtp ? 'ផ្ទៀងផ្ទាត់លេខកូដអ្នកគ្រប់គ្រង' : 'សូមស្វាគមន៍មកវិញ' }}<span class="brand-dot">.</span></h2>
          <p class="form-subtitle">{{ isOtp ? 'បញ្ចូលលេខកូដ ៦ ខ្ទង់ ដែលបានផ្ញើទៅអ៊ីមែលរបស់អ្នក។' : 'ចូលគណនីរបស់អ្នក ដើម្បីបន្តការងារ។' }}</p>
          <button v-if="auth.state.message && !isOtp" class="text-button" :disabled="busy" @click="retrySession">ព្យាយាមស្ដារវគ្គប្រើប្រាស់ម្តងទៀត</button>
          <form novalidate v-if="!isOtp" @submit.prevent="login" class="auth-form" :aria-busy="busy">
            <label for="login-email">អាសយដ្ឋានអ៊ីមែល</label><div class="input-wrap"><Mail :size="18"/><input id="login-email" v-model="email" :aria-invalid="Boolean(errors.email)" :aria-describedby="errors.email ? 'login-email-error' : undefined" @blur="validate('email')" type="email" autocomplete="username" placeholder="you@example.com" :disabled="busy" required/></div>
            <p v-if="errors.email" id="login-email-error" class="field-error" role="alert">{{ errors.email }}</p>
            <label for="login-password">ពាក្យសម្ងាត់</label><div class="input-wrap"><LockKeyhole :size="18"/><input id="login-password" v-model="password" :aria-invalid="Boolean(errors.password)" :aria-describedby="errors.password ? 'login-password-error' : undefined" @blur="validate('password')" :type="visible ? 'text' : 'password'" autocomplete="current-password" placeholder="បញ្ចូលពាក្យសម្ងាត់" :disabled="busy" required/><button type="button" aria-label="បង្ហាញ ឬលាក់ពាក្យសម្ងាត់" @click="visible = !visible"><EyeOff v-if="visible" :size="18"/><Eye v-else :size="18"/></button></div>
            <p v-if="errors.password" id="login-password-error" class="field-error" role="alert">{{ errors.password }}</p>
            <div class="form-options"><label class="checkbox-label"><input v-model="remember" type="checkbox"/>ចងចាំអ៊ីមែល</label><button class="text-button" type="button" :disabled="busy" @click="forgotPassword">ភ្លេចពាក្យសម្ងាត់?</button></div>
            <button class="primary-button" type="submit" :disabled="busy">{{ busy ? 'កំពុងចូលប្រព័ន្ធ…' : 'ចូលប្រព័ន្ធ' }}<ArrowRight :size="18"/></button>
          </form>
          <form novalidate v-else @submit.prevent="verify" class="auth-form" :aria-busy="busy">
            <label id="admin-otp-label" for="admin-otp">លេខកូដផ្ទៀងផ្ទាត់</label><OtpInput id="admin-otp" v-model="otp" :disabled="busy" :error="errors.otp"/>
            <button class="primary-button" type="submit" :disabled="busy">{{ busy ? 'កំពុងផ្ទៀងផ្ទាត់…' : 'ផ្ទៀងផ្ទាត់លេខកូដ' }}<ArrowRight :size="18"/></button>
            <button class="text-button resend-button" type="button" :disabled="busy || remaining > 0" @click="resend">{{ remaining ? `ផ្ញើលេខកូដម្តងទៀតក្នុង ${remaining} វិនាទី` : 'ផ្ញើលេខកូដម្តងទៀត' }}</button>
          </form>
          <p class="auth-help">ត្រូវការគណនី ឬកំណត់ពាក្យសម្ងាត់ថ្មី? សូមទាក់ទងអ្នកគ្រប់គ្រងប្រព័ន្ធ។</p>
        </div>
        <div class="auth-panel-footer"><ShieldCheck :size="14"/><span>បង្កើតឡើងសម្រាប់ក្រុមការងាររបស់អ្នក។</span></div>
      </section>
    </main>
    <footer class="auth-page-footer"><span>{{ new Date().getFullYear() }} Garmora</span><span>រួមគ្នាឆ្ពោះទៅរកភាពរីកចម្រើន</span></footer>
  </div>
</template>
