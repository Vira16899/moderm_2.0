export const LEAVE_FILE_LIMIT = 10 * 1024 * 1024;

/** Only browser-safe links to attachments returned by the API. */
export function leaveAttachmentUrl(value, baseUrl) {
  if (typeof value !== 'string' || !value.trim()) return '';
  const path = value.trim();
  if (/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(path)) {
    try { const url = new URL(path); return ['https:', 'http:'].includes(url.protocol) ? url.href : ''; } catch { return ''; }
  }
  if (!baseUrl || /[\u0000-\u001f\\]/.test(path)) return '';
  return `${baseUrl.replace(/\/$/,'')}/${path.replace(/^\/+/, '')}`;
}
export function leaveFileError(file) {
  if (!file) return '';
  const image = /^image\//i.test(file.type || '');
  const document = /\.(pdf|doc|docx)$/i.test(file.name || '');
  if (!image && !document) return 'សូមជ្រើសរើសរូបភាព ឬឯកសារ PDF, DOC ឬ DOCX។';
  if (file.size > LEAVE_FILE_LIMIT) return 'ឯកសារត្រូវមានទំហំមិនលើសពី ១០ MB។';
  if (!file.size) return 'ឯកសារនេះទទេ។ សូមជ្រើសរើសឯកសារផ្សេង។';
  return '';
}

/** Some desktop browsers report documents as generic binary files. */
export function leaveUploadFile(file) {
  const extension = file?.name?.split('.').at(-1)?.toLowerCase();
  const expected = { pdf:'application/pdf', doc:'application/msword', docx:'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }[extension];
  if (!expected || (file.type && !['application/octet-stream','binary/octet-stream','application/x-pdf'].includes(file.type.toLowerCase()))) return file;
  return new File([file], file.name, {type:expected,lastModified:file.lastModified});
}
