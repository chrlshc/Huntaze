/**
 * Auth Service - TypeScript Types
 * 
 * Type definitions for authentication and registration
 */

// ============================================================================
// Error Types
// ============================================================================

export enum AuthErrorType {
  // Validation
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_EMAIL = 'INVALID_EMAIL',
  INVALID_PASSWORD = 'INVALID_PASSWORD',
  MISSING_FIELDS = 'MISSING_FIELDS',
  
  // User Management
  USER_EXISTS = 'USER_EXISTS',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  
  // Authentication
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INVALID_TOKEN = 'INVALID_TOKEN',
  
  // Database
  DATABASE_ERROR = 'DATABASE_ERROR',
  
  // Network
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  
  // Generic
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

export interface AuthError extends Error {
  type: AuthErrorType;
  correlationId: string;
  userMessage: string;
  retryable: boolean;
  statusCode?: number;
  timestamp: Date;
  originalError?: Error;
}

// ============================================================================
// Registration Types
// ============================================================================

export interface RegisterRequest {
  fullName?: string;
  email: string;
  password: string;
}

export interface RegisterResponse {
  success: boolean;
  user: {
    id: string;
    email: string;
    name: string;
  };
  message?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt?: Date;
}

// ============================================================================
// Validation Types
// ============================================================================

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
}

// ============================================================================
// Database Types
// ============================================================================

export interface DatabaseUser {
  id: string;
  email: string;
  name: string;
  password: string;
  created_at: Date;
  updated_at?: Date;
}
