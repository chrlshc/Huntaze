/**
 * Revenue Optimization Services - Main Export
 */

// Types
export * from './types';

// API Client
export { revenueAPI, RevenueAPIClient } from './api-client';

// Monitoring
export { revenueAPIMonitor } from './api-monitoring';
export type { APIMetrics } from './api-monitoring';

// Validation
export {
  validatePricingRequest,
  validateReEngageRequest,
  validateUpsellRequest,
  validateCreatorId,
  validateDateRange,
  sanitizeInput,
  ValidationError,
} from './api-validator';

// Services
export { pricingService, PricingService } from './pricing-service';
export { churnService, ChurnService } from './churn-service';
export { upsellService, UpsellService } from './upsell-service';
export { forecastService, ForecastService } from './forecast-service';
export { payoutService, PayoutService } from './payout-service';
