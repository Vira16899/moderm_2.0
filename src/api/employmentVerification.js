export function employmentUserBody(value) {
  const text = String(value ?? '').trim();
  const id = Number(text);
  if (!/^\d+$/.test(text) || !Number.isSafeInteger(id) || id < 1) throw new Error('សូមជ្រើសរើស ឬបញ្ចូលលេខសម្គាល់បុគ្គលិកត្រឹមត្រូវ។');
  return { userId: id };
}

export function employmentEligibleUsers(users) {
  const unique = new Map();
  for (const user of users) {
    const role = String(user.role ?? user.role_name ?? ({2:'MANAGER',3:'EMPLOYEE'})[user.role_id] ?? '').toUpperCase();
    if (!['MANAGER', 'EMPLOYEE'].includes(role)) continue;
    try {
      const id = String(employmentUserBody(user.id ?? user.user_id).userId);
      if (!unique.has(id)) unique.set(id, {...user, id});
    } catch { /* Skip records without a usable employee ID. */ }
  }
  return [...unique.values()].sort((a,b) => String(a.nameKh || a.nameEn || a.khmer_name || '').localeCompare(String(b.nameKh || b.nameEn || b.khmer_name || '')));
}

export function employmentLetter(payload, expectedId) {
  if (payload?.result === false || payload?.ok === false) throw new Error(payload.msg || payload.message || payload.error || 'មិនអាចទាញយកលិខិតបានទេ។');
  const data = payload?.data?.data ?? payload?.data ?? payload;
  const employee = data?.employee;
  if (!employee || employee.id == null) throw new Error('មិនមានព័ត៌មានបុគ្គលិកសម្រាប់បង្កើតលិខិតទេ។');
  if (expectedId != null && String(employee.id) !== String(employmentUserBody(expectedId).userId)) throw new Error('ព័ត៌មានលិខិតមិនត្រូវនឹងបុគ្គលិកដែលបានជ្រើសទេ។');
  const date = String(data.generated_at ?? '').slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date)) || new Date(date).toISOString().slice(0,10) !== date) throw new Error('មិនមានកាលបរិច្ឆេទចេញលិខិតត្រឹមត្រូវទេ។');
  return { documentType: data.document_type || 'លិខិតបញ្ជាក់ការងារបុគ្គលិក', generatedAt: date, employee: { ...employee } };
}

export const letterValue = value => value == null || String(value).trim() === '' ? 'មិនបានផ្តល់' : String(value).trim();
export function letterDate(value) {
  const text = String(value ?? '').slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text) || Number.isNaN(Date.parse(text)) || new Date(text).toISOString().slice(0,10) !== text) return letterValue(null);
  const [year, month, day] = text.split('-');
  const months = ['មករា','កុម្ភៈ','មីនា','មេសា','ឧសភា','មិថុនា','កក្កដា','សីហា','កញ្ញា','តុលា','វិច្ឆិកា','ធ្នូ'];
  return `${Number(day)} ${months[Number(month)-1]} ${year}`;
}
export function letterSalary(value) {
  if (value == null || value === '' || !Number.isFinite(Number(value))) return letterValue(null);
  return new Intl.NumberFormat('en-US', { style:'currency', currency:'USD' }).format(Number(value));
}
export function employmentFilename(letter) { return `employment-verification-${employmentUserBody(letter.employee.id).userId}-${letter.generatedAt}.pdf`; }
