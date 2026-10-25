// Khmer display labels for stored workflow codes.
export const labels = {
  active: 'សកម្ម', inactive: 'អសកម្ម',
  ADMIN: 'អ្នកគ្រប់គ្រងប្រព័ន្ធ', MANAGER: 'ប្រធានផ្នែក', EMPLOYEE: 'បុគ្គលិក',
  pending: 'រង់ចាំពិនិត្យ', submitted: 'បានដាក់ស្នើ', reviewed: 'បានពិនិត្យ', approved: 'បានអនុម័ត', rejected: 'បានបដិសេធ', draft: 'សេចក្តីព្រាង', completed: 'បានបញ្ចប់',
  annual: 'ច្បាប់ប្រចាំឆ្នាំ', sick: 'ច្បាប់ឈឺ', special: 'ច្បាប់ពិសេស', unpaid: 'ច្បាប់ឥតប្រាក់ឈ្នួល',
  daily: 'ប្រចាំថ្ងៃ', weekly: 'ប្រចាំសប្តាហ៍', monthly: 'ប្រចាំខែ',
  system: 'ប្រព័ន្ធ', salary: 'ប្រាក់បៀវត្ស', leave: 'ច្បាប់ឈប់សម្រាក', document: 'ឯកសារ', report: 'របាយការណ៍',
  all: 'ទាំងអស់', esg: 'បរិស្ថាន និងសង្គម', production: 'ផលិតកម្ម', finance: 'ហិរញ្ញវត្ថុ', staff: 'បុគ្គលិក', employee: 'បុគ្គលិក', attendance: 'វត្តមាន',
  Optimal: 'ល្អប្រសើរ', Good: 'ល្អ', Excellent: 'ល្អណាស់',
  full_time: 'ពេញម៉ោង', part_time: 'ក្រៅម៉ោង', contract: 'កិច្ចសន្យា',
  employment_letter: 'លិខិតបញ្ជាក់ការងារ', salary_certificate: 'លិខិតបញ្ជាក់ប្រាក់ខែ', employment_certificate: 'លិខិតបញ្ជាក់ការងារ', work_certificate: 'លិខិតបញ្ជាក់បទពិសោធន៍ការងារ',
  Authentication: 'ការចូលប្រព័ន្ធ', 'User Management': 'ការគ្រប់គ្រងអ្នកប្រើប្រាស់', 'Department Management': 'ការគ្រប់គ្រងនាយកដ្ឋាន',
  'Manager Reports': 'របាយការណ៍ប្រធានផ្នែក', 'Leave Requests': 'សំណើសុំច្បាប់', 'Document Requests': 'សំណើសុំឯកសារ',
  LOGIN: 'ចូលប្រព័ន្ធ', LOGOUT: 'ចាកចេញ', RESET_PASSWORD: 'កំណត់ពាក្យសម្ងាត់ថ្មី',
  ADD_USER: 'បន្ថែមអ្នកប្រើប្រាស់', UPDATE_USER: 'កែប្រែអ្នកប្រើប្រាស់', DELETE_USER: 'លុបអ្នកប្រើប្រាស់', DEACTIVATE_USER: 'ផ្អាកគណនី', TOGGLE_STATUS: 'ប្តូរស្ថានភាព',
  ADD_DEPARTMENT: 'បន្ថែមនាយកដ្ឋាន', DELETE_DEPARTMENT: 'លុបនាយកដ្ឋាន', ASSIGN_MANAGER: 'ចាត់តាំងប្រធានផ្នែក',
  UPDATE_REPORT: 'កែប្រែរបាយការណ៍', SUBMIT_REPORT: 'ដាក់ស្នើរបាយការណ៍', APPROVE_LEAVE: 'អនុម័តច្បាប់', REQUEST_DOCUMENT: 'ស្នើសុំឯកសារ',
};

const months = ['មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា', 'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ'];
export function formatKhmerDate(date) {
  const number = value => String(value).replace(/\d/g, digit => '០១២៣៤៥៦៧៨៩'[Number(digit)]);
  return `${number(date.getDate())} ${months[date.getMonth()]} ${number(date.getFullYear())}`;
}
