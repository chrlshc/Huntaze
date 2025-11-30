/**
 * Email Verification Service
 * 
 * Handles email verification for the Beta Launch UI System with:
 * - Dark-themed HTML email templates with brand colors
 * - AWS SES integration with retry logic
 * - Token expiration (24 hours)
 * - Comprehensive error handling
 * - Structured logging
 * 
 * @see .kiro/specs/beta-launch-ui-system/design.md
 */

import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { createLogger } from '@/lib/utils/logger';

// ============================================================================
// Types
// ============================================================================

export interface VerificationEmailParams {
  email: string;
  verificationToken: string;
  userId: string;
}

export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  error?: EmailError;
  duration: number;
}

export interface EmailError {
  type: EmailErrorType;
  message: string;
  retryable: boolean;
  statusCode?: number;
}

export enum EmailErrorType {
  INVALID_EMAIL = 'INVALID_EMAIL',
  SES_ERROR = 'SES_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

// ============================================================================
// Configuration
// ============================================================================

const logger = createLogger('email-verification');

const FROM_EMAIL = process.env.FROM_EMAIL || 'Huntaze <noreply@huntaze.com>';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';

// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffFactor: 2,
  retryableErrors: [
    'NetworkingError',
    'TimeoutError',
    'ThrottlingException',
    'ServiceUnavailable',
    'InternalFailure',
  ],
};

// Timeout configuration
const EMAIL_TIMEOUT_MS = 30000; // 30 seconds

// ============================================================================
// SES Client Initialization
// ============================================================================

let sesClient: SESClient | null = null;

function initializeSESClient(): SESClient {
  if (sesClient) {
    return sesClient;
  }

  try {
    sesClient = new SESClient({
      region: AWS_REGION,
      credentials: process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
        ? {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            sessionToken: process.env.AWS_SESSION_TOKEN,
          }
        : undefined,
      maxAttempts: 1, // We handle retries manually
    });

    logger.info('SES client initialized', {
      region: AWS_REGION,
      hasCredentials: !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY),
    });

    return sesClient;
  } catch (error) {
    logger.error('Failed to initialize SES client', error as Error, {
      region: AWS_REGION,
    });
    throw new Error('Email service configuration error');
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Validate email address format
 */
function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Classify error type for retry logic
 */
function classifyError(error: any): EmailError {
  const errorMessage = error.message || String(error);
  const errorName = error.name || '';

  // Network errors (retryable)
  if (
    errorMessage.includes('ECONNREFUSED') ||
    errorMessage.includes('ETIMEDOUT') ||
    errorMessage.includes('ENOTFOUND') ||
    errorName === 'NetworkingError'
  ) {
    return {
      type: EmailErrorType.NETWORK_ERROR,
      message: 'Network error while sending email',
      retryable: true,
    };
  }

  // Timeout errors (retryable)
  if (errorName === 'TimeoutError' || errorMessage.includes('timeout')) {
    return {
      type: EmailErrorType.TIMEOUT_ERROR,
      message: 'Email send timeout',
      retryable: true,
    };
  }

  // Rate limit errors (retryable)
  if (
    errorName === 'ThrottlingException' ||
    errorMessage.includes('rate limit') ||
    errorMessage.includes('throttl')
  ) {
    return {
      type: EmailErrorType.RATE_LIMIT_ERROR,
      message: 'Email rate limit exceeded',
      retryable: true,
      statusCode: 429,
    };
  }

  // SES errors (some retryable)
  if (errorName === 'ServiceUnavailable' || errorName === 'InternalFailure') {
    return {
      type: EmailErrorType.SES_ERROR,
      message: 'AWS SES service error',
      retryable: true,
      statusCode: 503,
    };
  }

  // Invalid email (not retryable)
  if (errorMessage.includes('invalid') && errorMessage.includes('email')) {
    return {
      type: EmailErrorType.INVALID_EMAIL,
      message: 'Invalid email address',
      retryable: false,
      statusCode: 400,
    };
  }

  // Configuration errors (not retryable)
  if (errorMessage.includes('credentials') || errorMessage.includes('configuration')) {
    return {
      type: EmailErrorType.CONFIGURATION_ERROR,
      message: 'Email service configuration error',
      retryable: false,
      statusCode: 500,
    };
  }

  // Unknown errors (not retryable by default)
  return {
    type: EmailErrorType.UNKNOWN_ERROR,
    message: errorMessage || 'Unknown error sending email',
    retryable: false,
    statusCode: 500,
  };
}

/**
 * Retry with exponential backoff
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  context: { email: string; userId: string },
  attempt = 1
): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const emailError = classifyError(error);

    if (!emailError.retryable || attempt >= RETRY_CONFIG.maxRetries) {
      logger.error('Email send failed after retries', error, {
        ...context,
        attempt,
        errorType: emailError.type,
        retryable: emailError.retryable,
      });
      throw error;
    }

    const delay = Math.min(
      RETRY_CONFIG.initialDelay * Math.pow(RETRY_CONFIG.backoffFactor, attempt - 1),
      RETRY_CONFIG.maxDelay
    );

    logger.warn('Email send failed, retrying', {
      ...context,
      attempt,
      nextAttempt: attempt + 1,
      delay,
      errorType: emailError.type,
      errorMessage: emailError.message,
    });

    await new Promise((resolve) => setTimeout(resolve, delay));
    return retryWithBackoff(fn, context, attempt + 1);
  }
}

/**
 * Generate HTML email template
 */
function generateHTMLTemplate(verificationLink: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: #000000;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 40px 20px;
          }
          .card {
            background: var(--bg-primary);
            border: 1px solid var(--bg-secondary);
            border-radius: 12px;
            padding: 40px;
          }
          h1 {
            color: #FFFFFF;
            font-size: var(--text-2xl);
            font-weight: 600;
            margin: 0 0 16px 0;
          }
          p {
            color: var(--text-secondary);
            font-size: var(--text-base);
            line-height: 1.6;
            margin: 0 0 16px 0;
          }
          .button {
            display: inline-block;
            margin: 32px 0;
            padding: 14px 32px;
            background: linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-primary) 25%, var(--accent-primary) 50%, var(--accent-primary) 75%, var(--accent-primary) 100%);
            background-size: 200% 200%;
            color: white;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: var(--text-base);
          }
          .footer {
            color: var(--text-tertiary);
            font-size: var(--text-sm);
            margin-top: 32px;
          }
          .link {
            color: var(--accent-primary);
            text-decoration: none;
            word-break: break-all;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="card">
            <h1>Welcome to Huntaze</h1>
            <p>Click the button below to verify your email and activate your account.</p>
            <a href="${verificationLink}" class="button">Verify Email</a>
            <p class="footer">
              This link expires in 24 hours. If you didn't create this account, you can safely ignore this email.
            </p>
            <p class="footer">
              Or copy and paste this link into your browser:<br>
              <a href="${verificationLink}" class="link">${verificationLink}</a>
            </p>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Generate plain text email template
 */
function generateTextTemplate(verificationLink: string): string {
  return `
Welcome to Huntaze

Click the link below to verify your email and activate your account:
${verificationLink}

This link expires in 24 hours. If you didn't create this account, you can safely ignore this email.
  `.trim();
}

// ============================================================================
// Main API
// ============================================================================

/**
 * Send verification email with retry logic and comprehensive error handling
 * 
 * Features:
 * - Input validation
 * - Exponential backoff retry
 * - Timeout protection
 * - Structured logging
 * - Error classification
 * 
 * @param params - Email parameters
 * @returns Promise<EmailSendResult> - Send result with metadata
 * 
 * @example
 * ```typescript
 * const result = await sendVerificationEmail({
 *   email: 'user@example.com',
 *   verificationToken: 'abc123...',
 *   userId: '123'
 * });
 * 
 * if (result.success) {
 *   console.log('Email sent:', result.messageId);
 * } else {
 *   console.error('Email failed:', result.error);
 * }
 * ```
 */
export async function sendVerificationEmail({
  email,
  verificationToken,
  userId
}: VerificationEmailParams): Promise<EmailSendResult> {
  const startTime = Date.now();
  const correlationId = `email-${userId}-${Date.now()}`;

  logger.info('Sending verification email', {
    email,
    userId,
    correlationId,
  });

  try {
    // 1. Validate input
    if (!validateEmail(email)) {
      const error: EmailError = {
        type: EmailErrorType.INVALID_EMAIL,
        message: 'Invalid email address format',
        retryable: false,
        statusCode: 400,
      };

      logger.warn('Invalid email address', {
        email,
        userId,
        correlationId,
      });

      return {
        success: false,
        error,
        duration: Date.now() - startTime,
      };
    }

    if (!verificationToken || !userId) {
      const error: EmailError = {
        type: EmailErrorType.CONFIGURATION_ERROR,
        message: 'Missing required parameters',
        retryable: false,
        statusCode: 400,
      };

      logger.error('Missing required parameters', new Error('Missing parameters'), {
        hasToken: !!verificationToken,
        hasUserId: !!userId,
        correlationId,
      });

      return {
        success: false,
        error,
        duration: Date.now() - startTime,
      };
    }

    // 2. Initialize SES client
    const client = initializeSESClient();

    // 3. Generate email content
    const verificationLink = `${APP_URL}/auth/verify?token=${verificationToken}&userId=${userId}`;
    const htmlBody = generateHTMLTemplate(verificationLink);
    const textBody = generateTextTemplate(verificationLink);

    // 4. Create SES command
    const command = new SendEmailCommand({
      Source: FROM_EMAIL,
      Destination: {
        ToAddresses: [email]
      },
      Message: {
        Subject: {
          Data: 'Verify your Huntaze account',
          Charset: 'UTF-8'
        },
        Body: {
          Html: {
            Data: htmlBody,
            Charset: 'UTF-8'
          },
          Text: {
            Data: textBody,
            Charset: 'UTF-8'
          }
        }
      }
    });

    // 5. Send email with retry logic and timeout
    const sendWithTimeout = () => {
      return Promise.race([
        client.send(command),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Email send timeout')), EMAIL_TIMEOUT_MS)
        ),
      ]);
    };

    const response = await retryWithBackoff(
      sendWithTimeout as () => Promise<any>,
      { email, userId }
    );

    const duration = Date.now() - startTime;

    logger.info('Verification email sent successfully', {
      email,
      userId,
      messageId: response.MessageId,
      correlationId,
      duration,
    });

    return {
      success: true,
      messageId: response.MessageId,
      duration,
    };

  } catch (error) {
    const duration = Date.now() - startTime;
    const emailError = classifyError(error);

    logger.error('Failed to send verification email', error as Error, {
      email,
      userId,
      correlationId,
      errorType: emailError.type,
      retryable: emailError.retryable,
      duration,
    });

    return {
      success: false,
      error: emailError,
      duration,
    };
  }
}

/**
 * Send verification email (legacy interface for backward compatibility)
 * 
 * @deprecated Use sendVerificationEmail with result handling instead
 * @throws Error if email fails to send
 */
export async function sendVerificationEmailLegacy({
  email,
  verificationToken,
  userId
}: VerificationEmailParams): Promise<void> {
  const result = await sendVerificationEmail({ email, verificationToken, userId });
  
  if (!result.success) {
    throw new Error(result.error?.message || 'Failed to send verification email');
  }
}
