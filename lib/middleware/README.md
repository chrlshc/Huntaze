# Onboarding Gating Middleware

This middleware provides contextual guard-rails for the Shopify-style onboarding system. It enforces prerequisite checks on critical actions, returning structured 409 responses when requirements are not met.

## Features

- ✅ Checks if users have completed required onboarding steps
- ✅ Returns structured 409 responses with actionable guidance
- ✅ Supports fail-open (non-critical) and fail-closed (critical) modes
- ✅ Logs gating events for analytics
- ✅ Provides correlation IDs for request tracing
- ✅ Includes default messages and actions for common steps

## Usage

### Option 1: Direct Check in Route Handler

```typescript
import { requireStep } from '@/lib/middleware/onboarding-gating';

export async function POST(req: Request) {
  // Check if user has completed payments setup
  const gatingCheck = await requireStep({
    requiredStep: 'payments',
    isCritical: true
  });
  
  if (gatingCheck) {
    return gatingCheck; // Returns 409 response
  }
  
  // Continue with your logic
  // User has completed the required step
  // ...
  
  return NextResponse.json({ success: true });
}
```

### Option 2: Higher-Order Function Wrapper

```typescript
import { withGating } from '@/lib/middleware/onboarding-gating';

export const POST = withGating(
  { 
    requiredStep: 'payments',
    isCritical: true,
    message: 'Vous devez configurer les paiements pour publier votre boutique'
  },
  async (req: Request) => {
    // Your handler logic - only runs if gating check passes
    return NextResponse.json({ success: true });
  }
);
```

### Option 3: Global Middleware (middleware.ts)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { onboardingGatingMiddleware } from '@/lib/middleware/onboarding-gating';

export async function middleware(req: NextRequest) {
  // Check if route requires gating
  if (req.nextUrl.pathname.startsWith('/api/store/publish')) {
    const gatingResponse = await onboardingGatingMiddleware(req, {
      requiredStep: 'payments',
      isCritical: true
    });
    
    if (gatingResponse) {
      return gatingResponse;
    }
  }
  
  if (req.nextUrl.pathname.startsWith('/api/checkout')) {
    const gatingResponse = await onboardingGatingMiddleware(req, {
      requiredStep: 'payments',
      isCritical: true
    });
    
    if (gatingResponse) {
      return gatingResponse;
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/api/store/:path*', '/api/checkout/:path*']
};
```

## Configuration Options

### GatingConfig

```typescript
interface GatingConfig {
  requiredStep: string;        // Step ID that must be completed
  message?: string;            // Custom error message
  action?: {                   // Custom action for the user
    type: 'open_modal' | 'redirect';
    modal?: string;            // Modal ID to open
    url?: string;              // URL to redirect to
    prefill?: Record<string, any>;  // Prefill data for modal
  };
  isCritical?: boolean;        // Fail-closed (true) or fail-open (false)
}
```

### Default Messages

The middleware includes default messages for common steps:

- `email_verification`: "Vous devez vérifier votre email avant de continuer"
- `payments`: "Vous devez configurer les paiements avant de publier votre boutique"
- `theme`: "Vous devez configurer un thème avant de publier"
- `product`: "Vous devez ajouter au moins un produit avant de publier"

### Default Actions

Default actions are provided for common steps:

- `email_verification`: Opens email verification modal
- `payments`: Opens payments setup modal
- `theme`: Redirects to `/admin/themes`
- `product`: Redirects to `/admin/products/new`

## Response Format

When a prerequisite is missing, the middleware returns a 409 response:

```json
{
  "error": "PRECONDITION_REQUIRED",
  "message": "Vous devez configurer les paiements avant de publier votre boutique",
  "missingStep": "payments",
  "action": {
    "type": "open_modal",
    "modal": "payments_setup",
    "prefill": {
      "country": "FR",
      "returnUrl": "/store/publish"
    }
  },
  "correlationId": "550e8400-e29b-41d4-a716-446655440000"
}
```

## Error Handling

### Fail-Open (Non-Critical Routes)

For non-critical routes, the middleware fails open on errors:

```typescript
const gatingCheck = await requireStep({
  requiredStep: 'theme',
  isCritical: false  // Fail open on errors
});
```

If the gating check fails due to a database error or other issue, the request is allowed to proceed.

### Fail-Closed (Critical Routes)

For critical routes, the middleware fails closed:

```typescript
const gatingCheck = await requireStep({
  requiredStep: 'payments',
  isCritical: true  // Fail closed on errors
});
```

If the gating check fails, a 503 response is returned.

## Analytics Events

The middleware automatically logs `gating.blocked` events for analytics:

```typescript
{
  userId: "user-123",
  eventType: "gating.blocked",
  stepId: "payments",
  metadata: {
    route: "/api/store/publish",
    isCritical: true
  },
  correlationId: "550e8400-e29b-41d4-a716-446655440000"
}
```

## Examples

### Protecting Store Publish

```typescript
// app/api/store/publish/route.ts
import { requireStep } from '@/lib/middleware/onboarding-gating';

export async function POST(req: Request) {
  const gatingCheck = await requireStep({
    requiredStep: 'payments',
    isCritical: true,
    message: 'Vous devez configurer les paiements avant de publier votre boutique'
  });
  
  if (gatingCheck) {
    return gatingCheck;
  }
  
  // Publish store logic
  // ...
}
```

### Protecting Checkout

```typescript
// app/api/checkout/route.ts
import { withGating } from '@/lib/middleware/onboarding-gating';

export const POST = withGating(
  { 
    requiredStep: 'payments',
    isCritical: true
  },
  async (req: Request) => {
    // Checkout logic
    // ...
  }
);
```

### Custom Action with Prefill

```typescript
const gatingCheck = await requireStep({
  requiredStep: 'payments',
  isCritical: true,
  action: {
    type: 'open_modal',
    modal: 'payments_setup',
    prefill: {
      country: user.country,
      currency: user.currency,
      returnUrl: req.url
    }
  }
});
```

## Testing

```typescript
import { requireStep } from '@/lib/middleware/onboarding-gating';

describe('Gating Middleware', () => {
  it('should block when step is not complete', async () => {
    const response = await requireStep({
      requiredStep: 'payments',
      isCritical: true
    });
    
    expect(response).not.toBeNull();
    expect(response?.status).toBe(409);
  });
  
  it('should allow when step is complete', async () => {
    // Complete the step first
    await completeStep(userId, 'payments');
    
    const response = await requireStep({
      requiredStep: 'payments',
      isCritical: true
    });
    
    expect(response).toBeNull();
  });
});
```

## Monitoring

The middleware logs structured events for monitoring:

```typescript
// Success
[Gating Middleware] Gating check passed {
  userId: "user-123",
  requiredStep: "payments",
  correlationId: "..."
}

// Blocked
[Gating Middleware] Gating check blocked {
  userId: "user-123",
  requiredStep: "payments",
  correlationId: "..."
}

// Error
[Gating Middleware] Gating check failed {
  error: "Database connection failed",
  requiredStep: "payments",
  correlationId: "..."
}
```

## Best Practices

1. **Use `isCritical: true` for financial operations** (payments, checkouts)
2. **Use `isCritical: false` for preview/settings routes**
3. **Provide custom messages** that explain why the step is required
4. **Include prefill data** to make it easier for users to complete the step
5. **Monitor gating.blocked events** to identify friction points
6. **Test both success and failure paths** in your integration tests

## Related

- [Onboarding API Documentation](../../docs/api/onboarding-endpoint.md)
- [User Onboarding Repository](../db/repositories/user-onboarding.ts)
- [Onboarding Events Repository](../db/repositories/onboarding-events.ts)
