import { PDFDocument } from 'pdf-lib';
import templateUrl from '../assets/documents/employment-verification-template.pdf?url';
import imageUrl from '../assets/documents/employment-verification-template.jpg?url';
import fontUrl from '../assets/fonts/Hanuman.ttf?url';
import { letterValue, letterDate, letterSalary } from '../api/employmentVerification.js';

let fontPromise;
async function loadFont() {
  if (!fontPromise) fontPromise = (async () => {
    const font = new FontFace('LetterHanuman', `url("${fontUrl}")`, { weight:'100 900' });
    await font.load(); document.fonts.add(font);
  })().catch(error => { fontPromise = null; throw error; });
  return fontPromise;
}
function loadImage(url) {
  return new Promise((resolve, reject) => { const image = new Image(); image.onload = () => resolve(image); image.onerror = () => reject(new Error('មិនអាចទាញយកគំរូលិខិតបានទេ។')); image.src = url; });
}
function canvasBlob(canvas) { return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('មិនអាចរៀបចំរូបភាពលិខិតបានទេ។')), 'image/png')); }

// Preserve the scanned template artwork and shape Khmer text in the browser.
// A clean PDF page avoids inheriting broken cross-references from scanned sources.
export async function buildEmploymentPdf(letter) {
  const [templateResponse, background] = await Promise.all([fetch(templateUrl), loadImage(imageUrl), loadFont()]);
  if (!templateResponse.ok) throw new Error('មិនអាចទាញយកគំរូ PDF បានទេ។');
  const canvas = document.createElement('canvas');
  canvas.width = 2480; canvas.height = 3508;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('កម្មវិធីរុករកមិនអាចរៀបចំ PDF បានទេ។');
  ctx.drawImage(background,0,0,canvas.width,canvas.height);
  ctx.scale(canvas.width / 1334, canvas.height / 1888);
  const ink = '#243f4a', teal = '#216f7c';
  const clear = (x, y, width, height, color = '#ffffff') => { ctx.fillStyle = color; ctx.fillRect(x,y,width,height); };
  const write = (text, x, y, width, size = 23, color = ink, align = 'left') => {
    text = String(text);
    let actualSize = size;
    do { ctx.font = `400 ${actualSize}px LetterHanuman`; if (ctx.measureText(text).width <= width) break; actualSize -= .5; } while (actualSize > 10);
    if (ctx.measureText(text).width > width) throw new Error('ព័ត៌មានវែងពេកសម្រាប់គំរូលិខិត។ សូមកែព័ត៌មានឱ្យខ្លីជាងនេះ។');
    ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = 'alphabetic';
    ctx.fillText(text, align === 'right' ? x+width : align === 'center' ? x+width/2 : x, y+actualSize);
  };
  const wrap = (text, x, y, width, size = 23, maxLines = 2) => {
    const characters = [...new Intl.Segmenter('km', {granularity:'word'}).segment(String(text))].map(part => part.segment); let lines = [], line = '';
    ctx.font = `400 ${size}px LetterHanuman`;
    for (const char of characters) {
      if (ctx.measureText(line+char).width > width && line) { lines.push(line); line = char; } else line += char;
    }
    if (line) lines.push(line);
    if (lines.length > maxLines) { write(text,x,y,width,size); return; }
    lines.forEach((value,index)=>write(value,x,y+index*36,width,size));
  };
  const employee = letter.employee;
  // Preserve the supplied Garmora artwork. Replace only variable fields.
  clear(105,363,1125,40);
  write(`លេខសម្គាល់បុគ្គលិក៖ ${employee.id}`,110,369,1110,21,'#6d7e85');
  clear(110,585,1120,288);
  write(`លោក/លោកស្រី/កញ្ញា៖ ${letterValue(employee.khmer_name)}  (${letterValue(employee.Eng_name)})`,122,594,1090,24,teal);
  const gender = ({MALE:'ប្រុស',FEMALE:'ស្រី'})[String(employee.gender || '').toUpperCase()] || letterValue(employee.gender);
  write(`ភេទ៖ ${gender}     សញ្ជាតិ៖ ${letterValue(employee.nationality)}`,122,638,1090,23);
  write(`ថ្ងៃខែឆ្នាំកំណើត៖ ${letterDate(employee.birthday ?? employee.date_of_birth)}`,122,682,1090,23);
  write(`លេខអត្តសញ្ញាណបណ្ណ៖ ${letterValue(employee.id_card_number)}`,122,726,1090,23);
  wrap(`អាសយដ្ឋានបច្ចុប្បន្ន៖ ${letterValue(employee.address)}`,122,770,1090,23,2);
  write(`លេខទូរស័ព្ទ៖ ${letterValue(employee.phone)}     អ៊ីមែល៖ ${letterValue(employee.email)}`,122,844,1090,18);
  const role = ({EMPLOYEE:'បុគ្គលិក',MANAGER:'អ្នកគ្រប់គ្រង',ADMIN:'អ្នកគ្រប់គ្រងប្រព័ន្ធ'})[employee.role_name] || letterValue(employee.role_name);
  clear(110,963,1120,253);
  write(`តួនាទី/មុខតំណែង៖ ${employee.position_name ? `${role} · ${employee.position_name}` : role}`,122,980,1090,23,teal);
  write(`នាយកដ្ឋាន៖ ${letterValue(employee.department_name)}`,122,1040,1090,23);
  write(`កាលបរិច្ឆេទចូលធ្វើការ៖ ${letterDate(employee.hire_date)}`,122,1100,1090,23);
  write(`ប្រាក់បៀវត្សប្រចាំខែ៖ ${letterSalary(employee.salary)}`,122,1160,1090,24,teal);
  clear(105,1260,1125,65);
  wrap('លិខិតនេះត្រូវបានរៀបចំតាមព័ត៌មានបុគ្គលិកដែលបានផ្ដល់ពីប្រព័ន្ធ។',110,1272,1110,23,2);
  clear(760,1354,470,53);
  write(`រាជធានីភ្នំពេញ, ថ្ងៃទី ${letterDate(letter.generatedAt)}`,765,1366,460,21,ink,'right');
  clear(865,1590,365,49);
  write('ឈ្មោះ៖ __________________',865,1603,360,20,ink,'right');
  const overlayBlob = await canvasBlob(canvas);
  const source = await PDFDocument.load(await templateResponse.arrayBuffer());
  const sourcePage = source.getPages()[0];
  const pdf = await PDFDocument.create();
  const overlay = await pdf.embedPng(await overlayBlob.arrayBuffer());
  const page = pdf.addPage([sourcePage.getWidth(), sourcePage.getHeight()]);
  page.drawImage(overlay,{x:0,y:0,width:page.getWidth(),height:page.getHeight()});
  pdf.setTitle(letter.documentType); pdf.setSubject(`Employee ${employee.id}`); pdf.setCreator('Garmora');
  const bytes = await pdf.save({ useObjectStreams:false });
  // Preview and download share the exact same shaped, branded page image.
  return { bytes, previewBlob:overlayBlob };
}
