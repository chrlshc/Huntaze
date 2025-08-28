import { NextRequest, NextResponse } from 'next/server';
import { sendMail } from '@/lib/mailer';

export async function GET(req: NextRequest) {
  // Check email configuration
  const config = {
    hasSES: !!process.env.SES_FROM_EMAIL,
    hasSMTP: !!process.env.SMTP_HOST,
    sesFrom: process.env.SES_FROM_EMAIL || 'NOT SET',
    awsRegion: process.env.AWS_REGION || 'NOT SET',
    notifyEmails: process.env.WAITLIST_NOTIFY_EMAILS || 'NOT SET',
    sendConfirm: process.env.WAITLIST_SEND_CONFIRM || 'NOT SET',
    hasAwsCredentials: !!(process.env.AWS_ACCESS_KEY_ID || process.env.AWS_SECRET_ACCESS_KEY),
    smtpHost: process.env.SMTP_HOST || 'NOT SET',
  };

  return NextResponse.json({ config }, { status: 200 });
}

export async function POST(req: NextRequest) {
  try {
    const { to } = await req.json();
    
    if (!to) {
      return NextResponse.json({ error: 'Missing "to" email address' }, { status: 400 });
    }

    const result = await sendMail({
      to,
      subject: 'Test Email from Huntaze',
      html: `
        <h2>Test Email</h2>
        <p>This is a test email from your Huntaze application.</p>
        <p>If you receive this, your email configuration is working correctly!</p>
        <hr>
        <p><small>Sent at: ${new Date().toISOString()}</small></p>
      `,
      text: 'This is a test email from Huntaze. Your email configuration is working!',
    });

    if (result.ok) {
      return NextResponse.json({ 
        success: true, 
        message: `Email sent successfully to ${to}`,
        config: {
          from: process.env.SES_FROM_EMAIL || process.env.SMTP_FROM || process.env.FROM_EMAIL,
          provider: process.env.SES_FROM_EMAIL ? 'AWS SES' : process.env.SMTP_HOST ? 'SMTP' : 'NONE',
        }
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        error: result.error,
        config: {
          hasSES: !!process.env.SES_FROM_EMAIL,
          hasSMTP: !!process.env.SMTP_HOST,
          from: process.env.SES_FROM_EMAIL || process.env.SMTP_FROM || process.env.FROM_EMAIL || 'NOT SET',
        }
      }, { status: 500 });
    }
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Unknown error',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}