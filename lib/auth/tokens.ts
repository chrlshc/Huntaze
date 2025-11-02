import crypto from 'crypto';
import { query } from '@/lib/db';

export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export async function createVerificationToken(userId: number, email: string): Promise<string> {
  const token = generateVerificationToken();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  await query(
    `INSERT INTO email_verification_tokens (user_id, email, token, expires_at) 
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id) 
     DO UPDATE SET token = $3, expires_at = $4, created_at = CURRENT_TIMESTAMP`,
    [userId, email, token, expiresAt]
  );

  return token;
}

export async function verifyEmailToken(token: string): Promise<{ userId: number; email: string } | null> {
  const result = await query(
    `SELECT user_id, email, expires_at 
     FROM email_verification_tokens 
     WHERE token = $1`,
    [token]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const { user_id, email, expires_at } = result.rows[0];

  // Check if token is expired
  if (new Date(expires_at) < new Date()) {
    return null;
  }

  return { userId: user_id, email };
}

export async function deleteVerificationToken(userId: number): Promise<void> {
  await query(
    'DELETE FROM email_verification_tokens WHERE user_id = $1',
    [userId]
  );
}
