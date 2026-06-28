window.addEventListener("load",()=>{setTimeout(()=>{const l=document.getElementById("loader");if(l)l.style.display="none"},450);initApp()});
if(window.pdfjsLib){pdfjsLib.GlobalWorkerOptions.workerSrc="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";}
const $=s=>document.querySelector(s), $$=s=>document.querySelectorAll(s); const workspace=$("#workspace");
let passState={img:null,cropped:""}; let aadPdfCanvas=null; let aadDrag={x:20,y:300,w:560,h:150,drag:false,resize:false,startX:0,startY:0,start:{}};
let lastPassportPDF=null, lastAadhaarPDF=null; let sptLastPdfToolBlob=null; let lastPassportUrl='', lastAadhaarUrl='';

function initApp(){ $("#menuBtn").onclick=toggleMenu; $("#overlay").onclick=toggleMenu; $$(".nav-item,.card").forEach(el=>el.onclick=()=>openTool(el.dataset.tool));}
function toggleMenu(){ $("#sidebar").classList.toggle("open"); $("#overlay").classList.toggle("show");}
function closeMenu(){ if(innerWidth<700){$("#sidebar").classList.remove("open");$("#overlay").classList.remove("show");}}
function setActive(tool){ $$(".nav-item").forEach(i=>i.classList.toggle("active",i.dataset.tool===tool)); closeMenu();}
function openTool(tool){setActive(tool); if(tool==="home")return home(); if(tool==="compressor")return imageCompressor(); if(tool==="namedate")return nameDateTool(); if(tool==="passport")return passportTool(); if(tool==="aadhaar")return aadhaarTool(); if(tool==="pdfresizer")return pdfResizerTool(); if(tool==="payment")return paymentTool(); if(tool==="dashboard")return dashboardTool(); if(tool==="login")return loginTool(); if(tool==="admin")return adminLoadPayments(); if(tool==="feedback")return feedbackTool(); if(tool==="premium")return premiumTool();}
function home(){workspace.innerHTML=`<h2>Welcome 👋</h2><p>Tool select karo aur kaam start karo.</p><div class="stats"><div><strong>📄 PDF Output</strong><span>Passport/Aadhaar PDF download.</span></div><div><strong>🖨️ Print Ready</strong><span>A4 layout professional.</span></div><div><strong>📱 Mobile</strong><span>PDF Resize added.</span></div></div>`}
function premiumTool(){
  const u=getCurrentUserLive();
  workspace.innerHTML=`<h2>👑 Premium System</h2>
  <p class="tool-subtitle">Free users ko 10 uses. Premium future payment/Admin approval se active hoga.</p>
  <div class="stats">
    <div><strong>Free</strong><span>10 uses</span></div>
    <div><strong>Monthly</strong><span>₹49 demo plan</span></div>
    <div><strong>Yearly</strong><span>₹199 demo plan</span></div>
  </div>
  <div class="dash-card">
    ${u?`<p>Logged in: <b>${u.email}</b></p><p>Status: <b>${u.premium?"Premium":"Free"}</b></p>`:`<p>Login karo premium status dekhne ke liye.</p>`}
    <button onclick="loginTool()">Login / Signup</button>
  </div>`;
}



/* v23 Robust PDF Download Helpers */
function sptBlobFromPdf(pdfDoc){
  try{
    return pdfDoc.output("blob");
  }catch(e){
    return null;
  }
}

function sptCreateObjectUrl(blob){
  try{
    return URL.createObjectURL(blob);
  }catch(e){
    return "";
  }
}

function sptDownloadBlob(blob, filename){
  try{
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename || "document.pdf";
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    setTimeout(()=>{ URL.revokeObjectURL(url); a.remove(); }, 1200);
    return true;
  }catch(e){
    alert("Direct download issue. Open PDF dabao, phir browser se Save/Share karo.");
    return false;
  }
}

function sptOpenBlob(blob){
  try{
    const url = URL.createObjectURL(blob);
    const win = window.open(url, "_blank");
    if(!win){
      alert("Popup block ho gaya. Browser me popup allow karo ya Download button try karo.");
      return false;
    }
    return true;
  }catch(e){
    alert("PDF open nahi ho pa rahi: " + e.message);
    return false;
  }
}

function sptDownloadPdfDoc(pdfDoc, filename){
  const blob = sptBlobFromPdf(pdfDoc);
  if(!blob) return alert("PDF generate nahi hui.");
  return sptDownloadBlob(blob, filename);
}

function sptOpenPdfDoc(pdfDoc){
  const blob = sptBlobFromPdf(pdfDoc);
  if(!blob) return alert("PDF generate nahi hui.");
  return sptOpenBlob(blob);
}

function sptPrintPdfDoc(pdfDoc){
  try{
    pdfDoc.autoPrint();
    const blob = pdfDoc.output("blob");
    return sptOpenBlob(blob);
  }catch(e){
    return sptOpenPdfDoc(pdfDoc);
  }
}


/* v22 Live Google Apps Script Integration */
const SPT_API_URL = "https://script.google.com/macros/s/AKfycbzNel2GhBCLmvCt6kH75uODdsYhLnwhFlYb-3tBi3ubLtbvdi9HdGpDLt6SEXaaIJJC3A/exec";
const SPT_USER_KEY = "spt_v22_live_user";
const SPT_TOKEN_KEY = "spt_v22_live_token";

function getCurrentUserLive(){
  try{return JSON.parse(localStorage.getItem(SPT_USER_KEY)||"null");}catch(e){return null;}
}
function setCurrentUserLive(user, token){
  if(user) localStorage.setItem(SPT_USER_KEY, JSON.stringify(user));
  if(token) localStorage.setItem(SPT_TOKEN_KEY, token);
}
function getTokenLive(){return localStorage.getItem(SPT_TOKEN_KEY)||"";}
function logoutLive(){
  localStorage.removeItem(SPT_USER_KEY);
  localStorage.removeItem(SPT_TOKEN_KEY);
  alert("Logout ho gaya.");
  home();
}
async function apiPostLive(action, data={}){
  try{
    const res = await fetch(SPT_API_URL,{
      method:"POST",
      headers:{"Content-Type":"text/plain;charset=utf-8"},
      body:JSON.stringify({action,data})
    });
    return await res.json();
  }catch(err){
    return {success:false,message:err.message};
  }
}
function loginTool(){
  const u=getCurrentUserLive();
  workspace.innerHTML=`<h2>🔐 Login / Signup</h2>
  <p class="tool-subtitle">Google Sheets backend se live connect.</p>
  ${u?`<div class="ok-box">Already logged in: <b>${u.email}</b><br><button class="small-action" onclick="logoutLive()">Logout</button></div>`:""}
  <div class="auth-grid">
    <div class="auth-card">
      <h3>Login</h3>
      <input id="liEmail" type="email" placeholder="Email">
      <input id="liPass" type="password" placeholder="Password">
      <button onclick="doLiveLogin()">Login</button>
    </div>
    <div class="auth-card">
      <h3>Signup</h3>
      <input id="suName" placeholder="Name">
      <input id="suEmail" type="email" placeholder="Email">
      <input id="suMobile" placeholder="Mobile optional">
      <input id="suPass" type="password" placeholder="Password">
      <button onclick="doLiveSignup()">Create Account</button>
    </div>
  </div>`;
}
async function doLiveLogin(){
  const email=$("#liEmail").value.trim();
  const pass=$("#liPass").value;
  if(!email||!pass) return alert("Email/password fill karo.");
  const r=await apiPostLive("login",{email,pass});
  if(!r.success) return alert(r.message||"Login failed");
  setCurrentUserLive(r.user,r.token);
  alert("Login successful");
  dashboardTool();
}
async function doLiveSignup(){
  const name=$("#suName").value.trim();
  const email=$("#suEmail").value.trim();
  const mobile=$("#suMobile").value.trim();
  const pass=$("#suPass").value;
  if(!name||!email||!pass) return alert("Name/email/password fill karo.");
  const r=await apiPostLive("signup",{name,email,mobile,pass});
  if(!r.success) return alert(r.message||"Signup failed");
  setCurrentUserLive(r.user,r.token);
  alert("Signup successful");
  dashboardTool();
}
function dashboardTool(){
  const u=getCurrentUserLive();
  if(!u){
    workspace.innerHTML=`<h2>👤 Dashboard</h2><div class="error-box">Dashboard ke liye login required.<br><button class="small-action" onclick="loginTool()">Login / Signup</button></div>`;
    return;
  }
  workspace.innerHTML=`<h2>👤 Dashboard</h2>
  <div>
    <span class="user-pill">👤 ${u.name||"User"}</span>
    <span class="user-pill">📧 ${u.email}</span>
    <span class="user-pill">⭐ ${u.premium?"Premium":"Free"}</span>
    <span class="user-pill">🎁 Uses: ${u.premium?"Unlimited":(u.usesLeft??10)}</span>
  </div>
  <div class="stats">
    <div><strong>Role</strong><span>${u.role||"User"}</span></div>
    <div><strong>Plan</strong><span>${u.premiumPlan||"Free"}</span></div>
    <div><strong>Status</strong><span>${u.status||"Active"}</span></div>
  </div>
  <div class="dash-card">
    <button onclick="home()">Open Tools</button>
    <button onclick="logoutLive()" style="background:#ef4444">Logout</button>
  </div>`;
}
async function adminLiveTool(){
  workspace.innerHTML=`<h2>📊 Admin</h2><p>Loading live stats...</p>`;
  const stats=await apiPostLive("adminStats",{token:getTokenLive()});
  const users=await apiPostLive("listUsers",{token:getTokenLive()});
  const usage=await apiPostLive("listUsage",{token:getTokenLive()});
  const feedback=await apiPostLive("listFeedback",{token:getTokenLive()});
  const st=stats.stats||{};
  const userRows=(users.users||[]).slice(0,20).map(u=>`<tr><td>${u.name}</td><td>${u.email}</td><td>${u.role}</td><td>${u.premium}</td><td>${u.usesLeft}</td></tr>`).join("")||`<tr><td colspan="5">No users</td></tr>`;
  const usageRows=(usage.usage||[]).slice(0,20).map(x=>`<tr><td>${x.CreatedAt||""}</td><td>${x.Tool||""}</td><td>${x.UserEmail||""}</td><td>${x.Status||""}</td></tr>`).join("")||`<tr><td colspan="4">No usage</td></tr>`;
  workspace.innerHTML=`<h2>📊 Admin Live</h2>
  <div class="stats">
    <div><strong>Total Users</strong><span>${st.totalUsers||0}</span></div>
    <div><strong>Premium Users</strong><span>${st.premiumUsers||0}</span></div>
    <div><strong>Total Usage</strong><span>${st.totalUsage||0}</span></div>
  </div>
  <div class="dash-card"><h3>Users</h3><table class="admin-table"><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Premium</th><th>Uses</th></tr></thead><tbody>${userRows}</tbody></table></div>
  <div class="dash-card"><h3>Usage</h3><table class="admin-table"><thead><tr><th>Time</th><th>Tool</th><th>User</th><th>Status</th></tr></thead><tbody>${usageRows}</tbody></table></div>`;
}
function feedbackTool(){
  const u=getCurrentUserLive();
  workspace.innerHTML=`<h2>💬 Feedback</h2>
  <div class="auth-card">
    <input id="fbName" placeholder="Name" value="${u?.name||""}">
    <input id="fbEmail" placeholder="Email" value="${u?.email||""}">
    <textarea id="fbMsg" placeholder="Feedback / Bug report"></textarea>
    <button onclick="sendLiveFeedback()">Submit Feedback</button>
  </div>`;
}
async function sendLiveFeedback(){
  const name=$("#fbName").value.trim();
  const email=$("#fbEmail").value.trim();
  const msg=$("#fbMsg").value.trim();
  if(!msg) return alert("Message likho.");
  const r=await apiPostLive("feedback",{name,email,msg});
  if(!r.success) return alert(r.message||"Feedback failed");
  alert("Feedback saved in Google Sheet.");
  home();
}
async function logLiveTool(tool, extra={}){
  const u=getCurrentUserLive();
  apiPostLive("logUsage",{
    token:getTokenLive(),
    tool,
    user:u?.email||"Guest",
    name:u?.name||"Guest",
    premium:!!u?.premium,
    ...extra
  });
}


/* Compressor */
function imageCompressor(){logLiveTool("Image Compressor");workspace.innerHTML=`<h2>🖼️ Image Compressor</h2><p class="tool-subtitle">Photo upload karo aur target KB select karo.</p><div class="tool-box"><label class="upload-box"><input type="file" id="imageInput" accept="image/*"><span>📤 Tap to Upload Image</span></label><label>Target Size</label><select id="targetSize"><option value="20">20 KB</option><option value="50">50 KB</option><option value="100" selected>100 KB</option><option value="200">200 KB</option><option value="custom">Custom KB</option></select><input type="number" id="customSize" placeholder="Enter custom KB" style="display:none"><button onclick="compressToTarget()">Compress Image</button></div><div id="compressOutput"></div>`; $("#targetSize").onchange=e=>$("#customSize").style.display=e.target.value==="custom"?"block":"none";}
async function compressToTarget(){const input=$("#imageInput"), output=$("#compressOutput"); if(!input.files[0])return alert("Pehle image upload karo."); let target=$("#targetSize").value==="custom"?Number($("#customSize").value):Number($("#targetSize").value); if(!target||target<5)return alert("Valid target KB enter karo."); output.innerHTML="<p>⏳ Compressing...</p>"; const file=input.files[0], img=await loadImage(await readFile(file)); let best="",bestSize=Infinity; for(let scale=1;scale>=0.08;scale-=0.035){let w=Math.max(80,Math.round(img.width*scale)),h=Math.max(80,Math.round(img.height*scale));let low=.03,high=.96;for(let i=0;i<14;i++){let q=(low+high)/2,data=drawImage(img,w,h,q),size=getSizeKB(data);if(size<=target){best=data;bestSize=size;low=q}else high=q} if(bestSize<=target&&bestSize>=target*.88)break} if(!best){best=drawImage(img,100,Math.round(img.height*100/img.width),.03);bestSize=getSizeKB(best)} output.innerHTML=`<div class="result-card"><h3>✅ Compression Complete</h3><p><b>Original:</b> ${formatBytes(file.size)}</p><p><b>Target:</b> ${target} KB</p><p><b>Compressed:</b> ${bestSize.toFixed(2)} KB</p><img src="${best}" class="preview-img"><button class="download-btn" onclick="forceDownload('${best}','compressed-image.jpg')">Download Image</button></div>`}

/* Name Date */
function nameDateTool(){logLiveTool("Name / Date Photo");workspace.innerHTML=`<h2>🏷️ Name / Date Photo</h2><p class="tool-subtitle">Photo ke niche name/date/custom text add karo.</p><div class="tool-box"><label class="upload-box"><input id="ndImage" type="file" accept="image/*"><span>📤 Upload Photo</span></label><div class="row"><input id="ndName" placeholder="Name"><input id="ndDate" type="date"></div><input id="ndText" placeholder="Custom text optional"><button onclick="makeNameDate()">Create Photo</button></div><div id="ndOutput"></div>`}
async function makeNameDate(){const f=$("#ndImage").files[0]; if(!f)return alert("Photo upload karo."); const img=await loadImage(await readFile(f)); const c=document.createElement("canvas"),ctx=c.getContext("2d"); const w=900,h=Math.round(img.height*900/img.width),cap=110;c.width=w;c.height=h+cap;ctx.fillStyle="#fff";ctx.fillRect(0,0,c.width,c.height);ctx.drawImage(img,0,0,w,h);ctx.fillStyle="#111";ctx.textAlign="center";ctx.font="bold 32px Arial";ctx.fillText($("#ndName").value||"",w/2,h+42);ctx.font="24px Arial";ctx.fillText($("#ndText").value||$("#ndDate").value||"",w/2,h+82);const data=c.toDataURL("image/jpeg",.92);$("#ndOutput").innerHTML=`<div class="result-card"><img class="preview-img" src="${data}"><button class="download-btn" onclick="forceDownload('${data}','name-date-photo.jpg')">Download Photo</button></div>`}

/* Passport */
function passportTool(){logLiveTool("Passport Photo");passState={img:null,cropped:""};workspace.innerHTML=`<h2>👤 Passport Photo Maker</h2><p class="tool-subtitle">A4 PDF ke upar ek line me 6 photos. Border black rahega.</p><div class="tool-box"><label class="upload-box"><input id="passImage" type="file" accept="image/*"><span>📤 Upload Full Photo</span></label><div class="row"><input id="passName" placeholder="Name optional"><input id="passDate" type="date"></div><button onclick="generatePassportSheet()">✅ Generate Passport PDF Layout</button></div><div class="crop-panel"><div class="canvas-box"><canvas id="passCanvas" class="crop-canvas" width="350" height="450"></canvas></div><div class="controls"><label>Zoom <input id="passZoom" type="range" min="0.5" max="4" step="0.01" value="1.4"></label><label>Left / Right <input id="passX" type="range" min="-400" max="400" value="0"></label><label>Up / Down <input id="passY" type="range" min="-400" max="400" value="0"></label></div><div class="small-note">Tip: Face ko center me rakho. PDF me 5 photos 35×45mm ek hi line me A4 ke top par aayengi.</div></div><div id="passOutput"></div>`; $("#passImage").onchange=loadPassportImage;["passZoom","passX","passY"].forEach(id=>$("#"+id).oninput=updatePassportPreview);drawEmptyPassport();}
function drawEmptyPassport(){const c=$("#passCanvas"),ctx=c.getContext("2d");ctx.fillStyle="#fff";ctx.fillRect(0,0,c.width,c.height);ctx.fillStyle="#777";ctx.textAlign="center";ctx.font="18px Arial";ctx.fillText("Upload photo",c.width/2,c.height/2)}
async function loadPassportImage(){const f=$("#passImage").files[0]; if(!f)return; passState.img=await loadImage(await readFile(f)); $("#passZoom").value=1.4;$("#passX").value=0;$("#passY").value=0; updatePassportPreview();}
function updatePassportPreview(){const c=$("#passCanvas"),ctx=c.getContext("2d"); if(!passState.img){drawEmptyPassport();return;} const zoom=Number($("#passZoom").value), x=Number($("#passX").value), y=Number($("#passY").value); ctx.fillStyle="#fff";ctx.fillRect(0,0,c.width,c.height); const img=passState.img, frameRatio=c.width/c.height, imgRatio=img.width/img.height; let dw,dh;if(imgRatio>frameRatio){dh=c.height*zoom;dw=dh*imgRatio}else{dw=c.width*zoom;dh=dw/imgRatio} const dx=(c.width-dw)/2+x,dy=(c.height-dh)/2+y;ctx.drawImage(img,dx,dy,dw,dh);ctx.strokeStyle="#f97316";ctx.lineWidth=5;ctx.strokeRect(3,3,c.width-6,c.height-6);passState.cropped=c.toDataURL("image/jpeg",.95)}
function generatePassportSheet(){if(!passState.cropped)return alert("Photo upload karo aur preview set karo."); const name=$("#passName").value||"",date=$("#passDate").value||""; let items=""; for(let i=0;i<5;i++){items+=`<div class="photo-item"><img class="pass-photo" src="${passState.cropped}">${(name||date)?`<div class="caption">${name}<br>${date}</div>`:""}</div>`}
 lastPassportPDF=createPassportPDF(passState.cropped,name,date);
 $("#passOutput").innerHTML=`<div class="result-card"><div class="action-row"><button class="open-btn" onclick="openPassportPDF()">📂 Open PDF</button><button class="open-btn" onclick="openPassportPDF()">📂 Open PDF</button><button class="pdf-btn" onclick="downloadPassportPDF()">📄 Download PDF</button><button class="print-btn" onclick="printPassportPDF()">🖨️ Print PDF</button></div><div class="passport-final-note">✅ Passport output: 35×45mm, 5 photos, white background, black border, A4 top aligned.</div><div class="print-area"><div class="passport-single-row">${items}</div></div></div>`}
function createPassportPDF(src,name,date){const {jsPDF}=window.jspdf; const pdf=new jsPDF({orientation:"portrait",unit:"mm",format:"a4"}); const photoW=35, photoH=45, gap=3, top=5; let x=6; for(let i=0;i<5;i++){pdf.setFillColor(255,255,255);pdf.rect(x,top,photoW,photoH,"F");pdf.addImage(src,"JPEG",x,top,photoW,photoH); pdf.setDrawColor(0); pdf.setLineWidth(0.3); pdf.rect(x,top,photoW,photoH); if(name||date){pdf.setFontSize(7); pdf.text(name,x+photoW/2,top+photoH+3,{align:"center"}); pdf.text(date,x+photoW/2,top+photoH+6,{align:"center"});} x+=photoW+gap;} return pdf;}
function refreshPassportUrl(){
  if(!lastPassportPDF)return "";
  if(lastPassportUrl) URL.revokeObjectURL(lastPassportUrl);
  lastPassportUrl = URL.createObjectURL(lastPassportPDF.output("blob"));
  return lastPassportUrl;
}
function openPassportPDF(){
  if(!lastPassportPDF)return alert("Pehle layout generate karo.");
  const url=refreshPassportUrl();
  const win=window.open(url,"_blank");
  if(!win) alert("Popup blocked hai. Browser settings me popup allow karo, ya Download PDF try karo.");
}
function downloadPassportPDF(){
  if(!lastPassportPDF)return alert("Pehle layout generate karo.");
  try{
    const url=refreshPassportUrl();
    const a=document.createElement("a");
    a.href=url;
    a.download="passport-photo-a4.pdf";
    a.target="_blank";
    document.body.appendChild(a);
    a.click();
    a.remove();
  }catch(e){
    openPassportPDF();
  }
}
function printPassportPDF(){if(!lastPassportPDF)return alert("Pehle layout generate karo."); sptPrintPdfDoc(lastPassportPDF);}

/* Aadhaar */
function aadhaarTool(){logLiveTool("Aadhaar Print");workspace.innerHTML=`<h2>🪪 Aadhaar Print Tool</h2><p class="tool-subtitle">PDF me drag crop karo. Output PDF me download/print hoga.</p><div class="tab-row"><button class="tab-btn active" onclick="aadhaarMode('pdf',this)">UIDAI PDF Drag Crop</button><button class="tab-btn" onclick="aadhaarMode('full',this)">Full Image</button><button class="tab-btn" onclick="aadhaarMode('fb',this)">Front + Back</button></div><div id="aadhaarBox"></div><div id="aadOutput"></div>`;aadhaarMode("pdf",$(".tab-btn"))}
function setTab(btn){$$(".tab-btn").forEach(b=>b.classList.remove("active")); if(btn)btn.classList.add("active")}
function commonAadhaarOptions(){return `<div class="row"><select id="aadCopies"><option value="1">1 Copy</option><option value="2">2 Copies</option><option value="4">4 Copies</option><option value="6">6 Copies</option></select><select id="aadPos"><option value="top-center">Top Center</option><option value="top-left">Top Left</option></select></div>`}
function aadhaarMode(mode,btn){setTab(btn);const box=$("#aadhaarBox");$("#aadOutput").innerHTML="";aadPdfCanvas=null;if(mode==="pdf"){box.innerHTML=`<div class="tool-box"><label>Upload UIDAI Aadhaar PDF</label><input id="aadPdf" type="file" accept="application/pdf" onchange="loadAadhaarPDF()">${commonAadhaarOptions()}<button onclick="makeAadhaarManualCrop()">Crop & Create PDF Layout</button><div class="small-note">PDF load hone ke baad orange box ko finger se move karo. Corner dot se resize karo.</div></div><div id="aadPdfCropUI"></div>`} if(mode==="full"){box.innerHTML=`<div class="tool-box"><label class="upload-box"><input id="aadFull" type="file" accept="image/*"><span>📤 Upload Full Aadhaar Image</span></label>${commonAadhaarOptions()}<button onclick="makeAadhaarFull()">Create PDF Layout</button></div>`} if(mode==="fb"){box.innerHTML=`<div class="tool-box"><label>Front Image</label><input id="aadFront" type="file" accept="image/*"><label>Back Image</label><input id="aadBack" type="file" accept="image/*">${commonAadhaarOptions()}<button onclick="makeAadhaarFrontBack()">Create PDF Layout</button></div>`}}
async function loadAadhaarPDF(){
  const f=$("#aadPdf").files[0];
  if(!f)return;
  if(!window.pdfjsLib)return alert("Internet on karke refresh karo. PDF library load nahi hui.");
  $("#aadPdfCropUI").innerHTML="<p>⏳ PDF loading...</p>";
  const buf=await f.arrayBuffer();
  const pdf=await pdfjsLib.getDocument({data:buf}).promise;
  const page=await pdf.getPage(1);
  const viewport=page.getViewport({scale:3});
  const sourceCanvas=document.createElement("canvas");
  const sctx=sourceCanvas.getContext("2d");
  sourceCanvas.width=viewport.width;
  sourceCanvas.height=viewport.height;
  await page.render({canvasContext:sctx,viewport}).promise;
  aadPdfCanvas=sourceCanvas;

  $("#aadPdfCropUI").innerHTML=`
    <div class="crop-panel">
      <h3>Drag Crop Box</h3>
      <div class="small-note">Orange box ko Aadhaar card area par set karo. Final crop exactly isi box se banega.</div>
      <div class="canvas-box">
        <div class="drag-crop-wrap" id="dragWrap">
          <canvas id="aadPreview" class="crop-canvas"></canvas>
          <div id="cropBox" class="drag-crop-box">
            <span class="crop-size-label">Crop Area</span>
            <div class="drag-handle" id="resizeHandle"></div>
          </div>
        </div>
      </div>
      <div class="pdf-preview-note">Tip: Box ka border jahan dikh raha hai, final crop wahi exact area lega. Mobile scaling issue fix kiya gaya hai.</div>
    </div>`;

  const p=$("#aadPreview");
  const pctx=p.getContext("2d");
  const displayW=650;
  const ratio=aadPdfCanvas.width/aadPdfCanvas.height;
  p.width=displayW;
  p.height=Math.round(displayW/ratio);
  p.style.width=displayW+"px";
  p.style.height=p.height+"px";
  pctx.drawImage(aadPdfCanvas,0,0,p.width,p.height);

  aadDrag.x=Math.round(p.width*0.03);
  aadDrag.y=Math.round(p.height*0.74);
  aadDrag.w=Math.round(p.width*0.94);
  aadDrag.h=Math.round(p.height*0.24);
  applyCropBox();
  initDragCrop();
}

function applyCropBox(){
  const box=$("#cropBox");
  if(!box)return;
  box.style.left=aadDrag.x+"px";
  box.style.top=aadDrag.y+"px";
  box.style.width=aadDrag.w+"px";
  box.style.height=aadDrag.h+"px";
}

function getPoint(e){
  if(e.touches && e.touches[0]) return {x:e.touches[0].clientX,y:e.touches[0].clientY};
  return {x:e.clientX,y:e.clientY};
}

function initDragCrop(){
  const box=$("#cropBox"), handle=$("#resizeHandle"), canvas=$("#aadPreview");
  if(!box||!handle||!canvas)return;

  const startMove=(e,type)=>{
    e.preventDefault();
    const p=getPoint(e);
    aadDrag.drag=type==="move";
    aadDrag.resize=type==="resize";
    aadDrag.startX=p.x;
    aadDrag.startY=p.y;
    aadDrag.start={x:aadDrag.x,y:aadDrag.y,w:aadDrag.w,h:aadDrag.h};
  };

  box.onmousedown=e=>startMove(e,"move");
  box.ontouchstart=e=>startMove(e,"move");
  handle.onmousedown=e=>{e.stopPropagation();startMove(e,"resize")};
  handle.ontouchstart=e=>{e.stopPropagation();startMove(e,"resize")};

  const move=e=>{
    if(!aadDrag.drag&&!aadDrag.resize)return;
    e.preventDefault();
    const p=getPoint(e), dx=p.x-aadDrag.startX, dy=p.y-aadDrag.startY;

    if(aadDrag.drag){
      aadDrag.x=aadDrag.start.x+dx;
      aadDrag.y=aadDrag.start.y+dy;
    }
    if(aadDrag.resize){
      aadDrag.w=aadDrag.start.w+dx;
      aadDrag.h=aadDrag.start.h+dy;
    }

    aadDrag.w=Math.max(70,Math.min(aadDrag.w,canvas.width-aadDrag.x));
    aadDrag.h=Math.max(45,Math.min(aadDrag.h,canvas.height-aadDrag.y));
    aadDrag.x=Math.max(0,Math.min(aadDrag.x,canvas.width-aadDrag.w));
    aadDrag.y=Math.max(0,Math.min(aadDrag.y,canvas.height-aadDrag.h));
    applyCropBox();
  };

  const stop=()=>{aadDrag.drag=false;aadDrag.resize=false;};
  document.onmousemove=move;
  document.onmouseup=stop;
  document.ontouchmove=move;
  document.ontouchend=stop;
}

async function makeAadhaarManualCrop(){
  if(!aadPdfCanvas)return alert("Pehle PDF upload karo.");
  const preview=$("#aadPreview");
  const box=$("#cropBox");
  if(!preview || !box)return alert("Preview load nahi hua.");

  /*
    v12 fix:
    Crop is calculated from real visible DOM rectangles.
    This fixes mobile CSS scaling mismatch.
  */
  const canvasRect=preview.getBoundingClientRect();
  const boxRect=box.getBoundingClientRect();

  let relX=(boxRect.left-canvasRect.left)/canvasRect.width;
  let relY=(boxRect.top-canvasRect.top)/canvasRect.height;
  let relW=boxRect.width/canvasRect.width;
  let relH=boxRect.height/canvasRect.height;

  relX=Math.max(0,Math.min(relX,1));
  relY=Math.max(0,Math.min(relY,1));
  relW=Math.max(0.01,Math.min(relW,1-relX));
  relH=Math.max(0.01,Math.min(relH,1-relY));

  const cropped=cropCanvasKeepRatio(aadPdfCanvas,relX,relY,relW,relH);
  const copies=Number($("#aadCopies").value),pos=$("#aadPos").value;
  lastAadhaarPDF=await createAadhaarPDF([cropped],copies,pos,false);
  $("#aadOutput").innerHTML=aadhaarPreviewHTML(`<img class="aadhaar-single" src="${cropped}">`,copies,pos);
}

function cropCanvasKeepRatio(src,xp,yp,wp,hp){const sx=src.width*xp,sy=src.height*yp,sw=src.width*wp,sh=src.height*hp; const c=document.createElement("canvas"),ctx=c.getContext("2d"); c.width=1200;c.height=Math.round(1200*sh/sw);ctx.fillStyle="#fff";ctx.fillRect(0,0,c.width,c.height);ctx.drawImage(src,sx,sy,sw,sh,0,0,c.width,c.height);return c.toDataURL("image/jpeg",.95);}
function aadhaarPreviewHTML(content,copies,pos){let all="";for(let i=0;i<copies;i++)all+=content;return `<div class="result-card"><div class="action-row"><button class="open-btn" onclick="openAadhaarPDF()">📂 Open PDF</button><button class="open-btn" onclick="openAadhaarPDF()">📂 Open PDF</button><button class="pdf-btn" onclick="downloadAadhaarPDF()">📄 Download PDF</button><button class="print-btn" onclick="printAadhaarPDF()">🖨️ Print PDF</button></div><div class="print-area ${pos}"><div class="aadhaar-wrap">${all}</div></div></div>`}
async function makeAadhaarFull(){const f=$("#aadFull").files[0];if(!f)return alert("Full Aadhaar image upload karo.");const src=await readFile(f),copies=Number($("#aadCopies").value),pos=$("#aadPos").value;lastAadhaarPDF=await createAadhaarPDF([src],copies,pos,false);$("#aadOutput").innerHTML=aadhaarPreviewHTML(`<img class="aadhaar-single" src="${src}">`,copies,pos)}
async function makeAadhaarFrontBack(){const f=$("#aadFront").files[0],b=$("#aadBack").files[0];if(!f&&!b)return alert("Front ya back image upload karo.");const front=f?await readFile(f):"",back=b?await readFile(b):"",copies=Number($("#aadCopies").value),pos=$("#aadPos").value;let imgs=[];if(front)imgs.push(front);if(back)imgs.push(back);lastAadhaarPDF=await createAadhaarPDF(imgs,copies,pos,true);let content=`${front?`<img class="aadhaar-card" src="${front}">`:""}${back?`<img class="aadhaar-card" src="${back}">`:""}`;$("#aadOutput").innerHTML=aadhaarPreviewHTML(content,copies,pos)}
async function createAadhaarPDF(srcs,copies,pos,isCards){const {jsPDF}=window.jspdf; const pdf=new jsPDF({orientation:"portrait",unit:"mm",format:"a4"}); let y=10; const gap=8; for(let copy=0;copy<copies;copy++){let dims=[]; for(const s of srcs){const img=await loadImage(s); const h=54; const w=isCards?85.6:h*img.width/img.height; dims.push({src:s,w,h});} const totalW=dims.reduce((a,d)=>a+d.w,0)+(dims.length-1)*gap; let x=pos==="top-left"?10:(210-totalW)/2; for(const d of dims){pdf.addImage(d.src,"JPEG",x,y,d.w,d.h); pdf.setDrawColor(60); pdf.setLineWidth(.25); pdf.rect(x,y,d.w,d.h); x+=d.w+gap;} y+=60;} return pdf;}
function refreshAadhaarUrl(){
  if(!lastAadhaarPDF)return "";
  if(lastAadhaarUrl) URL.revokeObjectURL(lastAadhaarUrl);
  lastAadhaarUrl = URL.createObjectURL(lastAadhaarPDF.output("blob"));
  return lastAadhaarUrl;
}
function openAadhaarPDF(){
  if(!lastAadhaarPDF)return alert("Pehle layout generate karo.");
  const url=refreshAadhaarUrl();
  const win=window.open(url,"_blank");
  if(!win) alert("Popup blocked hai. Browser settings me popup allow karo, ya Download PDF try karo.");
}
function downloadAadhaarPDF(){
  if(!lastAadhaarPDF)return alert("Pehle layout generate karo.");
  try{
    const url=refreshAadhaarUrl();
    const a=document.createElement("a");
    a.href=url;
    a.download="aadhaar-a4-print.pdf";
    a.target="_blank";
    document.body.appendChild(a);
    a.click();
    a.remove();
  }catch(e){
    openAadhaarPDF();
  }
}
function printAadhaarPDF(){if(!lastAadhaarPDF)return alert("Pehle layout generate karo."); sptPrintPdfDoc(lastAadhaarPDF);}


/* PDF Tools: Safe Resize + Real Scanned PDF Compressor */
function pdfResizerTool(){
  logLiveTool("PDF Tools");
  workspace.innerHTML=`<h2>📄 PDF Tools</h2>
  <p class="tool-subtitle">PDF resize aur real scanned PDF compressor. Target KB mode iLovePDF jaisa size reduce karne ki कोशिश karega.</p>

  <div class="tool-box">
    <label>Upload PDF</label>
    <input id="resizePdfInput" type="file" accept="application/pdf">

    <label>PDF Mode</label>
    <select id="pdfCompressMode" onchange="togglePdfToolMode()">
      <option value="safe" selected>Safe Resize / Optimize - quality preserve</option>
      <option value="target">Target KB Compress - scanned PDF compressor</option>
    </select>

    <div id="resizeSettingsBox">
      <label>Output Page Size</label>
      <select id="pdfPageSize" onchange="toggleCustomPdfSize()">
        <option value="KEEP" selected>Keep Original Page Size</option>
        <option value="A4">A4 - 210 × 297 mm</option>
        <option value="A5">A5 - 148 × 210 mm</option>
        <option value="LETTER">Letter - 216 × 279 mm</option>
        <option value="LEGAL">Legal - 216 × 356 mm</option>
        <option value="CUSTOM">Custom Size</option>
      </select>

      <div class="row" id="customPdfSizeBox" style="display:none">
        <input id="customPdfW" type="number" placeholder="Width mm">
        <input id="customPdfH" type="number" placeholder="Height mm">
      </div>

      <label>Fit Mode</label>
      <select id="pdfFitMode">
        <option value="contain" selected>Fit inside page - no crop</option>
        <option value="fill">Fill page - may crop edges</option>
      </select>
    </div>

    <div id="targetKbPanel" style="display:none">
      <label>Target PDF Size</label>
      <div class="preset-row">
        <button type="button" class="preset-btn" onclick="setPdfTargetKB(50,this)">50 KB</button>
        <button type="button" class="preset-btn active" onclick="setPdfTargetKB(100,this)">100 KB</button>
        <button type="button" class="preset-btn" onclick="setPdfTargetKB(200,this)">200 KB</button>
        <button type="button" class="preset-btn" onclick="setPdfTargetKB(300,this)">300 KB</button>
        <button type="button" class="preset-btn" onclick="setPdfTargetKB(500,this)">500 KB</button>
      </div>
      <input id="targetPdfKb" type="number" value="100" placeholder="Custom KB">
      <div class="warning-box">
        Target KB mode scanned/image PDF ke liye hai. Ye pages ko image me convert karke compress karta hai.
        Size kam hoga, lekin text selectable nahi rahega aur quality target ke hisab se reduce ho sakti hai.
      </div>
    </div>

    <button onclick="processPdfTool()">Process PDF</button>

    <div class="warning-box">
      Safe mode quality preserve karta hai, lekin size zyada kam nahi hota.
      Target KB mode size kam karta hai, lekin quality aur text-selectable property par effect aa sakta hai.
    </div>
  </div>

  <div id="pdfResizeOutput"></div>`;
}

function togglePdfToolMode(){
  const mode=$("#pdfCompressMode").value;
  $("#targetKbPanel").style.display=mode==="target"?"block":"none";
  $("#resizeSettingsBox").style.display=mode==="safe"?"block":"none";
}

function toggleCustomPdfSize(){
  const box=$("#customPdfSizeBox");
  if(box) box.style.display=$("#pdfPageSize").value==="CUSTOM"?"grid":"none";
}

function setPdfTargetKB(kb,btn){
  $("#targetPdfKb").value=kb;
  $$(".preset-btn").forEach(b=>b.classList.remove("active"));
  if(btn) btn.classList.add("active");
}

function getPdfSizeMMForPage(originalPage){
  const v=$("#pdfPageSize").value;
  if(v==="KEEP") return [originalPage.getWidth()*25.4/72, originalPage.getHeight()*25.4/72];
  if(v==="A4") return [210,297];
  if(v==="A5") return [148,210];
  if(v==="LETTER") return [216,279];
  if(v==="LEGAL") return [216,356];
  const w=Number($("#customPdfW").value), h=Number($("#customPdfH").value);
  if(!w||!h||w<20||h<20) throw new Error("Valid custom width/height mm enter karo.");
  return [w,h];
}

function mmToPt(mm){ return mm*72/25.4; }

async function processPdfTool(){
  const mode=$("#pdfCompressMode").value;
  if(mode==="target") return compressPdfToTarget();
  return safeResizePdf();
}

async function safeResizePdf(){
  const input=$("#resizePdfInput");
  const out=$("#pdfResizeOutput");
  if(!input.files[0]) return alert("PDF upload karo.");
  if(!window.PDFLib) return alert("PDF library load nahi hui. Internet on karke refresh karo.");

  try{
    out.innerHTML="<p>⏳ PDF safe processing...</p>";
    const file=input.files[0];
    const bytes=await file.arrayBuffer();
    const srcDoc=await PDFLib.PDFDocument.load(bytes,{ignoreEncryption:true});
    const newDoc=await PDFLib.PDFDocument.create();
    const srcPages=srcDoc.getPages();
    const embeddedPages=await newDoc.embedPages(srcPages);

    for(let i=0;i<embeddedPages.length;i++){
      const embedded=embeddedPages[i];
      const originalPage=srcPages[i];
      const [wmm,hmm]=getPdfSizeMMForPage(originalPage);
      const targetW=mmToPt(wmm), targetH=mmToPt(hmm);
      const page=newDoc.addPage([targetW,targetH]);
      const sw=embedded.width, sh=embedded.height;
      const fitMode=$("#pdfFitMode").value;
      const scale=fitMode==="fill"?Math.max(targetW/sw,targetH/sh):Math.min(targetW/sw,targetH/sh);
      const drawW=sw*scale, drawH=sh*scale;
      page.drawPage(embedded,{x:(targetW-drawW)/2,y:(targetH-drawH)/2,width:drawW,height:drawH});
    }

    const outBytes=await newDoc.save({useObjectStreams:true, addDefaultPage:false});
    showPdfResult(new Blob([outBytes],{type:"application/pdf"}), file.size, "processed-pdf.pdf", "Safe Resize / Optimize complete.");
  }catch(err){
    out.innerHTML=`<div class="result-card"><h3>❌ Error</h3><p>${err.message}</p></div>`;
  }
}

async function compressPdfToTarget(){
  const input=$("#resizePdfInput");
  const out=$("#pdfResizeOutput");
  if(!input.files[0]) return alert("PDF upload karo.");
  if(!window.pdfjsLib || !window.jspdf) return alert("PDF libraries load nahi hui. Internet on karke refresh karo.");

  const file=input.files[0];
  const targetKB=Number($("#targetPdfKb").value);
  if(!targetKB || targetKB<10) return alert("Valid target KB enter karo.");

  try{
    out.innerHTML=`<div class="progress-box">⏳ PDF compressing... Large PDF me time lag sakta hai.</div>`;

    const bytes=await file.arrayBuffer();
    const pdf=await pdfjsLib.getDocument({data:bytes}).promise;
    let bestBlob=null, bestSize=Infinity, bestInfo="";

    const attempts=[
      {scale:1.8, quality:0.82},
      {scale:1.5, quality:0.72},
      {scale:1.25, quality:0.62},
      {scale:1.0, quality:0.52},
      {scale:0.85, quality:0.45},
      {scale:0.7, quality:0.38},
      {scale:0.58, quality:0.32}
    ];

    for(let a=0;a<attempts.length;a++){
      const opt=attempts[a];
      out.innerHTML=`<div class="progress-box">⏳ Compressing attempt ${a+1}/${attempts.length}... Scale ${opt.scale}, Quality ${Math.round(opt.quality*100)}%</div>`;
      const blob=await renderPdfAsCompressedPdf(pdf,opt.scale,opt.quality);
      const sizeKB=blob.size/1024;

      if(sizeKB<bestSize){
        bestSize=sizeKB;
        bestBlob=blob;
        bestInfo=`Scale ${opt.scale}, Quality ${Math.round(opt.quality*100)}%`;
      }

      if(sizeKB<=targetKB) break;
    }

    let msg=bestSize<=targetKB
      ? `Target achieved. ${bestInfo}`
      : `Best result ${bestSize.toFixed(2)} KB mila. Target ${targetKB} KB se kam karne ke liye aur quality reduce karni padegi.`;

    showPdfResult(bestBlob, file.size, "compressed-pdf.pdf", msg, targetKB);
  }catch(err){
    out.innerHTML=`<div class="result-card"><h3>❌ Error</h3><p>${err.message}</p></div>`;
  }
}

async function renderPdfAsCompressedPdf(pdf, scale, quality){
  const {jsPDF}=window.jspdf;
  let doc=null;

  for(let p=1;p<=pdf.numPages;p++){
    const page=await pdf.getPage(p);
    const viewport=page.getViewport({scale});
    const canvas=document.createElement("canvas");
    const ctx=canvas.getContext("2d",{alpha:false});
    canvas.width=Math.max(200,Math.floor(viewport.width));
    canvas.height=Math.max(200,Math.floor(viewport.height));
    ctx.fillStyle="#fff";
    ctx.fillRect(0,0,canvas.width,canvas.height);
    await page.render({canvasContext:ctx,viewport}).promise;

    const imgData=canvas.toDataURL("image/jpeg",quality);
    const wmm=canvas.width*25.4/96;
    const hmm=canvas.height*25.4/96;

    if(!doc) doc=new jsPDF({orientation:wmm>hmm?"landscape":"portrait",unit:"mm",format:[wmm,hmm]});
    else doc.addPage([wmm,hmm], wmm>hmm?"landscape":"portrait");

    doc.addImage(imgData,"JPEG",0,0,wmm,hmm);
  }

  return doc.output("blob");
}

function showPdfResult(blob, originalBytes, filename, note, targetKB){
  sptLastPdfToolBlob = blob;
  const out=$("#pdfResizeOutput");
  const outKB=(blob.size/1024).toFixed(2);
  const origKB=(originalBytes/1024).toFixed(2);
  const cls=targetKB && blob.size/1024>targetKB ? "warning-box" : "success-box";

  out.innerHTML=`<div class="result-card">
    <h3>✅ PDF Complete</h3>
    <p><b>Original:</b> ${origKB} KB</p>
    <p><b>Output:</b> ${outKB} KB</p>
    ${targetKB?`<p><b>Target:</b> ${targetKB} KB</p>`:""}
    <div class="${cls}">${note}</div>
    <div class="fix-btn-row">
      <button class="fix-btn fix-open" onclick="openLastPdfTool()">📂 Open PDF</button>
      <button class="fix-btn fix-download" onclick="downloadLastPdfTool()">📄 Download PDF</button>
    </div>
    <div class="download-help">Mobile me direct download na ho to Open PDF dabao, phir browser ke 3-dot/share se Save/Print karo.</div>
  </div>`;
}




/* v24 Payment QR Page */
const SPT_UPI_ID = "kait.satnam@sbi";
const SPT_PAYEE_NAME = "SATNAM SO SATBIR SINGH";
let selectedPaymentPlan = {name:"Monthly Premium", amount:49, days:30};


/* v25 Payment Backend + Admin Approval */
const SPT_ADMIN_EMAIL = "kaitsatnam@gmail.com";

function isAdminUser(){
  const u = typeof getCurrentUserLive === "function" ? getCurrentUserLive() : null;
  return !!(u && String(u.email || "").toLowerCase() === SPT_ADMIN_EMAIL.toLowerCase());
}

function statusBadge(status){
  const s = String(status || "Pending").toLowerCase();
  if(s === "verified" || s === "success" || s === "approved") return `<span class="status-verified">Verified</span>`;
  if(s === "rejected") return `<span class="status-rejected">Rejected</span>`;
  return `<span class="status-pending">Pending</span>`;
}

async function adminLoadPayments(){
  if(!isAdminUser()){
    workspace.innerHTML=`<h2>📊 Admin</h2><div class="admin-lock">Admin access sirf <b>${SPT_ADMIN_EMAIL}</b> ke liye hai.<br>Pehle isi email se login karo.<br><button class="small-action" onclick="loginTool()">Login / Signup</button></div>`;
    return;
  }
  workspace.innerHTML = `<h2>📊 Admin Panel</h2><p>Loading payments...</p>`;
  const [stats, users, payments, usage] = await Promise.all([
    apiPostLive("adminStats", {token:getTokenLive()}),
    apiPostLive("listUsers", {token:getTokenLive()}),
    apiPostLive("listPayments", {token:getTokenLive()}),
    apiPostLive("listUsage", {token:getTokenLive()})
  ]);
  const st = stats.stats || {};
  const payRows = (payments.payments || []).slice(0,50).map(p => `
    <tr><td>${p.CreatedAt || ""}</td><td>${p.Email || ""}</td><td>${p.PlanName || ""}</td><td>₹${p.Amount || ""}</td><td>${p.TransactionID || ""}</td><td>${p.ScreenshotURL ? `<a href="${p.ScreenshotURL}" target="_blank">View</a>` : "-"}</td><td>${statusBadge(p.Status)}</td><td><button class="admin-mini-btn admin-approve" onclick="verifyPaymentAdmin('${p.PaymentID}','Verified')">Approve</button><button class="admin-mini-btn admin-reject" onclick="verifyPaymentAdmin('${p.PaymentID}','Rejected')">Reject</button></td></tr>
  `).join("") || `<tr><td colspan="8">No payments yet</td></tr>`;
  const userRows = (users.users || []).slice(0,30).map(u => `
    <tr><td>${u.name || ""}</td><td>${u.email || ""}</td><td>${u.role || ""}</td><td>${u.premium || ""}</td><td>${u.usesLeft || ""}</td><td><button class="admin-mini-btn admin-approve" onclick="activatePremiumAdmin('${u.email}')">Premium</button></td></tr>
  `).join("") || `<tr><td colspan="6">No users</td></tr>`;
  const usageRows = (usage.usage || []).slice(0,20).map(x => `<tr><td>${x.CreatedAt || ""}</td><td>${x.Tool || ""}</td><td>${x.UserEmail || ""}</td><td>${x.Status || ""}</td></tr>`).join("") || `<tr><td colspan="4">No usage</td></tr>`;
  workspace.innerHTML = `<h2>📊 Admin Panel</h2><button class="admin-mini-btn admin-refresh" onclick="adminLoadPayments()">Refresh</button><div class="stats"><div><strong>Total Users</strong><span>${st.totalUsers || 0}</span></div><div><strong>Premium Users</strong><span>${st.premiumUsers || 0}</span></div><div><strong>Total Usage</strong><span>${st.totalUsage || 0}</span></div></div><div class="result-card"><h3>Payment Requests</h3><table class="admin-table"><thead><tr><th>Time</th><th>Email</th><th>Plan</th><th>Amount</th><th>Txn/UTR</th><th>Screenshot</th><th>Status</th><th>Action</th></tr></thead><tbody>${payRows}</tbody></table></div><div class="result-card"><h3>Users</h3><table class="admin-table"><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Premium</th><th>Uses</th><th>Action</th></tr></thead><tbody>${userRows}</tbody></table></div><div class="result-card"><h3>Recent Usage</h3><table class="admin-table"><thead><tr><th>Time</th><th>Tool</th><th>User</th><th>Status</th></tr></thead><tbody>${usageRows}</tbody></table></div>`;
}

async function verifyPaymentAdmin(paymentId, status){
  if(!confirm(`Payment ${status} karna hai?`)) return;
  const res = await apiPostLive("verifyPayment", {token:getTokenLive(), paymentId, status});
  alert(res.message || "Done");
  adminLoadPayments();
}

async function activatePremiumAdmin(email){
  if(!confirm(`${email} ko premium activate karna hai?`)) return;
  const res = await apiPostLive("setPremium", {token:getTokenLive(), email, planName:"Admin Premium", days:365});
  alert(res.message || "Done");
  adminLoadPayments();
}

function paymentTool(){
  workspace.innerHTML=`<h2>💳 Premium Payment</h2>
  <p class="tool-subtitle">QR scan karke payment karo, phir Transaction ID/UTR submit karo.</p>

  <div class="payment-wrap">
    <div class="payment-card">
      <h3>1. Select Plan</h3>
      <div class="payment-plan">
        <div class="plan-option active" id="planMonthly" onclick="selectPaymentPlan('Monthly Premium',49,30,'planMonthly')">
          <h3>Monthly</h3>
          <div class="plan-price">₹49</div>
          <p>30 days premium</p>
        </div>
        <div class="plan-option" id="planYearly" onclick="selectPaymentPlan('Yearly Premium',199,365,'planYearly')">
          <h3>Yearly</h3>
          <div class="plan-price">₹199</div>
          <p>365 days premium</p>
        </div>
      </div>

      <div class="payment-note">
        Payment karne ke baad Transaction ID/UTR zaroor submit karo. Admin verify karke premium activate karega.
      </div>
    </div>

    <div class="payment-card">
      <h3>2. Scan QR & Pay</h3>
      <img class="qr-img" src="assets/images/payment_qr.jpg" alt="Payment QR">
      <div class="upi-box" id="upiText">UPI ID: ${SPT_UPI_ID}</div>
      <div class="pay-actions">
        <button class="copy-btn" onclick="copyUpiId()">📋 Copy UPI</button>
        <button class="pay-btn" onclick="openUpiPayment()">📱 Pay Now</button>
      </div>
      <div class="payment-note">
        Payee: <b>${SPT_PAYEE_NAME}</b><br>
        UPI ID: <b>${SPT_UPI_ID}</b>
      </div>
    </div>
  </div>

  <div class="payment-card payment-form">
    <h3>3. Submit Payment Details</h3>
    <p><b>Selected Plan:</b> <span id="selectedPlanText">${selectedPaymentPlan.name} - ₹${selectedPaymentPlan.amount}</span></p>
    <input id="payerName" placeholder="Your Name">
    <input id="payerEmail" placeholder="Your Login Email">
    <input id="txnId" placeholder="Transaction ID / UTR Number">
    <input id="screenshotUrl" placeholder="Payment screenshot URL optional">
    <textarea id="paymentNote" placeholder="Any note optional"></textarea>
    <button class="submit-pay" onclick="submitPaymentDetails()">Submit Payment Request</button>
  </div>`;
}

function selectPaymentPlan(name, amount, days, id){
  selectedPaymentPlan = {name, amount, days};
  document.querySelectorAll(".plan-option").forEach(el=>el.classList.remove("active"));
  const el=document.getElementById(id);
  if(el) el.classList.add("active");
  const txt=document.getElementById("selectedPlanText");
  if(txt) txt.textContent = `${name} - ₹${amount}`;
}

function copyUpiId(){
  navigator.clipboard?.writeText(SPT_UPI_ID).then(()=>{
    alert("UPI ID copied: " + SPT_UPI_ID);
  }).catch(()=>{
    prompt("Copy UPI ID:", SPT_UPI_ID);
  });
}

function openUpiPayment(){
  const amount = selectedPaymentPlan.amount;
  const note = encodeURIComponent(selectedPaymentPlan.name + " - Smart Photo Toolkit Pro");
  const url = `upi://pay?pa=${encodeURIComponent(SPT_UPI_ID)}&pn=${encodeURIComponent(SPT_PAYEE_NAME)}&am=${amount}&cu=INR&tn=${note}`;
  window.location.href = url;
}

async function submitPaymentDetails(){
  const name = document.getElementById("payerName")?.value.trim() || "";
  const email = document.getElementById("payerEmail")?.value.trim() || "";
  const txn = document.getElementById("txnId")?.value.trim() || "";
  const shot = document.getElementById("screenshotUrl")?.value.trim() || "";
  const note = document.getElementById("paymentNote")?.value.trim() || "";
  if(!name || !email || !txn){ alert("Name, Email aur Transaction ID/UTR fill karo."); return; }
  const data = { token: (typeof getTokenLive === "function" ? getTokenLive() : ""), email, name, planName:selectedPaymentPlan.name, amount:selectedPaymentPlan.amount, transactionId:txn, screenshotUrl:shot, note, upiId:SPT_UPI_ID };
  const res = await apiPostLive("submitPayment", data);
  if(res && res.success){ alert("Payment request Google Sheet me save ho gayi. Admin verify karega."); if(typeof dashboardTool === "function") dashboardTool(); return; }
  alert(res.message || "Payment submit failed. Apps Script backend update check karo.");
}


/* Helpers */
function readFile(file){return new Promise(r=>{const fr=new FileReader();fr.onload=e=>r(e.target.result);fr.readAsDataURL(file)})}
function loadImage(src){return new Promise(r=>{const img=new Image();img.onload=()=>r(img);img.src=src})}
function drawImage(img,w,h,q){const c=document.createElement("canvas"),ctx=c.getContext("2d");c.width=w;c.height=h;ctx.fillStyle="#fff";ctx.fillRect(0,0,w,h);ctx.drawImage(img,0,0,w,h);return c.toDataURL("image/jpeg",q)}
function getSizeKB(dataUrl){return ((dataUrl.split(",")[1].length*3/4)/1024)}
function formatBytes(bytes){return bytes<1024?bytes+" Bytes":bytes<1048576?(bytes/1024).toFixed(2)+" KB":(bytes/1048576).toFixed(2)+" MB"}
function forceDownload(dataUrl, filename){try{const a=document.createElement("a");a.href=dataUrl;a.download=filename;document.body.appendChild(a);a.click();a.remove();}catch(e){alert("Download issue: image ko long press karke save karo.");}}
