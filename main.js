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
   v39.4 Enterprise Stabilization Overrides
   Print engine, crop engine, payment, auth UI, PDF/Image tools
===================================================== */
const SPT_TARGETS = [20,50,100,200,300,400,500,1024];
function targetOptions(defaultKb=100){return SPT_TARGETS.map(k=>`<option value="${k}" ${k===defaultKb?'selected':''}>${k===1024?'1 MB':k+' KB'}</option>`).join('')+`<option value="custom">Custom KB</option>`}
function getSelectedTarget(selectId, customId){const v=$(selectId)?.value; if(v==='custom')return Number($(customId)?.value||0); return Number(v||0)}

function updateTopUser(){
  const u=getUser();
  const name=u?.name||localStorage.getItem('spt_profile_name')||'Guest User';
  const plan=u?.premium?'Premium User':'Login required';
  const dp=localStorage.getItem('spt_profile_dp');
  const avatar=$('#headerAvatar');
  if($('#headerUserName')) $('#headerUserName').textContent=name;
  if($('#headerUserPlan')) $('#headerUserPlan').textContent=plan;
  if(avatar){
    if(dp){avatar.style.backgroundImage=`url(${dp})`; avatar.style.backgroundSize='cover'; avatar.style.backgroundPosition='center'; avatar.textContent='';}
    else {avatar.style.backgroundImage=''; avatar.textContent=(name||'G').trim()[0].toUpperCase();}
  }
  if($('#adminDropBtn')) $('#adminDropBtn').style.display=(u&&String(u.role).toLowerCase()==='admin')?'block':'none';
  if($('#logoutDropBtn')) $('#logoutDropBtn').textContent=u?'🚪 Logout':'🔐 Login / Signup';
  if($('#sideLogin')) $('#sideLogin').style.display=u?'none':'flex';
  if($('#sideLogout')) $('#sideLogout').style.display=u?'flex':'none';
}

function addHandleCenter(box){
  if(!box.querySelector('.crop-center-marker')){
    const center=document.createElement('span');
    center.className='crop-center-marker';
    center.title='Move selection';
    box.appendChild(center);
  }
}
const _createCropV394=createCrop;
createCrop=function(stage,media,opt={}){
  const s=_createCropV394(stage,media,opt);
  addHandleCenter(s.box);
  return s;
}
function autoDetectCrop(side){
  const s = side==='passport'?appState.passportCrop: side==='pdf'?appState.pdfCrop: appState[side+'Crop'];
  if(!s)return toast('Upload file first');
  const b=getMediaBounds(s.stage,s.media);
  let w=b.w*.86,h=b.h*.62;
  if(s.ratio){ h=w/s.ratio; if(h>b.h*.90){h=b.h*.90; w=h*s.ratio;} }
  s.x=b.x+(b.w-w)/2; s.y=b.y+(b.h-h)/2; s.w=w; s.h=h; paintCrop(s); toast('Auto detect applied. Adjust manually if needed.');
  updateA4Preview();
}
function fitCrop(side){
  const s = side==='passport'?appState.passportCrop: side==='pdf'?appState.pdfCrop: appState[side+'Crop'];
  if(!s)return toast('Upload file first');
  const b=getMediaBounds(s.stage,s.media);
  s.x=b.x+8; s.y=b.y+8; s.w=b.w-16; s.h=b.h-16;
  if(s.ratio){ if(s.w/s.h>s.ratio)s.w=s.h*s.ratio; else s.h=s.w/s.ratio; s.x=b.x+(b.w-s.w)/2; s.y=b.y+(b.h-s.h)/2; }
  paintCrop(s); updateA4Preview();
}

async function generateDocPDF(){
  await updateA4Preview();
  const imgs=[...$$('#a4Preview img')].map(i=>i.src);
  if(!imgs.length)return toast('Upload and select printable area first');
  const {jsPDF}=window.jspdf;
  const pdf=new jsPDF({unit:'mm',format:'a4'});
  const copies=Number($('#docCopies')?.value||1);
  const cardW=85.6, cardH=54, gap=2.4, top=2.2;
  let y=top;
  for(let c=0;c<copies;c++){
    const totalW=imgs.length*cardW+(imgs.length-1)*gap;
    let x=(210-totalW)/2;
    for(const s of imgs){
      pdf.addImage(s,'JPEG',x,y,cardW,cardH);
      pdf.setDrawColor(20); pdf.setLineWidth(.25); pdf.rect(x,y,cardW,cardH);
      x+=cardW+gap;
    }
    y+=cardH+gap;
    if(y>270&&c<copies-1){pdf.addPage(); y=top;}
  }
  appState.previewPDF=pdf;
  toast('A4 PDF generated with 2.2mm top margin');
}
async function updateA4Preview(){
  const el=$('#a4Preview'); if(!el)return;
  let imgs=[];
  if(appState.uploadTab==='image'){
    if(appState.frontCrop)imgs.push(await cropFromElement(appState.frontCrop)); else if(appState.front)imgs.push(appState.front);
    if(appState.backCrop)imgs.push(await cropFromElement(appState.backCrop)); else if(appState.back)imgs.push(appState.back);
  } else {
    if(appState.pdfCrop)imgs.push(await cropFromElement(appState.pdfCrop));
  }
  el.innerHTML=imgs.map(s=>`<img src="${s}" alt="preview">`).join('');
}

function passportStudio(){workspace.innerHTML=pageHeader('Passport Photo Studio','Upload a photo, auto-detect/manual crop, then generate exact 35×45 mm A4 sheet.')+`<div class="card flow-card"><h3>Upload Full Photo</h3><label class="dropzone"><input type="file" accept="image/*" onchange="loadPassportImg(event)"><div>📤 Click to upload photo<br><small>JPG, PNG, WEBP</small></div></label><div class="pdf-settings"><input id="passName" placeholder="Name optional"><select id="passLayout"><option value="5">5 Photos</option><option value="4">4 Photos</option><option value="6">6 Photos</option><option value="8">8 Photos</option><option value="12">12 Photos</option></select></div></div><div class="card flow-card"><h3>Select Passport Area</h3><div class="crop-stage passport-stage" id="passportStage"><div class="info-note">Upload a photo to start. Use Auto Detect or adjust manually using 8 handles.</div></div><div class="crop-tools"><button onclick="autoDetectCrop('passport')">Auto Detect</button><button onclick="fitCrop('passport')">Fit</button><button onclick="resetPassportCrop()">Reset</button><button onclick="makePassportPDF()">Generate A4 PDF</button><button onclick="downloadPassportPDF()">Download PDF</button><button onclick="printGeneratedPDF('passport')">Print</button></div></div><div id="passportOutput"></div>`}
async function makePassportPDF(){
  if(!appState.passportCrop)return toast('Upload and select photo area first');
  const src=await cropFromElement(appState.passportCrop);
  const n=Number($('#passLayout').value||5);
  const {jsPDF}=window.jspdf;
  const pdf=new jsPDF({unit:'mm',format:'a4'});
  const w=35,h=45,gap=3,top=2.2;
  let x=5,y=top;
  for(let i=0;i<n;i++){
    if(x+w>205){x=5;y+=h+gap+6}
    pdf.addImage(src,'JPEG',x,y,w,h);
    pdf.setDrawColor(0); pdf.setLineWidth(.25); pdf.rect(x,y,w,h);
    x+=w+gap;
  }
  appState.passportPdf=pdf;
  $('#passportOutput').innerHTML=`<div class="preview-a4"><b>Passport PDF Ready</b><p>35×45 mm exact output. Top margin: 2.2mm.</p><div class="passport-mini"><img src="${src}"></div></div>`;
  toast('Passport PDF generated');
}

function compressorTool(){workspace.innerHTML=pageHeader('Image Compressor','Compress images to fixed target size.')+`<div class="card form"><input type="file" id="compFile" accept="image/*"><select id="targetKB" onchange="$('#customImgKB').style.display=this.value==='custom'?'block':'none'">${targetOptions(100)}</select><input id="customImgKB" style="display:none" placeholder="Custom KB"><button onclick="compressSimple()">Compress Image</button><div id="compOut"></div></div>`}
async function compressSimple(){
  const f=$('#compFile').files[0]; if(!f)return toast('Select image first');
  const target=getSelectedTarget('#targetKB','#customImgKB'); if(!target||target<5)return toast('Select valid target size');
  const img=await loadImage(await readFile(f));
  let best='',bestKB=Infinity;
  for(let scale=1;scale>=0.12;scale-=0.06){
    const w=Math.max(120,Math.round(img.width*scale)), h=Math.max(120,Math.round(img.height*scale));
    const c=document.createElement('canvas'),ctx=c.getContext('2d'); c.width=w;c.height=h;ctx.fillStyle='#fff';ctx.fillRect(0,0,w,h);ctx.drawImage(img,0,0,w,h);
    let lo=.12,hi=.92;
    for(let i=0;i<10;i++){const q=(lo+hi)/2,d=c.toDataURL('image/jpeg',q),kb=(d.length*3/4)/1024;if(kb<=target){best=d;bestKB=kb;lo=q}else hi=q}
    if(bestKB<=target&&bestKB>target*.75)break;
  }
  if(!best){const c=document.createElement('canvas'),ctx=c.getContext('2d');c.width=300;c.height=Math.round(img.height*300/img.width);ctx.drawImage(img,0,0,c.width,c.height);best=c.toDataURL('image/jpeg',.35);bestKB=(best.length*3/4)/1024;}
  $('#compOut').innerHTML=`<div class="result-box"><p><b>Original:</b> ${(f.size/1024).toFixed(1)} KB</p><p><b>Output:</b> ${bestKB.toFixed(1)} KB</p><img src="${best}"><a class="download-preview" download="compressed.jpg" href="${best}">Download</a></div>`;
}
function imageResizeTool(){workspace.innerHTML=pageHeader('Image Resizer','Resize/compress image to selected target size.')+`<div class="card form"><input type="file" id="rsFile" accept="image/*"><div class="pdf-settings"><input id="rsW" placeholder="Width px optional"><input id="rsH" placeholder="Height px optional"></div><select id="rsTargetKB" onchange="$('#rsCustomKB').style.display=this.value==='custom'?'block':'none'">${targetOptions(200)}</select><input id="rsCustomKB" style="display:none" placeholder="Custom KB"><button onclick="resizeImageSimple()">Resize / Compress</button><div id="rsOut"></div></div>`}
async function resizeImageSimple(){
  const f=$('#rsFile').files[0]; if(!f)return toast('Select image first');
  const img=await loadImage(await readFile(f));
  const w=Number($('#rsW').value)||img.width, h=Number($('#rsH').value)||Math.round(img.height*w/img.width);
  const target=getSelectedTarget('#rsTargetKB','#rsCustomKB')||500;
  const c=document.createElement('canvas'),ctx=c.getContext('2d'); c.width=w;c.height=h;ctx.fillStyle='#fff';ctx.fillRect(0,0,w,h);ctx.drawImage(img,0,0,w,h);
  let best=c.toDataURL('image/jpeg',.88),bestKB=(best.length*3/4)/1024;
  if(bestKB>target){let lo=.1,hi=.9;for(let i=0;i<12;i++){let q=(lo+hi)/2,d=c.toDataURL('image/jpeg',q),kb=(d.length*3/4)/1024;if(kb<=target){best=d;bestKB=kb;lo=q}else hi=q}}
  $('#rsOut').innerHTML=`<div class="result-box"><p><b>Output:</b> ${w}×${h}px, ${bestKB.toFixed(1)} KB</p><img src="${best}"><a class="download-preview" download="resized.jpg" href="${best}">Download</a></div>`;
}

function pdfStudio(){workspace.innerHTML=pageHeader('PDF Studio','Resize, compress, merge, split, rotate and convert PDFs.')+`<div class="pdf-tool-grid"><button class="card home-card" onclick="pdfResizeTool()"><b>📉</b><h3>PDF Resizer</h3><p>20KB to 1MB target options</p></button><button class="card home-card" onclick="pdfMergeTool()"><b>🔗</b><h3>Merge PDFs</h3><p>Combine multiple PDFs</p></button><button class="card home-card" onclick="pdfSplitTool()"><b>✂️</b><h3>Split PDF</h3><p>Extract page range</p></button><button class="card home-card" onclick="pdfRotateTool()"><b>🔄</b><h3>Rotate PDF</h3><p>Rotate all pages</p></button><button class="card home-card" onclick="jpgToPdfTool()"><b>🖼️</b><h3>JPG to PDF</h3><p>Convert images to PDF</p></button><button class="card home-card" onclick="pdfToJpgTool()"><b>📷</b><h3>PDF to JPG</h3><p>Export pages as images</p></button></div><div id="pdfWork"></div>`}
function pdfResizeTool(){html('pdfWork',`<div class="card form"><h3>PDF Resizer / Compressor</h3><input type="file" id="pdfResizeFile" accept="application/pdf"><select id="pdfTargetKB" onchange="$('#pdfCustomKB').style.display=this.value==='custom'?'block':'none'">${targetOptions(500)}</select><input id="pdfCustomKB" style="display:none" placeholder="Custom KB"><button onclick="compressPdfV394()">Resize PDF</button><div id="pdfOut"></div></div>`)}
async function compressPdfV394(){
  const f=$('#pdfResizeFile').files[0]; if(!f)return toast('Select PDF first');
  if(!window.pdfjsLib||!window.jspdf)return toast('PDF libraries not loaded');
  const target=getSelectedTarget('#pdfTargetKB','#pdfCustomKB'); if(!target)return toast('Select target size');
  html('pdfOut','<div class="info-note">Processing PDF. Please wait...</div>');
  const pdf=await pdfjsLib.getDocument({data:await f.arrayBuffer()}).promise;
  const {jsPDF}=window.jspdf;
  let finalPdf=null, finalKB=Infinity;
  for(const attempt of [{scale:1.35,q:.68},{scale:1.05,q:.55},{scale:.85,q:.45},{scale:.7,q:.35}]){
    const out=new jsPDF({unit:'mm',format:'a4'});
    for(let i=1;i<=pdf.numPages;i++){
      const page=await pdf.getPage(i), vp=page.getViewport({scale:attempt.scale});
      const c=document.createElement('canvas'); c.width=vp.width;c.height=vp.height;
      await page.render({canvasContext:c.getContext('2d'),viewport:vp}).promise;
      if(i>1)out.addPage(); out.addImage(c.toDataURL('image/jpeg',attempt.q),'JPEG',0,0,210,297);
    }
    const blob=out.output('blob'); finalPdf=out; finalKB=blob.size/1024; if(finalKB<=target)break;
  }
  const url=URL.createObjectURL(finalPdf.output('blob'));
  html('pdfOut',`<div class="result-box"><p><b>Output:</b> ${finalKB.toFixed(1)} KB</p><a class="download-preview" href="${url}" download="resized-compressed.pdf">Download PDF</a></div>`);
}
function pdfMergeTool(){html('pdfWork',`<div class="card form"><h3>Merge PDFs</h3><input type="file" id="mergeFiles" accept="application/pdf" multiple><button onclick="mergePdfV394()">Merge PDFs</button><div id="mergeOut"></div></div>`)}
async function mergePdfV394(){const files=[...$('#mergeFiles').files]; if(files.length<2)return toast('Select at least 2 PDFs'); const {PDFDocument}=PDFLib; const out=await PDFDocument.create(); for(const f of files){const d=await PDFDocument.load(await f.arrayBuffer()); const pages=await out.copyPages(d,d.getPageIndices()); pages.forEach(p=>out.addPage(p));} const bytes=await out.save(); const url=URL.createObjectURL(new Blob([bytes],{type:'application/pdf'})); html('mergeOut',`<a class="download-preview" href="${url}" download="merged.pdf">Download Merged PDF</a>`)}
function pdfSplitTool(){html('pdfWork',`<div class="card form"><h3>Split PDF</h3><input type="file" id="splitFile" accept="application/pdf"><input id="splitRange" placeholder="Pages e.g. 1-3 or 2"><button onclick="splitPdfV394()">Extract Pages</button><div id="splitOut"></div></div>`)}
async function splitPdfV394(){const f=$('#splitFile').files[0]; if(!f)return toast('Select PDF'); const range=$('#splitRange').value.trim()||'1'; const {PDFDocument}=PDFLib; const src=await PDFDocument.load(await f.arrayBuffer()), out=await PDFDocument.create(); let pages=[]; if(range.includes('-')){let [a,b]=range.split('-').map(n=>Number(n)); for(let i=a;i<=b;i++)pages.push(i-1)} else pages=[Number(range)-1]; pages=pages.filter(i=>i>=0&&i<src.getPageCount()); const copied=await out.copyPages(src,pages); copied.forEach(p=>out.addPage(p)); const bytes=await out.save(); const url=URL.createObjectURL(new Blob([bytes],{type:'application/pdf'})); html('splitOut',`<a class="download-preview" href="${url}" download="split.pdf">Download Split PDF</a>`)}
function pdfRotateTool(){html('pdfWork',`<div class="card form"><h3>Rotate PDF</h3><input type="file" id="rotFile" accept="application/pdf"><select id="rotDeg"><option value="90">90°</option><option value="180">180°</option><option value="270">270°</option></select><button onclick="rotatePdfV394()">Rotate</button><div id="rotOut"></div></div>`)}
async function rotatePdfV394(){const f=$('#rotFile').files[0]; if(!f)return toast('Select PDF'); const {PDFDocument,degrees}=PDFLib; const pdf=await PDFDocument.load(await f.arrayBuffer()); const deg=Number($('#rotDeg').value); pdf.getPages().forEach(p=>p.setRotation(degrees(deg))); const bytes=await pdf.save(); const url=URL.createObjectURL(new Blob([bytes],{type:'application/pdf'})); html('rotOut',`<a class="download-preview" href="${url}" download="rotated.pdf">Download Rotated PDF</a>`)}
function jpgToPdfTool(){html('pdfWork',`<div class="card form"><h3>JPG / PNG to PDF</h3><input type="file" id="imgPdfFiles" accept="image/*" multiple><button onclick="jpgToPdfV394()">Create PDF</button><div id="imgPdfOut"></div></div>`)}
async function jpgToPdfV394(){const files=[...$('#imgPdfFiles').files]; if(!files.length)return toast('Select images'); const {jsPDF}=window.jspdf; const pdf=new jsPDF({unit:'mm',format:'a4'}); for(let i=0;i<files.length;i++){const data=await readFile(files[i]); const img=await loadImage(data); if(i>0)pdf.addPage(); const ratio=img.width/img.height; let w=190,h=w/ratio; if(h>277){h=277;w=h*ratio} pdf.addImage(data,'JPEG',(210-w)/2,10,w,h);} const url=URL.createObjectURL(pdf.output('blob')); html('imgPdfOut',`<a class="download-preview" href="${url}" download="images.pdf">Download PDF</a>`)}
function pdfToJpgTool(){html('pdfWork',`<div class="card form"><h3>PDF to JPG</h3><input type="file" id="pdfJpgFile" accept="application/pdf"><button onclick="pdfToJpgV394()">Export Pages</button><div id="pdfJpgOut"></div></div>`)}
async function pdfToJpgV394(){const f=$('#pdfJpgFile').files[0]; if(!f)return toast('Select PDF'); const pdf=await pdfjsLib.getDocument({data:await f.arrayBuffer()}).promise; let htmls=''; for(let i=1;i<=pdf.numPages;i++){const page=await pdf.getPage(i),vp=page.getViewport({scale:1.5}); const c=document.createElement('canvas'); c.width=vp.width;c.height=vp.height; await page.render({canvasContext:c.getContext('2d'),viewport:vp}).promise; const d=c.toDataURL('image/jpeg',.9); htmls+=`<a class="download-preview" href="${d}" download="page-${i}.jpg">Download Page ${i}</a> `} html('pdfJpgOut',htmls)}

function paymentTool(){workspace.innerHTML=pageHeader('Payment','Select plan, generate QR, then submit transaction details.')+`<div class="payment-grid"><div class="card form"><h3>Select Premium Plan</h3><select id="paymentPlan" onchange="updatePaymentAmountV394()"><option value="Monthly Premium" data-amount="49">Monthly Premium - ₹49</option><option value="Half Year Premium" data-amount="149">Half Year Premium - ₹149</option><option value="Yearly Premium" data-amount="499">Yearly Premium - ₹499</option></select><input id="paymentAmount" readonly value="49"><input id="paymentMethod" value="UPI / QR"><button type="button" onclick="generatePaymentQRV394()">Generate Payment QR</button><div id="qrBox" class="qr-hidden"><img src="payment_qr.jpg" alt="Payment QR"><p>Scan QR and pay selected amount.</p></div></div><div class="card form"><h3>Submit Payment Details</h3><input id="paymentTxn" placeholder="UTR / Transaction ID"><input id="paymentScreenshot" placeholder="Payment screenshot URL optional"><button onclick="submitPayment&&submitPayment()">Submit Payment Request</button><div class="info-note">QR appears only after clicking Generate Payment QR.</div></div></div>`}
function updatePaymentAmountV394(){const opt=$('#paymentPlan').selectedOptions[0]; $('#paymentAmount').value=opt?.dataset?.amount||''; $('#qrBox')?.classList.add('qr-hidden')}
function generatePaymentQRV394(){updatePaymentAmountV394(); $('#qrBox')?.classList.remove('qr-hidden'); toast('Payment QR generated')}

function loginTool(){workspace.innerHTML=pageHeader('Login / Create Account','Access dashboard, premium and payments.')+`<div class="auth-wrap"><div class="card form"><h3>Login</h3><input id="loginEmail" placeholder="Email"><input id="loginPassword" type="password" placeholder="Password"><button onclick="loginSubmit&&loginSubmit()">Login</button><button class="link-like" onclick="toggleForgotV394()">Forgot Password?</button><div id="forgotBox" class="forgot-box" style="display:none"><input id="forgotEmail" placeholder="Registered Email"><button onclick="forgotSubmit&&forgotSubmit()">Send OTP</button><input id="resetEmail" placeholder="Email"><input id="resetOtp" placeholder="OTP"><input id="resetPassword" type="password" placeholder="New Password"><button onclick="resetSubmit&&resetSubmit()">Reset Password</button></div></div><div class="card form"><h3>Create Account</h3><input id="signupName" placeholder="Full Name"><input id="signupEmail" placeholder="Email"><input id="signupMobile" placeholder="Mobile"><textarea id="signupAddress" placeholder="Address"></textarea><input id="signupPassword" type="password" placeholder="Password"><button onclick="signupSubmit&&signupSubmit()">Create Account</button></div></div>`}
function toggleForgotV394(){const b=$('#forgotBox'); b.style.display=b.style.display==='none'?'grid':'none'}

function dashboardTool(t){const u=getUser()||{}; const local={name:localStorage.getItem('spt_profile_name')||u.name||'Guest User',mobile:localStorage.getItem('spt_profile_mobile')||u.mobile||'',address:localStorage.getItem('spt_profile_address')||u.address||'',dp:localStorage.getItem('spt_profile_dp')||''}; workspace.innerHTML=pageHeader('My Dashboard',`Welcome, ${local.name}. Manage profile, premium and workspace.`)+`<div class="dashboard-grid"><div class="card form profile-editor"><h3>Profile</h3><div class="big-avatar" style="${local.dp?`background-image:url(${local.dp});background-size:cover;background-position:center`:''}">${local.dp?'':local.name[0]}</div><input type="file" id="dpFile" accept="image/*"><input id="profileName" value="${local.name}" placeholder="Name"><input id="profileMobile" value="${local.mobile}" placeholder="Mobile"><textarea id="profileAddress" placeholder="Address">${local.address}</textarea><button onclick="saveProfileLocalV394()">Save Profile</button></div><div class="card home-card"><b>👑</b><h3>${u.premium?'Premium':'Free Plan'}</h3><p>Membership status</p></div><div class="card home-card"><b>📁</b><h3>My Workspace</h3><p>Recent projects and downloads.</p></div></div>`}
async function saveProfileLocalV394(){localStorage.setItem('spt_profile_name',$('#profileName').value||'User');localStorage.setItem('spt_profile_mobile',$('#profileMobile').value||'');localStorage.setItem('spt_profile_address',$('#profileAddress').value||''); const f=$('#dpFile').files[0]; if(f)localStorage.setItem('spt_profile_dp',await readFile(f)); updateTopUser(); toast('Profile saved on this device'); dashboardTool('dashboard')}

setTimeout(updateTopUser,500);

function imageCropHTML(){let needBack=appState.docMode!=="front", needFront=appState.docMode!=="back"; return `<div class="crop-grid">${needFront?`<div class="crop-box-panel"><div class="crop-label">Front - Select Printable Area</div><div class="crop-stage" id="frontStage">${appState.front?`<img src="${appState.front}" id="frontCropImg">`:`Upload front image first`}</div><div class="crop-tools"><button onclick="autoDetectCrop('front')">Auto Detect</button><button onclick="fitCrop('front')">Fit</button><button onclick="resetDocCrop('front')">Reset</button></div></div>`:""}${needBack?`<div class="crop-box-panel"><div class="crop-label">Back - Select Printable Area</div><div class="crop-stage" id="backStage">${appState.back?`<img src="${appState.back}" id="backCropImg">`:`Upload back image first`}</div><div class="crop-tools"><button onclick="autoDetectCrop('back')">Auto Detect</button><button onclick="fitCrop('back')">Fit</button><button onclick="resetDocCrop('back')">Reset</button></div></div>`:""}</div>`}
function pdfCropHTML(){return `<div class="crop-stage large" id="pdfStage">${appState.pdfCanvas?`<canvas id="pdfCanvasView"></canvas>`:`Upload full page PDF first`}</div><div class="crop-tools"><button onclick="autoDetectCrop('pdf')">Auto Detect</button><button onclick="fitCrop('pdf')">Fit</button><button onclick="resetDocCrop('pdf')">Reset</button><button onclick="generateDocPDF()">Crop & Generate A4 PDF</button></div>`}
