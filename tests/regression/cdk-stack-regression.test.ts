/**
 * CDK Stack Regression Tests
 * 
 * Ensures that future changes don't break critical infrastructure configuration.
 * These tests validate that essential resources and configurations remain intact.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

describe('🔒 CDK Stack Regression Tests', () => {
  const stackContent = readFileSync(
    join(process.cwd(), 'infra/cdk/lib/huntaze-of-stack.ts'),
    'utf-8'
  );

  describe('Critical Resource Configuration', () => {
    it('should maintain DynamoDB table count', () => {
      const tableMatches = stackContent.match(/new dynamodb\.Table/g);
      expect(tableMatches).toBeTruthy();
      expect(tableMatches!.length).toBe(3); // Sessions, Threads, Messages
    });

    it('should maintain encryption for all tables', () => {
      const encryptionMatches = stackContent.match(/encryption: dynamodb\.TableEncryption\.CUSTOMER_MANAGED/g);
      expect(encryptionMatches).toBeTruthy();
      expect(encryptionMatches!.length).toBe(3);
    });

    it('should maintain KMS key rotation', () => {
      expect(stackContent).toContain('enableKeyRotation: true');
    });

    it('should maintain point-in-time recovery', () => {
      const pitrMatches = stackContent.match(/pointInTimeRecovery: true/g);
      expect(pitrMatches).toBeTruthy();
      expect(pitrMatches!.length).toBeGreaterThanOrEqual(2);
    });

    it('should maintain data retention policies', () => {
      const retainMatches = stackContent.match(/removalPolicy: cdk\.RemovalPolicy\.RETAIN/g);
      expect(retainMatches).toBeTruthy();
      expect(retainMatches!.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('ECS Task Resource Allocation', () => {
    it('should maintain 8GB memory allocation', () => {
      expect(stackContent).toContain('memoryLimitMiB: 8192');
    });

    it('should maintain 2 vCPU allocation', () => {
      expect(stackContent).toContain('cpu: 2048');
    });

    it('should maintain task family name', () => {
      expect(stackContent).toContain('family: \'HuntazeOfStackBrowserWorkerTaskCED33274\'');
    });
  });

  describe('Network Configuration', () => {
    it('should maintain 2 availability zones', () => {
      expect(stackContent).toContain('maxAzs: 2');
    });

    it('should maintain single NAT gateway', () => {
      expect(stackContent).toContain('natGateways: 1');
    });

    it('should maintain public and private subnets', () => {
      expect(stackContent).toContain('subnetType: ec2.SubnetType.PUBLIC');
      expect(stackContent).toContain('subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS');
    });
  });

  describe('IAM Permissions', () => {
    it('should maintain DynamoDB permissions', () => {
      expect(stackContent).toContain('sessionsTable.grantReadWriteData(taskRole)');
      expect(stackContent).toContain('threadsTable.grantReadWriteData(taskRole)');
      expect(stackContent).toContain('messagesTable.grantReadWriteData(taskRole)');
    });

    it('should maintain KMS permissions', () => {
      expect(stackContent).toContain('kmsKey.grantEncryptDecrypt(taskRole)');
    });

    it('should maintain Secrets Manager permissions', () => {
      expect(stackContent).toContain('ofCredentialsSecret.grantRead(taskRole)');
    });

    it('should maintain CloudWatch Logs permissions', () => {
      expect(stackContent).toContain('logGroup.grantWrite(taskRole)');
    });
  });

  describe('Environment Variables', () => {
    it('should maintain all required environment variables', () => {
      const requiredEnvVars = [
        'NODE_ENV: \'production\'',
        'AWS_REGION: \'us-east-1\'',
        'OF_DDB_SESSIONS_TABLE: sessionsTable.tableName',
        'OF_DDB_THREADS_TABLE: threadsTable.tableName',
        'OF_DDB_MESSAGES_TABLE: messagesTable.tableName',
        'OF_KMS_KEY_ID: kmsKey.keyArn',
        'OF_LOGIN_SECRET_NAME: ofCredentialsSecret.secretName'
      ];

      requiredEnvVars.forEach(envVar => {
        expect(stackContent).toContain(envVar);
      });
    });
  });

  describe('CloudWatch Alarms', () => {
    it('should maintain task failure alarm', () => {
      expect(stackContent).toContain('BrowserWorkerFailureAlarm');
      expect(stackContent).toContain('huntaze-of-browser-worker-failure');
    });

    it('should maintain error rate alarm', () => {
      expect(stackContent).toContain('BrowserWorkerErrorRateAlarm');
      expect(stackContent).toContain('huntaze-of-browser-worker-error-rate');
    });

    it('should maintain alarm thresholds', () => {
      // Task failure threshold should be 0
      expect(stackContent).toMatch(/BrowserWorkerFailureAlarm[\s\S]*?threshold: 0/);
      
      // Error rate threshold should be 10
      expect(stackContent).toMatch(/BrowserWorkerErrorRateAlarm[\s\S]*?threshold: 10/);
    });
  });

  describe('Stack Outputs', () => {
    it('should maintain all critical outputs', () => {
      const outputs = [
        'ClusterArn',
        'TaskDefinitionArn',
        'SessionsTableName',
        'SubnetIds',
        'SecurityGroupId',
        'KmsKeyArn'
      ];

      outputs.forEach(output => {
        expect(stackContent).toContain(`new cdk.CfnOutput(this, '${output}'`);
      });
    });

    it('should maintain export names', () => {
      const exportNames = [
        'HuntazeEcsClusterArn',
        'HuntazeBrowserWorkerTaskDef',
        'HuntazeOfSessionsTable',
        'HuntazeEcsSubnets',
        'HuntazeEcsSecurityGroup',
        'HuntazeKmsKeyArn'
      ];

      exportNames.forEach(name => {
        expect(stackContent).toContain(`exportName: '${name}'`);
      });
    });
  });

  describe('Secrets Configuration', () => {
    it('should maintain secret name', () => {
      expect(stackContent).toContain('secretName: \'of/creds/huntaze\'');
    });

    it('should maintain secret structure', () => {
      expect(stackContent).toContain('email: \'placeholder@example.com\'');
      expect(stackContent).toContain('password: \'placeholder\'');
      expect(stackContent).toContain('generateStringKey: \'sessionToken\'');
    });
  });

  describe('Logging Configuration', () => {
    it('should maintain log group name', () => {
      expect(stackContent).toContain('logGroupName: \'/huntaze/of/browser-worker\'');
    });

    it('should maintain log retention period', () => {
      expect(stackContent).toContain('retention: logs.RetentionDays.TWO_WEEKS');
    });

    it('should maintain log stream prefix', () => {
      expect(stackContent).toContain('streamPrefix: \'of-browser\'');
    });
  });

  describe('Container Configuration', () => {
    it('should maintain ECR repository name', () => {
      expect(stackContent).toContain('huntaze/of-browser-worker');
    });

    it('should maintain image tag', () => {
      expect(stackContent).toContain('\'main\'');
    });

    it('should maintain container name', () => {
      expect(stackContent).toContain('taskDefinition.addContainer(\'of-browser-worker\'');
    });
  });

  describe('AWS Account Configuration', () => {
    it('should maintain AWS account ID', () => {
      expect(stackContent).toContain('317805897534');
    });

    it('should maintain AWS region', () => {
      expect(stackContent).toContain('us-east-1');
    });

    it('should maintain stack description', () => {
      expect(stackContent).toContain('Huntaze OnlyFans Infrastructure - ECS Fargate + DynamoDB + KMS');
    });
  });

  describe('CDK Context Configuration', () => {
    it('should have cdk.context.json file', () => {
      const contextPath = join(process.cwd(), 'infra/cdk/cdk.context.json');
      expect(existsSync(contextPath)).toBe(true);
    });

    it('should have us-east-1 availability zones in context', () => {
      const contextPath = join(process.cwd(), 'infra/cdk/cdk.context.json');
      const contextContent = readFileSync(contextPath, 'utf-8');
      const context = JSON.parse(contextContent);
      
      const azKey = 'availability-zones:account=317805897534:region=us-east-1';
      expect(context[azKey]).toBeDefined();
      expect(Array.isArray(context[azKey])).toBe(true);
    });

    it('should have at least 2 availability zones', () => {
      const contextPath = join(process.cwd(), 'infra/cdk/cdk.context.json');
      const contextContent = readFileSync(contextPath, 'utf-8');
      const context = JSON.parse(contextContent);
      
      const azKey = 'availability-zones:account=317805897534:region=us-east-1';
      expect(context[azKey].length).toBeGreaterThanOrEqual(2);
    });

    it('should have valid us-east-1 availability zone names', () => {
      const contextPath = join(process.cwd(), 'infra/cdk/cdk.context.json');
      const contextContent = readFileSync(contextPath, 'utf-8');
      const context = JSON.parse(contextContent);
      
      const azKey = 'availability-zones:account=317805897534:region=us-east-1';
      const azs = context[azKey];
      
      azs.forEach((az: string) => {
        expect(az).toMatch(/^us-east-1[a-f]$/);
      });
    });

    it('should not have us-west-1 configuration', () => {
      const contextPath = join(process.cwd(), 'infra/cdk/cdk.context.json');
      const contextContent = readFileSync(contextPath, 'utf-8');
      const context = JSON.parse(contextContent);
      
      const oldAzKey = 'availability-zones:account=317805897534:region=us-west-1';
      expect(context[oldAzKey]).toBeUndefined();
      
      // Should only have us-east-1
      const usEast1Key = 'availability-zones:account=317805897534:region=us-east-1';
      expect(context[usEast1Key]).toBeDefined();
      expect(Array.isArray(context[usEast1Key])).toBe(true);
      expect((context[usEast1Key] as string[]).length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Security Group Configuration', () => {
    it('should maintain outbound access', () => {
      expect(stackContent).toContain('allowAllOutbound: true');
    });

    it('should maintain security group description', () => {
      expect(stackContent).toContain('Security group for OnlyFans browser worker');
    });
  });

  describe('ECS Cluster Configuration', () => {
    it('should maintain cluster name', () => {
      expect(stackContent).toContain('clusterName: \'huntaze-of-fargate\'');
    });

    it('should maintain container insights', () => {
      expect(stackContent).toContain('containerInsights: true');
    });
  });

  describe('DynamoDB Table Keys', () => {
    it('should maintain sessions table keys', () => {
      expect(stackContent).toMatch(/HuntazeOfSessions[\s\S]*?partitionKey:[\s\S]*?name: 'userId'/);
    });

    it('should maintain threads table keys', () => {
      expect(stackContent).toMatch(/HuntazeOfThreads[\s\S]*?partitionKey:[\s\S]*?name: 'userId'/);
      expect(stackContent).toMatch(/HuntazeOfThreads[\s\S]*?sortKey:[\s\S]*?name: 'fanId'/);
    });

    it('should maintain messages table keys', () => {
      expect(stackContent).toMatch(/HuntazeOfMessages[\s\S]*?partitionKey:[\s\S]*?name: 'taskId'/);
    });
  });

  describe('TTL Configuration', () => {
    it('should maintain TTL for sessions table', () => {
      expect(stackContent).toMatch(/HuntazeOfSessions[\s\S]*?timeToLiveAttribute: 'expiresAt'/);
    });

    it('should maintain TTL for messages table', () => {
      expect(stackContent).toMatch(/HuntazeOfMessages[\s\S]*?timeToLiveAttribute: 'expiresAt'/);
    });
  });

  describe('Billing Configuration', () => {
    it('should maintain pay-per-request billing', () => {
      const billingMatches = stackContent.match(/billingMode: dynamodb\.BillingMode\.PAY_PER_REQUEST/g);
      expect(billingMatches).toBeTruthy();
      expect(billingMatches!.length).toBe(3);
    });
  });

  describe('CloudWatch Metrics', () => {
    it('should maintain ECS metrics namespace', () => {
      expect(stackContent).toContain('namespace: \'ECS/ContainerInsights\'');
    });

    it('should maintain custom metrics namespace', () => {
      expect(stackContent).toContain('namespace: \'Huntaze/OnlyFans/BrowserWorker\'');
    });

    it('should maintain metric names', () => {
      expect(stackContent).toContain('metricName: \'TaskCount\'');
      expect(stackContent).toContain('metricName: \'BrowserTaskError\'');
    });
  });

  describe('Alarm Configuration', () => {
    it('should maintain alarm evaluation periods', () => {
      expect(stackContent).toMatch(/BrowserWorkerFailureAlarm[\s\S]*?evaluationPeriods: 2/);
      expect(stackContent).toMatch(/BrowserWorkerErrorRateAlarm[\s\S]*?evaluationPeriods: 1/);
    });

    it('should maintain alarm periods', () => {
      expect(stackContent).toContain('period: cdk.Duration.minutes(1)');
      expect(stackContent).toContain('period: cdk.Duration.minutes(5)');
    });

    it('should maintain missing data treatment', () => {
      expect(stackContent).toContain('treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING');
    });
  });

  describe('Code Structure', () => {
    it('should maintain section comments', () => {
      const sections = [
        '// 1. VPC & Networking',
        '// 2. Encryption (KMS)',
        '// 3. DynamoDB Tables',
        '// 4. Secrets Manager',
        '// 5. CloudWatch Logs',
        '// 6. ECS Cluster',
        '// 7. Task Definition',
        '// 8. CloudWatch Alarms',
        '// 9. Outputs'
      ];

      sections.forEach(section => {
        expect(stackContent).toContain(section);
      });
    });

    it('should maintain file header', () => {
      expect(stackContent).toContain('Huntaze OnlyFans Infrastructure Stack (CDK)');
      expect(stackContent).toContain('Provisions:');
    });
  });

  describe('Resource Naming', () => {
    it('should maintain consistent naming convention', () => {
      const resources = [
        'HuntazeVpc',
        'BrowserWorkerSG',
        'HuntazeKmsKey',
        'HuntazeOfSessions',
        'HuntazeOfThreads',
        'HuntazeOfMessages',
        'OfCredentials',
        'BrowserWorkerLogs',
        'HuntazeEcsCluster',
        'BrowserWorkerTaskRole',
        'BrowserWorkerTask'
      ];

      resources.forEach(resource => {
        expect(stackContent).toContain(resource);
      });
    });
  });

  describe('Critical Dependencies', () => {
    it('should maintain all CDK imports', () => {
      const imports = [
        'import * as cdk from \'aws-cdk-lib\'',
        'import * as ecs from \'aws-cdk-lib/aws-ecs\'',
        'import * as ec2 from \'aws-cdk-lib/aws-ec2\'',
        'import * as dynamodb from \'aws-cdk-lib/aws-dynamodb\'',
        'import * as kms from \'aws-cdk-lib/aws-kms\'',
        'import * as secretsmanager from \'aws-cdk-lib/aws-secretsmanager\'',
        'import * as logs from \'aws-cdk-lib/aws-logs\'',
        'import * as iam from \'aws-cdk-lib/aws-iam\'',
        'import * as ecr from \'aws-cdk-lib/aws-ecr\'',
        'import * as cloudwatch from \'aws-cdk-lib/aws-cloudwatch\'',
        'import { Construct } from \'constructs\''
      ];

      imports.forEach(imp => {
        expect(stackContent).toContain(imp);
      });
    });
  });
});
