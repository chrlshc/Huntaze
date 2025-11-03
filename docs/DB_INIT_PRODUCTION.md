# Database Initialization for Production

## Problem

The database is not accessible from local development environment due to AWS security groups or VPC configuration.

## Solution Options

### Option 1: Run from AWS Amplify Build (Recommended)

Add this to your `amplify.yml` build configuration:

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

### Option 2: Run from AWS CloudShell

1. Open AWS CloudShell in the AWS Console
2. Clone your repository or upload the SQL file
3. Install PostgreSQL client:
```bash
sudo yum install postgresql -y
```

4. Run the SQL directly:
```bash
psql "postgresql://huntazeadmin:PASSWORD@huntaze-postgres-production.c2ryoow8c5m4.us-east-1.rds.amazonaws.com:5432/huntaze" -f scripts/create-tables.sql
```

### Option 3: Use AWS RDS Query Editor

1. Go to AWS RDS Console
2. Select your database `huntaze-postgres-production`
3. Click "Query Editor"
4. Connect with your credentials
5. Copy and paste the contents of `scripts/create-tables.sql`
6. Execute

### Option 4: Update Security Group

If you want to run from local:

1. Go to AWS RDS Console
2. Select your database
3. Click on the VPC security group
4. Add an inbound rule:
   - Type: PostgreSQL
   - Port: 5432
   - Source: Your IP address
5. Try running `npm run db:init:safe` again

## SQL to Execute

The SQL file is located at: `scripts/create-tables.sql`

It creates:
- `users` table with email, name, password_hash
- `sessions` table for JWT tokens
- Indexes for performance

## Verification

After running, verify tables exist:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('users', 'sessions');
```

Should return:
```
 table_name 
------------
 sessions
 users
```

## Environment Variables Needed

Make sure these are set in Amplify Environment Variables:

```
DATABASE_URL=postgresql://huntazeadmin:PASSWORD@huntaze-postgres-production.c2ryoow8c5m4.us-east-1.rds.amazonaws.com:5432/huntaze
JWT_SECRET=your-super-secret-jwt-key-change-this
```

## Next Steps

Once tables are created:
1. Deploy your application
2. Test registration at `/auth/register`
3. Test login at `/auth/login`
4. Verify user is created in database
