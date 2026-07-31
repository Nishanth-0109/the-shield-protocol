import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { dbGetAdmin, dbUpdateAdminLastLogin } from '../models/database';
import { ApiResponse } from '../types';

const router = Router();

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body as { email?: string; password?: string };

  if (!email || !password) {
    const r: ApiResponse = { success: false, message: 'Email and password are required' };
    res.status(400).json(r);
    return;
  }

  const admin = dbGetAdmin();
  if (!admin || admin.email.toLowerCase() !== email.toLowerCase()) {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
    return;
  }

  const match = await bcrypt.compare(password, admin.passwordHash);
  if (!match) {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
    return;
  }

  const secret = process.env.JWT_SECRET!;
  const token = jwt.sign(
    { userId: admin.id, email: admin.email },
    secret,
    { expiresIn: (process.env.JWT_EXPIRES_IN || '8h') as any }
  );

  dbUpdateAdminLastLogin(admin.id);

  const response: ApiResponse = {
    success: true,
    data: {
      token,
      admin: { id: admin.id, email: admin.email, name: admin.name, lastLogin: admin.lastLogin },
    },
    message: 'Login successful',
  };

  res.json(response);
});

// POST /api/auth/logout  (client just discards token — stateless JWT)
router.post('/logout', (_req: Request, res: Response): void => {
  res.json({ success: true, message: 'Logged out' });
});

// GET /api/auth/me
router.get('/me', (req: Request, res: Response): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1];
  if (!token) { res.status(401).json({ success: false }); return; }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string; email: string };
    const admin = dbGetAdmin();
    if (!admin || admin.id !== decoded.userId) {
      res.status(401).json({ success: false }); return;
    }
    res.json({ success: true, data: { id: admin.id, email: admin.email, name: admin.name } });
  } catch {
    res.status(403).json({ success: false, message: 'Invalid token' });
  }
});

export default router;
