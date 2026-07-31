# The Shield Protocol — Setup Guide

## Prerequisites

Install **Node.js 18+** from https://nodejs.org (LTS version recommended).
After installing, restart your terminal and verify:
```
node --version    # should show v18 or higher
npm --version     # should show v9 or higher
```

---

## Step 1: Install Backend Dependencies

Open a terminal (PowerShell or Command Prompt) and run:

```powershell
cd "C:\Users\HP 640 G5\Desktop\The sheild protocol\backend"
npm install
```

This installs: Express, Nodemailer, QRCode, Sharp, XLSX, JWT, bcrypt, and all other backend packages.

> **Note on Sharp:** Sharp uses native binaries. If installation fails, run:
> `npm install --ignore-scripts` then `npm install sharp`

---

## Step 2: Install Frontend Dependencies

```powershell
cd "C:\Users\HP 640 G5\Desktop\The sheild protocol\frontend"
npm install
```

---

## Step 3: Configure Environment Variables

Edit `backend\.env` with your email credentials:

```env
# Change the admin password before first use
ADMIN_EMAIL=admin@shieldprotocol.com
ADMIN_PASSWORD=ShieldAdmin@2026

# For Gmail (easiest to get started)
EMAIL_PROVIDER=gmail
GMAIL_USER=your.gmail@gmail.com
GMAIL_APP_PASSWORD=xxxx_xxxx_xxxx_xxxx
```

**How to get a Gmail App Password:**
1. Go to your Google Account → Security
2. Enable 2-Step Verification if not already enabled
3. Go to Security → App Passwords
4. Select "Mail" and "Windows Computer", click Generate
5. Copy the 16-character password into `GMAIL_APP_PASSWORD`

---

## Step 4: Add Your Shield Logo

Place your Shield Protocol logo PNG at:
```
backend\assets\shield-logo.png
```

If no logo is placed there, the system will **auto-generate a placeholder** on first startup so everything still works.

---

## Step 5: Start the Application

Open **two separate terminal windows:**

**Terminal 1 — Backend:**
```powershell
cd "C:\Users\HP 640 G5\Desktop\The sheild protocol\backend"
npm run dev
```
You should see:
```
[INFO] Shield Protocol API running on http://localhost:5000
[INFO] Environment: development
[SEED] Admin created: admin@shieldprotocol.com
```

**Terminal 2 — Frontend:**
```powershell
cd "C:\Users\HP 640 G5\Desktop\The sheild protocol\frontend"
npm run dev
```
You should see:
```
  VITE v5.x  ready in xxx ms
  ➜  Local:   http://localhost:5173/
```

---

## Step 6: Access the Application

Open your browser and go to: **http://localhost:5173**

**Default login credentials:**
```
Email:    admin@shieldprotocol.com
Password: ShieldAdmin@2026
```

---

## Step 7: First Use Workflow

1. **Login** to the admin dashboard
2. **Upload** → Click "Upload Students" → Drag & drop your CSV/Excel file
3. **Preview** → Review valid/invalid/duplicate records
4. **Import** → Click "Import X Students" to confirm
5. **Processing** → Select your batch → Click "Generate QR Codes" → Wait for completion
6. **Send Emails** → Click "Send Emails" → Monitor real-time progress
7. **Reports** → Download CSV or Excel report of full campaign

---

## CSV Template

Save this as `students.csv`:

```csv
Student ID,Student Name,Email,Mobile,Dept/Branch
SP26-0001,Rahul Kumar,rahul@example.com,9876543210,CSE
SP26-0002,Priya Sharma,priya@example.com,9876543211,ECE
SP26-0003,Amit Patel,amit@example.com,9876543212,MECH
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `npm` not found | Restart terminal after installing Node.js |
| Sharp install fails | Run `npm install --ignore-scripts` then `npm install sharp` separately |
| Email not sending | Double-check App Password — it must be 16 chars with spaces |
| Login not working | Make sure backend is running on port 5000 |
| QR without logo | Place `shield-logo.png` in `backend/assets/` and restart backend |
| Port 5000 in use | Change `PORT=5001` in `backend/.env` and `VITE_API_URL=http://localhost:5001/api` in `frontend/.env` |

---

## Production Build

**Backend:**
```powershell
cd backend
npm run build
npm start
```

**Frontend:**
```powershell
cd frontend
npm run build
# Deploy the `dist/` folder to Vercel, Netlify, or any static host
```

Set `VITE_API_URL` to your deployed backend URL in the frontend environment.
