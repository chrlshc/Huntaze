import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { makeReqLogger } from '@/lib/logger';
import { redactObj } from '@/lib/log-sanitize';

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const log = makeReqLogger({ requestId });
  try {
    const { email } = await request.json();
    
    // In production, save to database
    // For now, just log it
    log.info('waitlist_onlyfans_signup', redactObj({ email }));
    
    // Send notification email to admin
    if (process.env.WAITLIST_NOTIFY_EMAILS) {
      // TODO: Send email via SES or SMTP
    }
    
    const r = NextResponse.json({ success: true, message: 'Added to waitlist', requestId });
    r.headers.set('X-Request-Id', requestId);
    return r;
  } catch (error) {
    const r = NextResponse.json({ error: 'Failed to join waitlist', requestId }, { status: 500 });
    r.headers.set('X-Request-Id', requestId);
    return r;
  }
}
