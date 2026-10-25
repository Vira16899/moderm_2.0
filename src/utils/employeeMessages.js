// Keep employee feedback in Khmer even when the API returns English messages.
export function employeeError(error, fallback = 'សកម្មភាពមិនបានសម្រេច។ សូមព្យាយាមម្ដងទៀត។') {
  const message = String(error?.message ?? error ?? '');
  if (/(more than|over|exceed).*2.*day.*(file|attach)|file.*(required|require).*2.*day|leave.*2.*day.*require/i.test(message)) return 'ការសុំច្បាប់លើសពី ២ ថ្ងៃ ត្រូវបញ្ចូលតំណឯកសារបញ្ជាក់។';
  if (/file.*(type|format)|unsupported.*file|invalid.*file|only.*(image|pdf|doc)/i.test(message)) return 'សូមជ្រើសរើសរូបភាព ឬឯកសារ PDF, DOC, DOCX។';
  if (/តំណឯកសារ|file.*url|invalid.*url/i.test(message)) return 'សូមបញ្ចូលតំណឯកសារឱ្យបានត្រឹមត្រូវ។';
  if (/already.*leave.*(date|period)|overlap|duplicate.*leave/i.test(message)) return 'អ្នកមានសំណើសុំច្បាប់ក្នុងកាលបរិច្ឆេទនេះរួចហើយ។ សូមជ្រើសរើសកាលបរិច្ឆេទផ្សេង។';
  if (/network|fetch|timeout|connection/i.test(message)) return 'មិនអាចភ្ជាប់ទៅម៉ាស៊ីនមេបានទេ។ សូមពិនិត្យអ៊ីនធឺណិត ហើយព្យាយាមម្ដងទៀត។';
  if (/unauthorized|unauthenticated|token.*expired|session.*expired/i.test(message)) return 'ការចូលប្រើបានផុតកំណត់។ សូមចូលគណនីម្ដងទៀត។';
  if (/forbidden|permission|not allowed/i.test(message)) return 'អ្នកមិនមានសិទ្ធិធ្វើសកម្មភាពនេះទេ។';
  if (/only.*pending|already.*(approved|cancelled|canceled)|cannot.*(edit|update|cancel)/i.test(message)) return 'សំណើនេះមិនអាចកែប្រែ ឬលុបចោលបានទៀតទេ។ សូមផ្ទុកប្រវត្តិឡើងវិញ។';
  if (/end.*date.*(before|after)|invalid.*date|start.*date/i.test(message)) return 'សូមពិនិត្យកាលបរិច្ឆេទចាប់ផ្តើម និងបញ្ចប់ឱ្យបានត្រឹមត្រូវ។';
  return /[\u1780-\u17ff]/.test(message) && !/[a-z]/i.test(message) ? message : fallback;
}
