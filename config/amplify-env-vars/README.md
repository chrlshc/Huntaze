# AWS Amplify Environment Variables Configuration Templates

This directory contains configuration templates and validation schemas for managing AWS Amplify environment variables across different environments.

## Available Templates

### 1. Environment-Specific Templates

#### `production-template.yaml`
Complete production configuration with:
- Secure database settings with SSL
- Production-grade security configurations
- Optimized performance settings
- Full monitoring and analytics enabled
- Strict CORS and rate limiting

#### `staging-template.yaml`
Staging environment configuration with:
- Production-like settings for testing
- Relaxed rate limits for testing
- Debug logging enabled
- Staging-specific service endpoints

#### `development-template.yaml`
Development environment configuration with:
- Local/development database settings
- Relaxed security for development
- Debug logging and verbose output
- Mock external services support

#### `local-template.yaml`
Local development configuration with:
- Local database and services
- Minimal external dependencies
- Mock APIs enabled
- Hot reload and development features

#### `minimal-template.yaml`
Minimal configuration with only essential variables:
- Core database and authentication
- Basic AI configuration
- Minimal feature flags
- Perfect for quick setup or testing

#### `documented-template.yaml`
Comprehensive template with detailed documentation:
- Extensive comments for each variable
- Usage examples and recommendations
- Security best practices
- Deployment notes

### 2. Configuration Formats

#### `template.json`
JSON format template with:
- Multi-environment configuration
- Metadata and versioning
- Validation rules embedded
- Documentation links

#### `example-config.yaml`
Example configuration file showing:
- Multi-environment setup
- Validation rules
- Override patterns
- Best practices

### 3. Validation Schemas

#### `validation-schema.json`
Basic JSON Schema validation with:
- Format validation for all variables
- Required field definitions
- Pattern matching for sensitive data

#### `advanced-validation-schema.json`
Advanced validation with:
- Environment-specific rules
- Conditional validation
- Security constraints
- Performance recommendations

## Usage

### 1. Choose Your Template

Select the appropriate template based on your environment:

```bash
# For production deployment
cp production-template.yaml my-production-config.yaml

# For staging environment
cp staging-template.yaml my-staging-config.yaml

# For local development
cp local-template.yaml my-local-config.yaml
```

### 2. Customize Configuration

Edit the copied template and replace placeholder values:

```yaml
# Replace placeholder values
DATABASE_URL: "postgresql://your-user:your-pass@your-host:5432/your-db"
JWT_SECRET: "your-actual-jwt-secret-32-chars-minimum"
AZURE_OPENAI_API_KEY: "your-actual-azure-openai-key"
```

### 3. Validate Configuration

Use the validation schemas to check your configuration:

```bash
# Basic validation
node scripts/amplify-env-vars/validate-env-vars.js my-config.yaml

# Advanced validation with environment-specific rules
node scripts/amplify-env-vars/validate-env-vars.js my-config.yaml --schema advanced
```

### 4. Apply Configuration

Deploy your configuration to AWS Amplify:

```bash
# Apply to specific environment
node scripts/amplify-env-vars/amplify-env-vars.js apply my-config.yaml --env production

# Preview changes before applying
node scripts/amplify-env-vars/amplify-env-vars.js apply my-config.yaml --env production --dry-run
```

## Configuration Variables Reference

### Essential Variables (Required)

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `JWT_SECRET` | JWT signing secret (32+ chars) | `your-secure-jwt-secret-32-chars-min` |
| `NEXTAUTH_SECRET` | NextAuth session secret | `your-nextauth-secret` |
| `NEXTAUTH_URL` | Application canonical URL | `https://your-domain.com` |
| `NODE_ENV` | Environment type | `production`, `development` |
| `APP_URL` | Main application URL | `https://your-domain.com` |

### AI Services

| Variable | Description | Required |
|----------|-------------|----------|
| `AZURE_OPENAI_API_KEY` | Azure OpenAI API key | Yes (if AI enabled) |
| `AZURE_OPENAI_ENDPOINT` | Azure OpenAI endpoint | Yes (if AI enabled) |
| `AZURE_OPENAI_API_VERSION` | API version | Yes (if AI enabled) |
| `OPENAI_API_KEY` | OpenAI direct API key | Optional |

### Social Media Integrations

| Variable | Description | Required |
|----------|-------------|----------|
| `TIKTOK_CLIENT_ID` | TikTok app client ID | If TikTok enabled |
| `TIKTOK_CLIENT_SECRET` | TikTok app secret | If TikTok enabled |
| `INSTAGRAM_CLIENT_ID` | Instagram app client ID | If Instagram enabled |
| `INSTAGRAM_CLIENT_SECRET` | Instagram app secret | If Instagram enabled |
| `REDDIT_CLIENT_ID` | Reddit app client ID | If Reddit enabled |
| `REDDIT_CLIENT_SECRET` | Reddit app secret | If Reddit enabled |

### Email Configuration

| Variable | Description | Example |
|----------|-------------|---------|
| `SMTP_HOST` | SMTP server hostname | `email-smtp.us-east-1.amazonaws.com` |
| `SMTP_PORT` | SMTP server port | `587` |
| `SMTP_USER` | SMTP username | `your-ses-username` |
| `SMTP_PASS` | SMTP password | `your-ses-password` |
| `FROM_EMAIL` | Default sender email | `noreply@your-domain.com` |

## Security Best Practices

### 1. Secret Management
- Use different secrets for each environment
- Generate secrets with sufficient entropy
- Rotate secrets regularly
- Never commit secrets to version control

### 2. Environment Separation
- Use separate databases for each environment
- Use different API keys for each environment
- Implement proper access controls
- Monitor configuration changes

### 3. Validation
- Always validate configuration before deployment
- Use schema validation to catch errors early
- Test connectivity to external services
- Verify security settings

## Troubleshooting

### Common Issues

#### Invalid Database URL
```
Error: Invalid DATABASE_URL format
Solution: Ensure format is postgresql://user:pass@host:port/database
```

#### JWT Secret Too Short
```
Error: JWT_SECRET must be at least 32 characters
Solution: Generate a longer secret: openssl rand -base64 32
```

#### Azure OpenAI Connection Failed
```
Error: Cannot connect to Azure OpenAI endpoint
Solution: Verify API key, endpoint URL, and API version
```

### Validation Errors

Run validation to identify configuration issues:

```bash
# Check for missing required variables
node scripts/amplify-env-vars/validate-env-vars.js config.yaml --check-required

# Test external service connectivity
node scripts/amplify-env-vars/validate-env-vars.js config.yaml --test-connectivity

# Generate validation report
node scripts/amplify-env-vars/validate-env-vars.js config.yaml --report
```

## Advanced Usage

### Environment Comparison
```bash
# Compare configurations between environments
node scripts/amplify-env-vars/compare-environments.js staging production
```

### Configuration Migration
```bash
# Migrate configuration from one format to another
node scripts/amplify-env-vars/migrate-config.js old-config.json new-config.yaml
```

### Backup and Restore
```bash
# Backup current environment variables
node scripts/amplify-env-vars/backup-restore.js backup --env production

# Restore from backup
node scripts/amplify-env-vars/backup-restore.js restore backup-file.json --env staging
```

## Support

For additional help:
- Check the main documentation: `docs/DEPLOYMENT_GUIDE.md`
- Review troubleshooting guide: `docs/TROUBLESHOOTING.md`
- See security guidelines: `docs/SECURITY.md`
- Contact DevOps team for environment-specific issues