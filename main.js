/* =====================================================
   Smart Photo Toolkit Pro v28.4
   js/main.js — PART 1
   App Init + Navigation + Auth + Compressor + Name Date
===================================================== */

window.addEventListener("load", () => {
  setTimeout(() => {
    const l = document.getElementById("loader");
    if (l) l.style.display = "none";
  }, 450);

  initApp();
});

if (window.pdfjsLib) {
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
}

const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);
const workspace = $("#workspace");

let passState = { img: null, cropped: "" };

let aadPdfCanvas = null;
let aadDrag = {
  x: 20,
  y: 300,
  w: 560,
  h: 150,
  drag: false,
  resize: false,
  startX: 0,
  startY: 0,
  start: {}
};

let lastPassportPDF = null;
let lastAadhaarPDF = null;
let lastPassportUrl = "";
let lastAadhaarUrl = "";

function getCurrentUser() {
  return (window.SPT && SPT.user) || JSON.parse(localStorage.getItem("spt_user") || "null");
}

function userIsAdminAccount(user) {
  return !!(user && String(user.role || "").toLowerCase() === "admin");
}

function updateAuthUI() {
  const user = getCurrentUser();
  const loggedIn = !!user;
  const isAdminUser = userIsAdminAccount(user);

  document.body.classList.toggle("auth-logged-in", loggedIn);
  document.body.classList.toggle("auth-admin", isAdminUser);

  document.querySelectorAll("[data-auth='guest']").forEach(el => {
    el.style.display = loggedIn ? "none" : "block";
  });

  document.querySelectorAll("[data-auth='user']").forEach(el => {
    el.style.display = loggedIn ? "block" : "none";
  });

  document.querySelectorAll("[data-auth='admin']").forEach(el => {
    el.style.display = isAdminUser ? "block" : "none";
  });
}


function initApp() {
  const menuBtn = $("#menuBtn");
  const overlay = $("#overlay");
  const themeToggle = $("#themeToggle");

  if (menuBtn) menuBtn.onclick = toggleMenu;
  if (overlay) overlay.onclick = toggleMenu;

  $$(".nav-item,.card").forEach(el => {
    el.onclick = () => openTool(el.dataset.tool);
  });

  if (themeToggle) {
    themeToggle.onclick = () => {
      document.body.classList.toggle("dark");
      localStorage.setItem("spt_theme", document.body.classList.contains("dark") ? "dark" : "light");
    };
  }

  if (localStorage.getItem("spt_theme") === "dark") {
    document.body.classList.add("dark");
  }

  updateAuthUI();
  home();
}

function toggleMenu() {
  $("#sidebar")?.classList.toggle("open");
  $("#overlay")?.classList.toggle("show");
}

function closeMenu() {
  if (innerWidth < 700) {
    $("#sidebar")?.classList.remove("open");
    $("#overlay")?.classList.remove("show");
  }
}

function setActive(tool) {
  $$(".nav-item").forEach(i => {
    i.classList.toggle("active", i.dataset.tool === tool);
  });
  closeMenu();
}

function openTool(tool) {
  const user = getCurrentUser();
  const protectedTools = ["dashboard", "payment", "premium"];
  if (protectedTools.includes(tool) && !user) {
    setActive("login");
    return loginTool();
  }
  if (tool === "admin" && !userIsAdminAccount(user)) {
    setActive(user ? "dashboard" : "login");
    workspace.innerHTML = `<h2>Admin Panel</h2><div class="warning-box">Admin access is available only after signing in with the authorized administrator account.</div><button class="primary-btn" onclick="showTool('login')">Login</button>`;
    return;
  }

  setActive(tool);

  if (tool === "home") return home();
  if (tool === "compressor") return imageCompressor();
  if (tool === "namedate") return nameDateTool();
  if (tool === "passport") return passportTool();
  if (tool === "aadhaar") return aadhaarTool();
  if (tool === "pdfresizer") return pdfResizerTool();

  if (tool === "login") return loginTool();
  if (tool === "dashboard") return dashboardTool();
  if (tool === "admin") return adminTool();
  if (tool === "feedback") return feedbackTool();
  if (tool === "payment") return paymentTool();
  if (tool === "premium") return premiumTool();

  return home();
}

function showTool(tool) {
  openTool(tool);
}

function home() {
  workspace.innerHTML = `
    <h2>Welcome 👋</h2>
    <p>Select a tool to get started.</p>

    <div class="stats">
      <div>
        <strong>📄 PDF Output</strong>
        <span>Passport and Aadhaar PDF downloads.</span>
      </div>
      <div>
        <strong>🖨️ Print Ready</strong>
        <span>Professional A4 print-ready layouts.</span>
      </div>
      <div>
        <strong>📱 Mobile Friendly</strong>
        <span>Optimized for mobile and desktop.</span>
      </div>
    </div>
  `;
}

/* ================= AUTH ================= */

function loginTool() {
  workspace.innerHTML = `
    <h2>🔐 Login / Create Account</h2>
    <p class="tool-subtitle">Access your dashboard, premium tools, payment status, and account history.</p>

    <div class="auth-grid">
      <div class="auth-card">
        <h3>Login</h3>
        <div class="form-group"><label>Email Address</label><input id="loginEmail" type="email" placeholder="Enter your email address"></div>
        <div class="form-group"><label>Password</label><input id="loginPassword" type="password" placeholder="Enter your password"></div>
        <button class="primary-btn" onclick="loginSubmit()">Login</button>
        <button class="link-btn" onclick="toggleForgotBox()">Forgot Password?</button>
      </div>

      <div class="auth-card">
        <h3>Create New Account</h3>
        <div class="form-group"><label>Full Name</label><input id="signupName" placeholder="Enter full name"></div>
        <div class="form-group"><label>Email Address</label><input id="signupEmail" type="email" placeholder="Enter email address"></div>
        <div class="form-group"><label>Mobile Number</label><input id="signupMobile" placeholder="Enter mobile number"></div>
        <div class="form-group"><label>Address</label><textarea id="signupAddress" rows="3" placeholder="Enter full address"></textarea></div>
        <div class="form-group"><label>Password</label><input id="signupPassword" type="password" placeholder="Create a password"></div>
        <button class="primary-btn" onclick="signupSubmit()">Create Account</button>
      </div>
    </div>

    <div id="forgotBox" class="auth-card hidden">
      <h3>Password Recovery</h3>
      <p class="tool-subtitle">Enter your registered email to receive a one-time password. Then use the OTP to set a new password.</p>
      <div class="forgot-grid"><input id="forgotEmail" type="email" placeholder="Registered email address"><button class="secondary-btn" onclick="forgotSubmit()">Send OTP</button></div>
      <div class="forgot-grid forgot-grid-3"><input id="resetEmail" type="email" placeholder="Email address"><input id="resetOtp" placeholder="OTP"><input id="resetPassword" type="password" placeholder="New password"></div>
      <button class="primary-btn full-btn" onclick="resetSubmit()">Reset Password</button>
    </div>
  `;
}

function toggleForgotBox() {
  const box = document.getElementById("forgotBox");
  if (box) box.classList.toggle("hidden");
}

function dashboardTool() {
  const u = getCurrentUser();

  if (!u) {
    workspace.innerHTML = `
      <h2>👤 Dashboard</h2>
      <div class="warning-box">Please login to view your account dashboard.</div>
      <button class="primary-btn" onclick="showTool('login')">Login Now</button>
    `;
    return;
  }

  workspace.innerHTML = `
    <h2>👤 My Dashboard</h2>
    <p class="tool-subtitle">Welcome, ${u.name || "User"}. Manage your account and premium access here.</p>

    <div class="stats">
      <div><strong>Name</strong><span>${u.name || "-"}</span></div>
      <div><strong>Email</strong><span>${u.email || "-"}</span></div>
      <div><strong>Mobile</strong><span>${u.mobile || "-"}</span></div>
      <div><strong>Address</strong><span>${u.address || "-"}</span></div>
      <div><strong>Plan</strong><span>${u.premium ? (u.premiumPlan || "Premium") : "Free"}</span></div>
      <div><strong>Uses Left</strong><span>${u.usesLeft || "-"}</span></div>
      <div><strong>Role</strong><span>${u.role || "User"}</span></div>
      <div><strong>Status</strong><span>${u.status || "Active"}</span></div>
      <div><strong>Premium Ends</strong><span>${u.premiumEnd || "-"}</span></div>
    </div>

    <div class="action-row">
      <button class="secondary-btn" onclick="showTool('premium')">Upgrade Premium</button>
      <button class="print-btn" onclick="SPT.logout()">Logout</button>
    </div>
  `;
}

function adminTool() {
  if (typeof requireLogin === "function" && !requireLogin()) return;
  if (typeof isAdmin === "function" && !isAdmin()) {
    workspace.innerHTML = `<div class="warning-box">Admin access only. Please login using the authorized admin email address.</div>`;
    return;
  }

  workspace.innerHTML = `
    <h2>📊 Admin Panel</h2>
    <p class="tool-subtitle">Review payment requests, approve premium access, manage users, and read feedback.</p>

    <div class="action-row admin-top-actions">
      <button class="primary-btn" onclick="loadAdminStats()">📈 Stats</button>
      <button class="secondary-btn" onclick="loadPayments()">💳 Payments</button>
      <button class="secondary-btn" onclick="loadUsers()">👥 Users</button>
      <button class="secondary-btn" onclick="loadFeedbacks()">💬 Feedback</button>
    </div>

    <div id="adminContent" class="admin-card">
      <div class="progress-box">Select an admin option. New payment requests will appear under Payments.</div>
    </div>
  `;
}

function feedbackTool() {
  workspace.innerHTML = `
    <h2>💬 Feedback</h2>
    <p class="tool-subtitle">Share a suggestion, bug report, or feature request. Your message will be visible to the admin.</p>

    <div class="tool-box feedback-box-v283">
      <input id="feedbackName" placeholder="Full name">
      <input id="feedbackEmail" type="email" placeholder="Email address">
      <select id="feedbackType"><option>Feedback</option><option>Bug Report</option><option>Feature Request</option><option>Payment Support</option></select>
      <textarea id="feedbackMessage" rows="5" placeholder="Write your message here"></textarea>
      <button class="feedback-submit-btn" onclick="submitFeedback()">Submit Feedback</button>
    </div>
  `;
}

function paymentTool() {
  if (typeof requireLogin === "function" && !requireLogin()) return;
  workspace.innerHTML = `
    <h2>💳 Premium Payment</h2>
    <p class="tool-subtitle">Scan the QR code, complete the payment, and submit your UTR/Transaction ID for admin verification.</p>

    <div class="payment-wrap-v28 payment-pro-v283">
      <div class="payment-card payment-qr-card-v283 center">
        <div class="payment-badge-v282">Secure UPI Payment</div>
        <h3>Direct QR Code</h3>
        <img src="payment_qr.jpg" class="qr-img-v28" alt="Payment QR">
        <div class="upi-box-v28" id="upiText">kait.satnam@sbi</div>
        <button class="secondary-btn copy-upi-btn-v282" onclick="copyUPI()">📋 Copy UPI ID</button>
        <a class="primary-btn upi-pay-link" id="upiPayLink" href="upi://pay?pa=kait.satnam@sbi&pn=SATNAM%20SO%20SATBIR%20SINGH&cu=INR&am=49" target="_blank">Open UPI App</a>
        <p class="small-note">Receiving Account: <b>State Bank of India 6831</b></p>

        <details class="generate-qr-box">
          <summary>Generate plan-specific UPI QR code</summary>
          <p class="tool-subtitle">Select a plan and click Generate QR. This creates a QR code with the selected amount.</p>
          <button class="secondary-btn" onclick="generatePlanQR()">Generate QR Code</button>
          <img id="generatedQR" class="generated-qr-img hidden" alt="Generated UPI QR">
        </details>
      </div>

      <div class="payment-card payment-form-card-v282">
        <h3>Select Premium Plan</h3>
        <div class="plan-grid-v28">
          <button class="plan-card-v28 active" data-plan="Monthly Premium" data-amount="49" data-days="30" onclick="selectPaymentPlan(this)"><b>Monthly</b><span>₹49 / 30 days</span></button>
          <button class="plan-card-v28" data-plan="Half Year Premium" data-amount="149" data-days="180" onclick="selectPaymentPlan(this)"><b>Half Year</b><span>₹149 / 180 days</span></button>
          <button class="plan-card-v28" data-plan="Yearly Premium" data-amount="499" data-days="365" onclick="selectPaymentPlan(this)"><b>Yearly</b><span>₹499 / 365 days</span></button>
        </div>

        <div class="selected-plan-v282" id="selectedPlanBox"><strong>Selected:</strong> Monthly Premium — ₹49 / 30 days</div>

        <div class="tool-box mt-15 payment-form-v281">
          <label>Selected Plan</label><input id="paymentPlan" value="Monthly Premium" readonly>
          <label>Amount</label><input id="paymentAmount" type="number" value="49" readonly>
          <label>Payment Method</label><input id="paymentMethod" value="UPI / QR" readonly>
          <label>Transaction ID / UTR Number</label><input id="paymentTxn" placeholder="Enter UTR / Transaction ID">
          <label>Screenshot URL (optional)</label><input id="paymentScreenshot" placeholder="Paste Google Drive / image link if available">
          <button class="payment-submit-btn-v282" onclick="submitPayment()">Submit Payment Request</button>
          <div class="payment-info-v282">After submission, the admin receives an email alert and can approve or reject the request from the admin panel.</div>
        </div>
      </div>
    </div>
  `;
}

function selectPaymentPlan(btn) {
  document.querySelectorAll(".plan-card-v28").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  const plan = btn.dataset.plan;
  const amount = btn.dataset.amount;
  const days = btn.dataset.days;
  const p = document.getElementById("paymentPlan");
  const a = document.getElementById("paymentAmount");
  const box = document.getElementById("selectedPlanBox");
  if (p) p.value = plan;
  if (a) a.value = amount;
  if (box) box.innerHTML = `<strong>Selected:</strong> ${plan} — ₹${amount} / ${days} days`;
  updateUPIPaymentLink();
  const qr = document.getElementById("generatedQR");
  if (qr) qr.classList.add("hidden");
}

function copyUPI() {
  const upi = "kait.satnam@sbi";
  navigator.clipboard?.writeText(upi);
  if (typeof toast === "function") toast("UPI ID copied successfully");
}

function buildUPIUrl() {
  const amount = document.getElementById("paymentAmount")?.value || "49";
  const plan = document.getElementById("paymentPlan")?.value || "Monthly Premium";
  const note = encodeURIComponent("Smart Photo Toolkit - " + plan);
  return `upi://pay?pa=kait.satnam@sbi&pn=SATNAM%20SO%20SATBIR%20SINGH&am=${amount}&cu=INR&tn=${note}`;
}

function updateUPIPaymentLink() {
  const link = document.getElementById("upiPayLink");
  if (link) link.href = buildUPIUrl();
}

function generatePlanQR() {
  const qr = document.getElementById("generatedQR");
  if (!qr) return;
  const url = buildUPIUrl();
  qr.src = "https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=" + encodeURIComponent(url);
  qr.classList.remove("hidden");
  if (typeof toast === "function") toast("Plan-specific QR code generated");
}

function premiumTool() {
  if (typeof requireLogin === "function" && !requireLogin()) return;
  workspace.innerHTML = `
    <h2>👑 Premium Plans</h2>
    <p class="tool-subtitle">Premium users get unlimited tools, priority access, and faster workflow support.</p>

    <div class="info-grid">
      <div><strong>Free Plan</strong><span>Limited uses</span></div>
      <div><strong>Monthly</strong><span>₹49 / 30 days</span></div>
      <div><strong>Half Year</strong><span>₹149 / 180 days</span></div>
      <div><strong>Yearly</strong><span>₹499 / 365 days</span></div>
    </div>

    <div class="action-row">
      <button class="primary-btn" onclick="showTool('payment')">Upgrade Now</button>
      <button class="secondary-btn" onclick="showTool('dashboard')">My Dashboard</button>
    </div>
  `;
}

function imageCompressor() {
  workspace.innerHTML = `
    <h2>🖼️ Image Compressor</h2>
    <p class="tool-subtitle">Upload an image and select the target size.</p>

    <div class="tool-box">
      <label class="upload-box">
        <input type="file" id="imageInput" accept="image/*">
        <span>📤 Tap to Upload Image</span>
      </label>

      <label>Target Size</label>
      <select id="targetSize">
        <option value="20">20 KB</option>
        <option value="50">50 KB</option>
        <option value="100" selected>100 KB</option>
        <option value="200">200 KB</option>
        <option value="custom">Custom KB</option>
      </select>

      <input type="number" id="customSize" placeholder="Enter custom KB" style="display:none">
      <button onclick="compressToTarget()">Compress Image</button>
    </div>

    <div id="compressOutput"></div>
  `;

  $("#targetSize").onchange = e => {
    $("#customSize").style.display = e.target.value === "custom" ? "block" : "none";
  };
}

async function compressToTarget() {
  const input = $("#imageInput");
  const output = $("#compressOutput");

  if (!input.files[0]) return alert("Please upload an image first.");

  let target = $("#targetSize").value === "custom"
    ? Number($("#customSize").value)
    : Number($("#targetSize").value);

  if (!target || target < 5) return alert("Please enter a valid target size in KB.");

  output.innerHTML = `<div class="progress-box">⏳ Compressing...</div>`;

  const file = input.files[0];
  const img = await loadImage(await readFile(file));

  let best = "";
  let bestSize = Infinity;

  for (let scale = 1; scale >= 0.08; scale -= 0.035) {
    let w = Math.max(80, Math.round(img.width * scale));
    let h = Math.max(80, Math.round(img.height * scale));

    let low = .03;
    let high = .96;

    for (let i = 0; i < 14; i++) {
      let q = (low + high) / 2;
      let data = drawImage(img, w, h, q);
      let size = getSizeKB(data);

      if (size <= target) {
        best = data;
        bestSize = size;
        low = q;
      } else {
        high = q;
      }
    }

    if (bestSize <= target && bestSize >= target * .88) break;
  }

  if (!best) {
    best = drawImage(img, 100, Math.round(img.height * 100 / img.width), .03);
    bestSize = getSizeKB(best);
  }

  if (typeof logToolUsage === "function") {
    logToolUsage("Image Compressor", {
      fileName: file.name,
      originalSizeKB: Math.round(file.size / 1024),
      outputSizeKB: bestSize.toFixed(2),
      targetSizeKB: target
    });
  }

  output.innerHTML = `
    <div class="result-card fade-in">
      <h3>✅ Compression Complete</h3>
      <p><b>Original:</b> ${formatBytes(file.size)}</p>
      <p><b>Target:</b> ${target} KB</p>
      <p><b>Compressed:</b> ${bestSize.toFixed(2)} KB</p>
      <img src="${best}" class="preview-img">
      <button class="download-btn" onclick="forceDownload('${best}','compressed-image.jpg')">Download Image</button>
    </div>
  `;
}

/* ================= NAME DATE ================= */

function nameDateTool() {
  workspace.innerHTML = `
    <h2>🏷️ Name / Date Photo</h2>
    <p class="tool-subtitle">Add name, date, or custom text below the photo.</p>

    <div class="tool-box">
      <label class="upload-box">
        <input id="ndImage" type="file" accept="image/*">
        <span>📤 Upload Photo</span>
      </label>

      <div class="row">
        <input id="ndName" placeholder="Name">
        <input id="ndDate" type="date">
      </div>

      <input id="ndText" placeholder="Custom text optional">
      <button onclick="makeNameDate()">Create Photo</button>
    </div>

    <div id="ndOutput"></div>
  `;
}

async function makeNameDate() {
  const f = $("#ndImage").files[0];
  if (!f) return alert("Please upload a photo.");

  const img = await loadImage(await readFile(f));

  const c = document.createElement("canvas");
  const ctx = c.getContext("2d");

  const w = 900;
  const h = Math.round(img.height * 900 / img.width);
  const cap = 110;

  c.width = w;
  c.height = h + cap;

  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.drawImage(img, 0, 0, w, h);

  ctx.fillStyle = "#111";
  ctx.textAlign = "center";
  ctx.font = "bold 32px Arial";
  ctx.fillText($("#ndName").value || "", w / 2, h + 42);

  ctx.font = "24px Arial";
  ctx.fillText($("#ndText").value || $("#ndDate").value || "", w / 2, h + 82);

  const data = c.toDataURL("image/jpeg", .92);

  if (typeof logToolUsage === "function") {
    logToolUsage("Name Date Photo", { fileName: f.name });
  }

  $("#ndOutput").innerHTML = `
    <div class="result-card fade-in">
      <img class="preview-img" src="${data}">
      <button class="download-btn" onclick="forceDownload('${data}','name-date-photo.jpg')">Download Photo</button>
    </div>
  `;
}

/* End of PART 1 */
/* =====================================================
   Smart Photo Toolkit Pro v28.4
   js/main.js — PART 2
   Passport Photo Maker
===================================================== */

/* ================= PASSPORT ================= */

function passportTool() {
  passState = { img: null, cropped: "" };

  workspace.innerHTML = `
    <h2>👤 Passport Photo Maker</h2>
    <p class="tool-subtitle">Create a professional A4 PDF with five 35×45 mm photos in one row.</p>

    <div class="tool-box">
      <label class="upload-box">
        <input id="passImage" type="file" accept="image/*">
        <span>📤 Upload Full Photo</span>
      </label>

      <div class="row">
        <input id="passName" placeholder="Name optional">
        <input id="passDate" type="date">
      </div>

      <button onclick="generatePassportSheet()">Generate Passport PDF Layout</button>
    </div>

    <div class="crop-panel">
      <div class="canvas-box">
        <canvas id="passCanvas" class="crop-canvas" width="350" height="450"></canvas>
      </div>

      <div class="controls">
        <label>Zoom
          <input id="passZoom" type="range" min="0.5" max="4" step="0.01" value="1.4">
        </label>
        <label>Left / Right
          <input id="passX" type="range" min="-400" max="400" value="0">
        </label>
        <label>Up / Down
          <input id="passY" type="range" min="-400" max="400" value="0">
        </label>
      </div>

      <div class="small-note">
        Tip: Keep the face centered. The PDF will place five 35×45 mm photos at the top of an A4 page.
      </div>
    </div>

    <div id="passOutput"></div>
  `;

  $("#passImage").onchange = loadPassportImage;

  ["passZoom", "passX", "passY"].forEach(id => {
    $("#" + id).oninput = updatePassportPreview;
  });

  drawEmptyPassport();
}

function drawEmptyPassport() {
  const c = $("#passCanvas");
  if (!c) return;

  const ctx = c.getContext("2d");

  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, c.width, c.height);

  ctx.fillStyle = "#777";
  ctx.textAlign = "center";
  ctx.font = "18px Arial";
  ctx.fillText("Upload photo", c.width / 2, c.height / 2);
}

async function loadPassportImage() {
  const f = $("#passImage").files[0];
  if (!f) return;

  passState.img = await loadImage(await readFile(f));

  $("#passZoom").value = 1.4;
  $("#passX").value = 0;
  $("#passY").value = 0;

  updatePassportPreview();
}

function updatePassportPreview() {
  const c = $("#passCanvas");
  if (!c) return;

  const ctx = c.getContext("2d");

  if (!passState.img) {
    drawEmptyPassport();
    return;
  }

  const zoom = Number($("#passZoom").value);
  const x = Number($("#passX").value);
  const y = Number($("#passY").value);

  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, c.width, c.height);

  const img = passState.img;
  const frameRatio = c.width / c.height;
  const imgRatio = img.width / img.height;

  let dw, dh;

  if (imgRatio > frameRatio) {
    dh = c.height * zoom;
    dw = dh * imgRatio;
  } else {
    dw = c.width * zoom;
    dh = dw / imgRatio;
  }

  const dx = (c.width - dw) / 2 + x;
  const dy = (c.height - dh) / 2 + y;

  ctx.drawImage(img, dx, dy, dw, dh);

  ctx.strokeStyle = "#f97316";
  ctx.lineWidth = 5;
  ctx.strokeRect(3, 3, c.width - 6, c.height - 6);

  passState.cropped = c.toDataURL("image/jpeg", .95);
}

function generatePassportSheet() {
  if (!passState.cropped) return alert("Please upload a photo and adjust the preview first.");

  const name = $("#passName").value || "";
  const date = $("#passDate").value || "";

  let items = "";

  for (let i = 0; i < 5; i++) {
    items += `
      <div class="photo-item">
        <img class="pass-photo" src="${passState.cropped}">
        ${
          name || date
            ? `<div class="caption">${name}<br>${date}</div>`
            : ""
        }
      </div>
    `;
  }

  lastPassportPDF = createPassportPDF(passState.cropped, name, date);

  if (typeof logToolUsage === "function") {
    logToolUsage("Passport Photo Maker", {
      toolType: "PDF",
      outputSizeKB: "A4 PDF"
    });
  }

  $("#passOutput").innerHTML = `
    <div class="result-card fade-in">
      <div class="action-row">
        <button class="open-btn" onclick="openPassportPDF()">📂 Open PDF</button>
        <button class="pdf-btn" onclick="downloadPassportPDF()">📄 Download PDF</button>
        <button class="print-btn" onclick="printPassportPDF()">🖨️ Print PDF</button>
      </div>

      <div class="passport-final-note">
        ✅ Passport output: 35×45mm, 5 photos, white background, black border, A4 top aligned.
      </div>

      <div class="print-area">
        <div class="passport-single-row">
          ${items}
        </div>
      </div>
    </div>
  `;
}

function createPassportPDF(src, name, date) {
  const { jsPDF } = window.jspdf;

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });

  const photoW = 35;
  const photoH = 45;
  const gap = 3;
  const top = 5;

  let x = 6;

  for (let i = 0; i < 5; i++) {
    pdf.setFillColor(255, 255, 255);
    pdf.rect(x, top, photoW, photoH, "F");

    pdf.addImage(src, "JPEG", x, top, photoW, photoH);

    pdf.setDrawColor(0);
    pdf.setLineWidth(0.3);
    pdf.rect(x, top, photoW, photoH);

    if (name || date) {
      pdf.setFontSize(7);
      pdf.text(name, x + photoW / 2, top + photoH + 3, { align: "center" });
      pdf.text(date, x + photoW / 2, top + photoH + 6, { align: "center" });
    }

    x += photoW + gap;
  }

  return pdf;
}

function refreshPassportUrl() {
  if (!lastPassportPDF) return "";

  if (lastPassportUrl) URL.revokeObjectURL(lastPassportUrl);

  lastPassportUrl = URL.createObjectURL(lastPassportPDF.output("blob"));
  return lastPassportUrl;
}

function openPassportPDF() {
  if (!lastPassportPDF) return alert("Please generate the layout first.");

  const url = refreshPassportUrl();
  const win = window.open(url, "_blank");

  if (!win) {
    alert("Popup was blocked. Please allow popups or use Download PDF.");
  }
}

function downloadPassportPDF() {
  if (!lastPassportPDF) return alert("Please generate the layout first.");

  try {
    const url = refreshPassportUrl();
    const a = document.createElement("a");

    a.href = url;
    a.download = "passport-photo-a4.pdf";
    a.target = "_blank";

    document.body.appendChild(a);
    a.click();
    a.remove();
  } catch (e) {
    openPassportPDF();
  }
}

function printPassportPDF() {
  if (!lastPassportPDF) return alert("Please generate the layout first.");

  lastPassportPDF.autoPrint();

  const url = URL.createObjectURL(lastPassportPDF.output("blob"));
  window.open(url, "_blank");
}

/* End of PART 2 */
/* =====================================================
   Smart Photo Toolkit Pro v28.4
   js/main.js — PART 3
   Aadhaar Print Tool
===================================================== */

/* ================= AADHAAR ================= */

function aadhaarTool() {
  workspace.innerHTML = `
    <h2>🪪 Aadhaar Print Tool</h2>
    <p class="tool-subtitle">Upload a PDF, drag the crop area, and create a print-ready PDF.</p>

    <div class="tab-row">
      <button class="tab-btn active" onclick="aadhaarMode('pdf',this)">UIDAI PDF Drag Crop</button>
      <button class="tab-btn" onclick="aadhaarMode('full',this)">Full Image</button>
      <button class="tab-btn" onclick="aadhaarMode('fb',this)">Front + Back</button>
    </div>

    <div id="aadhaarBox"></div>
    <div id="aadOutput"></div>
  `;

  aadhaarMode("pdf", $(".tab-btn"));
}

function setTab(btn) {
  $$(".tab-btn").forEach(b => b.classList.remove("active"));
  if (btn) btn.classList.add("active");
}

function commonAadhaarOptions() {
  return `
    <div class="row">
      <select id="aadCopies">
        <option value="1">1 Copy</option>
        <option value="2">2 Copies</option>
        <option value="4">4 Copies</option>
        <option value="6">6 Copies</option>
      </select>

      <select id="aadPos">
        <option value="top-center">Top Center</option>
        <option value="top-left">Top Left</option>
      </select>
    </div>
  `;
}

function aadhaarMode(mode, btn) {
  setTab(btn);

  const box = $("#aadhaarBox");
  $("#aadOutput").innerHTML = "";
  aadPdfCanvas = null;

  if (mode === "pdf") {
    box.innerHTML = `
      <div class="tool-box">
        <label>Upload UIDAI Aadhaar PDF</label>
        <input id="aadPdf" type="file" accept="application/pdf" onchange="loadAadhaarPDF()">

        ${commonAadhaarOptions()}

        <button onclick="makeAadhaarManualCrop()">Crop & Create PDF Layout</button>

        <div class="small-note">
          After the PDF loads, move the orange box and resize it from the corner handle.
        </div>
      </div>

      <div id="aadPdfCropUI"></div>
    `;
  }

  if (mode === "full") {
    box.innerHTML = `
      <div class="tool-box">
        <label class="upload-box">
          <input id="aadFull" type="file" accept="image/*">
          <span>📤 Upload Full Aadhaar Image</span>
        </label>

        ${commonAadhaarOptions()}

        <button onclick="makeAadhaarFull()">Create PDF Layout</button>
      </div>
    `;
  }

  if (mode === "fb") {
    box.innerHTML = `
      <div class="tool-box">
        <label>Front Image</label>
        <input id="aadFront" type="file" accept="image/*">

        <label>Back Image</label>
        <input id="aadBack" type="file" accept="image/*">

        ${commonAadhaarOptions()}

        <button onclick="makeAadhaarFrontBack()">Create PDF Layout</button>
      </div>
    `;
  }
}

async function loadAadhaarPDF() {
  const f = $("#aadPdf").files[0];

  if (!f) return;

  if (!window.pdfjsLib) {
    return alert("Internet on karke refresh karo. PDF library load nahi hui.");
  }

  $("#aadPdfCropUI").innerHTML = `<div class="progress-box">⏳ PDF loading...</div>`;

  const buf = await f.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
  const page = await pdf.getPage(1);

  const viewport = page.getViewport({ scale: 3 });
  const sourceCanvas = document.createElement("canvas");
  const sctx = sourceCanvas.getContext("2d");

  sourceCanvas.width = viewport.width;
  sourceCanvas.height = viewport.height;

  await page.render({
    canvasContext: sctx,
    viewport
  }).promise;

  aadPdfCanvas = sourceCanvas;

  $("#aadPdfCropUI").innerHTML = `
    <div class="crop-panel fade-in">
      <h3>Drag Crop Box</h3>

      <div class="small-note">
        Orange box ko Aadhaar card area par set karo. Final crop exactly isi box se banega.
      </div>

      <div class="canvas-box">
        <div class="drag-crop-wrap" id="dragWrap">
          <canvas id="aadPreview" class="crop-canvas"></canvas>

          <div id="cropBox" class="drag-crop-box">
            <span class="crop-size-label">Crop Area</span>
            <div class="drag-handle" id="resizeHandle"></div>
          </div>
        </div>
      </div>

      <div class="pdf-preview-note">
        Tip: Box ka border jahan dikh raha hai, final crop wahi exact area lega. Mobile scaling issue fixed.
      </div>
    </div>
  `;

  const p = $("#aadPreview");
  const pctx = p.getContext("2d");

  const displayW = 650;
  const ratio = aadPdfCanvas.width / aadPdfCanvas.height;

  p.width = displayW;
  p.height = Math.round(displayW / ratio);

  p.style.width = displayW + "px";
  p.style.height = p.height + "px";

  pctx.drawImage(aadPdfCanvas, 0, 0, p.width, p.height);

  aadDrag.x = Math.round(p.width * 0.03);
  aadDrag.y = Math.round(p.height * 0.74);
  aadDrag.w = Math.round(p.width * 0.94);
  aadDrag.h = Math.round(p.height * 0.24);

  applyCropBox();
  initDragCrop();
}

function applyCropBox() {
  const box = $("#cropBox");
  if (!box) return;

  box.style.left = aadDrag.x + "px";
  box.style.top = aadDrag.y + "px";
  box.style.width = aadDrag.w + "px";
  box.style.height = aadDrag.h + "px";
}

function getPoint(e) {
  if (e.touches && e.touches[0]) {
    return {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    };
  }

  return {
    x: e.clientX,
    y: e.clientY
  };
}

function initDragCrop() {
  const box = $("#cropBox");
  const handle = $("#resizeHandle");
  const canvas = $("#aadPreview");

  if (!box || !handle || !canvas) return;

  const startMove = (e, type) => {
    e.preventDefault();

    const p = getPoint(e);

    aadDrag.drag = type === "move";
    aadDrag.resize = type === "resize";
    aadDrag.startX = p.x;
    aadDrag.startY = p.y;

    aadDrag.start = {
      x: aadDrag.x,
      y: aadDrag.y,
      w: aadDrag.w,
      h: aadDrag.h
    };
  };

  box.onmousedown = e => startMove(e, "move");
  box.ontouchstart = e => startMove(e, "move");

  handle.onmousedown = e => {
    e.stopPropagation();
    startMove(e, "resize");
  };

  handle.ontouchstart = e => {
    e.stopPropagation();
    startMove(e, "resize");
  };

  const move = e => {
    if (!aadDrag.drag && !aadDrag.resize) return;

    e.preventDefault();

    const p = getPoint(e);
    const dx = p.x - aadDrag.startX;
    const dy = p.y - aadDrag.startY;

    if (aadDrag.drag) {
      aadDrag.x = aadDrag.start.x + dx;
      aadDrag.y = aadDrag.start.y + dy;
    }

    if (aadDrag.resize) {
      aadDrag.w = aadDrag.start.w + dx;
      aadDrag.h = aadDrag.start.h + dy;
    }

    aadDrag.w = Math.max(70, Math.min(aadDrag.w, canvas.width - aadDrag.x));
    aadDrag.h = Math.max(45, Math.min(aadDrag.h, canvas.height - aadDrag.y));

    aadDrag.x = Math.max(0, Math.min(aadDrag.x, canvas.width - aadDrag.w));
    aadDrag.y = Math.max(0, Math.min(aadDrag.y, canvas.height - aadDrag.h));

    applyCropBox();
  };

  const stop = () => {
    aadDrag.drag = false;
    aadDrag.resize = false;
  };

  document.onmousemove = move;
  document.onmouseup = stop;
  document.ontouchmove = move;
  document.ontouchend = stop;
}

async function makeAadhaarManualCrop() {
  if (!aadPdfCanvas) return alert("Please upload a PDF first.");

  const preview = $("#aadPreview");
  const box = $("#cropBox");

  if (!preview || !box) return alert("Preview was not loaded.");

  const canvasRect = preview.getBoundingClientRect();
  const boxRect = box.getBoundingClientRect();

  let relX = (boxRect.left - canvasRect.left) / canvasRect.width;
  let relY = (boxRect.top - canvasRect.top) / canvasRect.height;
  let relW = boxRect.width / canvasRect.width;
  let relH = boxRect.height / canvasRect.height;

  relX = Math.max(0, Math.min(relX, 1));
  relY = Math.max(0, Math.min(relY, 1));
  relW = Math.max(0.01, Math.min(relW, 1 - relX));
  relH = Math.max(0.01, Math.min(relH, 1 - relY));

  const cropped = cropCanvasKeepRatio(aadPdfCanvas, relX, relY, relW, relH);
  const copies = Number($("#aadCopies").value);
  const pos = $("#aadPos").value;

  lastAadhaarPDF = await createAadhaarPDF([cropped], copies, pos, false);

  if (typeof logToolUsage === "function") {
    logToolUsage("Aadhaar PDF Crop", { toolType: "PDF" });
  }

  $("#aadOutput").innerHTML = aadhaarPreviewHTML(
    `<img class="aadhaar-single" src="${cropped}">`,
    copies,
    pos
  );
}

function cropCanvasKeepRatio(src, xp, yp, wp, hp) {
  const sx = src.width * xp;
  const sy = src.height * yp;
  const sw = src.width * wp;
  const sh = src.height * hp;

  const c = document.createElement("canvas");
  const ctx = c.getContext("2d");

  c.width = 1200;
  c.height = Math.round(1200 * sh / sw);

  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, c.width, c.height);

  ctx.drawImage(src, sx, sy, sw, sh, 0, 0, c.width, c.height);

  return c.toDataURL("image/jpeg", .95);
}

function aadhaarPreviewHTML(content, copies, pos) {
  let all = "";

  for (let i = 0; i < copies; i++) {
    all += content;
  }

  return `
    <div class="result-card fade-in">
      <div class="action-row">
        <button class="open-btn" onclick="openAadhaarPDF()">📂 Open PDF</button>
        <button class="pdf-btn" onclick="downloadAadhaarPDF()">📄 Download PDF</button>
        <button class="print-btn" onclick="printAadhaarPDF()">🖨️ Print PDF</button>
      </div>

      <div class="print-area ${pos}">
        <div class="aadhaar-wrap">
          ${all}
        </div>
      </div>
    </div>
  `;
}

async function makeAadhaarFull() {
  const f = $("#aadFull").files[0];

  if (!f) return alert("Please upload the full Aadhaar image.");

  const src = await readFile(f);
  const copies = Number($("#aadCopies").value);
  const pos = $("#aadPos").value;

  lastAadhaarPDF = await createAadhaarPDF([src], copies, pos, false);

  if (typeof logToolUsage === "function") {
    logToolUsage("Aadhaar Full Image", { toolType: "PDF", fileName: f.name });
  }

  $("#aadOutput").innerHTML = aadhaarPreviewHTML(
    `<img class="aadhaar-single" src="${src}">`,
    copies,
    pos
  );
}

async function makeAadhaarFrontBack() {
  const f = $("#aadFront").files[0];
  const b = $("#aadBack").files[0];

  if (!f && !b) return alert("Please upload the front or back image.");

  const front = f ? await readFile(f) : "";
  const back = b ? await readFile(b) : "";

  const copies = Number($("#aadCopies").value);
  const pos = $("#aadPos").value;

  let imgs = [];
  if (front) imgs.push(front);
  if (back) imgs.push(back);

  lastAadhaarPDF = await createAadhaarPDF(imgs, copies, pos, true);

  if (typeof logToolUsage === "function") {
    logToolUsage("Aadhaar Front Back", { toolType: "PDF" });
  }

  let content = `
    ${front ? `<img class="aadhaar-card" src="${front}">` : ""}
    ${back ? `<img class="aadhaar-card" src="${back}">` : ""}
  `;

  $("#aadOutput").innerHTML = aadhaarPreviewHTML(content, copies, pos);
}

/* End of PART 3 */
/* =====================================================
   Smart Photo Toolkit Pro v28.4
   js/main.js — PART 4
   Aadhaar PDF Output + PDF Resizer + Helper Functions
===================================================== */

async function createAadhaarPDF(srcs, copies, pos, isCards) {
  const { jsPDF } = window.jspdf;

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });

  let y = 10;
  const gap = 8;

  for (let copy = 0; copy < copies; copy++) {
    let dims = [];

    for (const s of srcs) {
      const img = await loadImage(s);
      const h = 54;
      const w = isCards ? 85.6 : h * img.width / img.height;

      dims.push({
        src: s,
        w,
        h
      });
    }

    const totalW = dims.reduce((a, d) => a + d.w, 0) + (dims.length - 1) * gap;
    let x = pos === "top-left" ? 10 : (210 - totalW) / 2;

    for (const d of dims) {
      pdf.addImage(d.src, "JPEG", x, y, d.w, d.h);
      pdf.setDrawColor(60);
      pdf.setLineWidth(.25);
      pdf.rect(x, y, d.w, d.h);
      x += d.w + gap;
    }

    y += 62;

    if (y > 250 && copy < copies - 1) {
      pdf.addPage();
      y = 10;
    }
  }

  return pdf;
}

function refreshAadhaarUrl() {
  if (!lastAadhaarPDF) return "";

  if (lastAadhaarUrl) URL.revokeObjectURL(lastAadhaarUrl);

  lastAadhaarUrl = URL.createObjectURL(lastAadhaarPDF.output("blob"));
  return lastAadhaarUrl;
}

function openAadhaarPDF() {
  if (!lastAadhaarPDF) return alert("Please generate the Aadhaar layout first.");

  const url = refreshAadhaarUrl();
  const win = window.open(url, "_blank");

  if (!win) {
    alert("Popup was blocked. Please allow popups or use Download PDF.");
  }
}

function downloadAadhaarPDF() {
  if (!lastAadhaarPDF) return alert("Please generate the Aadhaar layout first.");

  try {
    const url = refreshAadhaarUrl();
    const a = document.createElement("a");

    a.href = url;
    a.download = "aadhaar-print-a4.pdf";
    a.target = "_blank";

    document.body.appendChild(a);
    a.click();
    a.remove();
  } catch (e) {
    openAadhaarPDF();
  }
}

function printAadhaarPDF() {
  if (!lastAadhaarPDF) return alert("Please generate the Aadhaar layout first.");

  lastAadhaarPDF.autoPrint();

  const url = URL.createObjectURL(lastAadhaarPDF.output("blob"));
  window.open(url, "_blank");
}

/* ================= PDF RESIZER ================= */

function pdfResizerTool() {
  workspace.innerHTML = `
    <h2>📄 PDF Resizer</h2>
    <p class="tool-subtitle">Upload a PDF and compress it according to the target size.</p>

    <div class="tool-box">
      <label class="upload-box">
        <input id="pdfInput" type="file" accept="application/pdf">
        <span>📤 Upload PDF</span>
      </label>

      <label>Target Size</label>
      <select id="pdfTargetSize">
        <option value="100">100 KB</option>
        <option value="200">200 KB</option>
        <option value="500" selected>500 KB</option>
        <option value="1024">1 MB</option>
        <option value="custom">Custom KB</option>
      </select>

      <input type="number" id="pdfCustomSize" placeholder="Enter custom KB" style="display:none">

      <button onclick="compressPdfBasic()">Resize / Compress PDF</button>

      <div class="warning-box">
        Note: Browser-side PDF compression image-based PDF ke liye best work karta hai.
        Text-only PDF ka size bahut kam na bhi ho sakta hai.
      </div>
    </div>

    <div id="pdfOutput"></div>
  `;

  $("#pdfTargetSize").onchange = e => {
    $("#pdfCustomSize").style.display = e.target.value === "custom" ? "block" : "none";
  };
}

async function compressPdfBasic() {
  const input = $("#pdfInput");
  const output = $("#pdfOutput");

  if (!input.files[0]) return alert("Please upload a PDF.");

  const file = input.files[0];

  let target = $("#pdfTargetSize").value === "custom"
    ? Number($("#pdfCustomSize").value)
    : Number($("#pdfTargetSize").value);

  if (!target || target < 50) return alert("Please enter a valid target size in KB.");

  if (!window.pdfjsLib || !window.jspdf) {
    return alert("PDF library was not loaded. Please check your internet connection and refresh.");
  }

  output.innerHTML = `<div class="progress-box">⏳ PDF processing...</div>`;

  const buf = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise;

  const { jsPDF } = window.jspdf;
  const outPdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });

  let quality = .72;
  let scale = 1.25;
  let finalBlob = null;

  for (let attempt = 0; attempt < 5; attempt++) {
    const tempPdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale });

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      canvas.width = viewport.width;
      canvas.height = viewport.height;

      await page.render({
        canvasContext: ctx,
        viewport
      }).promise;

      const imgData = canvas.toDataURL("image/jpeg", quality);

      if (i > 1) tempPdf.addPage();

      tempPdf.addImage(imgData, "JPEG", 0, 0, 210, 297);
    }

    finalBlob = tempPdf.output("blob");

    const kb = finalBlob.size / 1024;

    if (kb <= target || attempt === 4) {
      const url = URL.createObjectURL(finalBlob);

      if (typeof logToolUsage === "function") {
        logToolUsage("PDF Resizer", {
          toolType: "PDF",
          fileName: file.name,
          originalSizeKB: Math.round(file.size / 1024),
          outputSizeKB: kb.toFixed(2),
          targetSizeKB: target
        });
      }

      output.innerHTML = `
        <div class="result-card fade-in">
          <h3>✅ PDF Ready</h3>
          <p><b>Original:</b> ${formatBytes(file.size)}</p>
          <p><b>Target:</b> ${target} KB</p>
          <p><b>Output:</b> ${kb.toFixed(2)} KB</p>

          <div class="action-row">
            <a class="open-btn" href="${url}" target="_blank">📂 Open PDF</a>
            <a class="pdf-btn" href="${url}" download="compressed-pdf.pdf">📄 Download PDF</a>
          </div>

          <iframe class="pdf-frame" src="${url}"></iframe>
        </div>
      `;
      return;
    }

    quality -= .12;
    scale -= .18;

    if (quality < .25) quality = .25;
    if (scale < .65) scale = .65;
  }
}

/* ================= HELPERS ================= */

function readFile(file) {
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result);
    reader.readAsDataURL(file);
  });
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => resolve(img);
    img.onerror = reject;

    img.src = src;
  });
}

function drawImage(img, w, h, quality) {
  const c = document.createElement("canvas");
  const ctx = c.getContext("2d");

  c.width = w;
  c.height = h;

  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, w, h);

  ctx.drawImage(img, 0, 0, w, h);

  return c.toDataURL("image/jpeg", quality);
}

function getSizeKB(dataUrl) {
  const base64 = dataUrl.split(",")[1] || "";
  return (base64.length * 0.75) / 1024;
}

function formatBytes(bytes) {
  if (!bytes) return "0 KB";

  const kb = bytes / 1024;

  if (kb < 1024) return kb.toFixed(2) + " KB";

  return (kb / 1024).toFixed(2) + " MB";
}

function forceDownload(dataUrl, fileName) {
  const a = document.createElement("a");

  a.href = dataUrl;
  a.download = fileName || "download";
  a.target = "_blank";

  document.body.appendChild(a);
  a.click();
  a.remove();
}

/* ================= SAFE FALLBACK ================= */

window.onerror = function(message, source, lineno, colno, error) {
  console.error("SPT Error:", message, source, lineno, colno, error);

  if (typeof toast === "function") {
    toast("Error: " + message);
  }
};

/* End of PART 4 */
