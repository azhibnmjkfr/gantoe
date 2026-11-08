// GANTOE Core Converter Engine
// Strictly offline. No CDN fallbacks. Real conversion only.

function ensureLib(name, condition) {
  if (!condition()) {
    throw new Error(`Library ${name} tidak ditemukan. Pastikan folder vendor/ terisi dengan benar.`);
  }
}

async function ensureJSZip() {
  ensureLib('ZIP (JSZip)', () => !!window.JSZip);
}

async function ensurePDFLib() {
  ensureLib('PDF (pdf-lib)', () => !!window.PDFLib);
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = reject;
    img.src = url;
  });
}

export async function convertImage(file, format) {
  const img = await loadImage(file);
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d');
  
  if (format === 'jpg') {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.drawImage(img, 0, 0);
  
  const mime = format === 'jpg' ? 'image/jpeg' : format === 'png' ? 'image/png' : 'image/webp';
  const blob = await new Promise((res) => canvas.toBlob((b) => res(b), mime, 0.92));
  if (!blob) throw new Error('Browser tidak mendukung format ' + format);
  return blob;
}

export async function imageToICO(file) {
  const img = await loadImage(file);
  const size = 32;
  const canvas = document.createElement('canvas');
  canvas.width = size; canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, size, size);
  
  const pngBlob = await new Promise((res) => canvas.toBlob(res, 'image/png'));
  const pngBytes = new Uint8Array(await pngBlob.arrayBuffer());
  return wrapPNGAsICO(pngBytes, size);
}

function wrapPNGAsICO(pngBytes, size) {
  const header = new Uint8Array(22);
  const view = new DataView(header.buffer);
  view.setUint16(0, 0, true); view.setUint16(2, 1, true); view.setUint16(4, 1, true);
  header[6] = size >= 256 ? 0 : size; header[7] = size >= 256 ? 0 : size; header[8] = 0; header[9] = 0;
  view.setUint16(10, 1, true); view.setUint16(12, 32, true); view.setUint32(14, pngBytes.length, true); view.setUint32(18, 22, true);
  const total = new Uint8Array(22 + pngBytes.length);
  total.set(header, 0); total.set(pngBytes, 22);
  return new Blob([total], { type: 'image/x-icon' });
}

export async function imageToPDF(file) {
  const img = await loadImage(file);
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0);
  
  const jpegBlob = await new Promise((res) => canvas.toBlob(res, 'image/jpeg', 0.92));
  const jpegBytes = new Uint8Array(await jpegBlob.arrayBuffer());
  return createSimplePDF([{ jpeg: jpegBytes, w: canvas.width, h: canvas.height }]);
}

function createSimplePDF(images) {
  const encoder = new TextEncoder();
  const parts = [];
  let offset = 0;
  const offsets = {};
  
  const push = (data) => {
    const bytes = typeof data === 'string' ? encoder.encode(data) : data;
    parts.push(bytes); offset += bytes.length;
  };
  
  push('%PDF-1.4\n');
  const pageIds = images.map((_, i) => 3 + i * 3);
  
  offsets[1] = offset; push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');
  offsets[2] = offset; push(`2 0 obj\n<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${images.length} >>\nendobj\n`);
  
  images.forEach((img, i) => {
    const pageId = 3 + i * 3, contentId = pageId + 1, imgId = pageId + 2;
    const pageW = 595, pageH = Math.round((img.h * 595) / img.w);
    offsets[pageId] = offset; push(`${pageId} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageW} ${pageH}] /Resources << /XObject << /Im0 ${imgId} 0 R >> >> /Contents ${contentId} 0 R >>\nendobj\n`);
    const content = `q ${pageW} 0 0 ${pageH} 0 0 cm /Im0 Do Q`;
    offsets[contentId] = offset; push(`${contentId} 0 obj\n<< /Length ${content.length} >>\nstream\n${content}\nendstream\nendobj\n`);
    offsets[imgId] = offset; push(`${imgId} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${img.w} /Height ${img.h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${img.jpeg.length} >>\nstream\n`);
    push(img.jpeg); push('\nendstream\nendobj\n');
  });
  
  const xrefStart = offset, objCount = 3 + images.length * 3;
  push(`xref\n0 ${objCount}\n`); push('0000000000 65535 f \n');
  for (let i = 1; i < objCount; i++) push(`${String(offsets[i] || 0).padStart(10, '0')} 00000 n \n`);
  push(`trailer\n<< /Size ${objCount} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`);
  return new Blob(parts, { type: 'application/pdf' });
}

export async function generateWebPack(file) {
  const img = await loadImage(file);
  const sizes = [
    {name:'favicon.ico',size:32,ico:true}, {name:'favicon-16x16.png',size:16}, {name:'favicon-32x32.png',size:32},
    {name:'apple-touch-icon.png',size:180}, {name:'icon-72.png',size:72}, {name:'icon-96.png',size:96},
    {name:'icon-128.png',size:128}, {name:'icon-144.png',size:144}, {name:'icon-192.png',size:192},
    {name:'icon-384.png',size:384}, {name:'icon-512.png',size:512},
  ];
  
  const results = [];
  for (const s of sizes) {
    const canvas = document.createElement('canvas');
    canvas.width = s.size; canvas.height = s.size;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, s.size, s.size);
    const pngBlob = await new Promise((res) => canvas.toBlob(res, 'image/png'));
    
    if (s.ico) {
      const pngBytes = new Uint8Array(await pngBlob.arrayBuffer());
      results.push({ name: s.name, blob: wrapPNGAsICO(pngBytes, s.size) });
    } else {
      results.push({ name: s.name, blob: pngBlob });
    }
  }
  
  await ensureJSZip();
  const zip = new JSZip();
  for (const r of results) zip.file(r.name, r.blob);
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  return { zip: zipBlob, icons: results };
}

async function needPDFLib() {
  await ensurePDFLib();
  return window.PDFLib.PDFDocument;
}

export async function mergePDFs(files, onProgress) {
  const PDFDocument = await needPDFLib();
  const merged = await PDFDocument.create();
  
  for (let i = 0; i < files.length; i++) {
    const bytes = await files[i].arrayBuffer();
    const doc = await PDFDocument.load(bytes);
    const pages = await merged.copyPages(doc, doc.getPageIndices());
    pages.forEach((p) => merged.addPage(p));
    if (onProgress) onProgress(Math.round(((i + 1) / files.length) * 100));
  }
  
  const pdfBytes = await merged.save();
  return new Blob([pdfBytes], { type: 'application/pdf' });
}

export async function splitPDF(file) {
  const PDFDocument = await needPDFLib();
  await ensureJSZip();
  const bytes = await file.arrayBuffer();
  const doc = await PDFDocument.load(bytes);
  const zip = new JSZip();
  const total = doc.getPageCount();
  
  for (let i = 0; i < total; i++) {
    const out = await PDFDocument.create();
    const [page] = await out.copyPages(doc, [i]);
    out.addPage(page);
    const pdfBytes = await out.save();
    zip.file(`halaman-${i + 1}.pdf`, pdfBytes);
  }
  
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  return { zip: zipBlob, total };
}

// Extract DOCX text via XML parser
export async function docxToTxt(file) {
  await ensureJSZip();
  const zip = await JSZip.loadAsync(file);
  const xmlFile = zip.file('word/document.xml');
  if (!xmlFile) throw new Error('File ini bukan DOCX yang valid.');
  
  const xml = await xmlFile.async('string');
  let text = xml.replace(/<\/w:p>/g, '\n').replace(/<[^>]+>/g, '');
  text = text.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'");
  return new Blob([text.trim()], { type: 'text/plain;charset=utf-8' });
}

// Extract XLSX data via XML parser
export async function xlsxToCsv(file) {
  await ensureJSZip();
  const zip = await JSZip.loadAsync(file);
  const sharedFile = zip.file('xl/sharedStrings.xml');
  let shared = [];
  
  if (sharedFile) {
    const sXml = await sharedFile.async('string');
    const matches = [...sXml.matchAll(/<si>(.*?)<\/si>/gs)];
    shared = matches.map((m) => m[1].replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>'));
  }
  
  const sheetFile = zip.file('xl/worksheets/sheet1.xml');
  if (!sheetFile) throw new Error('File ini bukan XLSX yang valid (sheet1 tidak ditemukan).');
  
  const sheetXml = await sheetFile.async('string');
  const rows = [...sheetXml.matchAll(/<row[^>]*>(.*?)<\/row>/gs)];
  const lines = [];
  
  for (const r of rows) {
    const cells = [...r[1].matchAll(/<c[^>]*?(?:t="(\w+)")?[^>]*>(?:<v>(.*?)<\/v>|<is><t>(.*?)<\/t><\/is>)?<\/c>/gs)];
    const values = cells.map((c) => {
      const t = c[1], v = c[2], inline = c[3];
      if (t === 's' && v !== undefined) return shared[Number(v)] ?? '';
      if (inline !== undefined) return inline;
      return v ?? '';
    });
    lines.push(values.map((v) => {
      const s = String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    }).join(','));
  }
  return new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}