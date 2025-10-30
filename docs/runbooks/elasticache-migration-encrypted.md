# ElastiCache Migration - Encryption at Rest + Transit (TLS)

## Overview

Migration du cluster Redis `huntaze-redis-production` vers un cluster chiffré avec:
- **Encryption at rest** (KMS)
- **Encryption in transit** (TLS 1.2+)
- **AUTH token** pour authentification
- **Zero downtime** via snapshot/restore

## Current State

```
Cluster ID: huntaze-redis-production
Engine: Redis 7.1.0
Node Type: cache.t3.micro
At-Rest Encryption: ❌ false
Transit Encryption: ❌ false
AUTH Enabled: ❌ false
Endpoint: huntaze-redis-production.asmyhp.0001.use1.cache.amazonaws.com
```

## Target State

```
Replication Group ID: huntaze-redis-encrypted
Engine: Redis 7.1.0
Node Type: cache.t3.micro (upgradable to r6g.large)
At-Rest Encryption: ✅ true (KMS)
Transit Encryption: ✅ true (TLS 1.2+, required mode)
AUTH Enabled: ✅ true
Multi-AZ: ✅ true (1 primary + 1 replica)
Automatic Failover: ✅ enabled
```

## Migration Strategy

### Why Replication Group?

Le cluster actuel est **standalone**. Pour activer l'encryption at-rest, nous devons:
1. Créer un **replication group** (permet encryption + high availability)
2. Restaurer depuis snapshot avec encryption activée
3. Basculer l'application via DNS/CNAME

### Timeline

- **Preparation:** 15 minutes
- **Snapshot:** 5 minutes
- **Restore:** 10-15 minutes
- **Application switch:** 5 minutes (zero downtime)
- **Validation:** 30 minutes
- **Cleanup:** 5 minutes

**Total:** ~1 hour

---

## Step-by-Step Migration

### Phase 1: Preparation (15 min)

#### 1.1 Generate AUTH Token

```bash
# Generate secure 32-character token
AUTH_TOKEN=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)
echo "AUTH_TOKEN=$AUTH_TOKEN"

# Store in AWS Secrets Manager
aws secretsmanager create-secret \
  --name huntaze/redis/auth-token \
  --description "Redis AUTH token for encrypted cluster" \
  --secret-string "$AUTH_TOKEN" \
  --region us-east-1
```

#### 1.2 Get KMS Key (or create one)

```bash
# List existing KMS keys
aws kms list-aliases --region us-east-1 | grep -i redis

# Or create a new one
aws kms create-key \
  --description "Huntaze Redis encryption key" \
  --region us-east-1 \
  --query 'KeyMetadata.KeyId' \
  --output text

# Create alias
KMS_KEY_ID="<key-id-from-above>"
aws kms create-alias \
  --alias-name alias/huntaze-redis \
  --target-key-id "$KMS_KEY_ID" \
  --region us-east-1
```

#### 1.3 Verify Current Cluster

```bash
aws elasticache describe-cache-clusters \
  --cache-cluster-id huntaze-redis-production \
  --region us-east-1 \
  --query 'CacheClusters[0].{Status:CacheClusterStatus,Engine:Engine,Version:EngineVersion}'
```

### Phase 2: Create Snapshot (5 min)

```bash
SNAP_ID="huntaze-redis-pre-encryption-$(date +%Y%m%d-%H%M)"

aws elasticache create-snapshot \
  --cache-cluster-id huntaze-redis-production \
  --snapshot-name "$SNAP_ID" \
  --region us-east-1

# Wait for snapshot to complete
aws elasticache wait snapshot-available \
  --snapshot-name "$SNAP_ID" \
  --region us-east-1

echo "Snapshot $SNAP_ID created successfully"
```

### Phase 3: Create Encrypted Replication Group (10-15 min)

```bash
NEW_RG_ID="huntaze-redis-encrypted"
KMS_KEY_ARN="arn:aws:kms:us-east-1:317805897534:key/$KMS_KEY_ID"

aws elasticache create-replication-group \
  --replication-group-id "$NEW_RG_ID" \
  --replication-group-description "Huntaze Redis with encryption" \
  --engine redis \
  --cache-node-type cache.t3.micro \
  --num-cache-clusters 2 \
  --snapshot-name "$SNAP_ID" \
  --at-rest-encryption-enabled \
  --kms-key-id "$KMS_KEY_ARN" \
  --transit-encryption-enabled \
  --transit-encryption-mode required \
  --auth-token "$AUTH_TOKEN" \
  --automatic-failover-enabled \
  --multi-az-enabled \
  --cache-subnet-group-name huntaze-cache-subnet-production \
  --security-group-ids <your-security-group-id> \
  --preferred-maintenance-window sun:03:00-sun:04:00 \
  --snapshot-retention-limit 7 \
  --snapshot-window 01:00-02:00 \
  --region us-east-1

# Wait for replication group to be available
aws elasticache wait replication-group-available \
  --replication-group-id "$NEW_RG_ID" \
  --region us-east-1

echo "Encrypted replication group created successfully"
```

### Phase 4: Get New Endpoints (2 min)

```bash
# Get primary and reader endpoints
aws elasticache describe-replication-groups \
  --replication-group-id "$NEW_RG_ID" \
  --region us-east-1 \
  --query 'ReplicationGroups[0].{Primary:NodeGroups[0].PrimaryEndpoint.Address,Reader:NodeGroups[0].ReaderEndpoint.Address,Port:NodeGroups[0].PrimaryEndpoint.Port}'

# Example output:
# {
#   "Primary": "huntaze-redis-encrypted.asmyhp.ng.0001.use1.cache.amazonaws.com",
#   "Reader": "huntaze-redis-encrypted-ro.asmyhp.ng.0001.use1.cache.amazonaws.com",
#   "Port": 6379
# }
```

### Phase 5: Update Application (5 min - Zero Downtime)

#### Option A: Direct Endpoint Update (ECS Task Definition)

Update environment variables in ECS task definitions:

```json
{
  "name": "REDIS_HOST",
  "value": "huntaze-redis-encrypted.asmyhp.ng.0001.use1.cache.amazonaws.com"
},
{
  "name": "REDIS_PORT",
  "value": "6379"
},
{
  "name": "REDIS_TLS_ENABLED",
  "value": "true"
},
{
  "name": "REDIS_AUTH_TOKEN",
  "valueFrom": "arn:aws:secretsmanager:us-east-1:317805897534:secret:huntaze/redis/auth-token"
}
```

#### Option B: Route 53 CNAME (Recommended)

```bash
# Create/update CNAME record
aws route53 change-resource-record-sets \
  --hosted-zone-id <your-zone-id> \
  --change-batch '{
    "Changes": [{
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "redis.huntaze.internal",
        "Type": "CNAME",
        "TTL": 60,
        "ResourceRecords": [{
          "Value": "huntaze-redis-encrypted.asmyhp.ng.0001.use1.cache.amazonaws.com"
        }]
      }
    }]
  }'
```

#### Update Application Code

**Before (no encryption):**
```typescript
import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: 6379
});
```

**After (with encryption):**
```typescript
import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: 6379,
  password: process.env.REDIS_AUTH_TOKEN,
  tls: {
    servername: process.env.REDIS_HOST  // SNI for TLS
  }
});
```

#### Deploy Updated Services

```bash
# Update ECS services with new task definition
aws ecs update-service \
  --cluster huntaze-cluster \
  --service <service-name> \
  --task-definition <new-task-def-with-redis-tls> \
  --force-new-deployment \
  --region us-east-1
```

### Phase 6: Validation (30 min)

#### 6.1 Test Connection

```bash
# Install redis-cli with TLS support
# On macOS: brew install redis

# Test connection
redis-cli -h huntaze-redis-encrypted.asmyhp.ng.0001.use1.cache.amazonaws.com \
  -p 6379 \
  --tls \
  -a "$AUTH_TOKEN" \
  PING

# Expected: PONG
```

#### 6.2 Verify Encryption

```bash
aws elasticache describe-replication-groups \
  --replication-group-id "$NEW_RG_ID" \
  --region us-east-1 \
  --query 'ReplicationGroups[0].{AtRest:AtRestEncryptionEnabled,Transit:TransitEncryptionEnabled,TransitMode:TransitEncryptionMode,Auth:AuthTokenEnabled}'

# Expected:
# {
#   "AtRest": true,
#   "Transit": true,
#   "TransitMode": "required",
#   "Auth": true
# }
```

#### 6.3 Monitor Application

```bash
# Check ECS service health
aws ecs describe-services \
  --cluster huntaze-cluster \
  --services <service-name> \
  --region us-east-1 \
  --query 'services[0].{Running:runningCount,Desired:desiredCount,Status:status}'

# Check CloudWatch metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/ElastiCache \
  --metric-name CacheHits \
  --dimensions Name=CacheClusterId,Value=huntaze-redis-encrypted-001 \
  --start-time $(date -u -d '10 minutes ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Sum \
  --region us-east-1
```

#### 6.4 Test Application Functionality

```bash
# Test rate limiter (uses Redis)
curl -X POST https://api.huntaze.com/api/v2/onlyfans/messages \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"userId":"test","fanId":"test","message":"test"}'

# Check logs for Redis errors
aws logs tail /ecs/huntaze-cluster --follow --since 10m | grep -i redis
```

### Phase 7: Cleanup (5 min)

**Wait 24-48 hours** to ensure stability, then:

```bash
# Delete old cluster
aws elasticache delete-cache-cluster \
  --cache-cluster-id huntaze-redis-production \
  --region us-east-1

# Delete old snapshots (keep recent ones)
aws elasticache describe-snapshots \
  --region us-east-1 \
  --query 'Snapshots[?starts_with(SnapshotName, `huntaze-redis-production`)].SnapshotName' \
  --output text | while read snap; do
    echo "Deleting snapshot: $snap"
    aws elasticache delete-snapshot --snapshot-name "$snap" --region us-east-1
  done
```

---

## Rollback Procedure

If issues occur during migration:

### Immediate Rollback (< 5 min)

```bash
# Revert ECS services to old task definition
aws ecs update-service \
  --cluster huntaze-cluster \
  --service <service-name> \
  --task-definition <old-task-def-without-tls> \
  --force-new-deployment \
  --region us-east-1

# Or revert Route 53 CNAME
aws route53 change-resource-record-sets \
  --hosted-zone-id <your-zone-id> \
  --change-batch '{
    "Changes": [{
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "redis.huntaze.internal",
        "Type": "CNAME",
        "TTL": 60,
        "ResourceRecords": [{
          "Value": "huntaze-redis-production.asmyhp.0001.use1.cache.amazonaws.com"
        }]
      }
    }]
  }'
```

### Full Rollback (if new cluster has issues)

```bash
# Delete new replication group
aws elasticache delete-replication-group \
  --replication-group-id "$NEW_RG_ID" \
  --region us-east-1

# Old cluster remains untouched and operational
```

---

## Cost Impact

### Before
- 1x cache.t3.micro: ~$12/month
- No encryption overhead

### After
- 2x cache.t3.micro (primary + replica): ~$24/month
- KMS: $1/month (20,000 requests free tier)
- Snapshots: ~$0.50/month (7 days retention)

**Total increase:** ~$13.50/month (+112%)

**Benefits:**
- Encryption at rest + transit
- High availability (Multi-AZ)
- Automatic failover
- Better security compliance

---

## Troubleshooting

### Connection Refused

```bash
# Check security group allows port 6379 from application
aws ec2 describe-security-groups \
  --group-ids <sg-id> \
  --region us-east-1 \
  --query 'SecurityGroups[0].IpPermissions'
```

### AUTH Failed

```bash
# Verify AUTH token in Secrets Manager
aws secretsmanager get-secret-value \
  --secret-id huntaze/redis/auth-token \
  --region us-east-1 \
  --query 'SecretString' \
  --output text
```

### TLS Handshake Failed

```bash
# Verify TLS is enabled on client
# Check ioredis config has tls: { servername: host }
```

### Performance Issues

```bash
# Check CPU utilization
aws cloudwatch get-metric-statistics \
  --namespace AWS/ElastiCache \
  --metric-name CPUUtilization \
  --dimensions Name=CacheClusterId,Value=huntaze-redis-encrypted-001 \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average \
  --region us-east-1

# Consider upgrading to r6g.large if CPU > 70%
```

---

## Success Criteria

- [ ] New replication group created with encryption
- [ ] AUTH token stored in Secrets Manager
- [ ] Application updated with TLS + AUTH
- [ ] All ECS services running and healthy
- [ ] Redis connection tests passing
- [ ] Rate limiter functionality working
- [ ] No errors in application logs
- [ ] CloudWatch metrics showing normal activity
- [ ] 24h stability period completed
- [ ] Old cluster deleted

---

## References

- [ElastiCache Encryption at Rest](https://docs.aws.amazon.com/AmazonElastiCache/latest/red-ug/at-rest-encryption.html)
- [ElastiCache Encryption in Transit](https://docs.aws.amazon.com/AmazonElastiCache/latest/red-ug/in-transit-encryption.html)
- [Redis AUTH](https://docs.aws.amazon.com/AmazonElastiCache/latest/red-ug/auth.html)
- [ioredis TLS Configuration](https://github.com/redis/ioredis#tls-options)

---

**Status:** Ready to execute  
**Estimated Downtime:** 0 minutes (zero downtime migration)  
**Risk Level:** Low (old cluster remains operational during migration)
