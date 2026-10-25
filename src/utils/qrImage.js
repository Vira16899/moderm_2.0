async function imageDetector() {
  const { BarcodeDetector } = await import('barcode-detector/pure');
  return new BarcodeDetector({ formats: ['qr_code'] });
}

export function qrImageError(file) {
  if (!file || !(file instanceof Blob)) return 'សូមជ្រើសរើសរូបភាព QR។';
  if (!/^image\//i.test(file.type)) return 'សូមជ្រើសរើសឯកសាររូបភាព។';
  if (!file.size) return 'រូបភាពនេះទទេ។ សូមជ្រើសរើសរូបភាពផ្សេង។';
  if (file.size > 10 * 1024 * 1024) return 'ទំហំរូបភាពត្រូវតូចជាង ឬស្មើ ១០ MB។';
  return '';
}

export async function decodeQrImage(file, makeDetector = imageDetector) {
  const issue = qrImageError(file);
  if (issue) throw new Error(issue);
  let codes;
  try { codes = await (await makeDetector()).detect(file); }
  catch { throw new Error('មិនអាចអានរូបភាពនេះបានទេ។ សូមប្រើរូបភាព PNG ឬ JPG ច្បាស់ជាងនេះ។'); }
  const tokens = [...new Set(codes.map(code => code.rawValue).filter(value => typeof value === 'string' && value.trim()))];
  if (!tokens.length) throw new Error('រកមិនឃើញ QR ក្នុងរូបភាពនេះទេ។ សូមជ្រើសរើសរូបភាព QR ច្បាស់ជាងនេះ។');
  if (tokens.length > 1) throw new Error('រូបភាពមាន QR ច្រើន។ សូមកាត់រូបភាពឱ្យនៅសល់ QR តែមួយ។');
  return tokens[0];
}
