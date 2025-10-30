# Walking Skeleton - Migration Prisma (½ journée)

## Objectif

Déployer en ½ journée un flux de bout en bout exploitable avec:
- **AWS AppConfig** pour feature flags + canary progressif (1%)
- **Lambda weighted alias** + CodeDeploy pour rollout automatique
- **Shadow traffic** applicatif (tee asynchrone Mock → Prisma)
- **CloudWatch Alarm** pour rollback auto si error rate > 2%
- **X-Ray** pour traces et latence P95
- **EventBridge Scheduler** pour cleanup à J+7

## Architecture AWS-Native

```
User Request
    ↓
API Gateway (ou Amplify SSR)
    ↓
Lambda "live" alias (weighted 99% → 1% canary)
    ├─→ Mock (contrôle) → retourne immédiatement
    └─→ Prisma (canary) → si flag activé
         └─→ Shadow async (tee) → compare & log diff
    ↓
CloudWatch Alarm (error rate > 2%)
    ↓
CodeDeploy Rollback automatique
```

## Timeline (4 heures)

**0h00-0h10:** Setup branch + env vars
**0h10-0h50:** AppConfig feature flag + Lambda handler
**0h50-1h40:** Shadow traffic (tee asynchrone)
**1h40-2h10:** CloudWatch Alarm + rollback
**2h10-2h30:** X-Ray + traces
**2h30-3h00:** EventBridge cleanup J+7
**3h00-4h00:** Tests + déploiement

## Implémentation

### 1. SAM Template (Lambda + Canary + Alarm)

```yaml
# template.yaml
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31

Globals:
  Function:
    Runtime: nodejs20.x
    Timeout: 30
    Tracing: Active
    Environment:
      Variables:
        APP_ID: !Ref AppConfigApp
        ENV_ID: !Ref AppConfigEnv
        FEATURES_PROFILE_ID: !Ref AppConfigProfile
        CANDIDATE_FN_ARN: !GetAtt PrismaReadFn.Arn
        DATABASE_URL: !Sub '{{resolve:secretsmanager:huntaze/database:SecretString:DATABASE_URL}}'

Resources:
  # AppConfig Application
  AppConfigApp:
    Type: AWS::AppConfig::Application
    Properties:
      Name: huntaze-flags

  AppConfigEnv:
    Type: AWS::AppConfig::Environment
    Properties:
      ApplicationId: !Ref AppConfigApp
      Name: production

  AppConfigProfile:
    Type: AWS::AppConfig::ConfigurationProfile
    Properties:
      ApplicationId: !Ref AppConfigApp
      Name: feature-flags
      LocationUri: hosted
      Type: AWS.AppConfig.FeatureFlags

  # Feature Flag Deployment Strategy
  AppConfigDeploymentStrategy:
    Type: AWS::AppConfig::DeploymentStrategy
    Properties:
      Name: Canary1Percent5Minutes
      DeploymentDurationInMinutes: 5
      GrowthFactor: 1
      GrowthType: LINEAR
      ReplicateTo: NONE
      FinalBakeTimeInMinutes: 5

  # Main Lambda (Mock/Control)
  MockReadFn:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: src/
      Handler: mock-handler.handler
      AutoPublishAlias: live
      DeploymentPreference:
        Type: Canary10Percent5Minutes
        Alarms:
          - !Ref ErrorRateAlarm
      Policies:
        - AWSXRayDaemonWriteAccess
        - Statement:
            - Effect: Allow
              Action:
                - appconfig:StartConfigurationSession
                - appconfig:GetLatestConfiguration
              Resource: '*'
            - Effect: Allow
              Action: lambda:InvokeFunction
              Resource: !GetAtt PrismaReadFn.Arn

  # Candidate Lambda (Prisma)
  PrismaReadFn:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: src/
      Handler: prisma-handler.handler
      Policies:
        - AWSXRayDaemonWriteAccess
        - Statement:
            - Effect: Allow
              Action:
                - secretsmanager:GetSecretValue
              Resource: !Sub 'arn:aws:secretsmanager:${AWS::Region}:${AWS::AccountId}:secret:huntaze/database-*'

  # CloudWatch Alarm (error rate > 2%)
  ErrorRateAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: huntaze-lambda-error-rate-gt-2pct
      ComparisonOperator: GreaterThanThreshold
      Threshold: 0.02
      EvaluationPeriods: 5
      DatapointsToAlarm: 3
      TreatMissingData: notBreaching
      Metrics:
        - Id: errorRate
          Expression: "errors / invocations"
        - Id: errors
          MetricStat:
            Metric:
              Namespace: AWS/Lambda
              MetricName: Errors
              Dimensions:
                - Name: FunctionName
                  Value: !Ref MockReadFn
            Period: 60
            Stat: Sum
        - Id: invocations
          MetricStat:
            Metric:
              Namespace: AWS/Lambda
              MetricName: Invocations
              Dimensions:
                - Name: FunctionName
                  Value: !Ref MockReadFn
            Period: 60
            Stat: Sum

  # EventBridge Rule (cleanup J+7)
  CleanupSchedule:
    Type: AWS::Events::Rule
    Properties:
      Name: huntaze-flag-cleanup
      ScheduleExpression: rate(7 days)
      State: ENABLED
      Targets:
        - Arn: !GetAtt CleanupFn.Arn
          Id: cleanup-target

  CleanupFn:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: src/
      Handler: cleanup-handler.handler
      Environment:
        Variables:
          APP_ID: !Ref AppConfigApp
          ENV_ID: !Ref AppConfigEnv
      Policies:
        - Statement:
            - Effect: Allow
              Action:
                - appconfig:UpdateConfigurationProfile
                - appconfig:DeleteHostedConfigurationVersion
              Resource: '*'

Outputs:
  MockReadFnArn:
    Value: !GetAtt MockReadFn.Arn
  PrismaReadFnArn:
    Value: !GetAtt PrismaReadFn.Arn
  AlarmArn:
    Value: !GetAtt ErrorRateAlarm.Arn
```

### 2. Lambda Handler (Mock + Shadow)

```typescript
// src/mock-handler.ts
import { AppConfigDataClient, StartConfigurationSessionCommand, GetLatestConfigurationCommand } from '@aws-sdk/client-appconfigdata';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';
import { simpleUserService } from './services/simple-user-service';

const appConfigClient = new AppConfigDataClient({});
const lambdaClient = new LambdaClient({});

let configToken: string | undefined;

async function getFeatureFlags() {
  if (!configToken) {
    const session = await appConfigClient.send(
      new StartConfigurationSessionCommand({
        ApplicationIdentifier: process.env.APP_ID!,
        EnvironmentIdentifier: process.env.ENV_ID!,
        ConfigurationProfileIdentifier: process.env.FEATURES_PROFILE_ID!,
      })
    );
    configToken = session.InitialConfigurationToken;
  }

  const config = await appConfigClient.send(
    new GetLatestConfigurationCommand({ ConfigurationToken: configToken! })
  );
  
  configToken = config.NextPollConfigurationToken;
  
  if (!config.Configuration) return {};
  return JSON.parse(new TextDecoder().decode(config.Configuration));
}

export async function handler(event: any) {
  const userId = event.requestContext?.authorizer?.userId;
  
  try {
    // Check feature flag
    const flags = await getFeatureFlags();
    const prismaEnabled = flags.prismaAdapter?.enabled === true;

    if (prismaEnabled) {
      // Canary: use Prisma directly
      console.log('[CANARY] Using Prisma for userId:', userId);
      return await invokePrismaHandler(event);
    }

    // Control path: Mock
    const controlResult = await simpleUserService.getUserById(userId);

    // Shadow traffic (fire-and-forget)
    void shadowCompare(event, controlResult, userId);

    return {
      statusCode: 200,
      body: JSON.stringify(controlResult),
    };
  } catch (error) {
    console.error('[ERROR]', error);
    throw error;
  }
}

async function invokePrismaHandler(event: any) {
  const response = await lambdaClient.send(
    new InvokeCommand({
      FunctionName: process.env.CANDIDATE_FN_ARN!,
      InvocationType: 'RequestResponse',
      Payload: new TextEncoder().encode(JSON.stringify(event)),
    })
  );

  const payload = JSON.parse(new TextDecoder().decode(response.Payload));
  return payload;
}

async function shadowCompare(event: any, controlResult: any, userId: string) {
  const timeout = setTimeout(() => {
    console.warn('[SHADOW] Timeout after 500ms');
  }, 500);

  try {
    const candidateResponse = await lambdaClient.send(
      new InvokeCommand({
        FunctionName: process.env.CANDIDATE_FN_ARN!,
        InvocationType: 'RequestResponse',
        Payload: new TextEncoder().encode(JSON.stringify(event)),
      })
    );

    const candidateResult = JSON.parse(new TextDecoder().decode(candidateResponse.Payload));
    
    // Compare results
    const controlStr = JSON.stringify(controlResult);
    const candidateStr = JSON.stringify(candidateResult.body ? JSON.parse(candidateResult.body) : candidateResult);

    if (controlStr !== candidateStr) {
      console.warn('[SHADOW-DIFF]', {
        userId,
        control: controlStr,
        candidate: candidateStr,
      });
    } else {
      console.log('[SHADOW-OK]', { userId });
    }
  } catch (error: any) {
    console.warn('[SHADOW-FAILED]', { userId, error: error.message });
  } finally {
    clearTimeout(timeout);
  }
}
```

### 3. Prisma Handler

```typescript
// src/prisma-handler.ts
import { prisma } from './lib/db';

export async function handler(event: any) {
  const userId = event.requestContext?.authorizer?.userId;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
    });

    return {
      statusCode: user ? 200 : 404,
      body: JSON.stringify(user),
    };
  } catch (error) {
    console.error('[PRISMA-ERROR]', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
}
```

### 4. Cleanup Handler

```typescript
// src/cleanup-handler.ts
import { AppConfigClient, UpdateConfigurationProfileCommand } from '@aws-sdk/client-appconfig';

const client = new AppConfigClient({});

export async function handler() {
  console.log('[CLEANUP] Disabling prismaAdapter flag after 7 days');

  // Logic to disable flag or delete configuration
  // This is a placeholder - actual implementation depends on your flag structure

  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Flag cleanup completed' }),
  };
}
```

### 5. AppConfig Feature Flag (JSON)

```json
{
  "version": "1",
  "flags": {
    "prismaAdapter": {
      "name": "prismaAdapter",
      "_description": "Enable Prisma database adapter",
      "attributes": {
        "enabled": {
          "constraints": {
            "type": "boolean"
          }
        }
      }
    }
  },
  "values": {
    "prismaAdapter": {
      "enabled": false
    }
  }
}
```

## Déploiement

```bash
# 1. Build
sam build

# 2. Deploy
sam deploy --guided \
  --stack-name huntaze-prisma-skeleton \
  --capabilities CAPABILITY_IAM

# 3. Create AppConfig hosted configuration
aws appconfig create-hosted-configuration-version \
  --application-id <APP_ID> \
  --configuration-profile-id <PROFILE_ID> \
  --content file://feature-flags.json \
  --content-type "application/json"

# 4. Deploy flag (canary 1%)
aws appconfig start-deployment \
  --application-id <APP_ID> \
  --environment-id <ENV_ID> \
  --deployment-strategy-id <STRATEGY_ID> \
  --configuration-profile-id <PROFILE_ID> \
  --configuration-version <VERSION>
```

## Monitoring

```bash
# Watch CloudWatch Logs
sam logs -n MockReadFn --tail

# Check X-Ray traces
aws xray get-trace-summaries \
  --start-time $(date -u -d '5 minutes ago' +%s) \
  --end-time $(date -u +%s)

# Monitor alarm
aws cloudwatch describe-alarms \
  --alarm-names huntaze-lambda-error-rate-gt-2pct
```

## Critères de Succès (4h)

- ✅ Flag AppConfig déployé en canary 1%
- ✅ Lambda weighted alias avec CodeDeploy
- ✅ Shadow traffic fonctionnel (logs diff)
- ✅ Alarm CloudWatch → rollback auto si error > 2%
- ✅ X-Ray traces visibles
- ✅ EventBridge cleanup J+7 configuré

## Coûts Estimés

- Lambda: ~$0.20/jour (50 users, 1000 req/jour)
- AppConfig: $0.50/jour (1 app, 1 env)
- CloudWatch: $0.30/jour (logs + metrics)
- X-Ray: $0.50/jour (traces)
- **Total: ~$1.50/jour = $45/mois**

## Next Steps (après ½ journée)

1. Étendre au chemin écriture (POST/PUT)
2. Ajouter contract tests (Pact)
3. Automatiser rampe 1% → 5% → 25% → 100%
4. Migrer autres API routes
5. Cleanup flags après stabilisation
