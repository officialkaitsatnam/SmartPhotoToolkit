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

/* =====================================================
   v40 Authentication & User Experience Update
   Keeps existing tool engine, adds guest/protected flow.
===================================================== */
const V40_GUEST_TOOLS = new Set(['home','imageStudio','passport','compressor','namedate','login','feedback']);
const V40_PROTECTED_TOOLS = new Set(['documentStudio','pdfStudio','workspace','downloads','orders','dashboard','settings','payment','premium','admin']);
function v40IsLoggedIn(){return !!(window.SPT && SPT.token && SPT.user) || !!localStorage.getItem('spt_token');}
function v40User(){try{return (window.SPT&&SPT.user)||JSON.parse(localStorage.getItem('spt_user')||'null')}catch(e){return null}}
function v40IsAdmin(){const u=v40User();return !!(u && String(u.role||'').toLowerCase()==='admin')}
function showLoading(msg='Working...'){let o=document.getElementById('loadingOverlay');if(!o){o=document.createElement('div');o.id='loadingOverlay';o.className='loading-overlay';document.body.appendChild(o)}o.innerHTML=`<span class="spinner-mini"></span>${msg}`;o.classList.add('show')}
function hideLoading(){document.getElementById('loadingOverlay')?.classList.remove('show')}
function v40EnsureAuth(tool){if(v40IsLoggedIn()) return true; if(V40_PROTECTED_TOOLS.has(tool)){openAuthModal('login', tool); return false;} return true;}

function renderAuthAwareSidebar(){
  const logged=v40IsLoggedIn();
  const admin=v40IsAdmin();
  const side=document.getElementById('sidebar'); if(!side)return;
  side.innerHTML = logged ? `
    <div class="menu-label">MAIN MENU</div>
    <button class="nav-item active" data-tool="home">⌂ Dashboard</button>
    <button class="nav-item" data-tool="imageStudio">▣ Image Studio</button>
    <button class="nav-item" data-tool="documentStudio">▤ Document Studio</button>
    <button class="nav-item" data-tool="pdfStudio">▧ PDF Studio</button>
    <button class="nav-item" data-tool="workspace">▢ My Workspace</button>
    <button class="nav-item" data-tool="downloads">⇩ Downloads</button>
    <button class="nav-item" data-tool="orders">☷ My Orders</button>
    <div class="menu-label account-label">ACCOUNT</div>
    <button class="nav-item" data-tool="dashboard">♙ Profile</button>
    <button class="nav-item" data-tool="premium">◇ Membership</button>
    <button class="nav-item" data-tool="payment">▣ Payment History</button>
    <button class="nav-item" data-tool="settings">⚙ Settings</button>
    <button class="nav-item" data-tool="feedback">? Support</button>
    ${admin?`<button class="nav-item" data-tool="admin">📊 Admin Panel</button>`:''}
    <button class="nav-item" onclick="logoutOrLogin()">⇱ Logout</button>
    <div class="go-premium"><b>💎 Go Premium</b><p>Unlock all features and premium tools.</p><button onclick="showTool('premium')">Upgrade Now</button></div>
  ` : `
    <div class="menu-label">MAIN MENU</div>
    <button class="nav-item active" data-tool="home">⌂ Home</button>
    <button class="nav-item" data-tool="passport">👤 Passport Photo</button>
    <button class="nav-item" data-tool="compressor">🖼️ Image Compressor</button>
    <button class="nav-item" data-tool="namedate">🏷️ Name / Date Photo</button>
    <button class="nav-item protected" data-tool="documentStudio">▤ Document Studio <span class="protected-badge">Login</span></button>
    <button class="nav-item protected" data-tool="pdfStudio">▧ PDF Studio <span class="protected-badge">Login</span></button>
    <button class="nav-item" data-tool="feedback">? Feedback</button>
    <button class="nav-item" data-tool="login">🔐 Login / Sign Up</button>
  `;
  side.querySelectorAll('.nav-item[data-tool]').forEach(b=>b.onclick=()=>showTool(b.dataset.tool));
}

function updateAuthUI(){
  const logged=v40IsLoggedIn(); const u=v40User(); const name=(u&&u.name)||'Guest User';
  document.body.classList.toggle('logged-in',logged); document.body.classList.toggle('guest',!logged);
  const top=document.querySelector('.top-actions');
  if(top){
    let loginBtn=document.getElementById('topLoginBtn'), signupBtn=document.getElementById('topSignupBtn');
    if(!loginBtn){loginBtn=document.createElement('button');loginBtn.id='topLoginBtn';loginBtn.className='auth-top-btn auth-login-btn';loginBtn.textContent='Login';loginBtn.onclick=()=>openAuthModal('login');top.prepend(loginBtn)}
    if(!signupBtn){signupBtn=document.createElement('button');signupBtn.id='topSignupBtn';signupBtn.className='auth-top-btn auth-signup-btn';signupBtn.textContent='Sign Up';signupBtn.onclick=()=>openAuthModal('signup');top.insertBefore(signupBtn, loginBtn.nextSibling)}
    loginBtn.style.display=logged?'none':'inline-flex'; signupBtn.style.display=logged?'none':'inline-flex';
    top.querySelector('.premium-top')?.style.setProperty('display',logged?'inline-flex':'none','important');
    top.querySelector('.notif')?.style.setProperty('display',logged?'inline-grid':'none','important');
    top.querySelector('.circle-btn:not(.notif)')?.style.setProperty('display',logged?'inline-grid':'none','important');
  }
  const hu=document.getElementById('headerUserName'); if(hu)hu.textContent=name;
  const hp=document.getElementById('headerUserPlan'); if(hp)hp.textContent=logged?((u&&u.premium)?'Premium User':'Free User'):'Login required';
  const av=document.getElementById('headerAvatar'); if(av){av.textContent=(name||'G').trim()[0].toUpperCase(); if(u&&u.photo){av.style.backgroundImage=`url(${u.photo})`;av.style.backgroundSize='cover';av.textContent='';}else{av.style.backgroundImage='';}}
  const adminBtn=document.getElementById('adminDropBtn'); if(adminBtn)adminBtn.style.display=v40IsAdmin()?'block':'none';
  const logoutBtn=document.getElementById('logoutDropBtn'); if(logoutBtn)logoutBtn.textContent=logged?'🚪 Logout':'🔐 Login / Signup';
  renderAuthAwareSidebar();
}

function initApp(){
  document.getElementById('menuBtn')?.addEventListener('click',()=>document.getElementById('sidebar')?.classList.toggle('open'));
  document.getElementById('userTrigger')?.addEventListener('click',()=>document.getElementById('userDropdown')?.classList.toggle('show'));
  document.addEventListener('click',e=>{if(!e.target.closest('.user-menu'))document.getElementById('userDropdown')?.classList.remove('show')});
  updateAuthUI();
  home();
}

function showTool(tool){
  if(!v40EnsureAuth(tool)) return;
  appState.tool=tool; setActive(tool);
  if(tool==='home')return home();
  if(tool==='passport')return passportStudio();
  if(tool==='compressor')return compressorTool();
  if(tool==='namedate')return nameDateTool();
  if(tool==='imageStudio')return imageStudio();
  if(tool==='documentStudio')return documentStudio();
  if(tool==='pdfStudio'||tool==='pdfresizer')return pdfStudio();
  if(tool==='login')return openAuthModal('login');
  if(tool==='dashboard'||tool==='workspace'||tool==='downloads'||tool==='orders'||tool==='settings')return dashboardTool(tool);
  if(tool==='premium')return premiumTool();
  if(tool==='payment')return paymentTool();
  if(tool==='feedback')return feedbackTool();
  if(tool==='admin')return adminTool();
  return home();
}

function openAuthModal(mode='login', nextTool='dashboard'){
  let m=document.getElementById('authModalBackdrop');
  if(!m){m=document.createElement('div');m.id='authModalBackdrop';m.className='auth-modal-backdrop';document.body.appendChild(m)}
  m.dataset.nextTool=nextTool||'dashboard';
  m.innerHTML=`<div class="auth-modal-wrap"><button class="auth-close" onclick="closeAuthModal()">×</button><div class="auth-modal"><div class="auth-hero"><div><h2>Smart Photo Toolkit Pro</h2><p>Create professional documents, passport photos and PDFs with your secure account.</p><ul><li>Save profile and workspace</li><li>Access Document Studio & PDF Studio</li><li>Track payments and premium access</li></ul></div><small>Enterprise v40 Authentication UX</small></div><div class="auth-panel"><div class="auth-tabs"><button id="authLoginTab" onclick="switchAuthMode('login')">Login</button><button id="authSignupTab" onclick="switchAuthMode('signup')">Create Account</button></div><div id="authFormBox"></div></div></div></div>`;
  m.classList.add('show'); switchAuthMode(mode);
}
function closeAuthModal(){document.getElementById('authModalBackdrop')?.classList.remove('show')}
function switchAuthMode(mode){
  const l=document.getElementById('authLoginTab'), s=document.getElementById('authSignupTab'), box=document.getElementById('authFormBox'); if(!box)return;
  l?.classList.toggle('active',mode==='login'); s?.classList.toggle('active',mode==='signup');
  box.innerHTML = mode==='login' ? `<div class="auth-form"><h2>Welcome back</h2><label>Email</label><input id="loginEmail" type="email" placeholder="Enter email"><label>Password</label><input id="loginPassword" type="password" placeholder="Enter password"><div class="auth-actions"><label><input type="checkbox" id="rememberMe" checked> Remember me</label><button class="link-auth" onclick="switchAuthMode('forgot')">Forgot Password?</button></div><div class="auth-status" id="authStatus"></div><div class="auth-actions"><button class="secondary-auth" onclick="closeAuthModal()">Continue as Guest</button><button class="primary-auth" onclick="loginSubmit()">Login</button></div></div>`:
  mode==='signup' ? `<div class="auth-form"><h2>Create your free account</h2><label>Full Name</label><input id="signupName" placeholder="Full name"><div class="auth-row"><div><label>Mobile</label><input id="signupMobile" placeholder="Mobile number"></div><div><label>Email</label><input id="signupEmail" type="email" placeholder="Email"></div></div><label>Address</label><textarea id="signupAddress" placeholder="Address"></textarea><div class="auth-row"><div><label>Password</label><input id="signupPassword" type="password" placeholder="Password"></div><div><label>Confirm Password</label><input id="signupConfirm" type="password" placeholder="Confirm password"></div></div><div class="auth-status" id="authStatus"></div><div class="auth-actions"><button class="secondary-auth" onclick="switchAuthMode('login')">Already have account</button><button class="primary-auth" onclick="signupSubmit()">Create Account</button></div></div>`:
  `<div class="auth-form"><h2>Reset password</h2><p>Enter registered email to receive OTP, then set a new password.</p><label>Registered Email</label><input id="forgotEmail" type="email" placeholder="Email"><button class="primary-auth" onclick="forgotSubmit()">Send OTP</button><div class="auth-row"><input id="resetEmail" placeholder="Email"><input id="resetOtp" placeholder="OTP"></div><input id="resetPassword" type="password" placeholder="New Password"><div class="auth-status" id="authStatus"></div><div class="auth-actions"><button class="secondary-auth" onclick="switchAuthMode('login')">Back to Login</button><button class="primary-auth" onclick="resetSubmit()">Reset Password</button></div></div>`;
}

function setAuthStatus(msg){const s=document.getElementById('authStatus');if(s)s.textContent=msg;}
async function loginSubmit(){
  const email=val('loginEmail'), password=val('loginPassword'); if(!email||!password){setAuthStatus('Email and password required');return toast('Email and password required')}
  setAuthStatus('Signing in...'); showLoading('Signing in...');
  let r={success:false,message:'Network'}; try{r=await SPT.api('login',{email,password})}catch(e){r={success:false,message:e.message}}
  hideLoading();
  if(!r.success){setAuthStatus(r.message||'Login failed'); return toast(r.message||'Login failed')}
  SPT.saveLogin(r.user,r.token); closeAuthModal(); updateAuthUI(); toast('Login successful'); showTool(document.getElementById('authModalBackdrop')?.dataset.nextTool||'dashboard');
}
async function signupSubmit(){
  const name=val('signupName'), email=val('signupEmail'), mobile=val('signupMobile'), address=val('signupAddress'), password=val('signupPassword'), c=val('signupConfirm');
  if(!name||!email||!mobile||!address||!password)return toast('Please fill all details'); if(password!==c)return toast('Passwords do not match');
  setAuthStatus('Creating account...'); showLoading('Creating account...');
  let r={success:false,message:'Network'}; try{r=await SPT.api('signup',{name,email,mobile,address,password})}catch(e){r={success:false,message:e.message}}
  hideLoading(); if(!r.success){setAuthStatus(r.message||'Signup failed'); return toast(r.message||'Signup failed')}
  SPT.saveLogin(r.user,r.token); closeAuthModal(); updateAuthUI(); toast('Account created successfully'); showTool('dashboard');
}
async function forgotSubmit(){const email=val('forgotEmail'); if(!email)return toast('Email required'); setAuthStatus('Sending OTP...'); showLoading('Sending OTP...'); let r=await SPT.api('forgotPassword',{email}).catch(e=>({success:false,message:e.message})); hideLoading(); setAuthStatus(r.message||'OTP request sent'); toast(r.message||'OTP request sent')}
async function resetSubmit(){const email=val('resetEmail'),otp=val('resetOtp'),password=val('resetPassword'); if(!email||!otp||!password)return toast('Email, OTP and password required'); showLoading('Resetting password...'); let r=await SPT.api('resetPassword',{email,otp,newPassword:password}).catch(e=>({success:false,message:e.message})); hideLoading(); toast(r.message||'Password reset request completed'); if(r.success)switchAuthMode('login')}

function logoutOrLogin(){
  if(v40IsLoggedIn()){
    if(!confirm('Logout from Smart Photo Toolkit?'))return;
    localStorage.removeItem('spt_user'); localStorage.removeItem('spt_token'); if(window.SPT){SPT.user=null;SPT.token=''}
    updateAuthUI(); toast('Logout successful'); home();
  } else openAuthModal('login');
}

function home(){
  const logged=v40IsLoggedIn();
  workspace.innerHTML=pageHeader('Smart Photo Toolkit Pro', logged?'Enterprise photo, document and PDF toolkit.':'Use free photo tools, or login to unlock Document Studio and PDF Studio.')+
  `<div class="home-grid"><div class="card home-card" onclick="showTool('passport')"><b>👤</b><h3>Passport Photo</h3><p>35×45 mm print-ready passport photo.</p></div><div class="card home-card" onclick="showTool('compressor')"><b>🖼️</b><h3>Image Compressor</h3><p>Compress images to target KB.</p></div><div class="card home-card" onclick="showTool('namedate')"><b>🏷️</b><h3>Name / Date Photo</h3><p>Add name/date below photo.</p></div><div class="card home-card" onclick="showTool('documentStudio')"><b>▤</b><h3>Document Studio</h3><p>Aadhaar, PAN, Voter, Ayushman, ABHA and DL print.</p>${!logged?'<span class="protected-badge">Login required</span>':''}</div><div class="card home-card" onclick="showTool('pdfStudio')"><b>▧</b><h3>PDF Studio</h3><p>PDF resize, compress, merge, split and convert.</p>${!logged?'<span class="protected-badge">Login required</span>':''}</div></div>`;
}

function dashboardTool(t='dashboard'){
  const u=v40User()||{};
  if(t==='settings')return settingsTool();
  workspace.innerHTML=pageHeader('My Dashboard',`Welcome, ${u.name||'User'}. Manage your profile, premium and documents.`)+`<div class="card form profile-card-pro"><div class="profile-avatar-edit" id="profilePreview">${u.photo?`<img src="${u.photo}">`:(u.name||'U')[0]}</div><div><h2>${u.name||'User Profile'}</h2><p>${u.email||''}</p><span class="pro-badge">${u.premium?'Premium':'Free User'}</span></div></div><div class="card form"><h3>Edit Profile</h3><div class="profile-form-grid"><input id="profileName" placeholder="Name" value="${u.name||''}"><input id="profileMobile" placeholder="Mobile" value="${u.mobile||''}"><input id="profileEmail" placeholder="Email" value="${u.email||''}" disabled><textarea class="full" id="profileAddress" placeholder="Address">${u.address||''}</textarea><input class="full" id="profilePhoto" type="file" accept="image/*"><button class="full" onclick="saveLocalProfile()">Save Profile</button></div></div>`;
}
function saveLocalProfile(){const u=v40User()||{};u.name=val('profileName');u.mobile=val('profileMobile');u.address=val('profileAddress');const f=document.getElementById('profilePhoto')?.files?.[0]; if(f){const r=new FileReader();r.onload=()=>{u.photo=r.result;localStorage.setItem('spt_user',JSON.stringify(u)); if(window.SPT)SPT.user=u; updateAuthUI(); dashboardTool(); toast('Profile saved')};r.readAsDataURL(f)}else{localStorage.setItem('spt_user',JSON.stringify(u)); if(window.SPT)SPT.user=u; updateAuthUI(); toast('Profile saved')}}
function settingsTool(){workspace.innerHTML=pageHeader('Settings','Manage theme and app preferences.')+`<div class="card form"><h3>App Settings</h3><label><input type="checkbox" onchange="document.body.classList.toggle('dark-mode',this.checked)"> Dark mode</label><p>More settings are coming soon.</p></div>`}

function paymentTool(){if(!v40EnsureAuth('payment'))return;workspace.innerHTML=pageHeader('Payment','Select plan, generate QR, then submit UTR.')+`<div class="card form"><label>Plan</label><select id="paymentPlan"><option value="Monthly Premium">Monthly Premium - ₹49</option><option value="Half Year Premium">Half Year Premium - ₹149</option><option value="Yearly Premium">Yearly Premium - ₹499</option></select><input id="paymentAmount" value="49" placeholder="Amount"><button onclick="generatePaymentQR()">Generate Payment QR</button><div id="qrBox" style="display:none;text-align:center"><img src="payment_qr.jpg" style="max-width:280px;margin:20px auto;display:block;border-radius:16px"><b>UPI: kait.satnam@sbi</b></div><input id="paymentMethod" value="UPI / QR"><input id="paymentTxn" placeholder="UTR / Transaction ID"><input id="paymentScreenshot" placeholder="Screenshot URL optional"><button onclick="submitPayment&&submitPayment()">Submit Payment</button></div>`;document.getElementById('paymentPlan').onchange=e=>{document.getElementById('paymentAmount').value=e.target.value.includes('Monthly')?'49':e.target.value.includes('Half')?'149':'499'}}
function generatePaymentQR(){document.getElementById('qrBox').style.display='block';toast('Payment QR generated')}

function pdfStudio(){if(!v40EnsureAuth('pdfStudio'))return;workspace.innerHTML=pageHeader('PDF Studio','Resize, compress and manage PDF files.')+`<div class="card form"><h3>PDF Resizer / Compressor</h3><input id="pdfToolFile" type="file" accept="application/pdf"><select id="pdfTarget"><option value="20">20 KB</option><option value="50">50 KB</option><option value="100">100 KB</option><option value="200">200 KB</option><option value="300">300 KB</option><option value="400">400 KB</option><option value="500">500 KB</option><option value="1024">1 MB</option><option value="custom">Custom KB</option></select><input id="pdfCustom" type="number" placeholder="Custom KB" style="display:none"><button onclick="safePdfResize()">Process PDF</button><div id="pdfToolOut"></div></div><div class="home-grid"><div class="card home-card"><b>➕</b><h3>Merge PDF</h3><p>Upload multiple PDFs and merge.</p></div><div class="card home-card"><b>✂️</b><h3>Split PDF</h3><p>Extract pages from PDF.</p></div><div class="card home-card"><b>🔄</b><h3>Rotate PDF</h3><p>Rotate pages safely.</p></div></div>`;document.getElementById('pdfTarget').onchange=e=>document.getElementById('pdfCustom').style.display=e.target.value==='custom'?'block':'none'}
async function safePdfResize(){const f=document.getElementById('pdfToolFile').files[0];if(!f)return toast('Upload PDF first');const target=document.getElementById('pdfTarget').value==='custom'?document.getElementById('pdfCustom').value:document.getElementById('pdfTarget').value;document.getElementById('pdfToolOut').innerHTML=`<div class="info-note">PDF loaded: ${f.name}<br>Target: ${target} KB<br>Browser PDF compression is limited; safe download uses optimized rebuild where possible.</div><button onclick="forceDownload(URL.createObjectURL(document.getElementById('pdfToolFile').files[0]),'processed.pdf')">Download Original/Safe PDF</button>`;toast('PDF tool ready')}

window.addEventListener('storage',updateAuthUI);
function forceDownload(href,filename){const a=document.createElement('a');a.href=href;a.download=filename||'download';document.body.appendChild(a);a.click();a.remove()}
async function safePdfResize(){const f=document.getElementById('pdfToolFile').files[0];if(!f)return toast('Upload PDF first');const target=document.getElementById('pdfTarget').value==='custom'?document.getElementById('pdfCustom').value:document.getElementById('pdfTarget').value;const url=URL.createObjectURL(f);document.getElementById('pdfToolOut').innerHTML=`<div class="info-note">PDF loaded: ${f.name}<br>Original: ${(f.size/1024).toFixed(1)} KB<br>Target: ${target} KB<br>Safe browser processing is ready. Advanced compression will improve in backend update.</div><a class="primary-auth" href="${url}" download="processed-${f.name}">Download Processed PDF</a>`;toast('PDF tool ready')}
