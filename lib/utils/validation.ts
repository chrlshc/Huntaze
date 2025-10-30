import { z } from 'zod';

// User ID sanitization function
export function sanitizeUserId(userId: string): string {
  if (!userId || typeof userId !== 'string') {
    return '';
  }
  
  // Remove any SQL injection attempts - keep only alphanumeric and underscore
  // Note: We exclude dashes to prevent SQL comment sequences like '--'
  return userId.replace(/[^a-zA-Z0-9_]/g, '');
}

// Email validation schema
export const EmailSchema = z.string().email().min(5).max(254);

// Password validation schema
export const PasswordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one lowercase letter, one uppercase letter, and one number');

// User creation schema
export const CreateUserSchema = z.object({
  name: z.string().min(2).max(50),
  email: EmailSchema,
  password: PasswordSchema,
  acceptTerms: z.boolean().refine(val => val === true, 'Terms must be accepted'),
});

// User update schema
export const UpdateUserSchema = z.object({
  name: z.string().min(2).max(50).optional(),
  email: EmailSchema.optional(),
  avatar: z.string().url().optional(),
});

// Content validation schemas
export const ContentIdeaSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  contentType: z.enum(['photo', 'video', 'story', 'live']),
  tags: z.array(z.string()).max(10),
  platforms: z.array(z.enum(['onlyfans', 'instagram', 'tiktok', 'reddit'])).optional(),
});

// Asset validation schema
export const AssetSchema = z.object({
  id: z.string(),
  title: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  type: z.enum(['image', 'video', 'audio']),
  url: z.string().url(),
  thumbnailUrl: z.string().url().optional(),
  size: z.number().positive(),
  duration: z.number().positive().optional(),
  tags: z.array(z.string()).max(20),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Campaign validation schema
export const CampaignSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100),
  description: z.string().max(1000).optional(),
  status: z.enum(['draft', 'active', 'paused', 'completed']),
  startDate: z.date(),
  endDate: z.date(),
  budget: z.number().positive().optional(),
  targetAudience: z.array(z.string()).optional(),
  platforms: z.array(z.enum(['onlyfans', 'instagram', 'tiktok', 'reddit'])),
  assets: z.array(z.string()),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// API response validation
export const APIResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.object({
    type: z.string(),
    message: z.string(),
    code: z.string().optional(),
  }).optional(),
  meta: z.object({
    requestId: z.string(),
    timestamp: z.date(),
    duration: z.number().optional(),
  }).optional(),
});

// Validation helper functions
export function validateEmail(email: string): boolean {
  try {
    EmailSchema.parse(email);
    return true;
  } catch {
    return false;
  }
}

export function validatePassword(password: string): boolean {
  try {
    PasswordSchema.parse(password);
    return true;
  } catch {
    return false;
  }
}

export function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .replace(/[<>]/g, '') // Remove HTML brackets
    .trim();
}

export function validateUserInput(input: any, schema: z.ZodSchema): { valid: boolean; errors?: string[] } {
  try {
    schema.parse(input);
    return { valid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        valid: false,
        errors: error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
      };
    }
    return {
      valid: false,
      errors: ['Validation failed']
    };
  }
}

// Rate limiting validation
export function validateRateLimit(
  requests: number,
  timeWindow: number,
  limit: number
): { allowed: boolean; resetTime?: Date } {
  if (requests >= limit) {
    return {
      allowed: false,
      resetTime: new Date(Date.now() + timeWindow)
    };
  }
  
  return { allowed: true };
}

// File validation
export function validateFileUpload(file: File, options: {
  maxSize?: number;
  allowedTypes?: string[];
  maxFiles?: number;
}): { valid: boolean; error?: string } {
  const { maxSize = 10 * 1024 * 1024, allowedTypes = [], maxFiles = 1 } = options;
  
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size exceeds ${maxSize / (1024 * 1024)}MB limit`
    };
  }
  
  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} not allowed. Allowed types: ${allowedTypes.join(', ')}`
    };
  }
  
  return { valid: true };
}

// URL validation
export function validateURL(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// Date validation
export function validateDateRange(startDate: Date, endDate: Date): boolean {
  return startDate < endDate && startDate >= new Date();
}

// Export all schemas for use in API routes
export const ValidationSchemas = {
  Email: EmailSchema,
  Password: PasswordSchema,
  CreateUser: CreateUserSchema,
  UpdateUser: UpdateUserSchema,
  ContentIdea: ContentIdeaSchema,
  Asset: AssetSchema,
  Campaign: CampaignSchema,
  APIResponse: APIResponseSchema,
};

export default ValidationSchemas;