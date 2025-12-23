# 🔧 Azure Functions + Service Bus - Guide Complet Workers

**Architecture**: Azure Functions (Premium EP1) + Azure Service Bus (Topics/Subscriptions)  
**Région**: East US 2 (eastus2)  
**Budget**: ~$50-70/mois (Premium EP1 + Service Bus Standard)

---

## 📋 Table des Matières

1. [Architecture Overview](#architecture-overview)
2. [Azure Service Bus Setup](#azure-service-bus-setup)
3. [Azure Functions Setup](#azure-functions-setup)
4. [Configuration Détaillée](#configuration-détaillée)
5. [Implémentation Code](#implémentation-code)
6. [Monitoring et DLQ](#monitoring-et-dlq)
7. [Déploiement](#déploiement)

---

## 🏗️ Architecture Overview

### Design "2 Topics" (Jobs + Events)

```
┌─────────────────────────────────────────────────────────────┐
│                    VERCEL (Next.js API)                      │
│                                                              │
│  POST /api/jobs/video-analysis                              │
│  POST /api/jobs/chat-suggestions                            │
│  POST /api/jobs/content-suggestions                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼ Publish (Send-only policy)
┌─────────────────────────────────────────────────────────────┐
│           AZURE SERVICE BUS - Topic: huntaze-jobs           │
│                                                              │
│  Subscriptions (avec SQL filters sur jobType):              │
│  ├─ video-analysis (jobType = 'video.analysis')            │
│  ├─ chat-suggestions (jobType = 'chat.suggest')            │
│  ├─ content-suggestions (jobType = 'content.suggest')      │
│  └─ content-analysis (jobType = 'content.analyze')         │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│ VIDEO Worker │      │ CHAT Worker  │      │ CONTENT      │
│              │      │              │      │ Workers      │
│ Concurrency:2│      │ Concurrency:8│      │ Concurrency:8│
│ Timeout: 10m │      │ Timeout: 90s │      │ Timeout: 90s │
│              │      │              │      │              │
│ Azure Func   │      │ Azure Func   │      │ Azure Func   │
└──────────────┘      └──────────────┘      └──────────────┘
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              ▼ Publish events
┌─────────────────────────────────────────────────────────────┐
│          AZURE SERVICE BUS - Topic: huntaze-events          │
│                                                              │
│  Subscriptions:                                             │
│  ├─ notify-signalr (in-app notifications)                  │
│  ├─ notify-email (optional)                                │
│  ├─ notify-webhook (optional)                              │
│  └─ metrics (cost/latency tracking)                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    NOTIFICATION Workers                      │
│                                                              │
│  SignalR Worker → Push in-app notifications                 │
│  Email Worker → Send emails (optional)                      │
│  Webhook Worker → POST to external webhooks                 │
└─────────────────────────────────────────────────────────────┘
```

### Avantages de cette Architecture

✅ **1 seul point d'entrée** côté API (topic `huntaze-jobs`)  
✅ **Routing automatique** via SQL filters (pas de logique côté API)  
✅ **DLQ natifs** par subscription (pas de config manuelle)  
✅ **Scalabilité indépendante** par worker type  
✅ **Évolutif** (ajouter un worker = ajouter une subscription)

---

## 🚀 Azure Service Bus Setup

### 1. Variables d'Environnement

```bash
# Région
LOCATION="eastus2"

# Resource Group
RG="huntaze-beta-rg"
TAG="huntaze-beta-50"

# Service Bus
SB_NAMESPACE="huntaze-sb-$(openssl rand -hex 4)"  # Unique name
TOPIC_JOBS="huntaze-jobs"
TOPIC_EVENTS="huntaze-events"

# Function App (Premium)
STORAGE="huntazesa$(openssl rand -hex 4)"
PLAN="huntaze-func-ep1-$(openssl rand -hex 4)"
FUNCAPP="huntaze-workers-$(openssl rand -hex 4)"
```

### 2. Créer Resource Group + Storage + Premium Plan

```bash
# Resource Group
az group create \
  --name "$RG" \
  --location "$LOCATION" \
  --tags "$TAG"

# Storage Account (requis pour Azure Functions)
az storage account create \
  --name "$STORAGE" \
  --location "$LOCATION" \
  --resource-group "$RG" \
  --sku Standard_LRS

# Premium Plan (EP1)
az functionapp plan create \
  --name "$PLAN" \
  --resource-group "$RG" \
  --location "$LOCATION" \
  --sku EP1

# Function App
az functionapp create \
  --name "$FUNCAPP" \
  --storage-account "$STORAGE" \
  --plan "$PLAN" \
  --resource-group "$RG" \
  --functions-version 4 \
  --runtime node \
  --runtime-version 18
```

### 3. Créer Service Bus Namespace + Topics

```bash
# Namespace (Standard = nécessaire pour Topics)
az servicebus namespace create \
  --resource-group "$RG" \
  --name "$SB_NAMESPACE" \
  --location "$LOCATION" \
  --sku Standard

# Topic: huntaze-jobs
az servicebus topic create \
  --resource-group "$RG" \
  --namespace-name "$SB_NAMESPACE" \
  --name "$TOPIC_JOBS"

# Topic: huntaze-events
az servicebus topic create \
  --resource-group "$RG" \
  --namespace-name "$SB_NAMESPACE" \
  --name "$TOPIC_EVENTS"
```

### 4. Créer Subscriptions (huntaze-jobs)

#### Video Analysis (lourd, retry limité)

```bash
az servicebus topic subscription create \
  --resource-group "$RG" \
  --namespace-name "$SB_NAMESPACE" \
  --topic-name "$TOPIC_JOBS" \
  --name "video-analysis" \
  --max-delivery-count 3 \
  --lock-duration PT2M \
  --default-message-time-to-live PT30M \
  --enable-dead-lettering-on-message-expiration true
```

#### Chat Suggestions (léger, plus de retries)

```bash
az servicebus topic subscription create \
  --resource-group "$RG" \
  --namespace-name "$SB_NAMESPACE" \
  --topic-name "$TOPIC_JOBS" \
  --name "chat-suggestions" \
  --max-delivery-count 5 \
  --lock-duration PT1M \
  --default-message-time-to-live PT10M \
  --enable-dead-lettering-on-message-expiration true
```

#### Content Suggestions

```bash
az servicebus topic subscription create \
  --resource-group "$RG" \
  --namespace-name "$SB_NAMESPACE" \
  --topic-name "$TOPIC_JOBS" \
  --name "content-suggestions" \
  --max-delivery-count 5 \
  --lock-duration PT1M \
  --default-message-time-to-live PT10M \
  --enable-dead-lettering-on-message-expiration true
```

#### Content Analysis

```bash
az servicebus topic subscription create \
  --resource-group "$RG" \
  --namespace-name "$SB_NAMESPACE" \
  --topic-name "$TOPIC_JOBS" \
  --name "content-analysis" \
  --max-delivery-count 8 \
  --lock-duration PT2M \
  --default-message-time-to-live PT20M \
  --enable-dead-lettering-on-message-expiration true
```

### 5. Créer SQL Filters (Routing)

```bash
# Supprimer la rule par défaut (sinon tout passe partout)
for SUB in video-analysis chat-suggestions content-suggestions content-analysis; do
  az servicebus topic subscription rule delete \
    --resource-group "$RG" \
    --namespace-name "$SB_NAMESPACE" \
    --topic-name "$TOPIC_JOBS" \
    --subscription-name "$SUB" \
    --name "\$Default"
done

# Ajouter les rules de routage
az servicebus topic subscription rule create \
  --resource-group "$RG" \
  --namespace-name "$SB_NAMESPACE" \
  --topic-name "$TOPIC_JOBS" \
  --subscription-name "video-analysis" \
  --name "jobtype-video" \
  --filter-sql-expression "jobType = 'video.analysis'"

az servicebus topic subscription rule create \
  --resource-group "$RG" \
  --namespace-name "$SB_NAMESPACE" \
  --topic-name "$TOPIC_JOBS" \
  --subscription-name "chat-suggestions" \
  --name "jobtype-chat" \
  --filter-sql-expression "jobType = 'chat.suggest'"

az servicebus topic subscription rule create \
  --resource-group "$RG" \
  --namespace-name "$SB_NAMESPACE" \
  --topic-name "$TOPIC_JOBS" \
  --subscription-name "content-suggestions" \
  --name "jobtype-content-suggest" \
  --filter-sql-expression "jobType = 'content.suggest'"

az servicebus topic subscription rule create \
  --resource-group "$RG" \
  --namespace-name "$SB_NAMESPACE" \
  --topic-name "$TOPIC_JOBS" \
  --subscription-name "content-analysis" \
  --name "jobtype-content-analyze" \
  --filter-sql-expression "jobType = 'content.analyze'"
```

### 6. Créer Subscriptions (huntaze-events)

```bash
# SignalR notifications
az servicebus topic subscription create \
  --resource-group "$RG" \
  --namespace-name "$SB_NAMESPACE" \
  --topic-name "$TOPIC_EVENTS" \
  --name "notify-signalr" \
  --max-delivery-count 10 \
  --lock-duration PT1M \
  --default-message-time-to-live P1D

# Email notifications (optional)
az servicebus topic subscription create \
  --resource-group "$RG" \
  --namespace-name "$SB_NAMESPACE" \
  --topic-name "$TOPIC_EVENTS" \
  --name "notify-email" \
  --max-delivery-count 10 \
  --lock-duration PT1M \
  --default-message-time-to-live P1D

# Webhook notifications (optional)
az servicebus topic subscription create \
  --resource-group "$RG" \
  --namespace-name "$SB_NAMESPACE" \
  --topic-name "$TOPIC_EVENTS" \
  --name "notify-webhook" \
  --max-delivery-count 10 \
  --lock-duration PT1M \
  --default-message-time-to-live P1D

# Metrics tracking (optional)
az servicebus topic subscription create \
  --resource-group "$RG" \
  --namespace-name "$SB_NAMESPACE" \
  --topic-name "$TOPIC_EVENTS" \
  --name "metrics" \
  --max-delivery-count 5 \
  --lock-duration PT1M \
  --default-message-time-to-live P7D
```

### 7. Créer Authorization Rules (SAS Policies)

```bash
# Send-only (Vercel / API)
az servicebus namespace authorization-rule create \
  --resource-group "$RG" \
  --namespace-name "$SB_NAMESPACE" \
  --name "vercel-send" \
  --rights Send

# Listen + Send (Functions: triggers + requeue)
az servicebus namespace authorization-rule create \
  --resource-group "$RG" \
  --namespace-name "$SB_NAMESPACE" \
  --name "functions-rw" \
  --rights Listen Send
```

### 8. Récupérer Connection Strings

```bash
# Functions (Listen + Send)
SB_CONN_FUNCTIONS=$(az servicebus namespace authorization-rule keys list \
  --resource-group "$RG" \
  --namespace-name "$SB_NAMESPACE" \
  --name "functions-rw" \
  --query primaryConnectionString -o tsv)

echo "SERVICEBUS_CONNECTION=$SB_CONN_FUNCTIONS"

# Vercel (Send-only)
SB_CONN_VERCEL=$(az servicebus namespace authorization-rule keys list \
  --resource-group "$RG" \
  --namespace-name "$SB_NAMESPACE" \
  --name "vercel-send" \
  --query primaryConnectionString -o tsv)

echo "SERVICEBUS_CONNECTION_SEND=$SB_CONN_VERCEL"
```

---

## 📊 Monitoring et DLQ

### 1. DLQ Monitoring Function (Timer Trigger)

```typescript
// src/functions/DlqTriageMonitor.ts

import { app, InvocationContext, Timer } from '@azure/functions';
import { ServiceBusAdministrationClient } from '@azure/service-bus';

app.timer('DlqTriageMonitor', {
  schedule: '0 */15 * * * *', // Every 15 minutes
  handler: async (timer: Timer, context: InvocationContext) => {
    context.log('[DlqTriageMonitor] Starting DLQ triage...');
    
    const connectionString = process.env.SERVICEBUS_CONNECTION!;
    const adminClient = new ServiceBusAdministrationClient(connectionString);
    
    const subscriptions = [
      'video-analysis',
      'chat-suggestions',
      'content-suggestions',
      'content-analysis',
    ];
    
    for (const subName of subscriptions) {
      try {
        const runtimeInfo = await adminClient.getSubscriptionRuntimeProperties(
          process.env.TOPIC_JOBS!,
          subName
        );
        
        const dlqCount = runtimeInfo.deadLetterMessageCount;
        
        if (dlqCount > 0) {
          context.warn(`[DlqTriageMonitor] ${subName} has ${dlqCount} DLQ messages`);
          
          // Alert if critical threshold
          if (dlqCount > 10) {
            context.error(`[DlqTriageMonitor] CRITICAL: ${subName} DLQ > 10 messages`);
            // TODO: Send alert (email, Slack, PagerDuty)
          }
          
          // Sample DLQ messages for analysis
          const receiver = adminClient.createReceiver(
            process.env.TOPIC_JOBS!,
            subName,
            { subQueue: 'deadLetter' }
          );
          
          const messages = await receiver.receiveMessages(5, { maxWaitTimeInMs: 5000 });
          
          for (const msg of messages) {
            context.log(`[DlqTriageMonitor] DLQ message:`, {
              jobId: msg.body.jobId,
              reason: msg.deadLetterReason,
              errorDescription: msg.deadLetterErrorDescription,
              deliveryCount: msg.deliveryCount,
            });
          }
          
          await receiver.close();
        }
        
      } catch (error) {
        context.error(`[DlqTriageMonitor] Error checking ${subName}:`, error);
      }
    }
    
    context.log('[DlqTriageMonitor] Triage complete');
  },
});
```

### 2. Application Insights Integration

```typescript
// src/lib/telemetry.ts

import { TelemetryClient } from 'applicationinsights';

const appInsights = new TelemetryClient(process.env.APPLICATIONINSIGHTS_CONNECTION_STRING);

export function trackJobMetrics(
  jobType: string,
  status: 'completed' | 'failed',
  durationMs: number,
  metadata?: Record<string, any>
) {
  appInsights.trackMetric({
    name: `job.${jobType}.duration`,
    value: durationMs,
    properties: {
      status,
      ...metadata,
    },
  });
  
  appInsights.trackEvent({
    name: `job.${jobType}.${status}`,
    properties: metadata,
  });
}

export function trackAzureAICost(
  model: string,
  inputTokens: number,
  outputTokens: number,
  costUsd: number
) {
  appInsights.trackMetric({
    name: 'azure.ai.cost',
    value: costUsd,
    properties: {
      model,
      inputTokens,
      outputTokens,
    },
  });
}
```

### 3. CloudWatch Alarms (AWS Side)

```bash
# Create SNS topic for alerts
aws sns create-topic \
  --name huntaze-workers-alerts \
  --region us-east-2

# Subscribe email
aws sns subscribe \
  --topic-arn arn:aws:sns:us-east-2:317805897534:huntaze-workers-alerts \
  --protocol email \
  --notification-endpoint your-email@example.com

# RDS CPU alarm
aws cloudwatch put-metric-alarm \
  --alarm-name huntaze-rds-cpu-high \
  --alarm-description "RDS CPU > 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/RDS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2 \
  --alarm-actions arn:aws:sns:us-east-2:317805897534:huntaze-workers-alerts

# Redis memory alarm
aws cloudwatch put-metric-alarm \
  --alarm-name huntaze-redis-memory-high \
  --alarm-description "Redis Memory > 90%" \
  --metric-name DatabaseMemoryUsagePercentage \
  --namespace AWS/ElastiCache \
  --statistic Average \
  --period 300 \
  --threshold 90 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2 \
  --alarm-actions arn:aws:sns:us-east-2:317805897534:huntaze-workers-alerts
```

### 4. Azure Monitor Alerts

```bash
# Create action group for notifications
az monitor action-group create \
  --resource-group "$RG" \
  --name "huntaze-alerts" \
  --short-name "huntaze" \
  --email-receiver name="Admin" email-address="your-email@example.com"

# Alert: DLQ messages > 10
az monitor metrics alert create \
  --resource-group "$RG" \
  --name "huntaze-dlq-high" \
  --description "DLQ messages > 10" \
  --scopes "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RG/providers/Microsoft.ServiceBus/namespaces/$SB_NAMESPACE" \
  --condition "avg DeadletteredMessages > 10" \
  --window-size 5m \
  --evaluation-frequency 1m \
  --action "huntaze-alerts"

# Alert: Function errors > 5
az monitor metrics alert create \
  --resource-group "$RG" \
  --name "huntaze-function-errors" \
  --description "Function errors > 5 in 5min" \
  --scopes "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RG/providers/Microsoft.Web/sites/$FUNCAPP" \
  --condition "total FunctionExecutionCount where ResultType = 'Failed' > 5" \
  --window-size 5m \
  --evaluation-frequency 1m \
  --action "huntaze-alerts"
```

---

## 🚀 Déploiement

### 1. Local Development Setup

```bash
# Install Azure Functions Core Tools
npm install -g azure-functions-core-tools@4

# Install dependencies
cd huntaze-workers
npm install

# Create local.settings.json
cat > local.settings.json <<EOF
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "UseDevelopmentStorage=true",
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "SERVICEBUS_CONNECTION": "Endpoint=sb://...",
    "TOPIC_JOBS": "huntaze-jobs",
    "TOPIC_EVENTS": "huntaze-events",
    "AZURE_DEEPSEEK_V3_ENDPOINT": "https://...",
    "AZURE_DEEPSEEK_R1_ENDPOINT": "https://...",
    "AZURE_PHI4_MULTIMODAL_ENDPOINT": "https://...",
    "AZURE_SPEECH_KEY": "...",
    "DATABASE_URL": "postgresql://...",
    "REDIS_URL": "redis://..."
  }
}
EOF

# Start local development
func start
```

### 2. Build and Deploy

```bash
# Build TypeScript
npm run build

# Deploy to Azure
func azure functionapp publish "$FUNCAPP"

# Verify deployment
func azure functionapp list-functions "$FUNCAPP"
```

### 3. Deployment Script (Complete)

```bash
#!/bin/bash
# deploy-azure-workers.sh

set -e

echo "🚀 Deploying Azure Workers..."

# Variables
RG="huntaze-beta-rg"
LOCATION="eastus2"
FUNCAPP="huntaze-workers-$(openssl rand -hex 4)"
STORAGE="huntazesa$(openssl rand -hex 4)"
PLAN="huntaze-func-ep1"
SB_NAMESPACE="huntaze-sb-$(openssl rand -hex 4)"

# 1. Create Resource Group
echo "📦 Creating Resource Group..."
az group create --name "$RG" --location "$LOCATION"

# 2. Create Storage Account
echo "💾 Creating Storage Account..."
az storage account create \
  --name "$STORAGE" \
  --location "$LOCATION" \
  --resource-group "$RG" \
  --sku Standard_LRS

# 3. Create Premium Plan
echo "⚡ Creating Premium Plan (EP1)..."
az functionapp plan create \
  --name "$PLAN" \
  --resource-group "$RG" \
  --location "$LOCATION" \
  --sku EP1

# 4. Create Function App
echo "🔧 Creating Function App..."
az functionapp create \
  --name "$FUNCAPP" \
  --storage-account "$STORAGE" \
  --plan "$PLAN" \
  --resource-group "$RG" \
  --functions-version 4 \
  --runtime node \
  --runtime-version 18

# 5. Create Service Bus
echo "📨 Creating Service Bus..."
az servicebus namespace create \
  --resource-group "$RG" \
  --name "$SB_NAMESPACE" \
  --location "$LOCATION" \
  --sku Standard

# 6. Create Topics
echo "📋 Creating Topics..."
az servicebus topic create \
  --resource-group "$RG" \
  --namespace-name "$SB_NAMESPACE" \
  --name "huntaze-jobs"

az servicebus topic create \
  --resource-group "$RG" \
  --namespace-name "$SB_NAMESPACE" \
  --name "huntaze-events"

# 7. Create Subscriptions (Jobs)
echo "📬 Creating Subscriptions..."
for SUB in video-analysis chat-suggestions content-suggestions content-analysis; do
  az servicebus topic subscription create \
    --resource-group "$RG" \
    --namespace-name "$SB_NAMESPACE" \
    --topic-name "huntaze-jobs" \
    --name "$SUB" \
    --max-delivery-count 5 \
    --lock-duration PT2M \
    --enable-dead-lettering-on-message-expiration true
done

# 8. Create Subscriptions (Events)
for SUB in notify-signalr notify-email notify-webhook metrics; do
  az servicebus topic subscription create \
    --resource-group "$RG" \
    --namespace-name "$SB_NAMESPACE" \
    --topic-name "huntaze-events" \
    --name "$SUB" \
    --max-delivery-count 10 \
    --lock-duration PT1M
done

# 9. Create SQL Filters
echo "🔍 Creating SQL Filters..."
for SUB in video-analysis chat-suggestions content-suggestions content-analysis; do
  az servicebus topic subscription rule delete \
    --resource-group "$RG" \
    --namespace-name "$SB_NAMESPACE" \
    --topic-name "huntaze-jobs" \
    --subscription-name "$SUB" \
    --name "\$Default" || true
done

az servicebus topic subscription rule create \
  --resource-group "$RG" \
  --namespace-name "$SB_NAMESPACE" \
  --topic-name "huntaze-jobs" \
  --subscription-name "video-analysis" \
  --name "jobtype-video" \
  --filter-sql-expression "jobType = 'video.analysis'"

az servicebus topic subscription rule create \
  --resource-group "$RG" \
  --namespace-name "$SB_NAMESPACE" \
  --topic-name "huntaze-jobs" \
  --subscription-name "chat-suggestions" \
  --name "jobtype-chat" \
  --filter-sql-expression "jobType = 'chat.suggest'"

az servicebus topic subscription rule create \
  --resource-group "$RG" \
  --namespace-name "$SB_NAMESPACE" \
  --topic-name "huntaze-jobs" \
  --subscription-name "content-suggestions" \
  --name "jobtype-content-suggest" \
  --filter-sql-expression "jobType = 'content.suggest'"

az servicebus topic subscription rule create \
  --resource-group "$RG" \
  --namespace-name "$SB_NAMESPACE" \
  --topic-name "huntaze-jobs" \
  --subscription-name "content-analysis" \
  --name "jobtype-content-analyze" \
  --filter-sql-expression "jobType = 'content.analyze'"

# 10. Get Connection Strings
echo "🔑 Getting Connection Strings..."
SB_CONN=$(az servicebus namespace authorization-rule keys list \
  --resource-group "$RG" \
  --namespace-name "$SB_NAMESPACE" \
  --name "RootManageSharedAccessKey" \
  --query primaryConnectionString -o tsv)

# 11. Configure Function App Settings
echo "⚙️ Configuring Function App..."
az functionapp config appsettings set \
  --resource-group "$RG" \
  --name "$FUNCAPP" \
  --settings \
  "SERVICEBUS_CONNECTION=$SB_CONN" \
  "TOPIC_JOBS=huntaze-jobs" \
  "TOPIC_EVENTS=huntaze-events" \
  "AZURE_DEEPSEEK_V3_ENDPOINT=$AZURE_DEEPSEEK_V3_ENDPOINT" \
  "AZURE_DEEPSEEK_R1_ENDPOINT=$AZURE_DEEPSEEK_R1_ENDPOINT" \
  "AZURE_PHI4_MULTIMODAL_ENDPOINT=$AZURE_PHI4_MULTIMODAL_ENDPOINT" \
  "AZURE_SPEECH_KEY=$AZURE_SPEECH_KEY" \
  "DATABASE_URL=$DATABASE_URL" \
  "REDIS_URL=$REDIS_URL"

# 12. Deploy Functions
echo "📤 Deploying Functions..."
cd huntaze-workers
npm run build
func azure functionapp publish "$FUNCAPP"

echo "✅ Deployment complete!"
echo ""
echo "📋 Summary:"
echo "  Resource Group: $RG"
echo "  Function App: $FUNCAPP"
echo "  Service Bus: $SB_NAMESPACE"
echo "  Topics: huntaze-jobs, huntaze-events"
echo ""
echo "🔗 Next steps:"
echo "  1. Update Vercel env vars with Service Bus connection string"
echo "  2. Test with: curl -X POST https://your-app.vercel.app/api/jobs/video-analysis"
echo "  3. Monitor: az monitor app-insights component show --app $FUNCAPP"
```

### 4. Vercel API Routes (Publishing Jobs)

```typescript
// app/api/jobs/video-analysis/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { ServiceBusClient } from '@azure/service-bus';

const connectionString = process.env.SERVICEBUS_CONNECTION_SEND!;
const client = new ServiceBusClient(connectionString);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { videoUrl, creatorId } = body;
    
    if (!videoUrl || !creatorId) {
      return NextResponse.json(
        { error: 'Missing videoUrl or creatorId' },
        { status: 400 }
      );
    }
    
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const sender = client.createSender('huntaze-jobs');
    
    await sender.sendMessages({
      body: {
        jobId,
        jobType: 'video.analysis',
        creatorId,
        payload: { videoUrl },
        attempt: 0,
        createdAt: new Date().toISOString(),
        deadlineMs: 120000, // 2 minutes SLA
      },
      contentType: 'application/json',
      applicationProperties: {
        jobType: 'video.analysis',
        jobId,
        creatorId,
      },
    });
    
    await sender.close();
    
    return NextResponse.json({
      success: true,
      jobId,
      status: 'pending',
      message: 'Video analysis job queued',
    });
    
  } catch (error: any) {
    console.error('Failed to queue video analysis:', error);
    return NextResponse.json(
      { error: 'Failed to queue job', details: error.message },
      { status: 500 }
    );
  }
}
```

```typescript
// app/api/jobs/chat-suggestions/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { ServiceBusClient } from '@azure/service-bus';

const connectionString = process.env.SERVICEBUS_CONNECTION_SEND!;
const client = new ServiceBusClient(connectionString);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fanMessage, context, creatorId } = body;
    
    if (!fanMessage || !creatorId) {
      return NextResponse.json(
        { error: 'Missing fanMessage or creatorId' },
        { status: 400 }
      );
    }
    
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const sender = client.createSender('huntaze-jobs');
    
    await sender.sendMessages({
      body: {
        jobId,
        jobType: 'chat.suggest',
        creatorId,
        payload: { fanMessage, context },
        attempt: 0,
        createdAt: new Date().toISOString(),
        deadlineMs: 90000, // 90 seconds
      },
      contentType: 'application/json',
      applicationProperties: {
        jobType: 'chat.suggest',
        jobId,
        creatorId,
      },
    });
    
    await sender.close();
    
    return NextResponse.json({
      success: true,
      jobId,
      status: 'pending',
      message: 'Chat suggestions job queued',
    });
    
  } catch (error: any) {
    console.error('Failed to queue chat suggestions:', error);
    return NextResponse.json(
      { error: 'Failed to queue job', details: error.message },
      { status: 500 }
    );
  }
}
```

---

## 🧪 Testing

### 1. Unit Tests

```typescript
// tests/workers/video-analysis.test.ts

import { describe, it, expect, vi } from 'vitest';
import { analyzeVideo } from '../../src/lib/azure-ai';

describe('VideoAnalysisWorker', () => {
  it('should analyze video successfully', async () => {
    const result = await analyzeVideo({
      videoUrl: 'https://example.com/video.mp4',
      signal: new AbortController().signal,
    });
    
    expect(result).toHaveProperty('scenes');
    expect(result).toHaveProperty('objects');
    expect(result).toHaveProperty('transcript');
  });
  
  it('should handle timeout gracefully', async () => {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 100);
    
    await expect(
      analyzeVideo({
        videoUrl: 'https://example.com/long-video.mp4',
        signal: controller.signal,
      })
    ).rejects.toThrow('SOFT_TIMEOUT');
  });
});
```

### 2. Integration Tests

```bash
# Test video analysis job
curl -X POST https://your-app.vercel.app/api/jobs/video-analysis \
  -H "Content-Type: application/json" \
  -d '{
    "videoUrl": "https://example.com/test-video.mp4",
    "creatorId": "123"
  }'

# Check job status
curl https://your-app.vercel.app/api/jobs/status/job_123

# Monitor Service Bus
az servicebus topic subscription show \
  --resource-group huntaze-beta-rg \
  --namespace-name huntaze-sb-xxx \
  --topic-name huntaze-jobs \
  --name video-analysis
```

---

## 💰 Cost Breakdown

### Azure Functions Premium EP1
```
EP1 Plan: $146.88/mois
├── 1 instance × 210 hours/mois
├── 1 vCPU + 3.5 GB RAM
├── Includes 400,000 GB-s execution
└── Additional execution: $0.000016/GB-s
```

### Azure Service Bus Standard
```
Service Bus: $10/mois
├── Base: $10/mois (13M operations incluses)
├── Additional: $0.05/million operations
└── 50 users beta: ~5M operations/mois = $10 total
```

### Total Workers Cost
```
Total: $156.88/mois
├── Premium EP1: $146.88
└── Service Bus: $10
```

**Comparaison avec alternatives**:
- ECS Fargate: $150-200/mois ❌
- EC2 Spot: $100-150/mois ❌
- Upstash QStash: $5-10/mois ✅ (mais limité)
- **Azure Functions**: $156.88/mois ✅ (production-ready)

---

## 📈 Scaling

### 50 → 100 Users
```
EP1 Plan: $146.88/mois (même prix, auto-scale)
Service Bus: $10-15/mois (plus d'operations)
Total: ~$160/mois
```

### 100 → 500 Users
```
EP2 Plan: $293.76/mois (2 vCPU, 7 GB RAM)
Service Bus: $20-30/mois
Total: ~$320/mois
```

### 500+ Users
```
EP3 Plan: $587.52/mois (4 vCPU, 14 GB RAM)
Service Bus Premium: $677/mois (dedicated)
Total: ~$1,265/mois
```

---

## ✅ Checklist Déploiement

- [ ] Azure Resource Group créé
- [ ] Service Bus Namespace créé (Standard tier)
- [ ] Topics créés (huntaze-jobs, huntaze-events)
- [ ] Subscriptions créées avec SQL filters
- [ ] Authorization rules créées (send-only, listen+send)
- [ ] Premium Plan EP1 créé
- [ ] Function App créée
- [ ] App Settings configurées (Service Bus, Azure AI, Database)
- [ ] Functions déployées (7 workers)
- [ ] Application Insights configuré
- [ ] Alerts configurées (DLQ, errors)
- [ ] Vercel API routes créées
- [ ] Tests d'intégration passés
- [ ] Monitoring dashboard configuré
- [ ] Documentation à jour

---

## 🎯 Résumé

**Architecture**: Azure Functions Premium EP1 + Service Bus Standard  
**Budget**: ~$156.88/mois (EP1 $146.88 + Service Bus $10)  
**Capacité**: 50-100 users beta  
**Avantages**:
- Production-ready (pas de "beta" comme Upstash)
- DLQ natifs par subscription
- Retry policies configurables
- Monitoring complet (Application Insights)
- Auto-scaling inclus
- Intégration Azure AI native

**Comparaison**:
- ✅ Plus cher qu'Upstash ($156 vs $5-10) mais production-ready
- ✅ Moins cher qu'ECS Fargate ($156 vs $150-200)
- ✅ Plus simple qu'EC2 Spot (pas de gestion d'instances)
- ✅ Intégration native avec Azure AI Foundry

**Prochaines étapes**:
1. Exécuter `deploy-azure-workers.sh`
2. Configurer Vercel avec `SERVICEBUS_CONNECTION_SEND`
3. Tester avec `/api/jobs/video-analysis`
4. Monitorer avec Application Insights

---

**Guide complet**: Azure Functions + Service Bus pour workers production-ready à $156.88/mois ✅

## ⚙️ Configuration Détaillée

### host.json (Video Workers)

```json
{
  "version": "2.0",
  "functionTimeout": "00:10:00",
  "extensions": {
    "serviceBus": {
      "clientRetryOptions": {
        "mode": "exponential",
        "tryTimeout": "00:01:00",
        "delay": "00:00:00.80",
        "maxDelay": "00:01:00",
        "maxRetries": 3
      },
      "prefetchCount": 0,
      "autoCompleteMessages": false,
      "maxAutoLockRenewalDuration": "00:05:00",
      "maxConcurrentCalls": 2
    }
  },
  "logging": {
    "applicationInsights": {
      "samplingSettings": {
        "isEnabled": true,
        "maxTelemetryItemsPerSecond": 20
      }
    }
  }
}
```

**Explication**:
- `functionTimeout`: 10 minutes (max Consumption, permet analyse vidéo complète)
- `prefetchCount`: 0 (évite de locker plein de messages pendant analyse)
- `maxConcurrentCalls`: 2 (beta 50 users, jobs lourds)
- `maxAutoLockRenewalDuration`: 5 minutes (renouvellement automatique du lock)
- `autoCompleteMessages`: false (on complete manuellement après DB write + event emit)

### host.json (Chat/Content Workers)

```json
{
  "version": "2.0",
  "functionTimeout": "00:01:30",
  "extensions": {
    "serviceBus": {
      "clientRetryOptions": {
        "mode": "exponential",
        "tryTimeout": "00:01:00",
        "delay": "00:00:00.80",
        "maxDelay": "00:01:00",
        "maxRetries": 3
      },
      "prefetchCount": 20,
      "autoCompleteMessages": false,
      "maxAutoLockRenewalDuration": "00:02:00",
      "maxConcurrentCalls": 8
    }
  }
}
```

**Explication**:
- `functionTimeout`: 90 secondes (jobs rapides)
- `prefetchCount`: 20 (optimise throughput)
- `maxConcurrentCalls`: 8 (plus de concurrence pour jobs légers)

### host.json (Notification Workers)

```json
{
  "version": "2.0",
  "functionTimeout": "00:00:30",
  "extensions": {
    "serviceBus": {
      "prefetchCount": 200,
      "autoCompleteMessages": true,
      "maxConcurrentCalls": 50
    }
  }
}
```

**Explication**:
- `functionTimeout`: 30 secondes (notifications très rapides)
- `prefetchCount`: 200 (très haut throughput)
- `maxConcurrentCalls`: 50 (très concurrent)
- `autoCompleteMessages`: true (notifications idempotentes)

### App Settings (Function App)

```bash
az functionapp config appsettings set \
  --resource-group "$RG" \
  --name "$FUNCAPP" \
  --settings \
  "SERVICEBUS_CONNECTION=$SB_CONN_FUNCTIONS" \
  "TOPIC_JOBS=$TOPIC_JOBS" \
  "TOPIC_EVENTS=$TOPIC_EVENTS" \
  "AZURE_DEEPSEEK_V3_ENDPOINT=$AZURE_DEEPSEEK_V3_ENDPOINT" \
  "AZURE_DEEPSEEK_R1_ENDPOINT=$AZURE_DEEPSEEK_R1_ENDPOINT" \
  "AZURE_PHI4_MULTIMODAL_ENDPOINT=$AZURE_PHI4_MULTIMODAL_ENDPOINT" \
  "AZURE_SPEECH_KEY=$AZURE_SPEECH_KEY" \
  "DATABASE_URL=$DATABASE_URL" \
  "REDIS_URL=$REDIS_URL"
```

---

## 💻 Implémentation Code

### 1. Structure du Projet

```
huntaze-workers/
├── host.json
├── package.json
├── tsconfig.json
├── local.settings.json
├── src/
│   ├── functions/
│   │   ├── VideoAnalysisWorker.ts
│   │   ├── ChatSuggestionsWorker.ts
│   │   ├── ContentSuggestionsWorker.ts
│   │   ├── ContentAnalysisWorker.ts
│   │   ├── NotifySignalRWorker.ts
│   │   ├── NotifyEmailWorker.ts
│   │   └── NotifyWebhookWorker.ts
│   ├── lib/
│   │   ├── azure-ai.ts
│   │   ├── database.ts
│   │   ├── service-bus.ts
│   │   └── types.ts
│   └── utils/
│       ├── retry.ts
│       └── logger.ts
└── .funcignore
```

### 2. Types Communs

```typescript
// src/lib/types.ts

export interface JobMessage {
  jobId: string;
  jobType: 'video.analysis' | 'chat.suggest' | 'content.suggest' | 'content.analyze';
  creatorId: string;
  payload: {
    videoId?: string;
    videoUrl?: string;
    promptContext?: any;
    [key: string]: any;
  };
  attempt: number;
  createdAt: string;
  deadlineMs: number;
}

export interface EventMessage {
  jobId: string;
  creatorId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'timeout';
  progress: number;
  message?: string;
  result?: any;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  updatedAt: string;
}

export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'timeout';
```

### 3. Service Bus Client

```typescript
// src/lib/service-bus.ts

import { ServiceBusClient, ServiceBusSender } from '@azure/service-bus';

const connectionString = process.env.SERVICEBUS_CONNECTION!;
const client = new ServiceBusClient(connectionString);

let eventsSender: ServiceBusSender | null = null;

export async function publishEvent(event: EventMessage): Promise<void> {
  if (!eventsSender) {
    eventsSender = client.createSender(process.env.TOPIC_EVENTS!);
  }
  
  await eventsSender.sendMessages({
    body: event,
    contentType: 'application/json',
    applicationProperties: {
      jobId: event.jobId,
      creatorId: event.creatorId,
      status: event.status,
    },
  });
}

export async function rescheduleJob(
  job: JobMessage,
  delaySeconds: number
): Promise<void> {
  const sender = client.createSender(process.env.TOPIC_JOBS!);
  
  const scheduledTime = new Date(Date.now() + delaySeconds * 1000);
  
  await sender.sendMessages({
    body: { ...job, attempt: job.attempt + 1 },
    contentType: 'application/json',
    applicationProperties: {
      jobType: job.jobType,
      jobId: job.jobId,
    },
    scheduledEnqueueTime: scheduledTime,
  });
  
  await sender.close();
}
```

### 4. Database Helper

```typescript
// src/lib/database.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function updateJobStatus(
  jobId: string,
  status: JobStatus,
  data?: {
    progress?: number;
    result?: any;
    error?: any;
  }
): Promise<void> {
  await prisma.videoAnalysisJob.update({
    where: { id: jobId },
    data: {
      status,
      progress: data?.progress,
      result: data?.result,
      error: data?.error,
      updatedAt: new Date(),
    },
  });
}

export async function getJob(jobId: string) {
  return await prisma.videoAnalysisJob.findUnique({
    where: { id: jobId },
  });
}
```

### 5. Retry Logic

```typescript
// src/utils/retry.ts

export function calculateBackoff(attempt: number, jobType: string): number {
  if (jobType === 'video.analysis') {
    // Video: +15s, +45s, +2m
    const delays = [15, 45, 120];
    return delays[Math.min(attempt - 1, delays.length - 1)];
  } else {
    // Chat/Content: +3s, +10s, +30s, +2m
    const delays = [3, 10, 30, 120];
    return delays[Math.min(attempt - 1, delays.length - 1)];
  }
}

export function shouldRetry(error: any, attempt: number, maxAttempts: number): boolean {
  // Permanent errors → no retry
  if (error.code === 'INVALID_PAYLOAD' || error.code === 'VIDEO_NOT_FOUND') {
    return false;
  }
  
  // Transient errors → retry if under max attempts
  if (error.code === 'RATE_LIMIT' || error.code === 'TIMEOUT' || error.code === 'NETWORK_ERROR') {
    return attempt < maxAttempts;
  }
  
  return false;
}
```

### 6. Video Analysis Worker

```typescript
// src/functions/VideoAnalysisWorker.ts

import { app, InvocationContext } from '@azure/functions';
import { JobMessage, EventMessage } from '../lib/types';
import { publishEvent, rescheduleJob } from '../lib/service-bus';
import { updateJobStatus } from '../lib/database';
import { analyzeVideo } from '../lib/azure-ai';
import { calculateBackoff, shouldRetry } from '../utils/retry';

app.serviceBusTopic('VideoAnalysisWorker', {
  connection: 'SERVICEBUS_CONNECTION',
  topicName: '%TOPIC_JOBS%',
  subscriptionName: 'video-analysis',
  handler: async (message: JobMessage, context: InvocationContext) => {
    const startTime = Date.now();
    const { jobId, creatorId, payload, attempt } = message;
    
    context.log(`[VideoAnalysisWorker] Processing job ${jobId}, attempt ${attempt}`);
    
    try {
      // Update status: processing
      await updateJobStatus(jobId, 'processing', { progress: 0 });
      await publishEvent({
        jobId,
        creatorId,
        status: 'processing',
        progress: 0,
        updatedAt: new Date().toISOString(),
      });
      
      // Check timeout (soft timeout: 2 minutes SLA)
      const elapsed = Date.now() - startTime;
      if (elapsed > 120000) {
        throw new Error('SOFT_TIMEOUT');
      }
      
      // Analyze video (with AbortController for hard timeout)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000);
      
      const result = await analyzeVideo({
        videoUrl: payload.videoUrl!,
        signal: controller.signal,
        onProgress: async (progress) => {
          await publishEvent({
            jobId,
            creatorId,
            status: 'processing',
            progress,
            updatedAt: new Date().toISOString(),
          });
        },
      });
      
      clearTimeout(timeoutId);
      
      // Update status: completed
      await updateJobStatus(jobId, 'completed', { progress: 100, result });
      await publishEvent({
        jobId,
        creatorId,
        status: 'completed',
        progress: 100,
        result,
        updatedAt: new Date().toISOString(),
      });
      
      context.log(`[VideoAnalysisWorker] Job ${jobId} completed in ${Date.now() - startTime}ms`);
      
    } catch (error: any) {
      context.error(`[VideoAnalysisWorker] Job ${jobId} failed:`, error);
      
      // Check if should retry
      const maxAttempts = 3;
      if (shouldRetry(error, attempt, maxAttempts)) {
        const delaySeconds = calculateBackoff(attempt, 'video.analysis');
        context.log(`[VideoAnalysisWorker] Rescheduling job ${jobId} in ${delaySeconds}s`);
        
        await rescheduleJob(message, delaySeconds);
        
        // Don't throw (message will be completed, not dead-lettered)
        return;
      }
      
      // Permanent failure or max retries reached
      await updateJobStatus(jobId, 'failed', {
        error: {
          code: error.code || 'UNKNOWN_ERROR',
          message: error.message,
          details: error.stack,
        },
      });
      
      await publishEvent({
        jobId,
        creatorId,
        status: 'failed',
        progress: 0,
        error: {
          code: error.code || 'UNKNOWN_ERROR',
          message: error.message,
        },
        updatedAt: new Date().toISOString(),
      });
      
      // Throw to dead-letter the message
      throw error;
    }
  },
});
```

### 7. Chat Suggestions Worker

```typescript
// src/functions/ChatSuggestionsWorker.ts

import { app, InvocationContext } from '@azure/functions';
import { JobMessage } from '../lib/types';
import { publishEvent } from '../lib/service-bus';
import { updateJobStatus } from '../lib/database';
import { generateChatSuggestions } from '../lib/azure-ai';

app.serviceBusTopic('ChatSuggestionsWorker', {
  connection: 'SERVICEBUS_CONNECTION',
  topicName: '%TOPIC_JOBS%',
  subscriptionName: 'chat-suggestions',
  handler: async (message: JobMessage, context: InvocationContext) => {
    const { jobId, creatorId, payload } = message;
    
    context.log(`[ChatSuggestionsWorker] Processing job ${jobId}`);
    
    try {
      await updateJobStatus(jobId, 'processing');
      
      const suggestions = await generateChatSuggestions({
        fanMessage: payload.fanMessage,
        context: payload.context,
      });
      
      await updateJobStatus(jobId, 'completed', { result: suggestions });
      await publishEvent({
        jobId,
        creatorId,
        status: 'completed',
        progress: 100,
        result: suggestions,
        updatedAt: new Date().toISOString(),
      });
      
    } catch (error: any) {
      context.error(`[ChatSuggestionsWorker] Job ${jobId} failed:`, error);
      
      await updateJobStatus(jobId, 'failed', { error });
      await publishEvent({
        jobId,
        creatorId,
        status: 'failed',
        error: {
          code: error.code || 'UNKNOWN_ERROR',
          message: error.message,
        },
        updatedAt: new Date().toISOString(),
      });
      
      throw error;
    }
  },
});
```

### 8. Content Suggestions Worker

```typescript
// src/functions/ContentSuggestionsWorker.ts

import { app, InvocationContext } from '@azure/functions';
import { JobMessage } from '../lib/types';
import { publishEvent } from '../lib/service-bus';
import { updateJobStatus } from '../lib/database';
import { generateContentSuggestions } from '../lib/azure-ai';

app.serviceBusTopic('ContentSuggestionsWorker', {
  connection: 'SERVICEBUS_CONNECTION',
  topicName: '%TOPIC_JOBS%',
  subscriptionName: 'content-suggestions',
  handler: async (message: JobMessage, context: InvocationContext) => {
    const { jobId, creatorId, payload } = message;
    
    context.log(`[ContentSuggestionsWorker] Processing job ${jobId}`);
    
    try {
      await updateJobStatus(jobId, 'processing');
      
      const suggestions = await generateContentSuggestions({
        contentType: payload.contentType,
        tone: payload.tone,
        topic: payload.topic,
      });
      
      await updateJobStatus(jobId, 'completed', { result: suggestions });
      await publishEvent({
        jobId,
        creatorId,
        status: 'completed',
        progress: 100,
        result: suggestions,
        updatedAt: new Date().toISOString(),
      });
      
    } catch (error: any) {
      context.error(`[ContentSuggestionsWorker] Job ${jobId} failed:`, error);
      
      await updateJobStatus(jobId, 'failed', { error });
      await publishEvent({
        jobId,
        creatorId,
        status: 'failed',
        error: {
          code: error.code || 'UNKNOWN_ERROR',
          message: error.message,
        },
        updatedAt: new Date().toISOString(),
      });
      
      throw error;
    }
  },
});
```

### 9. Content Analysis Worker

```typescript
// src/functions/ContentAnalysisWorker.ts

import { app, InvocationContext } from '@azure/functions';
import { JobMessage } from '../lib/types';
import { publishEvent } from '../lib/service-bus';
import { updateJobStatus } from '../lib/database';
import { analyzeContent } from '../lib/azure-ai';

app.serviceBusTopic('ContentAnalysisWorker', {
  connection: 'SERVICEBUS_CONNECTION',
  topicName: '%TOPIC_JOBS%',
  subscriptionName: 'content-analysis',
  handler: async (message: JobMessage, context: InvocationContext) => {
    const { jobId, creatorId, payload } = message;
    
    context.log(`[ContentAnalysisWorker] Processing job ${jobId}`);
    
    try {
      await updateJobStatus(jobId, 'processing');
      
      const analysis = await analyzeContent({
        contentId: payload.contentId,
        contentType: payload.contentType,
        contentUrl: payload.contentUrl,
      });
      
      await updateJobStatus(jobId, 'completed', { result: analysis });
      await publishEvent({
        jobId,
        creatorId,
        status: 'completed',
        progress: 100,
        result: analysis,
        updatedAt: new Date().toISOString(),
      });
      
    } catch (error: any) {
      context.error(`[ContentAnalysisWorker] Job ${jobId} failed:`, error);
      
      await updateJobStatus(jobId, 'failed', { error });
      await publishEvent({
        jobId,
        creatorId,
        status: 'failed',
        error: {
          code: error.code || 'UNKNOWN_ERROR',
          message: error.message,
        },
        updatedAt: new Date().toISOString(),
      });
      
      throw error;
    }
  },
});
```

### 10. SignalR Notification Worker

```typescript
// src/functions/NotifySignalRWorker.ts

import { app, InvocationContext } from '@azure/functions';
import { EventMessage } from '../lib/types';

app.serviceBusTopic('NotifySignalRWorker', {
  connection: 'SERVICEBUS_CONNECTION',
  topicName: '%TOPIC_EVENTS%',
  subscriptionName: 'notify-signalr',
  handler: async (message: EventMessage, context: InvocationContext) => {
    const { jobId, creatorId, status, progress, result, error } = message;
    
    context.log(`[NotifySignalRWorker] Notifying creator ${creatorId} for job ${jobId}`);
    
    try {
      // Push notification via SignalR
      await context.extraOutputs.set('signalr', [{
        target: 'jobUpdate',
        arguments: [{ jobId, status, progress, result, error }],
        userId: creatorId,
      }]);
      
    } catch (err: any) {
      context.error(`[NotifySignalRWorker] Failed to notify:`, err);
      // Don't throw (notification failures shouldn't dead-letter)
    }
  },
  extraOutputs: [
    {
      type: 'signalR',
      name: 'signalr',
      hubName: 'huntaze',
      connectionStringSetting: 'AzureSignalRConnectionString',
    },
  ],
});
```

### 11. Email Notification Worker

```typescript
// src/functions/NotifyEmailWorker.ts

import { app, InvocationContext } from '@azure/functions';
import { EventMessage } from '../lib/types';
import { sendEmail } from '../lib/email';

app.serviceBusTopic('NotifyEmailWorker', {
  connection: 'SERVICEBUS_CONNECTION',
  topicName: '%TOPIC_EVENTS%',
  subscriptionName: 'notify-email',
  handler: async (message: EventMessage, context: InvocationContext) => {
    const { jobId, creatorId, status, result, error } = message;
    
    context.log(`[NotifyEmailWorker] Sending email to creator ${creatorId} for job ${jobId}`);
    
    try {
      // Get creator email from database
      const creator = await prisma.user.findUnique({
        where: { id: parseInt(creatorId) },
        select: { email: true, name: true },
      });
      
      if (!creator?.email) {
        context.warn(`[NotifyEmailWorker] No email for creator ${creatorId}`);
        return;
      }
      
      // Send email based on status
      if (status === 'completed') {
        await sendEmail({
          to: creator.email,
          subject: 'Your job is complete',
          template: 'job-completed',
          data: { name: creator.name, jobId, result },
        });
      } else if (status === 'failed') {
        await sendEmail({
          to: creator.email,
          subject: 'Your job failed',
          template: 'job-failed',
          data: { name: creator.name, jobId, error },
        });
      }
      
    } catch (err: any) {
      context.error(`[NotifyEmailWorker] Failed to send email:`, err);
      // Don't throw (email failures shouldn't dead-letter)
    }
  },
});
```

### 12. Webhook Notification Worker

```typescript
// src/functions/NotifyWebhookWorker.ts

import { app, InvocationContext } from '@azure/functions';
import { EventMessage } from '../lib/types';

app.serviceBusTopic('NotifyWebhookWorker', {
  connection: 'SERVICEBUS_CONNECTION',
  topicName: '%TOPIC_EVENTS%',
  subscriptionName: 'notify-webhook',
  handler: async (message: EventMessage, context: InvocationContext) => {
    const { jobId, creatorId, status, progress, result, error } = message;
    
    context.log(`[NotifyWebhookWorker] Sending webhook for creator ${creatorId}, job ${jobId}`);
    
    try {
      // Get creator webhook URL from database
      const creator = await prisma.user.findUnique({
        where: { id: parseInt(creatorId) },
        select: { webhookUrl: true },
      });
      
      if (!creator?.webhookUrl) {
        context.log(`[NotifyWebhookWorker] No webhook URL for creator ${creatorId}`);
        return;
      }
      
      // Send webhook
      const response = await fetch(creator.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Huntaze-Event': 'job.update',
          'X-Huntaze-Job-Id': jobId,
        },
        body: JSON.stringify({
          jobId,
          creatorId,
          status,
          progress,
          result,
          error,
          timestamp: new Date().toISOString(),
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Webhook failed: ${response.status} ${response.statusText}`);
      }
      
      context.log(`[NotifyWebhookWorker] Webhook sent successfully`);
      
    } catch (err: any) {
      context.error(`[NotifyWebhookWorker] Failed to send webhook:`, err);
      // Don't throw (webhook failures shouldn't dead-letter)
    }
  },
});
```

### 13. Azure AI Helper Functions

```typescript
// src/lib/azure-ai.ts

import { callAzureAI } from './azure-foundry-client';

export async function analyzeVideo(options: {
  videoUrl: string;
  signal: AbortSignal;
  onProgress?: (progress: number) => Promise<void>;
}): Promise<any> {
  const { videoUrl, signal, onProgress } = options;
  
  // Download video frames
  if (onProgress) await onProgress(10);
  
  // Extract keyframes
  if (onProgress) await onProgress(30);
  
  // Analyze with Phi-4 Multimodal
  const analysis = await callAzureAI({
    model: 'phi-4-multimodal',
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: 'Analyze this video for OnlyFans content trends.' },
          { type: 'image_url', image_url: { url: videoUrl } },
        ],
      },
    ],
    temperature: 0.3,
    maxTokens: 2000,
  });
  
  if (onProgress) await onProgress(100);
  
  return {
    scenes: analysis.scenes || [],
    objects: analysis.objects || [],
    transcript: analysis.transcript || '',
    sentiment: analysis.sentiment || 'neutral',
  };
}

export async function generateChatSuggestions(options: {
  fanMessage: string;
  context?: any;
}): Promise<string[]> {
  const response = await callAzureAI({
    model: 'phi4',
    messages: [
      { role: 'system', content: 'Generate 3 smart reply suggestions for OnlyFans chat.' },
      { role: 'user', content: `Fan message: ${options.fanMessage}\nContext: ${JSON.stringify(options.context)}` },
    ],
    temperature: 0.7,
    maxTokens: 300,
  });
  
  return response.content.split('\n').filter(Boolean).slice(0, 3);
}

export async function generateContentSuggestions(options: {
  contentType: string;
  tone: string;
  topic?: string;
}): Promise<any> {
  const response = await callAzureAI({
    model: 'deepseek',
    messages: [
      { role: 'system', content: 'Generate OnlyFans content suggestions.' },
      { role: 'user', content: `Type: ${options.contentType}\nTone: ${options.tone}\nTopic: ${options.topic || 'general'}` },
    ],
    temperature: 0.8,
    maxTokens: 500,
  });
  
  return {
    suggestions: response.content.split('\n').filter(Boolean),
    model: 'deepseek',
  };
}

export async function analyzeContent(options: {
  contentId: string;
  contentType: string;
  contentUrl: string;
}): Promise<any> {
  const response = await callAzureAI({
    model: 'deepseek',
    messages: [
      { role: 'system', content: 'Analyze OnlyFans content performance and engagement.' },
      { role: 'user', content: `Analyze content: ${options.contentUrl}` },
    ],
    temperature: 0.4,
    maxTokens: 800,
  });
  
  return {
    engagement: response.engagement || 0,
    sentiment: response.sentiment || 'neutral',
    recommendations: response.recommendations || [],
  };
}
```

---

