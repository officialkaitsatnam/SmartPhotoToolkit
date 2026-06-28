Smart Photo Toolkit Pro v21 Merge Edition

Base:
- This ZIP uses the user's original SmartPhotoToolkit project as the master base.
- Existing tools/pages are preserved:
  - Passport Photo
  - Aadhaar Print
  - PDF Tool
  - Dashboard
  - Admin
  - Existing style/script files

Main fix:
- js/api.js is replaced with the live Google Apps Script API adapter.
- Login/Signup now sends correct request format:
  { action: "...", data: {...} }
- Dashboard/Admin API methods map to existing v19 Apps Script actions:
  login, signup, logout, logUsage, feedback, adminStats, listUsers, listUsage, listFeedback.

Replace instructions:
1. Replace ONLY:
   - js/api.js
2. Optional:
   - index.html if you want version title v21.

Do NOT replace pages folder if your old tools are working.
Do NOT delete script.js/style.css.

Google Apps Script:
- Keep the same Apps Script and Google Sheet already created.
- No new database initialize required.
