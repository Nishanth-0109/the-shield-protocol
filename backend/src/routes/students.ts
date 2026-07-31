import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  dbGetStudents,
  dbGetStudentsByBatch,
  dbGetStudentsByStatus,
  dbSearchStudents,
  dbGetBatches,
  dbGetBatchById,
} from '../models/database';

const router = Router();

// GET /api/students — with optional filters
router.get('/', authenticateToken, (req: Request, res: Response): void => {
  const { search, status, batchId } = req.query as {
    search?: string;
    status?: string;
    batchId?: string;
  };

  let students = dbGetStudents();

  if (search) {
    students = dbSearchStudents(search);
  }

  if (status && status !== 'all') {
    students = students.filter(s => s.emailStatus === status);
  }

  if (batchId) {
    students = students.filter(s => s.uploadBatchId === batchId);
  }

  // Sort newest first
  students = students.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  res.json({ success: true, data: students, total: students.length });
});

// GET /api/students/batches
router.get('/batches', authenticateToken, (_req: Request, res: Response): void => {
  const batches = dbGetBatches();
  res.json({ success: true, data: batches });
});

// GET /api/students/batches/:id
router.get('/batches/:id', authenticateToken, (req: Request, res: Response): void => {
  const batch = dbGetBatchById(req.params.id);
  if (!batch) {
    res.status(404).json({ success: false, message: 'Batch not found' });
    return;
  }
  const students = dbGetStudentsByBatch(req.params.id);
  res.json({ success: true, data: { batch, students } });
});

export default router;
