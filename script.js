/* Smart Photo Toolkit Pro v27 - script.js */

const SPT_API_URL =
  window.SPT_CONFIG?.apiUrl ||
  "https://script.google.com/macros/s/AKfycbzNel2GhBCLmvCt6kH75uODdsYhLnwhFlYb-3tBi3ubLtbvdi9HdGpDLt6SEXaaIJJC3A/exec";

const SPT = {
  token: localStorage.getItem("spt_token") || "",
  user: JSON.parse(localStorage.getItem("spt_user") || "null"),

  async api(action, data = {}) {
    try {
      const res = await fetch(SPT_API_URL, {
        method: "POST",
        body: JSON.stringify({ action, data }),
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
  },

  logout() {
    localStorage.removeItem("spt_user");
    localStorage.removeItem("spt_token");
    this.user = null;
    this.token = "";
    toast("Logout successful");
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

function requireLogin() {
  if (!SPT.token) {
    toast("Please login first");
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
  const name = val("signupName");
  const email = val("signupEmail");
  const password = val("signupPassword");
  const mobile = val("signupMobile");

  if (!name || !email || !password) return toast("Name, email, password required");

  const r = await SPT.api("signup", { name, email, password, mobile });

  if (!r.success) return toast(r.message);

  SPT.saveLogin(r.user, r.token);
  toast("Signup successful");
  showTool("dashboard");
}

async function loginSubmit() {
  const email = val("loginEmail");
  const password = val("loginPassword");

  if (!email || !password) return toast("Email and password required");

  const r = await SPT.api("login", { email, password });

  if (!r.success) return toast(r.message);

  SPT.saveLogin(r.user, r.token);
  toast("Login successful");
  showTool("dashboard");
}

async function forgotSubmit() {
  const email = val("forgotEmail");
  if (!email) return toast("Email required");

  const r = await SPT.api("forgotPassword", { email });
  toast(r.message);
}

async function resetSubmit() {
  const email = val("resetEmail");
  const otp = val("resetOtp");
  const password = val("resetPassword");

  if (!email || !otp || !password) return toast("Email, OTP, new password required");

  const r = await SPT.api("resetPassword", { email, otp, newPassword: password });
  toast(r.message);

  if (r.success) showTool("login");
}

async function submitFeedback() {
  const message = val("feedbackMessage");
  if (!message) return toast("Message required");

  const r = await SPT.api("feedback", {
    token: SPT.token,
    name: SPT.user?.name || val("feedbackName"),
    email: SPT.user?.email || val("feedbackEmail"),
    message,
    type: val("feedbackType") || "Feedback"
  });

  toast(r.message);
}

async function submitPayment() {
  if (!requireLogin()) return;

  const r = await SPT.api("submitPayment", {
    token: SPT.token,
    planName: val("paymentPlan"),
    amount: val("paymentAmount"),
    method: val("paymentMethod"),
    transactionId: val("paymentTxn"),
    screenshotUrl: val("paymentScreenshot")
  });

  toast(r.message);
}

async function loadAdminStats() {
  if (!requireLogin()) return;
  if (!isAdmin()) return toast("Admin only");

  const r = await SPT.api("adminStats", { token: SPT.token });
  if (!r.success) return toast(r.message);

  const s = r.stats;
  html("adminContent", `
    <div class="stats">
      <div><strong>Total Users</strong><span>${s.totalUsers}</span></div>
      <div><strong>Active Users</strong><span>${s.activeUsers}</span></div>
      <div><strong>Premium Users</strong><span>${s.premiumUsers}</span></div>
      <div><strong>Total Usage</strong><span>${s.totalUsage}</span></div>
      <div><strong>Pending Payments</strong><span>${s.pendingPayments}</span></div>
      <div><strong>Revenue</strong><span>₹${s.revenue}</span></div>
    </div>
  `);
}

async function loadUsers() {
  if (!requireLogin()) return;
  if (!isAdmin()) return toast("Admin only");

  const r = await SPT.api("listUsers", { token: SPT.token });
  if (!r.success) return toast(r.message);

  html("adminContent", `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Name</th><th>Email</th><th>Role</th><th>Premium</th><th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${r.users.map(u => `
            <tr>
              <td>${u.name}</td>
              <td>${u.email}</td>
              <td>${u.role}</td>
              <td>${u.premium}</td>
              <td>${u.status}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `);
}

async function loadPayments() {
  if (!requireLogin()) return;
  if (!isAdmin()) return toast("Admin only");

  const r = await SPT.api("listPayments", { token: SPT.token });
  if (!r.success) return toast(r.message);

  html("adminContent", `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Email</th><th>Plan</th><th>Amount</th><th>Txn</th><th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${r.payments.map(p => `
            <tr>
              <td>${p.Email}</td>
              <td>${p.PlanName}</td>
              <td>₹${p.Amount}</td>
              <td>${p.TransactionID}</td>
              <td>${p.Status}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `);
}

async function logToolUsage(tool, extra = {}) {
  await SPT.api("logUsage", {
    token: SPT.token,
    tool,
    toolType: extra.toolType || "Image/PDF",
    fileName: extra.fileName || "",
    originalSizeKB: extra.originalSizeKB || "",
    outputSizeKB: extra.outputSizeKB || "",
    targetSizeKB: extra.targetSizeKB || ""
  });
}

function val(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : "";
}

function html(id, content) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = content;
}
