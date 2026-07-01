if(window.pdfjsLib){pdfjsLib.GlobalWorkerOptions.workerSrc="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";}
const $=s=>document.querySelector(s), $$=s=>document.querySelectorAll(s), workspace=$("#workspace");
let appState={tool:"home", docType:"aadhaar", docMode:"both", uploadTab:"image", front:null, back:null, pdfCanvas:null, pdfPages:0, pdfPage:1, frontCrop:null, backCrop:null, pdfCrop:null, previewPDF:null, passportImg:null, passportCrop:null, passportPdf:null};
const DOCS={
  aadhaar:{name:"Aadhaar Card",size:"85.6 × 54 mm",icon:"aadhaar.jpg",cls:"aadhaar"},
  pan:{name:"PAN Card",size:"85.6 × 54 mm",icon:"pan.jpg",cls:"pan"},
  voter:{name:"Voter ID Card",size:"85.6 × 54 mm",icon:"voter.jpg",cls:"voter"},
  ayush:{name:"Ayushman Card",size:"85.6 × 54 mm",icon:"ayushman.jpg",cls:"ayush"},
  abha:{name:"ABHA Card",size:"85.6 × 54 mm",icon:"abha.jpg",cls:"abha"},
  dl:{name:"Driving Licence",size:"85.6 × 54 mm",icon:"dl.jpg",cls:"dl"}
};

window.addEventListener("load",()=>{setTimeout(()=>{$("#loader").style.display="none"},350);initApp();});
function initApp(){
  $("#menuBtn")?.addEventListener("click",()=>$("#sidebar").classList.toggle("open"));
  $$(".nav-item[data-tool]").forEach(b=>b.onclick=()=>showTool(b.dataset.tool));
  $("#userTrigger")?.addEventListener("click",()=>$("#userDropdown").classList.toggle("show"));
  document.addEventListener("click",e=>{if(!e.target.closest(".user-menu"))$("#userDropdown")?.classList.remove("show")});
  updateTopUser(); home();
}
function setActive(tool){$$(".nav-item[data-tool]").forEach(b=>b.classList.toggle("active",b.dataset.tool===tool));$("#sidebar")?.classList.remove("open");}
function showTool(tool){appState.tool=tool;setActive(tool); if(tool==="home")return home(); if(tool==="imageStudio")return imageStudio(); if(tool==="documentStudio")return documentStudio(); if(tool==="pdfStudio"||tool==="pdfresizer")return pdfStudio(); if(tool==="login")return loginTool(); if(tool==="dashboard"||tool==="workspace"||tool==="downloads"||tool==="orders"||tool==="settings")return dashboardTool(tool); if(tool==="premium")return premiumTool(); if(tool==="payment")return paymentTool(); if(tool==="feedback")return feedbackTool(); if(tool==="admin")return adminTool(); return home();}
function toast(msg){let t=$("#toast");t.textContent=msg;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2500)}
function getUser(){try{return window.SPT?.user || JSON.parse(localStorage.getItem("spt_user")||"null")}catch(e){return null}}
function updateTopUser(){const u=getUser(); const name=u?.name||"Guest User"; const plan=u?.premium?"Premium User":"Login required"; $("#headerUserName").textContent=name; $("#headerUserPlan").textContent=plan; $("#headerAvatar").textContent=(name||"G").trim()[0].toUpperCase(); $("#adminDropBtn").style.display=(u&&String(u.role).toLowerCase()==="admin")?"block":"none"; $("#logoutDropBtn").textContent=u?"🚪 Logout":"🔐 Login / Signup";}
function logoutOrLogin(){const u=getUser(); if(u&&window.SPT?.logout){SPT.logout(); setTimeout(updateTopUser,100);} else showTool("login");}

function pageHeader(title,sub,extra=""){return `<div class="page-title"><div><h1>${title}</h1><p>${sub}</p></div>${extra||`<button class="help-btn">▶ How to use?</button>`}</div>`}
function home(){workspace.innerHTML=pageHeader("Smart Photo Toolkit Pro","Enterprise photo, document and PDF toolkit.")+`<div class="home-grid"><div class="card home-card" onclick="showTool('imageStudio')"><b>🖼️</b><h3>Image Studio</h3><p>Passport photo, compression, resize, crop, converter and name/date tools.</p></div><div class="card home-card" onclick="showTool('documentStudio')"><b>▤</b><h3>Document Studio</h3><p>Aadhaar, PAN, Voter, Ayushman, ABHA and Driving Licence A4 print.</p></div><div class="card home-card" onclick="showTool('pdfStudio')"><b>▧</b><h3>PDF Studio</h3><p>Compress, resize and print-ready PDF tools.</p></div></div>`}

function imageStudio(){workspace.innerHTML=pageHeader("Image Studio","Create passport photos and prepare images for print.")+`<div class="home-grid"><div class="card home-card" onclick="passportStudio()"><b>👤</b><h3>Passport Photo Studio</h3><p>Aadhaar-style 8-handle crop, 35×45 mm print output.</p></div><div class="card home-card" onclick="compressorTool()"><b>🖼️</b><h3>Image Compressor</h3><p>Compress images to target KB.</p></div><div class="card home-card" onclick="nameDateTool()"><b>🏷️</b><h3>Name / Date</h3><p>Add name, date or custom text below photo.</p></div><div class="card home-card" onclick="imageResizeTool()"><b>📏</b><h3>Resize Image</h3><p>Resize image by width and height.</p></div><div class="card home-card" onclick="imageConverterTool()"><b>🔄</b><h3>Image Converter</h3><p>Convert to JPG, PNG or WEBP.</p></div></div>`}
function passportStudio(){workspace.innerHTML=pageHeader("Passport Photo Studio","Upload a photo, drag-select printable area, then generate A4 passport sheet.")+`<div class="card flow-card"><h3>Upload Full Photo</h3><label class="dropzone"><input type="file" accept="image/*" onchange="loadPassportImg(event)"><div>📤 Click to upload photo<br><small>JPG, PNG, WEBP</small></div></label><div class="pdf-settings"><input id="passName" placeholder="Name optional"><select id="passLayout"><option value="5">5 Photos</option><option value="4">4 Photos</option><option value="6">6 Photos</option><option value="8">8 Photos</option><option value="12">12 Photos</option></select></div></div><div class="card flow-card"><h3>Select Printable Area</h3><div class="crop-stage" id="passportStage"><div class="info-note">Upload a photo to start. Crop box supports move + 8-side resize.</div></div><div class="crop-tools"><button onclick="resetPassportCrop()">Reset</button><button onclick="makePassportPDF()">Generate A4 PDF</button><button onclick="downloadPassportPDF()">Download PDF</button><button onclick="printGeneratedPDF('passport')">Print</button></div></div><div id="passportOutput"></div>`}
async function loadPassportImg(e){const f=e.target.files[0]; if(!f)return; appState.passportImg=await readFile(f); const stage=$("#passportStage"); stage.innerHTML=`<img src="${appState.passportImg}" id="passportImg">`; setTimeout(()=>{appState.passportCrop=createCrop(stage,$("#passportImg"),{ratio:35/45,color:"orange"});},100)}
function resetPassportCrop(){if(!appState.passportImg)return; const stage=$("#passportStage"); stage.innerHTML=`<img src="${appState.passportImg}" id="passportImg">`; setTimeout(()=>{appState.passportCrop=createCrop(stage,$("#passportImg"),{ratio:35/45,color:"orange"});},50)}
async function makePassportPDF(){if(!appState.passportCrop)return toast("Upload and select photo area first"); const src=await cropFromElement(appState.passportCrop); const n=Number($("#passLayout").value||5); const {jsPDF}=window.jspdf; const pdf=new jsPDF({unit:"mm",format:"a4"}); let x=5,y=3,gap=3,w=35,h=45; for(let i=0;i<n;i++){if(x+w>205){x=5;y+=h+gap+7} pdf.addImage(src,"JPEG",x,y,w,h); pdf.setDrawColor(0); pdf.rect(x,y,w,h); x+=w+gap;} appState.passportPdf=pdf; $("#passportOutput").innerHTML=`<div class="preview-a4"><b>Passport PDF Ready</b><p>Top margin minimized to 3mm.</p></div>`; toast("Passport PDF generated")}
function downloadPassportPDF(){if(!appState.passportPdf)return toast("Generate PDF first"); appState.passportPdf.save("passport-photo-a4.pdf")}

function documentStudio(){renderDocumentStudio()}
function renderDocumentStudio(){const d=DOCS[appState.docType]; workspace.innerHTML=pageHeader("Document Studio","Select document, upload and print with perfect settings.")+`
<div class="section-title">1. Select Document</div><div class="doc-grid">${Object.entries(DOCS).map(([k,v])=>`<button class="doc-tile ${appState.docType===k?'active':''}" onclick="setDocType('${k}')"><span class="doc-icon ${v.cls}"><img src="${v.icon}" alt="${v.name}"></span><b>${v.name}</b><small>${v.size}</small></button>`).join("")}</div>
<div class="section-title">2. Select Mode</div><div class="mode-row"><button class="mode-btn ${appState.docMode==='front'?'active':''}" onclick="setDocMode('front')">▣ Front</button><button class="mode-btn ${appState.docMode==='back'?'active':''}" onclick="setDocMode('back')">▣ Back</button><button class="mode-btn ${appState.docMode==='both'?'active':''}" onclick="setDocMode('both')">▣ Front + Back</button></div>
<div class="studio-grid"><div class="left-flow"><div class="flow-card"><h3>3. Upload Document (Image or PDF)</h3><div class="tabs"><button class="tab ${appState.uploadTab==='image'?'active':''}" onclick="setUploadTab('image')">Image Upload</button><button class="tab ${appState.uploadTab==='pdf'?'active':''}" onclick="setUploadTab('pdf')">PDF Upload (Full Page)</button></div><div id="uploadArea">${appState.uploadTab==='image'?imageUploadHTML():pdfUploadHTML()}</div></div><div class="flow-card"><h3>4. Select Printable Area (Drag & Resize)</h3><div id="cropArea">${appState.uploadTab==='image'?imageCropHTML():pdfCropHTML()}</div><div class="info-note">ⓘ Drag the border or corners to select the area you want to print.</div></div><div class="bottom-actions"><button class="ghost-btn" onclick="home()">← Back to Documents</button><button class="download-preview" onclick="downloadDocPDF()">⇩ Download Preview</button><button class="print-main" onclick="printGeneratedPDF('doc')">▣ Print / Save as PDF</button></div></div><div class="right-panel"><div class="preview-a4"><h3>5. Print Preview (A4)</h3><div class="a4-paper"><div class="preview-line" id="a4Preview"></div></div><div class="ok-note">✓ Top spacing and gap minimized for lamination</div></div><div class="print-settings"><h3>6. Print Settings</h3><div class="setting-row"><span>Paper Size</span><b>A4 (210 × 297 mm)</b></div><div class="setting-row"><span>Orientation</span><b>Portrait</b></div><div class="setting-row"><span>Margin</span><b>Minimal (3mm)</b></div><div class="setting-row"><span>Spacing (Front - Back)</span><b>3mm</b></div><label>Copies<select id="docCopies" onchange="updateA4Preview()"><option value="1">1 Copy</option><option value="2">2 Copies</option><option value="4">4 Copies</option><option value="6">6 Copies</option></select></label></div></div></div>`; initAfterRender();}
function setDocType(k){appState.docType=k; renderDocumentStudio()} function setDocMode(m){appState.docMode=m; renderDocumentStudio()} function setUploadTab(t){appState.uploadTab=t; renderDocumentStudio()}
function imageUploadHTML(){let needBack=appState.docMode!=="front", needFront=appState.docMode!=="back"; return `<div class="upload-row">${needFront?`<label class="upload-card"><div class="upload-head"><span><i class="green-dot"></i>Front Image</span><b class="change-link">Change</b></div><input type="file" accept="image/*" onchange="loadDocImage(event,'front')">${appState.front?`<img src="${appState.front}">`:`<div class="dropzone">Upload Front Image</div>`}</label>`:""}${needBack?`<label class="upload-card"><div class="upload-head"><span><i class="green-dot"></i>Back Image</span><b class="change-link">Change</b></div><input type="file" accept="image/*" onchange="loadDocImage(event,'back')">${appState.back?`<img src="${appState.back}">`:`<div class="dropzone">Upload Back Image</div>`}</label>`:""}</div><small>Supported: JPG, PNG, WEBP (Max 10MB)</small>`}
function pdfUploadHTML(){return `<label class="dropzone"><input type="file" accept="application/pdf" onchange="loadFullPDF(event)"><div>☁️ Click to upload full page PDF<br><small>Official downloaded PDF</small></div></label><div class="pdf-settings"><label>Page<select id="pdfPageSelect" onchange="renderPdfPage(Number(this.value))">${Array.from({length:appState.pdfPages||1},(_,i)=>`<option value="${i+1}" ${appState.pdfPage===i+1?'selected':''}>Page ${i+1}</option>`).join("")}</select></label><label>Zoom<select><option>Fit Width</option><option>100%</option></select></label></div>`}
function imageCropHTML(){let needBack=appState.docMode!=="front", needFront=appState.docMode!=="back"; return `<div class="crop-grid">${needFront?`<div class="crop-box-panel"><div class="crop-label">Front - Select Area</div><div class="crop-stage" id="frontStage">${appState.front?`<img src="${appState.front}" id="frontCropImg">`:`Upload front image first`}</div><div class="crop-tools"><button onclick="zoomCrop('front',1.08)">⌕</button><button onclick="zoomCrop('front',.92)">⌔</button><button onclick="resetDocCrop('front')">Reset</button></div></div>`:""}${needBack?`<div class="crop-box-panel"><div class="crop-label">Back - Select Area</div><div class="crop-stage" id="backStage">${appState.back?`<img src="${appState.back}" id="backCropImg">`:`Upload back image first`}</div><div class="crop-tools"><button onclick="zoomCrop('back',1.08)">⌕</button><button onclick="zoomCrop('back',.92)">⌔</button><button onclick="resetDocCrop('back')">Reset</button></div></div>`:""}</div>`}
function pdfCropHTML(){return `<div class="crop-stage large" id="pdfStage">${appState.pdfCanvas?`<canvas id="pdfCanvasView"></canvas>`:`Upload full page PDF first`}</div><div class="crop-tools"><button onclick="resetDocCrop('pdf')">Reset Selection</button><button onclick="generateDocPDF()">Crop & Generate A4 PDF</button></div>`}
async function loadDocImage(e,side){const f=e.target.files[0]; if(!f)return; appState[side]=await readFile(f); appState[side+'Crop']=null; renderDocumentStudio();}
function initAfterRender(){setTimeout(()=>{ if(appState.uploadTab==='image'){ if(appState.front&&$("#frontStage")){appState.frontCrop=createCrop($("#frontStage"),$("#frontCropImg"),{color:"blue"});} if(appState.back&&$("#backStage")){appState.backCrop=createCrop($("#backStage"),$("#backCropImg"),{color:"blue"});}} if(appState.uploadTab==='pdf'&&appState.pdfCanvas&&$("#pdfCanvasView")){drawPdfCanvasView(); appState.pdfCrop=createCrop($("#pdfStage"),$("#pdfCanvasView"),{color:"orange"});} updateA4Preview();},100)}
function resetDocCrop(side){if(side==='pdf'){appState.pdfCrop=null;renderDocumentStudio();return} appState[side+'Crop']=null;renderDocumentStudio()}
function zoomCrop(side,f){toast("Zoom controls are ready; drag handles for precise selection.")}
async function loadFullPDF(e){const f=e.target.files[0]; if(!f)return; if(!window.pdfjsLib)return toast("PDF library not loaded"); const buf=await f.arrayBuffer(); const pdf=await pdfjsLib.getDocument({data:buf}).promise; appState.pdfDoc=pdf; appState.pdfPages=pdf.numPages; appState.pdfPage=1; await renderPdfPage(1); renderDocumentStudio();}
async function renderPdfPage(n){if(!appState.pdfDoc)return; appState.pdfPage=n; const page=await appState.pdfDoc.getPage(n); const viewport=page.getViewport({scale:2.4}); const c=document.createElement('canvas'); c.width=viewport.width; c.height=viewport.height; await page.render({canvasContext:c.getContext('2d'),viewport}).promise; appState.pdfCanvas=c; if($("#pdfCanvasView")) drawPdfCanvasView();}
function drawPdfCanvasView(){const view=$("#pdfCanvasView"), src=appState.pdfCanvas; if(!view||!src)return; const ctx=view.getContext('2d'); const maxW=900, ratio=src.width/src.height; view.width=maxW; view.height=Math.round(maxW/ratio); ctx.drawImage(src,0,0,view.width,view.height)}
async function updateA4Preview(){const el=$("#a4Preview"); if(!el)return; let imgs=[]; if(appState.uploadTab==='image'){if(appState.frontCrop)imgs.push(await cropFromElement(appState.frontCrop)); else if(appState.front)imgs.push(appState.front); if(appState.backCrop)imgs.push(await cropFromElement(appState.backCrop)); else if(appState.back)imgs.push(appState.back);} else {if(appState.pdfCrop)imgs.push(await cropFromElement(appState.pdfCrop));} el.innerHTML=imgs.map(s=>`<img src="${s}">`).join("");}
async function generateDocPDF(){await updateA4Preview(); const imgs=[...$$("#a4Preview img")].map(i=>i.src); if(!imgs.length)return toast("Upload and select printable area first"); const {jsPDF}=window.jspdf; const pdf=new jsPDF({unit:"mm",format:"a4"}); const copies=Number($("#docCopies")?.value||1); let y=3; for(let c=0;c<copies;c++){let x=(210-(imgs.length*85.6+(imgs.length-1)*3))/2; for(const s of imgs){pdf.addImage(s,"JPEG",x,y,85.6,54); pdf.setDrawColor(0); pdf.rect(x,y,85.6,54); x+=88.6;} y+=57; if(y>260&&c<copies-1){pdf.addPage(); y=3}} appState.previewPDF=pdf; toast("A4 PDF generated")}
async function downloadDocPDF(){if(!appState.previewPDF)await generateDocPDF(); if(appState.previewPDF)appState.previewPDF.save(`${DOCS[appState.docType].name.replaceAll(' ','-')}-A4.pdf`)}
function printGeneratedPDF(type){let pdf= type==='passport'?appState.passportPdf:appState.previewPDF; if(!pdf){if(type==='doc')generateDocPDF(); return toast("Generate PDF first")} pdf.autoPrint(); window.open(URL.createObjectURL(pdf.output('blob')),'_blank')}

function getMediaBounds(stage, media){
  const sr = stage.getBoundingClientRect();
  const mr = media.getBoundingClientRect();
  let x = mr.left - sr.left, y = mr.top - sr.top, w = mr.width, h = mr.height;
  if(!w || !h || w < 10 || h < 10){
    x = 0; y = 0; w = stage.clientWidth; h = stage.clientHeight;
  }
  return {x,y,w,h,maxX:x+w,maxY:y+h};
}
function clampCropToMedia(s, x=s.x, y=s.y, w=s.w, h=s.h){
  const b = getMediaBounds(s.stage, s.media);
  const minW = Math.min(60, b.w), minH = Math.min(40, b.h);
  if(s.ratio){
    if(w / h > s.ratio) h = w / s.ratio; else w = h * s.ratio;
  }
  w = Math.max(minW, Math.min(w, b.w));
  h = Math.max(minH, Math.min(h, b.h));
  if(s.ratio){
    if(w > b.w){ w = b.w; h = w / s.ratio; }
    if(h > b.h){ h = b.h; w = h * s.ratio; }
  }
  x = Math.max(b.x, Math.min(x, b.x + b.w - w));
  y = Math.max(b.y, Math.min(y, b.y + b.h - h));
  return {x,y,w,h};
}
function paintCrop(s){
  const c = clampCropToMedia(s);
  s.x=c.x; s.y=c.y; s.w=c.w; s.h=c.h;
  Object.assign(s.box.style,{left:s.x+'px',top:s.y+'px',width:s.w+'px',height:s.h+'px'});
}
function createCrop(stage,media,opt={}){
  const color=opt.color||"blue", ratio=opt.ratio||null;
  stage.querySelectorAll('.crop-selection').forEach(e=>e.remove());
  const box=document.createElement('div');
  box.className=`crop-selection ${color==='orange'?'orange':''}`;
  ['nw','n','ne','e','se','s','sw','w'].forEach(p=>{let h=document.createElement('span');h.className='handle '+p;h.dataset.handle=p;box.appendChild(h)});
  const label=document.createElement('em'); label.className='crop-badge'; label.textContent='Printable Area'; box.appendChild(label);
  stage.appendChild(box);
  const b=getMediaBounds(stage,media);
  let w=b.w*.72,h=b.h*.55;
  if(ratio){h=w/ratio;if(h>b.h*.86){h=b.h*.86;w=h*ratio}}
  let x=b.x+(b.w-w)/2,y=b.y+(b.h-h)/2;
  let state={stage,media,box,ratio,x,y,w,h};
  attachCropEvents(state);
  paintCrop(state);
  setTimeout(()=>paintCrop(state),250);
  window.addEventListener('resize',()=>paintCrop(state),{passive:true});
  return state;
}
function attachCropEvents(s){
  let mode=null,start={};
  const point=e=>e.touches?{x:e.touches[0].clientX,y:e.touches[0].clientY}:{x:e.clientX,y:e.clientY};
  s.box.addEventListener('mousedown',down);
  s.box.addEventListener('touchstart',down,{passive:false});
  function down(e){
    e.preventDefault();
    const p=point(e);
    mode=e.target.dataset.handle||'move';
    start={px:p.x,py:p.y,x:s.x,y:s.y,w:s.w,h:s.h};
    document.addEventListener('mousemove',move);
    document.addEventListener('mouseup',up);
    document.addEventListener('touchmove',move,{passive:false});
    document.addEventListener('touchend',up);
  }
  function move(e){
    e.preventDefault();
    const p=point(e), dx=p.x-start.px, dy=p.y-start.py;
    let x=start.x,y=start.y,w=start.w,h=start.h;
    if(mode==='move'){x+=dx;y+=dy}
    else{
      if(mode.includes('e'))w+=dx;
      if(mode.includes('s'))h+=dy;
      if(mode.includes('w')){x+=dx;w-=dx}
      if(mode.includes('n')){y+=dy;h-=dy}
      if(s.ratio){
        if(['e','w','ne','nw','se','sw'].includes(mode)) h=w/s.ratio;
        else w=h*s.ratio;
      }
    }
    const c=clampCropToMedia(s,x,y,w,h);
    s.x=c.x;s.y=c.y;s.w=c.w;s.h=c.h;
    Object.assign(s.box.style,{left:s.x+'px',top:s.y+'px',width:s.w+'px',height:s.h+'px'});
  }
  function up(){
    document.removeEventListener('mousemove',move);
    document.removeEventListener('mouseup',up);
    document.removeEventListener('touchmove',move);
    document.removeEventListener('touchend',up);
    updateA4Preview();
  }
}
async function cropFromElement(s){
  const media=s.media;
  let srcW,srcH,source;
  if(media.tagName==='CANVAS'){source=media;srcW=media.width;srcH=media.height;}
  else {source=await loadImage(media.src);srcW=source.width;srcH=source.height;}
  const mr=media.getBoundingClientRect(), sr=s.stage.getBoundingClientRect();
  const drawW=mr.width, drawH=mr.height, offX=mr.left-sr.left, offY=mr.top-sr.top;
  let rx=(s.x-offX)/drawW, ry=(s.y-offY)/drawH, rw=s.w/drawW, rh=s.h/drawH;
  rx=Math.max(0,Math.min(rx,1)); ry=Math.max(0,Math.min(ry,1));
  rw=Math.max(.01,Math.min(rw,1-rx)); rh=Math.max(.01,Math.min(rh,1-ry));
  const c=document.createElement('canvas'), ctx=c.getContext('2d');
  c.width=1200; c.height=Math.max(1,Math.round(1200*(srcH*rh)/(srcW*rw)));
  ctx.fillStyle='#fff'; ctx.fillRect(0,0,c.width,c.height);
  ctx.drawImage(source,srcW*rx,srcH*ry,srcW*rw,srcH*rh,0,0,c.width,c.height);
  return c.toDataURL('image/jpeg',.94);
}

function readFile(file){return new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=rej;r.readAsDataURL(file)})} function loadImage(src){return new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=rej;i.src=src})}

function compressorTool(){workspace.innerHTML=pageHeader("Image Compressor","Compress images to a target size.")+`<div class="card form"><input type="file" id="compFile" accept="image/*"><input id="targetKB" value="100" placeholder="Target KB"><button onclick="compressSimple()">Compress</button><div id="compOut"></div></div>`}
async function compressSimple(){const f=$("#compFile").files[0]; if(!f)return; const img=await loadImage(await readFile(f)); const c=document.createElement('canvas'),ctx=c.getContext('2d'); const w=900,h=Math.round(img.height*900/img.width); c.width=w;c.height=h;ctx.drawImage(img,0,0,w,h); const data=c.toDataURL('image/jpeg',.72); $("#compOut").innerHTML=`<img src="${data}" style="max-width:100%"><a download="compressed.jpg" href="${data}">Download</a>`}
function nameDateTool(){workspace.innerHTML=pageHeader("Name / Date Photo","Add text below a photo.")+`<div class="card form"><input type="file" id="ndFile" accept="image/*"><input id="ndName" placeholder="Name"><input id="ndDate" type="date"><button onclick="makeNameDate()">Create</button><div id="ndOut"></div></div>`}
async function makeNameDate(){const f=$("#ndFile").files[0]; if(!f)return; const img=await loadImage(await readFile(f)); const c=document.createElement('canvas'),ctx=c.getContext('2d'); const w=900,h=Math.round(img.height*900/img.width),cap=110; c.width=w;c.height=h+cap;ctx.fillStyle='#fff';ctx.fillRect(0,0,c.width,c.height);ctx.drawImage(img,0,0,w,h);ctx.fillStyle='#111';ctx.textAlign='center';ctx.font='bold 34px Arial';ctx.fillText($("#ndName").value,w/2,h+42);ctx.font='24px Arial';ctx.fillText($("#ndDate").value,w/2,h+82); const d=c.toDataURL('image/jpeg',.92);$("#ndOut").innerHTML=`<img src="${d}" style="max-width:100%"><a download="name-date.jpg" href="${d}">Download</a>`}
function imageResizeTool(){workspace.innerHTML=pageHeader("Resize Image","Resize image by custom dimensions.")+`<div class="card form"><input type="file" id="rsFile" accept="image/*"><input id="rsW" placeholder="Width px"><input id="rsH" placeholder="Height px"><button onclick="resizeImageSimple()">Resize</button><div id="rsOut"></div></div>`}
async function resizeImageSimple(){const f=$("#rsFile").files[0];if(!f)return; const img=await loadImage(await readFile(f)); const w=Number($("#rsW").value)||img.width,h=Number($("#rsH").value)||Math.round(img.height*w/img.width); const c=document.createElement('canvas'),ctx=c.getContext('2d');c.width=w;c.height=h;ctx.drawImage(img,0,0,w,h); const d=c.toDataURL('image/jpeg',.9);$("#rsOut").innerHTML=`<img src="${d}" style="max-width:100%"><a download="resized.jpg" href="${d}">Download</a>`}
function imageConverterTool(){workspace.innerHTML=pageHeader("Image Converter","Convert image format.")+`<div class="card form"><input type="file" id="cvFile" accept="image/*"><select id="cvType"><option value="image/jpeg">JPG</option><option value="image/png">PNG</option><option value="image/webp">WEBP</option></select><button onclick="convertImageSimple()">Convert</button><div id="cvOut"></div></div>`}
async function convertImageSimple(){const f=$("#cvFile").files[0];if(!f)return; const img=await loadImage(await readFile(f)); const c=document.createElement('canvas'),ctx=c.getContext('2d');c.width=img.width;c.height=img.height;ctx.drawImage(img,0,0); const type=$("#cvType").value; const d=c.toDataURL(type,.9);$("#cvOut").innerHTML=`<img src="${d}" style="max-width:100%"><a download="converted.${type.includes('png')?'png':type.includes('webp')?'webp':'jpg'}" href="${d}">Download</a>`}
function pdfStudio(){workspace.innerHTML=pageHeader("PDF Studio","PDF compression and resize tools.")+`<div class="home-grid"><div class="card home-card"><b>📄</b><h3>PDF Resizer</h3><p>Existing PDF tools will continue here.</p></div><div class="card home-card"><b>🔁</b><h3>Merge / Split</h3><p>Future-ready tool card.</p></div></div>`}
function loginTool(){workspace.innerHTML=pageHeader("Login / Create Account","Access dashboard, premium and payments.")+`<div class="auth-wrap"><div class="card form"><h3>Login</h3><input id="loginEmail" placeholder="Email"><input id="loginPassword" type="password" placeholder="Password"><button onclick="loginSubmit&&loginSubmit()">Login</button></div><div class="card form"><h3>Create Account</h3><input id="signupName" placeholder="Full Name"><input id="signupEmail" placeholder="Email"><input id="signupMobile" placeholder="Mobile"><textarea id="signupAddress" placeholder="Address"></textarea><input id="signupPassword" type="password" placeholder="Password"><button onclick="signupSubmit&&signupSubmit()">Create Account</button></div></div>`}
function dashboardTool(t){const u=getUser()||{}; workspace.innerHTML=pageHeader("My Dashboard",`Welcome, ${u.name||'User'}. Manage your profile, premium and documents.`)+`<div class="home-grid"><div class="card home-card"><b>👤</b><h3>${u.name||'Guest User'}</h3><p>${u.email||'Login to sync account'}</p></div><div class="card home-card"><b>👑</b><h3>${u.premium?'Premium':'Free Plan'}</h3><p>Membership status</p></div><div class="card home-card"><b>📁</b><h3>My Workspace</h3><p>Recent projects and downloads.</p></div></div>`}
function premiumTool(){workspace.innerHTML=pageHeader("Premium Plans","Upgrade for unlimited document tools.")+`<div class="home-grid"><div class="card home-card"><h3>Monthly</h3><b>₹49</b><p>30 days</p></div><div class="card home-card"><h3>Half Year</h3><b>₹149</b><p>180 days</p></div><div class="card home-card"><h3>Yearly</h3><b>₹499</b><p>365 days</p></div></div>`}
function paymentTool(){workspace.innerHTML=pageHeader("Payment","Generate QR and submit UTR.")+`<div class="card form"><select id="paymentPlan"><option>Monthly Premium - ₹49</option><option>Half Year Premium - ₹149</option><option>Yearly Premium - ₹499</option></select><button>Generate Payment QR</button><img src="payment_qr.jpg" style="max-width:280px;margin:20px auto;display:block"><input id="paymentTxn" placeholder="UTR / Transaction ID"><button onclick="submitPayment&&submitPayment()">Submit Payment</button></div>`}
function feedbackTool(){workspace.innerHTML=pageHeader("Support / Feedback","Send feedback or report an issue.")+`<div class="card form"><input id="feedbackName" placeholder="Name"><input id="feedbackEmail" placeholder="Email"><textarea id="feedbackMessage" placeholder="Message"></textarea><button onclick="submitFeedback&&submitFeedback()">Submit Feedback</button></div>`}
function adminTool(){workspace.innerHTML=pageHeader("Admin Panel","Users, payments, feedback and analytics.")+`<div class="home-grid"><div class="card home-card"><h3>Users</h3><p>Manage users</p></div><div class="card home-card"><h3>Payments</h3><p>Verify payments</p></div><div class="card home-card"><h3>Feedback</h3><p>Review messages</p></div></div>`}

/* =========================================================
   v39.3 ENTERPRISE FOUNDATION OVERRIDES
   Stable crop engine, CamScanner-style auto detect, print engine,
   payment QR flow, and safer PDF Studio.
========================================================= */
(function(){
  const TOP_MARGIN_MM = 2.2;
  const CARD_GAP_MM = 2.4;
  const CARD_W_MM = 85.6;
  const CARD_H_MM = 54;
  const PASS_W_MM = 35;
  const PASS_H_MM = 45;

  window.SPT39 = { TOP_MARGIN_MM, CARD_GAP_MM, CARD_W_MM, CARD_H_MM };

  function safeToast(m){ try{ toast(m); }catch(e){ console.log(m); } }

  window.pageHeader = function(title,sub,extra=""){
    return `<div class="page-title"><div><h1>${title}</h1><p>${sub}</p></div>${extra||`<span class="status-chip">● All systems operational</span>`}</div>`;
  };

  window.home = function(){
    workspace.innerHTML = pageHeader('Smart Photo Toolkit Pro','All-in-one tools for photos, documents and PDF productivity.') + `
      <div class="home-grid">
        <div class="card home-card" onclick="showTool('documentStudio')"><b>🪪</b><h3>Document Studio</h3><p>Aadhaar, PAN, Voter ID, Ayushman, ABHA and DL print with smart crop.</p></div>
        <div class="card home-card" onclick="showTool('imageStudio')"><b>🖼️</b><h3>Image Studio</h3><p>Passport, compressor, resize, crop, convert and name/date tools.</p></div>
        <div class="card home-card" onclick="showTool('pdfStudio')"><b>📄</b><h3>PDF Studio</h3><p>Resize, crop, merge, split, compress and convert PDF files.</p></div>
      </div>
      <div class="home-grid" style="margin-top:18px">
        <div class="card home-card"><b>🎯</b><h3>Smart Crop</h3><p>Auto-detect document edges and adjust manually with 8 handles.</p></div>
        <div class="card home-card"><b>🖨️</b><h3>Print Engine</h3><p>A4 top-center output with ${TOP_MARGIN_MM}mm margin and lamination gap.</p></div>
        <div class="card home-card"><b>👤</b><h3>Workspace</h3><p>Profile, payment, notifications and recent project foundation.</p></div>
      </div>`;
  };

  window.documentStudio = function(){ renderDocumentStudio(); };
  window.renderDocumentStudio = function(){
    const d = DOCS[appState.docType] || DOCS.aadhaar;
    workspace.innerHTML = pageHeader('Document Studio', 'Upload front/back images or a full page PDF, auto-detect/select printable area, then generate A4 output.') + `
      <div class="section-title">1. Select Document</div>
      <div class="doc-grid">${Object.entries(DOCS).map(([k,v])=>`
        <button class="doc-tile ${appState.docType===k?'active':''}" onclick="setDocType('${k}')">
          <span class="doc-icon ${v.cls}"><img src="${v.icon}" alt="${v.name}" onerror="this.style.display='none';this.parentElement.insertAdjacentHTML('beforeend','<b>${v.name.split(' ')[0]}</b>')"></span>
          <b>${v.name}</b><small>${v.size}</small>
        </button>`).join('')}</div>
      <div class="section-title">2. Select Mode</div>
      <div class="mode-row">
        <button class="mode-btn ${appState.docMode==='front'?'active':''}" onclick="setDocMode('front')">▣ Front</button>
        <button class="mode-btn ${appState.docMode==='back'?'active':''}" onclick="setDocMode('back')">▣ Back</button>
        <button class="mode-btn ${appState.docMode==='both'?'active':''}" onclick="setDocMode('both')">▣ Front + Back</button>
      </div>
      <div class="studio-grid">
        <div class="left-flow">
          <div class="flow-card">
            <h3>3. Upload Document</h3>
            <div class="tabs">
              <button class="tab ${appState.uploadTab==='image'?'active':''}" onclick="setUploadTab('image')">Image Upload</button>
              <button class="tab ${appState.uploadTab==='pdf'?'active':''}" onclick="setUploadTab('pdf')">Full Page PDF</button>
            </div>
            <div id="uploadArea">${appState.uploadTab==='image'?imageUploadHTML():pdfUploadHTML()}</div>
          </div>
          <div class="flow-card">
            <h3>4. Select Printable Area</h3>
            <p class="tool-subtitle">Auto Detect is applied after upload. You can still move/resize manually like CamScanner.</p>
            <div id="cropArea">${appState.uploadTab==='image'?imageCropHTML():pdfCropHTML()}</div>
            <div class="info-note">ⓘ Drag inside the box to move. Drag corners/sides to resize. Use Auto Detect if the selected area is not correct.</div>
          </div>
          <div class="bottom-actions">
            <button class="ghost-btn" onclick="showTool('documentStudio')">↺ Reset View</button>
            <button class="download-preview" onclick="downloadDocPDF()">⇩ Download PDF</button>
            <button class="print-main" onclick="printGeneratedPDF('doc')">▣ Print / Save as PDF</button>
          </div>
        </div>
        <div class="right-panel">
          <div class="preview-a4"><h3>5. Print Preview (A4)</h3><div class="a4-paper"><div class="preview-line" id="a4Preview"></div></div><div class="ok-note">✓ Top margin ${TOP_MARGIN_MM}mm and ${CARD_GAP_MM}mm gap for lamination</div></div>
          <div class="print-settings"><h3>6. Print Settings</h3>
            <div class="setting-row"><span>Paper Size</span><b>A4 (210 × 297 mm)</b></div>
            <div class="setting-row"><span>Orientation</span><b>Portrait</b></div>
            <div class="setting-row"><span>Top Margin</span><b>${TOP_MARGIN_MM} mm</b></div>
            <div class="setting-row"><span>Front - Back Gap</span><b>${CARD_GAP_MM} mm</b></div>
            <label>Copies<select id="docCopies" onchange="updateA4Preview()"><option value="1">1 Copy</option><option value="2">2 Copies</option><option value="4">4 Copies</option><option value="6">6 Copies</option></select></label>
          </div>
        </div>
      </div>`;
    initAfterRender();
  };

  window.imageCropHTML = function(){
    let needBack=appState.docMode!=="front", needFront=appState.docMode!=="back";
    return `<div class="crop-grid">${needFront?`<div class="crop-box-panel"><div class="crop-label">Front - Select Area</div><div class="crop-stage" id="frontStage">${appState.front?`<img src="${appState.front}" id="frontCropImg">`:`Upload front image first`}</div>${cropToolbar('front')}</div>`:""}${needBack?`<div class="crop-box-panel"><div class="crop-label">Back - Select Area</div><div class="crop-stage" id="backStage">${appState.back?`<img src="${appState.back}" id="backCropImg">`:`Upload back image first`}</div>${cropToolbar('back')}</div>`:""}</div>`;
  };

  window.pdfCropHTML = function(){
    return `<div class="crop-stage large" id="pdfStage">${appState.pdfCanvas?`<canvas id="pdfCanvasView"></canvas>`:`Upload full page PDF first`}</div>${cropToolbar('pdf')}<div class="crop-tools"><button class="primary" onclick="generateDocPDF()">Crop & Generate A4 PDF</button></div>`;
  };

  function cropToolbar(side){
    return `<div class="crop-toolbar-pro">
      <button onclick="rotateCropMedia('${side}',-90)">↶ Left</button>
      <button onclick="rotateCropMedia('${side}',90)">↷ Right</button>
      <button class="primary" onclick="autoDetectSide('${side}')">▣ Auto Detect</button>
      <button onclick="fitCropSide('${side}')">⛶ Fit All</button>
      <button onclick="resetDocCrop('${side}')">Reset</button>
    </div>`;
  }

  const oldLoadDocImage = window.loadDocImage;
  window.loadDocImage = async function(e,side){
    const f=e.target.files[0]; if(!f)return;
    appState[side]=await readFile(f); appState[side+'Crop']=null; renderDocumentStudio();
    setTimeout(()=>autoDetectSide(side),250);
  };

  const oldLoadPassportImg = window.loadPassportImg;
  window.loadPassportImg = async function(e){
    const f=e.target.files[0]; if(!f)return;
    appState.passportImg=await readFile(f);
    const stage=$("#passportStage");
    stage.innerHTML=`<img src="${appState.passportImg}" id="passportImg">`;
    setTimeout(()=>{appState.passportCrop=createCrop(stage,$("#passportImg"),{ratio:35/45,color:"orange"}); autoDetectCrop(appState.passportCrop,{keepRatio:true});},120);
  };

  window.resetPassportCrop = function(){
    if(!appState.passportImg)return;
    const stage=$("#passportStage"); stage.innerHTML=`<img src="${appState.passportImg}" id="passportImg">`;
    setTimeout(()=>{appState.passportCrop=createCrop(stage,$("#passportImg"),{ratio:35/45,color:"orange"}); autoDetectCrop(appState.passportCrop,{keepRatio:true});},80);
  };

  window.makePassportPDF = async function(){
    if(!appState.passportCrop)return safeToast('Upload and select photo area first');
    const src=await cropFromElement(appState.passportCrop);
    const n=Number($("#passLayout")?.value||5);
    const {jsPDF}=window.jspdf; const pdf=new jsPDF({unit:'mm',format:'a4'});
    const gap=3, cols=Math.max(1,Math.floor((210-2*TOP_MARGIN_MM+gap)/(PASS_W_MM+gap)));
    let x=TOP_MARGIN_MM, y=TOP_MARGIN_MM;
    for(let i=0;i<n;i++){
      if(i>0 && i%cols===0){x=TOP_MARGIN_MM; y+=PASS_H_MM+gap+6;}
      pdf.addImage(src,'JPEG',x,y,PASS_W_MM,PASS_H_MM); pdf.setDrawColor(0); pdf.rect(x,y,PASS_W_MM,PASS_H_MM); x+=PASS_W_MM+gap;
    }
    appState.passportPdf=pdf;
    $("#passportOutput").innerHTML=`<div class="preview-a4"><b>Passport PDF Ready</b><p>Top margin ${TOP_MARGIN_MM}mm. Final print size ${PASS_W_MM}×${PASS_H_MM}mm.</p></div>`;
    safeToast('Passport PDF generated');
  };

  window.initAfterRender = function(){
    setTimeout(()=>{
      if(appState.uploadTab==='image'){
        if(appState.front&&$("#frontStage")){appState.frontCrop=createCrop($("#frontStage"),$("#frontCropImg"),{color:'blue'}); setTimeout(()=>autoDetectCrop(appState.frontCrop),60);}
        if(appState.back&&$("#backStage")){appState.backCrop=createCrop($("#backStage"),$("#backCropImg"),{color:'blue'}); setTimeout(()=>autoDetectCrop(appState.backCrop),60);}
      }
      if(appState.uploadTab==='pdf'&&appState.pdfCanvas&&$("#pdfCanvasView")){
        drawPdfCanvasView(); appState.pdfCrop=createCrop($("#pdfStage"),$("#pdfCanvasView"),{color:'orange'}); setTimeout(()=>autoDetectCrop(appState.pdfCrop),80);
      }
      updateA4Preview();
    },100);
  };

  window.drawPdfCanvasView = function(){
    const view=$("#pdfCanvasView"), src=appState.pdfCanvas; if(!view||!src)return;
    const ctx=view.getContext('2d');
    const stage=$("#pdfStage");
    const maxW=Math.min(980, Math.max(320, stage?.clientWidth-30 || 900));
    const maxH=Math.min(760, Math.max(300, stage?.clientHeight-30 || 650));
    const ratio=src.width/src.height;
    let w=maxW, h=Math.round(w/ratio); if(h>maxH){h=maxH; w=Math.round(h*ratio);}
    view.width=w; view.height=h; ctx.fillStyle='#fff'; ctx.fillRect(0,0,w,h); ctx.drawImage(src,0,0,w,h);
  };

  window.generateDocPDF = async function(){
    await updateA4Preview();
    const imgs=[...$$("#a4Preview img")].map(i=>i.src);
    if(!imgs.length)return safeToast('Upload and select printable area first');
    const {jsPDF}=window.jspdf; const pdf=new jsPDF({unit:'mm',format:'a4'});
    const copies=Number($("#docCopies")?.value||1);
    let y=TOP_MARGIN_MM;
    for(let c=0;c<copies;c++){
      const rowW = imgs.length*CARD_W_MM + (imgs.length-1)*CARD_GAP_MM;
      let x=(210-rowW)/2;
      for(const s of imgs){pdf.addImage(s,'JPEG',x,y,CARD_W_MM,CARD_H_MM); pdf.setDrawColor(0); pdf.rect(x,y,CARD_W_MM,CARD_H_MM); x+=CARD_W_MM+CARD_GAP_MM;}
      y+=CARD_H_MM+CARD_GAP_MM;
      if(y>260&&c<copies-1){pdf.addPage(); y=TOP_MARGIN_MM;}
    }
    appState.previewPDF=pdf; safeToast(`A4 PDF generated: top ${TOP_MARGIN_MM}mm, gap ${CARD_GAP_MM}mm`);
  };

  // New crop engine with 8 handles + center mark
  window.createCrop = function(stage,media,opt={}){
    const color=opt.color||'blue', ratio=opt.ratio||null;
    stage.querySelectorAll('.crop-selection').forEach(e=>e.remove());
    const box=document.createElement('div'); box.className=`crop-selection ${color==='orange'?'orange':''}`;
    ['nw','n','ne','e','se','s','sw','w'].forEach(p=>{let h=document.createElement('span'); h.className='handle '+p; h.dataset.handle=p; box.appendChild(h);});
    const label=document.createElement('em'); label.className='crop-badge'; label.textContent='Printable Area'; box.appendChild(label);
    const center=document.createElement('span'); center.className='crop-center'; center.textContent='↕'; box.appendChild(center);
    stage.appendChild(box);
    const b=getMediaBounds(stage,media);
    let w=b.w*.78, h=b.h*.50;
    if(ratio){h=w/ratio; if(h>b.h*.88){h=b.h*.88; w=h*ratio;}}
    let state={stage,media,box,ratio,x:b.x+(b.w-w)/2,y:b.y+(b.h-h)/2,w,h,rotation:0};
    attachCropEvents(state); paintCrop(state); setTimeout(()=>paintCrop(state),250); window.addEventListener('resize',()=>paintCrop(state),{passive:true}); return state;
  };

  window.autoDetectSide = function(side){
    const s = side==='front'?appState.frontCrop:side==='back'?appState.backCrop:side==='pdf'?appState.pdfCrop:side==='passport'?appState.passportCrop:null;
    if(!s)return safeToast('Upload file first');
    autoDetectCrop(s); updateA4Preview(); safeToast('Auto Detect applied. Adjust manually if needed.');
  };

  window.fitCropSide = function(side){
    const s = side==='front'?appState.frontCrop:side==='back'?appState.backCrop:side==='pdf'?appState.pdfCrop:side==='passport'?appState.passportCrop:null;
    if(!s)return;
    const b=getMediaBounds(s.stage,s.media); const c=clampCropToMedia(s,b.x+4,b.y+4,b.w-8,b.h-8); Object.assign(s,c); paintCrop(s); updateA4Preview();
  };

  window.autoDetectCrop = async function(s,opt={}){
    try{
      const media=s.media; let src, sw, sh;
      if(media.tagName==='CANVAS'){src=media; sw=media.width; sh=media.height;} else {src=await loadImage(media.src); sw=src.width; sh=src.height;}
      const scale=Math.min(1,600/sw,600/sh), cw=Math.max(1,Math.round(sw*scale)), ch=Math.max(1,Math.round(sh*scale));
      const c=document.createElement('canvas'), ctx=c.getContext('2d',{willReadFrequently:true}); c.width=cw; c.height=ch; ctx.drawImage(src,0,0,cw,ch);
      const data=ctx.getImageData(0,0,cw,ch).data;
      const sample=(x,y)=>{const i=(Math.max(0,Math.min(ch-1,y))*cw+Math.max(0,Math.min(cw-1,x)))*4; return [data[i],data[i+1],data[i+2]];};
      const corners=[sample(4,4),sample(cw-5,4),sample(4,ch-5),sample(cw-5,ch-5)];
      const bg=[0,1,2].map(k=>corners.reduce((a,p)=>a+p[k],0)/4);
      let minX=cw,minY=ch,maxX=0,maxY=0,count=0;
      for(let y=0;y<ch;y+=3){for(let x=0;x<cw;x+=3){const p=sample(x,y); const dist=Math.abs(p[0]-bg[0])+Math.abs(p[1]-bg[1])+Math.abs(p[2]-bg[2]); const bright=(p[0]+p[1]+p[2])/3; if(dist>70 || bright<235 && dist>45){minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);count++;}}}
      const b=getMediaBounds(s.stage,s.media);
      if(count<80 || maxX<=minX || maxY<=minY){ // safe default central card
        const w=b.w*.82,h=s.ratio?(b.w*.82)/s.ratio:b.h*.62; const c2=clampCropToMedia(s,b.x+(b.w-w)/2,b.y+(b.h-h)/2,w,h); Object.assign(s,c2); paintCrop(s); return;
      }
      const pad=0.02; let rx=Math.max(0,minX/cw-pad), ry=Math.max(0,minY/ch-pad), rw=Math.min(1,maxX/cw+pad)-rx, rh=Math.min(1,maxY/ch+pad)-ry;
      let x=b.x+rx*b.w,y=b.y+ry*b.h,w=rw*b.w,h=rh*b.h;
      if(s.ratio){ const current=w/h; if(current>s.ratio){h=w/s.ratio}else{w=h*s.ratio} }
      const c3=clampCropToMedia(s,x,y,w,h); Object.assign(s,c3); paintCrop(s);
    }catch(err){ console.warn(err); }
  };

  window.rotateCropMedia = async function(side,deg){
    try{
      if(side==='pdf')return safeToast('PDF page rotation coming next; use manual selection for now.');
      let key = side==='passport'?'passportImg':side;
      let src = appState[key]; if(!src)return safeToast('Upload image first');
      const img=await loadImage(src); const c=document.createElement('canvas'), ctx=c.getContext('2d');
      const rad=deg*Math.PI/180; if(Math.abs(deg)%180===90){c.width=img.height;c.height=img.width;} else {c.width=img.width;c.height=img.height;}
      ctx.translate(c.width/2,c.height/2); ctx.rotate(rad); ctx.drawImage(img,-img.width/2,-img.height/2);
      appState[key]=c.toDataURL('image/jpeg',.94);
      if(side==='passport') resetPassportCrop(); else renderDocumentStudio();
    }catch(e){safeToast('Rotate failed');}
  };

  window.paymentTool = function(){
    workspace.innerHTML=pageHeader('Payment','Select plan, generate QR, then submit UTR for verification.')+`
    <div class="card form"><label>Plan</label><select id="paymentPlan"><option data-amt="49">Monthly Premium - ₹49</option><option data-amt="149">Half Year Premium - ₹149</option><option data-amt="499">Yearly Premium - ₹499</option></select>
    <button onclick="generatePayQR()">Generate Payment QR</button>
    <div id="payQrBox" class="payment-qr-box"><img src="payment_qr.jpg" style="max-width:280px;margin:20px auto;display:block;border-radius:18px"><b>UPI: kait.satnam@sbi</b><p>Scan and pay the selected amount.</p></div>
    <input id="paymentTxn" placeholder="UTR / Transaction ID"><input id="paymentScreenshot" placeholder="Payment screenshot URL optional"><button onclick="submitPayment&&submitPayment()">Submit Payment</button></div>`;
  };
  window.generatePayQR=function(){ const box=$("#payQrBox"); box?.classList.add('show'); safeToast('QR generated. Complete payment and enter UTR.'); };

  window.pdfStudio = function(){
    workspace.innerHTML=pageHeader('PDF Studio','Resize, crop, merge, split, compress and convert PDF files.')+`
      <div class="pdf-tool-grid">
        <div class="pdf-tool-card" onclick="pdfToolUI('safe')"><b>📄</b><h3>PDF Resizer / Safe Export</h3><p>Upload and export PDF safely without hanging.</p></div>
        <div class="pdf-tool-card" onclick="pdfToolUI('merge')"><b>➕</b><h3>Merge PDFs</h3><p>Combine multiple PDFs into one file.</p></div>
        <div class="pdf-tool-card" onclick="pdfToolUI('split')"><b>✂️</b><h3>Split PDF</h3><p>Extract selected page range.</p></div>
        <div class="pdf-tool-card" onclick="pdfToolUI('rotate')"><b>↻</b><h3>Rotate PDF</h3><p>Rotate pages left/right.</p></div>
        <div class="pdf-tool-card" onclick="pdfToolUI('jpgpdf')"><b>🖼️</b><h3>Image to PDF</h3><p>Create PDF from JPG/PNG.</p></div>
        <div class="pdf-tool-card" onclick="pdfToolUI('pdfjpg')"><b>🧾</b><h3>PDF to JPG</h3><p>Export first page as image.</p></div>
      </div><div id="pdfWork" class="pdf-work-area"></div>`;
  };

  window.pdfToolUI=function(type){
    const box=$("#pdfWork");
    if(type==='merge') box.innerHTML=`<div class="card form"><h3>Merge PDFs</h3><input id="pdfMergeFiles" type="file" accept="application/pdf" multiple><button onclick="mergePDFs()">Merge & Download</button></div>`;
    else if(type==='split') box.innerHTML=`<div class="card form"><h3>Split PDF</h3><input id="pdfSplitFile" type="file" accept="application/pdf"><input id="splitFrom" placeholder="From page" value="1"><input id="splitTo" placeholder="To page" value="1"><button onclick="splitPDF()">Split & Download</button></div>`;
    else if(type==='rotate') box.innerHTML=`<div class="card form"><h3>Rotate PDF</h3><input id="pdfRotateFile" type="file" accept="application/pdf"><select id="rotateDeg"><option value="90">90° Right</option><option value="-90">90° Left</option><option value="180">180°</option></select><button onclick="rotatePDF()">Rotate & Download</button></div>`;
    else if(type==='jpgpdf') box.innerHTML=`<div class="card form"><h3>Image to PDF</h3><input id="imgPdfFiles" type="file" accept="image/*" multiple><button onclick="imagesToPDF()">Create PDF</button></div>`;
    else if(type==='pdfjpg') box.innerHTML=`<div class="card form"><h3>PDF to JPG</h3><input id="pdfJpgFile" type="file" accept="application/pdf"><button onclick="pdfFirstPageToJPG()">Export First Page</button><div id="pdfJpgOut"></div></div>`;
    else box.innerHTML=`<div class="card form"><h3>PDF Safe Export</h3><input id="pdfSafeFile" type="file" accept="application/pdf"><button onclick="safePDFExport()">Download Optimized Copy</button></div>`;
  };
  async function pdfBytesFromInput(input){const f=input.files[0]; if(!f)throw new Error('Select PDF first'); return new Uint8Array(await f.arrayBuffer());}
  window.safePDFExport=async function(){try{const bytes=await pdfBytesFromInput($("#pdfSafeFile")); const doc=await PDFLib.PDFDocument.load(bytes); const out=await doc.save(); downloadBlob(out,'optimized.pdf','application/pdf');}catch(e){safeToast(e.message)}};
  window.mergePDFs=async function(){try{const files=[...$("#pdfMergeFiles").files]; if(!files.length)return safeToast('Select PDFs'); const out=await PDFLib.PDFDocument.create(); for(const f of files){const d=await PDFLib.PDFDocument.load(await f.arrayBuffer()); const pages=await out.copyPages(d,d.getPageIndices()); pages.forEach(p=>out.addPage(p));} downloadBlob(await out.save(),'merged.pdf','application/pdf');}catch(e){safeToast(e.message)}};
  window.splitPDF=async function(){try{const bytes=await pdfBytesFromInput($("#pdfSplitFile")); const src=await PDFLib.PDFDocument.load(bytes); const out=await PDFLib.PDFDocument.create(); let from=Math.max(1,Number($("#splitFrom").value||1)), to=Math.min(src.getPageCount(),Number($("#splitTo").value||from)); const pages=await out.copyPages(src,Array.from({length:to-from+1},(_,i)=>from-1+i)); pages.forEach(p=>out.addPage(p)); downloadBlob(await out.save(),`pages-${from}-${to}.pdf`,'application/pdf');}catch(e){safeToast(e.message)}};
  window.rotatePDF=async function(){try{const bytes=await pdfBytesFromInput($("#pdfRotateFile")); const doc=await PDFLib.PDFDocument.load(bytes); const deg=Number($("#rotateDeg").value); doc.getPages().forEach(p=>p.setRotation(PDFLib.degrees(deg))); downloadBlob(await doc.save(),'rotated.pdf','application/pdf');}catch(e){safeToast(e.message)}};
  window.imagesToPDF=async function(){try{const files=[...$("#imgPdfFiles").files]; if(!files.length)return safeToast('Select images'); const {jsPDF}=window.jspdf; const pdf=new jsPDF({unit:'mm',format:'a4'}); for(let i=0;i<files.length;i++){if(i)pdf.addPage(); const data=await readFile(files[i]); const img=await loadImage(data); const w=190,h=Math.min(277,190*img.height/img.width); pdf.addImage(data,'JPEG',10,10,w,h);} pdf.save('images.pdf');}catch(e){safeToast(e.message)}};
  window.pdfFirstPageToJPG=async function(){try{const f=$("#pdfJpgFile").files[0]; if(!f)return safeToast('Select PDF'); const pdf=await pdfjsLib.getDocument({data:await f.arrayBuffer()}).promise; const page=await pdf.getPage(1); const vp=page.getViewport({scale:2}); const c=document.createElement('canvas'); c.width=vp.width;c.height=vp.height; await page.render({canvasContext:c.getContext('2d'),viewport:vp}).promise; const data=c.toDataURL('image/jpeg',.92); $("#pdfJpgOut").innerHTML=`<img src="${data}" style="max-width:100%"><a download="pdf-page-1.jpg" href="${data}">Download JPG</a>`;}catch(e){safeToast(e.message)}};
  function downloadBlob(bytes,name,type){const blob=new Blob([bytes],{type}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=name; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),1000);}

  const oldUpdateTopUser=window.updateTopUser;
  window.updateTopUser=function(){oldUpdateTopUser&&oldUpdateTopUser(); try{const saved=JSON.parse(localStorage.getItem('spt_profile')||'{}'); if(saved.name){$("#headerUserName").textContent=saved.name;$("#headerAvatar").textContent=saved.name[0].toUpperCase();}}catch(e){}};

  window.dashboardTool=function(t){
    const u=getUser()||{}; const saved=JSON.parse(localStorage.getItem('spt_profile')||'{}'); const name=saved.name||u.name||'Guest User';
    workspace.innerHTML=pageHeader('My Dashboard',`Welcome, ${name}. Manage your profile, premium and workspace.`)+`
    <div class="home-grid"><div class="card home-card"><b>👤</b><h3>${name}</h3><p>${u.email||saved.email||'Login to sync account'}</p></div><div class="card home-card"><b>👑</b><h3>${u.premium?'Premium':'Free Plan'}</h3><p>Membership status</p></div><div class="card home-card"><b>🔔</b><h3>Notifications</h3><p>3 unread system updates</p></div></div>
    <div class="card form" style="margin-top:18px"><h3>Edit Profile</h3><input id="profileName" value="${name}" placeholder="Full name"><input id="profileMobile" value="${saved.mobile||''}" placeholder="Mobile"><textarea id="profileAddress" placeholder="Address">${saved.address||''}</textarea><input id="profileDp" type="file" accept="image/*"><button onclick="saveLocalProfile()">Save Profile</button></div>`;
  };
  window.saveLocalProfile=async function(){const p={name:$("#profileName").value.trim(),mobile:$("#profileMobile").value.trim(),address:$("#profileAddress").value.trim()}; const f=$("#profileDp").files[0]; if(f)p.dp=await readFile(f); localStorage.setItem('spt_profile',JSON.stringify(p)); updateTopUser(); safeToast('Profile saved on this device');};

})();
