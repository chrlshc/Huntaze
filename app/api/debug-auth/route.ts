import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    
    console.log('[DEBUG-AUTH] Testing login for:', email);
    
    // Test DB connection
    const testResult = await query('SELECT 1 as test');
    console.log('[DEBUG-AUTH] DB connection OK');
    
    // Query user
    const result = await query(
      'SELECT id, email, name, password, onboarding_completed FROM users WHERE LOWER(email) = LOWER($1)',
      [email]
    );
    
    console.log('[DEBUG-AUTH] Found users:', result.rows.length);
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'User not found', step: 'query' });
    }
    
    const user = result.rows[0];
    console.log('[DEBUG-AUTH] User:', { id: user.id, email: user.email });
    
    // Test password
    const isValid = await bcrypt.compare(password, user.password);
    console.log('[DEBUG-AUTH] Password valid:', isValid);
    
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid password', step: 'bcrypt' });
    }
    
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        onboardingCompleted: user.onboarding_completed
      }
    });
  } catch (error: any) {
    console.error('[DEBUG-AUTH] Error:', error);
    return NextResponse.json({ 
      error: error.message, 
      stack: error.stack,
      step: 'exception'
    }, { status: 500 });
  }
}
