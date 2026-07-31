import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { authenticateToken } from '../middleware/auth';
import { parseUploadedFile, validateAndMapRows, mapToStudents } from '../services/csvService';
import { dbInsertBatch, dbInsertStudents, dbInsertActivity } from '../models/database';
import { ApiResponse, UploadBatch } from '../types';

const router = Router();

// Configure multer — only allow CSV/XLS/XLSX
const UPLOAD_DIR = path.join(process.cwd(), process.env.UPLOAD_DIR || 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, unique);
  },
});

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowed = ['.csv', '.xlsx', '.xls'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only CSV, XLSX, and XLS files are allowed'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

// POST /api/upload — upload and preview (no DB insert yet)
router.post(
  '/',
  authenticateToken,
  upload.single('file'),
  async (req: Request, res: Response): Promise<void> => {
    if (!req.file) {
      res.status(400).json({ success: false, message: 'No file uploaded' });
      return;
    }

    try {
      const { rows, headers } = parseUploadedFile(req.file.path);
      const validation = validateAndMapRows(rows, headers);

      const response: ApiResponse = {
        success: true,
        data: {
          filePath: req.file.path,
          fileName: req.file.originalname,
          headers,
          valid: validation.valid,
          invalid: validation.invalid,
          duplicates: validation.duplicates,
          totalRows: rows.length,
        },
      };

      res.json(response);
    } catch (err) {
      // Cleanup uploaded file on parse error
      fs.unlinkSync(req.file.path);
      throw err;
    }
  }
);

// POST /api/upload/confirm — finalize import into DB
router.post(
  '/confirm',
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    const { filePath, fileName } = req.body as { filePath?: string; fileName?: string };

    if (!filePath || !fs.existsSync(filePath)) {
      res.status(400).json({ success: false, message: 'Invalid or missing file path' });
      return;
    }

    const { rows, headers } = parseUploadedFile(filePath);
    const validation = validateAndMapRows(rows, headers);

    if (validation.valid.length === 0) {
      res.status(400).json({ success: false, message: 'No valid records to import' });
      return;
    }

    const batchId = uuidv4();

    const batch: UploadBatch = {
      id: batchId,
      fileName: fileName || path.basename(filePath),
      totalRecords: rows.length,
      validRecords: validation.valid.length,
      duplicateRecords: validation.duplicates.length,
      invalidRecords: validation.invalid.length,
      uploadedAt: new Date().toISOString(),
      status: 'uploaded',
    };

    dbInsertBatch(batch);

    const students = mapToStudents(validation.valid, batchId);
    dbInsertStudents(students);

    dbInsertActivity({
      id: uuidv4(),
      type: 'upload',
      message: `Imported ${students.length} students from ${batch.fileName}`,
      timestamp: new Date().toISOString(),
      metadata: { batchId, fileName: batch.fileName },
    });

    res.json({
      success: true,
      data: { batchId, imported: students.length, batch },
      message: `Successfully imported ${students.length} students`,
    });
  }
);

export default router;
