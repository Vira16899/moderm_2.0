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
  const image = /^image\//i.test(file.type || '') && /\.(png|jpe?g|webp|gif|bmp|avif|heic|heif|tiff?)$/i.test(file.name || '');
  if (!image) return 'សូមជ្រើសរើសឯកសាររូបភាពប៉ុណ្ណោះ។';
  if (file.size > LEAVE_FILE_LIMIT) return 'ឯកសារត្រូវមានទំហំមិនលើសពី ១០ MB។';
  if (!file.size) return 'ឯកសារនេះទទេ។ សូមជ្រើសរើសឯកសារផ្សេង។';
  return '';
}
