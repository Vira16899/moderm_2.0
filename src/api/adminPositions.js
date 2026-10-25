export function positionList(payload) {
  const data = payload?.data?.data ?? payload?.data ?? payload;
  const records = Array.isArray(data) ? data : data?.positions;
  if (!Array.isArray(records)) throw new Error('Invalid position list response.');
  const positions = new Map();
  for (const record of records) {
    const id = record?.positionId ?? record?.id ?? record?.position_id;
    if (!/^\d+$/.test(String(id ?? '')) || !Number.isSafeInteger(Number(id)) || Number(id) < 1) continue;
    const key = String(Number(id));
    positions.set(key, {
      id: key,
      nameKh: record.nameKh || record.khmer_name || record.position_name || record.name || '',
      nameEn: record.nameEn || record.Eng_name || record.eng_name || record.position_name_en || '',
      ...((record.departmentId ?? record.department_id ?? record.department?.id) != null ? { departmentId: record.departmentId ?? record.department_id ?? record.department?.id } : {}),
    });
  }
  return [...positions.values()];
}
