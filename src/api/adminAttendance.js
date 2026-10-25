export const sessionLabels = {
  MORNING_CHECK_IN: 'ចូលធ្វើការពេលព្រឹក',
  MORNING_CHECK_OUT: 'ចេញពីការងារពេលព្រឹក',
  AFTERNOON_CHECK_IN: 'ចូលធ្វើការពេលរសៀល',
  AFTERNOON_CHECK_OUT: 'ចេញពីការងារពេលរសៀល',
};

export function attendanceDateError(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value ?? '') || !Number.isFinite(Date.parse(value)) || new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) !== value) return 'សូមជ្រើសរើសកាលបរិច្ឆេទត្រឹមត្រូវ។';
  return '';
}

export function attendanceQrForDate(payload, date) {
  return attendanceQrItems(payload).filter(item => !item.date || item.date === date);
}

function unwrap(payload) { return payload?.data?.data ?? payload?.data ?? payload; }

export function attendanceQrItems(payload) {
  const data = unwrap(payload);
  const rows = Array.isArray(data) ? data : data?.sessions ?? data?.qr_sessions ?? [data];
  return rows.filter(row => row && typeof row === 'object' && (row.is_active == null || Number(row.is_active) === 1)).map((row, index) => {
    let image = row.qr_image ?? row.qrImage ?? row.qr_url ?? row.qrUrl ?? row.image_url ?? row.imageUrl ?? row.image ?? '';
    if (typeof image !== 'string') image = '';
    if (image.length > 100 && /^[A-Za-z0-9+/=\r\n]+$/.test(image)) image = `data:image/png;base64,${image.replace(/\s/g, '')}`;
    if (!/^(https?:\/\/|data:image\/(?:png|jpeg|webp|gif);base64,|\/)/i.test(image)) image = '';
    const token = row.qr_token ?? row.qrToken ?? row.qr_code ?? row.qrCode ?? row.token;
    return {
      id: String(row.id ?? row.session_id ?? index), image,
      value: typeof token === 'string' || typeof token === 'number' ? String(token) : '',
      label: sessionLabels[row.session_type] || 'QR វត្តមាន',
      date: String(row.attendance_date ?? row.date ?? data?.attendance_date ?? '').slice(0, 10),
      from: row.available_from ?? '', until: row.available_until ?? '',
    };
  }).filter(row => row.image || row.value);
}

export function attendanceRecords(payload) {
  const data = unwrap(payload);
  const rows = Array.isArray(data) ? data : data?.records ?? data?.attendance ?? data?.attendanceRecords ?? data?.attendance_records;
  if (!Array.isArray(rows)) throw new Error('មិនអាចអានកំណត់ត្រាវត្តមានបានទេ។ សូមព្យាយាមម្ដងទៀត។');
  return rows.filter(row => row && typeof row === 'object').map((row, index) => ({
    id: row.id ?? row.attendance_id ?? `${row.user_id ?? row.employee_id ?? 'record'}-${index}`,
    name: row.khmer_name ?? row.employee_name ?? row.nameKh ?? row.name ?? row.user?.khmer_name ?? '',
    nameEn: row.Eng_name ?? row.nameEn ?? row.user?.Eng_name ?? '',
    employeeId: row.user_id ?? row.employee_id ?? row.id_user ?? row.user?.id ?? '',
    avatar: row.avatar ?? row.profile_image ?? row.user?.avatar ?? row.user?.profile_image ?? '',
    department: row.department_name ?? row.departmentKh ?? row.department?.name ?? '',
    date: String(row.attendance_date ?? row.date ?? row.created_at ?? '').slice(0, 10),
    checkIn: row.check_in ?? row.check_in_time ?? row.clock_in ?? row.time_in ?? '',
    checkOut: row.check_out ?? row.check_out_time ?? row.clock_out ?? row.time_out ?? '',
    status: String(row.status ?? row.attendance_status ?? '').toLowerCase(),
  }));
}

export function attendanceStatus(status) {
  return ({ present: 'មានវត្តមាន', late: 'យឺត', absent: 'អវត្តមាន', early: 'ចេញមុនម៉ោង', on_time: 'ទាន់ម៉ោង', checked_in: 'បានចូល', checked_out: 'បានចេញ', pending: 'រង់ចាំ' })[status] || 'មិនបានបញ្ជាក់';
}
