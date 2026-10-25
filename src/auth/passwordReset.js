import { unwrap } from './session.js';

export const RESET_NOTICE = 'ប្រសិនបើមានគណនីប្រើអ៊ីមែលនេះ លេខកូដកំណត់ពាក្យសម្ងាត់ថ្មីត្រូវបានផ្ញើរួចហើយ។ សូមពិនិត្យប្រអប់សារអ៊ីមែលរបស់អ្នក។';
export const RESET_SUCCESS = 'ពាក្យសម្ងាត់របស់អ្នកត្រូវបានកំណត់ថ្មីដោយជោគជ័យ។ សូមចូលប្រព័ន្ធដោយប្រើពាក្យសម្ងាត់ថ្មី។';
export const PASSWORD_RULE = 'ប្រើពី ៨ ដល់ ៣០ តួអក្សរ រួមមានអក្សរឡាតាំងធំ អក្សរឡាតាំងតូច លេខ និងសញ្ញាពិសេស ដោយមិនមានដកឃ្លា។';
export function validEmail(email) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); }
export function validPassword(password) {
  return password.length >= 8 && password.length <= 30 && /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d\s])\S+$/.test(password);
}

export function resetError(error, phase) {
  if (error.resetMessage) return error.resetMessage;
  const status = error.response?.status;
  if (status === 429) return 'អ្នកបានព្យាយាមច្រើនដងពេក។ សូមរង់ចាំ មុនពេលព្យាយាមម្តងទៀត។';
  if (!error.response && error.request) return 'មិនអាចភ្ជាប់ទៅម៉ាស៊ីនមេបានទេ។ សូមពិនិត្យការតភ្ជាប់អ៊ីនធឺណិត ហើយព្យាយាមម្តងទៀត។';
  if (status >= 500) return 'ម៉ាស៊ីនមេមិនអាចបំពេញសំណើនេះបានទេ។ សូមព្យាយាមម្តងទៀតនៅពេលក្រោយ។';
  if (phase === 'verify') return 'លេខកូដកំណត់ពាក្យសម្ងាត់ថ្មីមិនត្រឹមត្រូវ ឬផុតកំណត់។ សូមព្យាយាមម្តងទៀត ឬស្នើសុំលេខកូដថ្មី។';
  if (phase === 'reset') {
    const details = error.response?.data?.details;
    const messages = Array.isArray(details) ? details.map(item => typeof item === 'string' ? item : item?.message || '').join(' ') : '';
    if (/password.*(character|uppercase|lowercase|number|special|space|length|least|exceed)/i.test(messages)) return PASSWORD_RULE;
    if (/confirm.*match|password.*match/i.test(messages)) return 'ពាក្យសម្ងាត់ និងការបញ្ជាក់ពាក្យសម្ងាត់ត្រូវតែដូចគ្នា។';
    return 'សិទ្ធិកំណត់ពាក្យសម្ងាត់ថ្មីមិនត្រឹមត្រូវ ឬផុតកំណត់។ សូមស្នើសុំលេខកូដថ្មី។';
  }
  // Never display backend account-existence/status messages on request or resend.
  return 'មិនអាចដំណើរការសំណើកំណត់ពាក្យសម្ងាត់ថ្មីបានទេ។ សូមព្យាយាមម្តងទៀតនៅពេលក្រោយ។';
}
const localError = (message) => Object.assign(new Error(message), { resetMessage: message });

export function createPasswordReset({ request, storage, now = Date.now, state = { busy: false, notice: '' } }) {
  const key = 'modern_factory_password_reset';
  const lifetime = 15 * 60 * 1000;
  let generation = 0;
  const read = () => {
    try {
      const value = JSON.parse(storage.getItem(key));
      if (!value || !validEmail(value.email) || !Number.isFinite(value.expiresAt) || value.expiresAt <= now()) {
        storage.removeItem(key); return null;
      }
      return value;
    } catch { storage.removeItem(key); return null; }
  };
  const save = (value) => storage.setItem(key, JSON.stringify(value));
  const clear = () => { generation++; storage.removeItem(key); state.notice = ''; };
  const call = async (method, url, data) => {
    const response = await request({ method, url, data, skipAuth: true });
    if (response.data?.result === false) {
      throw Object.assign(new Error('Reset request failed'), { response: { status: 400, data: response.data } });
    }
    return response;
  };
  const run = async (action) => {
    if (state.busy) throw localError('កំពុងដំណើរការសំណើរបស់អ្នក។ សូមរង់ចាំ។');
    const version = generation;
    state.busy = true;
    try { return await action(() => {
      if (version !== generation) throw localError('សំណើកំណត់ពាក្យសម្ងាត់ថ្មីនេះត្រូវបានបោះបង់។ សូមចាប់ផ្តើមម្តងទៀត។');
    }); } finally { state.busy = false; }
  };
  const throttle = (error) => {
    if (error.response?.status !== 429) return;
    const value = read();
    if (!value) return;
    const retryAfter = error.response.headers?.['retry-after'];
    const seconds = Number(retryAfter);
    const until = Number.isFinite(seconds) && seconds > 0 ? now() + seconds * 1000 : Date.parse(retryAfter);
    save({ ...value, resendAt: Math.max(now() + 30000, Number.isFinite(until) ? until : 0) });
  };
  return {
    state, clear,
    getEmail: () => read()?.email || '',
    hasResetToken: () => Boolean(read()?.resetToken),
    remaining: () => Math.max(0, Math.ceil(((read()?.resendAt || 0) - now()) / 1000)),
    async requestOtp(input) {
      const email = input.trim();
      if (!validEmail(email)) throw localError('សូមបញ្ចូលអាសយដ្ឋានអ៊ីមែលដែលត្រឹមត្រូវ។');
      if (read()?.resendAt > now()) throw localError('សូមរង់ចាំ មុនពេលស្នើសុំលេខកូដម្តងទៀត។');
      return run(async check => {
        try {
          await call('POST', '/forgot-password', { email }); check();
          save({ email, expiresAt: now() + lifetime, resendAt: now() + 30000 });
          state.notice = RESET_NOTICE;
        } catch (error) {
          check();
          if (error.response?.status === 429) {
            save({ email, expiresAt: now() + lifetime, resendAt: now() + 30000 }); throttle(error);
          }
          throw error;
        }
      });
    },
    async resendOtp() {
      const value = read();
      if (!value) throw localError('សំណើកំណត់ពាក្យសម្ងាត់ថ្មីរបស់អ្នកបានផុតកំណត់។ សូមចាប់ផ្តើមម្តងទៀត។');
      if (value.resendAt > now()) throw localError('សូមរង់ចាំ មុនពេលស្នើសុំលេខកូដម្តងទៀត។');
      return run(async check => {
        try {
          await call('POST', '/resend-reset-otp', { email: value.email }); check();
          save({ email: value.email, expiresAt: now() + lifetime, resendAt: now() + 30000 });
          state.notice = RESET_NOTICE;
        } catch (error) { check(); throttle(error); throw error; }
      });
    },
    async verifyOtp(otp) {
      const value = read();
      if (!value) throw localError('សំណើកំណត់ពាក្យសម្ងាត់ថ្មីរបស់អ្នកបានផុតកំណត់។ សូមចាប់ផ្តើមម្តងទៀត។');
      if (!/^\d{6}$/.test(otp)) throw localError('សូមបញ្ចូលលេខកូដកំណត់ពាក្យសម្ងាត់ថ្មី ៦ ខ្ទង់។');
      return run(async check => {
        try {
          const response = await call('POST', '/verify-reset-otp', { email: value.email, otp }); check();
          const data = unwrap(response.data);
          const resetToken = data?.resetToken ?? data?.token;
          if (typeof resetToken !== 'string' || !resetToken) {
            throw localError('មិនអាចទទួលបានសិទ្ធិកំណត់ពាក្យសម្ងាត់ថ្មីពីម៉ាស៊ីនមេបានទេ។ សូមទាក់ទងអ្នកគ្រប់គ្រងប្រព័ន្ធ។');
          }
          save({ ...value, resetToken, expiresAt: Math.min(value.expiresAt, now() + lifetime) });
          state.notice = '';
        } catch (error) { check(); throttle(error); throw error; }
      });
    },
    async resetPassword(newPassword, confirmPassword) {
      const value = read();
      if (!value?.resetToken) throw localError('សិទ្ធិកំណត់ពាក្យសម្ងាត់ថ្មីរបស់អ្នកបានផុតកំណត់។ សូមស្នើសុំលេខកូដថ្មី។');
      if (!validPassword(newPassword)) throw localError(PASSWORD_RULE);
      if (newPassword !== confirmPassword) throw localError('ពាក្យសម្ងាត់ និងការបញ្ជាក់ពាក្យសម្ងាត់ត្រូវតែដូចគ្នា។');
      return run(async check => {
        try {
          await call('PUT', '/reset-password', { token: value.resetToken, newPassword, confirmPass: confirmPassword }); check();
          clear(); state.notice = RESET_SUCCESS;
        } catch (error) { check(); throttle(error); throw error; }
      });
    },
  };
}

export function createResetGuard(reset) {
  return (to) => {
    if (to.meta.resetStage === 'verify' && !reset.getEmail()) return '/forgot-password';
    if (to.meta.resetStage === 'reset' && !reset.hasResetToken()) return reset.getEmail() ? '/verify-reset-otp' : '/forgot-password';
    return true;
  };
}
