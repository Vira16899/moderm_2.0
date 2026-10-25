// Keep backend wording out of notifications while preserving useful Khmer errors.
export function adminErrorMessage(error) {
  const message = String(error?.message ?? error ?? '').trim();
  const translations = [
    [/department.*already has a manager/i, 'នាយកដ្ឋាននេះមានអ្នកគ្រប់គ្រងរួចហើយ។ សូមជ្រើសរើសនាយកដ្ឋានផ្សេង។'],
    [/manager.*already.*(assigned|department)/i, 'អ្នកគ្រប់គ្រងនេះត្រូវបានចាត់តាំងរួចហើយ។ សូមជ្រើសរើសអ្នកគ្រប់គ្រងផ្សេង។'],
    [/(email.*(already|exist|taken|duplicate))|duplicate.*email/i, 'អ៊ីមែលនេះត្រូវបានប្រើរួចហើយ។ សូមប្រើអ៊ីមែលផ្សេង។'],
    [/department.*not found/i, 'រកមិនឃើញនាយកដ្ឋាននេះទេ។ សូមទាញយកបញ្ជីឡើងវិញ។'],
    [/position.*not found/i, 'រកមិនឃើញមុខតំណែងនេះទេ។ សូមទាញយកបញ្ជីឡើងវិញ។'],
    [/user.*not found/i, 'រកមិនឃើញអ្នកប្រើប្រាស់នេះទេ។ សូមទាញយកបញ្ជីឡើងវិញ។'],
    [/network|failed to fetch|offline/i, 'មិនអាចភ្ជាប់ទៅម៉ាស៊ីនមេបានទេ។ សូមពិនិត្យអ៊ីនធឺណិត ហើយព្យាយាមម្ដងទៀត។'],
    [/timeout|timed out/i, 'ការតភ្ជាប់ចំណាយពេលយូរពេក។ សូមព្យាយាមម្ដងទៀត។'],
    [/forbidden|permission|403/i, 'អ្នកមិនមានសិទ្ធិធ្វើសកម្មភាពនេះទេ។'],
    [/unauthorized|unauthenticated|401/i, 'សម័យចូលប្រព័ន្ធបានផុតកំណត់។ សូមចូលប្រព័ន្ធម្ដងទៀត។'],
    [/validate|validation|required|not allowed|invalid/i, 'ព័ត៌មានមិនត្រឹមត្រូវ ឬមិនពេញលេញ។ សូមពិនិត្យព័ត៌មាន ហើយព្យាយាមម្ដងទៀត។'],
  ];
  for (const [pattern, translated] of translations) if (pattern.test(message)) return translated;
  if (/[\u1780-\u17ff]/u.test(message)) return message;
  return 'មិនអាចបញ្ចប់សកម្មភាពនេះបានទេ។ សូមព្យាយាមម្ដងទៀត។';
}
