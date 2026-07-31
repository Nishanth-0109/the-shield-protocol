-- ========================================================
-- The Shield Protocol - Supabase Database Schema
-- Run this in your Supabase SQL Editor (https://supabase.com)
-- ========================================================

-- 1. Admin Users Table
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Students Table
CREATE TABLE IF NOT EXISTS public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  mobile TEXT,
  department TEXT,
  qr_generated BOOLEAN DEFAULT FALSE,
  qr_path TEXT,
  email_status TEXT DEFAULT 'pending', -- pending, queued, sending, sent, failed
  email_sent_at TIMESTAMPTZ,
  failure_reason TEXT,
  upload_batch_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_students_student_id ON public.students(student_id);
CREATE INDEX IF NOT EXISTS idx_students_email ON public.students(email);
CREATE INDEX IF NOT EXISTS idx_students_batch ON public.students(upload_batch_id);
CREATE INDEX IF NOT EXISTS idx_students_email_status ON public.students(email_status);

-- 3. Upload Batches Table
CREATE TABLE IF NOT EXISTS public.upload_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name TEXT NOT NULL,
  total_records INT DEFAULT 0,
  valid_records INT DEFAULT 0,
  duplicate_records INT DEFAULT 0,
  invalid_records INT DEFAULT 0,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'uploaded'
);

-- 4. Processing Jobs Table
CREATE TABLE IF NOT EXISTS public.processing_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id TEXT NOT NULL,
  type TEXT NOT NULL, -- qr_generation, email_sending
  status TEXT NOT NULL DEFAULT 'running', -- running, completed, failed
  total INT DEFAULT 0,
  processed INT DEFAULT 0,
  successful INT DEFAULT 0,
  failed INT DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  estimated_remaining INT DEFAULT 0
);

-- 5. Activity Events Table
CREATE TABLE IF NOT EXISTS public.activity_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB
);

-- 6. Insert Default Admin User (admin@shieldprotocol.com / ShieldAdmin@2026)
INSERT INTO public.admin_users (email, password_hash, name)
VALUES (
  'admin@shieldprotocol.com',
  '$2a$12$92/s3qQl1aA31o5Zm5hsTeSqyjO4VVamUA1utIjn22eihypYemoga',
  'Shield Admin'
)
ON CONFLICT (email) DO NOTHING;

-- 7. Supabase Storage Buckets Setup
INSERT INTO storage.buckets (id, name, public)
VALUES ('qr-codes', 'qr-codes', true),
       ('uploads', 'uploads', true)
ON CONFLICT (id) DO NOTHING;
