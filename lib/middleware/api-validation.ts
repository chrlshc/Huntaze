/**
 * API Validation Middleware
 * Validation robuste des requêtes avec gestion d'erreurs et logging
 */

import { NextRequest, NextResponse } from 'next/server';
import { z, ZodError, ZodSchema } from 'zod';
import { 
  ValidationError, 
  APIError,
  formatErrorForLogging,
  shouldLogError 
} from '@/lib/types/api-errors';
import { getAPIMonitoringService } from '@/lib/services/api-monitoring-service';

interface ValidationOptions {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
  headers?: ZodSchema;
  skipValidation?: boolean;
  customValidator?: (data: any) => Promise<void> | void;
}

interface ValidationResult<T = any> {
  success: boolean;
  data?: T;
  errors?: Array<{
    field: string;
    message: string;
    code: string;
  }>;
}

/**
 * Middleware de validation pour les API routes Next.js
 */
export function withValidation(options: ValidationOptions) {
  return function validationMiddleware<T extends (...args: any[]) => any>(
    handler: T
  ): T {
    return (async (request: NextRequest, context?: any) => {
      const startTime = Date.now();
      const monitoring = getAPIMonitoringService();
      
      try {
        // Skip validation si demandé
        if (options.skipValidation) {
          return await handler(request, context);
        }

        logDebug('Starting request validation', {
          method: request.method,
          url: request.url,
          hasBody: options.body !== undefined,
          hasQuery: options.query !== undefined,
        });

        const validationResults: Record<string, ValidationResult> = {};

        // Validation du body
        if (options.body && (request.method === 'POST' || request.method === 'PUT' || request.method === 'PATCH')) {
          try {
            const body = await request.json();
            validationResults.body = await validateData(body, options.body, 'body');
          } catch (error) {
            throw new ValidationError('Invalid JSON in request body', {
              error: error instanceof Error ? error.message : 'Unknown JSON parsing error',
            });
          }
        }

        // Validation des query parameters
        if (options.query) {
          const url = new URL(request.url);
          const queryParams = Object.fromEntries(url.searchParams.entries());
          validationResults.query = await validateData(queryParams, options.query, 'query');
        }

        // Validation des paramètres de route
        if (options.params && context?.params) {
          validationResults.params = await validateData(context.params, options.params, 'params');
        }

        // Validation des headers
        if (options.headers) {
          const headers = Object.fromEntries(request.headers.entries());
          validationResults.headers = await validateData(headers, options.headers, 'headers');
        }

        // Vérifier s'il y a des erreurs de validation
        const allErrors = Object.values(validationResults)
          .filter(result => !result.success)
          .flatMap(result => result.errors || []);

        if (allErrors.length > 0) {
          throw new ValidationError('Request validation failed', {
            errors: allErrors,
            validationResults,
          });
        }

        // Validation personnalisée
        if (options.customValidator) {
          const validatedData = Object.fromEntries(
            Object.entries(validationResults).map(([key, result]) => [key, result.data])
          );
          await options.customValidator(validatedData);
        }

        const duration = Date.now() - startTime;
        logDebug('Request validation successful', {
          duration,
          validatedFields: Object.keys(validationResults),
        });

        // Ajouter les données validées à la requête
        (request as any).validatedData = Object.fromEntries(
          Object.entries(validationResults).map(([key, result]) => [key, result.data])
        );

        return await handler(request, context);

      } catch (error) {
        const duration = Date.now() - startTime;
        
        if (error instanceof ValidationError) {
          logError('Request validation failed', error, { duration });
          
          return NextResponse.json({
            success: false,
            error: {
              type: 'validation_error',
              message: error.message,
              details: error.context?.errors || [],
            },
            meta: {
              timestamp: new Date().toISOString(),
              duration,
            },
          }, { status: 400 });
        }

        // Re-throw autres erreurs pour qu'elles soient gérées par le handler principal
        throw error;
      }
    }) as T;
  };
}

/**
 * Valide les données avec un schéma Zod
 */
async function validateData(
  data: any, 
  schema: ZodSchema, 
  fieldName: string
): Promise<ValidationResult> {
  try {
    const validatedData = await schema.parseAsync(data);
    return {
      success: true,
      data: validatedData,
    };
  } catch (error) {
    if (error instanceof ZodError) {
      const errors = error.errors.map(err => ({
        field: `${fieldName}.${err.path.join('.')}`,
        message: err.message,
        code: err.code,
      }));

      return {
        success: false,
        errors,
      };
    }

    throw new ValidationError(`Validation failed for ${fieldName}`, {
      originalError: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Schémas de validation communs
 */
export const CommonSchemas = {
  // Pagination
  pagination: z.object({
    page: z.string().transform(val => parseInt(val, 10)).pipe(z.number().min(1)).optional().default('1'),
    limit: z.string().transform(val => parseInt(val, 10)).pipe(z.number().min(1).max(100)).optional().default('10'),
    sort: z.string().optional(),
    order: z.enum(['asc', 'desc']).optional().default('desc'),
  }),

  // ID de ressource
  resourceId: z.object({
    id: z.string().min(1, 'ID is required'),
  }),

  // Headers d'authentification
  authHeaders: z.object({
    authorization: z.string().min(1, 'Authorization header is required'),
  }).or(z.object({
    'x-api-key': z.string().min(1, 'API key is required'),
  })),

  // Métadonnées de contenu
  contentMetadata: z.object({
    contentType: z.enum(['photo', 'video', 'story', 'ppv', 'live']),
    title: z.string().min(1).max(200),
    description: z.string().max(1000).optional(),
    tags: z.array(z.string()).max(20).optional(),
  }),

  // Filtres de date
  dateRange: z.object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  }).refine(data => {
    if (data.startDate && data.endDate) {
      return new Date(data.startDate) <= new Date(data.endDate);
    }
    return true;
  }, {
    message: 'Start date must be before end date',
  }),
};

/**
 * Validateurs personnalisés
 */
export const CustomValidators = {
  /**
   * Valide qu'un utilisateur a accès à une ressource
   */
  async validateResourceAccess(data: { userId: string; resourceId: string; action: string }) {
    // Ici on implémenterait la logique de vérification des permissions
    // Pour l'exemple, on simule une vérification
    if (!data.userId || !data.resourceId) {
      throw new ValidationError('Missing required fields for resource access validation');
    }
    
    // Simulation d'une vérification asynchrone
    await new Promise(resolve => setTimeout(resolve, 10));
    
    logDebug('Resource access validated', data);
  },

  /**
   * Valide les limites de rate limiting
   */
  async validateRateLimit(data: { userId: string; operation: string; limit: number }) {
    // Cette validation serait intégrée avec le service d'authentification
    logDebug('Rate limit validation', data);
  },

  /**
   * Valide la cohérence des données business
   */
  async validateBusinessRules(data: any) {
    // Exemple: vérifier que les prix sont cohérents, les dates valides, etc.
    if (data.body?.pricing) {
      const { currentPrice, recommendedPrice } = data.body.pricing;
      
      if (currentPrice && recommendedPrice) {
        const changePercent = Math.abs((recommendedPrice - currentPrice) / currentPrice) * 100;
        
        if (changePercent > 50) {
          throw new ValidationError('Price change exceeds maximum allowed threshold (50%)', {
            currentPrice,
            recommendedPrice,
            changePercent,
          });
        }
      }
    }
  },
};

/**
 * Middleware de sanitization des données
 */
export function withSanitization() {
  return function sanitizationMiddleware<T extends (...args: any[]) => any>(
    handler: T
  ): T {
    return (async (request: NextRequest, context?: any) => {
      try {
        // Sanitize query parameters
        const url = new URL(request.url);
        for (const [key, value] of url.searchParams.entries()) {
          // Nettoyer les paramètres de requête
          const sanitized = sanitizeString(value);
          if (sanitized !== value) {
            url.searchParams.set(key, sanitized);
          }
        }

        // Si le body existe, le sanitizer
        if (request.method !== 'GET' && request.method !== 'DELETE') {
          try {
            const body = await request.json();
            const sanitizedBody = sanitizeObject(body);
            
            // Créer une nouvelle requête avec le body sanitisé
            const sanitizedRequest = new Request(request.url, {
              method: request.method,
              headers: request.headers,
              body: JSON.stringify(sanitizedBody),
            });

            return await handler(sanitizedRequest as NextRequest, context);
          } catch (error) {
            // Si pas de JSON, continuer avec la requête originale
          }
        }

        return await handler(request, context);
      } catch (error) {
        throw error;
      }
    }) as T;
  };
}

/**
 * Sanitise une chaîne de caractères
 */
function sanitizeString(str: string): string {
  return str
    .trim()
    .replace(/[<>]/g, '') // Supprimer les caractères HTML dangereux
    .replace(/javascript:/gi, '') // Supprimer les protocoles dangereux
    .replace(/on\w+=/gi, ''); // Supprimer les event handlers
}

/**
 * Sanitise un objet récursivement
 */
function sanitizeObject(obj: any): any {
  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }
  
  if (obj && typeof obj === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[sanitizeString(key)] = sanitizeObject(value);
    }
    return sanitized;
  }
  
  return obj;
}

/**
 * Utilitaires de logging
 */
function logDebug(message: string, data?: any): void {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[APIValidation] ${message}`, data || '');
  }
}

function logError(message: string, error: APIError, data?: any): void {
  if (shouldLogError(error)) {
    console.error(`[APIValidation] ${message}`, {
      ...formatErrorForLogging(error),
      ...data,
    });
  }
}

/**
 * Middleware combiné pour validation complète
 */
export function withCompleteValidation(options: ValidationOptions & {
  enableSanitization?: boolean;
  enableMonitoring?: boolean;
}) {
  return function completeValidationMiddleware<T extends (...args: any[]) => any>(
    handler: T
  ): T {
    let wrappedHandler = handler;

    // Appliquer la sanitization si demandée
    if (options.enableSanitization !== false) {
      wrappedHandler = withSanitization()(wrappedHandler);
    }

    // Appliquer la validation
    wrappedHandler = withValidation(options)(wrappedHandler);

    return wrappedHandler;
  };
}

/**
 * Types pour TypeScript
 */
export interface ValidatedRequest extends NextRequest {
  validatedData?: {
    body?: any;
    query?: any;
    params?: any;
    headers?: any;
  };
}

/**
 * Helper pour extraire les données validées
 */
export function getValidatedData<T = any>(request: ValidatedRequest): T {
  return request.validatedData as T;
}