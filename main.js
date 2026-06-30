/* =====================================================
   Smart Photo Toolkit Pro v32
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
  if (tool === "logout") return SPT.logout();

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
    <section class="auth-pro-shell fade-in">
      <div class="auth-hero-panel">
        <div class="auth-brand-row">
          <div class="auth-brand-icon">📸</div>
          <div>
            <h2>Smart Photo Toolkit Pro</h2>
            <p>Secure access for premium document and photo tools.</p>
          </div>
        </div>

        <div class="auth-hero-content">
          <span class="auth-pill">v35 Enterprise</span>
          <h1>Welcome back</h1>
          <p>Login to manage your dashboard, payment status, premium plan, and tool history.</p>

          <div class="auth-benefits">
            <div>✅ Premium dashboard</div>
            <div>✅ Payment tracking</div>
            <div>✅ Secure password recovery</div>
          </div>
        </div>
      </div>

      <div class="auth-form-panel">
        <div class="auth-tabs">
          <button class="auth-tab active" id="loginTabBtn" onclick="switchAuthMode('login')">Login</button>
          <button class="auth-tab" id="signupTabBtn" onclick="switchAuthMode('signup')">Create Account</button>
        </div>

        <div id="authLoginBox" class="auth-mode-box">
          <h2>Login to your account</h2>
          <p class="auth-muted">Enter your registered email address and password.</p>

          <div class="form-group pro-field">
            <label>Email Address</label>
            <input id="loginEmail" type="email" placeholder="you@example.com" autocomplete="email">
          </div>

          <div class="form-group pro-field">
            <label>Password</label>
            <input id="loginPassword" type="password" placeholder="Enter your password" autocomplete="current-password">
          </div>

          <button class="auth-main-btn" onclick="loginSubmit()">Login Securely</button>

          <div class="auth-footer-line">
            <span>Forgot your password?</span>
            <button class="auth-text-btn" onclick="toggleForgotBox()">Recover Password</button>
          </div>
        </div>

        <div id="authSignupBox" class="auth-mode-box hidden">
          <h2>Create your account</h2>
          <p class="auth-muted">Fill in your details to start using Smart Photo Toolkit Pro.</p>

          <div class="form-group pro-field">
            <label>Full Name</label>
            <input id="signupName" placeholder="Enter full name" autocomplete="name">
          </div>

          <div class="form-group pro-field">
            <label>Email Address</label>
            <input id="signupEmail" type="email" placeholder="you@example.com" autocomplete="email">
          </div>

          <div class="auth-two-col">
            <div class="form-group pro-field">
              <label>Mobile Number</label>
              <input id="signupMobile" placeholder="Enter mobile number" autocomplete="tel">
            </div>
            <div class="form-group pro-field">
              <label>Password</label>
              <input id="signupPassword" type="password" placeholder="Create password" autocomplete="new-password">
            </div>
          </div>

          <div class="form-group pro-field">
            <label>Address</label>
            <textarea id="signupAddress" rows="3" placeholder="Enter full address"></textarea>
          </div>

          <button class="auth-main-btn" onclick="signupSubmit()">Create Account</button>

          <div class="auth-footer-line">
            <span>Already registered?</span>
            <button class="auth-text-btn" onclick="switchAuthMode('login')">Login here</button>
          </div>
        </div>

        <div id="forgotBox" class="auth-recovery-box hidden">
          <div class="auth-recovery-head">
            <h3>Password Recovery</h3>
            <button class="auth-close-btn" onclick="toggleForgotBox()">×</button>
          </div>
          <p class="auth-muted">Send an OTP to your registered email, then create a new password.</p>

          <div class="forgot-grid">
            <input id="forgotEmail" type="email" placeholder="Registered email address">
            <button class="secondary-btn" onclick="forgotSubmit()">Send OTP</button>
          </div>

          <div class="forgot-grid forgot-grid-3">
            <input id="resetEmail" type="email" placeholder="Email address">
            <input id="resetOtp" placeholder="OTP">
            <input id="resetPassword" type="password" placeholder="New password">
          </div>

          <button class="auth-main-btn full-btn" onclick="resetSubmit()">Reset Password</button>
        </div>
      </div>
    </section>
  `;
}

function switchAuthMode(mode) {
  const loginBox = document.getElementById("authLoginBox");
  const signupBox = document.getElementById("authSignupBox");
  const loginBtn = document.getElementById("loginTabBtn");
  const signupBtn = document.getElementById("signupTabBtn");

  if (!loginBox || !signupBox || !loginBtn || !signupBtn) return;

  const isSignup = mode === "signup";
  loginBox.classList.toggle("hidden", isSignup);
  signupBox.classList.toggle("hidden", !isSignup);
  loginBtn.classList.toggle("active", !isSignup);
  signupBtn.classList.toggle("active", isSignup);
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
      <button class="primary-btn" onclick="showTool('payment')">Make Payment</button>
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
      <div class="progress-box">Loading admin overview...</div>
    </div>
  `;

  setTimeout(() => {
    if (typeof loadAdminStats === "function") loadAdminStats();
  }, 100);
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
    <h2>💳 Premium Payment & Auto Activation</h2>
    <p class="tool-subtitle">Select a premium plan, generate a UPI QR code for the selected amount, complete the payment, and submit your UTR/Transaction ID. Premium access will be activated automatically after submission.</p>

    <div class="payment-wrap-v28 payment-pro-v32">
      <div class="payment-card payment-qr-card-v32 center">
        <div class="payment-badge-v282">Secure UPI Payment</div>
        <h3>Generate Payment QR</h3>
        <p class="tool-subtitle">The QR code is generated only after you select a plan and click the button below.</p>

        <div class="qr-placeholder-v32" id="qrPlaceholder">
          <div class="qr-placeholder-icon-v32">🔒</div>
          <strong>No QR generated yet</strong>
          <span>Select a plan and click “Generate Payment QR”.</span>
        </div>

        <img id="generatedQR" class="generated-qr-img hidden" alt="Generated UPI QR Code">

        <div class="upi-box-v28" id="upiText">UPI ID: kait.satnam@sbi</div>
        <button class="secondary-btn copy-upi-btn-v282" onclick="copyUPI()">📋 Copy UPI ID</button>
        <a class="primary-btn upi-pay-link hidden" id="upiPayLink" href="#" target="_blank">Open UPI App</a>
        <p class="small-note">Receiving Account: <b>State Bank of India 6831</b></p>
      </div>

      <div class="payment-card payment-form-card-v282">
        <h3>Select Premium Plan</h3>
        <div class="plan-grid-v28">
          <button class="plan-card-v28 active" data-plan="Monthly Premium" data-amount="49" data-days="30" onclick="selectPaymentPlan(this)"><b>Monthly</b><span>₹49 / 30 days</span></button>
          <button class="plan-card-v28" data-plan="Half Year Premium" data-amount="149" data-days="180" onclick="selectPaymentPlan(this)"><b>Half Year</b><span>₹149 / 180 days</span></button>
          <button class="plan-card-v28" data-plan="Yearly Premium" data-amount="499" data-days="365" onclick="selectPaymentPlan(this)"><b>Yearly</b><span>₹499 / 365 days</span></button>
        </div>

        <div class="selected-plan-v282" id="selectedPlanBox"><strong>Selected:</strong> Monthly Premium — ₹49 / 30 days</div>

        <div class="action-row">
          <button class="primary-btn generate-payment-btn-v32" onclick="generatePlanQR()">Generate Payment QR</button>
        </div>

        <div class="tool-box mt-15 payment-form-v281">
          <label>Selected Plan</label><input id="paymentPlan" value="Monthly Premium" readonly>
          <label>Amount</label><input id="paymentAmount" type="number" value="49" readonly>
          <label>Payment Method</label><input id="paymentMethod" value="UPI / QR" readonly>
          <label>Transaction ID / UTR Number</label><input id="paymentTxn" placeholder="Enter UTR / Transaction ID after payment">
          <label>Screenshot URL (optional)</label><input id="paymentScreenshot" placeholder="Paste Google Drive / image link if available">
          <button class="payment-submit-btn-v282" onclick="submitPayment()">Submit Payment & Activate Premium</button>
          <div class="payment-info-v282">After submission, premium access is activated automatically and the admin receives an email alert for record review.</div>
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

  const qr = document.getElementById("generatedQR");
  const placeholder = document.getElementById("qrPlaceholder");
  const link = document.getElementById("upiPayLink");

  if (qr) qr.classList.add("hidden");
  if (placeholder) placeholder.classList.remove("hidden");
  if (link) link.classList.add("hidden");
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

function generatePlanQR() {
  const qr = document.getElementById("generatedQR");
  const placeholder = document.getElementById("qrPlaceholder");
  const link = document.getElementById("upiPayLink");
  if (!qr) return;

  const url = buildUPIUrl();
  qr.src = "https://api.qrserver.com/v1/create-qr-code/?size=360x360&data=" + encodeURIComponent(url);
  qr.classList.remove("hidden");

  if (placeholder) placeholder.classList.add("hidden");
  if (link) {
    link.href = url;
    link.classList.remove("hidden");
  }

  if (typeof toast === "function") toast("Payment QR generated for the selected plan");
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
   Smart Photo Toolkit Pro v32
   js/main.js — PART 2
   Passport Photo Maker
===================================================== */

/* ================= PASSPORT ================= */


function passportTool() {
  passState = {
    img: null,
    cropped: "",
    display: { w: 0, h: 0, scale: 1, offsetX: 0, offsetY: 0 },
    crop: null,
    mode: "idle",
    start: null,
    handleSize: 18
  };

  workspace.innerHTML = `
    <h2>👤 Passport Studio</h2>
    <p class="tool-subtitle">Upload a photo, then draw or adjust the fixed 35×45 mm crop area directly on the image. No sliders required.</p>

    <div class="tool-box passport-studio-tools">
      <label class="upload-box">
        <input id="passImage" type="file" accept="image/*">
        <span>📤 Upload Full Photo</span>
      </label>

      <div class="row">
        <input id="passName" placeholder="Name optional">
        <input id="passDate" type="date">
      </div>

      <div class="passport-studio-actions">
        <button class="secondary-btn" onclick="resetPassportCrop()">Reset Crop</button>
        <button class="primary-btn" onclick="generatePassportSheet()">Generate Passport PDF Layout</button>
      </div>
    </div>

    <div class="crop-panel passport-studio-panel">
      <div class="passport-guide">
        Draw a box around the printable area. The crop keeps a passport ratio automatically. You can move the box or resize it from the corner handle.
      </div>

      <div class="canvas-box passport-studio-canvasbox">
        <canvas id="passCanvas" class="crop-canvas passport-studio-canvas" width="720" height="520"></canvas>
      </div>

      <div class="small-note">
        Desktop: drag to draw, drag inside to move, drag the corner dot to resize. Mobile: use finger drag. Final print size stays 35×45 mm.
      </div>
    </div>

    <div id="passOutput"></div>
  `;

  $("#passImage").onchange = loadPassportImage;
  drawEmptyPassport();
}

function drawEmptyPassport() {
  const c = $("#passCanvas");
  if (!c) return;

  const ctx = c.getContext("2d");
  ctx.clearRect(0, 0, c.width, c.height);
  ctx.fillStyle = "#f8fafc";
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.strokeStyle = "#cbd5e1";
  ctx.setLineDash([8, 8]);
  ctx.lineWidth = 2;
  ctx.strokeRect(30, 30, c.width - 60, c.height - 60);
  ctx.setLineDash([]);
  ctx.fillStyle = "#64748b";
  ctx.textAlign = "center";
  ctx.font = "bold 20px Arial";
  ctx.fillText("Upload a photo to start passport crop", c.width / 2, c.height / 2 - 8);
  ctx.font = "14px Arial";
  ctx.fillText("Draw the printable 35×45 mm area directly on the image", c.width / 2, c.height / 2 + 22);
}

async function loadPassportImage() {
  const f = $("#passImage").files[0];
  if (!f) return;

  passState.img = await loadImage(await readFile(f));
  passState.cropped = "";

  const c = $("#passCanvas");
  const maxW = Math.min(820, Math.max(360, Math.round((workspace?.clientWidth || 820) - 70)));
  c.width = maxW;
  c.height = Math.round(maxW * 0.72);

  preparePassportDisplay();
  const d = passState.display;

  // Default crop is centered with fixed 35:45 ratio.
  const ratio = 35 / 45;
  let cropH = Math.min(d.h * 0.72, d.w / ratio * 0.72);
  let cropW = cropH * ratio;
  if (cropW > d.w * 0.72) {
    cropW = d.w * 0.72;
    cropH = cropW / ratio;
  }

  passState.crop = {
    x: d.offsetX + (d.w - cropW) / 2,
    y: d.offsetY + (d.h - cropH) / 2,
    w: cropW,
    h: cropH
  };

  drawPassportStudio();
  initPassportCropEvents();
}

function preparePassportDisplay() {
  const c = $("#passCanvas");
  if (!c || !passState.img) return;

  const pad = 24;
  const img = passState.img;
  const scale = Math.min((c.width - pad * 2) / img.width, (c.height - pad * 2) / img.height);
  const w = img.width * scale;
  const h = img.height * scale;

  passState.display = {
    w,
    h,
    scale,
    offsetX: (c.width - w) / 2,
    offsetY: (c.height - h) / 2
  };
}

function drawPassportStudio() {
  const c = $("#passCanvas");
  if (!c) return;

  const ctx = c.getContext("2d");
  ctx.clearRect(0, 0, c.width, c.height);
  ctx.fillStyle = "#111827";
  ctx.fillRect(0, 0, c.width, c.height);

  if (!passState.img) {
    drawEmptyPassport();
    return;
  }

  const d = passState.display;
  ctx.drawImage(passState.img, d.offsetX, d.offsetY, d.w, d.h);

  const crop = passState.crop;
  if (!crop) return;

  // Shade outside selection.
  ctx.save();
  ctx.fillStyle = "rgba(15, 23, 42, 0.58)";
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.clearRect(crop.x, crop.y, crop.w, crop.h);
  ctx.drawImage(passState.img, d.offsetX, d.offsetY, d.w, d.h);
  ctx.restore();

  // Re-shade outside without covering selected region.
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, c.width, c.height);
  ctx.rect(crop.x, crop.y, crop.w, crop.h);
  ctx.fillStyle = "rgba(15, 23, 42, 0.58)";
  ctx.fill("evenodd");
  ctx.restore();

  // Passport frame.
  ctx.strokeStyle = "#f97316";
  ctx.lineWidth = 3;
  ctx.strokeRect(crop.x, crop.y, crop.w, crop.h);

  // Rule-of-thirds grid.
  ctx.strokeStyle = "rgba(255,255,255,.65)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(crop.x + crop.w / 3, crop.y);
  ctx.lineTo(crop.x + crop.w / 3, crop.y + crop.h);
  ctx.moveTo(crop.x + crop.w * 2 / 3, crop.y);
  ctx.lineTo(crop.x + crop.w * 2 / 3, crop.y + crop.h);
  ctx.moveTo(crop.x, crop.y + crop.h / 3);
  ctx.lineTo(crop.x + crop.w, crop.y + crop.h / 3);
  ctx.moveTo(crop.x, crop.y + crop.h * 2 / 3);
  ctx.lineTo(crop.x + crop.w, crop.y + crop.h * 2 / 3);
  ctx.stroke();

  // Resize handle.
  const hs = passState.handleSize;
  ctx.fillStyle = "#f97316";
  ctx.beginPath();
  ctx.arc(crop.x + crop.w, crop.y + crop.h, hs / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.fillStyle = "rgba(0,0,0,.65)";
  ctx.fillRect(crop.x + 8, crop.y + 8, 168, 28);
  ctx.fillStyle = "#fff";
  ctx.font = "bold 13px Arial";
  ctx.textAlign = "left";
  ctx.fillText("35×45 mm print area", crop.x + 16, crop.y + 27);
}

function initPassportCropEvents() {
  const c = $("#passCanvas");
  if (!c) return;

  const down = e => {
    e.preventDefault();
    if (!passState.img) return;

    const p = getPassportPoint(e);
    const crop = passState.crop;
    const hs = passState.handleSize + 10;

    if (crop && Math.abs(p.x - (crop.x + crop.w)) <= hs && Math.abs(p.y - (crop.y + crop.h)) <= hs) {
      passState.mode = "resize";
    } else if (crop && p.x >= crop.x && p.x <= crop.x + crop.w && p.y >= crop.y && p.y <= crop.y + crop.h) {
      passState.mode = "move";
    } else {
      passState.mode = "draw";
      passState.crop = { x: p.x, y: p.y, w: 1, h: 1 };
    }

    passState.start = { p, crop: { ...(passState.crop || {}) } };
    drawPassportStudio();
  };

  const move = e => {
    if (!passState.mode || passState.mode === "idle" || !passState.start) return;
    e.preventDefault();

    const p = getPassportPoint(e);
    const start = passState.start;
    const ratio = 35 / 45;
    const d = passState.display;

    if (passState.mode === "move") {
      const dx = p.x - start.p.x;
      const dy = p.y - start.p.y;
      passState.crop.x = start.crop.x + dx;
      passState.crop.y = start.crop.y + dy;
      clampPassportCrop();
    }

    if (passState.mode === "resize") {
      let w = Math.max(50, p.x - start.crop.x);
      let h = w / ratio;
      if (start.crop.y + h > d.offsetY + d.h) {
        h = d.offsetY + d.h - start.crop.y;
        w = h * ratio;
      }
      passState.crop = { x: start.crop.x, y: start.crop.y, w, h };
      clampPassportCrop();
    }

    if (passState.mode === "draw") {
      let x1 = start.p.x;
      let y1 = start.p.y;
      let x2 = p.x;
      let y2 = p.y;
      let w = Math.abs(x2 - x1);
      let h = w / ratio;
      if (p.y < start.p.y) h = -h;
      passState.crop = {
        x: p.x < start.p.x ? start.p.x - w : start.p.x,
        y: h < 0 ? start.p.y + h : start.p.y,
        w,
        h: Math.abs(h)
      };
      if (passState.crop.w < 50) {
        passState.crop.w = 50;
        passState.crop.h = 50 / ratio;
      }
      clampPassportCrop();
    }

    drawPassportStudio();
  };

  const up = () => {
    if (!passState.img) return;
    passState.mode = "idle";
    passState.start = null;
    cropPassportSelection();
  };

  c.onmousedown = down;
  c.ontouchstart = down;
  window.onmousemove = move;
  window.ontouchmove = move;
  window.onmouseup = up;
  window.ontouchend = up;
}

function getPassportPoint(e) {
  const c = $("#passCanvas");
  const r = c.getBoundingClientRect();
  const t = e.touches && e.touches[0] ? e.touches[0] : e;
  return {
    x: (t.clientX - r.left) * (c.width / r.width),
    y: (t.clientY - r.top) * (c.height / r.height)
  };
}

function clampPassportCrop() {
  const d = passState.display;
  const crop = passState.crop;
  if (!crop) return;

  crop.w = Math.max(50, Math.min(crop.w, d.w));
  crop.h = crop.w / (35 / 45);
  if (crop.h > d.h) {
    crop.h = d.h;
    crop.w = crop.h * (35 / 45);
  }

  crop.x = Math.max(d.offsetX, Math.min(crop.x, d.offsetX + d.w - crop.w));
  crop.y = Math.max(d.offsetY, Math.min(crop.y, d.offsetY + d.h - crop.h));
}

function cropPassportSelection() {
  if (!passState.img || !passState.crop) return "";

  clampPassportCrop();
  const d = passState.display;
  const crop = passState.crop;

  const sx = (crop.x - d.offsetX) / d.scale;
  const sy = (crop.y - d.offsetY) / d.scale;
  const sw = crop.w / d.scale;
  const sh = crop.h / d.scale;

  const out = document.createElement("canvas");
  const ctx = out.getContext("2d");
  out.width = 350;
  out.height = 450;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, out.width, out.height);
  ctx.drawImage(passState.img, sx, sy, sw, sh, 0, 0, out.width, out.height);
  passState.cropped = out.toDataURL("image/jpeg", .95);
  return passState.cropped;
}

function resetPassportCrop() {
  if (!passState.img) {
    drawEmptyPassport();
    return;
  }
  preparePassportDisplay();
  const d = passState.display;
  const ratio = 35 / 45;
  let cropH = Math.min(d.h * 0.72, d.w / ratio * 0.72);
  let cropW = cropH * ratio;
  if (cropW > d.w * 0.72) {
    cropW = d.w * 0.72;
    cropH = cropW / ratio;
  }
  passState.crop = {
    x: d.offsetX + (d.w - cropW) / 2,
    y: d.offsetY + (d.h - cropH) / 2,
    w: cropW,
    h: cropH
  };
  cropPassportSelection();
  drawPassportStudio();
}

function generatePassportSheet() {
  const cropped = cropPassportSelection();
  if (!cropped) return alert("Please upload a photo and select the printable passport area first.");

  const name = $("#passName").value || "";
  const date = $("#passDate").value || "";

  let items = "";
  for (let i = 0; i < 5; i++) {
    items += `
      <div class="photo-item">
        <img class="pass-photo" src="${cropped}">
        ${name || date ? `<div class="caption">${name}<br>${date}</div>` : ""}
      </div>
    `;
  }

  lastPassportPDF = createPassportPDF(cropped, name, date);

  if (typeof logToolUsage === "function") {
    logToolUsage("Passport Studio Crop", {
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
        ✅ Passport output created from your selected area: 35×45 mm, 5 photos, white background, black border, A4 top aligned.
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
   Smart Photo Toolkit Pro v32
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
   Smart Photo Toolkit Pro v32
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


/* =====================================================
   Smart Photo Toolkit Pro v32 Enterprise Overrides
   Profile, payment history, legal pages, better dashboard
===================================================== */

function escapeHTML(v){
  return String(v ?? "").replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
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
  if (tool === "contact") return contactTool();
  if (tool === "privacy") return privacyTool();
  if (tool === "terms") return termsTool();
  if (tool === "refund") return refundTool();
  if (tool === "logout") return SPT.logout();
  return home();
}

function home() {
  workspace.innerHTML = `
    <h2>Welcome to Smart Photo Toolkit Pro</h2>
    <p>Professional image, passport photo, Aadhaar print, and PDF tools with secure account and premium workflow.</p>
    <div class="stats">
      <div><strong>📄 PDF Output</strong><span>Passport and Aadhaar PDF downloads.</span></div>
      <div><strong>🖨️ Print Ready</strong><span>Professional A4 print-ready layouts.</span></div>
      <div><strong>🔐 Account System</strong><span>Dashboard, payment history, and premium status.</span></div>
    </div>
    <div class="footer-links-v32">
      <button class="secondary-btn" onclick="showTool('privacy')">Privacy Policy</button>
      <button class="secondary-btn" onclick="showTool('terms')">Terms</button>
      <button class="secondary-btn" onclick="showTool('refund')">Refund Policy</button>
      <button class="secondary-btn" onclick="showTool('contact')">Contact</button>
    </div>`;
}

async function dashboardTool() {
  const u = getCurrentUser();
  if (!u) {
    workspace.innerHTML = `<h2>My Dashboard</h2><div class="warning-box">Please login to view your account dashboard.</div><button class="primary-btn" onclick="showTool('login')">Login Now</button>`;
    return;
  }
  const initial = (u.name || u.email || "U").charAt(0).toUpperCase();
  workspace.innerHTML = `
    <div class="dashboard-head-v32">
      <div class="profile-mini-v32"><div class="avatar-v32">${escapeHTML(initial)}</div><div><h2>My Dashboard</h2><p class="tool-subtitle">Welcome, ${escapeHTML(u.name || "User")}. Manage your profile, premium access, and payment history.</p></div></div>
      <button class="print-btn" onclick="SPT.logout()">Logout</button>
    </div>
    <div class="stats">
      <div><strong>Name</strong><span>${escapeHTML(u.name || "-")}</span></div>
      <div><strong>Email</strong><span>${escapeHTML(u.email || "-")}</span></div>
      <div><strong>Mobile</strong><span>${escapeHTML(u.mobile || "-")}</span></div>
      <div><strong>Address</strong><span>${escapeHTML(u.address || "-")}</span></div>
      <div><strong>Plan</strong><span>${u.premium ? escapeHTML(u.premiumPlan || "Premium") : "Free"}</span></div>
      <div><strong>Premium Ends</strong><span>${escapeHTML(u.premiumEnd || "-")}</span></div>
      <div><strong>Uses Left</strong><span>${escapeHTML(u.usesLeft || "-")}</span></div>
      <div><strong>Role</strong><span>${escapeHTML(u.role || "User")}</span></div>
      <div><strong>Status</strong><span><span class="status-dot-v32"></span>${escapeHTML(u.status || "Active")}</span></div>
    </div>
    <div class="mini-toolbar-v32">
      <button class="primary-btn" onclick="showProfileEditor()">Edit Profile</button>
      <button class="secondary-btn" onclick="loadMyPayments()">Payment History</button>
      <button class="secondary-btn" onclick="loadMyUsage()">Usage History</button>
      <button class="success-btn-v32" onclick="showTool('payment')">Upgrade / Renew</button>
    </div>
    <div id="dashboardPanel" class="history-card-v32">Select an option above to manage your account.</div>`;
}

function showProfileEditor(){
  const u=getCurrentUser()||{};
  html("dashboardPanel", `<h3>Edit Profile</h3><div class="profile-form-v32"><input id="profileName" placeholder="Full name" value="${escapeHTML(u.name||"")}"><input id="profileMobile" placeholder="Mobile number" value="${escapeHTML(u.mobile||"")}"><textarea id="profileAddress" rows="3" placeholder="Address">${escapeHTML(u.address||"")}</textarea></div><button class="primary-btn" onclick="saveProfileV32()">Save Profile</button>`);
}

async function saveProfileV32(){
  if(!requireLogin()) return;
  const btn=event?.target; setBusy(btn,"Saving...");
  const r=await SPT.api("updateProfile",{token:SPT.token,name:val("profileName"),mobile:val("profileMobile"),address:val("profileAddress")});
  clearBusy(btn); toast(r.message);
  if(r.success && r.user){SPT.saveLogin(r.user,SPT.token); dashboardTool();}
}

async function loadMyPayments(){
  if(!requireLogin()) return;
  html("dashboardPanel",`<div class="progress-box">Loading payment history...</div>`);
  const r=await SPT.api("paymentHistory",{token:SPT.token});
  if(!r.success) return html("dashboardPanel",`<div class="warning-box">${escapeHTML(r.message)}</div>`);
  const rows=(r.payments||[]).map(p=>`<tr><td>${escapeHTML(p.PlanName)}</td><td>₹${escapeHTML(p.Amount)}</td><td>${escapeHTML(p.TransactionID)}</td><td><span class="payment-history-badge">${escapeHTML(p.Status)}</span></td><td>${escapeHTML(p.CreatedAt)}</td></tr>`).join("");
  html("dashboardPanel",`<h3>Payment History</h3><div class="table-wrap"><table><thead><tr><th>Plan</th><th>Amount</th><th>Transaction</th><th>Status</th><th>Date</th></tr></thead><tbody>${rows||`<tr><td colspan="5">No payment history found.</td></tr>`}</tbody></table></div>`);
}

async function loadMyUsage(){
  if(!requireLogin()) return;
  html("dashboardPanel",`<div class="progress-box">Loading usage history...</div>`);
  const r=await SPT.api("usageHistory",{token:SPT.token});
  if(!r.success) return html("dashboardPanel",`<div class="warning-box">${escapeHTML(r.message)}</div>`);
  const rows=(r.usage||[]).map(x=>`<tr><td>${escapeHTML(x.Tool)}</td><td>${escapeHTML(x.FileName)}</td><td>${escapeHTML(x.OutputSizeKB)}</td><td>${escapeHTML(x.CreatedAt)}</td></tr>`).join("");
  html("dashboardPanel",`<h3>Tool Usage History</h3><div class="table-wrap"><table><thead><tr><th>Tool</th><th>File</th><th>Output</th><th>Date</th></tr></thead><tbody>${rows||`<tr><td colspan="4">No usage history found.</td></tr>`}</tbody></table></div>`);
}

function adminTool() {
  if (typeof requireLogin === "function" && !requireLogin()) return;
  if (typeof isAdmin === "function" && !isAdmin()) { workspace.innerHTML = `<div class="warning-box">Admin access only.</div>`; return; }
  workspace.innerHTML = `
    <h2>📊 Admin Panel Pro</h2>
    <p class="tool-subtitle">Review payments, manage users, approve premium access, and monitor feedback.</p>
    <div class="action-row admin-top-actions">
      <button class="primary-btn" onclick="loadAdminStats()">📈 Stats</button>
      <button class="secondary-btn" onclick="loadPayments()">💳 Payments</button>
      <button class="secondary-btn" onclick="loadUsersV32()">👥 Users</button>
      <button class="secondary-btn" onclick="loadFeedbacks()">💬 Feedback</button>
    </div>
    <div id="adminContent" class="admin-card"><div class="progress-box">Loading admin overview...</div></div>`;
  setTimeout(()=>{ if(typeof loadAdminStats==="function") loadAdminStats(); },100);
}

async function loadUsersV32(){
  if(!requireLogin() || !isAdmin()) return;
  html("adminContent",`<div class="admin-search-v32"><input id="adminUserSearch" placeholder="Search by name, email, mobile, or plan"><button class="primary-btn" onclick="filterUsersV32()">Search</button></div><div id="userTableV32" class="progress-box">Loading users...</div>`);
  const r=await SPT.api("listUsers",{token:SPT.token}); window.__v32Users=r.users||[];
  renderUsersV32(window.__v32Users);
}
function filterUsersV32(){const q=val("adminUserSearch").toLowerCase(); renderUsersV32((window.__v32Users||[]).filter(u=>JSON.stringify(u).toLowerCase().includes(q)));}
function renderUsersV32(users){
  const rows=(users||[]).map(u=>`<tr><td>${escapeHTML(u.name)}</td><td>${escapeHTML(u.email)}</td><td>${escapeHTML(u.mobile||"")}</td><td>${escapeHTML(u.plan||"Free")}</td><td>${escapeHTML(u.status||"Active")}</td><td><button class="admin-mini-btn success-btn-v32" onclick="manualPremiumV32('${escapeHTML(u.email)}')">Premium</button><button class="admin-mini-btn orange-btn-v32" onclick="updateUserStatusV32('${escapeHTML(u.email)}','Active')">Activate</button><button class="admin-mini-btn danger-btn-v32" onclick="updateUserStatusV32('${escapeHTML(u.email)}','Blocked')">Block</button></td></tr>`).join("");
  html("userTableV32",`<div class="table-wrap"><table><thead><tr><th>Name</th><th>Email</th><th>Mobile</th><th>Plan</th><th>Status</th><th>Action</th></tr></thead><tbody>${rows||`<tr><td colspan="6">No users found.</td></tr>`}</tbody></table></div>`);
}
async function manualPremiumV32(email){const days=prompt("Premium duration in days", "30"); if(!days) return; const r=await SPT.api("setPremium",{token:SPT.token,email,planName:"Manual Premium",days:Number(days)}); toast(r.message); loadUsersV32();}
async function updateUserStatusV32(email,status){const r=await SPT.api("updateUserStatus",{token:SPT.token,email,status}); toast(r.message); loadUsersV32();}

function contactTool(){workspace.innerHTML=`<h2>Contact Us</h2><div class="policy-card-v32"><p><b>Smart Photo Toolkit Pro</b></p><p>Email: kaitsatnam@gmail.com</p><p>For payment verification, premium activation, refunds, and technical support, please use the feedback form or contact the support email.</p><button class="primary-btn" onclick="showTool('feedback')">Send Feedback</button></div>`;}
function privacyTool(){workspace.innerHTML=`<h2>Privacy Policy</h2><div class="policy-card-v32"><p>We collect only the information required to create your account, process premium payment verification, and provide support.</p><h3>Information collected</h3><p>Name, email address, mobile number, address, payment transaction ID, tool usage records, and feedback messages.</p><h3>Use of data</h3><p>Your information is used for account access, admin verification, premium activation, support, and security logs.</p><h3>Security</h3><p>Passwords are stored as hashes in the Apps Script backend. Premium activation is automatic after UTR submission. Admin can still review all transactions in the admin panel.</p></div>`;}
function termsTool(){workspace.innerHTML=`<h2>Terms and Conditions</h2><div class="policy-card-v32"><p>By using Smart Photo Toolkit Pro, you agree to use the tools responsibly and provide accurate account and payment information.</p><h3>Premium access</h3><p>Premium plans are activated after admin verification of payment details.</p><h3>Availability</h3><p>Tools are provided on a best-effort basis. Browser and device limitations may affect processing speed.</p></div>`;}
function refundTool(){workspace.innerHTML=`<h2>Refund Policy</h2><div class="policy-card-v32"><p>Refund requests are reviewed manually. If premium access was not activated due to a genuine payment verification issue, contact support with your UTR and payment proof.</p><p>Approved refunds or adjustments will be processed according to manual verification.</p></div>`;}

/* End v32 overrides */


/* =====================================================
   Smart Photo Toolkit Pro v32 View Mode Fix
   Static tool cards removed from index. Cards now appear
   only on Home. Every sidebar/tool click shows only that
   selected feature in the workspace.
===================================================== */

function bindHomeToolCardsV321(){
  document.querySelectorAll("#workspace .card").forEach(card => {
    card.onclick = () => openTool(card.dataset.tool);
  });
}

function home(){
  workspace.innerHTML = `
    <h2>Welcome to Smart Photo Toolkit Pro</h2>
    <p>Choose a tool below to start. When you open any tool, only that selected feature will be displayed.</p>

    <div class="cards home-cards-v321">
      <div class="card" data-tool="compressor"><b>🖼️</b><h3>Image Compressor</h3><p>Compress images to 20KB, 50KB, 100KB, or a custom size.</p></div>
      <div class="card" data-tool="namedate"><b>🏷️</b><h3>Name / Date</h3><p>Add name, date, or custom text below your photo.</p></div>
      <div class="card" data-tool="passport"><b>👤</b><h3>Passport Photo</h3><p>Create a print-ready A4 sheet with 35×45mm photos.</p></div>
      <div class="card" data-tool="aadhaar"><b>🪪</b><h3>Aadhaar Print</h3><p>Crop, arrange, and download Aadhaar print layouts as PDF.</p></div>
      <div class="card" data-tool="pdfresizer"><b>📄</b><h3>PDF Resizer</h3><p>Compress and resize PDFs directly in your browser.</p></div>
    </div>

    <div class="stats">
      <div><strong>📄 PDF Output</strong><span>Passport and Aadhaar PDF downloads.</span></div>
      <div><strong>🖨️ Print Ready</strong><span>Professional A4 print-ready layouts.</span></div>
      <div><strong>🔐 Account System</strong><span>Dashboard, payment history, and premium status.</span></div>
    </div>

    <div class="footer-links-v32">
      <button class="secondary-btn" onclick="showTool('privacy')">Privacy Policy</button>
      <button class="secondary-btn" onclick="showTool('terms')">Terms</button>
      <button class="secondary-btn" onclick="showTool('refund')">Refund Policy</button>
      <button class="secondary-btn" onclick="showTool('contact')">Contact</button>
    </div>`;
  bindHomeToolCardsV321();
}


/* ================= v35 ENTERPRISE OVERRIDES ================= */
function home(){
  workspace.innerHTML = `
    <h2>Welcome to Smart Photo Toolkit Pro 👋</h2>
    <p class="tool-subtitle">A professional workspace for passport photos, Aadhaar print layouts, image compression, PDF resizing, payments, and premium membership.</p>
    <span class="enterprise-chip">✨ v35 Enterprise Ready</span>
    <div class="stats">
      <div><strong>📸 Photo Tools</strong><span>Passport, name/date, compressor.</span></div>
      <div><strong>📄 Document Tools</strong><span>Aadhaar print and PDF resize.</span></div>
      <div><strong>👑 Membership</strong><span>Premium plans with dashboard tracking.</span></div>
    </div>
    <div class="kpi-grid">
      <div class="kpi-card"><span>Recommended Plan</span><strong>₹149</strong><span>Half-year premium value.</span></div>
      <div class="kpi-card"><span>Payment Mode</span><strong>UPI QR</strong><span>Generate QR after plan selection.</span></div>
      <div class="kpi-card"><span>Admin Workflow</span><strong>CRM</strong><span>Users, payments, feedback.</span></div>
    </div>
  `;
}

let deferredInstallPrompt=null;
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredInstallPrompt=e;});
function showInstallPrompt(){
  if(!deferredInstallPrompt){ if(typeof toast==='function') toast('Install option will appear when supported by your browser.'); return; }
  deferredInstallPrompt.prompt();
  deferredInstallPrompt=null;
}

function workspaceTool(){
  if (typeof requireLogin === 'function' && !requireLogin()) return;
  workspace.innerHTML=`
    <h2>🗂️ My Workspace</h2>
    <p class="tool-subtitle">Your future workspace for generated photos, PDFs, payment history, activity logs, and account settings.</p>
    <div class="kpi-grid">
      <div class="kpi-card"><span>Photos Created</span><strong>0</strong><span>Coming with cloud history.</span></div>
      <div class="kpi-card"><span>PDFs Created</span><strong>0</strong><span>Download history ready.</span></div>
      <div class="kpi-card"><span>Payments</span><strong>Live</strong><span>Connected with Apps Script.</span></div>
    </div>
    <div class="timeline">
      <div class="timeline-item"><b>v35 Workspace Foundation</b><span>Structure added for future file history and activity tracking.</span></div>
      <div class="timeline-item"><b>Next</b><span>Cloud storage and receipt PDF can be added in v36.</span></div>
    </div>
  `;
}

const _v35OpenTool=openTool;
openTool=function(tool){
  if(tool==='workspace') return workspaceTool();
  return _v35OpenTool(tool);
};

setTimeout(()=>{
  try{
    const sidebar=document.getElementById('sidebar');
    if(sidebar && !document.querySelector('[data-tool="workspace"]')){
      const btn=document.createElement('button');
      btn.className='nav-item';btn.dataset.tool='workspace';btn.dataset.auth='user';btn.textContent='🗂️ My Workspace';btn.onclick=()=>openTool('workspace');
      const logout=document.querySelector('[data-tool="logout"]');
      sidebar.insertBefore(btn, logout || null);
      if(typeof updateAuthUI==='function') updateAuthUI();
    }
  }catch(e){}
},300);


/* =====================================================
   v35.1 Enterprise UI & UX Final Overrides
===================================================== */
function initialsV351(name,email){const src=(name||email||"User").trim();return src.split(/\s+/).slice(0,2).map(x=>x[0]).join("").toUpperCase()||"U";}
function toggleNotifyPanelV351(){let p=document.getElementById('notifyPanelV351'); if(!p){p=document.createElement('div');p.id='notifyPanelV351';p.className='notify-panel';p.innerHTML=`<h3>Notifications</h3><div class="notify-item"><b>Welcome to v35.1</b><span>UI & UX polish, PWA readiness, and improved account interface are active.</span></div><div class="notify-item"><b>Payment workflow</b><span>Use the Payment section to generate QR and submit UTR.</span></div><div class="notify-item"><b>Premium tools</b><span>Login to view dashboard, payments, premium status, and workspace.</span></div>`;document.body.appendChild(p);} p.classList.toggle('show');}
function addTopbarV351(title){return `<div class="pro-topbar"><div><div class="pro-crumb">Smart Photo Toolkit Pro / ${title}</div></div><button class="notify-btn" onclick="toggleNotifyPanelV351()">🔔 Notifications <span class="notify-dot"></span></button></div>`;}

const _v351Home = home;
home = function(){
  workspace.innerHTML = `
    ${addTopbarV351('Home')}
    <h2>Welcome to Smart Photo Toolkit Pro 👋</h2>
    <p class="tool-subtitle">A polished enterprise workspace for passport photos, Aadhaar print layouts, image compression, PDF resizing, payments, premium membership, and future AI tools.</p>
    <span class="enterprise-chip">✨ v35.1 UI & UX Final</span>
    <div class="stats">
      <div><strong>📸 Photo Tools</strong><span>Passport, name/date, and image compression.</span></div>
      <div><strong>📄 Document Tools</strong><span>Aadhaar print layout and PDF resizing.</span></div>
      <div><strong>👑 Premium Workspace</strong><span>Payments, dashboard, membership, and history.</span></div>
    </div>
    <div class="kpi-grid">
      <div class="kpi-card"><span>Recommended Plan</span><strong>₹149</strong><span>Half-year premium value.</span></div>
      <div class="kpi-card"><span>Payment Mode</span><strong>Dynamic QR</strong><span>Generate QR after plan selection.</span></div>
      <div class="kpi-card"><span>PWA Status</span><strong>Ready</strong><span>Installable app foundation included.</span></div>
    </div>
    <div class="install-card-v351"><p>Install Smart Photo Toolkit Pro for a faster app-like experience.</p><button class="primary-btn" onclick="showInstallPrompt()">Install App</button></div>
  `;
};

loginTool = function(){
  workspace.innerHTML = `
    ${addTopbarV351('Secure Access')}
    <section class="auth-pro-shell v351 fade-in">
      <div class="auth-hero-panel">
        <div class="auth-brand-row"><div class="auth-brand-icon">📸</div><div><h2>Smart Photo Toolkit Pro</h2><p>Enterprise access for premium photo and document tools.</p></div></div>
        <div class="auth-hero-content">
          <span class="auth-pill">v35.1 Enterprise UI</span>
          <h1>Secure workspace for every document task.</h1>
          <p>Login to manage premium membership, payments, downloads, and your future AI-powered workspace.</p>
          <div class="auth-benefits"><div>✅ Professional dashboard</div><div>✅ Dynamic payment QR</div><div>✅ Secure password recovery</div><div>✅ PWA-ready experience</div></div>
        </div>
      </div>
      <div class="auth-form-panel">
        <div class="auth-tabs"><button class="auth-tab active" id="loginTabBtn" onclick="switchAuthMode('login')">Login</button><button class="auth-tab" id="signupTabBtn" onclick="switchAuthMode('signup')">Create Account</button></div>
        <div id="authLoginBox" class="auth-mode-box">
          <h2>Welcome back</h2><p class="auth-muted">Enter your registered email and password to continue.</p>
          <div class="form-group pro-field"><label>Email Address</label><input id="loginEmail" type="email" placeholder="you@example.com" autocomplete="email"></div>
          <div class="form-group pro-field"><label>Password</label><input id="loginPassword" type="password" placeholder="Enter password" autocomplete="current-password"><button class="field-icon" onclick="togglePasswordV351('loginPassword')" type="button">Show</button></div>
          <div class="remember-row"><label><input id="rememberMeV351" type="checkbox" checked> Remember me</label><button class="auth-text-btn" onclick="toggleForgotBox()">Forgot Password?</button></div>
          <button id="loginActionBtnV351" class="auth-main-btn" onclick="loginSubmitV351()">Login Securely</button>
          <div class="auth-footer-line"><span>New here?</span><button class="auth-text-btn" onclick="switchAuthMode('signup')">Create your account</button></div>
        </div>
        <div id="authSignupBox" class="auth-mode-box hidden">
          <h2>Create professional account</h2><p class="auth-muted">Complete your profile to activate dashboard and premium features.</p>
          <div class="form-group pro-field"><label>Full Name</label><input id="signupName" placeholder="Enter full name" autocomplete="name"></div>
          <div class="auth-two-col"><div class="form-group pro-field"><label>Email Address</label><input id="signupEmail" type="email" placeholder="you@example.com"></div><div class="form-group pro-field"><label>Mobile Number</label><input id="signupMobile" placeholder="Enter mobile number"></div></div>
          <div class="form-group pro-field"><label>Password</label><input id="signupPassword" type="password" placeholder="Create strong password" oninput="updatePasswordStrengthV351(this.value)"><button class="field-icon" onclick="togglePasswordV351('signupPassword')" type="button">Show</button></div><div id="strengthV351" class="password-strength"><span></span></div>
          <div class="form-group pro-field"><label>Address</label><textarea id="signupAddress" rows="3" placeholder="Enter full address"></textarea></div>
          <button id="signupActionBtnV351" class="auth-main-btn" onclick="signupSubmitV351()">Create Account</button>
          <div class="auth-footer-line"><span>Already registered?</span><button class="auth-text-btn" onclick="switchAuthMode('login')">Login here</button></div>
        </div>
        <div id="forgotBox" class="auth-recovery-box hidden"><div class="auth-recovery-head"><h3>Password Recovery</h3><button class="auth-close-btn" onclick="toggleForgotBox()">×</button></div><p class="auth-muted">Send an OTP to your registered email, then create a new password.</p><div class="forgot-grid"><input id="forgotEmail" type="email" placeholder="Registered email address"><button class="secondary-btn" onclick="forgotSubmit()">Send OTP</button></div><div class="forgot-grid forgot-grid-3"><input id="resetEmail" type="email" placeholder="Email address"><input id="resetOtp" placeholder="OTP"><input id="resetPassword" type="password" placeholder="New password"></div><button class="auth-main-btn full-btn" onclick="resetSubmit()">Reset Password</button></div>
      </div>
    </section>`;
};
function togglePasswordV351(id){const el=document.getElementById(id); if(!el)return; el.type = el.type==='password'?'text':'password';}
function updatePasswordStrengthV351(v){const box=document.getElementById('strengthV351'); if(!box)return; box.classList.remove('ok','strong'); const span=box.querySelector('span'); if(!span)return; if(!v){span.style.width='0';return;} if(v.length>=8 && /[0-9]/.test(v) && /[A-Z]/.test(v)){box.classList.add('strong');span.style.width='100%';} else if(v.length>=5){box.classList.add('ok');span.style.width='55%';} else {span.style.width='25%';}}
async function loginSubmitV351(){const b=document.getElementById('loginActionBtnV351'); if(b){b.classList.add('loading');b.textContent='Signing in';} try{await loginSubmit();}finally{if(b){b.classList.remove('loading');b.textContent='Login Securely';}}}
async function signupSubmitV351(){const b=document.getElementById('signupActionBtnV351'); if(b){b.classList.add('loading');b.textContent='Creating account';} try{await signupSubmit();}finally{if(b){b.classList.remove('loading');b.textContent='Create Account';}}}

const _v351Dashboard = dashboardTool;
dashboardTool = function(){
  const u = getCurrentUser();
  if(!u){workspace.innerHTML=`${addTopbarV351('Dashboard')}<h2>My Dashboard</h2><div class="warning-box">Please login to view your account dashboard.</div><button class="primary-btn" onclick="showTool('login')">Login Now</button>`;return;}
  workspace.innerHTML = `
    ${addTopbarV351('Dashboard')}
    <div class="dashboard-profile-v351"><div class="profile-avatar-v351">${initialsV351(u.name,u.email)}</div><div class="profile-title-v351"><h2>${u.name||'User Dashboard'}</h2><p>${u.email||'-'} · ${u.mobile||'Mobile not added'}</p><p>${u.address||'Address not added'}</p></div><span class="profile-badge-v351">${u.premium?'Premium Member':'Free Account'}</span></div>
    <div class="stats"><div><strong>Current Plan</strong><span>${u.premium ? (u.premiumPlan || 'Premium') : 'Free'}</span></div><div><strong>Premium Ends</strong><span>${u.premiumEnd || '-'}</span></div><div><strong>Uses Left</strong><span>${u.usesLeft || '-'}</span></div><div><strong>Role</strong><span>${u.role || 'User'}</span></div><div><strong>Status</strong><span>${u.status || 'Active'}</span></div><div><strong>Workspace</strong><span>v35.1 Ready</span></div></div>
    <div class="quick-actions-v351"><button class="primary-btn" onclick="showTool('payment')">Make Payment</button><button class="secondary-btn" onclick="showTool('premium')">View Plans</button><button class="secondary-btn" onclick="showTool('workspace')">My Workspace</button><button class="print-btn" onclick="SPT.logout()">Logout</button></div>`;
};

setTimeout(()=>{try{if(typeof updateAuthUI==='function') updateAuthUI();}catch(e){}},600);

/* =====================================================
   Smart Photo Toolkit Pro v37.4
   Document Studio Real Fix
   Front/Back Image Upload + Full Page PDF Drag Crop
===================================================== */

const DS_V374 = {
  selectedType: 'aadhaar',
  mode: 'images',
  frontSrc: '',
  backSrc: '',
  croppedSrc: '',
  pdfCanvas: null,
  pdfDoc: null,
  pageNum: 1,
  lastPdf: null,
  crop: {x:40,y:40,w:300,h:190,active:false,mode:'move',sx:0,sy:0,start:null},
  types: {
    aadhaar: {icon:'🪪', name:'Aadhaar Card', size:[85.6,54], note:'Use front/back images or full-page downloaded Aadhaar PDF.'},
    voter: {icon:'🗳️', name:'Voter ID Card', size:[85.6,54], note:'Upload Voter card front/back image or a full-page PDF and crop the printable area.'},
    pan: {icon:'💳', name:'PAN Card', size:[85.6,54], note:'Upload PAN card image or full-page PDF and select the card area.'},
    ayushman: {icon:'❤️', name:'Ayushman Card', size:[85.6,54], note:'Upload Ayushman card front/back or downloaded PDF and crop the printable card area.'},
    dl: {icon:'🚘', name:'Driving Licence', size:[85.6,54], note:'Upload DL front/back image or PDF and create A4 print-ready output.'},
    abha: {icon:'🩺', name:'ABHA Card', size:[85.6,54], note:'Upload ABHA card image or full-page PDF and crop for print.'}
  }
};

function documentStudioTool(){
  if(!workspace) return;
  workspace.innerHTML = `
    <h2>🪪 Document Studio</h2>
    <p class="tool-subtitle">Print Aadhaar, Voter ID, PAN, Ayushman, Driving Licence and ABHA cards from front/back images or a full-page downloaded PDF.</p>
    <div class="ds-hero">
      <strong>v37.4 Document Studio</strong>
      <span>Choose a document, upload front/back images or upload a full-page PDF, drag-select the printable card area, then generate a top-centered A4 PDF.</span>
    </div>
    <div class="ds-card-types" id="dsTypeWrap"></div>
    <div class="ds-tabs">
      <button class="ds-tab active" id="dsImagesTab" onclick="dsSwitchModeV374('images')">Front / Back Images</button>
      <button class="ds-tab" id="dsPdfTab" onclick="dsSwitchModeV374('pdf')">Full Page PDF Crop</button>
    </div>
    <div id="dsPanel"></div>
    <div id="dsOutput"></div>
  `;
  dsRenderTypesV374();
  dsSwitchModeV374('images');
}

function dsRenderTypesV374(){
  const wrap = document.getElementById('dsTypeWrap');
  if(!wrap) return;
  wrap.innerHTML = Object.entries(DS_V374.types).map(([key,t])=>`
    <button class="ds-type ${DS_V374.selectedType===key?'active':''}" onclick="dsSelectTypeV374('${key}')">
      ${t.icon} ${t.name}<span>${t.size[0]} × ${t.size[1]} mm print card</span>
    </button>
  `).join('');
}
function dsSelectTypeV374(type){
  DS_V374.selectedType = type;
  dsRenderTypesV374();
  dsSwitchModeV374(DS_V374.mode || 'images');
}
function dsSwitchModeV374(mode){
  DS_V374.mode = mode;
  document.getElementById('dsImagesTab')?.classList.toggle('active', mode==='images');
  document.getElementById('dsPdfTab')?.classList.toggle('active', mode==='pdf');
  const panel = document.getElementById('dsPanel');
  const out = document.getElementById('dsOutput');
  if(out) out.innerHTML='';
  if(!panel) return;
  if(mode==='images') panel.innerHTML = dsImagesPanelV374();
  else panel.innerHTML = dsPdfPanelV374();
}
function dsCurrentV374(){return DS_V374.types[DS_V374.selectedType] || DS_V374.types.aadhaar;}
function dsOptionsV374(){
  return `<div class="ds-control-grid">
    <label>Copies<select id="dsCopies"><option value="1">1 Copy</option><option value="2">2 Copies</option><option value="4">4 Copies</option><option value="6">6 Copies</option></select></label>
    <label>Output Layout<select id="dsLayout"><option value="single">Single card top center</option><option value="frontback">Front + Back top center</option></select></label>
    <label>Border<select id="dsBorder"><option value="yes">Black border</option><option value="no">No border</option></select></label>
  </div>`;
}
function dsImagesPanelV374(){
  const t=dsCurrentV374();
  return `<div class="ds-panel fade-in">
    <h3>${t.icon} ${t.name} — Front / Back Image Upload</h3>
    <p class="tool-subtitle">Upload front and back images, then generate an A4 PDF with cards aligned at the top center.</p>
    ${dsOptionsV374()}
    <div class="ds-grid mt-15">
      <label class="ds-upload">Upload Front Image<input id="dsFrontImg" type="file" accept="image/*" onchange="dsLoadImgV374('front',this)"></label>
      <label class="ds-upload">Upload Back Image<input id="dsBackImg" type="file" accept="image/*" onchange="dsLoadImgV374('back',this)"></label>
    </div>
    <div class="ds-preview-row" id="dsImgPreview"></div>
    <div class="ds-note">Tip: Use this mode when you already have separate front and back card images. For full-page documents downloaded from a website, use the Full Page PDF Crop tab.</div>
    <div class="action-row"><button class="primary-btn" onclick="dsGenerateFromImagesV374()">Generate A4 Print PDF</button></div>
  </div>`;
}
async function dsLoadImgV374(side,input){
  const f=input.files && input.files[0]; if(!f) return;
  const data=await readFile(f);
  if(side==='front') DS_V374.frontSrc=data; else DS_V374.backSrc=data;
  const p=document.getElementById('dsImgPreview');
  if(p){
    p.innerHTML = `${DS_V374.frontSrc?`<div class="ds-preview-card"><b>Front</b><br><img src="${DS_V374.frontSrc}"></div>`:''}${DS_V374.backSrc?`<div class="ds-preview-card"><b>Back</b><br><img src="${DS_V374.backSrc}"></div>`:''}`;
  }
}
async function dsGenerateFromImagesV374(){
  if(!DS_V374.frontSrc && !DS_V374.backSrc) return alert('Please upload front or back image first.');
  const imgs=[]; if(DS_V374.frontSrc) imgs.push(DS_V374.frontSrc); if(DS_V374.backSrc) imgs.push(DS_V374.backSrc);
  const copies=Number(document.getElementById('dsCopies')?.value||1);
  const border=(document.getElementById('dsBorder')?.value||'yes')==='yes';
  DS_V374.lastPdf = await dsCreateA4PdfV374(imgs,copies,border,true);
  dsShowOutputV374(imgs,copies,true);
}
function dsPdfPanelV374(){
  const t=dsCurrentV374();
  return `<div class="ds-panel fade-in">
    <h3>${t.icon} ${t.name} — Full Page PDF Crop</h3>
    <p class="tool-subtitle">Upload the full-page PDF downloaded from a website. Drag and resize the orange printable area, then generate A4 print output.</p>
    ${dsOptionsV374()}
    <div class="ds-control-grid mt-15">
      <label class="ds-upload">Upload Full Page PDF<input id="dsFullPdf" type="file" accept="application/pdf" onchange="dsLoadPdfV374(this)"></label>
      <label>PDF Page<select id="dsPageSelect" onchange="dsRenderPdfPageV374(Number(this.value))"><option value="1">Page 1</option></select></label>
      <label>Crop Ratio<select id="dsRatioLock"><option value="card">Lock card ratio</option><option value="free">Free selection</option></select></label>
    </div>
    <div id="dsPdfWork"></div>
  </div>`;
}
async function dsLoadPdfV374(input){
  const f=input.files && input.files[0]; if(!f) return;
  if(!window.pdfjsLib) return alert('PDF library not loaded. Please refresh with internet enabled.');
  const work=document.getElementById('dsPdfWork');
  if(work) work.innerHTML='<div class="progress-box">Loading PDF...</div>';
  const buf=await f.arrayBuffer();
  DS_V374.pdfDoc = await pdfjsLib.getDocument({data:buf}).promise;
  const sel=document.getElementById('dsPageSelect');
  if(sel){
    sel.innerHTML='';
    for(let i=1;i<=DS_V374.pdfDoc.numPages;i++){sel.innerHTML += `<option value="${i}">Page ${i}</option>`;}
  }
  await dsRenderPdfPageV374(1);
}
async function dsRenderPdfPageV374(pageNum){
  if(!DS_V374.pdfDoc) return;
  DS_V374.pageNum=pageNum||1;
  const work=document.getElementById('dsPdfWork');
  if(work) work.innerHTML='<div class="progress-box">Rendering page...</div>';
  const page=await DS_V374.pdfDoc.getPage(DS_V374.pageNum);
  const viewport=page.getViewport({scale:2.5});
  const source=document.createElement('canvas');
  const sctx=source.getContext('2d');
  source.width=viewport.width; source.height=viewport.height;
  await page.render({canvasContext:sctx, viewport}).promise;
  DS_V374.pdfCanvas=source;
  if(work){
    work.innerHTML=`<div class="ds-pdf-workspace">
      <div class="ds-canvas-shell"><div class="ds-canvas-wrap" id="dsCanvasWrap"><canvas id="dsPdfCanvas"></canvas><div class="ds-cropbox" id="dsCropBox"><span class="ds-handle nw" data-h="nw"></span><span class="ds-handle ne" data-h="ne"></span><span class="ds-handle sw" data-h="sw"></span><span class="ds-handle se" data-h="se"></span></div></div></div>
      <div class="ds-sidebox"><h3>Printable Area</h3><p>Move the orange box on the card area. Resize it from corners. The selected area will be printed at the top center of an A4 page.</p><label>Copies<select id="dsCopiesSide"><option value="1">1 Copy</option><option value="2">2 Copies</option><option value="4">4 Copies</option><option value="6">6 Copies</option></select></label><label>Border<select id="dsBorderSide"><option value="yes">Black border</option><option value="no">No border</option></select></label><div class="ds-actions"><button class="secondary-btn" onclick="dsResetCropV374()">Reset Selection</button><button class="primary-btn" onclick="dsGenerateFromPdfCropV374()">Crop & Generate A4 PDF</button></div><div class="ds-note">Works for Aadhaar, Voter ID, PAN, Ayushman, Driving Licence and ABHA full-page PDFs.</div></div>
    </div>`;
  }
  const c=document.getElementById('dsPdfCanvas');
  const ctx=c.getContext('2d');
  const maxW=Math.min(900, Math.max(320, (workspace?.clientWidth||900)-360));
  const ratio=source.width/source.height;
  c.width=maxW; c.height=Math.round(maxW/ratio);
  ctx.drawImage(source,0,0,c.width,c.height);
  dsResetCropV374();
  dsInitCropEventsV374();
}
function dsResetCropV374(){
  const c=document.getElementById('dsPdfCanvas'); if(!c) return;
  const cardRatio = dsCurrentV374().size[0]/dsCurrentV374().size[1];
  let w=Math.round(c.width*0.70), h=Math.round(w/cardRatio);
  if(h>c.height*0.45){h=Math.round(c.height*0.30);w=Math.round(h*cardRatio);}
  DS_V374.crop.x=Math.round((c.width-w)/2); DS_V374.crop.y=Math.round(c.height*0.65); DS_V374.crop.w=w; DS_V374.crop.h=h;
  dsApplyCropV374();
}
function dsApplyCropV374(){
  const box=document.getElementById('dsCropBox'); if(!box) return;
  const cr=DS_V374.crop; box.style.left=cr.x+'px'; box.style.top=cr.y+'px'; box.style.width=cr.w+'px'; box.style.height=cr.h+'px';
}
function dsPointV374(e){const t=e.touches&&e.touches[0]; return {x:(t||e).clientX,y:(t||e).clientY};}
function dsInitCropEventsV374(){
  const box=document.getElementById('dsCropBox'); const canvas=document.getElementById('dsPdfCanvas'); if(!box||!canvas) return;
  const start=(e,mode)=>{e.preventDefault(); e.stopPropagation(); const p=dsPointV374(e); DS_V374.crop.active=true; DS_V374.crop.mode=mode; DS_V374.crop.sx=p.x; DS_V374.crop.sy=p.y; DS_V374.crop.start={x:DS_V374.crop.x,y:DS_V374.crop.y,w:DS_V374.crop.w,h:DS_V374.crop.h};};
  box.onmousedown=e=>start(e,'move'); box.ontouchstart=e=>start(e,'move');
  box.querySelectorAll('.ds-handle').forEach(h=>{h.onmousedown=e=>start(e,h.dataset.h); h.ontouchstart=e=>start(e,h.dataset.h);});
  const move=e=>{
    if(!DS_V374.crop.active) return; e.preventDefault();
    const p=dsPointV374(e), dx=p.x-DS_V374.crop.sx, dy=p.y-DS_V374.crop.sy;
    const st=DS_V374.crop.start; let {x,y,w,h}=st;
    const lock=(document.getElementById('dsRatioLock')?.value||'card')==='card'; const ratio=dsCurrentV374().size[0]/dsCurrentV374().size[1];
    if(DS_V374.crop.mode==='move'){x=st.x+dx; y=st.y+dy;}
    else{
      if(DS_V374.crop.mode.includes('e')) w=st.w+dx;
      if(DS_V374.crop.mode.includes('s')) h=st.h+dy;
      if(DS_V374.crop.mode.includes('w')){w=st.w-dx; x=st.x+dx;}
      if(DS_V374.crop.mode.includes('n')){h=st.h-dy; y=st.y+dy;}
      if(lock){
        if(Math.abs(dx)>Math.abs(dy)) h=w/ratio; else w=h*ratio;
        if(DS_V374.crop.mode.includes('w')) x=st.x+st.w-w;
        if(DS_V374.crop.mode.includes('n')) y=st.y+st.h-h;
      }
    }
    w=Math.max(60,Math.min(w,canvas.width)); h=Math.max(38,Math.min(h,canvas.height));
    x=Math.max(0,Math.min(x,canvas.width-w)); y=Math.max(0,Math.min(y,canvas.height-h));
    Object.assign(DS_V374.crop,{x,y,w,h}); dsApplyCropV374();
  };
  const stop=()=>{DS_V374.crop.active=false;};
  document.addEventListener('mousemove',move,{passive:false}); document.addEventListener('mouseup',stop);
  document.addEventListener('touchmove',move,{passive:false}); document.addEventListener('touchend',stop);
}
function dsCropPdfAreaV374(){
  const preview=document.getElementById('dsPdfCanvas'), box=document.getElementById('dsCropBox'); if(!preview||!box||!DS_V374.pdfCanvas) return '';
  const canvasRect=preview.getBoundingClientRect(); const boxRect=box.getBoundingClientRect();
  let relX=(boxRect.left-canvasRect.left)/canvasRect.width, relY=(boxRect.top-canvasRect.top)/canvasRect.height, relW=boxRect.width/canvasRect.width, relH=boxRect.height/canvasRect.height;
  relX=Math.max(0,Math.min(relX,1)); relY=Math.max(0,Math.min(relY,1)); relW=Math.max(.01,Math.min(relW,1-relX)); relH=Math.max(.01,Math.min(relH,1-relY));
  const src=DS_V374.pdfCanvas; const sx=src.width*relX, sy=src.height*relY, sw=src.width*relW, sh=src.height*relH;
  const out=document.createElement('canvas'); const ctx=out.getContext('2d'); out.width=1200; out.height=Math.round(1200*sh/sw); ctx.fillStyle='#fff'; ctx.fillRect(0,0,out.width,out.height); ctx.drawImage(src,sx,sy,sw,sh,0,0,out.width,out.height);
  return out.toDataURL('image/jpeg',.96);
}
async function dsGenerateFromPdfCropV374(){
  const cropped=dsCropPdfAreaV374(); if(!cropped) return alert('Please upload a full-page PDF and select the printable area.');
  DS_V374.croppedSrc=cropped;
  const copies=Number(document.getElementById('dsCopiesSide')?.value || document.getElementById('dsCopies')?.value || 1);
  const border=((document.getElementById('dsBorderSide')?.value || document.getElementById('dsBorder')?.value || 'yes')==='yes');
  DS_V374.lastPdf=await dsCreateA4PdfV374([cropped],copies,border,false);
  dsShowOutputV374([cropped],copies,false);
}
async function dsCreateA4PdfV374(srcs,copies,border,isCards){
  const {jsPDF}=window.jspdf; const pdf=new jsPDF({orientation:'portrait',unit:'mm',format:'a4'});
  const size=dsCurrentV374().size; const cardW=size[0], cardH=size[1], gap=8; let y=10;
  for(let copy=0;copy<copies;copy++){
    const dims=[];
    for(const src of srcs){
      if(isCards) dims.push({src,w:cardW,h:cardH});
      else { const img=await loadImage(src); const h=cardH, w=Math.min(180,h*img.width/img.height); dims.push({src,w,h}); }
    }
    const totalW=dims.reduce((a,d)=>a+d.w,0)+(dims.length-1)*gap; let x=(210-totalW)/2;
    for(const d of dims){ pdf.addImage(d.src,'JPEG',x,y,d.w,d.h); if(border){pdf.setDrawColor(0);pdf.setLineWidth(.25);pdf.rect(x,y,d.w,d.h);} x+=d.w+gap; }
    y += cardH + 8; if(y>250 && copy<copies-1){pdf.addPage(); y=10;}
  }
  return pdf;
}
function dsShowOutputV374(srcs,copies,isCards){
  const out=document.getElementById('dsOutput'); if(!out) return;
  const imgs=[]; for(let i=0;i<copies;i++){ for(const src of srcs){ imgs.push(`<img class="${isCards?'ds-output-card':'ds-output-single'}" src="${src}">`);} }
  out.innerHTML=`<div class="result-card fade-in"><h3>✅ A4 Print PDF Ready</h3><div class="ds-success">Your selected printable area has been converted into a top-centered A4 print-ready PDF.</div><div class="action-row"><button class="open-btn" onclick="dsOpenPdfV374()">📂 Open PDF</button><button class="pdf-btn" onclick="dsDownloadPdfV374()">📄 Download PDF</button><button class="print-btn" onclick="dsPrintPdfV374()">🖨️ Print PDF</button></div><div class="ds-a4-preview"><div class="ds-a4-top">${imgs.join('')}</div></div></div>`;
}
function dsPdfUrlV374(){ if(!DS_V374.lastPdf) return ''; return URL.createObjectURL(DS_V374.lastPdf.output('blob')); }
function dsOpenPdfV374(){ if(!DS_V374.lastPdf) return alert('Generate PDF first.'); window.open(dsPdfUrlV374(),'_blank'); }
function dsDownloadPdfV374(){ if(!DS_V374.lastPdf) return alert('Generate PDF first.'); const a=document.createElement('a'); a.href=dsPdfUrlV374(); a.download=(DS_V374.selectedType||'document')+'-a4-print.pdf'; document.body.appendChild(a); a.click(); a.remove(); }
function dsPrintPdfV374(){ if(!DS_V374.lastPdf) return alert('Generate PDF first.'); DS_V374.lastPdf.autoPrint(); window.open(dsPdfUrlV374(),'_blank'); }

/* Override routing and sidebar for v37.4 */
const _openToolV374 = typeof openTool === 'function' ? openTool : null;
openTool = function(tool){
  if(tool==='documentstudio' || tool==='aadhaar' || tool==='voter' || tool==='pan' || tool==='ayushman' || tool==='dl' || tool==='abha') return documentStudioTool();
  if(_openToolV374) return _openToolV374(tool);
};
setTimeout(()=>{
  try{
    document.querySelectorAll('[data-tool="aadhaar"]').forEach(b=>{b.dataset.tool='documentstudio'; b.textContent='🪪 Document Studio'; b.onclick=()=>openTool('documentstudio');});
    if(!document.querySelector('[data-tool="documentstudio"]')){
      const side=document.getElementById('sidebar'); const pdf=document.querySelector('[data-tool="pdfresizer"]');
      const btn=document.createElement('button'); btn.className='nav-item'; btn.dataset.tool='documentstudio'; btn.textContent='🪪 Document Studio'; btn.onclick=()=>openTool('documentstudio');
      side.insertBefore(btn,pdf||null);
    }
  }catch(e){}
},500);


/* =====================================================
   Smart Photo Toolkit Pro v37.5
   Document Studio UI upgrade + dynamic user menu
===================================================== */
(function(){
  window.SPT_V375_VERSION = '37.5';

  function safeUser(){
    try{return (window.SPT && SPT.user) || JSON.parse(localStorage.getItem('spt_user')||'null') || null;}catch(e){return null;}
  }
  function initials(name){return String(name||'U').trim().split(/\s+/).slice(0,2).map(x=>x[0]||'').join('').toUpperCase() || 'U';}
  window.updateTopUserMenuV375 = function(){
    const actions=document.querySelector('.header-actions'); if(!actions) return;
    let root=document.getElementById('sptUserMenu');
    const u=safeUser(); const isLogged=!!(u && (u.name||u.email));
    const displayName=isLogged?(u.name||u.email||'User'):'Login / Signup';
    const email=isLogged?(u.email||''):'Access your account';
    const role=String(u?.role||'user').toLowerCase();
    const admin=role==='admin';
    const menuHtml=isLogged?`
      <div class="spt-user-head"><b>${displayName}${admin?' (Admin)':''}</b><span>${email}</span></div>
      <button onclick="showTool('dashboard')">👤 My Profile</button>
      <button onclick="showTool('dashboard')">✏️ Edit Profile</button>
      <button onclick="showTool('premium')">👑 Membership</button>
      <button onclick="showTool('payment')">💳 Payments</button>
      <button onclick="toast('Workspace is coming in the next release')">📁 My Workspace</button>
      <button onclick="toast('Settings are coming in the next release')">⚙️ Settings</button>
      ${admin?`<button onclick="showTool('admin')">📊 Admin Panel</button><button onclick="loadPayments && loadPayments()">💰 Payment Verification</button>`:''}
      <button onclick="SPT.logout()">🚪 Logout</button>`:`
      <div class="spt-user-head"><b>Welcome</b><span>Please sign in to access dashboard and premium features.</span></div>
      <button onclick="showTool('login')">🔐 Login / Create Account</button>`;
    if(!root){
      root=document.createElement('div'); root.id='sptUserMenu'; root.className='spt-user-menu';
      actions.appendChild(root);
      document.addEventListener('click',e=>{ if(!root.contains(e.target)) root.classList.remove('open'); });
    }
    root.innerHTML=`<button class="spt-user-btn" type="button"><span class="spt-avatar">${initials(displayName)}</span><span class="spt-user-name">${displayName}</span><span>▾</span></button><div class="spt-user-dropdown">${menuHtml}</div>`;
    root.querySelector('.spt-user-btn').onclick=(e)=>{e.stopPropagation(); root.classList.toggle('open');};
  };
  const oldSave=window.SPT && SPT.saveLogin;
  if(window.SPT && oldSave){SPT.saveLogin=function(user,token){oldSave.call(SPT,user,token); setTimeout(updateTopUserMenuV375,80);};}
  const oldLogout=window.SPT && SPT.logout;
  if(window.SPT && oldLogout){SPT.logout=function(){oldLogout.call(SPT); setTimeout(updateTopUserMenuV375,80);};}
  setTimeout(updateTopUserMenuV375,300);

  const DOC_ICON_MAP_V375={aadhaar:'🪪',voter:'🗳️',pan:'💳',ayushman:'❤️',dl:'🚘',abha:'🩺'};
  const DOC_NOTES_V375={
    aadhaar:'Upload Aadhaar front/back images or a full-page UIDAI PDF and select the printable card area.',
    voter:'Upload Voter ID front/back images or a full-page downloaded PDF and crop the card area.',
    pan:'Upload PAN card image/PDF, then drag-select the printable PAN card area.',
    ayushman:'Upload Ayushman Bharat card image/PDF and create A4 top-center print.',
    dl:'Upload Driving Licence front/back or full-page PDF and crop the licence area.',
    abha:'Upload ABHA card image/PDF and print it clearly on A4.'
  };
  if(window.DS_V374 && DS_V374.types){
    Object.keys(DS_V374.types).forEach(k=>{DS_V374.types[k].icon=DOC_ICON_MAP_V375[k]||DS_V374.types[k].icon; DS_V374.types[k].note=DOC_NOTES_V375[k]||DS_V374.types[k].note;});
  }

  window.documentStudioTool = function(){
    if(!workspace) return;
    workspace.innerHTML = `
      <h2>🪪 Document Studio</h2>
      <p class="tool-subtitle">Print Aadhaar, Voter ID, PAN, Ayushman, Driving Licence and ABHA from front/back images or a full-page downloaded PDF.</p>
      <div class="ds-hero">
        <strong>v37.5 Document Studio</strong>
        <span>Choose a document, upload images or a full-page PDF, then use the improved green selection tool to select the printable area for A4 top-center print.</span>
      </div>
      <div class="ds-card-types" id="dsTypeWrap"></div>
      <div class="ds-tabs">
        <button class="ds-tab active" id="dsImagesTab" onclick="dsSwitchModeV374('images')">Front / Back Images</button>
        <button class="ds-tab" id="dsPdfTab" onclick="dsSwitchModeV374('pdf')">Full Page PDF Crop</button>
      </div>
      <div id="dsPanel"></div>
      <div id="dsOutput"></div>`;
    dsRenderTypesV374(); dsSwitchModeV374('images');
  };

  window.dsRenderTypesV374 = function(){
    const wrap=document.getElementById('dsTypeWrap'); if(!wrap||!window.DS_V374) return;
    wrap.innerHTML=Object.entries(DS_V374.types).map(([key,t])=>`
      <button class="ds-type ${DS_V374.selectedType===key?'active':''}" onclick="dsSelectTypeV374('${key}')">
        <b>${t.icon} ${t.name}</b><span>${t.note||''}</span>
      </button>`).join('');
  };

  window.dsPdfPanelV374 = function(){
    const t=dsCurrentV374();
    return `<div class="ds-panel fade-in">
      <h3>${t.icon} ${t.name} — Full Page PDF Crop</h3>
      <p class="tool-subtitle">Upload any full-page PDF downloaded from a website. The PDF will open in a large workspace. Drag/resize the printable area just like a professional crop tool.</p>
      ${dsOptionsV374()}
      <div class="ds-control-grid mt-15">
        <label class="ds-upload">📄 Upload Full Page PDF<input id="dsFullPdf" type="file" accept="application/pdf" onchange="dsLoadPdfV374(this)"></label>
        <label>PDF Page<select id="dsPageSelect" onchange="dsRenderPdfPageV374(Number(this.value))"><option value="1">Page 1</option></select></label>
        <label>Crop Ratio<select id="dsRatioLock"><option value="card">Lock card ratio</option><option value="free">Free selection</option></select></label>
      </div>
      <div id="dsPdfWork"></div>
    </div>`;
  };

  window.dsRenderPdfPageV374 = async function(pageNum){
    if(!DS_V374.pdfDoc) return;
    DS_V374.pageNum=pageNum||1;
    const work=document.getElementById('dsPdfWork'); if(work) work.innerHTML='<div class="progress-box">Rendering page...</div>';
    const page=await DS_V374.pdfDoc.getPage(DS_V374.pageNum);
    const viewport=page.getViewport({scale:3});
    const source=document.createElement('canvas'); const sctx=source.getContext('2d');
    source.width=viewport.width; source.height=viewport.height;
    await page.render({canvasContext:sctx, viewport}).promise;
    DS_V374.pdfCanvas=source;
    if(work){work.innerHTML=`<div class="ds-pdf-workspace">
      <div class="ds-canvas-shell"><div class="ds-canvas-wrap" id="dsCanvasWrap"><canvas id="dsPdfCanvas"></canvas><div class="ds-cropbox" id="dsCropBox" data-size=""><span class="ds-handle nw" data-h="nw"></span><span class="ds-handle n" data-h="n"></span><span class="ds-handle ne" data-h="ne"></span><span class="ds-handle e" data-h="e"></span><span class="ds-handle se" data-h="se"></span><span class="ds-handle s" data-h="s"></span><span class="ds-handle sw" data-h="sw"></span><span class="ds-handle w" data-h="w"></span></div></div></div>
      <div class="ds-sidebox"><h3>Printable Selection</h3><p>Drag the green box over the card area. Resize from corners or edges. The selected part will print at the top center of A4.</p><label>Copies<select id="dsCopiesSide"><option value="1">1 Copy</option><option value="2">2 Copies</option><option value="4">4 Copies</option><option value="6">6 Copies</option></select></label><label>Border<select id="dsBorderSide"><option value="yes">Black border</option><option value="no">No border</option></select></label><div class="ds-actions"><button class="secondary-btn" onclick="dsResetCropV374()">Reset Selection</button><button class="primary-btn" onclick="dsGenerateFromPdfCropV374()">Crop & Generate A4 PDF</button></div><div class="ds-tooltips"><div class="ds-tip">✅ Larger workspace for easier selection.</div><div class="ds-tip">✅ Works for Aadhaar, Voter, PAN, Ayushman, DL and ABHA.</div><div class="ds-tip">✅ Front/back image upload remains available.</div></div></div>
    </div>`;}
    const c=document.getElementById('dsPdfCanvas'); const ctx=c.getContext('2d');
    const side=window.innerWidth>900?330:30;
    const maxW=Math.min(1180, Math.max(360, (workspace?.clientWidth||1000)-side));
    const ratio=source.width/source.height;
    c.width=maxW; c.height=Math.round(maxW/ratio);
    ctx.drawImage(source,0,0,c.width,c.height);
    dsResetCropV374(); dsInitCropEventsV374();
  };

  window.dsResetCropV374 = function(){
    const c=document.getElementById('dsPdfCanvas'); if(!c) return;
    const cardRatio=dsCurrentV374().size[0]/dsCurrentV374().size[1];
    let w=Math.round(c.width*0.78), h=Math.round(w/cardRatio);
    if(h>c.height*0.38){h=Math.round(c.height*0.32); w=Math.round(h*cardRatio);}
    DS_V374.crop.x=Math.round((c.width-w)/2); DS_V374.crop.y=Math.round(c.height*0.60); DS_V374.crop.w=w; DS_V374.crop.h=h; dsApplyCropV374();
  };

  window.dsApplyCropV374 = function(){
    const box=document.getElementById('dsCropBox'); if(!box) return;
    const cr=DS_V374.crop; box.style.left=cr.x+'px'; box.style.top=cr.y+'px'; box.style.width=cr.w+'px'; box.style.height=cr.h+'px'; box.dataset.size=`${Math.round(cr.w)} × ${Math.round(cr.h)} px`;
  };

  window.dsInitCropEventsV374 = function(){
    const box=document.getElementById('dsCropBox'); const canvas=document.getElementById('dsPdfCanvas'); if(!box||!canvas) return;
    const start=(e,mode)=>{e.preventDefault(); e.stopPropagation(); const p=dsPointV374(e); DS_V374.crop.active=true; DS_V374.crop.mode=mode; DS_V374.crop.sx=p.x; DS_V374.crop.sy=p.y; DS_V374.crop.start={x:DS_V374.crop.x,y:DS_V374.crop.y,w:DS_V374.crop.w,h:DS_V374.crop.h};};
    box.onmousedown=e=>start(e,'move'); box.ontouchstart=e=>start(e,'move');
    box.querySelectorAll('.ds-handle').forEach(h=>{h.onmousedown=e=>start(e,h.dataset.h); h.ontouchstart=e=>start(e,h.dataset.h);});
    const move=e=>{
      if(!DS_V374.crop.active) return; e.preventDefault();
      const p=dsPointV374(e), dx=p.x-DS_V374.crop.sx, dy=p.y-DS_V374.crop.sy, st=DS_V374.crop.start; let x=st.x,y=st.y,w=st.w,h=st.h;
      const lock=(document.getElementById('dsRatioLock')?.value||'card')==='card'; const ratio=dsCurrentV374().size[0]/dsCurrentV374().size[1]; const m=DS_V374.crop.mode;
      if(m==='move'){x=st.x+dx; y=st.y+dy;} else {
        if(m.includes('e')) w=st.w+dx; if(m.includes('s')) h=st.h+dy; if(m.includes('w')){w=st.w-dx; x=st.x+dx;} if(m.includes('n')){h=st.h-dy; y=st.y+dy;}
        if(lock && !['n','s','e','w'].includes(m)){
          if(Math.abs(dx)>Math.abs(dy)) h=w/ratio; else w=h*ratio;
          if(m.includes('w')) x=st.x+st.w-w; if(m.includes('n')) y=st.y+st.h-h;
        }
      }
      w=Math.max(60,Math.min(w,canvas.width)); h=Math.max(38,Math.min(h,canvas.height)); x=Math.max(0,Math.min(x,canvas.width-w)); y=Math.max(0,Math.min(y,canvas.height-h));
      Object.assign(DS_V374.crop,{x,y,w,h}); dsApplyCropV374();
    };
    const stop=()=>{DS_V374.crop.active=false;};
    document.onmousemove=move; document.onmouseup=stop; document.ontouchmove=move; document.ontouchend=stop;
  };

  // Compact passport workspace without changing final print size.
  const oldPassportTool=window.passportTool;
  window.passportTool=function(){
    if(oldPassportTool) oldPassportTool();
    setTimeout(()=>{
      const c=document.getElementById('passCanvas');
      if(c && !passState.img){c.width=Math.min(680,Math.max(330,(workspace?.clientWidth||680)-80)); c.height=Math.round(c.width*0.58); drawEmptyPassport();}
      const guide=document.querySelector('.passport-guide'); if(guide) guide.textContent='Select only the printable face area. The final output still prints at exact 35×45 mm.';
    },30);
  };
  const oldLoadPass=window.loadPassportImage;
  window.loadPassportImage=async function(){
    const f=document.getElementById('passImage')?.files?.[0]; if(!f) return;
    passState.img=await loadImage(await readFile(f)); passState.cropped='';
    const c=document.getElementById('passCanvas'); if(c){const maxW=Math.min(680,Math.max(330,Math.round((workspace?.clientWidth||680)-80))); c.width=maxW; c.height=Math.round(maxW*0.58);}
    preparePassportDisplay();
    const d=passState.display, ratio=35/45; let cropH=Math.min(d.h*.70,d.w/ratio*.70), cropW=cropH*ratio; if(cropW>d.w*.70){cropW=d.w*.70; cropH=cropW/ratio;}
    passState.crop={x:d.offsetX+(d.w-cropW)/2,y:d.offsetY+(d.h-cropH)/2,w:cropW,h:cropH}; drawPassportStudio(); initPassportCropEvents();
  };
})();

/* =====================================================
   Smart Photo Toolkit Pro v37.6
   Document Studio Final + Passport 8-Handle Crop + Minimal A4 Spacing
===================================================== */
(function(){
  const VERSION = '37.6';
  window.SPT_V376_VERSION = VERSION;

  const DOCS = {
    aadhaar:{name:'Aadhaar Card', icon:'<span class="ds376-doc-logo" style="color:#f97316">☀️</span>', size:[85.6,54], label:'Aadhaar'},
    pan:{name:'PAN Card', icon:'<span class="ds376-doc-logo" style="color:#2563eb">PAN</span>', size:[85.6,54], label:'PAN'},
    voter:{name:'Voter ID Card', icon:'<span class="ds376-doc-logo">🗳️</span>', size:[85.6,54], label:'Voter ID'},
    ayushman:{name:'Ayushman Card', icon:'<span class="ds376-doc-logo" style="color:#16a34a">🌿</span>', size:[85.6,54], label:'Ayushman'},
    abha:{name:'ABHA Card', icon:'<span class="ds376-doc-logo" style="color:#0ea5e9">ABHA</span>', size:[85.6,54], label:'ABHA'},
    dl:{name:'Driving Licence', icon:'<span class="ds376-doc-logo">🚘</span>', size:[85.6,54], label:'Driving Licence'}
  };

  const S = window.DS_V376 = {
    type:'aadhaar', mode:'images', sideMode:'frontback',
    img:{front:null,back:null}, canvas:{front:null,back:null}, crop:{}, cropActive:null,
    pdfDoc:null, pdfCanvas:null, pdfPage:1, pdfZoom:1, pdfCrop:{x:40,y:40,w:220,h:140},
    lastPdf:null, lastOutput:[]
  };

  function current(){return DOCS[S.type]||DOCS.aadhaar;}
  function point(e){const t=e.touches&&e.touches[0]; return {x:(t||e).clientX,y:(t||e).clientY};}
  function handles(cls='ds376-handle'){
    return ['nw','n','ne','e','se','s','sw','w'].map(h=>`<span class="${cls} ${h}" data-h="${h}"></span>`).join('');
  }
  function escapeHtml(x){return String(x||'').replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));}

  window.documentStudioTool = function(){
    if(!workspace) return;
    workspace.innerHTML = `
      <div class="ds376-shell">
        <div class="ds376-head">
          <div class="ds376-title"><h2>🪪 Document Studio</h2><p class="tool-subtitle">Select document, upload front/back images or a full-page PDF, crop printable area, and print at the top of A4 with minimum spacing.</p></div>
          <span class="ds376-badge">v37.6 Document Studio</span>
        </div>
        <div class="ds-card-types ds376-types" id="ds376Types"></div>
        <div class="ds376-tabs">
          <button class="ds376-tab active" id="ds376ImgTab" onclick="ds376Mode('images')">🖼️ Front / Back Images</button>
          <button class="ds376-tab" id="ds376PdfTab" onclick="ds376Mode('pdf')">📄 Full Page PDF Crop</button>
        </div>
        <div id="ds376Panel"></div>
        <div id="ds376Output" class="ds376-output"></div>
      </div>`;
    ds376RenderTypes();
    ds376Mode(S.mode||'images');
  };

  window.ds376RenderTypes = function(){
    const wrap=document.getElementById('ds376Types'); if(!wrap) return;
    wrap.innerHTML=Object.entries(DOCS).map(([k,d])=>`<button class="ds-type ds376-type ${S.type===k?'active':''}" onclick="ds376SelectType('${k}')">${d.icon}<b>${d.name}</b><span>${d.size[0]} × ${d.size[1]} mm print card</span></button>`).join('');
  };
  window.ds376SelectType=function(k){S.type=k; S.img={front:null,back:null}; S.canvas={front:null,back:null}; S.crop={}; S.pdfDoc=null; S.pdfCanvas=null; S.lastOutput=[]; ds376RenderTypes(); ds376Mode(S.mode||'images');};
  window.ds376Mode=function(mode){S.mode=mode; document.getElementById('ds376ImgTab')?.classList.toggle('active',mode==='images'); document.getElementById('ds376PdfTab')?.classList.toggle('active',mode==='pdf'); const out=document.getElementById('ds376Output'); if(out) out.innerHTML=''; if(mode==='images') ds376RenderImageMode(); else ds376RenderPdfMode();};

  function printSettingsHtml(){return `
    <label>Copies<select id="ds376Copies"><option value="1">1 Copy</option><option value="2">2 Copies</option><option value="4">4 Copies</option><option value="6">6 Copies</option></select></label>
    <label>Border<select id="ds376Border"><option value="yes">Black Border</option><option value="no">No Border</option></select></label>
    <label>Output Layout<select id="ds376Layout"><option value="frontback">Front + Back, minimal gap</option><option value="single">Single card top center</option></select></label>`;}

  window.ds376RenderImageMode = function(){
    const d=current(); const panel=document.getElementById('ds376Panel'); if(!panel) return;
    panel.innerHTML=`
      <div class="ds376-panel">
        <div class="ds376-workgrid">
          <div class="ds376-left">
            <div class="ds376-section">
              <h3>1. Upload ${escapeHtml(d.name)} Images</h3>
              <p>Upload front and back images. After upload, select exactly which part should be printed.</p>
              <div class="ds376-upload-grid">
                <label class="ds376-upload">📤 Upload Front Image<small>JPG, PNG, WEBP</small><input type="file" accept="image/*" onchange="ds376LoadImage('front',this)"></label>
                <label class="ds376-upload">📤 Upload Back Image<small>JPG, PNG, WEBP</small><input type="file" accept="image/*" onchange="ds376LoadImage('back',this)"></label>
              </div>
            </div>
            <div class="ds376-section">
              <h3>2. Select Printable Area</h3>
              <p>Drag the blue border to move. Drag corners or side handles to resize. This selected part will be printed.</p>
              <div class="ds376-crop-grid" id="ds376ImageCropGrid"></div>
              <div class="ds376-tip">Tip: For lamination, crop tightly around the card and use minimal spacing in print settings.</div>
            </div>
          </div>
          <div class="ds376-right">
            <div class="ds376-print-card">
              <h3>3. Print Preview & Settings</h3>
              <div class="ds376-a4-preview"><div class="ds376-a4-top" id="ds376LivePreview"><span style="color:#64748b;font-weight:900">Upload and crop images to preview A4 output</span></div></div>
              <div class="ds376-success">Top spacing and front/back gap are minimized for lamination.</div>
              ${printSettingsHtml()}
              <button class="primary-btn" onclick="ds376PreviewImages()">Preview A4 Page</button>
              <button class="pdf-btn" onclick="ds376DownloadPdf()">Download PDF</button>
              <button class="print-btn" onclick="ds376PrintPdf()">Print / Save as PDF</button>
            </div>
          </div>
        </div>
      </div>`;
    ds376RenderImageCropGrid();
  };

  window.ds376LoadImage = async function(side,input){
    const f=input.files&&input.files[0]; if(!f) return;
    const src=await readFile(f); const img=await loadImage(src);
    const source=document.createElement('canvas'); source.width=img.width; source.height=img.height; source.getContext('2d').drawImage(img,0,0);
    S.img[side]={src,name:f.name,source};
    ds376RenderImageCropGrid();
  };

  window.ds376RenderImageCropGrid=function(){
    const grid=document.getElementById('ds376ImageCropGrid'); if(!grid) return;
    const sides=[]; if(S.img.front) sides.push('front'); if(S.img.back) sides.push('back');
    if(!sides.length){grid.innerHTML=`<div class="ds376-tip" style="grid-column:1/-1">Upload front or back image to start selecting printable area.</div>`; return;}
    grid.innerHTML=sides.map(side=>`<div class="ds376-crop-card"><h4>${side==='front'?'Front':'Back'} - Select Area</h4><div class="ds376-canvas-shell"><div class="ds376-canvas-wrap" id="ds376Wrap_${side}"><canvas id="ds376Canvas_${side}"></canvas><div class="ds376-cropbox" id="ds376Box_${side}" data-label="${side==='front'?'Front Area':'Back Area'}" data-size="">${handles('ds376-handle')}</div></div></div><div class="ds376-toolbar"><button onclick="ds376ResetImageCrop('${side}')">Reset</button><button onclick="ds376ZoomImage('${side}',1.1)">Zoom +</button><button onclick="ds376ZoomImage('${side}',0.9)">Zoom -</button></div></div>`).join('');
    sides.forEach(side=>ds376DrawImageCanvas(side));
  };
  window.ds376DrawImageCanvas=function(side){
    const item=S.img[side], c=document.getElementById('ds376Canvas_'+side), box=document.getElementById('ds376Box_'+side); if(!item||!c||!box) return;
    const maxW=Math.min(460, Math.max(260, (workspace?.clientWidth||900)/2-70)); const ratio=item.source.width/item.source.height;
    c.width=maxW; c.height=Math.max(150,Math.round(maxW/ratio)); c.getContext('2d').drawImage(item.source,0,0,c.width,c.height);
    if(!S.crop[side]){S.crop[side]={x:Math.round(c.width*.04),y:Math.round(c.height*.04),w:Math.round(c.width*.92),h:Math.round(c.height*.92),zoom:1};}
    ds376ApplyBox(side); ds376InitBoxEvents(side,'image');
  };
  window.ds376ResetImageCrop=function(side){const c=document.getElementById('ds376Canvas_'+side); if(!c)return; S.crop[side]={x:Math.round(c.width*.04),y:Math.round(c.height*.04),w:Math.round(c.width*.92),h:Math.round(c.height*.92),zoom:1}; ds376ApplyBox(side);};
  window.ds376ZoomImage=function(side,f){toast('For best quality, resize the selection box. Image zoom will be added in v38.');};

  window.ds376ApplyBox=function(side){
    const box=document.getElementById('ds376Box_'+side); const cr=S.crop[side]; if(!box||!cr) return;
    box.style.left=cr.x+'px'; box.style.top=cr.y+'px'; box.style.width=cr.w+'px'; box.style.height=cr.h+'px'; box.dataset.size=`${Math.round(cr.w)} × ${Math.round(cr.h)} px`;
  };
  window.ds376InitBoxEvents=function(side,type){
    const box=document.getElementById((type==='pdf'?'ds376PdfBox':'ds376Box_'+side)); const canvas=document.getElementById(type==='pdf'?'ds376PdfCanvas':'ds376Canvas_'+side); if(!box||!canvas) return;
    const state = type==='pdf' ? S.pdfCrop : (S.crop[side] || (S.crop[side]={x:0,y:0,w:100,h:60}));
    const start=(e,mode)=>{e.preventDefault(); e.stopPropagation(); const p=point(e); S.cropActive={side,type,mode,sx:p.x,sy:p.y,start:{x:state.x,y:state.y,w:state.w,h:state.h}};};
    box.onmousedown=e=>start(e,'move'); box.ontouchstart=e=>start(e,'move');
    box.querySelectorAll('.ds376-handle').forEach(h=>{h.onmousedown=e=>start(e,h.dataset.h); h.ontouchstart=e=>start(e,h.dataset.h);});
    const move=e=>{
      if(!S.cropActive || S.cropActive.side!==side || S.cropActive.type!==type) return; e.preventDefault();
      const p=point(e), dx=p.x-S.cropActive.sx, dy=p.y-S.cropActive.sy, st=S.cropActive.start; let x=st.x,y=st.y,w=st.w,h=st.h, m=S.cropActive.mode;
      if(m==='move'){x=st.x+dx;y=st.y+dy;} else { if(m.includes('e')) w=st.w+dx; if(m.includes('s')) h=st.h+dy; if(m.includes('w')){w=st.w-dx;x=st.x+dx;} if(m.includes('n')){h=st.h-dy;y=st.y+dy;} }
      w=Math.max(45,Math.min(w,canvas.width)); h=Math.max(28,Math.min(h,canvas.height)); x=Math.max(0,Math.min(x,canvas.width-w)); y=Math.max(0,Math.min(y,canvas.height-h));
      Object.assign(state,{x,y,w,h}); if(type==='pdf') ds376ApplyPdfBox(); else ds376ApplyBox(side);
    };
    const stop=()=>{S.cropActive=null;};
    document.addEventListener('mousemove',move,{passive:false}); document.addEventListener('touchmove',move,{passive:false}); document.addEventListener('mouseup',stop); document.addEventListener('touchend',stop);
  };

  window.ds376CropImageSide=function(side){
    const item=S.img[side], c=document.getElementById('ds376Canvas_'+side), cr=S.crop[side]; if(!item||!c||!cr) return '';
    const sx=cr.x*(item.source.width/c.width), sy=cr.y*(item.source.height/c.height), sw=cr.w*(item.source.width/c.width), sh=cr.h*(item.source.height/c.height);
    const out=document.createElement('canvas'), ctx=out.getContext('2d'); out.width=1200; out.height=Math.round(1200*sh/sw); ctx.fillStyle='#fff'; ctx.fillRect(0,0,out.width,out.height); ctx.drawImage(item.source,sx,sy,sw,sh,0,0,out.width,out.height); return out.toDataURL('image/jpeg',.96);
  };
  window.ds376CroppedImages=function(){const arr=[]; if(S.img.front) arr.push(ds376CropImageSide('front')); if(S.img.back) arr.push(ds376CropImageSide('back')); return arr.filter(Boolean);};
  window.ds376PreviewImages=async function(){const imgs=ds376CroppedImages(); if(!imgs.length) return alert('Please upload and crop front/back image first.'); S.lastOutput=imgs; const copies=Number(document.getElementById('ds376Copies')?.value||1); const border=(document.getElementById('ds376Border')?.value||'yes')==='yes'; S.lastPdf=await ds376CreateA4Pdf(imgs,copies,border,true); ds376ShowLivePreview(imgs,copies); ds376ShowOutput('A4 preview ready. You can download or print now.');};
  window.ds376ShowLivePreview=function(imgs,copies){const box=document.getElementById('ds376LivePreview'); if(!box) return; let html=''; for(let i=0;i<copies;i++) imgs.forEach(src=>html+=`<img class="ds376-preview-img" src="${src}">`); box.innerHTML=html;};

  window.ds376RenderPdfMode=function(){
    const d=current(); const panel=document.getElementById('ds376Panel'); if(!panel) return;
    panel.innerHTML=`<div class="ds376-panel"><div class="ds376-pdf-workgrid"><div><div class="ds376-section"><h3>1. Upload Full Page ${escapeHtml(d.name)} PDF</h3><p>Upload the full-page document PDF downloaded from an official website. Then drag-select the card area.</p><div class="ds376-upload-grid"><label class="ds376-upload">📄 Click to upload PDF<small>Full page PDF only</small><input type="file" accept="application/pdf" onchange="ds376LoadPdf(this)"></label><label>PDF Page<select id="ds376PdfPage" onchange="ds376RenderPdfPage(Number(this.value))"><option value="1">Page 1</option></select></label></div></div><div class="ds376-section"><div class="ds376-zoombar"><button onclick="ds376PdfZoom(.9)">−</button><b id="ds376ZoomText">100%</b><button onclick="ds376PdfZoom(1.1)">+</button><button onclick="ds376FitPdf()">Fit Width</button><button onclick="ds376ResetPdfCrop()">Reset</button></div><div class="ds376-pdf-shell"><div class="ds376-pdf-wrap" id="ds376PdfWrap"><canvas id="ds376PdfCanvas"></canvas><div class="ds376-cropbox" id="ds376PdfBox" data-label="Printable Area" data-size="">${handles('ds376-handle')}</div></div></div><div class="ds376-tip" style="margin-top:12px">Drag inside the box to move. Drag corners or sides to resize the printable area. Output prints near the top of A4.</div></div></div><div class="ds376-pdf-side"><h3>2. Print Settings</h3>${printSettingsHtml()}<button class="secondary-btn" style="width:100%;margin-top:10px" onclick="ds376ResetPdfCrop()">Reset Selection</button><button class="primary-btn" style="width:100%;margin-top:10px" onclick="ds376GeneratePdfCrop()">Crop & Preview A4</button><button class="pdf-btn" style="width:100%;margin-top:10px" onclick="ds376DownloadPdf()">Download PDF</button><button class="print-btn" style="width:100%;margin-top:10px" onclick="ds376PrintPdf()">Print / Save as PDF</button><div class="ds376-a4-preview" style="margin-top:15px;min-height:190mm"><div class="ds376-a4-top" id="ds376LivePreview"><span style="color:#64748b;font-weight:900">Preview will appear here</span></div></div><div class="ds376-how"><b>How to select?</b><br>1. Upload full-page PDF<br>2. Move box to card area<br>3. Resize corners/sides<br>4. Preview A4<br>5. Download or print</div></div></div><div id="ds376Output" class="ds376-output"></div></div>`;
  };
  window.ds376LoadPdf=async function(input){
    const f=input.files&&input.files[0]; if(!f) return; if(!window.pdfjsLib) return alert('PDF library not loaded. Please refresh with internet.');
    const buf=await f.arrayBuffer(); S.pdfDoc=await pdfjsLib.getDocument({data:buf}).promise; const sel=document.getElementById('ds376PdfPage'); if(sel){sel.innerHTML=''; for(let i=1;i<=S.pdfDoc.numPages;i++) sel.innerHTML+=`<option value="${i}">Page ${i}</option>`;} await ds376RenderPdfPage(1);
  };
  window.ds376RenderPdfPage=async function(num){
    if(!S.pdfDoc) return; S.pdfPage=num||1; const page=await S.pdfDoc.getPage(S.pdfPage); const vp=page.getViewport({scale:3}); const src=document.createElement('canvas'), sctx=src.getContext('2d'); src.width=vp.width; src.height=vp.height; await page.render({canvasContext:sctx,viewport:vp}).promise; S.pdfCanvas=src; ds376DrawPdfCanvas();
  };
  window.ds376DrawPdfCanvas=function(){
    const src=S.pdfCanvas, c=document.getElementById('ds376PdfCanvas'); if(!src||!c) return; const maxW=Math.min(1050,Math.max(320,(workspace?.clientWidth||1000)-410))*S.pdfZoom; const r=src.width/src.height; c.width=maxW; c.height=Math.round(maxW/r); c.getContext('2d').drawImage(src,0,0,c.width,c.height); document.getElementById('ds376ZoomText')&&(document.getElementById('ds376ZoomText').textContent=Math.round(S.pdfZoom*100)+'%'); if(!S.pdfCrop || !S.pdfCrop.w) ds376ResetPdfCrop(); else ds376ApplyPdfBox(); ds376InitBoxEvents('pdf','pdf');
  };
  window.ds376PdfZoom=function(f){S.pdfZoom=Math.max(.5,Math.min(2.5,S.pdfZoom*f)); ds376DrawPdfCanvas();}; window.ds376FitPdf=function(){S.pdfZoom=1; ds376DrawPdfCanvas();};
  window.ds376ResetPdfCrop=function(){const c=document.getElementById('ds376PdfCanvas'); if(!c) return; const ratio=current().size[0]/current().size[1]; let w=Math.round(c.width*.78), h=Math.round(w/ratio); if(h>c.height*.45){h=Math.round(c.height*.32); w=Math.round(h*ratio);} S.pdfCrop={x:Math.round((c.width-w)/2),y:Math.round(c.height*.58),w,h}; ds376ApplyPdfBox();};
  window.ds376ApplyPdfBox=function(){const box=document.getElementById('ds376PdfBox'), cr=S.pdfCrop; if(!box||!cr) return; box.style.left=cr.x+'px'; box.style.top=cr.y+'px'; box.style.width=cr.w+'px'; box.style.height=cr.h+'px'; box.dataset.size=`${Math.round(cr.w)} × ${Math.round(cr.h)} px`;};
  window.ds376CropPdf=function(){const preview=document.getElementById('ds376PdfCanvas'), box=document.getElementById('ds376PdfBox'); if(!preview||!box||!S.pdfCanvas) return ''; const cr=preview.getBoundingClientRect(), br=box.getBoundingClientRect(); let rx=(br.left-cr.left)/cr.width, ry=(br.top-cr.top)/cr.height, rw=br.width/cr.width, rh=br.height/cr.height; rx=Math.max(0,Math.min(rx,1)); ry=Math.max(0,Math.min(ry,1)); rw=Math.max(.01,Math.min(rw,1-rx)); rh=Math.max(.01,Math.min(rh,1-ry)); const src=S.pdfCanvas, sx=src.width*rx, sy=src.height*ry, sw=src.width*rw, sh=src.height*rh; const out=document.createElement('canvas'), ctx=out.getContext('2d'); out.width=1200; out.height=Math.round(1200*sh/sw); ctx.fillStyle='#fff'; ctx.fillRect(0,0,out.width,out.height); ctx.drawImage(src,sx,sy,sw,sh,0,0,out.width,out.height); return out.toDataURL('image/jpeg',.96);};
  window.ds376GeneratePdfCrop=async function(){const img=ds376CropPdf(); if(!img) return alert('Upload PDF and select printable area first.'); const copies=Number(document.getElementById('ds376Copies')?.value||1), border=(document.getElementById('ds376Border')?.value||'yes')==='yes'; S.lastOutput=[img]; S.lastPdf=await ds376CreateA4Pdf([img],copies,border,false); ds376ShowLivePreview([img],copies); ds376ShowOutput('Full-page PDF crop is ready for A4 top-center print.');};

  window.ds376CreateA4Pdf=async function(srcs,copies,border,isCards){
    const {jsPDF}=window.jspdf; const pdf=new jsPDF({orientation:'portrait',unit:'mm',format:'a4'}); const [cardW,cardH]=current().size; const gap=3; let y=3;
    for(let copy=0; copy<copies; copy++){
      const dims=[]; for(const src of srcs){ if(isCards) dims.push({src,w:cardW,h:cardH}); else { const img=await loadImage(src); let h=cardH, w=h*img.width/img.height; if(w>185){w=185;h=w*img.height/img.width;} dims.push({src,w,h}); } }
      const totalW=dims.reduce((a,d)=>a+d.w,0)+(dims.length-1)*gap; let x=(210-totalW)/2;
      for(const d of dims){pdf.addImage(d.src,'JPEG',x,y,d.w,d.h); if(border){pdf.setDrawColor(0);pdf.setLineWidth(.25);pdf.rect(x,y,d.w,d.h);} x+=d.w+gap;}
      y+=cardH+5; if(y>250 && copy<copies-1){pdf.addPage(); y=3;}
    }
    return pdf;
  };
  window.ds376ShowOutput=function(msg){const out=document.getElementById('ds376Output'); if(out) out.innerHTML=`<div class="result-card fade-in"><h3>✅ Ready</h3><p>${escapeHtml(msg)}</p></div>`;};
  window.ds376DownloadPdf=function(){ if(!S.lastPdf) return alert('Please preview/generate PDF first.'); const a=document.createElement('a'); a.href=URL.createObjectURL(S.lastPdf.output('blob')); a.download=current().label.replace(/\s+/g,'-').toLowerCase()+'-a4-print.pdf'; document.body.appendChild(a); a.click(); a.remove(); };
  window.ds376PrintPdf=function(){ if(!S.lastPdf) return alert('Please preview/generate PDF first.'); S.lastPdf.autoPrint(); window.open(URL.createObjectURL(S.lastPdf.output('blob')),'_blank'); };

  // Route Document Studio to the new v37.6 tool.
  const oldOpen = window.openTool;
  window.openTool = function(tool){
    if(['documentstudio','aadhaar','voter','pan','ayushman','dl','abha'].includes(tool)) { setActive && setActive('documentstudio'); return documentStudioTool(); }
    return oldOpen ? oldOpen(tool) : null;
  };

  // Reduce output top margin for existing document and passport generation too.
  window.createPassportPDF = function(src,name,date){
    const {jsPDF}=window.jspdf; const pdf=new jsPDF({orientation:'portrait',unit:'mm',format:'a4'}); const photoW=35, photoH=45, gap=2.5, top=3; let x=4;
    for(let i=0;i<5;i++){pdf.setFillColor(255,255,255);pdf.rect(x,top,photoW,photoH,'F');pdf.addImage(src,'JPEG',x,top,photoW,photoH);pdf.setDrawColor(0);pdf.setLineWidth(.3);pdf.rect(x,top,photoW,photoH);if(name||date){pdf.setFontSize(7);pdf.text(name||'',x+photoW/2,top+photoH+3,{align:'center'});pdf.text(date||'',x+photoW/2,top+photoH+6,{align:'center'});}x+=photoW+gap;} return pdf;
  };

  // Upgrade passport canvas crop with 8 handles while preserving 35:45 ratio and final 35x45mm output.
  window.drawPassportStudio = function(){
    const c=document.getElementById('passCanvas'); if(!c) return; const ctx=c.getContext('2d'); ctx.clearRect(0,0,c.width,c.height); ctx.fillStyle='#111827'; ctx.fillRect(0,0,c.width,c.height); if(!passState.img){drawEmptyPassport();return;} const d=passState.display; ctx.drawImage(passState.img,d.offsetX,d.offsetY,d.w,d.h); const crop=passState.crop; if(!crop) return; ctx.save(); ctx.beginPath(); ctx.rect(0,0,c.width,c.height); ctx.rect(crop.x,crop.y,crop.w,crop.h); ctx.fillStyle='rgba(15,23,42,.58)'; ctx.fill('evenodd'); ctx.restore(); ctx.strokeStyle='#2563eb'; ctx.lineWidth=3; ctx.strokeRect(crop.x,crop.y,crop.w,crop.h); ctx.strokeStyle='rgba(255,255,255,.7)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(crop.x+crop.w/3,crop.y);ctx.lineTo(crop.x+crop.w/3,crop.y+crop.h);ctx.moveTo(crop.x+crop.w*2/3,crop.y);ctx.lineTo(crop.x+crop.w*2/3,crop.y+crop.h);ctx.moveTo(crop.x,crop.y+crop.h/3);ctx.lineTo(crop.x+crop.w,crop.y+crop.h/3);ctx.moveTo(crop.x,crop.y+crop.h*2/3);ctx.lineTo(crop.x+crop.w,crop.y+crop.h*2/3);ctx.stroke(); const pts=[['nw',crop.x,crop.y],['n',crop.x+crop.w/2,crop.y],['ne',crop.x+crop.w,crop.y],['e',crop.x+crop.w,crop.y+crop.h/2],['se',crop.x+crop.w,crop.y+crop.h],['s',crop.x+crop.w/2,crop.y+crop.h],['sw',crop.x,crop.y+crop.h],['w',crop.x,crop.y+crop.h/2]]; ctx.fillStyle='#2563eb'; ctx.strokeStyle='#fff'; ctx.lineWidth=3; pts.forEach(([h,x,y])=>{ctx.beginPath();ctx.arc(x,y,9,0,Math.PI*2);ctx.fill();ctx.stroke();}); ctx.fillStyle='rgba(29,78,216,.9)'; ctx.fillRect(crop.x+8,crop.y+8,160,28); ctx.fillStyle='#fff';ctx.font='bold 13px Arial';ctx.textAlign='left';ctx.fillText('35×45 mm print area',crop.x+16,crop.y+27);
  };
  window.initPassportCropEvents = function(){
    const c=document.getElementById('passCanvas'); if(!c) return;
    const hit=(p,crop)=>{const hs=16; const pts={nw:[crop.x,crop.y],n:[crop.x+crop.w/2,crop.y],ne:[crop.x+crop.w,crop.y],e:[crop.x+crop.w,crop.y+crop.h/2],se:[crop.x+crop.w,crop.y+crop.h],s:[crop.x+crop.w/2,crop.y+crop.h],sw:[crop.x,crop.y+crop.h],w:[crop.x,crop.y+crop.h/2]}; for(const [k,[x,y]] of Object.entries(pts)){if(Math.abs(p.x-x)<hs&&Math.abs(p.y-y)<hs)return k;} if(p.x>=crop.x&&p.x<=crop.x+crop.w&&p.y>=crop.y&&p.y<=crop.y+crop.h)return 'move'; return 'draw';};
    const down=e=>{e.preventDefault(); if(!passState.img)return; const p=getPassportPoint(e), crop=passState.crop; passState.mode=hit(p,crop); if(passState.mode==='draw') passState.crop={x:p.x,y:p.y,w:1,h:1}; passState.start={p,crop:{...(passState.crop||{})}};};
    const move=e=>{if(!passState.mode||!passState.start||passState.mode==='idle')return; e.preventDefault(); const p=getPassportPoint(e), st=passState.start.crop, dx=p.x-passState.start.p.x, dy=p.y-passState.start.p.y; let x=st.x,y=st.y,w=st.w,h=st.h, m=passState.mode, ratio=35/45; if(m==='move'){x=st.x+dx;y=st.y+dy;} else if(m==='draw'){w=Math.abs(dx); h=w/ratio; x=dx<0?passState.start.p.x-w:passState.start.p.x; y=dy<0?passState.start.p.y-h:passState.start.p.y;} else { if(m.includes('e')) w=st.w+dx; if(m.includes('w')){w=st.w-dx;x=st.x+dx;} if(m.includes('s')) h=st.h+dy; if(m.includes('n')){h=st.h-dy;y=st.y+dy;} if(!['n','s','e','w'].includes(m)){ if(Math.abs(dx)>Math.abs(dy)) h=w/ratio; else w=h*ratio; if(m.includes('w')) x=st.x+st.w-w; if(m.includes('n')) y=st.y+st.h-h; } else { h=w/ratio; } } passState.crop={x,y,w:Math.max(50,w),h:Math.max(65,h)}; clampPassportCrop(); drawPassportStudio();};
    const up=()=>{if(!passState.img)return; passState.mode='idle'; passState.start=null; cropPassportSelection();}; c.onmousedown=down;c.ontouchstart=down;window.onmousemove=move;window.ontouchmove=move;window.onmouseup=up;window.ontouchend=up;
  };

  // Ensure top user menu refreshes after v37.6 loads.
  setTimeout(()=>{try{updateTopUserMenuV375&&updateTopUserMenuV375();}catch(e){}},500);
})();

/* =====================================================
   v38.3 Enterprise Skin JS — V37.6 tools preserved
===================================================== */
(function(){
  const enterpriseDocIcon = (type)=>{
    const icons={
      aadhaar:`<svg viewBox="0 0 120 70" width="96" height="58"><path d="M60 5l7 13 14-8-5 15 16 2-13 10 13 10-16 2 5 15-14-8-7 13-7-13-14 8 5-15-16-2 13-10-13-10 16-2-5-15 14 8z" fill="#f59e0b" opacity=".9"/><text x="60" y="45" text-anchor="middle" font-size="18" font-weight="900" fill="#ef4444">AADHAAR</text></svg>`,
      pan:`<svg viewBox="0 0 120 70" width="96" height="58"><rect x="10" y="16" width="100" height="42" rx="8" fill="#e8f0ff" stroke="#1d4ed8"/><text x="60" y="43" text-anchor="middle" font-size="24" font-weight="900" fill="#1d4ed8">PAN</text></svg>`,
      voter:`<svg viewBox="0 0 120 70" width="96" height="58"><rect x="45" y="8" width="18" height="54" fill="#111827" transform="rotate(45 60 35)"/><rect x="38" y="20" width="18" height="40" fill="#f97316" transform="rotate(45 47 40)"/><rect x="58" y="18" width="18" height="40" fill="#16a34a" transform="rotate(45 67 38)"/><circle cx="85" cy="17" r="8" fill="#9ca3af"/><circle cx="98" cy="30" r="7" fill="#9ca3af"/></svg>`,
      ayushman:`<svg viewBox="0 0 120 70" width="96" height="58"><circle cx="60" cy="35" r="28" fill="#fff7ed" stroke="#f97316"/><path d="M60 48c-18-13-23-22-17-31 6-8 15-3 17 4 2-7 11-12 17-4 6 9 1 18-17 31z" fill="#16a34a"/><text x="60" y="63" text-anchor="middle" font-size="10" font-weight="900" fill="#7c2d12">PM-JAY</text></svg>`,
      abha:`<svg viewBox="0 0 120 70" width="96" height="58"><path d="M24 44c12-22 24-22 36 0 12-22 24-22 36 0" fill="none" stroke="#0f62fe" stroke-width="6"/><text x="60" y="50" text-anchor="middle" font-size="22" font-weight="900" fill="#1e40af">ABHA</text></svg>`,
      dl:`<svg viewBox="0 0 120 70" width="96" height="58"><rect x="18" y="14" width="84" height="44" rx="6" fill="#f8fafc" stroke="#111827"/><circle cx="38" cy="36" r="10" fill="#9ca3af"/><rect x="55" y="26" width="35" height="5" fill="#111827"/><rect x="55" y="37" width="42" height="5" fill="#64748b"/><text x="60" y="65" text-anchor="middle" font-size="9" font-weight="900">Driving Licence</text></svg>`
    };
    return icons[type]||icons.aadhaar;
  };
  window.enterpriseHomeV383=function(){
    const user=window.SPT?.user||JSON.parse(localStorage.getItem('spt_user')||'null')||{};
    const name=user.name||'Guest User', email=user.email||'Login to sync profile';
    workspace.innerHTML=`
      <div class="ev-shell fade-in">
        <div>
          <div class="ev-card ev-hero">
            <div><h1>Smart Photo Toolkit Pro</h1><p>All-in-one image tools for documents, photos, PDF and productivity. Crop, resize, convert and create professional documents with ease.</p></div>
            <div class="ev-status">v38.3 Enterprise<span>● All Systems Operational</span></div>
          </div>
          <div class="ev-card ev-section">
            <div class="ev-section-head"><span>📁</span><div><h2>Document Studio</h2><p>Create and print professional documents.</p></div></div>
            <div class="ev-doc-grid">
              ${['aadhaar','pan','voter','ayushman','dl'].map(t=>`<button class="ev-doc-tile" onclick="showTool('documentstudio'); setTimeout(()=>{try{ds376SelectType('${t}')}catch(e){}},80)"><div class="ev-doc-icon">${enterpriseDocIcon(t)}</div><b>${({aadhaar:'Aadhaar Card',pan:'PAN Card',voter:'Voter ID Card',ayushman:'Ayushman Card',dl:'Driving Licence'})[t]}</b></button>`).join('')}
            </div>
            <div class="ev-actions"><button class="ev-action" onclick="showTool('documentstudio')"><span>📄</span>New Document</button><button class="ev-action" onclick="showTool('documentstudio')"><span>📁</span>From Template</button><button class="ev-action" onclick="showTool('documentstudio')"><span>💾</span>Saved Documents</button><button class="ev-action" onclick="showTool('documentstudio')"><span>🖨️</span>Print Settings</button></div>
          </div>
          <div class="ev-card ev-section">
            <div class="ev-section-head"><span>📄</span><div><h2>PDF Studio</h2><p>Edit, convert, crop and manage PDF files.</p></div></div>
            <div class="ev-tool-row">
              <button class="ev-tool" onclick="showTool('pdfresizer')"><span>↔️</span>PDF Resizer</button>
              <button class="ev-tool" onclick="showTool('pdfresizer')"><span>✂️</span>Crop PDF</button>
              <button class="ev-tool" onclick="showTool('pdfresizer')"><span>🖼️</span>PDF to Image</button>
              <button class="ev-tool" onclick="showTool('pdfresizer')"><span>📄</span>Image to PDF</button>
              <button class="ev-tool" onclick="showTool('pdfresizer')"><span>➕</span>Merge PDF</button>
              <button class="ev-tool" onclick="showTool('pdfresizer')"><span>✂️</span>Split PDF</button>
              <button class="ev-tool" onclick="showTool('pdfresizer')"><span>📦</span>Compress PDF</button>
            </div>
          </div>
          <div class="ev-card ev-section">
            <div class="ev-section-head"><span>📷</span><div><h2>Photo Tools</h2><p>Enhance and edit your photos easily.</p></div></div>
            <div class="ev-tool-row">
              <button class="ev-tool" onclick="showTool('compressor')"><span>📉</span>Compress Photo</button>
              <button class="ev-tool" onclick="showTool('passport')"><span>👤</span>Passport Photo</button>
              <button class="ev-tool" onclick="showTool('namedate')"><span>🏷️</span>Name / Date</button>
              <button class="ev-tool" onclick="showTool('compressor')"><span>🔄</span>Rotate / Flip</button>
              <button class="ev-tool" onclick="showTool('compressor')"><span>🎨</span>Photo Filters</button>
              <button class="ev-tool" onclick="showTool('compressor')"><span>☀️</span>Color Adjust</button>
              <button class="ev-tool" onclick="showTool('payment')"><span>👑</span>Premium</button>
            </div>
          </div>
        </div>
        <div class="ev-right-stack">
          <div class="ev-card ev-profile-card"><div class="ev-avatar-big">${(name||'U').charAt(0).toUpperCase()}</div><h3>${escapeV383(name)}</h3><p>${escapeV383(email)}</p><span class="ev-pro-badge">👑 ${user.premium?'Pro Member':'Free Member'}</span><div class="ev-menu-list"><button onclick="showTool('dashboard')">👤 My Profile ›</button><button onclick="showTool('dashboard')">✏️ Edit Profile ›</button><button onclick="showTool('premium')">👑 Membership ›</button><button onclick="showTool('payment')">💳 Payments ›</button><button onclick="showTool('admin')">⚙️ Admin Panel ›</button><button onclick="SPT?.logout?.()">🚪 Logout</button></div></div>
          <div class="ev-card"><h3>Workspace Info</h3><div class="ev-info-row"><span>Documents</span><b>124</b></div><div class="ev-info-row"><span>Storage Used</span><b>2.45 GB</b></div><div class="ev-info-row"><span>Templates</span><b>18</b></div><div class="ev-info-row"><span>Total Prints</span><b>156</b></div></div>
        </div>
      </div>`;
  };
  function escapeV383(x){return String(x||'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
  const prevOpen=window.openTool;
  window.openTool=function(tool){
    if(tool==='home') { setActive && setActive('home'); closeMenu && closeMenu(); return enterpriseHomeV383(); }
    return prevOpen ? prevOpen(tool) : null;
  };
  window.addEventListener('load',()=>setTimeout(()=>{try{if(document.querySelector('.nav-item.active')?.dataset.tool==='home') enterpriseHomeV383();}catch(e){}},350));
})();
