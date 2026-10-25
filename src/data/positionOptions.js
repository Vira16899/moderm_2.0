// Position names and IDs from the supplied database table. Backend position
// records can update these labels when they are returned by the API.
const POSITION_NAMES = [
  // 'អ្នកគ្រប់គ្រងផ្នែកឃ្លាំង និងដឹកជញ្ជូន',
  'បុគ្គលិកឃ្លាំង',
  'បុគ្គលិកដឹកជញ្ជូន',
];
// The supplied position catalogue groups positions by their owning department.
const POSITION_DEPARTMENT_IDS = [1, 1, 1, 2, 2, 2, 3, 3, 4, 4, 5, 5];
export const POSITION_OPTIONS = POSITION_NAMES.map((nameKh, index) => ({
  id: String(index + 1),
  nameKh,
  nameEn: '',
  departmentId: String(POSITION_DEPARTMENT_IDS[index]),
}));

export function buildPositionOptions(departments = [], users = []) {
  const byId = new Map();
  const add = (id, nameKh, nameEn, departmentId) => {
    if (!/^\d+$/.test(String(id ?? '')) || Number(id) < 1) return;
    const key = String(Number(id));
    const existing = byId.get(key);
    byId.set(key, {
      id: key,
      nameKh: nameKh || existing?.nameKh || `មុខតំណែង ${key}`,
      nameEn: nameEn || existing?.nameEn || '',
      departmentId: departmentId == null || departmentId === '' ? existing?.departmentId : String(departmentId),
    });
  };
  for (const user of users) {
    add(user.positionId || user.position_id || user.position?.id,
      user.positionKh || user.position_name || user.position?.name,
      user.positionEn || user.position_name_en,
      user.departmentId || user.department_id || user.department?.id);
  }
  for (const department of departments) {
    for (const employee of department.employees ?? []) {
      add(employee.positionId || employee.position_id || employee.position?.id,
        employee.positionKh || employee.position_name || employee.position?.name,
        employee.positionEn || employee.position_name_en,
        department.id);
    }
    for (const position of department.positions ?? []) {
      add(position.positionId ?? position.id ?? position.position_id, position.nameKh || position.name || position.position_name,
        position.nameEn, position.department_id ?? position.departmentId ?? department.id);
    }
  }
  return [...byId.values()].sort((first, second) => Number(first.id) - Number(second.id));
}

export function positionsForDepartment(positions, departmentId) {
  if (departmentId == null || departmentId === '') return [];
  return positions.filter((position) => String(position.departmentId ?? '') === String(departmentId));
}

// The position endpoint is authoritative; department data only fills ownership
// fields omitted by that endpoint, without restoring deleted catalogue entries.
export function mergePositionOptions(positions, departments) {
  const known = new Map(buildPositionOptions(departments).map(position => [String(position.id), position]));
  return positions.map(position => ({ ...known.get(String(position.id)), ...position, departmentId: position.departmentId ?? known.get(String(position.id))?.departmentId }));
}

export function defaultUserDepartment(departments, positions, role = 'EMPLOYEE') {
  const department = departments.find(item => role !== 'EMPLOYEE' || positionsForDepartment(positions, item.id).length > 0);
  return department ? String(department.id) : '';
}
