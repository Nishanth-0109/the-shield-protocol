// =============================================
// Core Type Definitions
// =============================================

export interface Student {
  id: string;
  studentId: string;        // SP26-0001
  name: string;
  email: string;
  mobile: string;
  department: string;
  qrGenerated: boolean;
  qrPath?: string;
  emailStatus: EmailStatus;
  emailSentAt?: string;
  failureReason?: string;
  uploadBatchId: string;
  createdAt: string;
}

export type EmailStatus = 'pending' | 'queued' | 'sending' | 'sent' | 'failed';

export interface UploadBatch {
  id: string;
  fileName: string;
  totalRecords: number;
  validRecords: number;
  duplicateRecords: number;
  invalidRecords: number;
  uploadedAt: string;
  status: 'uploaded' | 'processing' | 'completed' | 'failed';
  processedBy?: string;
}

export interface ProcessingJob {
  id: string;
  batchId: string;
  type: 'qr_generation' | 'email_sending';
  status: 'pending' | 'running' | 'completed' | 'failed';
  total: number;
  processed: number;
  successful: number;
  failed: number;
  startedAt?: string;
  completedAt?: string;
  estimatedRemaining?: number;
}

export interface DashboardStats {
  totalStudents: number;
  qrGenerated: number;
  emailsSent: number;
  emailsFailed: number;
  emailsPending: number;
  recentBatches: UploadBatch[];
  activityTimeline: ActivityEvent[];
}

export interface ActivityEvent {
  id: string;
  type: 'upload' | 'qr_generated' | 'email_sent' | 'email_failed' | 'retry';
  message: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface AdminUser {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  lastLogin?: string;
}

export interface JwtPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}

export interface ParsedStudentRow {
  studentId: string;
  name: string;
  email: string;
  mobile: string;
  department: string;
  rowIndex: number;
  errors: string[];
}

export interface ValidationResult {
  valid: ParsedStudentRow[];
  invalid: ParsedStudentRow[];
  duplicates: ParsedStudentRow[];
}

export interface EmailConfig {
  provider: 'smtp' | 'gmail' | 'sendgrid' | 'brevo' | 'resend';
  from: string;
  fromName: string;
}

export interface ReportRow {
  'Student ID': string;
  'Name': string;
  'Email': string;
  'Department': string;
  'QR Generated': string;
  'Email Status': string;
  'Time Sent': string;
  'Failure Reason': string;
}
