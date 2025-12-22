#!/bin/bash
# Découverte complète AWS - Toutes régions
# Audit read-only de toutes les ressources

set -e
export AWS_PAGER=""

# Toutes les régions AWS principales
REGIONS="us-east-1 us-east-2 us-west-1 us-west-2 eu-west-1 eu-west-2 eu-central-1 ap-southeast-1 ap-northeast-1"

echo "═══════════════════════════════════════════════════════════"
echo "  AWS FULL DISCOVERY - TOUTES RÉGIONS"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Vérifier les credentials
echo "→ Vérification des credentials AWS..."
aws sts get-caller-identity --output json || { echo "❌ Erreur credentials AWS"; exit 1; }
echo ""

# Résumé global
echo "═══════════════════════════════════════════════════════════"
echo "  RÉSUMÉ GLOBAL"
echo "═══════════════════════════════════════════════════════════"

TOTAL_RESOURCES=0

for region in $REGIONS; do
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "  RÉGION: $region"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  
  REGION_COUNT=0
  
  # EC2 Instances
  echo "→ EC2 Instances..."
  EC2_COUNT=$(aws ec2 describe-instances --region $region --query 'Reservations[*].Instances[*].[InstanceId,State.Name,InstanceType,Tags[?Key==`Name`].Value|[0]]' --output text 2>/dev/null | wc -l || echo "0")
  if [ "$EC2_COUNT" -gt 0 ]; then
    echo "  📦 $EC2_COUNT instances"
    aws ec2 describe-instances --region $region --query 'Reservations[*].Instances[*].[InstanceId,State.Name,InstanceType,Tags[?Key==`Name`].Value|[0]]' --output table 2>/dev/null || true
    REGION_COUNT=$((REGION_COUNT + EC2_COUNT))
  else
    echo "  ○ Aucune"
  fi
  
  # ECS Clusters
  echo "→ ECS Clusters..."
  CLUSTERS=$(aws ecs list-clusters --region $region --query 'clusterArns[*]' --output text 2>/dev/null || echo "")
  if [ -n "$CLUSTERS" ]; then
    CLUSTER_COUNT=$(echo "$CLUSTERS" | wc -w)
    echo "  📦 $CLUSTER_COUNT clusters"
    for cluster in $CLUSTERS; do
      CLUSTER_NAME=$(echo $cluster | awk -F'/' '{print $NF}')
      echo "    • $CLUSTER_NAME"
      # Services
      SERVICES=$(aws ecs list-services --region $region --cluster $CLUSTER_NAME --query 'serviceArns[*]' --output text 2>/dev/null || echo "")
      if [ -n "$SERVICES" ]; then
        SERVICE_COUNT=$(echo "$SERVICES" | wc -w)
        echo "      → $SERVICE_COUNT services"
        REGION_COUNT=$((REGION_COUNT + SERVICE_COUNT))
      fi
      # Tasks
      TASKS=$(aws ecs list-tasks --region $region --cluster $CLUSTER_NAME --query 'taskArns[*]' --output text 2>/dev/null || echo "")
      if [ -n "$TASKS" ]; then
        TASK_COUNT=$(echo "$TASKS" | wc -w)
        echo "      → $TASK_COUNT tasks running"
      fi
    done
    REGION_COUNT=$((REGION_COUNT + CLUSTER_COUNT))
  else
    echo "  ○ Aucun"
  fi
  
  # RDS Instances
  echo "→ RDS Instances..."
  DBS=$(aws rds describe-db-instances --region $region --query 'DBInstances[*].[DBInstanceIdentifier,DBInstanceStatus,Engine,MultiAZ,PubliclyAccessible]' --output text 2>/dev/null || echo "")
  if [ -n "$DBS" ]; then
    DB_COUNT=$(echo "$DBS" | wc -l)
    echo "  📦 $DB_COUNT databases"
    echo "$DBS" | while read line; do echo "    • $line"; done
    REGION_COUNT=$((REGION_COUNT + DB_COUNT))
  else
    echo "  ○ Aucune"
  fi
  
  # ElastiCache
  echo "→ ElastiCache Clusters..."
  REDIS=$(aws elasticache describe-cache-clusters --region $region --query 'CacheClusters[*].[CacheClusterId,CacheClusterStatus,CacheNodeType]' --output text 2>/dev/null || echo "")
  if [ -n "$REDIS" ]; then
    REDIS_COUNT=$(echo "$REDIS" | wc -l)
    echo "  📦 $REDIS_COUNT clusters"
    echo "$REDIS" | while read line; do echo "    • $line"; done
    REGION_COUNT=$((REGION_COUNT + REDIS_COUNT))
  else
    echo "  ○ Aucun"
  fi
  
  # Lambda Functions
  echo "→ Lambda Functions..."
  LAMBDAS=$(aws lambda list-functions --region $region --query 'Functions[*].[FunctionName,Runtime,LastModified]' --output text 2>/dev/null || echo "")
  if [ -n "$LAMBDAS" ]; then
    LAMBDA_COUNT=$(echo "$LAMBDAS" | wc -l)
    echo "  📦 $LAMBDA_COUNT functions"
    echo "$LAMBDAS" | while read line; do echo "    • $line"; done
    REGION_COUNT=$((REGION_COUNT + LAMBDA_COUNT))
  else
    echo "  ○ Aucune"
  fi
  
  # ALB/NLB
  echo "→ Load Balancers..."
  LBS=$(aws elbv2 describe-load-balancers --region $region --query 'LoadBalancers[*].[LoadBalancerName,Type,State.Code,Scheme]' --output text 2>/dev/null || echo "")
  if [ -n "$LBS" ]; then
    LB_COUNT=$(echo "$LBS" | wc -l)
    echo "  📦 $LB_COUNT load balancers"
    echo "$LBS" | while read line; do echo "    • $line"; done
    REGION_COUNT=$((REGION_COUNT + LB_COUNT))
  else
    echo "  ○ Aucun"
  fi
  
  # SQS Queues
  echo "→ SQS Queues..."
  QUEUES=$(aws sqs list-queues --region $region --query 'QueueUrls[*]' --output text 2>/dev/null || echo "")
  if [ -n "$QUEUES" ]; then
    QUEUE_COUNT=$(echo "$QUEUES" | wc -w)
    echo "  📦 $QUEUE_COUNT queues"
    echo "$QUEUES" | while read line; do echo "    • $(basename $line)"; done
    REGION_COUNT=$((REGION_COUNT + QUEUE_COUNT))
  else
    echo "  ○ Aucune"
  fi
  
  # EventBridge Rules
  echo "→ EventBridge Rules..."
  RULES=$(aws events list-rules --region $region --query 'Rules[*].[Name,State]' --output text 2>/dev/null || echo "")
  if [ -n "$RULES" ]; then
    RULE_COUNT=$(echo "$RULES" | wc -l)
    echo "  📦 $RULE_COUNT rules"
    echo "$RULES" | while read line; do echo "    • $line"; done
    REGION_COUNT=$((REGION_COUNT + RULE_COUNT))
  else
    echo "  ○ Aucune"
  fi
  
  # CloudWatch Alarms
  echo "→ CloudWatch Alarms..."
  ALARMS=$(aws cloudwatch describe-alarms --region $region --query 'MetricAlarms[*].[AlarmName,StateValue]' --output text 2>/dev/null || echo "")
  if [ -n "$ALARMS" ]; then
    ALARM_COUNT=$(echo "$ALARMS" | wc -l)
    echo "  📦 $ALARM_COUNT alarms"
    REGION_COUNT=$((REGION_COUNT + ALARM_COUNT))
  else
    echo "  ○ Aucune"
  fi
  
  # Secrets Manager
  echo "→ Secrets Manager..."
  SECRETS=$(aws secretsmanager list-secrets --region $region --query 'SecretList[*].Name' --output text 2>/dev/null || echo "")
  if [ -n "$SECRETS" ]; then
    SECRET_COUNT=$(echo "$SECRETS" | wc -w)
    echo "  📦 $SECRET_COUNT secrets"
    echo "$SECRETS" | while read line; do echo "    • $line"; done
    REGION_COUNT=$((REGION_COUNT + SECRET_COUNT))
  else
    echo "  ○ Aucun"
  fi
  
  # VPCs
  echo "→ VPCs..."
  VPCS=$(aws ec2 describe-vpcs --region $region --query 'Vpcs[*].[VpcId,IsDefault,Tags[?Key==`Name`].Value|[0]]' --output text 2>/dev/null || echo "")
  if [ -n "$VPCS" ]; then
    VPC_COUNT=$(echo "$VPCS" | wc -l)
    echo "  📦 $VPC_COUNT VPCs"
    echo "$VPCS" | while read line; do echo "    • $line"; done
  else
    echo "  ○ Aucun"
  fi
  
  echo ""
  echo "  📊 Total région $region: $REGION_COUNT ressources"
  TOTAL_RESOURCES=$((TOTAL_RESOURCES + REGION_COUNT))
done

# Ressources globales
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  RESSOURCES GLOBALES"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# IAM Users
echo "→ IAM Users..."
USERS=$(aws iam list-users --query 'Users[*].UserName' --output text 2>/dev/null || echo "")
if [ -n "$USERS" ]; then
  USER_COUNT=$(echo "$USERS" | wc -w)
  echo "  📦 $USER_COUNT users"
  echo "$USERS" | while read line; do echo "    • $line"; done
  TOTAL_RESOURCES=$((TOTAL_RESOURCES + USER_COUNT))
else
  echo "  ○ Aucun"
fi

# IAM Roles
echo "→ IAM Roles (huntaze/kiro)..."
ROLES=$(aws iam list-roles --query 'Roles[?contains(RoleName, `untaze`) || contains(RoleName, `huntaze`) || contains(RoleName, `kiro`) || contains(RoleName, `Kiro`)].RoleName' --output text 2>/dev/null || echo "")
if [ -n "$ROLES" ]; then
  ROLE_COUNT=$(echo "$ROLES" | wc -w)
  echo "  📦 $ROLE_COUNT roles"
  echo "$ROLES" | while read line; do echo "    • $line"; done
  TOTAL_RESOURCES=$((TOTAL_RESOURCES + ROLE_COUNT))
else
  echo "  ○ Aucun"
fi

# S3 Buckets
echo "→ S3 Buckets..."
BUCKETS=$(aws s3 ls 2>/dev/null | awk '{print $3}' || echo "")
if [ -n "$BUCKETS" ]; then
  BUCKET_COUNT=$(echo "$BUCKETS" | wc -l)
  echo "  📦 $BUCKET_COUNT buckets"
  echo "$BUCKETS" | while read line; do echo "    • $line"; done
  TOTAL_RESOURCES=$((TOTAL_RESOURCES + BUCKET_COUNT))
else
  echo "  ○ Aucun"
fi

# CloudFront Distributions
echo "→ CloudFront Distributions..."
DISTROS=$(aws cloudfront list-distributions --query 'DistributionList.Items[*].[Id,DomainName,Status]' --output text 2>/dev/null || echo "")
if [ -n "$DISTROS" ]; then
  DISTRO_COUNT=$(echo "$DISTROS" | wc -l)
  echo "  📦 $DISTRO_COUNT distributions"
  echo "$DISTROS" | while read line; do echo "    • $line"; done
  TOTAL_RESOURCES=$((TOTAL_RESOURCES + DISTRO_COUNT))
else
  echo "  ○ Aucune"
fi

# Amplify Apps
echo "→ Amplify Apps (us-east-1)..."
APPS=$(aws amplify list-apps --region us-east-1 --query 'apps[*].[appId,name,defaultDomain]' --output text 2>/dev/null || echo "")
if [ -n "$APPS" ]; then
  APP_COUNT=$(echo "$APPS" | wc -l)
  echo "  📦 $APP_COUNT apps"
  echo "$APPS" | while read line; do echo "    • $line"; done
  TOTAL_RESOURCES=$((TOTAL_RESOURCES + APP_COUNT))
else
  echo "  ○ Aucune"
fi

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  📊 TOTAL GLOBAL: $TOTAL_RESOURCES ressources"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "✅ Découverte terminée"
