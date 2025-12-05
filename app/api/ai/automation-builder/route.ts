/**
 * AI Automation Builder API Route
 * 
 * Generates automation flows from natural language descriptions using DeepSeek R1.
 * Also provides template generation for automation actions.
 * 
 * Requirements: 1.1, 4.1, 4.2, 4.3
 * 
 * @endpoint POST /api/ai/automation-builder
 * @authentication Required (NextAuth session)
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/api/middleware/auth';
import { withRateLimit } from '@/lib/api/middleware/rate-limit';
import { createSuccessResponse, createErrorResponse } from '@/lib/api/types/responses';
import { ApiErrorCode } from '@/lib/api/types/errors';
import {
  getAutomationBuilderService,
  GenerateTemplateRequest,
} from '@/lib/ai/automation-builder.service';
import { TriggerType, ActionType } from '@/lib/automations/types';
import { createLogger } from '@/lib/utils/logger';
import { z } from 'zod';
import crypto from 'crypto';

// Force Node.js runtime
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const logger = createLogger('ai-automation-builder-api');

// ============================================================================
// Validation Schemas
// ============================================================================

/**
 * Schema for building automation flow from description
 */
const BuildFlowSchema = z.object({
  action: z.literal('build_flow'),
  description: z.string()
    .min(10, 'Description must be at least 10 characters')
    .max(1000, 'Description must be less than 1000 characters'),
});

/**
 * Schema for generating response template
 */
const GenerateTemplateSchema = z.object({
  action: z.literal('generate_template'),
  triggerType: z.enum([
    'new_subscriber',
    'message_received',
    'purchase_completed',
    'subscription_expiring',
  ] as const),
  actionType: z.enum([
    'send_message',
    'create_offer',
    'add_tag',
    'wait',
  ] as const),
  context: z.object({
    tone: z.enum(['friendly', 'professional', 'casual', 'flirty']).optional(),
    purpose: z.string().max(200).optional(),
    fanData: z.record(z.string(), z.any()).optional(),
  }).optional(),
});

/**
 * Schema for validating template placeholders
 */
const ValidatePlaceholdersSchema = z.object({
  action: z.literal('validate_placeholders'),
  template: z.string()
    .min(1, 'Template is required')
    .max(2000, 'Template must be less than 2000 characters'),
});

/**
 * Combined request schema
 */
const RequestSchema = z.discriminatedUnion('action', [
  BuildFlowSchema,
  GenerateTemplateSchema,
  ValidatePlaceholdersSchema,
]);

// ============================================================================
// Main Handler
// ============================================================================

/**
 * POST /api/ai/automation-builder
 * 
 * Multi-action endpoint for automation building:
 * - build_flow: Generate automation flow from natural language
 * - generate_template: Generate response template for action
 * - validate_placeholders: Validate template placeholders
 * 
 * Requirements:
 * - 1.1: Generate structured flow from natural language
 * - 4.1: Generate contextual message content
 * - 4.2: Consider trigger context and fan data
 * - 4.3: Support placeholders for dynamic content
 */
export const POST = withRateLimit(
  withAuth(async (req: AuthenticatedRequest) => {
    const startTime = Date.now();
    const correlationId = crypto.randomUUID();

    try {
      logger.info('Automation builder request received', {
        correlationId,
        userId: req.user.id,
      });

      // 1. Parse request body
      let body: any;
      try {
        body = await req.json();
      } catch {
        return Response.json(
          createErrorResponse(
            'Invalid request body',
            ApiErrorCode.VALIDATION_ERROR,
            { correlationId, startTime }
          ),
          { status: 400, headers: { 'X-Correlation-Id': correlationId } }
        );
      }

      // 2. Validate request
      const validation = RequestSchema.safeParse(body);
      if (!validation.success) {
        logger.warn('Validation failed', {
          correlationId,
          errors: validation.error.issues,
        });

        return Response.json(
          createErrorResponse(
            validation.error.issues[0].message,
            ApiErrorCode.VALIDATION_ERROR,
            {
              correlationId,
              startTime,
              metadata: { errors: validation.error.issues },
            }
          ),
          { status: 400, headers: { 'X-Correlation-Id': correlationId } }
        );
      }

      const service = getAutomationBuilderService();
      const userId = parseInt(req.user.id);

      // 3. Route to appropriate handler
      switch (validation.data.action) {
        case 'build_flow': {
          const { description } = validation.data;

          logger.info('Building automation flow', {
            correlationId,
            userId,
            descriptionLength: description.length,
          });

          const result = await service.buildAutomationFlow({
            description,
            userId,
          });

          const duration = Date.now() - startTime;

          logger.info('Automation flow built', {
            correlationId,
            userId,
            duration,
            stepsCount: result.steps.length,
            confidence: result.confidence,
          });

          return Response.json(
            createSuccessResponse(
              {
                name: result.name,
                description: result.description,
                steps: result.steps,
                confidence: result.confidence,
              },
              { correlationId, startTime }
            ),
            {
              status: 200,
              headers: {
                'X-Correlation-Id': correlationId,
                'X-Duration-Ms': duration.toString(),
              },
            }
          );
        }

        case 'generate_template': {
          const { triggerType, actionType, context } = validation.data;

          logger.info('Generating response template', {
            correlationId,
            userId,
            triggerType,
            actionType,
          });

          const result = await service.generateResponseTemplate({
            triggerType: triggerType as TriggerType,
            actionType: actionType as ActionType,
            context,
          });

          const duration = Date.now() - startTime;

          logger.info('Template generated', {
            correlationId,
            userId,
            duration,
            placeholdersCount: result.placeholders.length,
            confidence: result.confidence,
          });

          return Response.json(
            createSuccessResponse(
              {
                template: result.template,
                placeholders: result.placeholders,
                confidence: result.confidence,
              },
              { correlationId, startTime }
            ),
            {
              status: 200,
              headers: {
                'X-Correlation-Id': correlationId,
                'X-Duration-Ms': duration.toString(),
              },
            }
          );
        }

        case 'validate_placeholders': {
          const { template } = validation.data;

          const result = service.validateTemplatePlaceholders(template);

          return Response.json(
            createSuccessResponse(
              {
                valid: result.valid,
                validPlaceholders: result.validPlaceholders,
                invalidPlaceholders: result.invalidPlaceholders,
                availablePlaceholders: service.getAvailablePlaceholders(),
              },
              { correlationId, startTime }
            ),
            {
              status: 200,
              headers: { 'X-Correlation-Id': correlationId },
            }
          );
        }

        default:
          return Response.json(
            createErrorResponse(
              'Unknown action',
              ApiErrorCode.VALIDATION_ERROR,
              { correlationId, startTime }
            ),
            { status: 400, headers: { 'X-Correlation-Id': correlationId } }
          );
      }
    } catch (error: any) {
      const duration = Date.now() - startTime;

      logger.error('Automation builder error', error, {
        correlationId,
        userId: req.user.id,
        duration,
      });

      return Response.json(
        createErrorResponse(
          'Failed to process automation builder request',
          ApiErrorCode.INTERNAL_ERROR,
          { correlationId, startTime, retryable: true }
        ),
        {
          status: 500,
          headers: {
            'X-Correlation-Id': correlationId,
            'Retry-After': '10',
          },
        }
      );
    }
  }),
  { limit: 30, windowMs: 60000 } // 30 requests per minute
);

/**
 * GET /api/ai/automation-builder
 * 
 * Returns available triggers, actions, and placeholders
 */
export const GET = withAuth(async (req: AuthenticatedRequest) => {
  const correlationId = crypto.randomUUID();
  const service = getAutomationBuilderService();

  return Response.json(
    createSuccessResponse(
      {
        triggers: service.getAvailableTriggers(),
        actions: service.getAvailableActions(),
        placeholders: service.getAvailablePlaceholders(),
      },
      { correlationId, startTime: Date.now() }
    ),
    {
      status: 200,
      headers: {
        'X-Correlation-Id': correlationId,
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    }
  );
});

/**
 * OPTIONS handler for CORS preflight
 */
export async function OPTIONS(): Promise<NextResponse> {
  return NextResponse.json(null, {
    status: 200,
    headers: {
      'Allow': 'GET, POST, OPTIONS',
      'Cache-Control': 'public, max-age=86400',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
