import { Router, Request, Response, NextFunction } from 'express';
import * as XLSX from 'xlsx';
import jwt from 'jsonwebtoken';
import { authenticateToken } from '../middleware/auth';
import { dbGetStudents, dbGetStudentsByBatch } from '../models/database';
import { ReportRow, JwtPayload } from '../types';

const router = Router();

// Allow token via query param for direct download links
function authViaQueryOrHeader(req: Request, res: Response, next: NextFunction): void {
  const qToken = req.query.token as string | undefined;
  if (qToken) {
    try {
      jwt.verify(qToken, process.env.JWT_SECRET!) as JwtPayload;
      next();
    } catch {
      res.status(403).json({ success: false, message: 'Invalid token' });
    }
    return;
  }
  authenticateToken(req, res, next);
}

function buildReportRows(students: ReturnType<typeof dbGetStudents>): ReportRow[] {
  return students.map(s => ({
    'Student ID': s.studentId,
    'Name': s.name,
    'Email': s.email,
    'Department': s.department,
    'QR Generated': s.qrGenerated ? 'Yes' : 'No',
    'Email Status': s.emailStatus.charAt(0).toUpperCase() + s.emailStatus.slice(1),
    'Time Sent': s.emailSentAt ? new Date(s.emailSentAt).toLocaleString() : '-',
    'Failure Reason': s.failureReason || '-',
  }));
}

// GET /api/reports/csv?batchId=xxx
router.get('/csv', authViaQueryOrHeader, (req: Request, res: Response): void => {
  const { batchId } = req.query as { batchId?: string };
  const students = batchId ? dbGetStudentsByBatch(batchId) : dbGetStudents();
  const rows = buildReportRows(students);

  if (rows.length === 0) {
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="shield-protocol-report-${Date.now()}.csv"`);
    res.send('Student ID,Name,Email,Department,QR Generated,Email Status,Time Sent,Failure Reason\n');
    return;
  }

  const headers = Object.keys(rows[0]);
  const csvLines = [
    headers.join(','),
    ...rows.map(r =>
      headers.map(h => `"${String(r[h as keyof ReportRow]).replace(/"/g, '""')}"`).join(',')
    ),
  ];

  const csv = csvLines.join('\n');
  const fileName = `shield-protocol-report-${Date.now()}.csv`;

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
  res.send(csv);
});

// GET /api/reports/excel?batchId=xxx
router.get('/excel', authViaQueryOrHeader, (req: Request, res: Response): void => {
  const { batchId } = req.query as { batchId?: string };
  const students = batchId ? dbGetStudentsByBatch(batchId) : dbGetStudents();
  const rows = buildReportRows(students);

  const wb = XLSX.utils.book_new();
  const wsData = rows.length > 0 ? rows : [{ 'Student ID': '', Name: '', Email: '', Department: '', 'QR Generated': '', 'Email Status': '', 'Time Sent': '', 'Failure Reason': '' }];
  const ws = XLSX.utils.json_to_sheet(wsData);

  // Style header row width
  ws['!cols'] = [
    { wch: 14 }, { wch: 25 }, { wch: 35 }, { wch: 18 },
    { wch: 14 }, { wch: 14 }, { wch: 22 }, { wch: 40 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Students Report');

  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  const fileName = `shield-protocol-report-${Date.now()}.xlsx`;

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
  res.send(buf);
});

// GET /api/reports/summary
router.get('/summary', authenticateToken, (_req: Request, res: Response): void => {
  const students = dbGetStudents();
  res.json({
    success: true,
    data: {
      total: students.length,
      qrGenerated: students.filter(s => s.qrGenerated).length,
      sent: students.filter(s => s.emailStatus === 'sent').length,
      failed: students.filter(s => s.emailStatus === 'failed').length,
      pending: students.filter(s => s.emailStatus === 'pending').length,
    },
  });
});

export default router;
