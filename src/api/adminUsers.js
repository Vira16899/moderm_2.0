import { validEmail, validPassword, PASSWORD_RULE } from '../auth/passwordReset.js';

export const isProtectedAdminId = id => String(id ?? '').trim() === '1';

export function userIdentityFields(user = {}, fallback = {}) {
  const sources = [user, user.employee, user.profile, fallback].filter(Boolean);
  const first = keys => {
    for (const source of sources) {
      for (const key of keys) {
        const value = source[key];
        if (value != null && String(value).trim() !== '') return String(value).trim();
      }
    }
    return '';
  };
  return {
    joinedDate: first(['joinedDate', 'hireDate', 'hire_date', 'joinedAt', 'joined_at']).slice(0, 10),
    idCardNumber: first(['idCardNumber', 'id_card_number']),
  };
}

export function userIdBody(id) {
  if (id == null || String(id).trim() === '') throw new Error('User ID is required.');
  const value = String(id).trim();
  return { id: /^\d+$/.test(value) && Number.isSafeInteger(Number(value)) ? Number(value) : value };
}

export function departmentHasOtherManager(departmentId, userId, departments = [], users = []) {
  if (departmentId == null || departmentId === '') return false;
  const department = departments.find(item => String(item.id) === String(departmentId));
  const managerId = department?.managerId || department?.manager_id || department?.user_id || department?.manager?.id;
  if (managerId && String(managerId) !== '0' && String(managerId) !== String(userId)) return true;
  return users.some(user => String(user.role).toUpperCase() === 'MANAGER'
    && String(user.departmentId ?? user.department_id ?? '') === String(departmentId)
    && String(user.id) !== String(userId));
}

export function createUserBody(user) {
  const role = { MANAGER: 2, EMPLOYEE: 3 }[user.role];
  if (!role) throw new Error('Choose a manager or employee role.');
  return {
    email: user.email.trim(), password: user.password,
    khmer_name: user.nameKh.trim(), Eng_name: user.nameEn.trim(),
    phone: user.phone.trim(), gender: user.gender.toUpperCase(),
    hireDate: user.joinedDate, birthday: user.dob,
    role_id: role, department_id: Number(user.departmentId),
    ...(role === 3 ? { position_id: Number(user.positionId) } : {}),
    base_salary: Number(user.salary),
    id_card_number: String(user.idCardNumber ?? user.id_card_number ?? '').trim(),
    nationality: String(user.nationality ?? '').trim(),
  };
}

export function updateUserBody(user) {
  const role = String(user.role ?? '').toUpperCase();
  const body = {
    ...userIdBody(user.id),
    khmer_name: String(user.nameKh ?? '').trim(),
    Eng_name: String(user.nameEn ?? '').trim(),
    phone: String(user.phone ?? '').trim(),
    gender: String(user.gender ?? '').toUpperCase(),
    role,
  };
  // Managers have a department but no employee position.
  if (role === 'EMPLOYEE' || role === 'MANAGER') {
    const departmentId = Number(user.departmentId);
    if (!Number.isSafeInteger(departmentId) || departmentId < 1) throw new Error('សូមជ្រើសរើសនាយកដ្ឋានត្រឹមត្រូវ។');
    body.department_id = departmentId;
  }
  if (role === 'EMPLOYEE') {
    const positionId = Number(user.positionId);
    if (!Number.isSafeInteger(positionId) || positionId < 1) throw new Error('សូមជ្រើសរើសមុខតំណែងត្រឹមត្រូវ។');
    if (user.positionDepartmentId != null && String(user.positionDepartmentId) !== String(body.department_id)) {
      throw new Error('នាយកដ្ឋាន និងមុខតំណែងមិនត្រូវគ្នាទេ។ សូមជ្រើសរើសទាំងពីរឡើងវិញ។');
    }
    body.position_id = positionId;
  }
  return body;
}

export function validateCreateUser(user, departments, positions) {
  const errors = {};
  for (const field of ['nameKh', 'nameEn', 'phone', 'idCardNumber', 'nationality']) {
    if (!String(user[field] ?? '').trim()) errors[field] = 'សូមបំពេញព័ត៌មាននេះ។';
  }
  if (user.phone?.trim() && !/^\+?[\d ()-]{6,25}$/.test(user.phone.trim())) errors.phone = 'សូមបញ្ចូលលេខទូរស័ព្ទត្រឹមត្រូវ។';
  if (!validEmail(String(user.email ?? '').trim())) errors.email = 'សូមបញ្ចូលអ៊ីមែលត្រឹមត្រូវ។';
  if (!validPassword(user.password ?? '')) errors.password = PASSWORD_RULE;
  if (!['MANAGER', 'EMPLOYEE'].includes(user.role)) errors.role = 'សូមជ្រើសរើសតួនាទី។';
  if (!['male', 'female'].includes(user.gender)) errors.gender = 'សូមជ្រើសរើសភេទ។';
  if (!departments.some((item) => String(item.id) === String(user.departmentId))) errors.departmentId = 'សូមជ្រើសរើសនាយកដ្ឋាន។';
  if (user.role === 'EMPLOYEE' && !positions.some((item) => String(item.id) === String(user.positionId) && String(item.departmentId ?? item.department_id) === String(user.departmentId))) errors.positionId = 'សូមជ្រើសរើសមុខតំណែងក្នុងនាយកដ្ឋានដែលបានជ្រើស។';
  const validDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value ?? '') && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
  if (!validDate(user.dob) || user.dob > new Date().toLocaleDateString('en-CA')) errors.dob = 'សូមបញ្ចូលថ្ងៃខែឆ្នាំកំណើតត្រឹមត្រូវ។';
  if (!validDate(user.joinedDate)) errors.joinedDate = 'សូមបញ្ចូលកាលបរិច្ឆេទចូលធ្វើការត្រឹមត្រូវ។';
  else if (validDate(user.dob) && user.joinedDate < user.dob) errors.joinedDate = 'កាលបរិច្ឆេទចូលធ្វើការត្រូវនៅក្រោយថ្ងៃកំណើត។';
  if (user.salary === '' || user.salary == null || !Number.isFinite(Number(user.salary)) || Number(user.salary) < 0) errors.salary = 'សូមបញ្ចូលប្រាក់ខែចាប់ពី 0 ឡើងទៅ។';
  return errors;
}

export function userList(payload) {
  const data = payload?.data?.data ?? payload?.data ?? payload;
  const users = Array.isArray(data) ? data : data?.users;
  if (!Array.isArray(users)) throw new Error('Invalid user list response.');
  const byId = new Map();
  for (const user of users) {
    if (!user || typeof user !== 'object') continue;
    const id = user.id ?? user.user_id;
    if (id == null || id === '') continue;
    const key = String(id);
    const existing = byId.get(key);
    const assignments = existing?.departmentAssignments || [];
    const departmentId = user.departmentId ?? user.department_id;
    if (departmentId != null && departmentId !== '' && !assignments.some(item => item.id === String(departmentId))) assignments.push({id:String(departmentId),nameKh:user.departmentKh || user.department_name || user.department?.name || '',nameEn:user.departmentEn || user.department_name_en || ''});
    byId.set(key, {...(existing || user), departmentAssignments:assignments});
  }
  return [...byId.values()];
}

export function unwrapUser(payload) {
  const data = payload?.data?.data ?? payload?.data ?? payload;
  const user = data?.user ?? (Array.isArray(data) ? data[0] : data);
  return user && (user.id != null || user.user_id != null) ? user : null;
}
