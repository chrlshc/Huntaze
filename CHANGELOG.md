# Changelog

All notable changes to the Huntaze API will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

#### OnlyFans Subscribers Management
- **NEW**: `GET /api/onlyfans/subscribers` - List OnlyFans subscribers
  - Pagination support (page, pageSize)
  - Filter by subscription tier (free, premium, vip)
  - Search by username or email (case-insensitive)
  - Aggregated counts (messages, transactions)
  - Returns subscriber metadata and activity stats
- **NEW**: `POST /api/onlyfans/subscribers` - Add new subscriber
  - Required fields: username, email
  - Optional fields: tier, onlyfansId
  - Automatic isActive flag set to true
  - Returns created subscriber with timestamps

## [2.0.0] - 2025-10-30

### Added

#### Dashboard APIs
- **NEW**: `GET /api/dashboard/metrics` - Aggregated dashboard metrics
  - Revenue metrics with 30-day comparison
  - Message count with trend analysis
  - Campaign statistics (active/total)
  - Engagement rate tracking
  - Formatted currency output
  - Percentage change calculations

#### OnlyFans Integration
- **NEW**: `POST /api/onlyfans/messages/send` - Send messages with rate limiting
  - Automatic rate limiting (10 messages/minute)
  - AWS SQS queue integration
  - Priority-based message handling
  - Media attachment support
  - Estimated delivery time
- **NEW**: `GET /api/onlyfans/messages/status` - Check message delivery status
  - Real-time status tracking
  - Retry attempt counting
  - Delivery timestamps

#### Marketing Campaigns
- **NEW**: `GET /api/campaigns` - List campaigns with filtering
  - Status-based filtering
  - Pagination support
  - Multi-platform campaigns
- **NEW**: `POST /api/campaigns` - Create marketing campaigns
  - 10 pre-built templates
  - Multi-platform support (OnlyFans, Instagram, TikTok, Reddit)
  - A/B testing integration
  - Scheduling capabilities
- **NEW**: `GET /api/campaigns/:id` - Get campaign details
- **NEW**: `POST /api/campaigns/:id/start` - Start campaign
- **NEW**: `POST /api/campaigns/:id/pause` - Pause campaign
- **NEW**: `GET /api/campaigns/:id/analytics` - Campaign analytics

#### Infrastructure
- AWS Lambda rate limiter integration
- SQS queue for message processing
- Redis ElastiCache for token bucket
- CloudWatch monitoring and alarms
- Terraform infrastructure as code

#### Database Models
- `OnlyFansMessage` - Message tracking
- `Campaign` - Campaign management
- `CampaignTemplate` - Reusable templates
- `CampaignMetric` - Performance metrics
- `CampaignConversion` - Conversion tracking
- `ABTest` - A/B test configurations
- `ABTestVariant` - Test variants
- `Automation` - Workflow definitions
- `AutomationExecution` - Execution history
- `Segment` - Audience segments
- `SegmentMember` - Segment membership

#### Documentation
- OpenAPI 3.0 specification
- Comprehensive API reference
- Integration guides
- Error code documentation
- Rate limiting documentation

### Changed

- **BREAKING**: Authentication now requires NextAuth.js v5 session
- **BREAKING**: All API responses now follow standardized format:
  ```json
  {
    "success": boolean,
    "data": object | array,
    "error": { "code": string, "message": string }
  }
  ```
- Improved error handling with specific error codes
- Enhanced logging with structured format
- Updated TypeScript types for all endpoints

### Deprecated

- Legacy authentication endpoints (use NextAuth.js v5)
- Old message sending endpoint (use rate-limited version)

### Security

- Added rate limiting on all endpoints
- Implemented circuit breaker pattern
- Enhanced input validation with Zod schemas
- Encrypted data at rest (SQS, Redis, Database)
- TLS 1.2+ for all communications

### Performance

- Parallel database queries for dashboard metrics
- Redis caching for rate limit state
- Optimized Prisma queries with indexes
- CloudWatch metrics for monitoring

### Fixed

- Fixed authentication session handling
- Fixed timezone issues in date calculations
- Fixed percentage change calculation for zero values
- Fixed currency formatting for large amounts

---

## [1.0.0] - 2025-10-01

### Added

- Initial API release
- Basic authentication
- User management
- Content creation endpoints

---

## API Versioning

The Huntaze API uses semantic versioning:

- **Major version** (2.x.x): Breaking changes
- **Minor version** (x.1.x): New features, backward compatible
- **Patch version** (x.x.1): Bug fixes, backward compatible

### Breaking Changes Policy

Breaking changes will be:
1. Announced 30 days in advance
2. Documented in this changelog
3. Supported for 90 days after deprecation

### Deprecation Timeline

1. **Announcement**: Feature marked as deprecated
2. **30 days**: Warning added to API responses
3. **90 days**: Feature removed

---

## Migration Guides

### Migrating from v1.x to v2.0

#### Authentication

**Before (v1.x)**:
```typescript
// Custom JWT authentication
const token = await getAuthToken();
fetch('/api/endpoint', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

**After (v2.0)**:
```typescript
// NextAuth.js session-based
import { signIn } from 'next-auth/react';
await signIn('credentials', { email, password });

// Cookies handled automatically
fetch('/api/endpoint', {
  credentials: 'include'
});
```

#### Response Format

**Before (v1.x)**:
```json
{
  "data": { ... },
  "status": "success"
}
```

**After (v2.0)**:
```json
{
  "success": true,
  "data": { ... }
}
```

#### Error Handling

**Before (v1.x)**:
```json
{
  "error": "Something went wrong"
}
```

**After (v2.0)**:
```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Something went wrong"
  }
}
```

---

## Upcoming Features

### Q4 2025

- [ ] Webhook support for real-time events
- [ ] GraphQL API endpoint
- [ ] Batch operations for campaigns
- [ ] Advanced analytics with ML insights
- [ ] Multi-language support

### Q1 2026

- [ ] Python SDK
- [ ] Ruby SDK
- [ ] Mobile SDKs (iOS, Android)
- [ ] WebSocket support for real-time updates
- [ ] Advanced A/B testing features

---

## Support

For questions about API changes:
- **Documentation**: https://docs.huntaze.com
- **Support**: support@huntaze.com
- **Discord**: https://discord.gg/huntaze
- **Status Page**: https://status.huntaze.com

---

[Unreleased]: https://github.com/huntaze/huntaze/compare/v2.0.0...HEAD
[2.0.0]: https://github.com/huntaze/huntaze/compare/v1.0.0...v2.0.0
[1.0.0]: https://github.com/huntaze/huntaze/releases/tag/v1.0.0
