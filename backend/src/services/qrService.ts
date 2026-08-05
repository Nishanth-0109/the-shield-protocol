import QRCode from 'qrcode';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { logger } from '../utils/logger';
import { getSupabaseClient, isSupabaseEnabled } from '../config/supabaseClient';

const QR_SIZE = 500;          // px — base QR canvas
const LOGO_RATIO = 0.18;      // logo occupies ~18% of QR width
const LOGO_SIZE = Math.round(QR_SIZE * LOGO_RATIO);
const isVercel = !!process.env.VERCEL;
const QR_OUTPUT_DIR = process.env.QR_OUTPUT_DIR
  ? path.resolve(process.env.QR_OUTPUT_DIR)
  : isVercel ? '/tmp/generated-qr' : path.join(process.cwd(), 'generated-qr');

// Helper to sanitize studentId for safe Windows/Linux file naming
export function getSafeFilename(studentId: string): string {
  const safeId = (studentId || '').replace(/[/\\?%*:|"<>]/g, '_').trim();
  return `${safeId || 'student'}.png`;
}

// Ensure output directory exists
export function ensureQrDir(): void {
  try {
    if (!fs.existsSync(QR_OUTPUT_DIR)) {
      fs.mkdirSync(QR_OUTPUT_DIR, { recursive: true });
    }
  } catch (err) {
    logger.error('[QR] Output directory setup warning:', err);
  }
}

// =============================================
// Generate QR PNG buffer with embedded logo
// =============================================
export async function generateQrWithLogo(
  studentId: string,
  logoPath?: string
): Promise<Buffer> {
  // 1. Generate QR code as raw PNG buffer
  const qrBuffer = await QRCode.toBuffer(studentId, {
    errorCorrectionLevel: 'H', // Highest — allows logo overlay without data loss
    type: 'png',
    width: QR_SIZE,
    margin: 2,
    color: {
      dark: '#0f172a',  // Dark navy — matches cybersecurity theme
      light: '#ffffff',
    },
  });

  // 2. If no logo available, return plain QR
  if (!logoPath || !fs.existsSync(logoPath)) {
    return qrBuffer;
  }

  // 3. Try composite logo onto center of QR with fallback to plain QR
  try {
    const logoBuffer = await sharp(logoPath)
      .resize(LOGO_SIZE, LOGO_SIZE, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .png()
      .toBuffer();

    const padding = 8;
    const bgSize = LOGO_SIZE + padding * 2;
    const circleBackground = Buffer.from(
      `<svg width="${bgSize}" height="${bgSize}">
        <rect x="0" y="0" width="${bgSize}" height="${bgSize}" rx="${bgSize / 2}" ry="${bgSize / 2}" fill="white"/>
      </svg>`
    );

    const logoBgBuffer = await sharp(circleBackground)
      .composite([{ input: logoBuffer, gravity: 'center' }])
      .png()
      .toBuffer();

    const centerPos = Math.floor((QR_SIZE - bgSize) / 2);

    const finalQr = await sharp(qrBuffer)
      .composite([
        {
          input: logoBgBuffer,
          top: centerPos,
          left: centerPos,
        },
      ])
      .png()
      .toBuffer();

    return finalQr;
  } catch (err) {
    logger.warn(`[QR] Logo compositing fallback for ${studentId}:`, err);
    return qrBuffer;
  }
}

// =============================================
// Save QR PNG to disk & Supabase Storage
// =============================================
export async function saveQrToDisk(
  studentId: string,
  qrBuffer: Buffer
): Promise<string> {
  ensureQrDir();
  const filePath = getQrFilePath(studentId);
  fs.writeFileSync(filePath, qrBuffer);

  if (isSupabaseEnabled()) {
    const supabase = getSupabaseClient();
    if (supabase) {
      const safeFilename = getSafeFilename(studentId);
      supabase.storage.from('qr-codes').upload(safeFilename, qrBuffer, {
        contentType: 'image/png',
        upsert: true,
      }).catch(err => logger.error('[SUPABASE] QR storage upload error:', err));
    }
  }

  return filePath;
}

// =============================================
// Main entry: generate + save, return file path
// =============================================
export async function generateAndSaveQr(
  studentId: string,
  logoPath?: string
): Promise<string> {
  const buffer = await generateQrWithLogo(studentId, logoPath);
  const savedPath = await saveQrToDisk(studentId, buffer);
  logger.success(`[QR] Generated: ${studentId} → ${savedPath}`);
  return savedPath;
}

// =============================================
// Delete QR file
// =============================================
export function deleteQrFile(studentId: string): void {
  const filePath = getQrFilePath(studentId);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  if (isSupabaseEnabled()) {
    const supabase = getSupabaseClient();
    if (supabase) {
      const safeFilename = getSafeFilename(studentId);
      supabase.storage.from('qr-codes').remove([safeFilename]).catch(err => logger.error('[SUPABASE] QR delete error:', err));
    }
  }
}

export function getQrFilePath(studentId: string): string {
  return path.join(QR_OUTPUT_DIR, getSafeFilename(studentId));
}

export function qrExists(studentId: string): boolean {
  return fs.existsSync(getQrFilePath(studentId));
}
