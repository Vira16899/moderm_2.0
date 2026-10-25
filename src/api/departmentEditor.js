export const positionNameKey = name => String(name ?? '').normalize('NFKC').trim().replace(/\s+/gu, ' ').toLocaleLowerCase();

export function validateDepartmentDraft(draft) {
  const errors = {};
  if (!String(draft.name ?? '').trim()) errors.name = 'សូមបញ្ចូលឈ្មោះនាយកដ្ឋាន។';
  if (!String(draft.description ?? '').trim()) errors.description = 'សូមបញ្ចូលការពិពណ៌នានាយកដ្ឋាន។';
  if (draft.user_id != null && draft.user_id !== '' && (!Number.isSafeInteger(Number(draft.user_id)) || Number(draft.user_id) < 1)) errors.manager = 'សូមជ្រើសរើសប្រធានផ្នែកត្រឹមត្រូវ។';
  const names = new Map();
  (draft.positions || []).forEach((row, index) => {
    const key = positionNameKey(row.name);
    if (!key) errors[`position-${index}`] = 'សូមបញ្ចូលឈ្មោះមុខតំណែង។';
    else if (names.has(key)) {
      errors[`position-${index}`] = 'ឈ្មោះមុខតំណែងស្ទួន។ សូមប្រើឈ្មោះផ្សេង។';
      errors[`position-${names.get(key)}`] = errors[`position-${index}`];
    } else names.set(key, index);
    if (!String(row.description ?? '').trim()) errors[`position-description-${index}`] = 'សូមបញ្ចូលការពិពណ៌នាមុខតំណែង។';
  });
  return errors;
}

export function departmentBody(draft, editing = false) {
  if (editing && (draft.departmentId == null || String(draft.departmentId).trim() === '')) throw new Error('មិនមានលេខសម្គាល់នាយកដ្ឋានសម្រាប់កែប្រែទេ។');
  const errors = validateDepartmentDraft(draft);
  if (Object.keys(errors).length) throw new Error(Object.values(errors)[0]);
  return {
    ...(editing ? { departmentId: draft.departmentId } : {}),
    name: draft.name.trim(), description: draft.description.trim(),
    user_id: draft.user_id == null || draft.user_id === '' ? null : Number(draft.user_id),
    positions: draft.positions.map(row => ({ ...(editing && row.positionId != null ? { positionId: row.positionId } : {}), name: row.name.trim(), description: row.description.trim() })),
    ...(editing ? { deletedPositionIds: draft.deletedPositionIds || [] } : {}),
  };
}

export const departmentId = record => record?.id ?? record?.departmentId ?? record?.department_id ?? record?.id_department;

export function unwrapDepartment(payload, expectedId) {
  let record = payload;
  for (let depth = 0; depth < 6; depth++) {
    if (record?.result === false || record?.ok === false) throw new Error(record.message || record.msg || record.error || 'មិនអាចទាញយកនាយកដ្ឋានបានទេ។');
    if (Array.isArray(record)) {
      record = expectedId != null ? record.find(item => String(departmentId(item)) === String(expectedId)) || (record.length === 1 && departmentId(record[0]) == null ? record[0] : null) : record.length === 1 ? record[0] : null;
    } else if (record?.department != null) record = record.department;
    else if (record?.data != null) record = record.data;
    else break;
  }
  if (!record || typeof record !== 'object' || Array.isArray(record) || !['id', 'departmentId', 'department_id', 'id_department', 'name', 'nameKh', 'department_name', 'departmentName', 'description', 'descriptionKh', 'positions'].some(key => Object.hasOwn(record, key))) throw new Error('មិនអាចផ្ទៀងផ្ទាត់ព័ត៌មាននាយកដ្ឋានពី API បានទេ។');
  const id = departmentId(record);
  if (expectedId != null && id != null && String(id) !== String(expectedId)) throw new Error('លេខសម្គាល់នាយកដ្ឋានពី API មិនត្រូវគ្នានឹងនាយកដ្ឋានដែលបានជ្រើសរើសទេ។');
  return record;
}

export function departmentDetail(payload, fallback = {}) {
  const selectedId = departmentId(fallback);
  const record = unwrapDepartment(payload, selectedId);
  const id = departmentId(record) ?? selectedId;
  if (id == null || String(id).trim() === '') throw new Error('មិនមានលេខសម្គាល់នាយកដ្ឋានត្រឹមត្រូវទេ។');
  const name = record.nameKh || record.khmer_name || record.name || record.department_name || record.departmentName || fallback.nameKh || fallback.name || fallback.nameEn;
  if (!name) throw new Error('API មិនបានផ្តល់ឈ្មោះនាយកដ្ឋានទេ។');
  const managerId = record.managerId ?? record.manager_id ?? record.user_id ?? record.manager?.id;
  const managerExplicitlyEmpty = ['managerId', 'manager_id', 'user_id', 'manager'].some(key => Object.hasOwn(record, key) && record[key] == null);
  const resolvedManager = managerExplicitlyEmpty && managerId == null ? '' : String(managerId ?? fallback.managerId ?? '');
  const sameManager = String(fallback.managerId ?? '') === resolvedManager;
  return {
    ...fallback, ...record, id: String(id), code: record.code || fallback.code || String(id),
    nameKh: name, nameEn: record.nameEn || record.Eng_name || record.eng_name || record.name || record.department_name || fallback.nameEn || name,
    descriptionKh: record.descriptionKh ?? record.description ?? record.department_description ?? fallback.descriptionKh ?? '',
    managerId: resolvedManager,
    managerNameKh: resolvedManager ? record.managerNameKh || record.manager_khmer_name || record.manager_name || record.manager?.khmer_name || record.manager?.name || (sameManager ? fallback.managerNameKh : '') || '' : '',
    managerNameEn: resolvedManager ? record.managerNameEn || record.manager_Eng_name || record.manager?.Eng_name || (sameManager ? fallback.managerNameEn : '') || '' : '',
    managerAvatar: resolvedManager ? record.managerAvatar || record.manager_avatar || record.manager?.avatar || (sameManager ? fallback.managerAvatar : '') || '' : '',
    employeeCount: Number(record.employeeCount ?? record.employee_count ?? fallback.employeeCount ?? record.employees?.length ?? 0),
    employees: record.employees ?? fallback.employees ?? [], positions: record.positions ?? fallback.positions ?? [],
    employeesProvided: record.employeesProvided ?? Object.hasOwn(record, 'employees'),
  };
}

export function editorPositions(payload) {
  const data = payload?.data?.data ?? payload?.data ?? payload;
  const rows = Array.isArray(data) ? data : data?.positions;
  if (!Array.isArray(rows)) throw new Error('មិនអាចផ្ទៀងផ្ទាត់បញ្ជីមុខតំណែងពី API បានទេ។');
  return rows.filter(row => row && typeof row === 'object').map(row => ({
    positionId: row.positionId ?? row.position_id ?? row.id,
    departmentId: row.departmentId ?? row.department_id ?? row.department?.id,
    name: row.name || row.nameKh || row.position_name || row.khmer_name || '',
    description: row.description ?? row.descriptionKh ?? row.position_description,
  }));
}

export function positionsForEditor(department, allPositions) {
  const byId = new Map();
  for (const row of allPositions) if (String(row.departmentId) === String(department.departmentId ?? department.id)) {
    if (row.positionId == null) throw new Error('API មិនបានផ្តល់លេខសម្គាល់មុខតំណែង។');
    byId.set(String(row.positionId), { positionId: row.positionId, name: row.name, description: row.description });
  }
  if (department.positions != null && !Array.isArray(department.positions)) throw new Error('ទិន្នន័យមុខតំណែងនាយកដ្ឋានមិនត្រឹមត្រូវ។');
  for (const row of editorPositions(department.positions || [])) {
    if (row.positionId == null) throw new Error('API មិនបានផ្តល់លេខសម្គាល់មុខតំណែង។');
    byId.set(String(row.positionId), { positionId: row.positionId, name: row.name, description: row.description ?? byId.get(String(row.positionId))?.description });
  }
  return [...byId.values()];
}

export function positionBody(position, editing = false) {
  const id = position.id ?? position.positionId;
  const departmentId = position.department_id ?? position.departmentId;
  if (editing && (id == null || id === '')) throw new Error('មិនមានលេខសម្គាល់មុខតំណែងទេ។');
  if (departmentId == null || departmentId === '') throw new Error('សូមជ្រើសរើសនាយកដ្ឋាន។');
  if (!String(position.name ?? '').trim() || !String(position.description ?? '').trim()) throw new Error('សូមបញ្ចូលឈ្មោះ និងការពិពណ៌នាមុខតំណែង។');
  const normalizeId = value => /^\d+$/.test(String(value)) ? Number(value) : value;
  return { ...(editing ? { id: normalizeId(id) } : {}), name: position.name.trim(), description: position.description.trim(), department_id: normalizeId(departmentId) };
}

export const positionFingerprint = row => JSON.stringify([row.name.trim(), String(row.description ?? '').trim()]);

function checkSuccess(result) {
  if (result?.result === false || result?.ok === false) throw new Error(result.error || result.message || result.msg || 'API មិនបានរក្សាទុកទេ។');
  if (result?.result !== true && result?.ok !== true) throw new Error('API មិនបានបញ្ជាក់ការរក្សាទុកទេ។');
}

// Rows record acknowledged writes, so retrying a later failure does not create duplicates.
export async function savePositionRows(api, rows, departmentId) {
  for (const row of rows) {
    if (row.creationAcknowledged && row.positionId == null) {
      const matches = editorPositions(await api.getPositions()).filter(position => String(position.departmentId) === String(departmentId) && positionNameKey(position.name) === positionNameKey(row.acknowledgedName));
      if (matches.length !== 1 || matches[0].positionId == null) throw new Error('មុខតំណែងត្រូវបានបង្កើត ប៉ុន្តែ API មិនបានផ្តល់លេខសម្គាល់ច្បាស់លាស់។ សូមផ្ទៀងផ្ទាត់ម្តងទៀត។');
      row.positionId = matches[0].positionId;
    }
    const fingerprint = positionFingerprint(row);
    if (row.positionId != null) {
      if (row.savedFingerprint === fingerprint) continue;
      checkSuccess(await api.updatePosition(positionBody({ ...row, departmentId }, true)));
      row.savedFingerprint = fingerprint;
    } else {
      const result = await api.createPosition(positionBody({ ...row, departmentId }));
      checkSuccess(result);
      row.creationAcknowledged = true; row.acknowledgedName = row.name.trim(); row.savedFingerprint = fingerprint;
      const data = result?.data?.data ?? result?.data ?? result;
      const record = data?.position ?? data;
      row.positionId = record?.id ?? record?.positionId ?? record?.position_id;
      if (row.positionId == null) {
        const matches = editorPositions(await api.getPositions()).filter(position => String(position.departmentId) === String(departmentId) && positionNameKey(position.name) === positionNameKey(row.name));
        if (matches.length !== 1 || matches[0].positionId == null) throw new Error('មុខតំណែងត្រូវបានបង្កើត ប៉ុន្តែមិនអាចផ្ទៀងផ្ទាត់លេខសម្គាល់ពី API បានទេ។');
        row.positionId = matches[0].positionId;
      }
    }
  }
}

export async function deletePositionAndVerify(api, positionId, departmentId, alreadyDeleted = false) {
  let deleted = alreadyDeleted;
  try {
    if (!deleted) {
      const response = await api.deletePosition(positionId, departmentId);
      if (response?.result === false || response?.ok === false) throw new Error(response.message || response.msg || response.error || 'API មិនបានលុបមុខតំណែងទេ។');
      if (response?.result !== true && response?.ok !== true) throw new Error('API មិនបានបញ្ជាក់ការលុបមុខតំណែងទេ។');
      deleted = true;
    }
    const [positionPayload, departmentPayload] = await Promise.all([api.getPositions(), api.getDepartment(departmentId)]);
    const positions = editorPositions(positionPayload);
    const department = unwrapDepartment(departmentPayload, departmentId);
    if (!Array.isArray(department.positions)) throw new Error('API មិនបានផ្តល់បញ្ជីមុខតំណែងក្នុងនាយកដ្ឋាន ដើម្បីផ្ទៀងផ្ទាត់ការលុបទំនាក់ទំនងទេ។');
    const references = editorPositions(department.positions || []);
    const same = value => String(value) === String(positionId);
    const employeeReference = Array.isArray(department.employees) && department.employees.some(user => same(user.positionId ?? user.position_id ?? user.position?.id));
    if (positions.some(row => same(row.positionId)) || references.some(row => same(row.positionId)) || employeeReference) {
      throw new Error('API បានឆ្លើយថាលុបជោគជ័យ ប៉ុន្តែមុខតំណែង ឬទំនាក់ទំនងរបស់វានៅតែមានក្នុងនាយកដ្ឋាន។ សូមពិនិត្យការលុបជាបន្តបន្ទាប់នៅ backend រួចផ្ទៀងផ្ទាត់ម្តងទៀត។');
    }
    return { department, positions };
  } catch (cause) { cause.deletionAcknowledged = deleted; throw cause; }
}
