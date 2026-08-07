import { apiClient } from './client';
import {
  AdminUser, ApiResponse, ChartData, DashboardStats,
  ProcessingJob, Student, UploadBatch, UploadPreview,
} from '../types';

// =============================================
// Auth
// =============================================
export const authApi = {
  login: (email: string, password: string) =>
    apiClient.post<ApiResponse<{ token: string; admin: AdminUser }>>('/auth/login', { email, password }),

  logout: () => apiClient.post('/auth/logout'),

  me: () => apiClient.get<ApiResponse<AdminUser>>('/auth/me'),
};

// =============================================
// Upload
// =============================================
export const uploadApi = {
  upload: (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return apiClient.post<ApiResponse<UploadPreview>>('/upload', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  confirm: (
    filePath: string,
    fileName: string,
    validRecords?: any[],
    totalRows?: number,
    invalidCount?: number,
    duplicateCount?: number
  ) =>
    apiClient.post<ApiResponse<{ batchId: string; imported: number; batch: UploadBatch }>>(
      '/upload/confirm',
      { filePath, fileName, validRecords, totalRows, invalidCount, duplicateCount }
    ),
};

// =============================================
// Students
// =============================================
export const studentsApi = {
  getAll: (params?: { search?: string; status?: string; batchId?: string }) =>
    apiClient.get<ApiResponse<Student[]>>('/students', { params }),

  getBatches: () =>
    apiClient.get<ApiResponse<UploadBatch[]>>('/students/batches'),

  getBatch: (id: string) =>
    apiClient.get<ApiResponse<{ batch: UploadBatch; students: Student[] }>>(`/students/batches/${id}`),
};

// =============================================
// Processing
// =============================================
export const processingApi = {
  generateQr: (batchId: string) =>
    apiClient.post<ApiResponse<{ jobId: string }>>('/processing/generate-qr', { batchId }),

  sendEmails: (batchId: string, retryFailed = false, forceResend = false) =>
    apiClient.post<ApiResponse<{ jobId: string }>>('/processing/send-emails', { batchId, retryFailed, forceResend }),

  retryFailed: () =>
    apiClient.post<ApiResponse<{ jobId: string }>>('/processing/retry-failed'),

  getJob: (jobId: string) =>
    apiClient.get<ApiResponse<ProcessingJob>>(`/processing/jobs/${jobId}`),

  getJobsByBatch: (batchId: string) =>
    apiClient.get<ApiResponse<ProcessingJob[]>>(`/processing/jobs/batch/${batchId}`),

  // SSE progress — returns an EventSource
  streamProgress: (jobId: string): EventSource => {
    const token = localStorage.getItem('sp_token');
    const base = import.meta.env.VITE_API_URL || '/api';
    return new EventSource(`${base}/processing/progress/${jobId}?token=${token}`);
  },
};

// =============================================
// Dashboard
// =============================================
export const dashboardApi = {
  getStats: () =>
    apiClient.get<ApiResponse<DashboardStats>>('/dashboard/stats'),

  getChartData: () =>
    apiClient.get<ApiResponse<ChartData>>('/dashboard/chart-data'),
};

// =============================================
// Reports
// =============================================
export const reportsApi = {
  downloadCsv: (batchId?: string) => {
    const token = localStorage.getItem('sp_token');
    const base = import.meta.env.VITE_API_URL || '/api';
    const params = new URLSearchParams();
    if (batchId) params.set('batchId', batchId);
    params.set('token', token || '');
    window.open(`${base}/reports/csv?${params.toString()}`, '_blank');
  },

  downloadExcel: (batchId?: string) => {
    const token = localStorage.getItem('sp_token');
    const base = import.meta.env.VITE_API_URL || '/api';
    const params = new URLSearchParams();
    if (batchId) params.set('batchId', batchId);
    params.set('token', token || '');
    window.open(`${base}/reports/excel?${params.toString()}`, '_blank');
  },

  getSummary: () =>
    apiClient.get('/reports/summary'),
};
