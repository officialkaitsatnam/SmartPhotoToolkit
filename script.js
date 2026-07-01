/* Smart Photo Toolkit Pro v32 - script.js */
const SPT_API_URL = window.SPT_CONFIG?.apiUrl || "https://script.google.com/macros/s/AKfycbzNel2GhBCLmvCt6kH75uODdsYhLnwhFlYb-3tBi3ubLtbvdi9HdGpDLt6SEXaaIJJC3A/exec";

const SPT = {
  token: localStorage.getItem("spt_token") || "",
  user: JSON.parse(localStorage.getItem("spt_user") || "null"),

  async api(action, data = {}) {
    try {
      const res = await fetch(SPT_API_URL, {
        method: "POST",
        body: JSON.stringify({ action, data })
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: err.message || "Network error" };
    }
  },

  saveLogin(user, token) {
    this.user = user;
    this.token = token;
    localStorage.setItem("spt_user", JSON.stringify(user));
    localStorage.setItem("spt_token", token);
    if (typeof updateAuthUI === "function") updateAuthUI();
  },

  logout() {
    localStorage.removeItem("spt_user");
    localStorage.removeItem("spt_token");
    this.user = null;
    this.token = "";
    toast("Logout successful");
    if (typeof updateAuthUI === "function") updateAuthUI();
    showTool("login");
  }
};

function toast(msg) {
  let t = document.getElementById("toast");
  if (!t) {
    t = document.createElement("div");
    t.id = "toast";
    t.className = "toast";
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2600);
}

function setBusy(btn, text = "Processing...") {
  if (!btn) return;
  btn.dataset.oldText = btn.innerHTML;
  btn.innerHTML = `⏳ ${text}`;
  btn.disabled = true;
  btn.classList.add("is-busy");
}

function clearBusy(btn) {
  if (!btn) return;
  btn.innerHTML = btn.dataset.oldText || btn.innerHTML;
  btn.disabled = false;
  btn.classList.remove("is-busy");
}

function requireLogin() {
  if (!SPT.token) {
    toast("Please login to continue");
    showTool("login");
    return false;
  }
  return true;
}

function isAdmin() {
  return SPT.user && String(SPT.user.role).toLowerCase() === "admin";
}

function appUserName() {
  return SPT.user ? SPT.user.name : "Guest";
}

async function signupSubmit() {
  const btn = event?.target;
  const name = val("signupName"), email = val("signupEmail"), password = val("signupPassword"), mobile = val("signupMobile"), address = val("signupAddress");
  if (!name || !email || !mobile || !address || !password) return toast("Please complete all required fields: name, email, mobile, address, and password.");
  setBusy(btn, "Creating account...");
  const r = await SPT.api("signup", { name, email, password, mobile, address });
  clearBusy(btn);
  if (!r.success) return toast(r.message);
  SPT.saveLogin(r.user, r.token);
  toast("Account created successfully");
  showTool("dashboard");
}

async function loginSubmit() {
  const btn = event?.target;
  const email = val("loginEmail"), password = val("loginPassword");
  if (!email || !password) return toast("Email and password required");
  setBusy(btn, "Logging in...");
  const r = await SPT.api("login", { email, password });
  clearBusy(btn);
  if (!r.success) return toast(r.message);
  SPT.saveLogin(r.user, r.token);
  toast("Login successful");
  showTool("dashboard");
}

async function forgotSubmit() {
  const btn = event?.target;
  const email = val("forgotEmail");
  if (!email) return toast("Email required");
  setBusy(btn, "Sending OTP...");
  const r = await SPT.api("forgotPassword", { email });
  clearBusy(btn);
  toast(r.message);
}

async function resetSubmit() {
  const btn = event?.target;
  const email = val("resetEmail"), otp = val("resetOtp"), password = val("resetPassword");
  if (!email || !otp || !password) return toast("Email, OTP, new password required");
  setBusy(btn, "Resetting...");
  const r = await SPT.api("resetPassword", { email, otp, newPassword: password });
  clearBusy(btn);
  toast(r.message);
  if (r.success) showTool("login");
}

async function submitFeedback() {
  const btn = event?.target;
  const message = val("feedbackMessage");
  if (!message) return toast("Message required");
  setBusy(btn, "Submitting...");
  const r = await SPT.api("feedback", {
    token: SPT.token,
    name: SPT.user?.name || val("feedbackName"),
    email: SPT.user?.email || val("feedbackEmail"),
    message,
    type: val("feedbackType") || "Feedback"
  });
  clearBusy(btn);
  toast(r.message);
  if (r.success) showTool("feedback");
}

async function submitPayment() {
  if (!requireLogin()) return;
  const btn = event?.target;
  const txn = val("paymentTxn");
  if (!txn) return toast("Please enter the Transaction ID / UTR number");
  setBusy(btn, "Activating premium...");
  const r = await SPT.api("submitPayment", {
    token: SPT.token,
    planName: val("paymentPlan"),
    amount: val("paymentAmount"),
    method: val("paymentMethod"),
    transactionId: txn,
    screenshotUrl: val("paymentScreenshot")
  });
  clearBusy(btn);
  toast(r.message);
  if (r.success && r.user) {
    SPT.saveLogin(r.user, SPT.token);
    showTool("dashboard");
  } else if (r.success) {
    showTool("dashboard");
  }
}

async function loadAdminStats() {
  if (!requireLogin()) return;
  if (!isAdmin()) return toast("Admin only");
  html("adminContent", `<div class="progress-box">⏳ Loading stats...</div>`);
  const r = await SPT.api("adminStats", { token: SPT.token });
  if (!r.success) return html("adminContent", `<div class="warning-box">${r.message}</div>`);
  const s = r.stats;
  html("adminContent", `<div class="stats fade-in"><div><strong>Total Users</strong><span>${s.totalUsers}</span></div><div><strong>Active Users</strong><span>${s.activeUsers}</span></div><div><strong>Premium Users</strong><span>${s.premiumUsers}</span></div><div><strong>Total Usage</strong><span>${s.totalUsage}</span></div><div><strong>Pending Payments</strong><span>${s.pendingPayments}</span></div><div><strong>Revenue</strong><span>₹${s.revenue}</span></div></div>`);
}

async function loadUsers() {
  if (!requireLogin()) return;
  if (!isAdmin()) return toast("Admin only");
  html("adminContent", `<div class="progress-box">⏳ Loading users...</div>`);
  const r = await SPT.api("listUsers", { token: SPT.token });
  if (!r.success) return html("adminContent", `<div class="warning-box">${r.message}</div>`);
  html("adminContent", `<div class="table-wrap fade-in"><table><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Plan</th><th>Premium</th><th>Status</th></tr></thead><tbody>${r.users.map(u => `<tr><td>${u.name || "-"}</td><td>${u.email || "-"}</td><td>${u.role || "User"}</td><td>${u.plan || "Free"}</td><td>${u.premium || "No"}</td><td>${u.status || "Active"}</td></tr>`).join("")}</tbody></table></div>`);
}

async function loadPayments() {
  if (!requireLogin()) return;
  if (!isAdmin()) return toast("Admin only");
  html("adminContent", `<div class="progress-box">⏳ Loading payments...</div>`);
  const r = await SPT.api("listPayments", { token: SPT.token });
  if (!r.success) return html("adminContent", `<div class="warning-box">${r.message}</div>`);
  const rows = (r.payments || []).map(p => {
    const status = String(p.Status || "Pending");
    const cls = status.toLowerCase() === "verified" ? "green" : status.toLowerCase() === "rejected" ? "red" : "orange";
    return `<tr>
      <td>${p.Email || "-"}</td><td>${p.PlanName || "-"}</td><td>₹${p.Amount || "-"}</td><td>${p.TransactionID || "-"}</td><td><span class="badge ${cls}">${status}</span></td>
      <td>${p.CreatedAt || "-"}</td>
      <td class="admin-actions">
        <button class="admin-mini-btn admin-approve" onclick="verifyPaymentAdmin('${p.PaymentID}','Verified')">Approve</button>
        <button class="admin-mini-btn admin-reject" onclick="verifyPaymentAdmin('${p.PaymentID}','Rejected')">Reject</button>
      </td>
    </tr>`;
  }).join("");
  html("adminContent", `<div class="table-wrap fade-in"><table><thead><tr><th>Email</th><th>Plan</th><th>Amount</th><th>Txn/UTR</th><th>Status</th><th>Date</th><th>Action</th></tr></thead><tbody>${rows || `<tr><td colspan="7">No payment requests yet</td></tr>`}</tbody></table></div>`);
}

async function verifyPaymentAdmin(paymentId, status) {
  if (!paymentId) return toast("Payment ID missing");
  const btn = event?.target;
  setBusy(btn, status === "Verified" ? "Approving..." : "Rejecting...");
  const r = await SPT.api("verifyPayment", { token: SPT.token, paymentId, status });
  clearBusy(btn);
  toast(r.message);
  loadPayments();
  setTimeout(() => { if (typeof loadAdminStats === "function") loadAdminStats(); }, 300);
}

async function loadFeedbacks() {
  if (!requireLogin()) return;
  if (!isAdmin()) return toast("Admin only");
  html("adminContent", `<div class="progress-box">⏳ Loading feedback...</div>`);
  const r = await SPT.api("listFeedback", { token: SPT.token });
  if (!r.success) return html("adminContent", `<div class="warning-box">${r.message}</div>`);
  const rows = (r.feedback || []).map(f => `<tr><td>${f.Name || "-"}</td><td>${f.Email || "-"}</td><td>${f.Type || "Feedback"}</td><td>${f.Message || "-"}</td><td>${f.CreatedAt || "-"}</td></tr>`).join("");
  html("adminContent", `<div class="table-wrap fade-in"><table><thead><tr><th>Name</th><th>Email</th><th>Type</th><th>Message</th><th>Date</th></tr></thead><tbody>${rows || `<tr><td colspan="5">No feedback yet</td></tr>`}</tbody></table></div>`);
}

async function logToolUsage(tool, extra = {}) {
  await SPT.api("logUsage", { token: SPT.token, tool, toolType: extra.toolType || "Image/PDF", fileName: extra.fileName || "", originalSizeKB: extra.originalSizeKB || "", outputSizeKB: extra.outputSizeKB || "", targetSizeKB: extra.targetSizeKB || "" });
}

function val(id) { const el = document.getElementById(id); return el ? el.value.trim() : ""; }
function html(id, content) { const el = document.getElementById(id); if (el) el.innerHTML = content; }


/* v32 Enterprise helper functions */
async function updateFeedbackReplyV32(feedbackId){
  if(!requireLogin()||!isAdmin()) return;
  const reply=prompt("Enter admin reply"); if(reply===null) return;
  const r=await SPT.api("adminReplyFeedback",{token:SPT.token,feedbackId,reply});
  toast(r.message); if(r.success) loadFeedbacks();
}

/* v40 Auth UX backend bridge overrides */
function v40BridgeUser(){try{return SPT.user || JSON.parse(localStorage.getItem('spt_user')||'null')}catch(e){return null}}
async function loginSubmit(){
  const email=val('loginEmail'), password=val('loginPassword');
  if(!email||!password){if(typeof setAuthStatus==='function')setAuthStatus('Email and password required');return toast('Email and password required')}
  if(typeof setAuthStatus==='function')setAuthStatus('Signing in...'); if(typeof showLoading==='function')showLoading('Signing in...');
  const r=await SPT.api('login',{email,password}); if(typeof hideLoading==='function')hideLoading();
  if(!r.success){if(typeof setAuthStatus==='function')setAuthStatus(r.message||'Login failed');return toast(r.message||'Login failed')}
  SPT.saveLogin(r.user,r.token); if(typeof closeAuthModal==='function')closeAuthModal(); if(typeof updateAuthUI==='function')updateAuthUI(); toast('Login successful'); showTool(document.getElementById('authModalBackdrop')?.dataset.nextTool||'dashboard');
}
async function signupSubmit(){
  const name=val('signupName'), email=val('signupEmail'), mobile=val('signupMobile'), address=val('signupAddress'), password=val('signupPassword'), confirm=val('signupConfirm');
  if(!name||!email||!mobile||!address||!password)return toast('Please fill all details'); if(confirm && password!==confirm)return toast('Passwords do not match');
  if(typeof setAuthStatus==='function')setAuthStatus('Creating account...'); if(typeof showLoading==='function')showLoading('Creating account...');
  const r=await SPT.api('signup',{name,email,mobile,address,password}); if(typeof hideLoading==='function')hideLoading();
  if(!r.success){if(typeof setAuthStatus==='function')setAuthStatus(r.message||'Signup failed');return toast(r.message||'Signup failed')}
  SPT.saveLogin(r.user,r.token); if(typeof closeAuthModal==='function')closeAuthModal(); if(typeof updateAuthUI==='function')updateAuthUI(); toast('Account created successfully'); showTool('dashboard');
}
async function forgotSubmit(){
  const email=val('forgotEmail'); if(!email)return toast('Email required'); if(typeof setAuthStatus==='function')setAuthStatus('Sending OTP...'); if(typeof showLoading==='function')showLoading('Sending OTP...');
  const r=await SPT.api('forgotPassword',{email}); if(typeof hideLoading==='function')hideLoading(); if(typeof setAuthStatus==='function')setAuthStatus(r.message||'OTP request sent'); toast(r.message||'OTP request sent');
}
async function resetSubmit(){
  const email=val('resetEmail'), otp=val('resetOtp'), password=val('resetPassword'); if(!email||!otp||!password)return toast('Email, OTP and password required'); if(typeof showLoading==='function')showLoading('Resetting password...');
  const r=await SPT.api('resetPassword',{email,otp,newPassword:password}); if(typeof hideLoading==='function')hideLoading(); toast(r.message||'Password reset request completed'); if(r.success && typeof switchAuthMode==='function')switchAuthMode('login');
}
function logoutOrLogin(){
  if(SPT.token || localStorage.getItem('spt_token')){ if(!confirm('Logout from Smart Photo Toolkit?'))return; localStorage.removeItem('spt_user');localStorage.removeItem('spt_token');SPT.user=null;SPT.token=''; if(typeof updateAuthUI==='function')updateAuthUI(); toast('Logout successful'); showTool('home'); }
  else if(typeof openAuthModal==='function')openAuthModal('login'); else showTool('login');
}
