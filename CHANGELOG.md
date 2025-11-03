# Changelog

All notable changes to this project are documented here.

## [v1.4.2] – Instagram Webhook Documentation (2025-10-31)
- 📚 **Added**: Instagram webhook endpoint to OpenAPI spec
- 📚 **Added**: Webhook signature verification documentation
- 📚 **Added**: Meta Developer Console setup guide
- 📚 **Added**: Webhook event examples (media, comments, mentions)
- 📚 **Added**: Webhook verification challenge flow documentation
- 📚 **Updated**: API Reference with complete webhook section
- 🔧 **Documented**: Environment variables for webhook configuration
  - `INSTAGRAM_WEBHOOK_SECRET` - For signature verification
  - `INSTAGRAM_WEBHOOK_VERIFY_TOKEN` - For Meta verification challenge

## [v1.4.1] – API Documentation & Database Type Fix (2025-10-31)
- 🐛 **Fixed**: PostgreSQL numeric aggregate parsing in tests
  - Changed `expect(result.rows[0].total_value).toBeGreaterThan(0)` 
  - To `expect(parseInt(result.rows[0].total_value)).toBeGreaterThan(0)`
  - PostgreSQL returns SUM/COUNT/AVG as strings, not numbers
- 📚 **Added**: Complete OpenAPI 3.0 specification (`docs/api/openapi.yaml`)
- 📚 **Added**: Comprehensive API reference documentation (`docs/API_REFERENCE.md`)
- 📚 **Added**: Integration guide with code examples (`docs/api/INTEGRATION_GUIDE.md`)
- 📚 **Documented**: All CRM endpoints (fans, conversations, analytics)
- 📚 **Documented**: Authentication, rate limiting, error handling
- 📚 **Documented**: Database numeric value parsing requirement
- 🔧 **Important**: All developers must parse PostgreSQL aggregate results:
  - `SUM()` → `parseInt(value)`
  - `COUNT()` → `parseInt(value)`
  - `AVG()` → `parseFloat(value)`

## [v1.4.0] – Email Verification System (2025-10-31)
- ✅ Integrated AWS SES for transactional emails
- ✅ Created email verification flow with tokens (24h expiry)
- ✅ Added `email_verification_tokens` table to database
- ✅ Implemented verification email with professional HTML template
- ✅ Implemented welcome email sent after verification
- ✅ Created `/api/auth/verify-email` endpoint
- ✅ Created `/auth/verify-email` page with loading states
- ✅ Updated registration to send verification emails
- 🔧 Created `lib/email/ses.ts` for AWS SES integration
- 🔧 Created `lib/auth/tokens.ts` for token management
- 🔧 Created `scripts/test-email.js` for email testing
- 🔧 Created `scripts/add-email-verification.sql` for DB migration
- 📚 Added `docs/DEPLOYMENT_GUIDE.md` with complete deployment instructions
- 📚 Added `lib/email/README.md` with email system documentation
- 🚀 Updated `amplify.yml` for production deployment
- 🚀 Ready to deploy on AWS Amplify with full email verification

## [v1.3.0] – Database Setup Complete (2025-10-31)
- ✅ Started RDS instance `huntaze-postgres-production`
- ✅ Created `users` table with 7 columns (id, email, name, password_hash, email_verified, timestamps)
- ✅ Created `sessions` table with 5 columns (id, user_id, token, expires_at, created_at)
- ✅ Added optimized indexes on email, user_id, and token
- ✅ Configured foreign key constraints with CASCADE delete
- 🔧 Created `scripts/create-tables-only.sql` for clean table creation
- 🔧 Created `scripts/init-db-with-wait.sh` for automatic RDS availability waiting
- 🔧 Updated `scripts/init-db-safe.js` with better error handling
- 📚 Added `docs/DB_SETUP_COMPLETE.md` with full documentation
- 📚 Added `SETUP_SUCCESS.md` with quick reference guide
- 🚀 Authentication system is now 100% ready for production

## [v1.2.1] – UX guard (2025-10-05)
- CI guard to forbid the word "backend" in UX‑facing paths (`app/**`, `components/**`, `public/locales/**`, `lib/ui/**`).
- Add friendly error adapter (`lib/ui/friendlyError.ts`) and `fetchJson` helper (propagates `X-Request-Id`, throws friendly errors).
- No product copy changes beyond removing jargon.
- PR: #3

## [v1.2.0] – CIN endpoints + smoke (2025-10-05)
- Extend `withMonitoring` to CIN endpoints: `POST /api/cin/chat`, `GET /api/cin/status`.
- Force `runtime='nodejs'` on CIN routes.
- Add Playwright smoke test for `/api/cin/chat` (checks 200 + `X-Request-Id`).
- PR: #5 (replaces closed #4)

## [v1.1.0] – Observability baseline (2025-10-05)
- Add `withMonitoring` wrapper for billing/onboarding/webhooks routes.
- Structured logs + CloudWatch EMF metrics (`HttpRequests`, `HttpLatencyMs`) with dimensions `Service`, `Route`, `Method`, `Status`.
- Default namespace `Hunt/CIN` and service `cin-api`.
- Ensure `X-Request-Id` correlation in responses.
- Add `docs/RUNBOOK-CIN-AI.md`.
- PR: #1

[v1.4.0]: https://github.com/chrlshc/Huntaze/releases/tag/v1.4.0
[v1.3.0]: https://github.com/chrlshc/Huntaze/releases/tag/v1.3.0
[v1.2.1]: https://github.com/chrlshc/Huntaze/releases/tag/v1.2.1
[v1.2.0]: https://github.com/chrlshc/Huntaze/releases/tag/v1.2.0
[v1.1.0]: https://github.com/chrlshc/Huntaze/releases/tag/v1.1.0

