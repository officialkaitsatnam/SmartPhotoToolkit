Smart Photo Toolkit Pro v32 - Root Folder Build

Upload these files in your GitHub repository root:
- index.html
- style.css
- main.css
- main.js
- script.js
- payment_qr.jpg

Apps Script:
- Paste Code.gs or ALL_IN_ONE_Code_v32.gs into Apps Script.
- Run initializeDatabase().
- Deploy / update Web App.

v32 updates:
- Auto premium activation after UTR submission.
- Payment status is saved as Auto Verified.
- User receives premium activation email.
- Admin receives payment auto-activation email.
- Dashboard updates immediately after payment submission.
- Payment page text updated for auto activation.

Important:
Static UPI QR cannot truly confirm bank settlement automatically. This version uses Auto-Trust Mode: premium is activated after the user submits a UTR/Transaction ID. For real bank-side verification, connect Razorpay, PhonePe, Paytm, Cashfree, or another payment gateway API.
