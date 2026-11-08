// Core state management & routing
import { convertImage, imageToICO, imageToPDF, generateWebPack, mergePDFs, splitPDF, docxToTxt, xlsxToCsv, downloadBlob } from './converter.js';
import { promptInstall, isInstalled } from './pwa.js';

const MATRIX = {
  image: [
    {id:'jpg', label:'JPG', desc:'Format foto universal'},
    {id:'png', label:'PNG', desc:'Transparansi terjaga'},
    {id:'webp', label:'WEBP', desc:'Ringan untuk web'},
    {id:'ico', label:'ICO', desc:'1 ikon favicon'},
    {id:'pdf', label:'PDF', desc:'1 gambar jadi 1 halaman PDF'},
    {id:'webpack', label:'Web Pack', desc:'11 ikon favicon & PWA → ZIP'},
  ],
  pdf: [
    {id:'merge', label:'Gabung PDF', desc:'2–20 PDF jadi 1 PDF'},
    {id:'split', label:'Pisah PDF', desc:'1 PDF dipotong per halaman → ZIP'},
  ],
  docx: [
    {id:'txt', label:'TXT', desc:'Ambil teks asli dari DOCX'},
  ],
  xlsx: [
    {id:'csv', label:'CSV', desc:'Ambil data asli dari Excel'},
  ],
};
const FROM_LABEL = { image:'Gambar (JPG, PNG, WEBP, GIF, BMP)', pdf:'PDF', docx:'Word (DOCX)', xlsx:'Excel (XLSX)' };
const ACCEPT = {
  image: '.jpg,.jpeg,.png,.webp,.gif,.bmp,image/*',
  pdf: '.pdf,application/pdf',
  docx: '.docx',
  xlsx: '.xlsx',
};
const state = { from:'image', to:'jpg', files:[], busy:false };

function detectKind(file){
  const ext=(file.name.split('.').pop()||'').toLowerCase();
  if(file.type.startsWith('image/')||['jpg','jpeg','png','webp','gif','bmp'].includes(ext)) return 'image';
  if(file.type==='application/pdf'||ext==='pdf') return 'pdf';
  if(ext==='docx') return 'docx';
  if(ext==='xlsx') return 'xlsx';
  return 'unknown';
}
function formatSize(b){ if(!Number.isFinite(b)||b<0) return '0 B'; if(b<1024) return `${b} B`; if(b<1048576) return `${(b/1024).toFixed(1)} KB`; return `${(b/1048576).toFixed(2)} MB`; }
function stripExt(n){const i=n.lastIndexOf('.');return i>0?n.slice(0,i):n;}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,(c)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function toast(m){const el=document.getElementById('toast');if(!el)return;el.textContent=m;el.hidden=false;clearTimeout(el._timer);el._timer=setTimeout(()=>{el.hidden=true;},3600);}

function render(){
  const app=document.getElementById('app');
  const toOptions=MATRIX[state.from];
  app.innerHTML=`
  <header><div class="container header-inner"><a href="./" class="brand"><span><h1>GANTOE</h1><small>KONVERSI BERKAS LOKAL</small></span></a>
  <button id="install-btn" class="btn-install" ${isInstalled()?'hidden':''}>Install App</button></div></header>
  <main class="container">
    <section class="wizard">
      <div class="wizard-step"><label for="from-select">1. Pilih jenis berkas asal</label>
        <select id="from-select">${Object.keys(MATRIX).map((k)=>`<option value="${k}" ${k===state.from?'selected':''}>${FROM_LABEL[k]}</option>`).join('')}</select></div>
      <div class="wizard-arrow">→</div>
      <div class="wizard-step"><label for="to-select">2. Pilih format tujuan</label>
        <select id="to-select">${toOptions.map((o)=>`<option value="${o.id}" ${o.id===state.to?'selected':''}>${o.label} — ${o.desc}</option>`).join('')}</select></div>
    </section>
    <div id="dropzone" class="dropzone" role="button" tabindex="0">
      <h2>Tarik file ke sini</h2>
      <p>atau klik untuk memilih · FROM: ${FROM_LABEL[state.from]} → TO: ${toOptions.find((o)=>o.id===state.to)?.label||''}</p>
      <div class="badge-list"><span>100% OFFLINE</span><span>TANPA UNGGAH</span><span>TANPA OCR</span></div>
    </div>
    <input id="file-input" type="file" hidden ${state.to==='merge'?'multiple':''} accept="${ACCEPT[state.from]}" />
    ${state.files.length?`<div class="workspace-card"><div class="workspace-info"><h2>${state.files.map((f)=>escapeHtml(f.name)).join(', ')}</h2><p>${state.files.length} file · ${formatSize(state.files.reduce((a,f)=>a+f.size,0))}</p></div><button id="reset-btn" class="btn-ghost">Batal</button></div>
    <button id="convert-btn" class="btn-primary" style="margin-top:1rem;">Konversi Sekarang → ${toOptions.find((o)=>o.id===state.to)?.label||''}</button>`:''}
    <p class="hint">Sistem akan otomatis menyesuaikan format jika berkas yang dimasukkan berbeda dari pilihan awal.</p>
  </main>
  <div id="toast" hidden></div>`;
  bindEvents();
}
function bindEvents(){
  document.getElementById('install-btn')?.addEventListener('click',()=>promptInstall());
  document.getElementById('from-select')?.addEventListener('change',(e)=>{
    state.from=e.target.value;
    state.to=MATRIX[state.from][0].id;
    state.files=[]; render();
  });
  document.getElementById('to-select')?.addEventListener('change',(e)=>{ state.to=e.target.value; render(); });
  const dz=document.getElementById('dropzone'); const input=document.getElementById('file-input');
  if(!dz||!input) return;
  const handleFiles=(list)=>{
    if(!list||!list.length) return;
    const files=Array.from(list);
    const kind=detectKind(files[0]);
    if(kind==='unknown'){ toast('Format berkas tidak didukung. Gunakan Gambar, PDF, DOCX, atau XLSX.'); return; }
    
    // Sinkronisasi state otomatis berdasarkan tipe file
    if(kind!==state.from){
      state.from=kind;
      state.to=MATRIX[kind][0].id;
      toast(`Terdeteksi sebagai ${FROM_LABEL[kind]}. Format asal disesuaikan otomatis.`);
    }
    
    // Validasi batas maksimal file untuk merge
    if(state.to==='merge'){
      const pdfs=files.filter((f)=>detectKind(f)==='pdf');
      if(pdfs.length<2){ toast('Fitur gabung PDF membutuhkan minimal 2 berkas PDF.'); return; }
      state.files=pdfs.slice(0,20);
    } else {
      state.files=[files[0]];
    }
    render();
  };
  dz.addEventListener('click',()=>input.click());
  dz.addEventListener('keydown',(e)=>{ if(e.key==='Enter'||e.key===' '){e.preventDefault();input.click();} });
  dz.addEventListener('dragover',(e)=>{e.preventDefault();dz.classList.add('dz-over');});
  dz.addEventListener('dragleave',()=>dz.classList.remove('dz-over'));
  dz.addEventListener('drop',(e)=>{e.preventDefault();dz.classList.remove('dz-over');handleFiles(e.dataTransfer.files);});
  input.addEventListener('change',(e)=>{handleFiles(e.target.files);e.target.value='';});
  document.getElementById('reset-btn')?.addEventListener('click',()=>{state.files=[];render();});
  document.getElementById('convert-btn')?.addEventListener('click',handleConvert);
}
async function handleConvert(){
  if(state.busy||!state.files.length) return;
  state.busy=true;
  const btn=document.getElementById('convert-btn'); if(btn) btn.disabled=true;
  try{
    const file=state.files[0];
    if(state.from==='image'){
      if(['jpg','png','webp'].includes(state.to)){ const blob=await convertImage(file,state.to); downloadBlob(blob,`${stripExt(file.name)}.${state.to}`); }
      else if(state.to==='ico'){ const blob=await imageToICO(file); downloadBlob(blob,`${stripExt(file.name)}.ico`); }
      else if(state.to==='pdf'){ const blob=await imageToPDF(file); downloadBlob(blob,`${stripExt(file.name)}.pdf`); }
      else if(state.to==='webpack'){ const {zip}=await generateWebPack(file); downloadBlob(zip,`${stripExt(file.name)}-web-pack.zip`); }
      toast('Konversi berhasil.');
    } else if(state.from==='pdf' && state.to==='merge'){
      const blob=await mergePDFs(state.files,(pct)=>{ if(btn) btn.textContent=`Menggabungkan ${pct}%...`; });
      downloadBlob(blob,'gantoe-merged.pdf'); toast(`Berhasil: ${state.files.length} PDF digabung.`);
    } else if(state.from==='pdf' && state.to==='split'){
      const {zip,total}=await splitPDF(file);
      downloadBlob(zip,`${stripExt(file.name)}-pisah.zip`); toast(`Berhasil: ${total} halaman dipisah ke ZIP.`);
    } else if(state.from==='docx' && state.to==='txt'){
      const blob=await docxToTxt(file); downloadBlob(blob,`${stripExt(file.name)}.txt`); toast('Berhasil mengekstrak teks dari DOCX.');
    } else if(state.from==='xlsx' && state.to==='csv'){
      const blob=await xlsxToCsv(file); downloadBlob(blob,`${stripExt(file.name)}.csv`); toast('Berhasil mengekstrak data ke CSV.');
    }
  }catch(err){ console.error(err); toast('Gagal: '+err.message); }
  finally{ state.busy=false; const b=document.getElementById('convert-btn'); if(b) b.disabled=false; }
}
render();