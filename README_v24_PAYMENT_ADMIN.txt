Smart Photo Toolkit v24 Payment + Admin

Base: v23 working version.

Frontend fixes:
- Admin email fixed: kaitsatnam@gmail.com
- Payment page added
- Manual payment request
- Admin payment approval/reject
- Admin can activate premium
- Admin panel locked to kaitsatnam@gmail.com

Important Apps Script update:
1. Open Google Sheet > Extensions > Apps Script
2. Replace Code.gs with:
   backend/apps-script/Code_v24_PAYMENT_ADMIN.gs
   OR backend/apps-script/ALL_IN_ONE_Code.gs
3. Save
4. Run initializeDatabase once
5. Deploy > Manage deployments > Edit > New version > Deploy
6. Use same Web App URL in frontend.

Replace website:
- Full folder replace recommended from this ZIP.
