/**
 * AWS SES Email Service
 * 
 * Handles sending transactional emails via AWS SES
 */

import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { sendMail } from '@/lib/mailer';

// Initialize SES client
const sesClient = new SESClient({
  region: process.env.SES_REGION || process.env.AWS_SES_REGION || process.env.AWS_REGION || 'us-east-1',
  credentials: process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
    ? {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        sessionToken: process.env.AWS_SESSION_TOKEN,
      }
    : undefined,
});

// Prefer SES_FROM_EMAIL when configured (Amplify env), fallback to FROM_EMAIL
const FROM_EMAIL = process.env.SES_FROM_EMAIL 
  || process.env.AWS_SES_FROM_EMAIL 
  || process.env.SMTP_FROM 
  || process.env.FROM_EMAIL 
  || 'noreply@huntaze.com';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send email via AWS SES
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    const command = new SendEmailCommand({
      Source: FROM_EMAIL,
      Destination: {
        ToAddresses: [options.to],
      },
      Message: {
        Subject: {
          Data: options.subject,
          Charset: 'UTF-8',
        },
        Body: {
          Html: {
            Data: options.html,
            Charset: 'UTF-8',
          },
          ...(options.text && {
            Text: {
              Data: options.text,
              Charset: 'UTF-8',
            },
          }),
        },
      },
    });

    const response = await sesClient.send(command);

    console.log('[Email] Sent successfully:', {
      to: options.to,
      subject: options.subject,
      messageId: response.MessageId,
    });

    return true;
  } catch (error) {
    console.error('[Email] Failed to send:', {
      to: options.to,
      subject: options.subject,
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}

/**
 * Send verification email
 */
export async function sendVerificationEmail(
  email: string,
  verificationToken: string,
  baseUrl: string,
  userId?: string | number
): Promise<boolean> {
  const verificationUrl = `${baseUrl}/auth/verify?token=${verificationToken}${
    userId ? `&userId=${userId}` : ''
  }`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; line-height: 1.6; color: var(--text-primary); }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-info) 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: var(--bg-glass); padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-info) 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: var(--text-tertiary); font-size: var(--text-sm); }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">Welcome to Huntaze! 🎉</h1>
          </div>
          <div class="content">
            <h2>Verify Your Email Address</h2>
            <p>Thanks for signing up! Please verify your email address to get started with Huntaze.</p>
            <p>Click the button below to verify your email:</p>
            <div style="text-align: center;">
              <a href="${verificationUrl}" class="button">Verify Email Address</a>
            </div>
            <p style="margin-top: 30px; color: var(--text-tertiary); font-size: var(--text-sm);">
              Or copy and paste this link into your browser:<br>
              <a href="${verificationUrl}" style="color: var(--accent-primary);">${verificationUrl}</a>
            </p>
            <p style="margin-top: 30px; color: var(--text-tertiary); font-size: var(--text-sm);">
              This link will expire in 24 hours.
            </p>
          </div>
          <div class="footer">
            <p>If you didn't create an account with Huntaze, you can safely ignore this email.</p>
            <p>&copy; ${new Date().getFullYear()} Huntaze. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
Welcome to Huntaze!

Please verify your email address by clicking the link below:
${verificationUrl}

This link will expire in 24 hours.

If you didn't create an account with Huntaze, you can safely ignore this email.

© ${new Date().getFullYear()} Huntaze. All rights reserved.
  `;

  const result = await sendMail({
    to: email,
    subject: 'Verify your Huntaze account',
    html,
    text,
    from: FROM_EMAIL,
  });

  if (!result.ok) {
    console.error('[Email] Verification email not sent', {
      to: email,
      error: result.error,
    });
    throw new Error(result.error || 'Failed to send verification email');
  }

  return true;
}

/**
 * Send welcome email (after verification)
 */
export async function sendWelcomeEmail(
  email: string,
  name: string
): Promise<boolean> {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; line-height: 1.6; color: var(--text-primary); }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-info) 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: var(--bg-glass); padding: 30px; border-radius: 0 0 8px 8px; }
          .feature { margin: 20px 0; padding: 15px; background: white; border-radius: 6px; }
          .footer { text-align: center; margin-top: 30px; color: var(--text-tertiary); font-size: var(--text-sm); }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">Welcome to Huntaze, ${name}! 🚀</h1>
          </div>
          <div class="content">
            <h2>Your account is ready!</h2>
            <p>We're excited to have you on board. Here's what you can do with Huntaze:</p>
            
            <div class="feature">
              <h3 style="margin-top: 0;">📊 AI-Powered Analytics</h3>
              <p>Get insights into your content performance and audience engagement.</p>
            </div>
            
            <div class="feature">
              <h3 style="margin-top: 0;">🤖 Smart Automation</h3>
              <p>Automate your content scheduling and fan interactions.</p>
            </div>
            
            <div class="feature">
              <h3 style="margin-top: 0;">💰 Revenue Optimization</h3>
              <p>Maximize your earnings with AI-driven recommendations.</p>
            </div>
            
            <p style="margin-top: 30px;">Ready to get started? Log in to your dashboard and complete your profile setup.</p>
          </div>
          <div class="footer">
            <p>Need help? Contact us at support@huntaze.com</p>
            <p>&copy; ${new Date().getFullYear()} Huntaze. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
Welcome to Huntaze, ${name}!

Your account is ready! Here's what you can do with Huntaze:

📊 AI-Powered Analytics
Get insights into your content performance and audience engagement.

🤖 Smart Automation
Automate your content scheduling and fan interactions.

💰 Revenue Optimization
Maximize your earnings with AI-driven recommendations.

Ready to get started? Log in to your dashboard and complete your profile setup.

Need help? Contact us at support@huntaze.com

© ${new Date().getFullYear()} Huntaze. All rights reserved.
  `;

  return sendEmail({
    to: email,
    subject: 'Welcome to Huntaze!',
    html,
    text,
  });
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  resetToken: string,
  baseUrl: string
): Promise<boolean> {
  const resetUrl = `${baseUrl}/auth/reset-password?token=${resetToken}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; line-height: 1.6; color: var(--text-primary); }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-info) 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: var(--bg-glass); padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-info) 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
          .warning { background: rgba(245, 158, 11, 0.1); border-left: 4px solid var(--accent-warning); padding: 15px; margin: 20px 0; border-radius: 4px; }
          .footer { text-align: center; margin-top: 30px; color: var(--text-tertiary); font-size: var(--text-sm); }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">Reset Your Password</h1>
          </div>
          <div class="content">
            <h2>Password Reset Request</h2>
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </div>
            <p style="margin-top: 30px; color: var(--text-tertiary); font-size: var(--text-sm);">
              Or copy and paste this link into your browser:<br>
              <a href="${resetUrl}" style="color: var(--accent-primary);">${resetUrl}</a>
            </p>
            <div class="warning">
              <strong>⚠️ Security Notice:</strong><br>
              This link will expire in 1 hour. If you didn't request a password reset, please ignore this email and your password will remain unchanged.
            </div>
          </div>
          <div class="footer">
            <p>For security reasons, never share this email with anyone.</p>
            <p>&copy; ${new Date().getFullYear()} Huntaze. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
Reset Your Password

We received a request to reset your password. Click the link below to create a new password:
${resetUrl}

This link will expire in 1 hour.

⚠️ Security Notice:
If you didn't request a password reset, please ignore this email and your password will remain unchanged.

For security reasons, never share this email with anyone.

© ${new Date().getFullYear()} Huntaze. All rights reserved.
  `;

  return sendEmail({
    to: email,
    subject: 'Reset your Huntaze password',
    html,
    text,
  });
}
