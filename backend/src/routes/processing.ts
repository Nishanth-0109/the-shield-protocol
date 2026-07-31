import { Router, Request, Response } from 'express';
import path from 'path';
import jwt from 'jsonwebtoken';
import { authenticateToken } from '../middleware/auth';
import {
  startQrGenerationJob,
  startEmailSendingJob,
  retryAllFailedEmails,
  getJobProgress,
} from '../services/processingService';
import { dbGetJobById, dbGetJobsByBatch } from '../models/database';
import { JwtPayload } from '../types';

const router = Router();

const LOGO_PATH = path.join(process.cwd(), 'assets', 'shield-logo.png');

// POST /api/processing/generate-qr
router.post('/generate-qr', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  const { batchId } = req.body as { batchId?: string };
  if (!batchId) { res.status(400).json({ success: false, message: 'batchId required' }); return; }

  const jobId = await startQrGenerationJob(batchId, LOGO_PATH);
  res.json({ success: true, data: { jobId }, message: 'QR generation started' });
});

// POST /api/processing/send-emails
router.post('/send-emails', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  const { batchId, retryFailed, forceResend } = req.body as { batchId?: string; retryFailed?: boolean; forceResend?: boolean };
  if (!batchId) { res.status(400).json({ success: false, message: 'batchId required' }); return; }

  const jobId = await startEmailSendingJob(batchId, retryFailed, forceResend);
  res.json({ success: true, data: { jobId }, message: 'Email sending started' });
});

// POST /api/processing/retry-failed
router.post('/retry-failed', authenticateToken, async (_req: Request, res: Response): Promise<void> => {
  const jobId = await retryAllFailedEmails();
  res.json({ success: true, data: { jobId }, message: 'Retry job started' });
});

// GET /api/processing/jobs/:jobId — poll job progress
router.get('/jobs/:jobId', authenticateToken, (req: Request, res: Response): void => {
  const live = getJobProgress(req.params.jobId);
  if (live) { res.json({ success: true, data: live }); return; }

  const persisted = dbGetJobById(req.params.jobId);
  if (!persisted) { res.status(404).json({ success: false, message: 'Job not found' }); return; }

  res.json({ success: true, data: persisted });
});

// GET /api/processing/jobs/batch/:batchId
router.get('/jobs/batch/:batchId', authenticateToken, (req: Request, res: Response): void => {
  const jobs = dbGetJobsByBatch(req.params.batchId);
  res.json({ success: true, data: jobs });
});

// GET /api/processing/progress/:jobId  — SSE stream for real-time updates
router.get('/progress/:jobId', (req: Request, res: Response): void => {
  const { jobId } = req.params;

  // Auth via query token (for EventSource which can't set headers)
  const qToken = req.query.token as string | undefined;
  const authHeader = req.headers['authorization'];
  const token = qToken || (authHeader ? authHeader.split(' ')[1] : '');
  if (!token) { res.status(401).json({ success: false, message: 'Token required' }); return; }
  try {
    jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
  } catch {
    res.status(403).json({ success: false, message: 'Invalid token' }); return;
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const sendEvent = (data: unknown) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  const interval = setInterval(() => {
    const job = getJobProgress(jobId) || dbGetJobById(jobId);
    if (!job) {
      sendEvent({ error: 'Job not found' });
      clearInterval(interval);
      res.end();
      return;
    }

    sendEvent(job);

    if (job.status === 'completed' || job.status === 'failed') {
      clearInterval(interval);
      setTimeout(() => res.end(), 500);
    }
  }, 800);

  req.on('close', () => clearInterval(interval));
});

export default router;
