#!/bin/bash
# AWS Discovery Audit - Read-Only
# Région: us-east-2
# Usage: ./scripts/aws-discovery-audit.sh > aws-discovery-output.txt 2>&1

set -e
export AWS_DEFAULT_REGION=us-east-2

echo "=========================================="
echo "AWS DISCOVERY AUDIT - $(date)"
echo "Region: us-east-2"
echo "=========================================="

echo ""
echo "=== 1. IDENTITY & ACCOUNT ==="
aws sts get-caller-identity 2>/dev/null || echo "❌ STS: InvalidClientTokenId ou pas de credentials"

echo ""
echo "=== 2. AMPLIFY APPS ==="
aws amplify list-apps --query 'apps[*].[name,appId,defaultDomain,productionBranch.branchName,platform]' --output table 2>/dev/null || echo "❌ Amplify: Aucune app ou accès refusé"

echo ""
echo "=== 3. CLOUDFRONT DISTRIBUTIONS ==="
aws cloudfront list-distributions --query 'DistributionList.Items[*].[Id,DomainName,Origins.Items[0].DomainName,Aliases.Items[0],Status]' --output table 2>/dev/null || echo "❌ CloudFront: Aucune distribution"

echo ""
echo "=== 4. ECS CLUSTERS & SERVICES ==="
echo "--- Clusters ---"
CLUSTERS=$(aws ecs list-clusters --query 'clusterArns[*]' --output text 2>/dev/null)
if [ -n "$CLUSTERS" ]; then
  for cluster in $CLUSTERS; do
    CLUSTER_NAME=$(echo $cluster | awk -F'/' '{print $NF}')
    echo "Cluster: $CLUSTER_NAME"
    aws ecs list-services --cluster $CLUSTER_NAME --query 'serviceArns[*]' --output table 2>/dev/null
    aws ecs describe-services --cluster $CLUSTER_NAME --services $(aws ecs list-services --cluster $CLUSTER_NAME --query 'serviceArns[*]' --output text 2>/dev/null | head -5) --query 'services[*].[serviceName,status,desiredCount,runningCount]' --output table 2>/dev/null || true
  done
else
  echo "❌ ECS: Aucun cluster"
fi

echo ""
echo "=== 5. ECR REPOSITORIES ==="
aws ecr describe-repositories --query 'repositories[*].[repositoryName,repositoryUri]' --output table 2>/dev/null || echo "❌ ECR: Aucun repo"

echo ""
echo "=== 6. RDS INSTANCES ==="
aws rds describe-db-instances --query 'DBInstances[*].[DBInstanceIdentifier,DBInstanceStatus,Engine,DBInstanceClass,MultiAZ,PubliclyAccessible]' --output table 2>/dev/null || echo "❌ RDS: Aucune instance"

echo ""
echo "=== 7. ELASTICACHE (Redis) ==="
aws elasticache describe-cache-clusters --query 'CacheClusters[*].[CacheClusterId,CacheNodeType,Engine,CacheClusterStatus,NumCacheNodes]' --output table 2>/dev/null || echo "❌ ElastiCache: Aucun cluster"

echo ""
echo "=== 8. SQS QUEUES ==="
aws sqs list-queues --query 'QueueUrls[*]' --output table 2>/dev/null || echo "❌ SQS: Aucune queue"

echo ""
echo "=== 9. EVENTBRIDGE RULES ==="
aws events list-rules --query 'Rules[*].[Name,State,ScheduleExpression]' --output table 2>/dev/null || echo "❌ EventBridge: Aucune règle"

echo ""
echo "=== 10. LAMBDA FUNCTIONS ==="
aws lambda list-functions --query 'Functions[*].[FunctionName,Runtime,MemorySize,Timeout]' --output table 2>/dev/null || echo "❌ Lambda: Aucune fonction"

echo ""
echo "=== 11. S3 BUCKETS ==="
aws s3api list-buckets --query 'Buckets[*].[Name,CreationDate]' --output table 2>/dev/null || echo "❌ S3: Aucun bucket"

echo ""
echo "=== 12. SECRETS MANAGER ==="
aws secretsmanager list-secrets --query 'SecretList[*].[Name,LastAccessedDate]' --output table 2>/dev/null || echo "❌ Secrets Manager: Aucun secret"

echo ""
echo "=== 13. VPC & SUBNETS ==="
echo "--- VPCs ---"
aws ec2 describe-vpcs --query 'Vpcs[*].[VpcId,CidrBlock,IsDefault,Tags[?Key==`Name`].Value|[0]]' --output table 2>/dev/null || echo "❌ VPC: Erreur"
echo "--- Subnets ---"
aws ec2 describe-subnets --query 'Subnets[*].[SubnetId,VpcId,CidrBlock,AvailabilityZone,MapPublicIpOnLaunch,Tags[?Key==`Name`].Value|[0]]' --output table 2>/dev/null || echo "❌ Subnets: Erreur"

echo ""
echo "=== 14. LOAD BALANCERS ==="
aws elbv2 describe-load-balancers --query 'LoadBalancers[*].[LoadBalancerName,Type,Scheme,State.Code,DNSName]' --output table 2>/dev/null || echo "❌ ALB/NLB: Aucun"

echo ""
echo "=== 15. CLOUDWATCH ALARMS ==="
aws cloudwatch describe-alarms --query 'MetricAlarms[*].[AlarmName,StateValue,MetricName,Namespace]' --output table 2>/dev/null || echo "❌ CloudWatch: Aucune alarme"

echo ""
echo "=== 16. IAM ROLES (ECS/Lambda related) ==="
aws iam list-roles --query 'Roles[?contains(RoleName, `ecs`) || contains(RoleName, `lambda`) || contains(RoleName, `amplify`)].RoleName' --output table 2>/dev/null || echo "❌ IAM: Erreur"

echo ""
echo "=========================================="
echo "DISCOVERY COMPLETE - $(date)"
echo "=========================================="
