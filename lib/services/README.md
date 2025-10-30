# Huntaze Services

## 📋 Overview

This directory contains core business services for the Huntaze platform. Each service is designed to be modular, testable, and production-ready.

## 🗂️ Services

### AI Service (`ai-service.ts`)

**Status**: ✅ Production Ready  
**Version**: 2.0.0  
**Last Updated**: October 26, 2025

Unified AI provider integration with enterprise-grade features:

- ✅ Multiple providers (OpenAI, Azure OpenAI, Claude)
- ✅ Automatic retry with exponential backoff
- ✅ Response caching for performance
- ✅ Rate limiting per user
- ✅ Provider fallback on failures
- ✅ Structured error handling
- ✅ Comprehensive logging
- ✅ TypeScript types
- ✅ Timeout management

**Quick Start**:
```typescript
import { getAIService } from '@/lib/services/ai-service';

const aiService = getAIService();
const response = await aiService.generateText({
  prompt: "Write a message",
  context: { userId: "user-123", contentType: "message" }
});
```

**Documentation**: [AI Service API Integration Guide](../../docs/AI_SERVICE_API_INTEGRATION.md)  
**Tests**: [ai-service-optimized.test.ts](../../tests/unit/ai-service-optimized.test.ts)

---

### Simple User Service (`simple-user-service.ts`)

**Status**: ✅ Production Ready  
**Version**: 1.0.0

User management service with CRUD operations, soft delete, and subscription management.

**Features**:
- User CRUD operations
- Soft delete with email uniqueness
- Subscription management with upsert
- User statistics and metrics
- Hierarchical access validation
- Bulk operations
- Search functionality

**Quick Start**:
```typescript
import { simpleUserService } from '@/lib/services/simple-user-service';

const user = await simpleUserService.createUser({
  email: 'user@example.com',
  name: 'John Doe',
  password: 'secure-password'
});
```

**Tests**: [simple-user-service-complete.test.ts](../../tests/unit/simple-user-service-complete.test.ts)

---

### Simple Billing Service (`simple-billing-service.ts`)

**Status**: ✅ Production Ready  
**Version**: 1.0.0

Stripe integration service for subscription management and billing.

**Features**:
- Stripe checkout session creation
- Customer portal session management
- Webhook event handling
- Subscription management
- Feature access control
- Usage limits tracking
- Plan management

**Quick Start**:
```typescript
import { simpleBillingService } from '@/lib/services/simple-billing-service';

const session = await simpleBillingService.createCheckoutSession({
  priceId: 'price_pro_monthly',
  successUrl: 'https://app.huntaze.com/success',
  cancelUrl: 'https://app.huntaze.com/cancel'
});
```

**Tests**: [simple-billing-service-complete.test.ts](../../tests/unit/simple-billing-service-complete.test.ts)

---

### AI Content Service (`ai-content-service.ts`)

**Status**: ✅ Production Ready  
**Version**: 1.0.0

High-level AI content generation service built on top of AI Service.

**Features**:
- Message personalization
- Caption generation
- Content idea generation
- Pricing optimization
- Timing recommendations
- Template-based generation

**Quick Start**:
```typescript
import { aiContentService } from '@/lib/services/ai-content-service';

const message = await aiContentService.generatePersonalizedMessage({
  fanName: 'Sarah',
  context: 'birthday',
  tone: 'friendly'
});
```

---

### Other Services

#### Message Personalization (`message-personalization.ts`)
Advanced message personalization with fan data integration.

#### Platform Connections (`platformConnections.ts`)
Social media platform integration and authentication.

#### CRM Connections (`crmConnections.ts`)
CRM system integrations for customer data.

#### Event Emitter (`eventEmitter.ts`)
Event-driven architecture support.

#### Circuit Breaker (`circuit-breaker.ts`, `advanced-circuit-breaker.ts`)
Fault tolerance and resilience patterns.

#### Request Coalescer (`request-coalescer.ts`, `smart-request-coalescer.ts`)
Request deduplication and batching.

#### Graceful Degradation (`graceful-degradation.ts`)
Fallback strategies for service failures.

#### API Monitoring (`api-monitoring-service.ts`)
API health checks and monitoring.

#### SLO Monitoring (`slo-monitoring-service.ts`)
Service Level Objective tracking.

#### Optimization Engine (`optimization-engine.ts`)
Performance and cost optimization.

#### SSE Events (`sse-events.ts`)
Server-Sent Events for real-time updates.

## 🧪 Testing

### Run All Service Tests
```bash
npm run test tests/unit/simple-*.test.ts
npm run test tests/integration/user-billing-integration.test.ts
```

### Run AI Service Tests
```bash
node scripts/test-ai-service.mjs
```

### Run with Coverage
```bash
npm run test:coverage -- tests/unit/simple-*.test.ts
```

## 📚 Documentation

### Service-Specific Docs
- [AI Service API Integration](../../docs/AI_SERVICE_API_INTEGRATION.md)
- [AI Service Optimization Summary](../../docs/AI_SERVICE_OPTIMIZATION_SUMMARY.md)
- [Azure OpenAI Setup](../../docs/AZURE_OPENAI_SETUP.md)
- [Simple Services README](../../tests/simple-services-README.md)

### Architecture Docs
- [Architecture Complete](../../ARCHITECTURE_COMPLETE.md)
- [Architecture Detailed](../../ARCHITECTURE_DETAILED.md)

## 🔧 Development Guidelines

### Adding a New Service

1. **Create Service File**
   ```typescript
   // lib/services/my-service.ts
   export class MyService {
     async doSomething(): Promise<Result> {
       // Implementation
     }
   }
   
   export const myService = new MyService();
   ```

2. **Add TypeScript Types**
   ```typescript
   export interface MyServiceConfig {
     apiKey: string;
     timeout: number;
   }
   
   export interface MyServiceResult {
     success: boolean;
     data: any;
   }
   ```

3. **Create Tests**
   ```typescript
   // tests/unit/my-service.test.ts
   describe('MyService', () => {
     it('should do something', async () => {
       const result = await myService.doSomething();
       expect(result.success).toBe(true);
     });
   });
   ```

4. **Add Documentation**
   - Update this README
   - Create service-specific docs if needed
   - Add JSDoc comments in code

### Best Practices

#### Error Handling
```typescript
// ✅ Good: Structured errors
throw new ServiceError(
  'Operation failed',
  ErrorType.VALIDATION,
  { field: 'email' }
);

// ❌ Bad: Generic errors
throw new Error('Something went wrong');
```

#### Logging
```typescript
// ✅ Good: Structured logging
logger.info('User created', { userId, email });

// ❌ Bad: Unstructured logging
console.log('User created: ' + userId);
```

#### Type Safety
```typescript
// ✅ Good: Full types
interface CreateUserRequest {
  email: string;
  name: string;
  password: string;
}

// ❌ Bad: Any types
function createUser(data: any): any {
  // ...
}
```

#### Testing
```typescript
// ✅ Good: Comprehensive tests
describe('createUser', () => {
  it('should create user with valid data', async () => {});
  it('should reject invalid email', async () => {});
  it('should handle duplicate email', async () => {});
  it('should hash password', async () => {});
});

// ❌ Bad: Minimal tests
it('should work', async () => {
  // Single test for everything
});
```

## 🚀 Deployment

### Environment Variables

Each service may require specific environment variables. Check individual service documentation for details.

**Common Variables**:
```bash
NODE_ENV=production
LOG_LEVEL=info
API_TIMEOUT=30000
```

### Health Checks

Most services implement a `isHealthy()` method:

```typescript
const healthy = await myService.isHealthy();
if (!healthy) {
  // Handle unhealthy service
}
```

### Monitoring

Services expose metrics through `getMetrics()`:

```typescript
const metrics = await myService.getMetrics();
console.log(metrics);
// { totalRequests: 1000, successRate: 0.95, avgLatency: 150 }
```

## 📊 Service Status

| Service | Status | Tests | Coverage | Docs |
|---------|--------|-------|----------|------|
| AI Service | ✅ Ready | 30+ | 90%+ | ✅ Complete |
| Simple User Service | ✅ Ready | 34 | 85%+ | ✅ Complete |
| Simple Billing Service | ✅ Ready | 31 | 85%+ | ✅ Complete |
| AI Content Service | ✅ Ready | 20+ | 80%+ | ⚠️ Partial |
| Message Personalization | ✅ Ready | 15+ | 75%+ | ⚠️ Partial |
| Platform Connections | 🚧 Beta | 10+ | 70%+ | ⚠️ Partial |
| Circuit Breaker | ✅ Ready | 25+ | 90%+ | ✅ Complete |
| Request Coalescer | ✅ Ready | 20+ | 85%+ | ✅ Complete |

**Legend**:
- ✅ Ready: Production-ready
- 🚧 Beta: Functional but needs more testing
- ⚠️ Partial: Needs improvement

## 🤝 Contributing

1. Follow the development guidelines above
2. Write comprehensive tests (aim for 80%+ coverage)
3. Add documentation for new features
4. Run tests before committing: `npm run test`
5. Update this README when adding new services

## 📞 Support

For questions or issues:
- Check service-specific documentation
- Review test files for usage examples
- Contact the dev team on Slack: #huntaze-dev

---

**Last Updated**: October 26, 2025  
**Maintainer**: Huntaze Dev Team
