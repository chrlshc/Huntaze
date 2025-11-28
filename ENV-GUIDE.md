# Environment Files Guide

This guide documents all environment configuration files in the Huntaze project and their purposes.

## Core Environment Files

### `.env.local` (Local Development)
**Purpose**: Primary configuration file for local development
**Status**: Active - Used by developers
**Contains**:
- Database connection strings (local PostgreSQL)
- AWS credentials for development
- API keys for third-party services
- NextAuth configuration
- Feature flags for local testing

**Usage**: Copy from `.env.example` and customize for your local setup

### `.env.production` (Production Settings)
**Purpose**: Production environment configuration
**Status**: Active - Used in production deployments
**Contains**:
- Production database URLs
- Production AWS resources
- Production API endpoints
- Optimized caching settings
- Production feature flags

**Security**: Never commit this file. Values are set via AWS Amplify/deployment platform.

### `.env.test` (Test Environment)
**Purpose**: Configuration for running automated tests
**Status**: Active - Used by test suites
**Contains**:
- Test database connection
- Mock API endpoints
- Test-specific feature flags
- Isolated AWS resources for testing

**Usage**: Automatically loaded by Vitest during test execution

### `.env.example` (Template)
**Purpose**: Template showing all available environment variables
**Status**: Active - Reference for developers
**Contains**:
- All possible environment variables with descriptions
- Safe example values (no real credentials)
- Grouped by concern (Database, AWS, Auth, Integrations, etc.)

**Usage**: Copy to `.env.local` and fill in real values

## Specialized Environment Files

### `.env.production.ai` (AI Services Production)
**Purpose**: Production configuration specifically for AI services
**Contains**:
- OpenAI/Gemini API keys
- AI model configurations
- Rate limiting settings for AI endpoints
- AI feature flags

### `.env.production.template` (Production Template)
**Purpose**: Template for production deployments with all production variables
**Contains**: Comprehensive list of production environment variables with placeholders

### `.env.aws.local` (AWS Local Development)
**Purpose**: AWS-specific configuration for local development
**Contains**:
- AWS credentials
- S3 bucket names
- CloudWatch configuration
- Lambda function ARNs

## Platform-Specific Example Files

These files provide templates for specific integrations:

### `.env.ga.example` (Google Analytics)
**Purpose**: Template for Google Analytics integration
**Contains**: GA tracking ID and configuration

### `.env.reddit.example` (Reddit Integration)
**Purpose**: Template for Reddit API integration
**Contains**: Reddit API credentials and configuration

### `.env.ngrok.example` (Ngrok Tunneling)
**Purpose**: Template for ngrok local tunneling
**Contains**: Ngrok configuration for webhook testing

### `.env.sandbox.example` (Sandbox Environment)
**Purpose**: Template for sandbox/staging environment
**Contains**: Sandbox-specific API endpoints and credentials

### `.env.huntaze` (Legacy Configuration)
**Purpose**: Legacy configuration file
**Status**: Consider archiving - appears to be superseded by other configs

## Archived/Migration Files

### `.env.migration` & `.env.migration.example`
**Purpose**: Configuration used during database migration
**Status**: Migration complete - can be archived
**Location**: Should be moved to `config/archive/`

### `.env.bak` (Backup)
**Purpose**: Backup of previous .env configuration
**Status**: Can be deleted after verifying `.env.local` is current

## Amplify-Specific Files

### `.env.amplify.template.json`
**Purpose**: JSON template for AWS Amplify environment variables
**Status**: Active - Used for Amplify deployments
**Format**: JSON format required by AWS Amplify

## Environment Variable Categories

### Required Variables (Must be set)
- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_SECRET` - Authentication secret key
- `NEXTAUTH_URL` - Application URL
- `AWS_REGION` - AWS region for services

### Optional Variables (Feature-specific)
- `OPENAI_API_KEY` - For AI features
- `GOOGLE_ANALYTICS_ID` - For analytics tracking
- `REDIS_URL` - For caching (if using Redis)
- `SENTRY_DSN` - For error tracking

### Development-Only Variables
- `NEXT_PUBLIC_DEBUG` - Enable debug mode
- `SKIP_ENV_VALIDATION` - Skip environment validation
- `LOG_LEVEL` - Logging verbosity

## Best Practices

1. **Never commit sensitive files**: `.env.local`, `.env.production`, `.env.aws.local`
2. **Always use .env.example**: Keep it updated with new variables
3. **Group variables logically**: Database, AWS, Auth, Integrations, etc.
4. **Add comments**: Explain what each variable does
5. **Use safe defaults**: Example values should be safe to commit
6. **Validate on startup**: Application validates required variables on boot

## Quick Start

For new developers:

```bash
# 1. Copy the example file
cp .env.example .env.local

# 2. Fill in required values
# Edit .env.local with your database URL, API keys, etc.

# 3. Verify configuration
npm run dev
```

## Troubleshooting

### "Missing environment variable" error
- Check that the variable exists in your `.env.local`
- Verify the variable name matches exactly (case-sensitive)
- Restart your development server after adding variables

### "Invalid database URL" error
- Ensure PostgreSQL is running locally
- Verify the connection string format
- Check username, password, and database name

### AWS credentials not working
- Verify AWS credentials in `.env.aws.local`
- Check AWS region is set correctly
- Ensure IAM permissions are configured

## File Cleanup Status

✅ Consolidated `.env.example` with all variables
✅ Documented all environment files
✅ Archived migration files to `config/archive/`
✅ Removed `.env.bak` backup file
