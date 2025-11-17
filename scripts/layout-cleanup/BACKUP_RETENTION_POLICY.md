# Backup Retention Policy

## Overview

This document defines the backup retention policy for layout files deleted by the Layout Cleanup System. The policy ensures that deleted layouts can be recovered while managing disk space efficiently.

## Retention Period

**Default Retention: 30 Days**

All layout backups are retained for 30 days from the date of deletion. After 30 days, backups are automatically cleaned up during cleanup operations.

## Backup Location

```
.kiro/backups/layouts/
├── 2025-11-17/
│   ├── app-analytics-layout-1731844800000.tsx
│   ├── app-marketing-social-layout-1731844801000.tsx
│   └── ...
├── 2025-11-18/
│   └── ...
└── ...
```

Backups are organized by date (YYYY-MM-DD) and include:
- Original file path (with slashes replaced by hyphens)
- Timestamp of deletion (Unix milliseconds)
- Original file extension (.tsx)

## Backup Naming Convention

Format: `{original-path}-{timestamp}.tsx`

Example:
- Original: `app/analytics/layout.tsx`
- Backup: `app-analytics-layout-1731844800000.tsx`
- Location: `.kiro/backups/layouts/2025-11-17/`

## Automatic Cleanup

### When Cleanup Occurs

Automatic cleanup of old backups happens:
1. During `npm run layouts:cleanup` operations
2. Before creating new backups (to free space)
3. When backup directory exceeds size threshold

### Cleanup Process

```typescript
// Backups older than 30 days are deleted
const retentionDays = 30;
const cutoffDate = new Date();
cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

// Find and delete old backups
find .kiro/backups/layouts/ -type f -mtime +30 -delete

// Clean empty directories
find .kiro/backups/layouts/ -type d -empty -delete
```

### Manual Cleanup

To manually clean old backups:

```bash
# Delete backups older than 30 days
find .kiro/backups/layouts/ -type f -mtime +30 -delete

# Delete backups older than 7 days (custom retention)
find .kiro/backups/layouts/ -type f -mtime +7 -delete

# Delete all backups (not recommended)
rm -rf .kiro/backups/layouts/*

# Clean empty directories
find .kiro/backups/layouts/ -type d -empty -delete
```

## Storage Limits

### Size Thresholds

- **Warning Threshold:** 50 MB
- **Critical Threshold:** 100 MB
- **Maximum Allowed:** 200 MB

When the backup directory exceeds thresholds:
- **50 MB:** Warning logged, recommend cleanup
- **100 MB:** Automatic cleanup of oldest backups
- **200 MB:** Cleanup operations blocked until space freed

### Monitoring

Check backup directory size:

```bash
# Check total size
du -sh .kiro/backups/layouts/

# Check size by date
du -sh .kiro/backups/layouts/*/

# Count backup files
find .kiro/backups/layouts/ -type f -name "*.tsx" | wc -l
```

Monitor via dashboard:

```bash
npm run layouts:stats
```

## Backup Verification

### Verify Backup Integrity

```bash
# List all backups
find .kiro/backups/layouts/ -type f -name "*.tsx"

# Check backup file content
cat .kiro/backups/layouts/2025-11-17/app-analytics-layout-1731844800000.tsx

# Verify backup is valid TypeScript
npx tsc --noEmit .kiro/backups/layouts/2025-11-17/app-analytics-layout-1731844800000.tsx
```

### Backup Metadata

Each backup operation is logged with:
- Source file path
- Backup file path
- Timestamp
- File size
- Reason for backup (cleanup, manual, etc.)

Logs are stored in `.kiro/build-logs/` and can be queried:

```bash
# Find backup operations
grep "backup" .kiro/build-logs/latest.log

# Find specific file backup
grep "app/analytics/layout.tsx" .kiro/build-logs/*.log
```

## Restoration Process

### Restore Single File

```bash
# Find the backup
ls -la .kiro/backups/layouts/2025-11-17/

# Copy backup to original location
cp .kiro/backups/layouts/2025-11-17/app-analytics-layout-1731844800000.tsx \
   app/analytics/layout.tsx

# Verify build works
npm run build:validate
```

### Restore Multiple Files

```bash
# List all backups from a specific date
ls -la .kiro/backups/layouts/2025-11-17/

# Restore all backups from that date
for backup in .kiro/backups/layouts/2025-11-17/*.tsx; do
  # Extract original path from filename
  filename=$(basename "$backup")
  # Remove timestamp and convert back to path
  original=$(echo "$filename" | sed 's/-[0-9]\{13\}\.tsx$//' | tr '-' '/')
  original="${original}.tsx"
  
  # Restore file
  cp "$backup" "$original"
  echo "Restored: $original"
done

# Verify build
npm run build:validate
```

### Restore from Git (if backups unavailable)

```bash
# Find when file was deleted
git log --all --full-history -- "app/analytics/layout.tsx"

# Restore from specific commit
git checkout <commit-hash> -- app/analytics/layout.tsx

# Or restore from previous commit
git checkout HEAD~1 -- app/analytics/layout.tsx
```

## Backup Exclusions

The following are **NOT** backed up:
- Root layout (`app/layout.tsx`) - never deleted
- Layouts with metadata exports - never deleted
- Layouts marked as "necessary" - not deleted
- Layouts marked as "review" - not deleted automatically

Only layouts categorized as "redundant" are deleted and backed up.

## Compliance and Audit

### Audit Trail

All backup operations are logged with:
- Timestamp
- User/process that initiated backup
- Source file path
- Backup file path
- Success/failure status

Audit logs are stored in `.kiro/build-logs/` with JSON format for easy parsing.

### Compliance Requirements

- **Data Retention:** 30 days minimum
- **Audit Logging:** All operations logged
- **Access Control:** Backups stored in gitignored directory
- **Integrity:** Backups verified during creation
- **Recovery:** Documented restoration procedures

### Audit Queries

```bash
# Count backups created in last 7 days
find .kiro/backups/layouts/ -type f -mtime -7 | wc -l

# List backups by size
find .kiro/backups/layouts/ -type f -exec ls -lh {} \; | sort -k5 -h

# Find largest backups
find .kiro/backups/layouts/ -type f -exec du -h {} \; | sort -rh | head -10

# Check backup age distribution
find .kiro/backups/layouts/ -type f -printf '%TY-%Tm-%Td\n' | sort | uniq -c
```

## Disaster Recovery

### Backup Failure Scenarios

#### Scenario 1: Backup Directory Deleted

```bash
# Recreate directory structure
mkdir -p .kiro/backups/layouts

# Restore from Git if available
git checkout HEAD -- .kiro/backups/layouts/

# Or restore layouts from Git history
git log --all --full-history -- "app/**/layout.tsx"
```

#### Scenario 2: Disk Space Full

```bash
# Free space by cleaning old backups
find .kiro/backups/layouts/ -type f -mtime +7 -delete

# Or move backups to external storage
tar -czf layout-backups-$(date +%Y%m%d).tar.gz .kiro/backups/layouts/
mv layout-backups-*.tar.gz /external/storage/

# Clean local backups
rm -rf .kiro/backups/layouts/*
```

#### Scenario 3: Corrupted Backups

```bash
# Verify all backups
for backup in .kiro/backups/layouts/**/*.tsx; do
  if ! npx tsc --noEmit "$backup" 2>/dev/null; then
    echo "Corrupted: $backup"
  fi
done

# Remove corrupted backups
find .kiro/backups/layouts/ -type f -name "*.tsx" -exec sh -c \
  'npx tsc --noEmit "$1" 2>/dev/null || rm "$1"' _ {} \;
```

## Best Practices

1. **Regular Monitoring:** Check backup size weekly
2. **Periodic Cleanup:** Run manual cleanup monthly
3. **Verify Backups:** Test restoration quarterly
4. **Document Changes:** Log any manual interventions
5. **External Backup:** Archive old backups to external storage
6. **Git Integration:** Ensure Git tracks layout deletions
7. **Test Restoration:** Practice restoration procedures
8. **Monitor Alerts:** Set up alerts for size thresholds

## Configuration

### Customize Retention Period

Edit `scripts/layout-cleanup/utils/file-operations.ts`:

```typescript
// Change retention period (default: 30 days)
const RETENTION_DAYS = 30; // Modify this value

// Or set via environment variable
const retentionDays = process.env.BACKUP_RETENTION_DAYS || 30;
```

### Customize Size Limits

Edit `scripts/layout-cleanup/monitor-health.ts`:

```typescript
// Modify size thresholds
const WARNING_SIZE_MB = 50;
const CRITICAL_SIZE_MB = 100;
const MAX_SIZE_MB = 200;
```

## Support

For issues with backups:
1. Check backup directory exists: `ls -la .kiro/backups/layouts/`
2. Verify permissions: `ls -la .kiro/backups/`
3. Check disk space: `df -h`
4. Review logs: `cat .kiro/build-logs/latest.log`
5. Run health check: `npm run layouts:health`

## Revision History

- **2025-11-17:** Initial policy created
- Retention period: 30 days
- Size limits: 50MB warning, 100MB critical, 200MB max
- Automatic cleanup enabled
