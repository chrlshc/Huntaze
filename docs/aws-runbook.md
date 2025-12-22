# AWS Runbook — Huntaze (Launch Readiness)

Ce document sert de runbook “launch readiness” (pré-prod/staging puis prod) avec une approche **read-only** (audit + checklists + commandes `describe/list`), sans actions destructrices.

## 1) DISCOVERY (repo)

### IaC / Déploiement trouvés

- **AWS Amplify (Next.js SSR / WEB_COMPUTE)**: `amplify.yml`, `.amplify/`, `docs/aws/README.md`
- **CloudFormation (ECS Fargate + ALB + VPC)**: `aws-infrastructure.yaml`
- **CloudFormation (CloudFront + S3 + logs/alarms)**: `infra/aws/cloudfront-distribution-stack.yaml`, `infra/aws/s3-bucket-stack.yaml`
- **CloudFormation (Video Processor ECS + S3 + SQS)**: `infra/aws/video-processor/cloudformation.yaml`, `infra/aws/video-processor/ecs-only.yaml`, `infra/aws/video-processor/s3-sqs.yaml`
- **Terraform (AI Router / ECS + ALB)**: `infra/aws/ecs-router-service.tf`, `infra/aws/terraform.tfvars`
- **Terraform (EventBridge cron + DLQ)**: `infra/aws/eventbridge-offers-cron.tf`
- **K8S CronJobs (HTTP triggers)**: `infra/k8s/cronjob-insights-summarizer.yaml`, `infra/k8s/cronjob-outbox-dispatcher.yaml`
- **Lambda@Edge + CloudFront scripts**: `lambda/edge/*`, `scripts/deploy-cloudfront.sh`, `scripts/deploy-lambda-edge.ts`, `scripts/setup-lambda-edge-alarms.ts`
- **CDK scaffold**: `infra/cdk/cdk.json`
- **Build pipeline (optionnel)**: `buildspec.yml`

### Environnements (staging/prod) & variables

- Templates Amplify: `config/amplify-env-vars/staging-template.yaml`, `config/amplify-env-vars/production-template.yaml`
- Référence env vars app: `docs/ENVIRONMENT_VARIABLES.md`, `.env.example`
- CloudFormation: param `EnvironmentName` (`aws-infrastructure.yaml`)
- Terraform AI Router: variables `environment` + `aws_region` (default `production`, `us-east-2`) dans `infra/aws/ecs-router-service.tf`
- Video processor: param `Environment` (`infra/aws/video-processor/*`)
- `config/amplify-env-vars/aws-config.json`: variables réservées (ne pas injecter `AWS_ACCESS_KEY_ID/SECRET` en runtime)

### Architecture (prévue / à confirmer côté AWS)

**Edge / CDN**
- **CloudFront** (distribution + policies + logs + alarms): `infra/aws/cloudfront-distribution-stack.yaml`
- **S3 assets** (versioning + lifecycle): `infra/aws/s3-bucket-stack.yaml`
- **Lambda@Edge** (security headers / image optimization): `lambda/edge/*`
- ⚠️ Le template CloudFront utilise un origin Vercel par défaut (`huntaze.vercel.app`). À aligner si prod = Amplify.

**Compute**
- **Amplify WEB_COMPUTE** (Next.js, VPC privé): `amplify.yml`
- **ECS Fargate + ALB** (stack app alternative/legacy): `aws-infrastructure.yaml`
- **AI Router** (ECS Fargate + ALB + autoscaling, region us-east-2): `infra/aws/ecs-router-service.tf`
- **Video Processor** (ECS worker + SQS + S3): `infra/aws/video-processor/*`
- **Cron HTTP**: EventBridge → `/api/cron/offers/*` (`infra/aws/eventbridge-offers-cron.tf`), K8S CronJobs → `/api/analytics/ai/summary/run`, `/api/admin/outbox/dispatch` (`infra/k8s/*`)

**Data**
- **PostgreSQL (RDS)** via `DATABASE_URL`: `docs/ENVIRONMENT_VARIABLES.md`
- **Redis (ElastiCache)** via `REDIS_HOST/REDIS_PORT` ou `REDIS_URL`: `docs/ENVIRONMENT_VARIABLES.md`
- **S3** assets + vidéos: `infra/aws/s3-bucket-stack.yaml`, `infra/aws/video-processor/*`
- **Secrets Manager** (AI Router): `infra/aws/ecs-router-service.tf` (`secrets`)

**Async / Queue / Email**
- **SQS** (video processing + DLQ): `infra/aws/video-processor/cloudformation.yaml`
- **EventBridge** (cron API destinations + DLQ + alarm): `infra/aws/eventbridge-offers-cron.tf`
- **SQS app** (files/code): `src/lib/queue/of-sqs.ts`, `src/lib/queue/of-queue.ts`
- **SES** emails: `docs/aws/SES-QUICK-START.md`

**Observabilité**
- **CloudWatch logs**: ECS task logs (`awslogs`), CloudFront logs (S3), Amplify logs (docs)
- **Alarms CloudFront** (5xx/cache/origin latency): `infra/aws/cloudfront-distribution-stack.yaml`
- **Alarm DLQ cron**: `infra/aws/eventbridge-offers-cron.tf`
- **Prometheus metrics**: `src/lib/prom.ts` + règles `infra/prometheus/rules-social.yaml`
- **Alerting / SLO**: `config/alerting-rules.yaml`, `config/slo.yaml`
- **Dashboards**: `config/grafana-dashboard-onboarding.json`
- **API monitoring**: `app/api/monitoring/*`, `app/api/metrics/*`
- **Logs + corrélation**: `lib/middleware/correlation-id.ts`, `docs/diagnostic-routes.md`

## Endpoints importants

### Health checks (app)

- **Liveness (LB)**: `GET /api/health` → 200 si config critique OK, sinon 503. (Code: `app/api/health/route.ts`)
- **Dependency checks**:
  - `GET /api/health/database`
  - `GET /api/health/auth`
  - `GET /api/health/config`
  - `GET /api/health/overall`
- **Diagnostic**:
  - `GET /api/ping`
  - `GET /api/health-check`
  - `GET /api/test-env`
- **Monitoring**:
  - `GET /api/monitoring/metrics`
  - `GET /api/monitoring/golden-signals` (valeurs simulées)
  - `POST /api/metrics`, `POST /api/metrics/batch`
- **Intégrations**:
  - `GET /api/validation/health`
- **Cron HTTP**:
  - `POST /api/cron/offers/expire`
  - `POST /api/cron/offers/activate`

### Health checks (AI Router)

- `GET /health` (ALB + container health check): `infra/aws/ecs-router-service.tf`

### Câblage LB / Target Group (IaC)

- CloudFormation ECS+ALB (app): `aws-infrastructure.yaml` → `HealthCheckPath: /api/health`.
- Terraform AI Router (ALB): `infra/aws/ecs-router-service.tf` → `path = "/health"`.
- Le worker vidéo n’est pas derrière ALB (SQS worker), health check = container interne (`infra/aws/video-processor/task-definition.json`).

### Stratégie recommandée (éviter les faux positifs)

- **LB health check = liveness**: endpoint rapide, sans dépendances externes.
- **Dependency checks séparés**: `/api/health/*` pour investigation/monitoring.
- **Canary**: Synthetics/cron externe vers `/api/health/overall` (staging).

## 2) Déployer / Rollback (sans actions risquées)

### Déploiement Amplify (recommandé)

- Déclencheur: push Git (staging/prod selon branches/config Amplify).
- Build pipeline: `amplify.yml`.
- Env vars: Amplify Console (templates: `config/amplify-env-vars/*`).

**Rollback**
- Amplify Console → redeploy un build précédent.
- Ou revert commit + push.

### Déploiement CloudFormation (ECS app / CloudFront / Video Processor)

- Stacks: `aws-infrastructure.yaml`, `infra/aws/cloudfront-distribution-stack.yaml`, `infra/aws/s3-bucket-stack.yaml`, `infra/aws/video-processor/*`.

**Rollback**
- Redeploy stack version précédente (CloudFormation).
- CloudFront: associer version Lambda@Edge précédente + invalidation si besoin.

### Déploiement Terraform (AI Router, EventBridge cron)

- Terraform: `infra/aws/ecs-router-service.tf`, `infra/aws/eventbridge-offers-cron.tf`.
- **⚠️ Ne pas exécuter `terraform apply` sans confirmation explicite**.

### K8S CronJobs (si utilisés)

- Manifests: `infra/k8s/*`.
- **⚠️ Tout `kubectl apply` est à valider au préalable**.

## 3) CHECKLIST “AVANT LAUNCH” (à compléter)

Checklist basée sur le repo + éléments à **confirmer en AWS**.

| Domaine | Statut | Évidence (repo) | À valider (read-only) / Action |
|---|---|---|---|
| IAM (credentials user-specific, pas partagés) | TODO | `amplify.yml` + `docs/ENVIRONMENT_VARIABLES.md` mentionnent `AWS_ACCESS_KEY_ID/SECRET`; `config/amplify-env-vars/aws-config.json` les réserve (ne pas set). | **Valider**: pas de clés long-terme en env runtime, MFA, least privilege. **Reco**: IAM roles + Secrets Manager/SSM. |
| Backups (snapshots/strategy) | TODO | Stratégie déclarée: `config/backup-config.yaml`, mention RDS dans `docs/AWS-INFRASTRUCTURE-AUDIT.md`. | **Confirmer**: RDS `BackupRetentionPeriod`, snapshots manuels, AWS Backup plan, chiffrement. |
| Recovery (test de restore) | TODO | Prévu dans `config/backup-config.yaml` (test_restore) mais pas de preuve. | **Faire**: restore sur staging + doc RTO/RPO. |
| Multi-AZ + réplication + test de panne | TODO | ALB multi-AZ (`aws-infrastructure.yaml`). Pas de config RDS/Redis dans IaC. | **Valider**: RDS `MultiAZ=true`, Redis replication group Multi-AZ + test failover. |
| Failover (LB/Route53) | TODO | CloudFront stack + ALB présents; pas de Route53 IaC. | **Valider**: Route53 health checks, ACM renouvellement, stratégie failover. |
| Patching / updates AMI/instances | TODO | ECR scan on push (ECS/Video Processor). | **Valider**: cycle de patch des images + dépendances. |
| Security groups corrects | TODO | SG ALB/ECS définis; mais `AssignPublicIp` activé (app/video/AI router). | **Valider**: subnets privés + SG restrictifs; pas de ports admin exposés. |
| Perf test avant go-live | TODO | Tests perf existants (k6, Lighthouse): `performance-budget.json`, docs perf. | **Faire**: charge sur staging + p95/p99. |
| SES: sortie de sandbox (prod email) | NOK | `docs/aws/README.md` + `docs/aws/SES-QUICK-START.md` indiquent sandbox. | **Action**: demander production access SES + DKIM/SPF/DMARC + alarmes bounce. |
| Monitoring/alerting de base | TODO | Règles Prometheus + alarmes CloudFront/DLQ définies. | **Valider**: alarmes ECS/RDS/Redis/SQS, destinations PagerDuty/Slack. |
| Secrets/state files dans repo | NOK | `infra/aws/terraform.tfstate`, `infra/terraform/production-hardening/terraform.tfstate`, `secrets-backup/*`. | **Action**: sortir du repo, rotation secrets si exposés. |

### IaC gaps / recommandations (sans apply)

- `aws-infrastructure.yaml` + `infra/aws/video-processor/*` + `infra/aws/ecs-router-service.tf`: **public IP** → passer en subnets privés + NAT.
- `aws-infrastructure.yaml`: ajouter redirection HTTP→HTTPS + listener 443 obligatoire en prod.
- `aws-infrastructure.yaml`: `ECSTaskRole` sans policies; définir least-privilege (S3/SES/SecretsManager).
- `amplify.yml`/docs: éviter `AWS_ACCESS_KEY_ID/SECRET` en env runtime; préférer IAM role.
- **Terraform state** dans git: migrer vers backend remote (S3 + DynamoDB lock) et purger du repo.
- **Régions**: app/us-east-1 vs AI router/us-east-2 → documenter “source of truth” par env.
- **Observabilité**: compléter alarmes ECS/RDS/Redis/SQS/ALB (5xx, latency, CPU/mem, queue age) + runbooks.
- **Backups**: formaliser AWS Backup plan + restore tests.

## 4) Monitoring & alerting (quoi faire quand ça sonne)

Références:
- `docs/MONITORING_ALERTING.md`
- `docs/runbooks/cloudwatch-alarms.md`
- `docs/runbooks/ecs-task-stop.md`
- `docs/runbooks/of-login-failure.md`
- `config/alerting-rules.yaml`, `infra/prometheus/rules-social.yaml`, `config/slo.yaml`

Playbooks “first response”:

- **CloudFront 5xxErrorRate / OriginLatency**: vérifier déploiement récent (Amplify/CloudFront), santé origin, rollback si spike post-deploy.
- **ALB TargetUnhealthy / 5xx**: vérifier `/api/health` (200), logs ECS, saturation CPU/Mem, erreurs DB.
- **ECS CPU/Mem high**: scale out, endpoints lents, DB pool saturé.
- **EventBridge cron DLQ**: vérifier auth `cron_secret`, endpoints `/api/cron/offers/*`, erreurs 5xx.
- **SQS DLQ (video processing)**: inspecter erreurs worker, quotas, taille fichiers, retry.
- **RDS connections/CPU/storage**: pool, slow queries, storage autoscaling.
- **Redis evictions/memory**: TTL/keys, resize cluster.
- **Prometheus social alerts**: check `/api/metrics` + logs corrélés (X-Correlation-Id).
- **SES bounce/complaints**: sandbox/prod access, SPF/DKIM/DMARC.

## 5) VALIDATION (read-only)

### AWS CLI (recommandé)

Objectif: confirmer l’état des services **sans exposer de secrets**.

Pré-flight:
- `aws sts get-caller-identity --output json`

IAM (users / access keys / roles):
- `aws iam get-account-summary --output json`
- `aws iam list-users --query 'Users[].UserName' --output table`
- `aws iam list-access-keys --user-name <user> --query 'AccessKeyMetadata[].{id:AccessKeyId,status:Status,create:CreateDate}' --output table`
- `aws iam list-roles --query 'Roles[?contains(RoleName, `huntaze`)].{name:RoleName,arn:Arn}' --output table`

Amplify (sans afficher env vars):
- `aws amplify get-app --app-id d33l77zi1h78ce --region us-east-1 --query 'app.{appId:appId,name:name,platform:platform,defaultDomain:defaultDomain,createTime:createTime,updateTime:updateTime,iamServiceRoleArn:iamServiceRoleArn}' --output json`
- `aws amplify list-branches --app-id d33l77zi1h78ce --region us-east-1 --query 'branches[].{branchName:branchName,stage:stage,framework:framework,enableAutoBuild:enableAutoBuild,lastDeployTime:lastDeployTime}' --output table`
- `aws amplify list-jobs --app-id d33l77zi1h78ce --branch-name main --region us-east-1 --query 'jobSummaries[].{jobId:jobId,status:status,startTime:startTime,endTime:endTime,commitId:commitId}' --output table`
- `aws amplify get-branch --app-id d33l77zi1h78ce --branch-name main --region us-east-1 --query 'keys(branch.environmentVariables)' --output json` (noms uniquement)

ALB / Target Groups:
- `aws elbv2 describe-target-groups --region us-east-1 --query 'TargetGroups[].{name:TargetGroupName,proto:Protocol,port:Port,hcPath:HealthCheckPath,matcher:Matcher.HttpCode,vpc:VpcId}' --output table`
- `aws elbv2 describe-target-groups --region us-east-2 --query 'TargetGroups[].{name:TargetGroupName,proto:Protocol,port:Port,hcPath:HealthCheckPath,matcher:Matcher.HttpCode,vpc:VpcId}' --output table`
- `aws elbv2 describe-target-health --region us-east-1 --target-group-arn <tg-arn> --query 'TargetHealthDescriptions[].{target:Target.Id,port:Target.Port,state:TargetHealth.State,reason:TargetHealth.Reason,description:TargetHealth.Description}' --output table`

CloudFront / S3:
- `aws cloudfront list-distributions --query 'DistributionList.Items[].{id:Id,domain:DomainName,status:Status,aliases:Aliases.Items}' --output table`
- `aws s3 ls | grep -i huntaze`

RDS (backups / Multi-AZ / encryption):
- `aws rds describe-db-instances --region us-east-1 --query 'DBInstances[?contains(DBInstanceIdentifier, `huntaze`)].{id:DBInstanceIdentifier,status:DBInstanceStatus,engine:Engine,engineVersion:EngineVersion,multiAZ:MultiAZ,backupRetention:BackupRetentionPeriod,storageEncrypted:StorageEncrypted,publiclyAccessible:PubliclyAccessible,vpc:DBSubnetGroup.VpcId}' --output table`
- `aws rds describe-db-snapshots --region us-east-1 --query 'DBSnapshots[?contains(DBInstanceIdentifier, `huntaze`)].{id:DBSnapshotIdentifier,type:SnapshotType,status:Status,created:SnapshotCreateTime}' --output table`

ElastiCache (Multi-AZ / failover / encryption):
- `aws elasticache describe-replication-groups --region us-east-1 --query 'ReplicationGroups[?contains(ReplicationGroupId, `huntaze`)].{id:ReplicationGroupId,status:Status,multiAZ:MultiAZ,automaticFailover:AutomaticFailover,atRestEncryption:AtRestEncryptionEnabled,transitEncryption:TransitEncryptionEnabled,nodeType:CacheNodeType}' --output table`
- `aws elasticache describe-snapshots --region us-east-1 --query 'Snapshots[?contains(ReplicationGroupId, `huntaze`)].{name:SnapshotName,status:SnapshotStatus,source:ReplicationGroupId}' --output table`

ECS (app/AI router/video):
- `aws ecs list-clusters --region us-east-1 --query 'clusterArns[?contains(@, `huntaze`)]' --output text`
- `aws ecs describe-clusters --region us-east-1 --clusters $(aws ecs list-clusters --region us-east-1 --query 'clusterArns[?contains(@, `huntaze`)]' --output text) --query 'clusters[].{name:clusterName,status:status,activeServices:activeServicesCount,runningTasks:runningTasksCount,pendingTasks:pendingTasksCount}' --output table`
- `aws ecs list-clusters --region us-east-2 --query 'clusterArns[?contains(@, `huntaze`)]' --output text`
- `aws ecs describe-clusters --region us-east-2 --clusters $(aws ecs list-clusters --region us-east-2 --query 'clusterArns[?contains(@, `huntaze`)]' --output text) --query 'clusters[].{name:clusterName,status:status,activeServices:activeServicesCount,runningTasks:runningTasksCount,pendingTasks:pendingTasksCount}' --output table`

EventBridge / SQS:
- `aws events list-rules --region us-east-1 --query 'Rules[?contains(Name, `huntaze`)].{name:Name,state:State,arn:Arn}' --output table`
- `aws sqs list-queues --region us-east-1 --queue-name-prefix huntaze --output json`
- `aws sqs get-queue-attributes --region us-east-1 --queue-url <queue-url> --attribute-names ApproximateNumberOfMessagesVisible,ApproximateNumberOfMessagesNotVisible,ApproximateAgeOfOldestMessage --output json`

CloudWatch (alarmes + logs):
- `aws cloudwatch describe-alarms --region us-east-1 --query 'MetricAlarms[?starts_with(AlarmName, `huntaze`) || starts_with(AlarmName, `Huntaze`) || contains(AlarmName, `CloudFront`) || contains(AlarmName, `Lambda`) ].{name:AlarmName,state:StateValue,updated:StateUpdatedTimestamp}' --output table`
- `aws logs describe-log-groups --region us-east-1 --query 'logGroups[?contains(logGroupName, `huntaze`) || contains(logGroupName, `amplify`) || contains(logGroupName, `ecs`) || contains(logGroupName, `video`)].{name:logGroupName,retention:retentionInDays}' --output table`

SES:
- `aws sesv2 get-account --region us-east-1 --query '{ProductionAccessEnabled:ProductionAccessEnabled,SendingEnabled:SendingEnabled,SendQuota:SendQuota}' --output json`
- `aws sesv2 list-email-identities --region us-east-1 --query 'EmailIdentities[].{name:IdentityName,type:IdentityType,verification:VerificationStatus,verifiedForSending:VerifiedForSendingStatus,sending:SendingEnabled}' --output table`
- `aws sesv2 get-email-identity --region us-east-1 --email-identity <domain-or-email> --query '{identity:IdentityName,verified:VerifiedForSendingStatus,dkim:DkimAttributes.Status,mailFrom:MailFromAttributes.MailFromDomainStatus}' --output json`

### Si AWS CLI n’est pas possible ici

Copiez-collez les sorties (ou minimum les lignes “Status/MultiAZ/BackupRetention/SendingEnabled”) des commandes ci-dessus, et je complète la checklist (OK/NOK/TODO).
