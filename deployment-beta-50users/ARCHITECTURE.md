# 🏗️ Architecture Technique - 50 Users Beta

**Budget Total**: $149-176/mois  
**Budget Disponible**: $1,300/mois ($300 AWS + $1,000 Azure AI)  
**Cible**: 50 utilisateurs actifs

---

## 📊 Stack Technique

### Frontend
```
Vercel Hobby ($20/mois)
├── Next.js 16 (App Router)
├── React 18 Server Components
├── Edge Functions (CDN 300+ locations)
├── Serverless Functions (Node.js 20)
└── Auto-scaling (0 → ∞)
```

### Backend API
```
Next.js API Routes (Vercel)
├── /api/ai/* - AI suggestions
├── /api/onlyfans/* - OnlyFans integration
├── /api/content/* - Content management
├── /api/analytics/* - Analytics
└── /api/workers/* - Background jobs
```

### Database
```
RDS PostgreSQL 16.1 (db.t4g.small)
├── 2 vCPU ARM Graviton
├── 2 GB RAM
├── 50 GB SSD gp3
├── Single-AZ (beta)
├── Backup 7 jours
└── Publicly accessible (pas de NAT Gateway)

Tables principales:
├── users (50 users)
├── content (messages, posts)
├── subscriptions
├── transactions
├── ai_insights
└── usage_logs
```

### Cache
```
ElastiCache Redis 7.1 (cache.t4g.small)
├── 2 vCPU ARM Graviton
├── 1.37 GB RAM
├── Single-node (beta)
└── Pas de replication

Usage:
├── Session cache (50 users)
├── AI responses cache (hit rate 80%)
├── Rate limiting
└── Real-time data
```

### Storage
```
S3 Standard (150 GB)
├── Videos: 3,000 × 50MB = 150 GB
├── Images: négligeable
├── Backups: database snapshots
└── Logs: CloudWatch

Lifecycle:
├── temp/ → delete after 7 days
├── videos/ → Intelligent-Tiering after 30 days
└── backups/ → Glacier after 90 days
```

### AI Services
```
Azure AI Foundry (Serverless) - Budget $1,000/mois
├── DeepSeek-V3 (generation)
│   ├── 300K calls/mois
│   ├── $0.00114/1K tokens (avec cache 80%)
│   └── ~$34/mois
│
├── Phi-4 Multimodal (vision)
│   ├── 3,000 videos/mois
│   ├── $0.40/1M tokens
│   └── ~$2.40/mois
│
└── DeepSeek-R1 (reasoning)
    ├── Reasoning tasks
    └── ~$10/mois

Total utilisé: ~$46/mois
Marge disponible: $954/mois pour scaling
```

### Workers
```
Upstash QStash ($5-10/mois)
├── Video Processing
│   ├── 3,000 videos/mois
│   ├── Keyframe extraction
│   ├── Composite grid generation
│   └── Azure Phi-4 analysis
│
├── Content Trends
│   ├── Scraping (Apify)
│   ├── Trend detection
│   └── Recommendations
│
└── Data Processing
    ├── Analytics aggregation
    ├── User stats
    └── Reports
```

### Cron Jobs
```
Lambda Functions ($3-5/mois)
├── Expire Offers (daily)
├── Activate Offers (hourly)
├── Monthly Billing (monthly)
├── AI Insights (daily)
└── Event Dispatcher (every 5min)
```

---

## 🔄 Flux de Données

### 1. Message OnlyFans avec AI Suggestions
```
User → Vercel API
    ↓
Check Redis Cache
    ├─ HIT → Return cached suggestions (80%)
    └─ MISS → Call Azure AI
        ↓
    DeepSeek-V3 (generation)
        ↓
    Save to Redis (TTL 1h)
        ↓
    Save to PostgreSQL (usage_logs)
        ↓
    Return to User
```

**Latence**: 50ms (cache) / 500ms (AI call)

### 2. Upload Video + Processing
```
User → Upload Video
    ↓
Vercel API → S3 Upload
    ↓
Create ContentTask (PostgreSQL)
    ↓
Enqueue QStash (async)
    ↓
QStash → Vercel Worker
    ↓
Download from S3
    ↓
Extract Keyframes (FFmpeg)
    ↓
Analyze with Phi-4 Multimodal
    ↓
Save Analysis (PostgreSQL)
    ↓
Update ContentTask status
    ↓
Notify User (WebSocket)
```

**Durée**: 30-60 secondes par video

### 3. Analytics Dashboard
```
User → /analytics
    ↓
Check Redis Cache
    ├─ HIT → Return cached data (90%)
    └─ MISS → Query PostgreSQL
        ↓
    Aggregate data (SQL)
        ↓
    Save to Redis (TTL 5min)
        ↓
    Return to User
```

**Latence**: 20ms (cache) / 200ms (DB query)

---

## 🔒 Sécurité

### Authentication
```
NextAuth.js
├── Email/Password
├── Google OAuth
├── Session JWT (Redis)
└── CSRF Protection
```

### API Security
```
Rate Limiting (Redis)
├── 100 req/min per user
├── 1000 req/min per IP
└── Exponential backoff

API Keys
├── Stored in AWS Secrets Manager
├── Rotation automatique (90 jours)
└── Encryption at rest (KMS)
```

### Database Security
```
RDS PostgreSQL
├── Encryption at rest (AES-256)
├── SSL/TLS connections
├── Security Group (port 5432)
└── Publicly accessible (beta only)
```

### Storage Security
```
S3
├── Encryption at rest (SSE-S3)
├── CORS configured
├── Bucket policy (private)
└── Signed URLs (1h expiry)
```

---

## 📊 Monitoring

### CloudWatch Alarms
```
RDS
├── CPU > 80%
├── Memory > 90%
├── Connections > 80%
└── Storage > 80%

Redis
├── Memory > 90%
├── CPU > 80%
└── Evictions > 100/min

Lambda
├── Errors > 5
├── Duration > 10s
└── Throttles > 10
```

### Metrics
```
Application
├── API Response Time (p95, p99)
├── Error Rate (%)
├── Cache Hit Rate (%)
└── AI Call Count

Business
├── Active Users
├── Messages Sent
├── Videos Uploaded
└── Revenue
```

### Logs
```
CloudWatch Logs
├── /aws/lambda/huntaze-ai-router
├── /aws/rds/huntaze-beta-db
└── /aws/elasticache/huntaze-beta-redis

Vercel Logs
├── Build logs
├── Function logs
└── Edge logs
```

---

## 🚀 Performance

### Objectifs SLA
```
Uptime: 99.5% (3.6h downtime/mois)
Response Time (p95): < 500ms
Response Time (p99): < 1000ms
Database Queries (p95): < 100ms
Cache Hit Rate: > 80%
AI Router Latency (p95): < 2000ms
```

### Optimisations
```
Frontend
├── Next.js Image Optimization
├── Code Splitting
├── Lazy Loading
└── ISR (Incremental Static Regeneration)

Backend
├── Prisma Connection Pooling
├── Redis Caching
├── Database Indexes
└── Query Optimization

AI
├── Response Caching (80% hit rate)
├── Batch Processing
├── Async Workers
└── Rate Limiting
```

---

## 📈 Scaling Strategy

### Vertical Scaling (50 → 100 users)
```
RDS: db.t4g.small → db.t4g.medium
Redis: cache.t4g.small → cache.t4g.medium
S3: 150 GB → 300 GB
AI: $36-44 → $70-90
```
**Budget**: $250-350/mois

### Horizontal Scaling (100 → 500 users)
```
RDS: Read Replicas (2x)
Redis: Cluster Mode (3 nodes)
CDN: CloudFront
Load Balancer: ALB
Multi-AZ: Enabled
```
**Budget**: $800-1,200/mois

### Enterprise Scaling (500+ users)
```
RDS: Multi-AZ + Aurora Serverless
Redis: Cluster Mode (6+ nodes)
CDN: CloudFront + Edge Locations
Compute: ECS Fargate (auto-scaling)
AI: Reserved Capacity
```
**Budget**: > $2,000/mois

---

## 🔧 Maintenance

### Backups
```
RDS
├── Automated backups (7 jours)
├── Manual snapshots (avant deploy)
└── Point-in-time recovery

Redis
├── Pas de backup (cache only)
└── Rebuild from DB si nécessaire

S3
├── Versioning disabled (beta)
└── Lifecycle policies (auto-cleanup)
```

### Updates
```
Database
├── Prisma migrations (CI/CD)
├── Schema changes (blue-green)
└── Data migrations (scripts)

Application
├── Vercel auto-deploy (main branch)
├── Preview deployments (PR)
└── Rollback (1-click)

Infrastructure
├── Terraform/CloudFormation
├── Version control (Git)
└── Change management
```

---

**Architecture validée pour**: 50 users beta  
**Budget réel**: $149-176/mois  
**Budget disponible**: $1,300/mois  
**Scalable jusqu'à**: 500 users (avec ajustements)
