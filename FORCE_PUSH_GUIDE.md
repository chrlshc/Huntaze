# 🚀 Force Push Guide - Credential Removal

## ✅ What's Been Done

1. ✅ Removed `.env.test` from all git history
2. ✅ Added `.env.test` to `.gitignore`
3. ✅ Created `.env.test.example` template
4. ✅ Cleaned and optimized git repository

## ⚠️ Before You Push

### CRITICAL: Rotate Your Credentials First!

The following credentials were in the git history and should be rotated:

**RDS Database:**
- Host: `huntaze-postgres-production.c2ryoow8c5m4.us-east-1.rds.amazonaws.com`
- User: `huntazeadmin`
- Password: `2EkPVMUktEWcyJSz4lipzUqLPxQazxSI` ⚠️ **ROTATE THIS**

**ElastiCache Redis:**
- Host: `huntaze-redis-production.asmyhp.0001.use1.cache.amazonaws.com`

### How to Rotate RDS Password

```bash
# Using AWS CLI
aws rds modify-db-instance \
  --db-instance-identifier huntaze-postgres-production \
  --master-user-password "NEW_SECURE_PASSWORD" \
  --apply-immediately

# Or use AWS Console:
# 1. Go to RDS → Databases
# 2. Select huntaze-postgres-production
# 3. Click "Modify"
# 4. Change master password
# 5. Apply immediately
```

## 🚀 Force Push Commands

Once credentials are rotated, push the cleaned history:

```bash
# Push current branch
git push origin production-ready --force-with-lease

# If that fails (someone else pushed), use:
git push origin production-ready --force

# Push all branches (if needed)
git push origin --all --force

# Push tags
git push origin --tags --force
```

## 👥 Team Notification

After force pushing, notify your team members to update their local repos:

```bash
# Team members should run:
git fetch origin
git reset --hard origin/production-ready  # or their branch
git clean -fd
```

## ✅ Verification

After pushing, verify on GitHub:

```bash
# Check that .env.test is not in history
git log --all --oneline | head -20

# Verify GitHub accepts the push
# GitHub Secret Scanning should no longer block
```

## 📝 What Changed

- `.gitignore` now includes `.env.test`
- `.env.test.example` created as safe template
- `.env.test` removed from all commits
- Git history rewritten (all commit SHAs changed)

## 🔐 Going Forward

1. Copy `.env.test.example` to `.env.test` locally
2. Fill in real credentials (they stay local only)
3. Never commit `.env.test` again (it's in `.gitignore`)
4. Use environment variables or AWS Secrets Manager for production
