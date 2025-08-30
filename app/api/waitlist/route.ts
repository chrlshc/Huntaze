import { NextRequest, NextResponse } from 'next/server';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import { z } from 'zod';
import { sendMail } from '@/lib/mailer';

const rateLimiter = new RateLimiterMemory({ points: 30, duration: 60 });

const waitlistSchema = z.object({
  email: z.string().email(),
  handle_ig: z.string().optional(),
  niche: z.string().optional(),
  timezone: z.string().optional(),
  consent: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';

  try {
    await rateLimiter.consume(ip);
  } catch (err) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429 }
    );
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch (err) {
    return NextResponse.json(
      { error: 'Invalid JSON payload' },
      { status: 400 }
    );
  }
  
  const result = waitlistSchema.safeParse(payload);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const data = result.data;

  // Send notification to internal team and optional confirmation to user
  const notifyList = (process.env.WAITLIST_NOTIFY_EMAILS || '').split(',').map((s) => s.trim()).filter(Boolean);
  const from = process.env.SES_FROM_EMAIL || process.env.SMTP_FROM || process.env.FROM_EMAIL;

  // Internal notification
  if (notifyList.length && from) {
    await sendMail({
      to: notifyList,
      subject: `New waitlist signup: ${data.email}`,
      text: `New signup\nEmail: ${data.email}\nIG: ${data.handle_ig || '-'}\nNiche: ${data.niche || '-'}\nTimezone: ${data.timezone || '-'}\nConsent: ${data.consent ? 'yes' : 'no'}`,
      from,
    });
  }

  // User confirmation (optional)
  if (process.env.WAITLIST_SEND_CONFIRM === 'true' && from) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;
    const html = `
      <p>Thanks! Your address <b>${data.email}</b> has been added to the waitlist.</p>
      <p>We’ll notify you as soon as your access is ready.</p>
      <p>— The Huntaze Team</p>
      <p><a href="${appUrl}">${appUrl}</a></p>
    `;
    await sendMail({
      to: data.email,
      subject: 'Welcome to the Huntaze waitlist',
      html,
      from,
    });
  }

  return NextResponse.json({ message: 'Successfully joined the waitlist' }, { status: 200 });
}
