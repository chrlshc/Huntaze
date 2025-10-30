/**
 * Huntaze OnlyFans CDK Stack Tests
 * 
 * Tests the infrastructure configuration for OnlyFans integration:
 * - VPC and networking setup
 * - DynamoDB tables configuration
 * - KMS encryption
 * - ECS Fargate task definitions
 * - CloudWatch alarms
 * - IAM permissions
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('🏗️ Huntaze OnlyFans CDK Stack', () => {
  let stackContent: string;

  beforeEach(() => {
    stackContent = readFileSync(
      join(process.cwd(), 'infra/cdk/lib/huntaze-of-stack.ts'),
      'utf-8'
    );
  });

  describe('📦 Stack Structure', () => {
    it('should export HuntazeOnlyFansStack class', () => {
      expect(stackContent).toContain('export class HuntazeOnlyFansStack');
    });

    it('should extend cdk.Stack', () => {
      expect(stackContent).toContain('extends cdk.Stack');
    });

    it('should have proper constructor signature', () => {
      expect(stackContent).toContain('constructor(scope: Construct, id: string, props?: cdk.StackProps)');
    });

    it('should instantiate stack in main app', () => {
      expect(stackContent).toContain('new HuntazeOnlyFansStack(app, \'HuntazeOnlyFansStack\'');
    });
  });

  describe('🌐 VPC & Networking', () => {
    it('should create VPC with 2 availability zones', () => {
      expect(stackContent).toContain('maxAzs: 2');
    });

    it('should create VPC with 1 NAT gateway', () => {
      expect(stackContent).toContain('natGateways: 1');
    });

    it('should configure public subnets', () => {
      expect(stackContent).toContain('name: \'Public\'');
      expect(stackContent).toContain('subnetType: ec2.SubnetType.PUBLIC');
    });

    it('should configure private subnets with egress', () => {
      expect(stackContent).toContain('name: \'Private\'');
      expect(stackContent).toContain('subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS');
    });

    it('should create security group for browser workers', () => {
      expect(stackContent).toContain('new ec2.SecurityGroup(this, \'BrowserWorkerSG\'');
      expect(stackContent).toContain('allowAllOutbound: true');
    });

    it('should have descriptive security group description', () => {
      expect(stackContent).toContain('Security group for OnlyFans browser worker');
    });
  });

  describe('🔐 KMS Encryption', () => {
    it('should create KMS key', () => {
      expect(stackContent).toContain('new kms.Key(this, \'HuntazeKmsKey\'');
    });

    it('should enable key rotation', () => {
      expect(stackContent).toContain('enableKeyRotation: true');
    });

    it('should have descriptive key description', () => {
      expect(stackContent).toContain('KMS key for Huntaze OnlyFans data encryption');
    });

    it('should set key alias', () => {
      expect(stackContent).toContain('alias: \'huntaze/onlyfans\'');
    });
  });

  describe('💾 DynamoDB Tables', () => {
    describe('Sessions Table', () => {
      it('should create sessions table', () => {
        expect(stackContent).toContain('new dynamodb.Table(this, \'HuntazeOfSessions\'');
      });

      it('should use userId as partition key', () => {
        expect(stackContent).toMatch(/HuntazeOfSessions[\s\S]*?partitionKey:[\s\S]*?name: 'userId'/);
      });

      it('should use customer-managed encryption', () => {
        expect(stackContent).toContain('encryption: dynamodb.TableEncryption.CUSTOMER_MANAGED');
      });

      it('should use pay-per-request billing', () => {
        expect(stackContent).toContain('billingMode: dynamodb.BillingMode.PAY_PER_REQUEST');
      });

      it('should enable TTL on expiresAt', () => {
        expect(stackContent).toContain('timeToLiveAttribute: \'expiresAt\'');
      });

      it('should enable point-in-time recovery', () => {
        expect(stackContent).toContain('pointInTimeRecovery: true');
      });

      it('should retain table on stack deletion', () => {
        expect(stackContent).toMatch(/HuntazeOfSessions[\s\S]*?removalPolicy: cdk.RemovalPolicy.RETAIN/);
      });
    });

    describe('Threads Table', () => {
      it('should create threads table', () => {
        expect(stackContent).toContain('new dynamodb.Table(this, \'HuntazeOfThreads\'');
      });

      it('should use userId as partition key', () => {
        expect(stackContent).toMatch(/HuntazeOfThreads[\s\S]*?partitionKey:[\s\S]*?name: 'userId'/);
      });

      it('should use fanId as sort key', () => {
        expect(stackContent).toMatch(/HuntazeOfThreads[\s\S]*?sortKey:[\s\S]*?name: 'fanId'/);
      });

      it('should use customer-managed encryption', () => {
        expect(stackContent).toMatch(/HuntazeOfThreads[\s\S]*?encryption: dynamodb.TableEncryption.CUSTOMER_MANAGED/);
      });

      it('should retain table on stack deletion', () => {
        expect(stackContent).toMatch(/HuntazeOfThreads[\s\S]*?removalPolicy: cdk.RemovalPolicy.RETAIN/);
      });
    });

    describe('Messages Table', () => {
      it('should create messages table', () => {
        expect(stackContent).toContain('new dynamodb.Table(this, \'HuntazeOfMessages\'');
      });

      it('should use taskId as partition key', () => {
        expect(stackContent).toMatch(/HuntazeOfMessages[\s\S]*?partitionKey:[\s\S]*?name: 'taskId'/);
      });

      it('should enable TTL on expiresAt', () => {
        expect(stackContent).toMatch(/HuntazeOfMessages[\s\S]*?timeToLiveAttribute: 'expiresAt'/);
      });

      it('should retain table on stack deletion', () => {
        expect(stackContent).toMatch(/HuntazeOfMessages[\s\S]*?removalPolicy: cdk.RemovalPolicy.RETAIN/);
      });
    });
  });

  describe('🔑 Secrets Manager', () => {
    it('should create OnlyFans credentials secret', () => {
      expect(stackContent).toContain('new secretsmanager.Secret(this, \'OfCredentials\'');
    });

    it('should use proper secret name', () => {
      expect(stackContent).toContain('secretName: \'of/creds/huntaze\'');
    });

    it('should have descriptive description', () => {
      expect(stackContent).toContain('description: \'OnlyFans credentials\'');
    });

    it('should generate secret string with template', () => {
      expect(stackContent).toContain('generateSecretString');
      expect(stackContent).toContain('secretStringTemplate');
    });

    it('should include email and password placeholders', () => {
      expect(stackContent).toContain('email: \'placeholder@example.com\'');
      expect(stackContent).toContain('password: \'placeholder\'');
    });

    it('should generate sessionToken key', () => {
      expect(stackContent).toContain('generateStringKey: \'sessionToken\'');
    });
  });

  describe('📊 CloudWatch Logs', () => {
    it('should create log group for browser workers', () => {
      expect(stackContent).toContain('new logs.LogGroup(this, \'BrowserWorkerLogs\'');
    });

    it('should use proper log group name', () => {
      expect(stackContent).toContain('logGroupName: \'/huntaze/of/browser-worker\'');
    });

    it('should set retention to 2 weeks', () => {
      expect(stackContent).toContain('retention: logs.RetentionDays.TWO_WEEKS');
    });

    it('should destroy logs on stack deletion', () => {
      expect(stackContent).toMatch(/BrowserWorkerLogs[\s\S]*?removalPolicy: cdk.RemovalPolicy.DESTROY/);
    });
  });

  describe('🐳 ECS Cluster', () => {
    it('should create ECS cluster', () => {
      expect(stackContent).toContain('new ecs.Cluster(this, \'HuntazeEcsCluster\'');
    });

    it('should use proper cluster name', () => {
      expect(stackContent).toContain('clusterName: \'huntaze-of-fargate\'');
    });

    it('should enable container insights', () => {
      expect(stackContent).toContain('containerInsights: true');
    });
  });

  describe('🎯 Task Definition', () => {
    describe('IAM Role', () => {
      it('should create task role', () => {
        expect(stackContent).toContain('new iam.Role(this, \'BrowserWorkerTaskRole\'');
      });

      it('should assume ECS tasks service principal', () => {
        expect(stackContent).toContain('new iam.ServicePrincipal(\'ecs-tasks.amazonaws.com\')');
      });

      it('should grant DynamoDB read/write permissions', () => {
        expect(stackContent).toContain('sessionsTable.grantReadWriteData(taskRole)');
        expect(stackContent).toContain('threadsTable.grantReadWriteData(taskRole)');
        expect(stackContent).toContain('messagesTable.grantReadWriteData(taskRole)');
      });

      it('should grant KMS encrypt/decrypt permissions', () => {
        expect(stackContent).toContain('kmsKey.grantEncryptDecrypt(taskRole)');
      });

      it('should grant secrets read permissions', () => {
        expect(stackContent).toContain('ofCredentialsSecret.grantRead(taskRole)');
      });

      it('should grant CloudWatch logs write permissions', () => {
        expect(stackContent).toContain('logGroup.grantWrite(taskRole)');
      });
    });

    describe('Fargate Task', () => {
      it('should create Fargate task definition', () => {
        expect(stackContent).toContain('new ecs.FargateTaskDefinition');
      });

      it('should allocate 8GB memory', () => {
        expect(stackContent).toContain('memoryLimitMiB: 8192');
      });

      it('should allocate 2 vCPUs', () => {
        expect(stackContent).toContain('cpu: 2048');
      });

      it('should use proper task family name', () => {
        expect(stackContent).toContain('family: \'HuntazeOfStackBrowserWorkerTaskCED33274\'');
      });
    });

    describe('Container', () => {
      it('should add container to task definition', () => {
        expect(stackContent).toContain('taskDefinition.addContainer(\'of-browser-worker\'');
      });

      it('should use ECR image', () => {
        expect(stackContent).toContain('ecs.ContainerImage.fromEcrRepository');
        expect(stackContent).toContain('huntaze/of-browser-worker');
      });

      it('should configure CloudWatch logging', () => {
        expect(stackContent).toContain('ecs.LogDriver.awsLogs');
        expect(stackContent).toContain('streamPrefix: \'of-browser\'');
      });

      it('should set NODE_ENV to production', () => {
        expect(stackContent).toContain('NODE_ENV: \'production\'');
      });

      it('should set AWS_REGION', () => {
        expect(stackContent).toContain('AWS_REGION: \'us-east-1\'');
      });

      it('should pass DynamoDB table names as env vars', () => {
        expect(stackContent).toContain('OF_DDB_SESSIONS_TABLE: sessionsTable.tableName');
        expect(stackContent).toContain('OF_DDB_THREADS_TABLE: threadsTable.tableName');
        expect(stackContent).toContain('OF_DDB_MESSAGES_TABLE: messagesTable.tableName');
      });

      it('should pass KMS key ARN as env var', () => {
        expect(stackContent).toContain('OF_KMS_KEY_ID: kmsKey.keyArn');
      });

      it('should pass secret name as env var', () => {
        expect(stackContent).toContain('OF_LOGIN_SECRET_NAME: ofCredentialsSecret.secretName');
      });
    });
  });

  describe('🚨 CloudWatch Alarms', () => {
    describe('Task Failure Alarm', () => {
      it('should create task failure alarm', () => {
        expect(stackContent).toContain('new cloudwatch.Alarm(this, \'BrowserWorkerFailureAlarm\'');
      });

      it('should monitor ECS TaskCount metric', () => {
        expect(stackContent).toContain('namespace: \'ECS/ContainerInsights\'');
        expect(stackContent).toContain('metricName: \'TaskCount\'');
      });

      it('should use 1-minute period', () => {
        expect(stackContent).toContain('period: cdk.Duration.minutes(1)');
      });

      it('should alert on threshold 0', () => {
        expect(stackContent).toMatch(/BrowserWorkerFailureAlarm[\s\S]*?threshold: 0/);
      });

      it('should evaluate for 2 periods', () => {
        expect(stackContent).toMatch(/BrowserWorkerFailureAlarm[\s\S]*?evaluationPeriods: 2/);
      });

      it('should have descriptive alarm name', () => {
        expect(stackContent).toContain('alarmName: \'huntaze-of-browser-worker-failure\'');
      });
    });

    describe('Error Rate Alarm', () => {
      it('should create error rate alarm', () => {
        expect(stackContent).toContain('new cloudwatch.Alarm(this, \'BrowserWorkerErrorRateAlarm\'');
      });

      it('should monitor custom error metric', () => {
        expect(stackContent).toContain('namespace: \'Huntaze/OnlyFans/BrowserWorker\'');
        expect(stackContent).toContain('metricName: \'BrowserTaskError\'');
      });

      it('should use 5-minute period', () => {
        expect(stackContent).toMatch(/errorRateMetric[\s\S]*?period: cdk.Duration.minutes\(5\)/);
      });

      it('should alert on threshold 10', () => {
        expect(stackContent).toMatch(/BrowserWorkerErrorRateAlarm[\s\S]*?threshold: 10/);
      });

      it('should have descriptive alarm name', () => {
        expect(stackContent).toContain('alarmName: \'huntaze-of-browser-worker-error-rate\'');
      });
    });
  });

  describe('📤 Stack Outputs', () => {
    it('should output cluster ARN', () => {
      expect(stackContent).toContain('new cdk.CfnOutput(this, \'ClusterArn\'');
      expect(stackContent).toContain('exportName: \'HuntazeEcsClusterArn\'');
    });

    it('should output task definition ARN', () => {
      expect(stackContent).toContain('new cdk.CfnOutput(this, \'TaskDefinitionArn\'');
      expect(stackContent).toContain('exportName: \'HuntazeBrowserWorkerTaskDef\'');
    });

    it('should output sessions table name', () => {
      expect(stackContent).toContain('new cdk.CfnOutput(this, \'SessionsTableName\'');
      expect(stackContent).toContain('exportName: \'HuntazeOfSessionsTable\'');
    });

    it('should output subnet IDs', () => {
      expect(stackContent).toContain('new cdk.CfnOutput(this, \'SubnetIds\'');
      expect(stackContent).toContain('exportName: \'HuntazeEcsSubnets\'');
    });

    it('should output security group ID', () => {
      expect(stackContent).toContain('new cdk.CfnOutput(this, \'SecurityGroupId\'');
      expect(stackContent).toContain('exportName: \'HuntazeEcsSecurityGroup\'');
    });

    it('should output KMS key ARN', () => {
      expect(stackContent).toContain('new cdk.CfnOutput(this, \'KmsKeyArn\'');
      expect(stackContent).toContain('exportName: \'HuntazeKmsKeyArn\'');
    });
  });

  describe('🌍 Stack Configuration', () => {
    it('should use correct AWS account', () => {
      expect(stackContent).toContain('account: process.env.CDK_DEFAULT_ACCOUNT || \'317805897534\'');
    });

    it('should use us-east-1 region', () => {
      expect(stackContent).toContain('region: process.env.CDK_DEFAULT_REGION || \'us-east-1\'');
    });

    it('should have descriptive stack description', () => {
      expect(stackContent).toContain('description: \'Huntaze OnlyFans Infrastructure - ECS Fargate + DynamoDB + KMS\'');
    });

    it('should synthesize the app', () => {
      expect(stackContent).toContain('app.synth()');
    });
  });

  describe('🔒 Security Best Practices', () => {
    it('should use encryption at rest for all DynamoDB tables', () => {
      const encryptionMatches = stackContent.match(/encryption: dynamodb\.TableEncryption\.CUSTOMER_MANAGED/g);
      expect(encryptionMatches).toBeTruthy();
      expect(encryptionMatches!.length).toBeGreaterThanOrEqual(3);
    });

    it('should enable point-in-time recovery for critical tables', () => {
      const pitrMatches = stackContent.match(/pointInTimeRecovery: true/g);
      expect(pitrMatches).toBeTruthy();
      expect(pitrMatches!.length).toBeGreaterThanOrEqual(2);
    });

    it('should retain data tables on stack deletion', () => {
      const retainMatches = stackContent.match(/removalPolicy: cdk\.RemovalPolicy\.RETAIN/g);
      expect(retainMatches).toBeTruthy();
      expect(retainMatches!.length).toBeGreaterThanOrEqual(3);
    });

    it('should enable KMS key rotation', () => {
      expect(stackContent).toContain('enableKeyRotation: true');
    });

    it('should use private subnets for ECS tasks', () => {
      expect(stackContent).toContain('PRIVATE_WITH_EGRESS');
    });
  });

  describe('💰 Cost Optimization', () => {
    it('should use pay-per-request billing for DynamoDB', () => {
      const billingMatches = stackContent.match(/billingMode: dynamodb\.BillingMode\.PAY_PER_REQUEST/g);
      expect(billingMatches).toBeTruthy();
      expect(billingMatches!.length).toBeGreaterThanOrEqual(3);
    });

    it('should use single NAT gateway', () => {
      expect(stackContent).toContain('natGateways: 1');
    });

    it('should use 2-week log retention', () => {
      expect(stackContent).toContain('retention: logs.RetentionDays.TWO_WEEKS');
    });
  });

  describe('📈 Observability', () => {
    it('should enable container insights', () => {
      expect(stackContent).toContain('containerInsights: true');
    });

    it('should configure CloudWatch logging for containers', () => {
      expect(stackContent).toContain('ecs.LogDriver.awsLogs');
    });

    it('should create alarms for critical metrics', () => {
      expect(stackContent).toContain('BrowserWorkerFailureAlarm');
      expect(stackContent).toContain('BrowserWorkerErrorRateAlarm');
    });

    it('should use custom CloudWatch namespace', () => {
      expect(stackContent).toContain('Huntaze/OnlyFans/BrowserWorker');
    });
  });

  describe('🔄 High Availability', () => {
    it('should deploy across 2 availability zones', () => {
      expect(stackContent).toContain('maxAzs: 2');
    });

    it('should use Fargate for serverless scaling', () => {
      expect(stackContent).toContain('FargateTaskDefinition');
    });

    it('should enable point-in-time recovery for data durability', () => {
      expect(stackContent).toContain('pointInTimeRecovery: true');
    });
  });

  describe('📝 Documentation & Naming', () => {
    it('should have descriptive resource names', () => {
      expect(stackContent).toContain('HuntazeVpc');
      expect(stackContent).toContain('BrowserWorkerSG');
      expect(stackContent).toContain('HuntazeKmsKey');
      expect(stackContent).toContain('HuntazeOfSessions');
      expect(stackContent).toContain('HuntazeEcsCluster');
    });

    it('should have comments for each major section', () => {
      expect(stackContent).toContain('// 1. VPC & Networking');
      expect(stackContent).toContain('// 2. Encryption (KMS)');
      expect(stackContent).toContain('// 3. DynamoDB Tables');
      expect(stackContent).toContain('// 4. Secrets Manager');
      expect(stackContent).toContain('// 5. CloudWatch Logs');
      expect(stackContent).toContain('// 6. ECS Cluster');
      expect(stackContent).toContain('// 7. Task Definition');
      expect(stackContent).toContain('// 8. CloudWatch Alarms');
      expect(stackContent).toContain('// 9. Outputs');
    });

    it('should have file header documentation', () => {
      expect(stackContent).toContain('Huntaze OnlyFans Infrastructure Stack (CDK)');
      expect(stackContent).toContain('Provisions:');
      expect(stackContent).toContain('ECS Fargate cluster');
      expect(stackContent).toContain('DynamoDB tables');
    });
  });

  describe('🧪 Integration Points', () => {
    it('should reference correct ECR repository', () => {
      expect(stackContent).toContain('huntaze/of-browser-worker');
    });

    it('should use main image tag', () => {
      expect(stackContent).toContain('\'main\'');
    });

    it('should pass all required environment variables', () => {
      const requiredEnvVars = [
        'NODE_ENV',
        'AWS_REGION',
        'OF_DDB_SESSIONS_TABLE',
        'OF_DDB_THREADS_TABLE',
        'OF_DDB_MESSAGES_TABLE',
        'OF_KMS_KEY_ID',
        'OF_LOGIN_SECRET_NAME'
      ];

      requiredEnvVars.forEach(envVar => {
        expect(stackContent).toContain(envVar);
      });
    });
  });

  describe('⚠️ Error Handling', () => {
    it('should configure alarm for task failures', () => {
      expect(stackContent).toContain('BrowserWorkerFailureAlarm');
      expect(stackContent).toContain('Alert if browser worker tasks fail');
    });

    it('should configure alarm for high error rates', () => {
      expect(stackContent).toContain('BrowserWorkerErrorRateAlarm');
      expect(stackContent).toContain('Alert if browser worker error rate is high');
    });

    it('should treat missing data appropriately', () => {
      expect(stackContent).toContain('treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING');
    });
  });
});
