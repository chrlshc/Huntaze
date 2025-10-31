# Huntaze Scripts

This directory contains scripts for database initialization, email testing, and BIMI configuration.

## Scripts Overview

### Email & BIMI Scripts

#### `test-email.js`
Send test emails to verify SES configuration and email templates.

**Usage:**
```bash
node scripts/test-email.js
```

#### `validate-bimi.js`
Validates that the BIMI logo meets all requirements (SVG Tiny-PS, size, format).

**Usage:**
```bash
node scripts/validate-bimi.js
```

#### `test-bimi-setup.js` ✅ Complete BIMI Test
Comprehensive test of all BIMI requirements:
- DMARC policy check
- BIMI DNS record validation
- SPF record verification
- Local SVG file validation
- SVG content compliance

**Usage:**
```bash
node scripts/test-bimi-setup.js
```

**Requirements:**
- DMARC policy must be `p=quarantine` or `p=reject`
- BIMI DNS record at `default._bimi.huntaze.com`
- Logo file at `public/bimi-logo.svg`

### SQL Files

#### `create-tables.sql`
Original SQL file with table creation and verification query combined.

#### `create-tables-only.sql` ✅ Recommended
Clean SQL file containing only table creation statements:
- Creates `users` table with indexes
- Creates `sessions` table with indexes and foreign keys
- Safe to run multiple times (uses `IF NOT EXISTS`)
- No verification queries mixed in

### Node.js Scripts

#### `init-db-safe.js` ✅ Recommended
Robust Node.js script for database initialization:
- Reads `create-tables-only.sql`
- Connects to RDS with SSL
- Executes SQL statements
- Verifies tables were created
- Provides detailed error messages
- 10-second connection timeout

**Usage:**
```bash
npm run db:init:safe
# or
node scripts/init-db-safe.js
```

**Requirements:**
- `DATABASE_URL` in `.env`
- `pg` package installed
- RDS instance must be running

#### `init-db.js`
Original initialization script (legacy).

### Bash Scripts

#### `init-db-with-wait.sh` ✅ For AWS Automation
Bash script that automatically waits for RDS availability:
- Checks RDS instance status via AWS CLI
- Waits up to 5 minutes for instance to be available
- Automatically runs `init-db-safe.js` when ready
- Perfect for CI/CD pipelines

**Usage:**
```bash
npm run db:init:wait
# or
./scripts/init-db-with-wait.sh
```

**Requirements:**
- AWS CLI installed and configured
- AWS credentials with RDS read permissions
- `DATABASE_URL` in `.env`

## Quick Start

### 1. First Time Setup

If your RDS instance is already running:
```bash
npm run db:init:safe
```

If your RDS instance might be stopped:
```bash
export AWS_ACCESS_KEY_ID="your-key"
export AWS_SECRET_ACCESS_KEY="your-secret"
export AWS_SESSION_TOKEN="your-token"  # if using temporary credentials
npm run db:init:wait
```

### 2. Verify Tables

```bash
PGPASSWORD="your-password" psql \
  -h huntaze-postgres-production.c2ryoow8c5m4.us-east-1.rds.amazonaws.com \
  -U huntazeadmin \
  -d huntaze \
  -c "\dt"
```

## Environment Variables

Required in `.env`:

```env
DATABASE_URL="postgresql://huntazeadmin:PASSWORD@huntaze-postgres-production.c2ryoow8c5m4.us-east-1.rds.amazonaws.com:5432/huntaze?schema=public"
```

Optional for AWS operations:
```env
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_SESSION_TOKEN=your-token  # for temporary credentials
```

## Tables Created

### Users Table
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  email_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes:**
- `users_pkey` - Primary key on id
- `idx_users_email` - Fast email lookups
- `users_email_key` - Unique constraint

### Sessions Table
```sql
CREATE TABLE sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(500) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes:**
- `sessions_pkey` - Primary key on id
- `idx_sessions_user_id` - Fast user session lookups
- `idx_sessions_token` - Fast token validation

**Foreign Keys:**
- `sessions_user_id_fkey` - References users(id) with CASCADE delete

## Troubleshooting

### Connection Timeout

**Problem:** `timeout expired` error

**Solutions:**
1. Check if RDS instance is running:
   ```bash
   aws rds describe-db-instances \
     --db-instance-identifier huntaze-postgres-production \
     --region us-east-1 \
     --query 'DBInstances[0].DBInstanceStatus'
   ```

2. Start RDS if stopped:
   ```bash
   aws rds start-db-instance \
     --db-instance-identifier huntaze-postgres-production \
     --region us-east-1
   ```

3. Use the wait script:
   ```bash
   npm run db:init:wait
   ```

### Tables Already Exist

**Problem:** Tables already exist in database

**Solution:** No problem! All scripts use `CREATE TABLE IF NOT EXISTS`, so they're safe to run multiple times.

### Permission Denied

**Problem:** Cannot execute bash script

**Solution:**
```bash
chmod +x scripts/init-db-with-wait.sh
```

### AWS CLI Not Found

**Problem:** `aws: command not found`

**Solution:** Install AWS CLI:
```bash
# macOS
brew install awscli

# Linux
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
```

### Invalid Credentials

**Problem:** AWS credentials expired or invalid

**Solution:** Get fresh credentials from AWS SSO or IAM:
```bash
aws sso login
# or
export AWS_ACCESS_KEY_ID="new-key"
export AWS_SECRET_ACCESS_KEY="new-secret"
export AWS_SESSION_TOKEN="new-token"
```

## CI/CD Integration

### AWS Amplify

Add to `amplify.yml`:
```yaml
version: 1
backend:
  phases:
    build:
      commands:
        - npm ci
        - npm run db:init:safe || echo "DB already initialized"
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: .next
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
```

### GitHub Actions

```yaml
- name: Initialize Database
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
    AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
    AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
  run: npm run db:init:wait
```

## Best Practices

1. ✅ Always use `init-db-safe.js` for manual initialization
2. ✅ Use `init-db-with-wait.sh` for automated deployments
3. ✅ Keep `DATABASE_URL` in `.env`, never commit it
4. ✅ Use AWS IAM roles in production, not hardcoded credentials
5. ✅ Run initialization scripts during deployment, not at runtime
6. ✅ Monitor RDS instance status before running scripts
7. ✅ Use connection pooling in production applications

## Related Documentation

- `../docs/DB_INIT_PRODUCTION.md` - Production deployment guide
- `../docs/DB_SETUP_COMPLETE.md` - Detailed setup documentation
- `../SETUP_SUCCESS.md` - Quick reference guide

---

**Last Updated:** October 31, 2025  
**Status:** ✅ Production Ready
