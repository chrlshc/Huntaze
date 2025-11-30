/**
 * Magic Link Email System
 * Handles generation and sending of magic link verification emails
 * 
 * Requirements:
 * - 2.2: Send verification email with magic link
 * - 2.3: 24-hour expiry for magic links
 */

import { createLogger } from '@/lib/utils/logger';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

const logger = createLogger('magic-link');

// Initialize SES client with flexible region configuration
const sesRegion = process.env.AWS_SES_REGION || process.env.SES_REGION || process.env.AWS_REGION || 'us-east-1';

const sesClient = new SESClient({
  region: sesRegion,
  credentials: process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY ? {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    ...(process.env.AWS_SESSION_TOKEN && { sessionToken: process.env.AWS_SESSION_TOKEN }),
  } : undefined,
});

interface MagicLinkEmailParams {
  email: string;
  url: string;
  token: string;
}

/**
 * Send magic link verification email
 */
export async function sendMagicLinkEmail({ email, url, token }: MagicLinkEmailParams): Promise<void> {
  const startTime = Date.now();
  
  try {
    const emailHtml = generateMagicLinkEmailHtml(url);
    const emailText = generateMagicLinkEmailText(url);
    
    // Support multiple environment variable names for sender email
    const fromEmail = process.env.AWS_SES_FROM_EMAIL || process.env.SES_FROM_EMAIL || process.env.EMAIL_FROM || 'noreply@huntaze.com';
    
    const command = new SendEmailCommand({
      Source: fromEmail,
      Destination: {
        ToAddresses: [email],
      },
      Message: {
        Subject: {
          Data: 'Sign in to Huntaze',
          Charset: 'UTF-8',
        },
        Body: {
          Html: {
            Data: emailHtml,
            Charset: 'UTF-8',
          },
          Text: {
            Data: emailText,
            Charset: 'UTF-8',
          },
        },
      },
    });
    
    await sesClient.send(command);
    
    const duration = Date.now() - startTime;
    logger.info('Magic link email sent', {
      email,
      duration,
      tokenLength: token.length,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorName = error instanceof Error ? error.name : 'UnknownError';
    
    logger.error('Failed to send magic link email', error as Error, {
      email,
      duration,
      errorMessage,
      errorName,
      provider: 'ses',
      region: sesRegion,
      fromEmail: process.env.AWS_SES_FROM_EMAIL || process.env.SES_FROM_EMAIL || process.env.EMAIL_FROM || 'noreply@huntaze.com',
    });
    
    // Log specific error details for debugging
    if (errorMessage.includes('not verified')) {
      logger.error('Email address not verified in SES', error as Error, {
        hint: 'Verify sender and recipient emails in AWS SES Console',
        sandboxMode: 'If in sandbox, both sender and recipient must be verified',
      });
    } else if (errorMessage.includes('credentials')) {
      logger.error('AWS credentials issue', error as Error, {
        hint: 'Check AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and AWS_SESSION_TOKEN',
      });
    } else if (errorMessage.includes('Access Denied')) {
      logger.error('IAM permissions issue', error as Error, {
        hint: 'Ensure IAM policy allows ses:SendEmail and ses:SendRawEmail',
      });
    }
    
    throw error;
  }
}

/**
 * Generate HTML email template for magic link
 */
function generateMagicLinkEmailHtml(url: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sign in to Huntaze</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: var(--text-primary);
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .container {
      background-color: #ffffff;
      border-radius: 8px;
      padding: 40px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    }
    .logo {
      text-align: center;
      margin-bottom: 30px;
    }
    .logo h1 {
      color: #7c3aed;
      font-size: var(--text-4xl);
      margin: 0;
    }
    .content {
      margin-bottom: 30px;
    }
    .button {
      display: inline-block;
      background-color: #7c3aed;
      color: #ffffff !important;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 6px;
      font-weight: 600;
      text-align: center;
      margin: 20px 0;
    }
    .button:hover {
      background-color: #6d28d9;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid var(--border-subtle);
      font-size: var(--text-sm);
      color: var(--text-tertiary);
      text-align: center;
    }
    .warning {
      background-color: rgba(245, 158, 11, 0.1);
      border-left: 4px solid var(--accent-warning);
      padding: 12px;
      margin: 20px 0;
      font-size: var(--text-sm);
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">
      <h1>Huntaze</h1>
    </div>
    
    <div class="content">
      <h2>Sign in to your account</h2>
      <p>Click the button below to sign in to your Huntaze account. This link will expire in 24 hours.</p>
      
      <div style="text-align: center;">
        <a href="${url}" class="button">Sign in to Huntaze</a>
      </div>
      
      <div class="warning">
        <strong>Security tip:</strong> If you didn't request this email, you can safely ignore it.
      </div>
      
      <p style="font-size: var(--text-sm); color: var(--text-tertiary);">
        Or copy and paste this URL into your browser:<br>
        <a href="${url}" style="color: #7c3aed; word-break: break-all;">${url}</a>
      </p>
    </div>
    
    <div class="footer">
      <p>This email was sent by Huntaze. If you have any questions, please contact our support team.</p>
      <p>&copy; ${new Date().getFullYear()} Huntaze. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Generate plain text email template for magic link
 */
function generateMagicLinkEmailText(url: string): string {
  return `
Sign in to Huntaze

Click the link below to sign in to your Huntaze account. This link will expire in 24 hours.

${url}

Security tip: If you didn't request this email, you can safely ignore it.

---

This email was sent by Huntaze. If you have any questions, please contact our support team.

© ${new Date().getFullYear()} Huntaze. All rights reserved.
  `.trim();
}

/**
 * Validate magic link token format
 */
export function validateMagicLinkToken(token: string): boolean {
  // Basic validation - token should be a non-empty string
  // NextAuth handles the actual cryptographic validation
  return typeof token === 'string' && token.length > 0;
}
