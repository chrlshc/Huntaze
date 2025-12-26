/**
 * Route Configuration for Onboarding Gating
 * 
 * This file defines which routes require gating checks and their criticality levels.
 * Critical routes fail closed (block on errors), non-critical routes fail open (allow on errors).
 */

import { GatingConfig } from './onboarding-gating';

/**
 * Route gating configuration
 */
export interface RouteGatingConfig extends GatingConfig {
  path: string;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  description?: string;
}

/**
 * Critical routes that require payment configuration
 * These routes fail closed - if gating check fails, the request is blocked
 */
export const CRITICAL_PAYMENT_ROUTES: RouteGatingConfig[] = [
  {
    path: '/api/store/publish',
    method: 'POST',
    requiredStep: 'payments',
    message: 'Vous devez configurer les paiements avant de publier votre boutique',
    isCritical: true,
    action: {
      type: 'open_modal',
      modal: 'payments_setup'
    },
    description: 'Publishing store requires payment configuration'
  },
  {
    path: '/api/checkout/initiate',
    method: 'POST',
    requiredStep: 'payments',
    message: 'Vous devez configurer les paiements avant de traiter des commandes',
    isCritical: true,
    action: {
      type: 'open_modal',
      modal: 'payments_setup'
    },
    description: 'Initiating checkout requires payment configuration'
  },
  {
    path: '/api/checkout/process',
    method: 'POST',
    requiredStep: 'payments',
    message: 'Vous devez configurer les paiements avant de traiter des transactions',
    isCritical: true,
    action: {
      type: 'open_modal',
      modal: 'payments_setup'
    },
    description: 'Processing payments requires payment configuration'
  },
  {
    path: '/api/checkout/refund',
    method: 'POST',
    requiredStep: 'payments',
    message: 'Vous devez configurer les paiements avant de traiter des remboursements',
    isCritical: true,
    action: {
      type: 'open_modal',
      modal: 'payments_setup'
    },
    description: 'Processing refunds requires payment configuration'
  }
];

/**
 * Critical routes that require email verification
 * These routes fail closed
 */
export const CRITICAL_EMAIL_ROUTES: RouteGatingConfig[] = [];

/**
 * Non-critical routes that benefit from gating but can fail open
 * These routes fail open - if gating check fails, the request is allowed
 */
export const NON_CRITICAL_ROUTES: RouteGatingConfig[] = [
  {
    path: '/api/store/preview',
    method: 'GET',
    requiredStep: 'theme',
    message: 'Configurez un thème pour prévisualiser votre boutique',
    isCritical: false,
    action: {
      type: 'redirect',
      url: '/admin/themes'
    },
    description: 'Store preview benefits from theme configuration but not required'
  },
  {
    path: '/api/products/export',
    method: 'GET',
    requiredStep: 'product',
    message: 'Ajoutez des produits avant d\'exporter',
    isCritical: false,
    action: {
      type: 'redirect',
      url: '/admin/products/new'
    },
    description: 'Product export benefits from having products but not required'
  }
];

/**
 * Get gating configuration for a specific route
 */
export function getRouteGatingConfig(
  path: string,
  method: string = 'GET'
): RouteGatingConfig | null {
  const allRoutes = [
    ...CRITICAL_PAYMENT_ROUTES,
    ...CRITICAL_EMAIL_ROUTES,
    ...NON_CRITICAL_ROUTES
  ];
  
  return allRoutes.find(
    route => route.path === path && (!route.method || route.method === method)
  ) || null;
}

/**
 * Check if a route is critical
 */
export function isRouteGated(path: string, method: string = 'GET'): boolean {
  return getRouteGatingConfig(path, method) !== null;
}

/**
 * Check if a route is critical (fail-closed)
 */
export function isRouteCritical(path: string, method: string = 'GET'): boolean {
  const config = getRouteGatingConfig(path, method);
  return config?.isCritical ?? false;
}

/**
 * Get all routes that require a specific step
 */
export function getRoutesRequiringStep(stepId: string): RouteGatingConfig[] {
  const allRoutes = [
    ...CRITICAL_PAYMENT_ROUTES,
    ...CRITICAL_EMAIL_ROUTES,
    ...NON_CRITICAL_ROUTES
  ];
  
  return allRoutes.filter(route => route.requiredStep === stepId);
}

/**
 * Export all route configurations for documentation
 */
export const ALL_GATED_ROUTES = {
  critical: {
    payments: CRITICAL_PAYMENT_ROUTES,
    email: CRITICAL_EMAIL_ROUTES
  },
  nonCritical: NON_CRITICAL_ROUTES
};
