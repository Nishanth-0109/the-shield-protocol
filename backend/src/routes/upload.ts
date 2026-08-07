import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { authenticateToken } from '../middleware/auth';
import { parseUploadedFile, parseUploadedBuffer, validateAndMapRows, mapToStudents } from '../services/csvService';
import { dbInsertBatch, dbInsertStudents, dbInsertActivity } from '../models/database';
import { ApiResponse, UploadBatch } from '../types';

const router = Router();

// Configure multer with memory storage (works seamlessly on Vercel & serverless)
const storage = multer.memoryStorage();

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowed = ['.csv', '.xlsx', '.xls'];
  const ext = path.extname(file.originalname).toLowerCase();
  const mimetype = (file.mimetype || '').toLowerCase();
  if (allowed.includes(ext) || mimetype.includes('csv') || mimetype.includes('spreadsheet') || mimetype.includes('excel')) {
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
  (req: Request, res: Response, next) => {
    upload.single('file')(req, res, (err) => {
      if (err) {
        console.error('[Upload Middleware Error]:', err);
        return res.status(400).json({
          success: false,
          message: err.message || 'File upload failed',
          details: 'Multipart file parsing error.'
        });
      }
      next();
    });
  },
  async (req: Request, res: Response): Promise<void> => {
    if (!req.file || !req.file.buffer) {
      res.status(400).json({ success: false, message: 'No file received', details: 'Uploaded file payload or buffer was empty.' });
      return;
    }

    try {
      console.log(`[Upload API] Received file: "${req.file.originalname}" (${req.file.size} bytes, MIME: ${req.file.mimetype})`);
      const { rows, headers } = parseUploadedBuffer(req.file.buffer, req.file.originalname);
      
      if (!rows || rows.length === 0) {
        res.status(400).json({
          success: false,
          message: 'File is empty',
          details: 'No data rows found in the uploaded file.'
        });
        return;
      }

      const validation = validateAndMapRows(rows, headers);
      console.log(`[Upload API] Validation result: Total: ${rows.length}, Valid: ${validation.valid.length}, Invalid: ${validation.invalid.length}, Duplicates: ${validation.duplicates.length}`);

      const response: ApiResponse = {
        success: true,
        data: {
          filePath: 'memory://' + req.file.originalname,
          fileName: req.file.originalname,
          headers,
          valid: validation.valid,
          invalid: validation.invalid,
          duplicates: validation.duplicates,
          totalRows: rows.length,
        },
      };

      res.json(response);
    } catch (err: any) {
      console.error('[Upload API Exception]:', err);
      res.status(400).json({
        success: false,
        message: err?.message || 'Failed to process file format',
        details: 'The uploaded file content or structure could not be parsed.'
      });
    }
  }
);

// POST /api/upload/confirm — finalize import into DB
router.post(
  '/confirm',
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    const { filePath, fileName, validRecords, totalRows, invalidCount, duplicateCount } = req.body as {
      filePath?: string;
      fileName?: string;
      validRecords?: any[];
      totalRows?: number;
      invalidCount?: number;
      duplicateCount?: number;
    };

    let validList: any[] = [];
    let rowsLength = totalRows || 0;
    let invCount = invalidCount || 0;
    let dupCount = duplicateCount || 0;

    if (Array.isArray(validRecords) && validRecords.length > 0) {
      validList = validRecords;
    } else if (filePath && !filePath.startsWith('memory://') && fs.existsSync(filePath)) {
      const { rows, headers } = parseUploadedFile(filePath);
      const validation = validateAndMapRows(rows, headers);
      validList = validation.valid;
      rowsLength = rows.length;
      invCount = validation.invalid.length;
      dupCount = validation.duplicates.length;
    } else {
      res.status(400).json({ success: false, message: 'No valid records to import. Please upload the file again.' });
      return;
    }

    if (validList.length === 0) {
      res.status(400).json({ success: false, message: 'No valid records to import' });
      return;
    }

    const batchId = uuidv4();
    const batchName = fileName || 'Imported_List.csv';

    const batch: UploadBatch = {
      id: batchId,
      fileName: batchName,
      totalRecords: rowsLength || validList.length,
      validRecords: validList.length,
      duplicateRecords: dupCount,
      invalidRecords: invCount,
      uploadedAt: new Date().toISOString(),
      status: 'uploaded',
    };

    dbInsertBatch(batch);

    const students = mapToStudents(validList, batchId);
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
