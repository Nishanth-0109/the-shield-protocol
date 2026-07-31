import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { dbGetAdmin, dbSetAdmin } from '../models/database';

export async function seedAdmin(): Promise<void> {
  const existing = dbGetAdmin();
  if (existing) return; // Already seeded

  const email = process.env.ADMIN_EMAIL || 'admin@shieldprotocol.com';
  const password = process.env.ADMIN_PASSWORD || 'ShieldAdmin@2026';
  const hash = await bcrypt.hash(password, 12);

  dbSetAdmin({
    id: uuidv4(),
    email,
    passwordHash: hash,
    name: 'Shield Admin',
  });

  console.log(`[SEED] Admin created: ${email}`);
}
