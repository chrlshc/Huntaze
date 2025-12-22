#!/bin/bash
# Nettoyage complet AWS - Toutes régions
# Supprime TOUTES les ressources Huntaze sauf Kiro

set -e
export AWS_PAGER=""

REGIONS="us-east-1 us-east-2 us-west-1 us-west-2 eu-west-1 eu-central-1"

echo "=== NETTOYAGE COMPLET AWS - TOUTES RÉGIONS ==="
echo ""

for region in $REGIONS; do
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "RÉGION: $region"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  
  # CloudWatch Alarms
  echo "→ CloudWatch Alarms..."
  ALARMS=$(aws cloudwatch describe-alarms --region $region --query 'MetricAlarms[?contains(AlarmName, `untaze`) || contains(AlarmName, `Huntaze`)].AlarmName' --output text 2>/dev/null || echo "")
  if [ -n "$ALARMS" ]; then
    aws cloudwatch delete-alarms --region $region --alarm-names $ALARMS 2>/dev/null && echo "  ✅ Alarms supprimées" || echo "  ⚠️ Erreur"
  else
    echo "  ○ Aucune"
  fi
  
  # ECS Clusters
  echo "→ ECS Clusters..."
  CLUSTERS=$(aws ecs list-clusters --region $region --query 'clusterArns[?contains(@, `untaze`) || contains(@, `huntaze`)]' --output text 2>/dev/null || echo "")
  if [ -n "$CLUSTERS" ]; then
    for cluster in $CLUSTERS; do
      CLUSTER_NAME=$(echo $cluster | awk -F'/' '{print $NF}')
      # Arrêter les services
      SERVICES=$(aws ecs list-services --region $region --cluster $CLUSTER_NAME --query 'serviceArns[*]' --output text 2>/dev/null || echo "")
      for service in $SERVICES; do
        aws ecs update-service --region $region --cluster $CLUSTER_NAME --service $service --desired-count 0 2>/dev/null
        aws ecs delete-service --region $region --cluster $CLUSTER_NAME --service $service --force 2>/dev/null
      done
      # Supprimer le cluster
      aws ecs delete-cluster --region $region --cluster $CLUSTER_NAME 2>/dev/null && echo "  ✅ Cluster $CLUSTER_NAME supprimé"
    done
  else
    echo "  ○ Aucun"
  fi
  
  # RDS Instances
  echo "→ RDS Instances..."
  DBS=$(aws rds describe-db-instances --region $region --query 'DBInstances[?contains(DBInstanceIdentifier, `untaze`) || contains(DBInstanceIdentifier, `huntaze`)].DBInstanceIdentifier' --output text 2>/dev/null || echo "")
  if [ -n "$DBS" ]; then
    for db in $DBS; do
      aws rds delete-db-instance --region $region --db-instance-identifier $db --skip-final-snapshot 2>/dev/null && echo "  ✅ RDS $db supprimé"
    done
  else
    echo "  ○ Aucune"
  fi
  
  # ElastiCache Clusters
  echo "→ ElastiCache..."
  REDIS=$(aws elasticache describe-cache-clusters --region $region --query 'CacheClusters[?contains(CacheClusterId, `untaze`) || contains(CacheClusterId, `huntaze`)].CacheClusterId' --output text 2>/dev/null || echo "")
  if [ -n "$REDIS" ]; then
    for cache in $REDIS; do
      aws elasticache delete-cache-cluster --region $region --cache-cluster-id $cache 2>/dev/null && echo "  ✅ Redis $cache supprimé"
    done
  else
    echo "  ○ Aucun"
  fi
  
  # Lambda Functions
  echo "→ Lambda Functions..."
  LAMBDAS=$(aws lambda list-functions --region $region --query 'Functions[?contains(FunctionName, `untaze`) || contains(FunctionName, `huntaze`)].FunctionName' --output text 2>/dev/null || echo "")
  if [ -n "$LAMBDAS" ]; then
    for func in $LAMBDAS; do
      aws lambda delete-function --region $region --function-name $func 2>/dev/null && echo "  ✅ Lambda $func supprimé"
    done
  else
    echo "  ○ Aucune"
  fi
  
  # SQS Queues
  echo "→ SQS Queues..."
  QUEUES=$(aws sqs list-queues --region $region --queue-name-prefix huntaze --query 'QueueUrls[*]' --output text 2>/dev/null || echo "")
  if [ -n "$QUEUES" ]; then
    for queue in $QUEUES; do
      aws sqs delete-queue --region $region --queue-url $queue 2>/dev/null && echo "  ✅ Queue supprimée"
    done
  else
    echo "  ○ Aucune"
  fi
  
  # EventBridge Rules
  echo "→ EventBridge Rules..."
  RULES=$(aws events list-rules --region $region --query 'Rules[?contains(Name, `untaze`) || contains(Name, `huntaze`)].Name' --output text 2>/dev/null || echo "")
  if [ -n "$RULES" ]; then
    for rule in $RULES; do
      # Supprimer les targets
      TARGETS=$(aws events list-targets-by-rule --region $region --rule $rule --query 'Targets[*].Id' --output text 2>/dev/null || echo "")
      if [ -n "$TARGETS" ]; then
        aws events remove-targets --region $region --rule $rule --ids $TARGETS 2>/dev/null
      fi
      aws events delete-rule --region $region --name $rule 2>/dev/null && echo "  ✅ Rule $rule supprimée"
    done
  else
    echo "  ○ Aucune"
  fi
  
  echo ""
done

# IAM Roles (global)
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "IAM ROLES (Global)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
ROLES=$(aws iam list-roles --query 'Roles[?contains(RoleName, `untaze`) || contains(RoleName, `huntaze`)].RoleName' --output text 2>/dev/null || echo "")
if [ -n "$ROLES" ]; then
  for role in $ROLES; do
    # Skip Kiro roles
    if [[ "$role" == *"kiro"* ]] || [[ "$role" == *"Kiro"* ]]; then
      echo "  ⏭️  Skipping Kiro role: $role"
      continue
    fi
    
    echo "→ Suppression de $role..."
    # Détacher policies managées
    for policy in $(aws iam list-attached-role-policies --role-name "$role" --query 'AttachedPolicies[*].PolicyArn' --output text 2>/dev/null); do
      aws iam detach-role-policy --role-name "$role" --policy-arn "$policy" 2>/dev/null
    done
    # Supprimer inline policies
    for policy in $(aws iam list-role-policies --role-name "$role" --query 'PolicyNames[*]' --output text 2>/dev/null); do
      aws iam delete-role-policy --role-name "$role" --policy-name "$policy" 2>/dev/null
    done
    # Supprimer instance profiles
    for profile in $(aws iam list-instance-profiles-for-role --role-name "$role" --query 'InstanceProfiles[*].InstanceProfileName' --output text 2>/dev/null); do
      aws iam remove-role-from-instance-profile --instance-profile-name "$profile" --role-name "$role" 2>/dev/null
    done
    # Supprimer le role
    aws iam delete-role --role-name "$role" 2>/dev/null && echo "  ✅ $role supprimé"
  done
else
  echo "○ Aucun role"
fi

# S3 Buckets (global)
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "S3 BUCKETS (Global)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
BUCKETS=$(aws s3 ls | grep -i huntaze | awk '{print $3}' || echo "")
if [ -n "$BUCKETS" ]; then
  for bucket in $BUCKETS; do
    echo "→ Suppression de $bucket..."
    aws s3 rb s3://$bucket --force 2>/dev/null && echo "  ✅ $bucket supprimé" || echo "  ⚠️ Erreur"
  done
else
  echo "○ Aucun bucket"
fi

# Secrets Manager (toutes régions)
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "SECRETS MANAGER"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
for region in $REGIONS; do
  SECRETS=$(aws secretsmanager list-secrets --region $region --query 'SecretList[?contains(Name, `untaze`) || contains(Name, `huntaze`)].Name' --output text 2>/dev/null || echo "")
  if [ -n "$SECRETS" ]; then
    echo "→ $region:"
    for secret in $SECRETS; do
      aws secretsmanager delete-secret --region $region --secret-id $secret --force-delete-without-recovery 2>/dev/null && echo "  ✅ $secret supprimé"
    done
  fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ NETTOYAGE TERMINÉ"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
