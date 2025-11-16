/**
 * Auth Service - Registration Service
 * 
 * Handles user registration with:
 * - Input validation
 * - Error handling with retry logic
 * - Structured logging
 * - Database operations
 */

import { hash } from 'bcryptjs';
import { query } from '@/lib/db';
import crypto from 'crypto';
import { authLogger } from './logger';
import { createAuthError, mapDatabaseError, isRetryable } from './errors';
import { validateRegisterRequest, sanitizeEmail, sanitizeName } from './validation';
import { sendVerificationEmail } from '@/lib/services/email/ses';
import {
  AuthErrorType,
  RegisterRequest,
  RegisterResponse,
  DatabaseUser,
} from './types';

/**
 * Retry configuration
 */
const RETRY_CONFIG = {
  maxAttempts: 3,
  initialDelay: 100, // ms
  maxDelay: 2000, // ms
  backoffFactor: 2,
};

/**
 * Password hashing rounds
 */
const BCRYPT_ROUNDS = 12;

/**
 * Registration Service
 */
export class RegistrationService {
  /**
   * Register a new user
   */
  async register(data: RegisterRequest): Promise<RegisterResponse> {
    const correlationId = authLogger.generateCorrelationId();
    const startTime = Date.now();

    authLogger.info('Registration started', {
      correlationId,
      email: data.email,
    });

    try {
      // Validate input
      const validation = validateRegisterRequest(data);
      if (!validation.isValid) {
        const firstError = validation.errors[0];
        throw createAuthError(
          AuthErrorType.VALIDATION_ERROR,
          firstError.message,
          correlationId,
          false,
          400
        );
      }

      // Sanitize inputs
      const email = sanitizeEmail(data.email);
      const name = data.fullName ? sanitizeName(data.fullName) : email.split('@')[0];

      // Check if user exists (with retry)
      const existingUser = await this.checkUserExists(email, correlationId);
      if (existingUser) {
        throw createAuthError(
          AuthErrorType.USER_EXISTS,
          'User with this email already exists',
          correlationId,
          false,
          409
        );
      }

      // Hash password
      const hashedPassword = await this.hashPassword(data.password, correlationId);

      // Generate verification token
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Create user (with retry)
      const user = await this.createUser(
        email,
        name,
        hashedPassword,
        verificationToken,
        tokenExpiry,
        correlationId
      );

      // Send verification email (non-blocking)
      const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
      this.sendVerificationEmailAsync(email, verificationToken, baseUrl, correlationId);

      const duration = Date.now() - startTime;
      authLogger.info('Registration successful', {
        correlationId,
        userId: user.id,
        email: user.email,
        duration,
      });

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        message: 'Account created successfully. Please check your email to verify your account.',
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      // If already an AuthError, rethrow
      if (error.type) {
        authLogger.error('Registration failed', error, {
          correlationId,
          type: error.type,
          duration,
        });
        throw error;
      }

      // Map unknown errors
      const errorType = mapDatabaseError(error);
      const authError = createAuthError(
        errorType,
        error.message || 'Registration failed',
        correlationId,
        isRetryable(errorType),
        500
      );

      authLogger.error('Registration failed', error, {
        correlationId,
        type: errorType,
        duration,
      });

      throw authError;
    }
  }

  /**
   * Check if user exists (with retry)
   */
  private async checkUserExists(
    email: string,
    correlationId: string
  ): Promise<boolean> {
    return this.retryOperation(
      async () => {
        const result = await query(
          'SELECT id FROM users WHERE LOWER(email) = LOWER($1)',
          [email]
        );
        return result.rows.length > 0;
      },
      'Check user exists',
      correlationId
    );
  }

  /**
   * Hash password
   */
  private async hashPassword(
    password: string,
    correlationId: string
  ): Promise<string> {
    try {
      authLogger.debug('Hashing password', { correlationId });
      return await hash(password, BCRYPT_ROUNDS);
    } catch (error: any) {
      authLogger.error('Password hashing failed', error, { correlationId });
      throw createAuthError(
        AuthErrorType.INTERNAL_ERROR,
        'Failed to hash password',
        correlationId,
        false,
        500
      );
    }
  }

  /**
   * Create user in database (with retry)
   */
  private async createUser(
    email: string,
    name: string,
    hashedPassword: string,
    verificationToken: string,
    tokenExpiry: Date,
    correlationId: string
  ): Promise<DatabaseUser> {
    return this.retryOperation(
      async () => {
        const result = await query(
          `INSERT INTO users (email, name, password, email_verification_token, email_verification_expires, onboarding_completed, created_at, updated_at) 
           VALUES (LOWER($1), $2, $3, $4, $5, false, NOW(), NOW()) 
           RETURNING id, email, name, created_at`,
          [email, name, hashedPassword, verificationToken, tokenExpiry]
        );

        if (result.rows.length === 0) {
          throw new Error('Failed to create user');
        }

        return result.rows[0];
      },
      'Create user',
      correlationId
    );
  }

  /**
   * Send verification email asynchronously (non-blocking)
   */
  private sendVerificationEmailAsync(
    email: string,
    token: string,
    baseUrl: string,
    correlationId: string
  ): void {
    // Send email without blocking registration response
    sendVerificationEmail(email, token, baseUrl)
      .then((success) => {
        if (success) {
          authLogger.info('Verification email sent', {
            correlationId,
            email,
          });
        } else {
          authLogger.warn('Verification email failed to send', {
            correlationId,
            email,
          });
        }
      })
      .catch((error) => {
        authLogger.error('Verification email error', error, {
          correlationId,
          email,
        });
      });
  }

  /**
   * Retry operation with exponential backoff
   */
  private async retryOperation<T>(
    operation: () => Promise<T>,
    operationName: string,
    correlationId: string
  ): Promise<T> {
    let lastError: Error;
    let delay = RETRY_CONFIG.initialDelay;

    for (let attempt = 1; attempt <= RETRY_CONFIG.maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        lastError = error;

        // Check if retryable
        const errorType = mapDatabaseError(error);
        if (!isRetryable(errorType) || attempt === RETRY_CONFIG.maxAttempts) {
          throw error;
        }

        // Log retry
        authLogger.warn(
          `${operationName} attempt ${attempt} failed, retrying in ${delay}ms`,
          {
            correlationId,
            attempt,
            delay,
            error: error.message,
          }
        );

        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // Exponential backoff
        delay = Math.min(delay * RETRY_CONFIG.backoffFactor, RETRY_CONFIG.maxDelay);
      }
    }

    throw lastError!;
  }
}

// Export singleton instance
export const registrationService = new RegistrationService();
