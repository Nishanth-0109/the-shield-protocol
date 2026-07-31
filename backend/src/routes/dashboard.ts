import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  dbGetStudents,
  dbGetBatches,
  dbGetActivity,
} from '../models/database';
import { DashboardStats } from '../types';

const router = Router();

// GET /api/dashboard/stats
router.get('/stats', authenticateToken, (_req: Request, res: Response): void => {
  const students = dbGetStudents();
  const batches = dbGetBatches();
  const activity = dbGetActivity(20);

  const stats: DashboardStats = {
    totalStudents: students.length,
    qrGenerated: students.filter(s => s.qrGenerated).length,
    emailsSent: students.filter(s => s.emailStatus === 'sent').length,
    emailsFailed: students.filter(s => s.emailStatus === 'failed').length,
    emailsPending: students.filter(s => s.emailStatus === 'pending' || s.emailStatus === 'queued').length,
    recentBatches: batches.slice(0, 5),
    activityTimeline: activity,
  };

  res.json({ success: true, data: stats });
});

// GET /api/dashboard/chart-data — email status breakdown per batch
router.get('/chart-data', authenticateToken, (_req: Request, res: Response): void => {
  const students = dbGetStudents();
  const batches = dbGetBatches();

  const byStatus = [
    { label: 'Sent', value: students.filter(s => s.emailStatus === 'sent').length, color: '#22c55e' },
    { label: 'Pending', value: students.filter(s => s.emailStatus === 'pending').length, color: '#3b82f6' },
    { label: 'Failed', value: students.filter(s => s.emailStatus === 'failed').length, color: '#ef4444' },
    { label: 'Queued', value: students.filter(s => s.emailStatus === 'queued').length, color: '#f59e0b' },
    { label: 'Sending', value: students.filter(s => s.emailStatus === 'sending').length, color: '#8b5cf6' },
  ];

  const byBatch = batches.slice(0, 6).map(b => {
    const bs = students.filter(s => s.uploadBatchId === b.id);
    return {
      name: b.fileName,
      total: bs.length,
      sent: bs.filter(s => s.emailStatus === 'sent').length,
      failed: bs.filter(s => s.emailStatus === 'failed').length,
    };
  });

  res.json({ success: true, data: { byStatus, byBatch } });
});

export default router;
