import 'express-async-errors';
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs';

import authRoutes from './routes/auth';
import uploadRoutes from './routes/upload';
import studentRoutes from './routes/students';
import processingRoutes from './routes/processing';
import dashboardRoutes from './routes/dashboard';
import reportRoutes from './routes/reports';
import { errorHandler, notFound } from './middleware/errorHandler';
import { seedAdmin } from './utils/seed';
import { ensureQrDir, getQrFilePath, getSafeFilename, generateAndSaveQr } from './services/qrService';
import { ensurePlaceholderLogo } from './utils/placeholder-logo';
import { cleanupStuckJobs } from './models/database';
import { isSupabaseEnabled } from './config/supabaseClient';
import { logger } from './utils/logger';

const app = express();
const PORT = process.env.PORT || 5000;

// =============================================
// Security & Middleware
// =============================================
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting — skip for SSE progress endpoint & public download
const limiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX) || 200,
  skip: (req) => req.path.includes('/progress/') || req.path.includes('/public/'),
});
app.use(limiter);

// Serve generated QR images statically
const QR_DIR = path.join(process.cwd(), process.env.QR_OUTPUT_DIR || 'generated-qr');
app.use('/qr-images', express.static(QR_DIR));

// Public endpoint for downloading student QR code PNG directly
app.get('/api/public/download-qr/:studentId', async (req, res) => {
  try {
    const studentId = req.params.studentId;
    const safeFilename = getSafeFilename(studentId);
    let filePath = getQrFilePath(studentId);

    if (!fs.existsSync(filePath)) {
      filePath = await generateAndSaveQr(studentId);
    }

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);
    res.sendFile(filePath);
  } catch (err) {
    res.status(404).send('QR code not found');
  }
});

// =============================================
// Routes
// =============================================
app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/processing', processingRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);

// Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'The Shield Protocol – QR & Email Automation API',
    timestamp: new Date().toISOString(),
  });
});

// =============================================
// Error Handling
// =============================================
app.use(notFound);
app.use(errorHandler);

// =============================================
// Bootstrap
// =============================================
async function bootstrap() {
  ensureQrDir();
  cleanupStuckJobs();
  await ensurePlaceholderLogo();
  await seedAdmin();

  app.listen(PORT, () => {
    logger.info(`Shield Protocol API running on http://localhost:${PORT}`);
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`Email provider: ${process.env.EMAIL_PROVIDER || 'gmail'}`);
    logger.info(`Supabase integration: ${isSupabaseEnabled() ? 'ENABLED' : 'DISABLED'}`);
  });
}

bootstrap().catch(err => {
  logger.error('Failed to start server:', err);
  process.exit(1);
});
