# ⬡ The Shield Protocol — QR & Email Automation System

> Internal administration tool for automating QR code generation and personalized email distribution for workshop participants.

---

## Project Structure

```
The Shield Protocol/
├── backend/                  # Node.js + Express + TypeScript API
│   ├── src/
│   │   ├── routes/           # API route handlers
│   │   ├── services/         # Business logic (QR, Email, CSV, Processing)
│   │   ├── models/           # File-based JSON database
│   │   ├── middleware/        # Auth, error handling
│   │   ├── utils/            # Logger, seed
│   │   └── types/            # TypeScript types
│   ├── assets/               # Place shield-logo.png here
│   ├── generated-qr/         # QR output directory (auto-created)
│   ├── uploads/              # Uploaded CSV/Excel files
│   └── data/db.json          # JSON database (auto-created)
│
├── frontend/                 # React + TypeScript + Tailwind + Vite
│   ├── src/
│   │   ├── pages/            # All page components
│   │   ├── components/       # Layout, Sidebar, TopBar
│   │   ├── api/              # Axios API client
│   │   ├── hooks/            # useAuth context
│   │   ├── types/            # TypeScript types
│   │   └── utils/            # Helpers, formatters
│   └── public/
│
└── README.md
```

---

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### 1. Setup Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your email credentials
```

**Add your Shield logo:**
Place your `shield-logo.png` in `backend/assets/` directory.

```bash
npm run dev
# API starts at http://localhost:5000
```

### 2. Setup Frontend

```bash
cd frontend
npm install
npm run dev
# App starts at http://localhost:5173
```

---

## Default Admin Credentials

```
Email:    admin@shieldprotocol.com
Password: ShieldAdmin@2026
```
> Change these in `backend/.env` before deploying.

---

## Email Configuration

Edit `backend/.env` and set `EMAIL_PROVIDER` to one of:

| Provider   | Env Variables Required |
|------------|------------------------|
| `gmail`    | `GMAIL_USER`, `GMAIL_APP_PASSWORD` |
| `smtp`     | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` |
| `sendgrid` | `SENDGRID_API_KEY` |
| `brevo`    | `BREVO_SMTP_USER`, `BREVO_SMTP_PASS` |
| `resend`   | `RESEND_API_KEY` |

**Gmail Setup:**
1. Enable 2-factor authentication
2. Go to Google Account → Security → App Passwords
3. Generate a 16-character app password
4. Use that as `GMAIL_APP_PASSWORD`

---

## CSV/Excel Format

```csv
Student ID,Student Name,Email,Mobile,Dept/Branch
SP26-0001,Rahul Kumar,rahul@gmail.com,9876543210,CSE
SP26-0002,Priya Sharma,priya@gmail.com,9876543211,ECE
```

---

## Workflow

1. **Login** → Admin dashboard
2. **Upload** → Drag & drop CSV/Excel → Preview → Confirm import
3. **Processing** → Select batch → Generate QR codes → Send emails
4. **Students** → Search, filter, view status of all students
5. **Reports** → Download CSV/Excel report of full campaign

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Admin login |
| POST | `/api/upload` | Upload CSV/Excel (preview) |
| POST | `/api/upload/confirm` | Confirm import to DB |
| GET  | `/api/students` | List students (search/filter) |
| GET  | `/api/students/batches` | List all upload batches |
| POST | `/api/processing/generate-qr` | Start QR generation job |
| POST | `/api/processing/send-emails` | Start email sending job |
| POST | `/api/processing/retry-failed` | Retry all failed emails |
| GET  | `/api/processing/jobs/:jobId` | Poll job progress |
| GET  | `/api/processing/progress/:jobId` | SSE live stream |
| GET  | `/api/dashboard/stats` | Dashboard stats |
| GET  | `/api/reports/csv` | Download CSV report |
| GET  | `/api/reports/excel` | Download Excel report |

---

## Deployment

**Backend (Render / Railway):**
```bash
npm run build
npm start
```

**Frontend (Vercel):**
```bash
npm run build
# Deploy the dist/ folder
```

Set `VITE_API_URL` to your deployed backend URL.

---

## Security Notes

- JWT tokens expire in 8 hours
- Rate limiting: 200 requests / 15 minutes
- Files validated (CSV/XLS/XLSX only, max 10MB)
- SMTP credentials stored in env variables only
- Helmet.js security headers enabled
