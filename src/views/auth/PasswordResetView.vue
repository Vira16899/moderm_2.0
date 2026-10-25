<script setup>
import { computed, onUnmounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ArrowLeft, ArrowRight, Mail, LockKeyhole, ShieldCheck, Eye, EyeOff, Sun, Moon } from 'lucide-vue-next';
import { applyTheme } from '../../utils/theme.js';
import BrandLogo from '../../components/common/BrandLogo.vue';
import OtpInput from '../../components/common/OtpInput.vue';
import { notify } from '../../stores/toasts.js';
import { auth, passwordReset as reset } from '../../auth/index.js';
import { PASSWORD_RULE, resetError, validEmail, validPassword } from '../../auth/passwordReset.js';

const route = useRoute();
const router = useRouter();
const stage = computed(() => route.meta.resetStage);
const email = ref(reset.getEmail());
const otp = ref('');
const newPassword = ref('');
const confirmPassword = ref('');
const visible = ref(false);
const errors = ref({});
function validate(field) {
  if (field === 'email') errors.value.email = !email.value.trim() ? 'សូមបញ្ចូលអាសយដ្ឋានអ៊ីមែល។' : !validEmail(email.value.trim()) ? 'សូមបញ្ចូលអាសយដ្ឋានអ៊ីមែលដែលត្រឹមត្រូវ។' : '';
  if (field === 'newPassword') errors.value.newPassword = !newPassword.value ? 'សូមបញ្ចូលពាក្យសម្ងាត់ថ្មី។' : !validPassword(newPassword.value) ? PASSWORD_RULE : '';
  if (field === 'confirmPassword') errors.value.confirmPassword = !confirmPassword.value ? 'សូមបញ្ជាក់ពាក្យសម្ងាត់។' : newPassword.value !== confirmPassword.value ? 'ពាក្យសម្ងាត់ និងការបញ្ជាក់ពាក្យសម្ងាត់ត្រូវតែដូចគ្នា។' : '';
  if (field === 'otp') errors.value.otp = /^\d{6}$/.test(otp.value) ? '' : 'សូមបញ្ចូលលេខកូដ ៦ ខ្ទង់។';
}
watch(email, () => { if (errors.value.email) validate('email'); });
watch(newPassword, () => { if (errors.value.newPassword) validate('newPassword'); if (errors.value.confirmPassword) validate('confirmPassword'); });
watch(confirmPassword, () => { if (errors.value.confirmPassword) validate('confirmPassword'); });
watch(otp, () => { errors.value.otp = ''; });
watch(() => reset.state.notice, message => { if (message && stage.value !== 'reset') { notify(message); reset.state.notice = ''; } }, { immediate: true });
const tick = ref(0);
const remaining = computed(() => { tick.value; return reset.remaining(); });
const timer = setInterval(() => { tick.value++; }, 1000);
const theme = ref(localStorage.getItem('app_theme') || 'light');
watch(theme, value => applyTheme(value), { immediate: true });
watch(stage, () => { errors.value = {}; otp.value = ''; newPassword.value = ''; confirmPassword.value = ''; visible.value = false; });
onUnmounted(() => { clearInterval(timer); otp.value = ''; newPassword.value = ''; confirmPassword.value = ''; });
const title = computed(() => ({ request: 'ភ្លេចពាក្យសម្ងាត់?', verify: 'ផ្ទៀងផ្ទាត់លេខកូដ', reset: 'កំណត់ពាក្យសម្ងាត់ថ្មី' })[stage.value]);
const subtitle = computed(() => ({ request: 'បញ្ចូលអ៊ីមែលរបស់អ្នក ដើម្បីទទួលលេខកូដកំណត់ពាក្យសម្ងាត់ថ្មី។', verify: 'បញ្ចូលលេខកូដ ៦ ខ្ទង់ ដែលបានផ្ញើទៅអ៊ីមែលរបស់អ្នក ដើម្បីកំណត់ពាក្យសម្ងាត់ថ្មី។', reset: 'កំណត់ពាក្យសម្ងាត់រឹងមាំ ដើម្បីរក្សាសុវត្ថិភាពគណនីរបស់អ្នក។' })[stage.value]);

async function submit() {
  if (reset.state.busy) return;
  errors.value = {};
  const phase = stage.value;
  const fields = phase === 'request' ? ['email'] : phase === 'verify' ? ['otp'] : ['newPassword', 'confirmPassword'];
  fields.forEach(validate);
  const invalid = fields.find(field => errors.value[field]);
  if (invalid) { document.getElementById({ email: 'reset-email', otp: 'reset-otp', newPassword: 'reset-new-password', confirmPassword: 'reset-confirm-password' }[invalid])?.focus(); return; }
  try {
    if (phase === 'request') { await reset.requestOtp(email.value); await router.replace('/verify-reset-otp'); }
    else if (phase === 'verify') { await reset.verifyOtp(otp.value); otp.value = ''; await router.replace('/reset-password'); }
    else { await reset.resetPassword(newPassword.value, confirmPassword.value); auth.clear(); newPassword.value = ''; confirmPassword.value = ''; email.value = ''; notify(reset.state.notice); reset.state.notice = ''; await router.replace('/login'); }
  } catch (cause) { notify(resetError(cause, phase), 'error'); }
  finally { tick.value++; }
}
async function resend() {
  if (reset.state.busy || remaining.value) return;
  errors.value = {}; otp.value = '';
  try { await reset.resendOtp(); }
  catch (cause) { notify(resetError(cause, 'resend'), 'error'); }
  finally { tick.value++; }
}
async function startAgain() { reset.clear(); await router.replace('/forgot-password'); }
async function backToLogin() { reset.clear(); await router.replace('/login'); }
</script>

<template>
  <div lang="km" class="auth-page" :class="{ dark: theme === 'dark' }">
    <div class="auth-topline"><span>បុគ្គលិក និងការងារ នៅក្នុងកន្លែងតែមួយ</span><button class="icon-button" aria-label="ប្តូរផ្ទៃពណ៌" @click="theme = theme === 'dark' ? 'light' : 'dark'"><Sun v-if="theme === 'dark'" :size="18"/><Moon v-else :size="18"/></button></div>
    <main class="auth-card">
      <aside class="auth-story">
        <BrandLogo/>
        <div class="story-copy"><span class="eyebrow">Garmora</span><h1>ស្ដារការចូលប្រើ<br/><span>កន្លែងការងាររបស់អ្នក</span></h1><p>ស្នើសុំលេខកូដ ផ្ទៀងផ្ទាត់អ៊ីមែល និងកំណត់ពាក្យសម្ងាត់ថ្មី។</p><div class="story-features"><span><ShieldCheck :size="18"/>ស្ដារគណនីដោយសុវត្ថិភាព</span></div></div>
        <div class="story-footer"><span>ធ្វើការរួមគ្នា<br/><strong>រីកចម្រើនរួមគ្នា</strong></span></div>
      </aside>
      <section class="auth-form-panel">
        <div class="auth-panel-top"><button class="text-button" :disabled="reset.state.busy" @click="backToLogin"><ArrowLeft :size="15"/>ត្រឡប់ទៅចូលប្រព័ន្ធ</button></div>
        <div class="auth-form-content">
          <h2>{{ title }}<span class="brand-dot">.</span></h2>
          <p class="form-subtitle">{{ subtitle }}</p>
          <form novalidate class="auth-form" :aria-busy="reset.state.busy" @submit.prevent="submit">
            <template v-if="stage === 'request'">
              <label for="reset-email">អាសយដ្ឋានអ៊ីមែល</label><div class="input-wrap"><Mail :size="18"/><input id="reset-email" v-model="email" :aria-invalid="Boolean(errors.email)" :aria-describedby="errors.email ? 'reset-email-error' : undefined" @blur="validate('email')" type="email" autocomplete="email" placeholder="you@example.com" :disabled="reset.state.busy" required/></div>
              <p v-if="errors.email" id="reset-email-error" class="field-error" role="alert">{{ errors.email }}</p>
            </template>
            <template v-else-if="stage === 'verify'">
              <label id="reset-otp-label" for="reset-otp">លេខកូដផ្ទៀងផ្ទាត់</label><OtpInput id="reset-otp" v-model="otp" :disabled="reset.state.busy" :error="errors.otp"/>
            </template>
            <template v-else>
              <label for="reset-new-password">ពាក្យសម្ងាត់ថ្មី</label><div class="input-wrap"><LockKeyhole :size="18"/><input id="reset-new-password" v-model="newPassword" :aria-invalid="Boolean(errors.newPassword)" :aria-describedby="errors.newPassword ? 'reset-new-password-error' : 'password-rule'" @blur="validate('newPassword')" :type="visible ? 'text' : 'password'" autocomplete="new-password" minlength="8" maxlength="30" :disabled="reset.state.busy" required/><button type="button" :disabled="reset.state.busy" :aria-label="visible ? 'លាក់ពាក្យសម្ងាត់' : 'បង្ហាញពាក្យសម្ងាត់'" @click="visible = !visible"><EyeOff v-if="visible" :size="18"/><Eye v-else :size="18"/></button></div>
              <p v-if="errors.newPassword" id="reset-new-password-error" class="field-error" role="alert">{{ errors.newPassword }}</p>
              <small id="password-rule">{{ PASSWORD_RULE }}</small>
              <label for="reset-confirm-password">បញ្ជាក់ពាក្យសម្ងាត់</label><div class="input-wrap"><LockKeyhole :size="18"/><input id="reset-confirm-password" v-model="confirmPassword" :aria-invalid="Boolean(errors.confirmPassword)" :aria-describedby="errors.confirmPassword ? 'reset-confirm-password-error' : undefined" @blur="validate('confirmPassword')" :type="visible ? 'text' : 'password'" autocomplete="new-password" minlength="8" maxlength="30" :disabled="reset.state.busy" required/></div>
              <p v-if="errors.confirmPassword" id="reset-confirm-password-error" class="field-error" role="alert">{{ errors.confirmPassword }}</p>
            </template>
            <button class="primary-button" type="submit" :disabled="reset.state.busy || (stage === 'request' && remaining > 0)">{{ reset.state.busy ? 'កំពុងដំណើរការ…' : stage === 'request' ? (remaining ? `ស្នើសុំម្តងទៀតក្នុង ${remaining} វិនាទី` : 'ទទួលលេខកូដផ្ទៀងផ្ទាត់') : stage === 'verify' ? 'ផ្ទៀងផ្ទាត់លេខកូដ' : 'កំណត់ពាក្យសម្ងាត់ថ្មី' }}<ArrowRight :size="18"/></button>
            <button v-if="stage === 'verify'" class="text-button resend-button" type="button" :disabled="reset.state.busy || remaining > 0" @click="resend">{{ remaining ? `ផ្ញើលេខកូដម្តងទៀតក្នុង ${remaining} វិនាទី` : 'ផ្ញើលេខកូដម្តងទៀត' }}</button>
            <button v-if="stage !== 'request'" class="text-button" type="button" :disabled="reset.state.busy" @click="startAgain">ចាប់ផ្តើមម្តងទៀតដោយបញ្ចូលអ៊ីមែល</button>
          </form>
        </div>
        <div class="auth-panel-footer"><ShieldCheck :size="14"/><span>បង្កើតឡើងសម្រាប់ក្រុមការងាររបស់អ្នក។</span></div>
      </section>
    </main>
  </div>
</template>
