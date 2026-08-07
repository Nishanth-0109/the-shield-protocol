import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { ParsedStudentRow, ValidationResult, Student } from '../types';
import { dbGetStudentByStudentId } from '../models/database';

// =============================================
// Column name aliases (case-insensitive mapping)
// =============================================
const COLUMN_ALIASES: Record<string, string[]> = {
  studentId: ['student id', 'studentid', 'registration id', 'reg id', 'id', 'sp id', 'roll no', 'rollno', 'student_id', 'reg_no', 'registration_number', 'regno'],
  name: ['student name', 'name', 'full name', 'fullname', 'student_name', 'first name', 'student'],
  email: ['email', 'email address', 'e-mail', 'mail', 'email_address', 'student email', 'student_email'],
  mobile: ['mobile', 'phone', 'mobile no', 'phone number', 'contact', 'mobile_no', 'phone_no', 'mobile number', 'contact_no'],
  department: ['dept', 'department', 'branch', 'dept/branch', 'dept / branch', 'stream', 'course', 'sec', 'section'],
};

function findColumn(headers: string[], field: string): number {
  const aliases = COLUMN_ALIASES[field] || [field];
  for (let i = 0; i < headers.length; i++) {
    const h = headers[i].toLowerCase().trim();
    if (aliases.some(a => a === h)) return i;
  }
  return -1;
}

function isValidEmail(email: string): boolean {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function isValidMobile(mobile: string): boolean {
  if (!mobile) return true; // Mobile is optional
  const digits = mobile.replace(/\D/g, '');
  return digits.length >= 7 && digits.length <= 15;
}

function isValidStudentId(id: string): boolean {
  if (!id || !id.trim()) return false;
  // Accept any non-empty alphanumeric student ID (allowing hyphens, underscores, slashes, spaces) between 1 and 50 chars
  return /^[A-Za-z0-9_\/\s-]{1,50}$/.test(id.trim());
}

export function parseUploadedBuffer(buffer: Buffer, filename: string): { rows: string[][]; headers: string[] } {
  const ext = path.extname(filename).toLowerCase();

  if (ext === '.csv' || !ext) {
    try {
      const content = buffer.toString('utf-8');
      const cleanContent = content.replace(/^\uFEFF/, ''); // Strip BOM marker
      const lines = cleanContent.split(/\r?\n/).filter(l => l.trim().length > 0);
      if (lines.length > 0) {
        // Auto-detect delimiter (comma or semicolon)
        const delimiter = lines[0].includes(';') ? ';' : ',';
        const rows = lines.map(l => l.split(delimiter).map(c => c.trim().replace(/^"|"$/g, '')));
        const headers = rows[0] || [];
        return { rows: rows.slice(1), headers };
      }
    } catch {
      // Fallback to XLSX parser below
    }
  }

  // XLSX / XLS / CSV fallback from buffer
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, defval: '' });
  const headers = (data[0] as string[]).map(String);
  const rows = data.slice(1).map(r => (r as unknown[]).map(String));
  return { rows, headers };
}

// =============================================
// Parse uploaded file path (CSV/XLSX/XLS)
// =============================================
export function parseUploadedFile(filePath: string): { rows: string[][]; headers: string[] } {
  const ext = path.extname(filePath).toLowerCase();

  if (ext === '.csv' || !ext) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const cleanContent = content.replace(/^\uFEFF/, ''); // Strip BOM marker
      const lines = cleanContent.split(/\r?\n/).filter(l => l.trim().length > 0);
      if (lines.length > 0) {
        // Auto-detect delimiter (comma or semicolon)
        const delimiter = lines[0].includes(';') ? ';' : ',';
        const rows = lines.map(l => l.split(delimiter).map(c => c.trim().replace(/^"|"$/g, '')));
        const headers = rows[0] || [];
        return { rows: rows.slice(1), headers };
      }
    } catch {
      // Fallback to XLSX parser if plain text read fails
    }
  }

  // XLSX / XLS / CSV fallback
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, defval: '' });
  const headers = (data[0] as string[]).map(String);
  const rows = data.slice(1).map(r => (r as unknown[]).map(String));
  return { rows, headers };
}

// =============================================
// Validate and map rows to ParsedStudentRow[]
// =============================================
export function validateAndMapRows(
  rows: string[][],
  headers: string[]
): ValidationResult {
  let sIdCol = findColumn(headers, 'studentId');
  let nameCol = findColumn(headers, 'name');
  let emailCol = findColumn(headers, 'email');
  let mobileCol = findColumn(headers, 'mobile');
  let deptCol = findColumn(headers, 'department');

  // Fallback to positional columns (0=StudentId, 1=Name, 2=Email, 3=Mobile, 4=Dept) if header matching failed
  if (sIdCol === -1 && nameCol === -1 && emailCol === -1) {
    if (headers.length >= 3) {
      sIdCol = 0;
      nameCol = 1;
      emailCol = 2;
      if (headers.length >= 4) mobileCol = 3;
      if (headers.length >= 5) deptCol = 4;
    }
  }

  const colIdx = {
    studentId: sIdCol,
    name: nameCol,
    email: emailCol,
    mobile: mobileCol,
    department: deptCol,
  };

  const valid: ParsedStudentRow[] = [];
  const invalid: ParsedStudentRow[] = [];
  const duplicates: ParsedStudentRow[] = [];

  // Track duplicates within the file itself
  const seenIds = new Set<string>();
  const seenEmails = new Set<string>();

  rows.forEach((row, rowIndex) => {
    const get = (col: number) => (col >= 0 ? (row[col] || '').trim() : '');

    const parsed: ParsedStudentRow = {
      studentId: get(colIdx.studentId).toUpperCase(),
      name: get(colIdx.name),
      email: get(colIdx.email).toLowerCase(),
      mobile: get(colIdx.mobile),
      department: get(colIdx.department),
      rowIndex: rowIndex + 2, // 1-based + header row
      errors: [],
    };

    // Skip completely empty rows
    if (!parsed.studentId && !parsed.name && !parsed.email) return;

    // Validate fields
    if (!parsed.studentId) {
      parsed.errors.push('Student ID is required');
    } else if (!isValidStudentId(parsed.studentId)) {
      parsed.errors.push(`Invalid Student ID format: "${parsed.studentId}"`);
    }

    if (!parsed.name) parsed.errors.push('Name is required');
    if (!parsed.email) {
      parsed.errors.push('Email is required');
    } else if (!isValidEmail(parsed.email)) {
      parsed.errors.push(`Invalid email format: "${parsed.email}"`);
    }
    if (parsed.mobile && !isValidMobile(parsed.mobile)) {
      parsed.errors.push(`Invalid mobile number: "${parsed.mobile}"`);
    }

    if (parsed.errors.length > 0) {
      invalid.push(parsed);
      return;
    }

    // Check for duplicates in this file
    if (seenIds.has(parsed.studentId) || seenEmails.has(parsed.email)) {
      parsed.errors.push('Duplicate in uploaded file');
      duplicates.push(parsed);
      return;
    }
    seenIds.add(parsed.studentId);
    seenEmails.add(parsed.email);

    // Check against existing DB records
    const existing = dbGetStudentByStudentId(parsed.studentId);
    if (existing) {
      parsed.errors.push(`Student ID ${parsed.studentId} already exists in database`);
      duplicates.push(parsed);
      return;
    }

    valid.push(parsed);
  });

  return { valid, invalid, duplicates };
}

// =============================================
// Convert validated rows to Student records
// =============================================
export function mapToStudents(
  rows: ParsedStudentRow[],
  batchId: string
): Student[] {
  return rows.map(row => ({
    id: uuidv4(),
    studentId: row.studentId,
    name: row.name,
    email: row.email,
    mobile: row.mobile,
    department: row.department,
    qrGenerated: false,
    emailStatus: 'pending' as const,
    uploadBatchId: batchId,
    createdAt: new Date().toISOString(),
  }));
}
