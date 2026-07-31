import { v4 as uuidv4 } from 'uuid';
import { Student, ProcessingJob } from '../types';
import {
  dbGetStudentsByBatch,
  dbGetStudentsByStatus,
  dbUpdateStudent,
  dbInsertJob,
  dbUpdateJob,
  dbInsertActivity,
} from '../models/database';
import { generateAndSaveQr, getQrFilePath } from './qrService';
import { sendStudentEmail } from './emailService';
import { logger } from '../utils/logger';

// In-memory store for active job progress
const jobProgress = new Map<string, ProcessingJob>();

export function getJobProgress(jobId: string): ProcessingJob | undefined {
  return jobProgress.get(jobId);
}

// =============================================
// QR Code Generation Job
// =============================================
export async function startQrGenerationJob(batchId: string, logoPath?: string): Promise<string> {
  const students = dbGetStudentsByBatch(batchId);

  const job: ProcessingJob = {
    id: uuidv4(),
    batchId,
    type: 'qr_generation',
    status: 'running',
    total: students.length,
    processed: 0,
    successful: 0,
    failed: 0,
    startedAt: new Date().toISOString(),
  };

  dbInsertJob(job);
  jobProgress.set(job.id, { ...job });

  // Run in background
  runQrJob(job.id, students, logoPath).catch(err =>
    logger.error('[JOB] QR generation error:', err)
  );

  return job.id;
}

async function runQrJob(jobId: string, students: Student[], logoPath?: string): Promise<void> {
  const startTime = Date.now();

  for (let i = 0; i < students.length; i++) {
    const student = students[i];

    try {
      const qrPath = await generateAndSaveQr(student.studentId, logoPath);
      dbUpdateStudent(student.id, {
        qrGenerated: true,
        qrPath,
      });

      const current = jobProgress.get(jobId)!;
      current.processed = i + 1;
      current.successful += 1;
      const elapsed = Date.now() - startTime;
      const avgMs = elapsed / (i + 1);
      current.estimatedRemaining = Math.round((avgMs * (students.length - i - 1)) / 1000);
      jobProgress.set(jobId, { ...current });

      dbUpdateJob(jobId, {
        processed: current.processed,
        successful: current.successful,
        estimatedRemaining: current.estimatedRemaining,
      });

    } catch (err) {
      logger.error(`[JOB] QR failed for ${student.studentId}:`, err);
      const current = jobProgress.get(jobId)!;
      current.processed = i + 1;
      current.failed += 1;
      jobProgress.set(jobId, { ...current });

      dbUpdateJob(jobId, {
        processed: current.processed,
        failed: current.failed,
      });
    }

    // Small delay between QR generations
    await new Promise(r => setTimeout(r, 100));
  }

  // Complete job
  const finalJob = jobProgress.get(jobId)!;
  finalJob.status = finalJob.failed === finalJob.total && finalJob.total > 0 ? 'failed' : 'completed';
  finalJob.completedAt = new Date().toISOString();
  finalJob.estimatedRemaining = 0;
  jobProgress.set(jobId, { ...finalJob });

  dbUpdateJob(jobId, {
    status: finalJob.status,
    completedAt: finalJob.completedAt,
    estimatedRemaining: 0,
  });

  dbInsertActivity({
    id: uuidv4(),
    type: 'qr_generated',
    message: `QR code generation completed: ${finalJob.successful}/${finalJob.total} success`,
    timestamp: new Date().toISOString(),
  });

  logger.success(`[JOB] QR job ${jobId} complete: ${finalJob.successful}/${finalJob.total}`);
}

// =============================================
// Email Sending Job
// =============================================
export async function startEmailSendingJob(
  batchId: string,
  retryFailed = false,
  forceResend = false
): Promise<string> {
  let students: Student[];

  if (retryFailed) {
    students = dbGetStudentsByStatus('failed').filter(
      s => s.uploadBatchId === batchId
    );
  } else if (forceResend) {
    students = dbGetStudentsByBatch(batchId).filter(
      s => s.qrGenerated
    );
  } else {
    students = dbGetStudentsByBatch(batchId).filter(
      s => s.qrGenerated && (s.emailStatus === 'pending' || !s.emailStatus)
    );

    // Fallback: If 0 pending students found, target all batch students with QR codes
    if (students.length === 0 && !retryFailed) {
      students = dbGetStudentsByBatch(batchId).filter(s => s.qrGenerated);
    }
  }

  const job: ProcessingJob = {
    id: uuidv4(),
    batchId,
    type: 'email_sending',
    status: 'running',
    total: students.length,
    processed: 0,
    successful: 0,
    failed: 0,
    startedAt: new Date().toISOString(),
  };

  dbInsertJob(job);
  jobProgress.set(job.id, { ...job });

  // Update students to queued
  for (const s of students) {
    dbUpdateStudent(s.id, { emailStatus: 'queued' });
  }

  runEmailJob(job.id, students).catch(err =>
    logger.error('[JOB] Email sending error:', err)
  );

  return job.id;
}

async function runEmailJob(jobId: string, students: Student[]): Promise<void> {
  const startTime = Date.now();

  for (let i = 0; i < students.length; i++) {
    const student = students[i];
    dbUpdateStudent(student.id, { emailStatus: 'sending' });

    const qrPath = getQrFilePath(student.studentId);

    try {
      await sendStudentEmail(student, qrPath);
      dbUpdateStudent(student.id, {
        emailStatus: 'sent',
        emailSentAt: new Date().toISOString(),
        failureReason: undefined,
      });

      const current = jobProgress.get(jobId)!;
      current.processed = i + 1;
      current.successful += 1;
      const elapsed = Date.now() - startTime;
      const avgMs = elapsed / (i + 1);
      current.estimatedRemaining = Math.round((avgMs * (students.length - i - 1)) / 1000);
      jobProgress.set(jobId, { ...current });

      dbUpdateJob(jobId, {
        processed: current.processed,
        successful: current.successful,
        estimatedRemaining: current.estimatedRemaining,
      });

      dbInsertActivity({
        id: uuidv4(),
        type: 'email_sent',
        message: `Email sent to ${student.name} (${student.studentId})`,
        timestamp: new Date().toISOString(),
      });

    } catch (err) {
      const reason = err instanceof Error ? err.message : 'Unknown error';
      logger.error(`[JOB] Email failed for ${student.studentId}:`, reason);

      dbUpdateStudent(student.id, {
        emailStatus: 'failed',
        failureReason: reason,
      });

      const current = jobProgress.get(jobId)!;
      current.processed = i + 1;
      current.failed += 1;
      jobProgress.set(jobId, { ...current });

      dbUpdateJob(jobId, {
        processed: current.processed,
        failed: current.failed,
      });
    }

    // 300ms delay between emails to respect SMTP limits
    await new Promise(r => setTimeout(r, 300));
  }

  // Complete job
  const finalJob = jobProgress.get(jobId)!;
  finalJob.status = finalJob.failed === finalJob.total && finalJob.total > 0 ? 'failed' : 'completed';
  finalJob.completedAt = new Date().toISOString();
  finalJob.estimatedRemaining = 0;
  jobProgress.set(jobId, { ...finalJob });

  dbUpdateJob(jobId, {
    status: finalJob.status,
    completedAt: finalJob.completedAt,
    estimatedRemaining: 0,
  });

  dbInsertActivity({
    id: uuidv4(),
    type: 'email_sent',
    message: `Email sending completed: ${finalJob.successful}/${finalJob.total} sent`,
    timestamp: new Date().toISOString(),
  });

  logger.success(`[JOB] Email job ${jobId} complete: ${finalJob.successful}/${finalJob.total}`);
}

// =============================================
// Retry all failed emails across system
// =============================================
export async function retryAllFailedEmails(): Promise<string> {
  const failedStudents = dbGetStudentsByStatus('failed');

  const job: ProcessingJob = {
    id: uuidv4(),
    batchId: 'all_failed',
    type: 'email_sending',
    status: 'running',
    total: failedStudents.length,
    processed: 0,
    successful: 0,
    failed: 0,
    startedAt: new Date().toISOString(),
  };

  dbInsertJob(job);
  jobProgress.set(job.id, { ...job });

  runEmailJob(job.id, failedStudents).catch(err =>
    logger.error('[JOB] Retry failed error:', err)
  );

  return job.id;
}
