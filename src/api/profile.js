import { normalizeUser } from '../auth/session.js';
import { validPassword, PASSWORD_RULE } from '../auth/passwordReset.js';

export const NOT_PROVIDED = 'មិនបានផ្តល់ (Not provided)';
export const editableFields = [
  ['newkhmer_name', 'khmer_name'], ['newEng_name', 'Eng_name'], ['newphone', 'phone'],
  ['gender', 'gender'], ['address', 'address'], ['date_of_birth', 'date_of_birth'],
  ['emergency_contact_name', 'emergency_contact_name'],
  ['emergency_contact_phone', 'emergency_contact_phone'],
  ['emergency_contact_relationship', 'emergency_contact_relationship'],
];
export function dateInput(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value) ? value.slice(0, 10) : '';
}
export function profileDraft(user) {
  const values = { ...user,
    khmer_name: user.khmer_name ?? user.nameKh,
    Eng_name: user.Eng_name ?? user.nameEn ?? user.eng_name,
    date_of_birth: user.date_of_birth ?? user.birthday ?? user.dob,
    gender: String(user.gender ?? '').toUpperCase(),
  };
  return Object.fromEntries(editableFields.map(([key, source]) => [key,
    source === 'date_of_birth' ? dateInput(values[source]) : values[source] ?? '']));
}
export function profileBody(draft) {
  const body = Object.fromEntries(editableFields.map(([key]) => [key,
    key === 'date_of_birth' ? draft[key] || null : String(draft[key] ?? '').trim()]));
  if (!body.gender) delete body.gender;
  else body.gender = body.gender.toUpperCase();
  return body;
}
export function profileValidation(draft, today) {
  const errors = {};
  for (const key of ['newkhmer_name', 'newEng_name', 'newphone']) {
    if (!String(draft[key] ?? '').trim()) errors[key] = 'សូមបំពេញព័ត៌មាននេះ។';
  }
  for (const key of ['newphone', 'emergency_contact_phone']) {
    const value = String(draft[key] ?? '').trim();
    if (value && !/^\+?[\d ()-]{6,25}$/.test(value)) errors[key] = 'សូមបញ្ចូលលេខទូរស័ព្ទត្រឹមត្រូវ។';
  }
  if (draft.gender && !['MALE', 'FEMALE'].includes(String(draft.gender).toUpperCase())) errors.gender = 'សូមជ្រើសរើសភេទត្រឹមត្រូវ។';
  const date = draft.date_of_birth;
  if (date && (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date || date > today)) errors.date_of_birth = 'សូមបញ្ចូលថ្ងៃខែឆ្នាំកំណើតត្រឹមត្រូវ។';
  return errors;
}
export function passwordValidation({ oldPassword, newPassword, confirmPass }) {
  if (!oldPassword || !newPassword || !confirmPass) return 'សូមបំពេញពាក្យសម្ងាត់គ្រប់ប្រអប់។';
  if (newPassword !== confirmPass) return 'ពាក្យសម្ងាត់ថ្មីទាំងពីរត្រូវតែដូចគ្នា។';
  if (oldPassword === newPassword) return 'ពាក្យសម្ងាត់ថ្មីត្រូវខុសពីពាក្យសម្ងាត់បច្ចុប្បន្ន។';
  if (!validPassword(newPassword)) return PASSWORD_RULE;
  return '';
}
export function displayValue(value) { return value == null || value === '' ? NOT_PROVIDED : value; }
export function displayDate(value) {
  const input = dateInput(value);
  if (!input) return NOT_PROVIDED;
  const date = new Date(`${input}T00:00:00`);
  const months = ['មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា', 'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ'];
  return Number.isNaN(date.getTime()) ? NOT_PROVIDED : `ថ្ងៃទី ${date.getDate()} ខែ${months[date.getMonth()]} ឆ្នាំ ${date.getFullYear()}`;
}
export function displaySalary(value) {
  return value == null || value === '' || !Number.isFinite(Number(value)) ? NOT_PROVIDED
    : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(value));
}
export function avatarUrl(value, baseUrl) {
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) return value;
  if (/^(?:[a-z]+:|\/\/)/i.test(value)) return '';
  return `${baseUrl.replace(/\/$/, '')}/${value.replace(/^\//, '')}`;
}
export function profileError(error) {
  const payload = error.response?.data;
  const details = payload?.details ?? payload?.errors;
  const messages = Array.isArray(details) ? details.map(item => typeof item === 'string' ? item : item?.message).filter(Boolean).join(' ') : '';
  const message = messages || payload?.message || payload?.msg || (typeof payload?.error === 'string' ? payload.error : '');
  if (message) return message;
  return ({
    400: 'ព័ត៌មានមិនត្រឹមត្រូវ។ សូមពិនិត្យម្តងទៀត។',
    401: 'សម័យចូលប្រព័ន្ធបានផុតកំណត់។ សូមចូលម្តងទៀត។',
    403: 'អ្នកមិនមានសិទ្ធិអនុវត្តសំណើនេះទេ។',
    404: 'រកមិនឃើញព័ត៌មានគណនី។',
    409: 'ព័ត៌មាននេះមានរួចហើយ ឬមានការប៉ះទង្គិច។',
    422: 'សូមពិនិត្យព័ត៌មានដែលបានបញ្ចូល។',
    429: 'សូមរង់ចាំ មុនពេលព្យាយាមម្តងទៀត។',
    500: 'ម៉ាស៊ីនមេមានបញ្ហា។ សូមព្យាយាមម្តងទៀត។',
  })[error.response?.status] || (error.request ? 'មិនអាចភ្ជាប់ទៅម៉ាស៊ីនមេបានទេ។ សូមពិនិត្យការតភ្ជាប់ ហើយព្យាយាមម្តងទៀត។' : error.message || 'សំណើមិនបានជោគជ័យ។ សូមព្យាយាមម្តងទៀត។');
}
export function createProfileApi({ request, session }) {
  async function call(method, url, data) {
    const response = await request({ method, url, data, headers: data instanceof FormData ? {} : { 'Content-Type': 'application/json' } });
    if (response.data?.result === false) throw Object.assign(new Error('Request failed'), { response: { status: 400, data: response.data } });
    return response.data;
  }
  return {
    async load() {
      const identity = session.state.user?.id;
      const version = session.getSessionVersion?.();
      const payload = await call('GET', '/getMe');
      if (version !== session.getSessionVersion?.()) throw new Error('Session changed. Please sign in again.');
      let user;
      try { user = normalizeUser(payload); }
      catch (error) { session.clear(error.message); throw error; }
      // Do not restore a user after they signed out while this request was pending.
      if (session.getAccessToken() && identity === session.state.user?.id) session.state.user = user;
      return user;
    },
    update: draft => call('PUT', '/updateProfile', profileBody(draft)),
    uploadAvatar: file => {
      const data = new FormData();
      data.append('avatar', file);
      return call('POST', '/upload-avatar', data);
    },
    updateAvatar: file => {
      const data = new FormData();
      data.append('avatar', file);
      return call('PUT', '/update-avatar', data);
    },
    deleteAvatar: () => call('DELETE', '/delete-avatar'),
    changePassword: credentials => {
      const error = passwordValidation(credentials);
      if (error) return Promise.reject(new Error(error));
      const { oldPassword, newPassword, confirmPass } = credentials;
      return call('PUT', '/change-password', { oldPassword, newPassword, confirmPass });
    },
  };
}
