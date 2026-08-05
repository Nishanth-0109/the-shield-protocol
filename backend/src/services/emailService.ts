import nodemailer, { Transporter } from 'nodemailer';
import fs from 'fs';
import path from 'path';
import { Student } from '../types';
import { logger } from '../utils/logger';
import { generateAndSaveQr, getSafeFilename } from './qrService';
import { ensurePlaceholderLogo } from '../utils/placeholder-logo';

// =============================================
// Transporter factory — supports multiple providers
// =============================================
function createTransporter(): Transporter {
  const provider = (process.env.EMAIL_PROVIDER || 'gmail').toLowerCase();

  switch (provider) {
    case 'gmail':
      return nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_APP_PASSWORD,
        },
      });

    case 'sendgrid':
      return nodemailer.createTransport({
        host: 'smtp.sendgrid.net',
        port: 587,
        secure: false,
        auth: {
          user: 'apikey',
          pass: process.env.SENDGRID_API_KEY,
        },
      });

    case 'brevo':
      return nodemailer.createTransport({
        host: process.env.BREVO_SMTP_HOST || 'smtp-relay.brevo.com',
        port: Number(process.env.BREVO_SMTP_PORT) || 587,
        secure: false,
        auth: {
          user: process.env.BREVO_SMTP_USER,
          pass: process.env.BREVO_SMTP_PASS,
        },
      });

    case 'resend':
      return nodemailer.createTransport({
        host: 'smtp.resend.com',
        port: 465,
        secure: true,
        auth: {
          user: 'resend',
          pass: process.env.RESEND_API_KEY,
        },
      });

    case 'smtp':
    default:
      return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
  }
}

// =============================================
// HTML Email Template (with inline CID QR & Download Button)
// =============================================
function buildEmailHtml(student: Student, safeId: string, downloadUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Welcome to The Shield Protocol 2026</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', Arial, sans-serif; background-color: #060b18; color: #e2e8f0; }
    .wrapper { max-width: 620px; margin: 0 auto; background: #0f172a; border-radius: 16px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%); padding: 40px 32px; text-align: center; border-bottom: 1px solid #1e40af; }
    .header-logo { font-size: 28px; font-weight: 800; color: #60a5fa; letter-spacing: 2px; text-transform: uppercase; }
    .header-subtitle { font-size: 13px; color: #94a3b8; margin-top: 6px; letter-spacing: 3px; text-transform: uppercase; }
    .badge { display: inline-block; margin-top: 16px; padding: 6px 18px; background: rgba(59,130,246,0.15); border: 1px solid #3b82f6; border-radius: 20px; color: #60a5fa; font-size: 12px; font-weight: 600; letter-spacing: 1px; }
    .body { padding: 36px 32px; }
    .greeting { font-size: 18px; font-weight: 600; color: #f1f5f9; margin-bottom: 16px; }
    .intro { font-size: 15px; line-height: 1.7; color: #cbd5e1; margin-bottom: 28px; }
    .details-box { background: rgba(30,58,95,0.3); border: 1px solid #1e40af; border-radius: 12px; padding: 24px 28px; margin-bottom: 28px; }
    .details-title { font-size: 11px; font-weight: 700; color: #60a5fa; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 18px; }
    .detail-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid rgba(30,58,95,0.5); }
    .detail-row:last-child { border-bottom: none; }
    .detail-label { font-size: 13px; color: #94a3b8; font-weight: 500; }
    .detail-value { font-size: 13px; color: #e2e8f0; font-weight: 600; text-align: right; }
    .id-value { color: #60a5fa; font-size: 15px; font-family: monospace; font-weight: 700; letter-spacing: 1px; }
    .dates-box { background: rgba(15,23,42,0.6); border: 1px solid #334155; border-radius: 10px; padding: 16px 20px; margin-top: 14px; }
    .dates-title { font-size: 11px; font-weight: 700; color: #94a3b8; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 10px; }
    .date-item { display: flex; align-items: center; gap: 10px; padding: 5px 0; color: #cbd5e1; font-size: 13px; }
    .date-dot { width: 6px; height: 6px; background: #3b82f6; border-radius: 50%; flex-shrink: 0; }
    .qr-section { text-align: center; margin: 28px 0; }
    .qr-heading { font-size: 16px; font-weight: 700; color: #f1f5f9; margin-bottom: 6px; }
    .qr-sub { font-size: 13px; color: #94a3b8; margin-bottom: 16px; }
    .qr-container { display: inline-block; background: #ffffff; border-radius: 16px; padding: 16px; border: 2px solid #1e40af; margin: 12px 0; }
    .qr-note { font-size: 12px; color: #94a3b8; margin-top: 10px; }
    .alert-box { background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.3); border-radius: 10px; padding: 14px 18px; margin-bottom: 24px; }
    .alert-text { font-size: 13px; color: #fca5a5; line-height: 1.6; }
    .instructions { margin-bottom: 28px; }
    .instructions-title { font-size: 14px; font-weight: 700; color: #f1f5f9; margin-bottom: 12px; }
    .instruction-item { display: flex; gap: 12px; margin-bottom: 10px; align-items: flex-start; }
    .instruction-num { width: 22px; height: 22px; background: #1e40af; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; color: #60a5fa; flex-shrink: 0; line-height: 22px; text-align: center; }
    .instruction-text { font-size: 13px; color: #cbd5e1; line-height: 1.6; padding-top: 2px; }
    .footer { background: #060b18; padding: 24px 32px; border-top: 1px solid #1e293b; text-align: center; }
    .footer-name { font-size: 14px; font-weight: 700; color: #60a5fa; letter-spacing: 1px; }
    .footer-role { font-size: 12px; color: #64748b; margin-top: 4px; }
    .footer-divider { height: 1px; background: #1e293b; margin: 14px 0; }
    .footer-links { display: flex; justify-content: center; gap: 20px; }
    .footer-link { font-size: 12px; color: #475569; text-decoration: none; }
    .footer-disclaimer { font-size: 11px; color: #334155; margin-top: 14px; line-height: 1.5; }
  </style>
</head>
<body>
<div style="background:#060b18; padding: 20px 0;">
<div class="wrapper">

  <!-- HEADER -->
  <div class="header">
    <div style="margin-bottom: 14px; text-align: center;">
      <img src="cid:shieldlogo" alt="The Shield Protocol Logo" width="80" height="80" style="width: 80px; height: 80px; display: inline-block; vertical-align: middle; border: 0; outline: none; border-radius: 16px; filter: drop-shadow(0 4px 16px rgba(59, 130, 246, 0.5));" />
    </div>
    <div class="header-logo">The Shield Protocol</div>
    <div class="badge">Welcome to Shield Protocol</div>
  </div>

  <!-- BODY -->
  <div class="body">

    <div class="greeting">Dear ${student.name},</div>
    <div class="intro">
      Greetings from <strong style="color:#60a5fa;">The Shield Protocol Team</strong>.<br/><br/>
      We are happy to have you on Shield Protocol! Get ready to jump right in and learn easy ways to protect systems and stop online threats. We are excited to have you join us for an empowering multi-day experience of innovation, hands-on learning, and competition.
    </div>

    <!-- Participant Details -->
    <div class="details-box">
      <div class="details-title">Participant Details</div>
      <div class="detail-row">
        <span class="detail-label">Participant ID</span>
        <span class="detail-value id-value">${student.studentId}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Student Name</span>
        <span class="detail-value">${student.name}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Department</span>
        <span class="detail-value">${student.department}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Event Duration</span>
        <span class="detail-value">August 11 – 14, 2026</span>
      </div>
      <div class="dates-box">
        <div class="dates-title">Event Schedule</div>
        <div class="date-item"><span class="date-dot"></span><strong>August 11 – 13, 2026:</strong> Hands-on Workshop</div>
        <div class="date-item"><span class="date-dot"></span><strong>August 14, 2026:</strong> Cybersecurity Hackathon</div>
      </div>
    </div>

    <!-- QR Code Section -->
    <div class="qr-section">
      <div class="qr-heading">Your Entry Pass QR Code</div>
      <div class="qr-sub">Present this QR code at the entry desk on all 4 days of the workshop.</div>
      <div class="qr-container">
        <img src="cid:qrcode" alt="Entry QR Code" width="240" height="240" style="display:block; margin:0 auto; border-radius:8px; width:240px; height:240px;" />
      </div>

      <!-- DIRECT DOWNLOAD BUTTON -->
      <div style="margin-top: 18px; text-align: center;">
        <a href="${downloadUrl}" download="${safeId}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: #ffffff; text-decoration: none; font-weight: 700; font-size: 14px; padding: 12px 28px; border-radius: 10px; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.4); border: 1px solid #3b82f6;">
          📥 Download QR Code PNG
        </a>
      </div>

      <div class="qr-note" style="margin-top: 14px;">
        File: <strong>${safeId}</strong> (also attached to this email)
      </div>
    </div>

    <!-- Alert -->
    <div class="alert-box">
      <div class="alert-text">
        ⚠️ <strong>Do not share your QR Code</strong> with anyone. Each QR is uniquely linked to your participant profile. If you lose access, contact the organizing team before the event.
      </div>
    </div>

    <!-- Instructions -->
    <div class="instructions">
      <div class="instructions-title">How to Use Your Entry Pass</div>
      <div class="instruction-item">
        <div class="instruction-num">1</div>
        <div class="instruction-text">Click the <strong style="color:#60a5fa;">📥 Download QR Code PNG</strong> button above or download the attached <strong style="color:#60a5fa;">${safeId}</strong> image to your phone.</div>
      </div>
      <div class="instruction-item">
        <div class="instruction-num">2</div>
        <div class="instruction-text">Present the QR code at the entry desk on all 4 days for fast check-in.</div>
      </div>
      <div class="instruction-item">
        <div class="instruction-num">3</div>
        <div class="instruction-text">Ensure the QR is clearly visible and not damaged when presenting it.</div>
      </div>
      <div class="instruction-item">
        <div class="instruction-num">4</div>
        <div class="instruction-text">If you face any issues, approach the organizing team at the venue immediately.</div>
      </div>
    </div>

    <p style="font-size:15px; color:#cbd5e1; line-height:1.7;">We look forward to welcoming you to <strong style="color:#60a5fa;">The Shield Protocol 2026</strong>. Prepare to learn, build, and defend!</p>

  </div>

  <!-- FOOTER -->
  <div class="footer">
    <div class="footer-name">Team The Shield Protocol</div>
    <div class="footer-disclaimer">
      This is an automated email. Please do not reply directly to this message.<br/>
      © 2026 The Shield Protocol. All rights reserved.
    </div>
  </div>

</div>
</div>
</body>
</html>`;
}

// =============================================
// Send single email
// =============================================
export async function sendStudentEmail(
  student: Student,
  qrFilePath: string
): Promise<void> {
  const transporter = createTransporter();

  // Guarantee valid QR PNG exists on disk
  let targetQrPath = qrFilePath;
  if (!targetQrPath || !fs.existsSync(targetQrPath)) {
    targetQrPath = await generateAndSaveQr(student.studentId);
  }

  const safeFilename = getSafeFilename(student.studentId);
  const baseUrl = process.env.PUBLIC_URL || process.env.BACKEND_URL || 'http://localhost:5000';
  const downloadUrl = `${baseUrl}/api/public/download-qr/${encodeURIComponent(student.studentId)}`;

  const from = `"${process.env.EMAIL_FROM_NAME || 'The Shield Protocol Team'}" <${process.env.EMAIL_FROM_ADDRESS ||
    process.env.GMAIL_USER ||
    process.env.SMTP_USER ||
    'noreply@shieldprotocol.com'
    }>`;

  // Guarantee logo PNG exists
  const logoPath = path.join(process.cwd(), 'assets', 'shield-logo.png');
  if (!fs.existsSync(logoPath)) {
    await ensurePlaceholderLogo();
  }

  const attachments: any[] = [
    {
      filename: safeFilename,
      path: targetQrPath,
      cid: 'qrcode', // Embedded inline CID for rendering inside HTML body
      contentType: 'image/png',
      contentDisposition: 'inline' as const,
    },
  ];

  if (fs.existsSync(logoPath)) {
    attachments.push({
      filename: 'shield-logo.png',
      path: logoPath,
      cid: 'shieldlogo', // Embedded inline CID for shield logo
      contentType: 'image/png',
      contentDisposition: 'inline' as const,
    });
  }

  const mailOptions = {
    from,
    to: student.email,
    subject: 'Get ready! Your Shield Protocol workshop is just a few days away 🛡️',
    html: buildEmailHtml(student, safeFilename, downloadUrl),
    attachments,
  };

  await transporter.sendMail(mailOptions);
  logger.success(`[EMAIL] Sent to ${student.email} (${student.studentId})`);
}

// =============================================
// Verify transporter connection
// =============================================
export async function verifyEmailConnection(): Promise<boolean> {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    return true;
  } catch (err) {
    logger.error('[EMAIL] Connection verification failed:', err);
    return false;
  }
}
