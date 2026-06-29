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
   v37.0 Alpha – Image Studio + Document Studio
   Built on V36 master package
===================================================== */
const V37_CARD_TYPES = {
  aadhaar: { label: 'Aadhaar Card', icon: '🪪', w: 85.6, h: 54, note: 'Standard ID card layout for Aadhaar front/back printing.' },
  voter: { label: 'Voter ID Card', icon: '🗳️', w: 85.6, h: 54, note: 'Print voter ID front/back on A4 with clean borders.' },
  pan: { label: 'PAN Card', icon: '💳', w: 85.6, h: 54, note: 'PAN card print layout with single or multiple copies.' },
  ayushman: { label: 'Ayushman Card', icon: '❤️', w: 85.6, h: 54, note: 'Ayushman card front/back print-ready PDF.' },
  dl: { label: 'Driving Licence', icon: '🚘', w: 85.6, h: 54, note: 'Driving licence card layout for image/PDF prints.' },
  abha: { label: 'ABHA Card', icon: '🩺', w: 85.6, h: 54, note: 'ABHA health card print-ready layout.' }
};
let v37SelectedCardType = 'aadhaar';

function studioHeroV37(title, subtitle){
  return `<div class="studio-hero-v37 fade-in"><div><span class="enterprise-chip">v37.0 Alpha</span><h2>${title}</h2><p>${subtitle}</p></div><div class="studio-hero-badge-v37">Enterprise Studio</div></div>`;
}

function imageStudioTool(){
  workspace.innerHTML = `
    ${studioHeroV37('Image Studio', 'Passport photos and every image-processing tool are now grouped in one professional workspace.')}
    <div class="studio-grid-v37">
      <button class="studio-card-v37 primary-studio" onclick="passportTool()"><b>👤</b><h3>Passport Photo Studio</h3><p>Draw/select printable 35×45 mm crop area. No sliders. A4 PDF output.</p><span>Open Studio →</span></button>
      <button class="studio-card-v37" onclick="imageCompressor()"><b>🗜️</b><h3>Image Compressor</h3><p>Compress photos to 20 KB, 50 KB, 100 KB or custom size.</p><span>Compress →</span></button>
      <button class="studio-card-v37" onclick="nameDateTool()"><b>🏷️</b><h3>Name & Date Photo</h3><p>Add name, date, or custom text below a photo.</p><span>Create →</span></button>
      <button class="studio-card-v37" onclick="imageResizeToolV37()"><b>📏</b><h3>Resize Image</h3><p>Resize photo by width and height while keeping quality.</p><span>Resize →</span></button>
      <button class="studio-card-v37" onclick="imageConvertToolV37()"><b>🔄</b><h3>Image Converter</h3><p>Convert image output to JPG, PNG, or WEBP.</p><span>Convert →</span></button>
      <button class="studio-card-v37" onclick="photoSizeLibraryV37()"><b>📚</b><h3>Photo Size Library</h3><p>Passport, 2×2 inch, visa sizes, ID photo sizes, and custom dimensions.</p><span>View Sizes →</span></button>
    </div>`;
}

function photoSizeLibraryV37(){
  workspace.innerHTML = `
    ${studioHeroV37('Photo Size Library', 'Choose a standard photo size and then open Passport Studio to crop and print.')}
    <div class="size-library-v37">
      ${[
        ['Passport India','35 × 45 mm','Best for Indian passport style prints'],
        ['2 × 2 Inch','51 × 51 mm','Common visa and ID photo format'],
        ['1 × 1 Inch','25 × 25 mm','Small ID photo format'],
        ['US Visa','2 × 2 inch','US visa-ready size'],
        ['Canada Visa','35 × 45 mm','Canada visa/passport style'],
        ['UK Passport','35 × 45 mm','UK passport style photo'],
        ['Schengen Visa','35 × 45 mm','Schengen visa photo'],
        ['OCI Photo','51 × 51 mm','OCI application style size'],
        ['Custom Size','User-defined','Custom size foundation for future release']
      ].map(x=>`<div class="size-card-v37"><h3>${x[0]}</h3><strong>${x[1]}</strong><p>${x[2]}</p><button class="secondary-btn" onclick="passportTool()">Use in Studio</button></div>`).join('')}
    </div>`;
}

function imageResizeToolV37(){
  workspace.innerHTML = `
    ${studioHeroV37('Resize Image', 'Resize an image to a custom width and height. This is a v37 alpha image utility.')}
    <div class="tool-box">
      <label class="upload-box"><input id="resizeImageV37" type="file" accept="image/*"><span>📤 Upload Image</span></label>
      <div class="row"><input id="resizeWv37" type="number" placeholder="Width px"><input id="resizeHv37" type="number" placeholder="Height px"></div>
      <button onclick="makeResizeV37()">Resize Image</button>
    </div><div id="resizeOutputV37"></div>`;
}
async function makeResizeV37(){
  const f=document.getElementById('resizeImageV37')?.files?.[0]; if(!f) return alert('Please upload an image.');
  const w=Number(document.getElementById('resizeWv37').value), h=Number(document.getElementById('resizeHv37').value); if(!w||!h) return alert('Enter width and height.');
  const img=await loadImage(await readFile(f)); const c=document.createElement('canvas'),ctx=c.getContext('2d'); c.width=w;c.height=h;ctx.fillStyle='#fff';ctx.fillRect(0,0,w,h);ctx.drawImage(img,0,0,w,h); const data=c.toDataURL('image/jpeg',.92);
  document.getElementById('resizeOutputV37').innerHTML=`<div class="result-card"><h3>✅ Image Resized</h3><img class="preview-img" src="${data}"><button class="download-btn" onclick="forceDownload('${data}','resized-image.jpg')">Download Image</button></div>`;
  if(typeof logToolUsage==='function') logToolUsage('Image Resize v37',{fileName:f.name,toolType:'Image'});
}

function imageConvertToolV37(){
  workspace.innerHTML = `
    ${studioHeroV37('Image Converter', 'Convert an image into JPG, PNG, or WEBP format directly in the browser.')}
    <div class="tool-box">
      <label class="upload-box"><input id="convertImageV37" type="file" accept="image/*"><span>📤 Upload Image</span></label>
      <select id="convertFormatV37"><option value="image/jpeg">JPG</option><option value="image/png">PNG</option><option value="image/webp">WEBP</option></select>
      <button onclick="makeConvertV37()">Convert Image</button>
    </div><div id="convertOutputV37"></div>`;
}
async function makeConvertV37(){
  const f=document.getElementById('convertImageV37')?.files?.[0]; if(!f) return alert('Please upload an image.');
  const fmt=document.getElementById('convertFormatV37').value; const img=await loadImage(await readFile(f)); const c=document.createElement('canvas'),ctx=c.getContext('2d'); c.width=img.width;c.height=img.height;ctx.drawImage(img,0,0); const data=c.toDataURL(fmt,.92); const ext=fmt.includes('png')?'png':fmt.includes('webp')?'webp':'jpg';
  document.getElementById('convertOutputV37').innerHTML=`<div class="result-card"><h3>✅ Image Converted</h3><p>Format: ${ext.toUpperCase()}</p><img class="preview-img" src="${data}"><button class="download-btn" onclick="forceDownload('${data}','converted-image.${ext}')">Download ${ext.toUpperCase()}</button></div>`;
  if(typeof logToolUsage==='function') logToolUsage('Image Converter v37',{fileName:f.name,toolType:'Image'});
}

function documentStudioTool(){
  workspace.innerHTML = `
    ${studioHeroV37('Document Studio', 'Print Aadhaar, Voter ID, PAN, Ayushman, Driving Licence, and ABHA cards from images in one universal card engine.')}
    <div class="doc-type-grid-v37">
      ${Object.entries(V37_CARD_TYPES).map(([key,c])=>`<button class="doc-type-card-v37 ${key===v37SelectedCardType?'active':''}" onclick="selectDocTypeV37('${key}')"><b>${c.icon}</b><span>${c.label}</span></button>`).join('')}
    </div>
    <div id="docStudioBoxV37"></div>`;
  renderDocStudioBoxV37();
}
function selectDocTypeV37(type){v37SelectedCardType=type;documentStudioTool();}
function renderDocStudioBoxV37(){
  const c=V37_CARD_TYPES[v37SelectedCardType];
  const box=document.getElementById('docStudioBoxV37'); if(!box) return;
  box.innerHTML = `
    <div class="doc-workbench-v37">
      <div class="tool-box">
        <h3>${c.icon} ${c.label} Print</h3>
        <p class="tool-subtitle">${c.note}</p>
        <label>Front Image</label><input id="docFrontV37" type="file" accept="image/*">
        <label>Back Image optional</label><input id="docBackV37" type="file" accept="image/*">
        <div class="row"><select id="docCopiesV37"><option value="1">1 Copy</option><option value="2">2 Copies</option><option value="4">4 Copies</option><option value="6">6 Copies</option><option value="8">8 Copies</option></select><select id="docPositionV37"><option value="top-center">Top Center</option><option value="top-left">Top Left</option></select></div>
        <button onclick="makeDocumentCardPDFV37()">Create Print PDF</button>
      </div>
      <div id="docOutputV37"></div>
    </div>`;
}
async function makeDocumentCardPDFV37(){
  const front=document.getElementById('docFrontV37')?.files?.[0]; const back=document.getElementById('docBackV37')?.files?.[0]; if(!front && !back) return alert('Please upload front or back image.');
  const srcs=[]; if(front) srcs.push(await readFile(front)); if(back) srcs.push(await readFile(back));
  const copies=Number(document.getElementById('docCopiesV37').value||1); const pos=document.getElementById('docPositionV37').value||'top-center'; const card=V37_CARD_TYPES[v37SelectedCardType];
  const pdf=await createV37CardPDF(srcs,copies,pos,card); const url=URL.createObjectURL(pdf.output('blob'));
  let preview=''; for(let i=0;i<copies;i++){srcs.forEach(s=>preview+=`<img class="aadhaar-card" src="${s}">`)}
  document.getElementById('docOutputV37').innerHTML=`<div class="result-card"><div class="action-row"><a class="open-btn" href="${url}" target="_blank">📂 Open PDF</a><a class="pdf-btn" href="${url}" download="${card.label.replace(/\s+/g,'-').toLowerCase()}-print.pdf">📄 Download PDF</a></div><div class="passport-final-note">✅ ${card.label} print-ready A4 PDF created.</div><div class="print-area ${pos}"><div class="aadhaar-wrap">${preview}</div></div></div>`;
  if(typeof logToolUsage==='function') logToolUsage(card.label+' Print v37',{toolType:'PDF'});
}
async function createV37CardPDF(srcs,copies,pos,card){
  const { jsPDF } = window.jspdf; const pdf=new jsPDF({orientation:'portrait',unit:'mm',format:'a4'}); let y=10; const gap=8;
  for(let copy=0; copy<copies; copy++){
    const dims=srcs.map(s=>({src:s,w:card.w,h:card.h})); const totalW=dims.reduce((a,d)=>a+d.w,0)+(dims.length-1)*gap; let x=pos==='top-left'?10:(210-totalW)/2;
    for(const d of dims){pdf.addImage(d.src,'JPEG',x,y,d.w,d.h);pdf.setDrawColor(50);pdf.setLineWidth(.25);pdf.rect(x,y,d.w,d.h);x+=d.w+gap;}
    y += card.h + 8; if(y>250 && copy<copies-1){pdf.addPage();y=10;}
  }
  return pdf;
}

function pdfStudioTool(){
  workspace.innerHTML = `
    ${studioHeroV37('PDF Studio', 'PDF tools grouped into one workspace. Resize is active; merge/split/rotate are planned for the next v37 beta sprint.')}
    <div class="studio-grid-v37"><button class="studio-card-v37 primary-studio" onclick="pdfResizerTool()"><b>📄</b><h3>PDF Resize / Compress</h3><p>Use the current browser-based PDF resizing tool.</p><span>Open Tool →</span></button><button class="studio-card-v37 locked-v37"><b>🔗</b><h3>Merge PDF</h3><p>Coming in v37.2 beta.</p><span>Planned</span></button><button class="studio-card-v37 locked-v37"><b>✂️</b><h3>Split PDF</h3><p>Coming in v37.2 beta.</p><span>Planned</span></button><button class="studio-card-v37 locked-v37"><b>🔄</b><h3>Rotate PDF</h3><p>Coming in v37.2 beta.</p><span>Planned</span></button></div>`;
}

const _v37PrevOpenTool = openTool;
openTool = function(tool){
  setActive(tool);
  if(tool==='imageStudio') return imageStudioTool();
  if(tool==='documentStudio') return documentStudioTool();
  if(tool==='pdfStudio') return pdfStudioTool();
  return _v37PrevOpenTool(tool);
};

// v37 final sidebar repair for older cached DOM.
setTimeout(()=>{try{
  const sidebar=document.getElementById('sidebar'); if(!sidebar) return;
  const oldTools=['compressor','namedate','passport','aadhaar','pdfresizer'];
  oldTools.forEach(t=>{const el=sidebar.querySelector(`[data-tool="${t}"]`); if(el) el.remove();});
  const homeBtn=sidebar.querySelector('[data-tool="home"]');
  const add=(tool,text)=>{if(sidebar.querySelector(`[data-tool="${tool}"]`))return; const b=document.createElement('button'); b.className='nav-item'; b.dataset.tool=tool; b.textContent=text; b.onclick=()=>openTool(tool); homeBtn?.after(b);};
  add('pdfStudio','📄 PDF Studio'); add('documentStudio','🪪 Document Studio'); add('imageStudio','🖼️ Image Studio');
  if(typeof updateAuthUI==='function') updateAuthUI();
}catch(e){console.warn('v37 sidebar repair skipped',e)}},500);

const _v37Home = home;
home = function(){
  workspace.innerHTML = `
    ${studioHeroV37('Smart Photo Toolkit Enterprise v37', 'Final architecture alpha: Image Studio, Document Studio, PDF Studio, Account, Premium, and Admin are now organized for long-term expansion.')}
    <div class="studio-grid-v37">
      <button class="studio-card-v37 primary-studio" onclick="openTool('imageStudio')"><b>🖼️</b><h3>Image Studio</h3><p>Passport Photo Studio, compressor, resize, converter, and name/date tools.</p><span>Open Image Studio →</span></button>
      <button class="studio-card-v37" onclick="openTool('documentStudio')"><b>🪪</b><h3>Document Studio</h3><p>Aadhaar, Voter ID, PAN, Ayushman, Driving Licence, and ABHA print layouts.</p><span>Open Document Studio →</span></button>
      <button class="studio-card-v37" onclick="openTool('pdfStudio')"><b>📄</b><h3>PDF Studio</h3><p>PDF resize is active. Merge, split, and rotate are planned next.</p><span>Open PDF Studio →</span></button>
      <button class="studio-card-v37" onclick="openTool('dashboard')"><b>👤</b><h3>Account Workspace</h3><p>Profile, membership, payments, activity, and future download history.</p><span>Open Account →</span></button>
    </div>
    <div class="v37-status"><h3>v37.0 Alpha Changelog</h3><p>Image Studio architecture added, Passport Studio grouped under Image Studio, Document Studio added with Aadhaar/Voter/PAN/Ayushman/DL/ABHA print support, and PDF tools grouped under PDF Studio.</p></div>`;
};


/* =====================================================
   v37.1 ALPHA FIX – Final Architecture Hard Override
   This block forces Image Studio / Document Studio / PDF Studio
   to appear even if older v35/v36 cached overrides were loaded.
===================================================== */
(function(){
  function ensureV37NavFinal(){
    const sidebar=document.getElementById('sidebar');
    if(!sidebar) return;
    const oldTools=['compressor','namedate','passport','aadhaar','pdfresizer'];
    oldTools.forEach(t=>{ const el=sidebar.querySelector(`[data-tool="${t}"]`); if(el) el.remove(); });
    const homeBtn=sidebar.querySelector('[data-tool="home"]');
    const desired=[
      ['imageStudio','🖼️ Image Studio'],
      ['documentStudio','🪪 Document Studio'],
      ['pdfStudio','📄 PDF Studio']
    ];
    // Insert in correct order after Home
    let anchor=homeBtn;
    desired.forEach(([tool,text])=>{
      let btn=sidebar.querySelector(`[data-tool="${tool}"]`);
      if(!btn){
        btn=document.createElement('button');
        btn.className='nav-item';
        btn.dataset.tool=tool;
      }
      btn.textContent=text;
      btn.onclick=()=>openTool(tool);
      if(anchor && anchor.nextSibling!==btn) sidebar.insertBefore(btn, anchor.nextSibling);
      anchor=btn;
    });
    if(typeof updateAuthUI==='function') updateAuthUI();
  }

  const previousOpenTool = window.openTool || openTool;
  window.openTool = openTool = function(tool){
    const user = typeof getCurrentUser==='function' ? getCurrentUser() : (window.SPT && SPT.user);
    if(['dashboard','payment','premium'].includes(tool) && !user){ setActive('login'); return loginTool(); }
    if(tool==='admin' && typeof userIsAdminAccount==='function' && !userIsAdminAccount(user)){
      setActive(user ? 'dashboard' : 'login');
      workspace.innerHTML = `<h2>Admin Panel</h2><div class="warning-box">Admin access is available only after signing in with the authorized administrator account.</div><button class="primary-btn" onclick="showTool('login')">Login</button>`;
      return;
    }
    setActive(tool);
    if(tool==='imageStudio') return imageStudioTool();
    if(tool==='documentStudio') return documentStudioTool();
    if(tool==='pdfStudio') return pdfStudioTool();
    if(tool==='compressor') return imageStudioTool();
    if(tool==='namedate') return imageStudioTool();
    if(tool==='passport') return passportTool();
    if(tool==='aadhaar') return documentStudioTool();
    return previousOpenTool(tool);
  };

  window.home = home = function(){
    workspace.innerHTML = `
      ${typeof studioHeroV37==='function' ? studioHeroV37('Smart Photo Toolkit Enterprise v37.1', 'Final architecture alpha is active: Image Studio, Document Studio, PDF Studio, Account, Premium and Admin are now grouped for long-term expansion.') : '<h2>Smart Photo Toolkit Enterprise v37.1</h2>'}
      <div class="studio-grid-v37">
        <button class="studio-card-v37 primary-studio" onclick="openTool('imageStudio')"><b>🖼️</b><h3>Image Studio</h3><p>Passport Photo Studio, compressor, resize, converter, and name/date tools.</p><span>Open Image Studio →</span></button>
        <button class="studio-card-v37" onclick="openTool('documentStudio')"><b>🪪</b><h3>Document Studio</h3><p>Aadhaar, Voter ID, PAN, Ayushman, Driving Licence, and ABHA print layouts.</p><span>Open Document Studio →</span></button>
        <button class="studio-card-v37" onclick="openTool('pdfStudio')"><b>📄</b><h3>PDF Studio</h3><p>PDF resize is active. Merge, split, and rotate will be added in the next beta sprint.</p><span>Open PDF Studio →</span></button>
        <button class="studio-card-v37" onclick="openTool('dashboard')"><b>👤</b><h3>Account Workspace</h3><p>Profile, membership, payments, activity, and future download history.</p><span>Open Account →</span></button>
      </div>
      <div class="v37-status"><h3>v37.1 Alpha Fix</h3><p>Home and sidebar now force the new architecture. Passport is inside Image Studio, and Document Studio includes Aadhaar, Voter ID, PAN, Ayushman, Driving Licence, and ABHA print support.</p></div>`;
  };

  window.addEventListener('load',()=>{
    setTimeout(()=>{ ensureV37NavFinal(); home(); },700);
  });
})();
