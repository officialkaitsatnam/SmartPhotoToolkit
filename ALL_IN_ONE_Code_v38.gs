/** Smart Photo Toolkit Pro v36 Enterprise Backend - Apps Script */
/*******************************************************
 * Smart Photo Toolkit Pro - v36 Backend
 * Paste this complete file in Apps Script as Code.gs / ALL_IN_ONE_Code.gs
 *******************************************************/

const APP = {
  NAME: "Smart Photo Toolkit Pro",
  VERSION: "v36",
  ADMIN_EMAILS: ["kaitsatnam@gmail.com"],
  DEFAULT_FREE_USES: 10,
  SESSION_DAYS: 30,
  RESET_OTP_MINUTES: 15,
  SUPPORT_EMAIL: "kaitsatnam@gmail.com"
};

const SHEETS = {
  USERS: "Users",
  SESSIONS: "Sessions",
  TOOL_USAGE: "Tool_Usage",
  PAYMENTS: "Payments",
  FEEDBACK: "Feedback",
  ACTIVITY_LOGS: "Activity_Logs",
  PASSWORD_RESET: "Password_Reset",
  ERROR_LOGS: "Error_Logs",
  SETTINGS: "Settings",
  PREMIUM_PLANS: "Premium_Plans"
};

function doGet(e) {
  return jsonOutput(ok({ app: APP.NAME, version: APP.VERSION, status: "running", time: new Date() }, "API running"));
}

function doPost(e) {
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || "{}");
    const action = body.action;
    const data = body.data || {};
    const routes = {
      health, init: initializeDatabase, signup: signupUser, login: loginUser, logout: logoutUser, me: getMe,
      forgotPassword, resetPassword, logUsage, feedback: saveFeedback, listFeedback,
      submitPayment, adminStats: getAdminStats, listUsers, listPayments, verifyPayment, setPremium: setPremiumApi, updateProfile, paymentHistory, usageHistory, updateUserStatus, adminReplyFeedback
    };
    if (!routes[action]) return jsonOutput(fail("Invalid action: " + action));
    return jsonOutput(routes[action](data));
  } catch (err) {
    logError("doPost", err);
    return jsonOutput(fail(err.message));
  }
}

function health() { return ok({ app: APP.NAME, version: APP.VERSION, status: "healthy" }, "Health OK"); }

function initializeDatabase() {
  const headers = {
    Users: ["UserID", "Name", "Email", "PasswordHash", "Mobile", "Address", "Role", "Premium", "PremiumPlan", "PremiumStart", "PremiumEnd", "UsesLeft", "Status", "EmailVerified", "ProfileImage", "CreatedAt", "LastLogin", "UpdatedAt"],
    Sessions: ["SessionID", "UserID", "Email", "Token", "Device", "CreatedAt", "ExpiresAt", "Status"],
    Tool_Usage: ["UsageID", "UserID", "UserEmail", "UserName", "Tool", "ToolType", "Premium", "FileName", "OriginalSizeKB", "OutputSizeKB", "TargetSizeKB", "Status", "CreatedAt"],
    Payments: ["PaymentID", "UserID", "Email", "Name", "Mobile", "PlanName", "Amount", "Method", "TransactionID", "ScreenshotURL", "Status", "CreatedAt", "VerifiedAt", "VerifiedBy"],
    Feedback: ["FeedbackID", "UserID", "Name", "Email", "Message", "Type", "Status", "CreatedAt", "AdminReply"],
    Activity_Logs: ["LogID", "UserID", "Email", "Action", "Details", "CreatedAt"],
    Password_Reset: ["ResetID", "Email", "OTP", "Token", "ExpiresAt", "Used", "CreatedAt"],
    Error_Logs: ["ErrorID", "FunctionName", "Message", "Stack", "CreatedAt"],
    Settings: ["Key", "Value", "Description", "UpdatedAt"],
    Premium_Plans: ["PlanID", "PlanName", "Price", "DurationDays", "Features", "Status", "CreatedAt"]
  };
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  Object.keys(headers).forEach(name => {
    let sh = ss.getSheetByName(name);
    if (!sh) sh = ss.insertSheet(name);
    ensureHeaders(sh, headers[name]);
  });
  seedPlans();
  return ok({}, "Database initialized successfully");
}

function ensureHeaders(sh, required) {
  if (sh.getLastRow() === 0 || sh.getRange(1, 1).getValue() === "") {
    sh.clear();
    sh.getRange(1, 1, 1, required.length).setValues([required]);
    sh.getRange(1, 1, 1, required.length).setFontWeight("bold").setBackground("#2563eb").setFontColor("#ffffff");
    sh.setFrozenRows(1);
    return;
  }
  const current = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(String);
  required.forEach(h => {
    if (!current.includes(h)) {
      sh.getRange(1, sh.getLastColumn() + 1).setValue(h);
      sh.getRange(1, sh.getLastColumn()).setFontWeight("bold").setBackground("#2563eb").setFontColor("#ffffff");
    }
  });
}

function seedPlans() {
  const sh = getSheet(SHEETS.PREMIUM_PLANS);
  const existing = readObjs(SHEETS.PREMIUM_PLANS).map(p => String(p.PlanID));
  const plans = [
    ["PLAN_MONTHLY", "Monthly Premium", 49, 30, "Unlimited tools", "Active", new Date()],
    ["PLAN_HALF_YEAR", "Half Year Premium", 149, 180, "Unlimited tools", "Active", new Date()],
    ["PLAN_YEARLY", "Yearly Premium", 499, 365, "Unlimited tools", "Active", new Date()]
  ];
  plans.forEach(p => { if (!existing.includes(p[0])) sh.appendRow(p); });
}

function signupUser(d) {
  const name = clean(d.name), email = norm(d.email), password = String(d.password || d.pass || ""), mobile = clean(d.mobile || ""), address = clean(d.address || "");
  if (!name || !email || !mobile || !address || !password) return fail("Please complete name, email, mobile, address, and password.");
  if (password.length < 4) return fail("Password must be at least 4 characters long.");
  if (findRow(SHEETS.USERS, "Email", email)) return fail("This email address is already registered.");
  const role = APP.ADMIN_EMAILS.includes(email) ? "Admin" : "User";
  const user = {
    UserID: id("USR"), Name: name, Email: email, PasswordHash: hash(password), Mobile: mobile, Address: address, Role: role,
    Premium: role === "Admin" ? "Yes" : "No", PremiumPlan: role === "Admin" ? "Admin" : "Free", PremiumStart: role === "Admin" ? new Date() : "", PremiumEnd: "",
    UsesLeft: role === "Admin" ? "Unlimited" : APP.DEFAULT_FREE_USES, Status: "Active", EmailVerified: "No", ProfileImage: "", CreatedAt: new Date(), LastLogin: "", UpdatedAt: new Date()
  };
  appendObj(SHEETS.USERS, user);
  const token = createSession(user.UserID, email);
  logActivity(user.UserID, email, "SIGNUP", "New user registered");
  sendProfessionalEmail(email, "Welcome to Smart Photo Toolkit Pro", welcomeEmailHtml(user));
  sendAdminMail("New Account Created - Smart Photo Toolkit Pro", adminNewAccountHtml(user));
  return ok({ user: publicUser(user), token }, "Account created successfully.");
}

function loginUser(d) {
  const email = norm(d.email), password = String(d.password || d.pass || "");
  const f = findRow(SHEETS.USERS, "Email", email);
  if (!f) return fail("Invalid email address or password.");
  const user = rowObj(f);
  if (String(user.Status).toLowerCase() !== "active") return fail("Your account is currently blocked. Please contact support.");
  if (String(user.PasswordHash) !== hash(password)) return fail("Invalid email address or password.");
  updateObj(SHEETS.USERS, f.rowIndex, { LastLogin: new Date(), UpdatedAt: new Date() });
  const fresh = Object.assign({}, user, { LastLogin: new Date() });
  const token = createSession(user.UserID, email);
  logActivity(user.UserID, email, "LOGIN", "User logged in");
  return ok({ user: publicUser(fresh), token }, "Login successful.");
}

function logoutUser(d) {
  if (d.token) { const f = findRow(SHEETS.SESSIONS, "Token", d.token); if (f) updateObj(SHEETS.SESSIONS, f.rowIndex, { Status: "LoggedOut" }); }
  return ok({}, "Logout successful.");
}

function getMe(d) { const user = verifyToken(d.token); if (!user) return fail("Invalid session. Please login again."); return ok({ user: publicUser(user) }, "User profile loaded."); }

function forgotPassword(d) {
  const email = norm(d.email);
  if (!email) return fail("Email address is required.");
  const f = findRow(SHEETS.USERS, "Email", email);
  if (!f) return fail("No account was found with this email address.");
  const user = rowObj(f);
  const otp = String(Math.floor(100000 + Math.random() * 900000));
  const token = Utilities.getUuid();
  const expiresAt = new Date(Date.now() + APP.RESET_OTP_MINUTES * 60 * 1000);
  appendObj(SHEETS.PASSWORD_RESET, { ResetID: id("RST"), Email: email, OTP: otp, Token: token, ExpiresAt: expiresAt, Used: "No", CreatedAt: new Date() });
  sendProfessionalEmail(email, "Password Reset OTP - Smart Photo Toolkit Pro", passwordResetEmailHtml(user, otp));
  return ok({ resetToken: token }, "A password reset OTP has been sent to your email address.");
}

function resetPassword(d) {
  const email = norm(d.email), otp = String(d.otp || ""), newPassword = String(d.newPassword || d.password || "");
  if (!email || !otp || !newPassword) return fail("Email, OTP, and new password are required.");
  const resets = readObjs(SHEETS.PASSWORD_RESET).filter(r => String(r.Email).toLowerCase() === email && String(r.OTP) === otp && String(r.Used).toLowerCase() !== "yes").reverse();
  if (!resets.length) return fail("Invalid OTP. Please check and try again.");
  const reset = resets[0];
  if (new Date(reset.ExpiresAt).getTime() < Date.now()) return fail("The OTP has expired. Please request a new OTP.");
  const userRow = findRow(SHEETS.USERS, "Email", email);
  if (!userRow) return fail("User account was not found.");
  updateObj(SHEETS.USERS, userRow.rowIndex, { PasswordHash: hash(newPassword), UpdatedAt: new Date() });
  updateObj(SHEETS.PASSWORD_RESET, reset.__row, { Used: "Yes" });
  const user = rowObj(userRow);
  sendProfessionalEmail(email, "Password Changed Successfully - Smart Photo Toolkit Pro", passwordChangedEmailHtml(user));
  logActivity(user.UserID, email, "PASSWORD_RESET", "Password changed");
  return ok({}, "Password reset successfully.");
}

function createSession(userId, email) {
  const token = Utilities.getUuid() + "-" + Date.now();
  const expiresAt = new Date(Date.now() + APP.SESSION_DAYS * 86400000);
  appendObj(SHEETS.SESSIONS, { SessionID: id("SES"), UserID: userId, Email: email, Token: token, Device: "", CreatedAt: new Date(), ExpiresAt: expiresAt, Status: "Active" });
  return token;
}

function verifyToken(token) {
  if (!token) return null;
  const f = findRow(SHEETS.SESSIONS, "Token", token);
  if (!f) return null;
  const session = rowObj(f);
  if (String(session.Status).toLowerCase() !== "active") return null;
  if (new Date(session.ExpiresAt).getTime() < Date.now()) return null;
  const userRow = findRow(SHEETS.USERS, "Email", session.Email);
  return userRow ? rowObj(userRow) : null;
}

function logUsage(d) {
  const user = verifyToken(d.token);
  appendObj(SHEETS.TOOL_USAGE, { UsageID: id("USE"), UserID: user ? user.UserID : "", UserEmail: user ? user.Email : clean(d.email || ""), UserName: user ? user.Name : clean(d.name || "Guest"), Tool: clean(d.tool || ""), ToolType: clean(d.toolType || ""), Premium: user && String(user.Premium).toLowerCase() === "yes" ? "Yes" : "No", FileName: clean(d.fileName || ""), OriginalSizeKB: d.originalSizeKB || "", OutputSizeKB: d.outputSizeKB || "", TargetSizeKB: d.targetSizeKB || "", Status: "Success", CreatedAt: new Date() });
  return ok({}, "Usage logged successfully.");
}

function saveFeedback(d) {
  const user = verifyToken(d.token);
  const item = { FeedbackID: id("FDB"), UserID: user ? user.UserID : "", Name: user ? user.Name : clean(d.name || ""), Email: user ? user.Email : norm(d.email || ""), Message: clean(d.message || d.msg || ""), Type: clean(d.type || "Feedback"), Status: "New", CreatedAt: new Date(), AdminReply: "" };
  appendObj(SHEETS.FEEDBACK, item);
  sendAdminMail("New Feedback Received - Smart Photo Toolkit Pro", adminFeedbackHtml(item));
  return ok({}, "Thank you. Your feedback has been submitted successfully.");
}

function listFeedback(d) { const admin = verifyToken(d.token); if (!isAdmin(admin)) return fail("Admin access only."); return ok({ feedback: readObjs(SHEETS.FEEDBACK).reverse() }, "Feedback list loaded."); }

function submitPayment(d) {
  const user = verifyToken(d.token);
  if (!user) return fail("Please login to submit a payment request.");

  const payment = {
    PaymentID: id("PAY"),
    UserID: user.UserID,
    Email: user.Email,
    Name: user.Name || "",
    Mobile: user.Mobile || "",
    PlanName: clean(d.planName || "Premium"),
    Amount: d.amount || "",
    Method: clean(d.method || "UPI / QR"),
    TransactionID: clean(d.transactionId || ""),
    ScreenshotURL: clean(d.screenshotUrl || ""),
    Status: "Auto Verified",
    CreatedAt: new Date(),
    VerifiedAt: new Date(),
    VerifiedBy: "System Auto Activation"
  };

  if (!payment.TransactionID) return fail("Transaction ID / UTR number is required.");

  appendObj(SHEETS.PAYMENTS, payment);

  const days = getPlanDays(payment.PlanName);
  const premiumResult = setUserPremium(payment.Email, payment.PlanName || "Premium", days);
  const freshUserRow = findRow(SHEETS.USERS, "Email", payment.Email);
  const freshUser = freshUserRow ? rowObj(freshUserRow) : user;

  logActivity(user.UserID, user.Email, "PAYMENT_AUTO_VERIFIED", payment.PlanName + " ₹" + payment.Amount + " UTR: " + payment.TransactionID);

  sendAdminMail(
    "Payment Auto Activated - Smart Photo Toolkit Pro",
    adminAutoPaymentHtml(user, payment, days)
  );

  sendProfessionalEmail(
    user.Email,
    "Premium Activated - Smart Photo Toolkit Pro",
    premiumActivatedEmailHtml(payment, days)
  );

  return ok({ user: publicUser(freshUser), payment: payment }, "Payment submitted and premium activated successfully.");
}


function updateProfile(d) {
  const user = verifyToken(d.token);
  if (!user) return fail("Please login again.");
  const f = findRow(SHEETS.USERS, "Email", user.Email);
  if (!f) return fail("User account was not found.");
  const updated = {
    Name: clean(d.name || user.Name),
    Mobile: clean(d.mobile || user.Mobile),
    Address: clean(d.address || user.Address),
    UpdatedAt: new Date()
  };
  if (!updated.Name || !updated.Mobile || !updated.Address) return fail("Name, mobile, and address are required.");
  updateObj(SHEETS.USERS, f.rowIndex, updated);
  const fresh = Object.assign({}, user, updated);
  logActivity(user.UserID, user.Email, "PROFILE_UPDATE", "User updated profile details");
  return ok({ user: publicUser(fresh) }, "Profile updated successfully.");
}

function paymentHistory(d) {
  const user = verifyToken(d.token);
  if (!user) return fail("Please login again.");
  const payments = readObjs(SHEETS.PAYMENTS).filter(p => String(p.Email).toLowerCase() === String(user.Email).toLowerCase()).reverse();
  return ok({ payments }, "Payment history loaded.");
}

function usageHistory(d) {
  const user = verifyToken(d.token);
  if (!user) return fail("Please login again.");
  const usage = readObjs(SHEETS.TOOL_USAGE).filter(x => String(x.UserEmail).toLowerCase() === String(user.Email).toLowerCase()).reverse().slice(0, 50);
  return ok({ usage }, "Usage history loaded.");
}

function updateUserStatus(d) {
  const admin = verifyToken(d.token);
  if (!isAdmin(admin)) return fail("Admin access only.");
  const email = norm(d.email);
  const status = clean(d.status || "Active");
  const f = findRow(SHEETS.USERS, "Email", email);
  if (!f) return fail("User account was not found.");
  updateObj(SHEETS.USERS, f.rowIndex, { Status: status, UpdatedAt: new Date() });
  logActivity(admin.UserID, admin.Email, "ADMIN_USER_STATUS", email + " set to " + status);
  return ok({}, "User status updated successfully.");
}

function adminReplyFeedback(d) {
  const admin = verifyToken(d.token);
  if (!isAdmin(admin)) return fail("Admin access only.");
  const feedbackId = clean(d.feedbackId);
  const reply = clean(d.reply || "");
  const f = findRow(SHEETS.FEEDBACK, "FeedbackID", feedbackId);
  if (!f) return fail("Feedback item was not found.");
  updateObj(SHEETS.FEEDBACK, f.rowIndex, { AdminReply: reply, Status: "Replied" });
  const item = rowObj(f);
  if (item.Email) sendProfessionalEmail(item.Email, "Response to Your Feedback - Smart Photo Toolkit Pro", baseEmail("Feedback Response", `<p>Hello ${item.Name || "User"},</p><p>Thank you for contacting Smart Photo Toolkit Pro.</p><p><b>Your message:</b><br>${item.Message || ""}</p><p><b>Admin response:</b><br>${reply}</p>`));
  return ok({}, "Feedback reply saved and emailed successfully.");
}

function getAdminStats(d) {
  const admin = verifyToken(d.token); if (!isAdmin(admin)) return fail("Admin access only.");
  const users = readObjs(SHEETS.USERS), usage = readObjs(SHEETS.TOOL_USAGE), payments = readObjs(SHEETS.PAYMENTS), feedback = readObjs(SHEETS.FEEDBACK);
  const revenue = payments.filter(p => String(p.Status).toLowerCase() === "verified").reduce((sum, p) => sum + Number(p.Amount || 0), 0);
  return ok({ stats: { totalUsers: users.length, activeUsers: users.filter(u => String(u.Status).toLowerCase() === "active").length, premiumUsers: users.filter(u => String(u.Premium).toLowerCase() === "yes").length, totalUsage: usage.length, pendingPayments: payments.filter(p => String(p.Status).toLowerCase() === "pending").length, feedbackCount: feedback.length, revenue } }, "Admin stats loaded.");
}

function listUsers(d) {
  const admin = verifyToken(d.token); if (!isAdmin(admin)) return fail("Admin access only.");
  return ok({ users: readObjs(SHEETS.USERS).map(u => ({ userId: u.UserID, name: u.Name, email: u.Email, mobile: u.Mobile, address: u.Address, role: u.Role, premium: u.Premium, plan: u.PremiumPlan, usesLeft: u.UsesLeft, status: u.Status, createdAt: u.CreatedAt })) }, "Users list loaded.");
}

function listPayments(d) { const admin = verifyToken(d.token); if (!isAdmin(admin)) return fail("Admin access only."); return ok({ payments: readObjs(SHEETS.PAYMENTS).reverse() }, "Payments list loaded."); }

function verifyPayment(d) {
  const admin = verifyToken(d.token); if (!isAdmin(admin)) return fail("Admin access only.");
  const paymentId = clean(d.paymentId), status = clean(d.status || "Verified");
  const f = findRow(SHEETS.PAYMENTS, "PaymentID", paymentId); if (!f) return fail("Payment request was not found.");
  const payment = rowObj(f);
  updateObj(SHEETS.PAYMENTS, f.rowIndex, { Status: status, VerifiedAt: new Date(), VerifiedBy: admin.Email });
  if (status.toLowerCase() === "verified") {
    const days = getPlanDays(payment.PlanName);
    setUserPremium(payment.Email, payment.PlanName || "Premium", days);
    sendProfessionalEmail(payment.Email, "Premium Activated - Smart Photo Toolkit Pro", premiumActivatedEmailHtml(payment, days));
  } else if (status.toLowerCase() === "rejected") {
    sendProfessionalEmail(payment.Email, "Payment Request Rejected - Smart Photo Toolkit Pro", paymentRejectedEmailHtml(payment));
  }
  return ok({}, "Payment " + status + ".");
}

function setPremiumApi(d) { const admin = verifyToken(d.token); if (!isAdmin(admin)) return fail("Admin access only."); return setUserPremium(d.email, d.planName || "Admin Premium", Number(d.days || 365)); }
function getPlanDays(planName) { const p = String(planName || "").toLowerCase(); if (p.includes("half")) return 180; if (p.includes("year")) return 365; return 30; }
function setUserPremium(email, planName, days) { const f = findRow(SHEETS.USERS, "Email", norm(email)); if (!f) return fail("User account was not found."); updateObj(SHEETS.USERS, f.rowIndex, { Premium: "Yes", PremiumPlan: planName, PremiumStart: new Date(), PremiumEnd: new Date(Date.now() + days * 86400000), UsesLeft: "Unlimited", UpdatedAt: new Date() }); return ok({}, "Premium activated successfully."); }
function publicUser(u) { return { userId: u.UserID, name: u.Name, email: u.Email, mobile: u.Mobile || "", address: u.Address || "", role: u.Role, premium: String(u.Premium).toLowerCase() === "yes", premiumPlan: u.PremiumPlan, usesLeft: u.UsesLeft, status: u.Status, premiumEnd: u.PremiumEnd || "" }; }
function isAdmin(user) { return user && APP.ADMIN_EMAILS.includes(String(user.Email).toLowerCase()); }

function baseEmail(title, body) {
  return `<div style="margin:0;padding:0;background:#f4f7fb;font-family:Arial,Helvetica,sans-serif;color:#111827"><div style="max-width:640px;margin:0 auto;padding:24px"><div style="background:#0f172a;color:#fff;padding:22px;border-radius:18px 18px 0 0"><h2 style="margin:0">Smart Photo Toolkit Pro</h2><p style="margin:6px 0 0;color:#cbd5e1">Professional photo and document tools</p></div><div style="background:#ffffff;padding:24px;border:1px solid #e5e7eb;border-top:0;border-radius:0 0 18px 18px"><h3 style="margin-top:0;color:#111827">${title}</h3>${body}<p style="margin-top:24px;color:#667085;font-size:13px">This is an automated email from Smart Photo Toolkit Pro. If you need help, contact ${APP.SUPPORT_EMAIL}.</p></div></div></div>`;
}
function sendProfessionalEmail(to, subject, htmlBody) { try { MailApp.sendEmail({ to, subject, htmlBody }); } catch (err) { logError("sendProfessionalEmail", err); } }
function sendAdminMail(subject, htmlBody) { APP.ADMIN_EMAILS.forEach(to => sendProfessionalEmail(to, subject, baseEmail(subject, htmlBody))); }
function welcomeEmailHtml(u) { return baseEmail("Welcome, " + (u.Name || "User"), `<p>Your Smart Photo Toolkit Pro account has been created successfully.</p><p><b>Email:</b> ${u.Email}</p><p><b>Mobile:</b> ${u.Mobile || "-"}</p><p>You can now login and use your dashboard.</p>`); }
function adminNewAccountHtml(u) { return baseEmail("New Account Created", `<p><b>Name:</b> ${u.Name}</p><p><b>Email:</b> ${u.Email}</p><p><b>Mobile:</b> ${u.Mobile || "-"}</p><p><b>Address:</b> ${u.Address || "-"}</p><p><b>Role:</b> ${u.Role}</p>`); }
function passwordResetEmailHtml(u, otp) { return baseEmail("Password Reset OTP", `<p>Hello ${u.Name || "User"},</p><p>Use the OTP below to reset your password. This OTP is valid for ${APP.RESET_OTP_MINUTES} minutes.</p><div style="font-size:28px;font-weight:bold;letter-spacing:4px;background:#eef2ff;color:#1d4ed8;padding:16px;text-align:center;border-radius:12px">${otp}</div><p>If you did not request this reset, please ignore this email.</p>`); }
function passwordChangedEmailHtml(u) { return baseEmail("Password Changed Successfully", `<p>Hello ${u.Name || "User"},</p><p>Your account password has been changed successfully.</p><p>If this was not done by you, please contact support immediately.</p>`); }
function adminFeedbackHtml(f) { return baseEmail("New Feedback Received", `<p><b>Name:</b> ${f.Name || "-"}</p><p><b>Email:</b> ${f.Email || "-"}</p><p><b>Type:</b> ${f.Type}</p><p><b>Message:</b><br>${f.Message}</p>`); }
function adminPaymentHtml(user, p) { return baseEmail("Payment Auto Activated", `<p>A new payment request has been submitted.</p><p><b>User:</b> ${user.Name}</p><p><b>Email:</b> ${user.Email}</p><p><b>Mobile:</b> ${user.Mobile || "-"}</p><p><b>Plan:</b> ${p.PlanName}</p><p><b>Amount:</b> ₹${p.Amount}</p><p><b>Transaction ID / UTR:</b> ${p.TransactionID}</p><p><b>Screenshot URL:</b> ${p.ScreenshotURL || "Not provided"}</p><p><b>Status:</b> Pending</p><p>Please open the admin panel to approve or reject this request.</p>`); }
function adminAutoPaymentHtml(user, p, days) { return baseEmail("Payment Auto Activated", `<p>A payment request has been submitted and premium access has been activated automatically by the system.</p><p><b>User:</b> ${user.Name}</p><p><b>Email:</b> ${user.Email}</p><p><b>Mobile:</b> ${user.Mobile || "-"}</p><p><b>Plan:</b> ${p.PlanName}</p><p><b>Amount:</b> ₹${p.Amount}</p><p><b>Duration:</b> ${days} days</p><p><b>Transaction ID / UTR:</b> ${p.TransactionID}</p><p><b>Status:</b> Auto Verified</p><p>Please review this transaction in your admin panel for your own records.</p>`); }
function paymentSubmittedEmailHtml(user, p) { return baseEmail("Payment Request Submitted", `<p>Hello ${user.Name || "User"},</p><p>Your payment request has been submitted successfully and is auto activated.</p><p><b>Plan:</b> ${p.PlanName}</p><p><b>Amount:</b> ₹${p.Amount}</p><p><b>Transaction ID / UTR:</b> ${p.TransactionID}</p><p>Your premium access has been activated automatically.</p>`); }
function premiumActivatedEmailHtml(p, days) { return baseEmail("Premium Activated", `<p>Your ${p.PlanName} plan has been activated successfully.</p><p><b>Duration:</b> ${days} days</p><p>Thank you for upgrading to Smart Photo Toolkit Pro.</p>`); }
function paymentRejectedEmailHtml(p) { return baseEmail("Payment Request Rejected", `<p>Your payment request could not be verified.</p><p><b>Plan:</b> ${p.PlanName}</p><p><b>Amount:</b> ₹${p.Amount}</p><p><b>Transaction ID / UTR:</b> ${p.TransactionID}</p><p>Please contact support if you believe this is a mistake.</p>`); }

function logActivity(userId, email, action, details) { try { appendObj(SHEETS.ACTIVITY_LOGS, { LogID: id("LOG"), UserID: userId || "", Email: email || "", Action: action || "", Details: details || "", CreatedAt: new Date() }); } catch (err) {} }
function logError(fn, err) { try { appendObj(SHEETS.ERROR_LOGS, { ErrorID: id("ERR"), FunctionName: fn, Message: err.message || String(err), Stack: err.stack || "", CreatedAt: new Date() }); } catch (e) {} }
function getSheet(name) { const ss = SpreadsheetApp.getActiveSpreadsheet(); let sh = ss.getSheetByName(name); if (!sh) sh = ss.insertSheet(name); return sh; }
function appendObj(sheetName, obj) { const sh = getSheet(sheetName); const headers = sh.getRange(1, 1, 1, Math.max(1, sh.getLastColumn())).getValues()[0]; sh.appendRow(headers.map(h => obj[h] !== undefined ? obj[h] : "")); return obj; }
function readObjs(sheetName) { const sh = getSheet(sheetName); const values = sh.getDataRange().getValues(); if (values.length < 2) return []; const headers = values[0]; return values.slice(1).filter(r => r.join("") !== "").map((row, i) => { const obj = {}; headers.forEach((h, j) => obj[h] = row[j]); obj.__row = i + 2; return obj; }); }
function findRow(sheetName, columnName, value) { const sh = getSheet(sheetName); const values = sh.getDataRange().getValues(); if (values.length < 1) return null; const headers = values[0]; const col = headers.indexOf(columnName); if (col < 0) return null; for (let i = 1; i < values.length; i++) { if (String(values[i][col]).toLowerCase() === String(value).toLowerCase()) return { sheet: sh, rowIndex: i + 1, row: values[i], headers }; } return null; }
function rowObj(found) { const obj = {}; found.headers.forEach((h, i) => obj[h] = found.row[i]); return obj; }
function updateObj(sheetName, rowIndex, obj) { const sh = getSheet(sheetName); const headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0]; headers.forEach((h, i) => { if (obj[h] !== undefined) sh.getRange(rowIndex, i + 1).setValue(obj[h]); }); }
function id(prefix) { return prefix + "_" + Date.now() + "_" + Math.floor(Math.random() * 99999); }
function norm(v) { return String(v || "").trim().toLowerCase(); }
function clean(v) { return String(v || "").trim(); }
function hash(password) { return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(password || "")).map(b => { b = b < 0 ? b + 256 : b; return ("0" + b.toString(16)).slice(-2); }).join(""); }
function ok(data, message) { return Object.assign({ success: true, message: message || "Success" }, data || {}); }
function fail(message) { return { success: false, message: message || "Failed" }; }
function jsonOutput(obj) { return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON); }
