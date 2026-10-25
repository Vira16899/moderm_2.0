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

// The source template is a scanned A4 page. Browser canvas shapes Khmer glyphs;
// the overlay preserves that shaping while the original PDF remains intact.
export async function buildEmploymentPdf(letter) {
  const [templateResponse, background] = await Promise.all([fetch(templateUrl), loadImage(imageUrl), loadFont()]);
  if (!templateResponse.ok) throw new Error('មិនអាចទាញយកគំរូ PDF បានទេ។');
  const canvas = document.createElement('canvas');
  canvas.width = 2480; canvas.height = 3508;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('កម្មវិធីរុករកមិនអាចរៀបចំ PDF បានទេ។');
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
  clear(114,77,96,97); // Leave the employer logo space empty.
  clear(235,75,993,105);
  write('ឈ្មោះក្រុមហ៊ុន / ស្ថាប័ន៖ __________________________',240,82,980,29);
  write('អាសយដ្ឋាន និងទំនាក់ទំនង៖ __________________________',240,127,980,19,'#6d7e85');
  clear(105,350,1125,44);
  write(`លេខសម្គាល់បុគ្គលិក៖ ${employee.id}`,110,358,1110,21,'#6d7e85');
  clear(120,411,1090,59,'#f0f9f8');
  write(letter.documentType,125,425,1080,32,teal,'center');
  clear(105,527,1125,50);
  write('នាយកដ្ឋានធនធានមនុស្ស សូមបញ្ជាក់ថា៖',110,536,1110,24);
  clear(105,584,1125,274);
  write(`ឈ្មោះ៖ ${letterValue(employee.khmer_name)}  (${letterValue(employee.Eng_name)})`,122,593,1090,24,teal);
  write(`ថ្ងៃខែឆ្នាំកំណើត៖ ${letterDate(employee.birthday)}     សញ្ជាតិ៖ ${letterValue(employee.nationality)}`,122,638,1090,23);
  write(`លេខអត្តសញ្ញាណបណ្ណ៖ ${letterValue(employee.id_card_number)}`,122,683,1090,23);
  write(`លេខទូរស័ព្ទ៖ ${letterValue(employee.phone)}     អ៊ីមែល៖ ${letterValue(employee.email)}`,122,728,1090,22);
  wrap(`អាសយដ្ឋានបច្ចុប្បន្ន៖ ${letterValue(employee.address)}`,122,773,1090,23,2);
  clear(105,902,1125,48);
  write('ពិតជាកំពុងបម្រើការងារ ដោយមានព័ត៌មានការងារដូចខាងក្រោម៖',110,911,1110,23);
  clear(105,963,1125,253);
  const role = ({EMPLOYEE:'បុគ្គលិក',MANAGER:'អ្នកគ្រប់គ្រង',ADMIN:'អ្នកគ្រប់គ្រងប្រព័ន្ធ'})[employee.role_name] || letterValue(employee.role_name);
  write(`តួនាទី៖ ${role}     មុខតំណែង៖ ${letterValue(employee.position_name)}`,122,972,1090,23);
  write(`នាយកដ្ឋាន៖ ${letterValue(employee.department_name)}`,122,1024,1090,23);
  write(`កាលបរិច្ឆេទចូលធ្វើការ៖ ${letterDate(employee.hire_date)}`,122,1076,1090,23);
  write(`ប្រាក់បៀវត្សប្រចាំខែ៖ ${letterSalary(employee.salary)}`,122,1128,1090,24,teal);
  clear(105,1266,1125,65);
  wrap('លិខិតបញ្ជាក់នេះ ត្រូវបានរៀបចំតាមព័ត៌មានបុគ្គលិកដែលបានផ្តល់ពីប្រព័ន្ធ។',110,1276,1110,23,2);
  clear(760,1354,470,99);
  write(`កាលបរិច្ឆេទចេញលិខិត៖ ${letterDate(letter.generatedAt)}`,765,1366,460,21,ink,'right');
  write('តួនាទីអ្នកចុះហត្ថលេខា៖ __________________',765,1417,460,21,ink,'right');
  clear(865,1590,365,49);
  write('ឈ្មោះអ្នកចុះហត្ថលេខា៖ __________________',865,1603,360,20,ink,'right');
  const overlayBlob = await canvasBlob(canvas);
  const pdf = await PDFDocument.load(await templateResponse.arrayBuffer());
  const overlay = await pdf.embedPng(await overlayBlob.arrayBuffer());
  const page = pdf.getPages()[0];
  page.drawImage(overlay,{x:0,y:0,width:page.getWidth(),height:page.getHeight()});
  pdf.setTitle(letter.documentType); pdf.setSubject(`Employee ${employee.id}`); pdf.setCreator('GarmentPro');
  const bytes = await pdf.save();
  // The preview uses the same overlay and dimensions as the downloaded PDF.
  const preview = document.createElement('canvas'); preview.width=canvas.width; preview.height=canvas.height;
  const previewCtx = preview.getContext('2d'); previewCtx.drawImage(background,0,0,preview.width,preview.height); previewCtx.drawImage(canvas,0,0);
  return { bytes, previewBlob:await canvasBlob(preview) };
}
