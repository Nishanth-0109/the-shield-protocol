# ⚡ Supabase Setup Guide - The Shield Protocol

Follow these simple steps to configure your free Supabase database & storage for **The Shield Protocol**.

---

## Step 1: Create a Free Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and click **Sign Up** (or log in with GitHub).
2. Click **New Project**.
3. Enter a project name (e.g. `shield-protocol`), set a Database Password, and click **Create new project**.
4. Wait 1-2 minutes for your project to deploy.

---

## Step 2: Run the Database & Storage Setup SQL

1. In your Supabase Dashboard, click on **SQL Editor** in the left menu bar.
2. Click **New Query**.
3. Open `backend/supabase-schema.sql` from your project folder, copy all contents, and paste them into the SQL Editor.
4. Click **Run** (or press `Ctrl + Enter`).
5. You will see `Success. No rows returned`. All tables (`students`, `admin_users`, `upload_batches`, `processing_jobs`, `activity_events`) and storage buckets (`qr-codes`, `uploads`) are now created!

---

## Step 3: Copy your Supabase API Keys

1. In your Supabase Dashboard, click on ⚙️ **Project Settings** (gear icon at the bottom left).
2. Click **API** under Configuration.
3. Copy the following two values:
   - **Project URL** (e.g., `https://xyzprojectid.supabase.co`)
   - **service_role secret key** (under Project API keys — click *Reveal*)

---

## Step 4: Add Credentials to `backend/.env`

Open your `backend/.env` file and set:

```env
# Enable Supabase
USE_SUPABASE=true

# Paste your Supabase Project URL and Service Role Key
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Step 5: Start the App!

Run **`START-HERE.bat`** (or restart your backend server).

Your app is now connected to **Supabase Cloud Database & Storage**!
- All student records are stored in PostgreSQL on Supabase.
- All QR PNG images are uploaded automatically to your Supabase `qr-codes` storage bucket.
