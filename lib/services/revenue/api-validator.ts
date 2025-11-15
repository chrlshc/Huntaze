/**
 * Revenue API Request Validator
 * 
 * Client-side validation before API calls
 */

import type {
  ApplyPricingRequest,
  ReEngageRequest,
  SendUpsellRequest,
} from './types';

export class ValidationError extends Error {
  constructor(
    message: string,
    public field?: string
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Validate pricing request
 */
export function validatePricingRequest(request: ApplyPricingRequest): void {
  if (!request.creatorId || typeof request.creatorId !== 'string') {
    throw new ValidationError('Creator ID is required', 'creatorId');
  }

  if (!request.priceType || !['subscription', 'ppv'].includes(request.priceType)) {
    throw new ValidationError('Price type must be "subscription" or "ppv"', 'priceType');
  }

  if (typeof request.newPrice !== 'number' || request.newPrice <= 0) {
    throw new ValidationError('Price must be a positive number', 'newPrice');
  }

  if (request.newPrice > 999.99) {
    throw new ValidationError('Price cannot exceed $999.99', 'newPrice');
  }

  if (request.priceType === 'ppv' && !request.contentId) {
    throw new ValidationError('Content ID is required for PPV pricing', 'contentId');
  }
}

/**
 * Validate re-engage request
 */
export function validateReEngageRequest(request: ReEngageRequest): void {
  if (!request.creatorId || typeof request.creatorId !== 'string') {
    throw new ValidationError('Creator ID is required', 'creatorId');
  }

  if (!request.fanId || typeof request.fanId !== 'string') {
    throw new ValidationError('Fan ID is required', 'fanId');
  }

  if (request.messageTemplate && request.messageTemplate.length > 1000) {
    throw new ValidationError('Message template cannot exceed 1000 characters', 'messageTemplate');
  }
}

/**
 * Validate upsell request
 */
export function validateUpsellRequest(request: SendUpsellRequest): void {
  if (!request.creatorId || typeof request.creatorId !== 'string') {
    throw new ValidationError('Creator ID is required', 'creatorId');
  }

  if (!request.opportunityId || typeof request.opportunityId !== 'string') {
    throw new ValidationError('Opportunity ID is required', 'opportunityId');
  }

  if (request.customMessage && request.customMessage.length > 1000) {
    throw new ValidationError('Custom message cannot exceed 1000 characters', 'customMessage');
  }
}

/**
 * Validate creator ID format
 */
export function validateCreatorId(creatorId: string): boolean {
  // Basic validation - adjust based on your ID format
  return /^[a-zA-Z0-9_-]{8,64}$/.test(creatorId);
}

/**
 * Validate date range
 */
export function validateDateRange(start: Date, end: Date): void {
  if (!(start instanceof Date) || isNaN(start.getTime())) {
    throw new ValidationError('Invalid start date', 'startDate');
  }

  if (!(end instanceof Date) || isNaN(end.getTime())) {
    throw new ValidationError('Invalid end date', 'endDate');
  }

  if (start >= end) {
    throw new ValidationError('Start date must be before end date', 'dateRange');
  }

  // Max 2 years range
  const maxRange = 2 * 365 * 24 * 60 * 60 * 1000;
  if (end.getTime() - start.getTime() > maxRange) {
    throw new ValidationError('Date range cannot exceed 2 years', 'dateRange');
  }
}

/**
 * Sanitize user input
 */
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .substring(0, 1000); // Limit length
}
