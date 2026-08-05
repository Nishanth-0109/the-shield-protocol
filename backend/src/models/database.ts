import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { Student, UploadBatch, ProcessingJob, ActivityEvent, AdminUser } from '../types';
import { getSupabaseClient, isSupabaseEnabled } from '../config/supabaseClient';
import { logger } from '../utils/logger';

// =============================================
// Hybrid Database Layer — Supports Supabase & Local JSON
// =============================================

interface DbSchema {
  admin: AdminUser | null;
  students: Student[];
  batches: UploadBatch[];
  jobs: ProcessingJob[];
  activity: ActivityEvent[];
}

const isVercel = !!process.env.VERCEL;
const DB_PATH = isVercel
  ? path.join('/tmp', 'db.json')
  : path.join(process.cwd(), 'data', 'db.json');

let dbCache: DbSchema | null = null;
let saveTimeout: NodeJS.Timeout | null = null;

function ensureDbFile(): void {
  try {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (!fs.existsSync(DB_PATH)) {
      const initial: DbSchema = {
        admin: null,
        students: [],
        batches: [],
        jobs: [],
        activity: [],
      };
      fs.writeFileSync(DB_PATH, JSON.stringify(initial, null, 2));
    }
  } catch (err) {
    logger.error('[DB] File setup warning:', err);
  }
}

export function flushDbSync(): void {
  if (!dbCache) return;
  try {
    ensureDbFile();
    fs.writeFileSync(DB_PATH, JSON.stringify(dbCache, null, 2));
  } catch (err) {
    logger.error('[DB] Flush sync warning:', err);
  }
}

function readDb(): DbSchema {
  if (dbCache) return dbCache;
  ensureDbFile();
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    dbCache = JSON.parse(raw) as DbSchema;
  } catch {
    dbCache = { admin: null, students: [], batches: [], jobs: [], activity: [] };
  }
  return dbCache;
}

function writeDb(data: DbSchema): void {
  dbCache = data;
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    flushDbSync();
  }, 500);
}

// Auto-flush on process exit
process.on('beforeExit', flushDbSync);
process.on('SIGINT', () => { flushDbSync(); process.exit(0); });
process.on('SIGTERM', () => { flushDbSync(); process.exit(0); });

// Safe async wrapper for Supabase Postgrest queries
function safeSupa(promise: PromiseLike<unknown>): void {
  Promise.resolve(promise).catch(err => logger.error('[SUPABASE] Query error:', err));
}

// =============================================
// Admin
// =============================================

export const dbGetAdmin = (): AdminUser => {
  const db = readDb();
  if (db.admin) return db.admin;

  const email = process.env.ADMIN_EMAIL || 'admin@shieldprotocol.com';
  const password = process.env.ADMIN_PASSWORD || 'ShieldAdmin@2026';
  const passwordHash = bcrypt.hashSync(password, 10);

  const defaultAdmin: AdminUser = {
    id: 'admin-default-001',
    email,
    passwordHash,
    name: 'Shield Admin',
  };

  db.admin = defaultAdmin;
  try {
    writeDb(db);
  } catch {
    // Ignore in read-only environment
  }

  return defaultAdmin;
};

export const dbSetAdmin = (admin: AdminUser): void => {
  const db = readDb();
  db.admin = admin;
  writeDb(db);

  if (isSupabaseEnabled()) {
    const supabase = getSupabaseClient();
    if (supabase) {
      safeSupa(supabase.from('admin_users').upsert({
        id: admin.id,
        email: admin.email,
        password_hash: admin.passwordHash,
        name: admin.name,
        last_login: admin.lastLogin,
      }));
    }
  }
};

export const dbUpdateAdminLastLogin = (id: string): void => {
  const db = readDb();
  if (db.admin && db.admin.id === id) {
    db.admin.lastLogin = new Date().toISOString();
    writeDb(db);

    if (isSupabaseEnabled()) {
      const supabase = getSupabaseClient();
      if (supabase) {
        safeSupa(supabase.from('admin_users').update({
          last_login: db.admin.lastLogin,
        }).eq('id', id));
      }
    }
  }
};

// =============================================
// Students
// =============================================

export const dbGetStudents = (): Student[] => readDb().students;

export const dbGetStudentById = (id: string): Student | undefined =>
  readDb().students.find(s => s.id === id);

export const dbGetStudentByStudentId = (studentId: string): Student | undefined =>
  readDb().students.find(s => s.studentId === studentId);

export const dbInsertStudents = (students: Student[]): void => {
  const db = readDb();
  db.students.push(...students);
  writeDb(db);

  if (isSupabaseEnabled()) {
    const supabase = getSupabaseClient();
    if (supabase && students.length > 0) {
      const rows = students.map(s => ({
        id: s.id,
        student_id: s.studentId,
        name: s.name,
        email: s.email,
        mobile: s.mobile,
        department: s.department,
        qr_generated: s.qrGenerated,
        qr_path: s.qrPath,
        email_status: s.emailStatus,
        upload_batch_id: s.uploadBatchId,
        created_at: s.createdAt,
      }));
      safeSupa(supabase.from('students').insert(rows));
    }
  }
};

export const dbUpdateStudent = (id: string, updates: Partial<Student>): void => {
  const db = readDb();
  const idx = db.students.findIndex(s => s.id === id);
  if (idx !== -1) {
    db.students[idx] = { ...db.students[idx], ...updates };
    writeDb(db);

    if (isSupabaseEnabled()) {
      const supabase = getSupabaseClient();
      if (supabase) {
        const supaUpdates: Record<string, unknown> = {};
        if (updates.qrGenerated !== undefined) supaUpdates.qr_generated = updates.qrGenerated;
        if (updates.qrPath !== undefined) supaUpdates.qr_path = updates.qrPath;
        if (updates.emailStatus !== undefined) supaUpdates.email_status = updates.emailStatus;
        if (updates.emailSentAt !== undefined) supaUpdates.email_sent_at = updates.emailSentAt;
        if (updates.failureReason !== undefined) supaUpdates.failure_reason = updates.failureReason;

        if (Object.keys(supaUpdates).length > 0) {
          safeSupa(supabase.from('students').update(supaUpdates).eq('id', id));
        }
      }
    }
  }
};

export const dbGetStudentsByBatch = (batchId: string): Student[] =>
  readDb().students.filter(s => s.uploadBatchId === batchId);

export const dbGetStudentsByStatus = (status: string): Student[] =>
  readDb().students.filter(s => s.emailStatus === status);

export const dbClearStudents = (): void => {
  const db = readDb();
  db.students = [];
  writeDb(db);

  if (isSupabaseEnabled()) {
    const supabase = getSupabaseClient();
    if (supabase) {
      safeSupa(supabase.from('students').delete().neq('id', '00000000-0000-0000-0000-000000000000'));
    }
  }
};

export const dbSearchStudents = (query: string): Student[] => {
  const q = query.toLowerCase();
  return readDb().students.filter(
    s =>
      s.studentId.toLowerCase().includes(q) ||
      s.name.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q)
  );
};

// =============================================
// Batches
// =============================================

export const dbGetBatches = (): UploadBatch[] =>
  readDb().batches.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());

export const dbGetBatchById = (id: string): UploadBatch | undefined =>
  readDb().batches.find(b => b.id === id);

export const dbInsertBatch = (batch: UploadBatch): void => {
  const db = readDb();
  db.batches.push(batch);
  writeDb(db);

  if (isSupabaseEnabled()) {
    const supabase = getSupabaseClient();
    if (supabase) {
      safeSupa(supabase.from('upload_batches').insert({
        id: batch.id,
        file_name: batch.fileName,
        total_records: batch.totalRecords,
        valid_records: batch.validRecords,
        duplicate_records: batch.duplicateRecords,
        invalid_records: batch.invalidRecords,
        uploaded_at: batch.uploadedAt,
        status: batch.status,
      }));
    }
  }
};

export const dbUpdateBatch = (id: string, updates: Partial<UploadBatch>): void => {
  const db = readDb();
  const idx = db.batches.findIndex(b => b.id === id);
  if (idx !== -1) {
    db.batches[idx] = { ...db.batches[idx], ...updates };
    writeDb(db);
  }
};

// =============================================
// Jobs
// =============================================

export const cleanupStuckJobs = (): void => {
  const db = readDb();
  let changed = false;
  for (const j of db.jobs) {
    if (j.status === 'running') {
      j.status = 'failed';
      j.completedAt = new Date().toISOString();
      changed = true;
    }
  }
  if (changed) writeDb(db);
};

export const dbGetJobById = (id: string): ProcessingJob | undefined =>
  readDb().jobs.find(j => j.id === id);

export const dbGetJobsByBatch = (batchId: string): ProcessingJob[] =>
  readDb().jobs.filter(j => j.batchId === batchId);

export const dbInsertJob = (job: ProcessingJob): void => {
  const db = readDb();
  db.jobs.push(job);
  writeDb(db);

  if (isSupabaseEnabled()) {
    const supabase = getSupabaseClient();
    if (supabase) {
      safeSupa(supabase.from('processing_jobs').insert({
        id: job.id,
        batch_id: job.batchId,
        type: job.type,
        status: job.status,
        total: job.total,
        processed: job.processed,
        successful: job.successful,
        failed: job.failed,
        started_at: job.startedAt,
      }));
    }
  }
};

export const dbUpdateJob = (id: string, updates: Partial<ProcessingJob>): void => {
  const db = readDb();
  const idx = db.jobs.findIndex(j => j.id === id);
  if (idx !== -1) {
    db.jobs[idx] = { ...db.jobs[idx], ...updates };
    writeDb(db);

    if (isSupabaseEnabled()) {
      const supabase = getSupabaseClient();
      if (supabase) {
        const supaUpdates: Record<string, unknown> = {};
        if (updates.status !== undefined) supaUpdates.status = updates.status;
        if (updates.processed !== undefined) supaUpdates.processed = updates.processed;
        if (updates.successful !== undefined) supaUpdates.successful = updates.successful;
        if (updates.failed !== undefined) supaUpdates.failed = updates.failed;
        if (updates.completedAt !== undefined) supaUpdates.completed_at = updates.completedAt;

        if (Object.keys(supaUpdates).length > 0) {
          safeSupa(supabase.from('processing_jobs').update(supaUpdates).eq('id', id));
        }
      }
    }
  }
};

// =============================================
// Activity
// =============================================

export const dbGetActivity = (limit = 50): ActivityEvent[] =>
  readDb()
    .activity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit);

export const dbInsertActivity = (event: ActivityEvent): void => {
  const db = readDb();
  db.activity.unshift(event);
  if (db.activity.length > 500) db.activity = db.activity.slice(0, 500);
  writeDb(db);

  if (isSupabaseEnabled()) {
    const supabase = getSupabaseClient();
    if (supabase) {
      safeSupa(supabase.from('activity_events').insert({
        id: event.id,
        type: event.type,
        message: event.message,
        timestamp: event.timestamp,
        metadata: event.metadata,
      }));
    }
  }
};
