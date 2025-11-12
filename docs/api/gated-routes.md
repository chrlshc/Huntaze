# Gated API Routes

This document lists all API routes that are protected by onboarding gating middleware.

## Overview

Gated routes enforce prerequisite checks before allowing access. When a user attempts to access a gated route without completing the required onboarding step, they receive a 409 response with guidance on how to complete the prerequisite.

## Route Criticality

- **Critical Routes (Fail-Closed)**: If the gating check fails due to an error, the request is blocked (503 response)
- **Non-Critical Routes (Fail-Open)**: If the gating check fails due to an error, the request is allowed to proceed

## Critical Routes

### Payment-Gated Routes

These routes require the `payments` onboarding step to be completed.

#### POST /api/store/publish

Publishes the user's store to make it live.

**Required Step**: `payments`

**Gating Response (409)**:
```json
{
  "error": "PRECONDITION_REQUIRED",
  "message": "Vous devez configurer les paiements avant de publier votre boutique",
  "missingStep": "payments",
  "action": {
    "type": "open_modal",
    "modal": "payments_setup"
  },
  "correlationId": "..."
}
```

**Success Response (200)**:
```json
{
  "success": true,
  "message": "Boutique publiée avec succès",
  "storeUrl": "https://user-123.huntaze.com",
  "correlationId": "..."
}
```

---

#### POST /api/checkout/initiate

Initiates a checkout session for a customer.

**Required Step**: `payments`

**Request Body**:
```json
{
  "items": [
    { "productId": "prod_123", "quantity": 2 }
  ],
  "customerId": "cust_456",
  "metadata": {}
}
```

**Gating Response (409)**:
```json
{
  "error": "PRECONDITION_REQUIRED",
  "message": "Vous devez configurer les paiements avant de traiter des commandes",
  "missingStep": "payments",
  "action": {
    "type": "open_modal",
    "modal": "payments_setup"
  },
  "correlationId": "..."
}
```

**Success Response (200)**:
```json
{
  "success": true,
  "checkoutSession": {
    "id": "checkout_1234567890",
    "userId": "user_123",
    "items": [...],
    "total": 10000,
    "currency": "EUR",
    "status": "pending",
    "expiresAt": "2025-11-11T15:00:00Z"
  },
  "paymentUrl": "/checkout/checkout_1234567890",
  "correlationId": "..."
}
```

---

#### POST /api/checkout/process

Processes a payment for a checkout session.

**Required Step**: `payments`

**Request Body**:
```json
{
  "checkoutSessionId": "checkout_123",
  "paymentMethodId": "pm_456",
  "billingDetails": {
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

**Gating Response (409)**:
```json
{
  "error": "PRECONDITION_REQUIRED",
  "message": "Vous devez configurer les paiements avant de traiter des transactions",
  "missingStep": "payments",
  "action": {
    "type": "open_modal",
    "modal": "payments_setup"
  },
  "correlationId": "..."
}
```

**Success Response (200)**:
```json
{
  "success": true,
  "payment": {
    "id": "payment_123",
    "amount": 10000,
    "currency": "EUR",
    "status": "succeeded"
  },
  "orderId": "order_456",
  "message": "Paiement traité avec succès",
  "correlationId": "..."
}
```

---

### Email-Gated Routes

These routes require the `email_verification` onboarding step to be completed.

#### POST /api/store/publish

(Also requires email verification in addition to payments)

**Required Step**: `email_verification`

**Gating Response (409)**:
```json
{
  "error": "PRECONDITION_REQUIRED",
  "message": "Vous devez vérifier votre email avant de publier votre boutique",
  "missingStep": "email_verification",
  "action": {
    "type": "open_modal",
    "modal": "email_verification"
  },
  "correlationId": "..."
}
```

---

## Non-Critical Routes

These routes benefit from gating but fail open on errors.

### GET /api/store/preview

Previews the user's store.

**Required Step**: `theme` (recommended, not enforced)

**Gating Response (409)**:
```json
{
  "error": "PRECONDITION_REQUIRED",
  "message": "Configurez un thème pour prévisualiser votre boutique",
  "missingStep": "theme",
  "action": {
    "type": "redirect",
    "url": "/admin/themes"
  },
  "correlationId": "..."
}
```

---

### GET /api/products/export

Exports products to CSV.

**Required Step**: `product` (recommended, not enforced)

**Gating Response (409)**:
```json
{
  "error": "PRECONDITION_REQUIRED",
  "message": "Ajoutez des produits avant d'exporter",
  "missingStep": "product",
  "action": {
    "type": "redirect",
    "url": "/admin/products/new"
  },
  "correlationId": "..."
}
```

---

## Implementation Examples

### Using Direct Check

```typescript
import { requireStep } from '@/lib/middleware/onboarding-gating';

export async function POST(req: Request) {
  const gatingCheck = await requireStep({
    requiredStep: 'payments',
    isCritical: true
  });
  
  if (gatingCheck) {
    return gatingCheck;
  }
  
  // Continue with your logic
}
```

### Using HOF Wrapper

```typescript
import { withGating } from '@/lib/middleware/onboarding-gating';

export const POST = withGating(
  { requiredStep: 'payments', isCritical: true },
  async (req: Request) => {
    // Your handler logic
  }
);
```

### Using Route Configuration

```typescript
import { getRouteGatingConfig } from '@/lib/middleware/route-config';
import { requireStep } from '@/lib/middleware/onboarding-gating';

export async function POST(req: Request) {
  const config = getRouteGatingConfig('/api/store/publish', 'POST');
  
  if (config) {
    const gatingCheck = await requireStep(config);
    if (gatingCheck) {
      return gatingCheck;
    }
  }
  
  // Continue with your logic
}
```

---

## Testing Gated Routes

### Test Blocked Access

```bash
# Without completing payments
curl -X POST https://api.huntaze.com/api/store/publish \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"

# Expected: 409 PRECONDITION_REQUIRED
```

### Test Allowed Access

```bash
# After completing payments
curl -X PATCH https://api.huntaze.com/api/onboarding/steps/payments \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "done"}'

# Then try publishing
curl -X POST https://api.huntaze.com/api/store/publish \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"

# Expected: 200 OK
```

---

## Monitoring

All gating blocks are logged with correlation IDs for tracing:

```typescript
[Gating Middleware] Gating check blocked {
  userId: "user-123",
  requiredStep: "payments",
  correlationId: "550e8400-e29b-41d4-a716-446655440000"
}
```

Analytics events are tracked:

```typescript
{
  eventType: "gating.blocked",
  userId: "user-123",
  stepId: "payments",
  metadata: {
    route: "/api/store/publish",
    isCritical: true
  }
}
```

---

## Adding New Gated Routes

1. Add route configuration to `lib/middleware/route-config.ts`
2. Apply middleware in your route handler
3. Update this documentation
4. Add integration tests

Example:

```typescript
// lib/middleware/route-config.ts
export const CRITICAL_PAYMENT_ROUTES: RouteGatingConfig[] = [
  // ... existing routes
  {
    path: '/api/your-new-route',
    method: 'POST',
    requiredStep: 'payments',
    message: 'Custom message',
    isCritical: true,
    action: {
      type: 'open_modal',
      modal: 'payments_setup'
    },
    description: 'Description of why this route is gated'
  }
];
```

---

## Related Documentation

- [Onboarding Gating Middleware](../../lib/middleware/README.md)
- [Onboarding API](./onboarding-endpoint.md)
- [Route Configuration](../../lib/middleware/route-config.ts)
