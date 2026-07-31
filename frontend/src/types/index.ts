export type EmailStatus = 'pending' | 'queued' | 'sending' | 'sent' | 'failed';

export interface Student {
  id: string;
  studentId: string;
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

export interface UploadBatch {
  id: string;
  fileName: string;
  totalRecords: number;
  validRecords: number;
  duplicateRecords: number;
  invalidRecords: number;
  uploadedAt: string;
  status: 'uploaded' | 'processing' | 'completed' | 'failed';
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
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  lastLogin?: string;
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

export interface UploadPreview {
  filePath: string;
  fileName: string;
  headers: string[];
  valid: ParsedStudentRow[];
  invalid: ParsedStudentRow[];
  duplicates: ParsedStudentRow[];
  totalRows: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
  total?: number;
}

export interface ChartData {
  byStatus: { label: string; value: number; color: string }[];
  byBatch: { name: string; total: number; sent: number; failed: number }[];
}
