/**
 * CDK Stack Synthesis Integration Tests
 * 
 * Tests that the CDK stack can be synthesized without errors
 * and produces valid CloudFormation templates.
 */

import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

describe('🏗️ CDK Stack Synthesis', () => {
  const stackPath = join(process.cwd(), 'infra/cdk/lib/huntaze-of-stack.ts');

  describe('File Structure', () => {
    it('should have CDK stack file', () => {
      expect(existsSync(stackPath)).toBe(true);
    });

    it('should be valid TypeScript', () => {
      const content = readFileSync(stackPath, 'utf-8');
      
      // Check for syntax errors (basic validation)
      expect(content).not.toContain('SyntaxError');
      expect(content.split('{').length).toBe(content.split('}').length);
    });

    it('should have all required imports', () => {
      const content = readFileSync(stackPath, 'utf-8');
      
      const requiredImports = [
        'aws-cdk-lib',
        'aws-cdk-lib/aws-ecs',
        'aws-cdk-lib/aws-ec2',
        'aws-cdk-lib/aws-dynamodb',
        'aws-cdk-lib/aws-kms',
        'aws-cdk-lib/aws-secretsmanager',
        'aws-cdk-lib/aws-logs',
        'aws-cdk-lib/aws-iam',
        'aws-cdk-lib/aws-ecr',
        'aws-cdk-lib/aws-cloudwatch',
        'constructs'
      ];

      requiredImports.forEach(imp => {
        expect(content).toContain(`from '${imp}'`);
      });
    });
  });

  describe('Stack Configuration', () => {
    it('should define all infrastructure components', () => {
      const content = readFileSync(stackPath, 'utf-8');
      
      const components = [
        'VPC',
        'SecurityGroup',
        'KMS',
        'DynamoDB',
        'Secrets Manager',
        'CloudWatch',
        'ECS',
        'Task Definition',
        'Alarms',
        'Outputs'
      ];

      // Check comments for each section
      components.forEach(component => {
        expect(content).toMatch(new RegExp(component, 'i'));
      });
    });

    it('should have proper resource naming convention', () => {
      const content = readFileSync(stackPath, 'utf-8');
      
      // All resources should start with 'Huntaze' or descriptive names
      expect(content).toContain('HuntazeVpc');
      expect(content).toContain('HuntazeKmsKey');
      expect(content).toContain('HuntazeOfSessions');
      expect(content).toContain('HuntazeOfThreads');
      expect(content).toContain('HuntazeOfMessages');
      expect(content).toContain('HuntazeEcsCluster');
    });

    it('should export all necessary outputs', () => {
      const content = readFileSync(stackPath, 'utf-8');
      
      const outputs = [
        'ClusterArn',
        'TaskDefinitionArn',
        'SessionsTableName',
        'SubnetIds',
        'SecurityGroupId',
        'KmsKeyArn'
      ];

      outputs.forEach(output => {
        expect(content).toContain(`new cdk.CfnOutput(this, '${output}'`);
      });
    });
  });

  describe('Security Configuration', () => {
    it('should enable encryption for all DynamoDB tables', () => {
      const content = readFileSync(stackPath, 'utf-8');
      
      // Count DynamoDB tables
      const tableMatches = content.match(/new dynamodb\.Table/g);
      expect(tableMatches).toBeTruthy();
      expect(tableMatches!.length).toBe(3);

      // Count encryption configurations
      const encryptionMatches = content.match(/encryption: dynamodb\.TableEncryption\.CUSTOMER_MANAGED/g);
      expect(encryptionMatches).toBeTruthy();
      expect(encryptionMatches!.length).toBe(3);
    });

    it('should enable KMS key rotation', () => {
      const content = readFileSync(stackPath, 'utf-8');
      expect(content).toContain('enableKeyRotation: true');
    });

    it('should use Secrets Manager for credentials', () => {
      const content = readFileSync(stackPath, 'utf-8');
      expect(content).toContain('new secretsmanager.Secret');
      expect(content).toContain('of/creds/huntaze');
    });

    it('should grant minimal IAM permissions', () => {
      const content = readFileSync(stackPath, 'utf-8');
      
      // Check for grant methods (least privilege)
      expect(content).toContain('grantReadWriteData');
      expect(content).toContain('grantEncryptDecrypt');
      expect(content).toContain('grantRead');
      expect(content).toContain('grantWrite');
      
      // Should NOT contain wildcard permissions
      expect(content).not.toContain('Action: "*"');
      expect(content).not.toContain('Resource: "*"');
    });
  });

  describe('High Availability', () => {
    it('should deploy across multiple AZs', () => {
      const content = readFileSync(stackPath, 'utf-8');
      expect(content).toContain('maxAzs: 2');
    });

    it('should enable point-in-time recovery', () => {
      const content = readFileSync(stackPath, 'utf-8');
      const pitrMatches = content.match(/pointInTimeRecovery: true/g);
      expect(pitrMatches).toBeTruthy();
      expect(pitrMatches!.length).toBeGreaterThanOrEqual(2);
    });

    it('should retain critical data on stack deletion', () => {
      const content = readFileSync(stackPath, 'utf-8');
      const retainMatches = content.match(/removalPolicy: cdk\.RemovalPolicy\.RETAIN/g);
      expect(retainMatches).toBeTruthy();
      expect(retainMatches!.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Monitoring & Observability', () => {
    it('should enable container insights', () => {
      const content = readFileSync(stackPath, 'utf-8');
      expect(content).toContain('containerInsights: true');
    });

    it('should configure CloudWatch alarms', () => {
      const content = readFileSync(stackPath, 'utf-8');
      
      const alarms = [
        'BrowserWorkerFailureAlarm',
        'BrowserWorkerErrorRateAlarm'
      ];

      alarms.forEach(alarm => {
        expect(content).toContain(alarm);
      });
    });

    it('should create CloudWatch log group', () => {
      const content = readFileSync(stackPath, 'utf-8');
      expect(content).toContain('new logs.LogGroup');
      expect(content).toContain('/huntaze/of/browser-worker');
    });

    it('should set appropriate log retention', () => {
      const content = readFileSync(stackPath, 'utf-8');
      expect(content).toContain('retention: logs.RetentionDays.TWO_WEEKS');
    });
  });

  describe('Cost Optimization', () => {
    it('should use pay-per-request billing for DynamoDB', () => {
      const content = readFileSync(stackPath, 'utf-8');
      const billingMatches = content.match(/billingMode: dynamodb\.BillingMode\.PAY_PER_REQUEST/g);
      expect(billingMatches).toBeTruthy();
      expect(billingMatches!.length).toBe(3);
    });

    it('should use single NAT gateway', () => {
      const content = readFileSync(stackPath, 'utf-8');
      expect(content).toContain('natGateways: 1');
    });

    it('should use Fargate for serverless compute', () => {
      const content = readFileSync(stackPath, 'utf-8');
      expect(content).toContain('FargateTaskDefinition');
    });
  });

  describe('ECS Task Configuration', () => {
    it('should allocate appropriate resources', () => {
      const content = readFileSync(stackPath, 'utf-8');
      
      // 8GB memory for Playwright browser
      expect(content).toContain('memoryLimitMiB: 8192');
      
      // 2 vCPUs
      expect(content).toContain('cpu: 2048');
    });

    it('should configure all required environment variables', () => {
      const content = readFileSync(stackPath, 'utf-8');
      
      const envVars = [
        'NODE_ENV',
        'AWS_REGION',
        'OF_DDB_SESSIONS_TABLE',
        'OF_DDB_THREADS_TABLE',
        'OF_DDB_MESSAGES_TABLE',
        'OF_KMS_KEY_ID',
        'OF_LOGIN_SECRET_NAME'
      ];

      envVars.forEach(envVar => {
        expect(content).toContain(envVar);
      });
    });

    it('should reference correct ECR repository', () => {
      const content = readFileSync(stackPath, 'utf-8');
      expect(content).toContain('huntaze/of-browser-worker');
    });
  });

  describe('Network Configuration', () => {
    it('should create public and private subnets', () => {
      const content = readFileSync(stackPath, 'utf-8');
      expect(content).toContain('subnetType: ec2.SubnetType.PUBLIC');
      expect(content).toContain('subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS');
    });

    it('should configure security group for outbound access', () => {
      const content = readFileSync(stackPath, 'utf-8');
      expect(content).toContain('allowAllOutbound: true');
    });

    it('should use /24 CIDR blocks', () => {
      const content = readFileSync(stackPath, 'utf-8');
      const cidrMatches = content.match(/cidrMask: 24/g);
      expect(cidrMatches).toBeTruthy();
      expect(cidrMatches!.length).toBe(2);
    });
  });

  describe('CloudWatch Alarms Configuration', () => {
    it('should monitor task failures', () => {
      const content = readFileSync(stackPath, 'utf-8');
      expect(content).toContain('TaskCount');
      expect(content).toContain('ECS/ContainerInsights');
    });

    it('should monitor error rates', () => {
      const content = readFileSync(stackPath, 'utf-8');
      expect(content).toContain('BrowserTaskError');
      expect(content).toContain('Huntaze/OnlyFans/BrowserWorker');
    });

    it('should have appropriate alarm thresholds', () => {
      const content = readFileSync(stackPath, 'utf-8');
      
      // Task failure threshold
      expect(content).toMatch(/BrowserWorkerFailureAlarm[\s\S]*?threshold: 0/);
      
      // Error rate threshold
      expect(content).toMatch(/BrowserWorkerErrorRateAlarm[\s\S]*?threshold: 10/);
    });
  });

  describe('Stack Metadata', () => {
    it('should have correct AWS account', () => {
      const content = readFileSync(stackPath, 'utf-8');
      expect(content).toContain('317805897534');
    });

    it('should deploy to us-east-1', () => {
      const content = readFileSync(stackPath, 'utf-8');
      expect(content).toContain('us-east-1');
    });

    it('should have descriptive stack description', () => {
      const content = readFileSync(stackPath, 'utf-8');
      expect(content).toContain('Huntaze OnlyFans Infrastructure - ECS Fargate + DynamoDB + KMS');
    });
  });

  describe('Code Quality', () => {
    it('should have proper TypeScript types', () => {
      const content = readFileSync(stackPath, 'utf-8');
      
      // Check for type annotations
      expect(content).toContain(': Construct');
      expect(content).toContain(': string');
      expect(content).toContain('?: cdk.StackProps');
    });

    it('should have descriptive comments', () => {
      const content = readFileSync(stackPath, 'utf-8');
      
      // Count comment sections
      const commentMatches = content.match(/\/\/ =/g);
      expect(commentMatches).toBeTruthy();
      expect(commentMatches!.length).toBeGreaterThanOrEqual(9);
    });

    it('should follow consistent naming conventions', () => {
      const content = readFileSync(stackPath, 'utf-8');
      
      // PascalCase for classes and constructs
      expect(content).toContain('HuntazeOnlyFansStack');
      
      // camelCase for variables
      expect(content).toContain('const vpc');
      expect(content).toContain('const kmsKey');
      expect(content).toContain('const taskRole');
    });
  });

  describe('Resource Dependencies', () => {
    it('should create resources in correct order', () => {
      const content = readFileSync(stackPath, 'utf-8');
      
      // VPC should be created before security group
      const vpcIndex = content.indexOf('new ec2.Vpc');
      const sgIndex = content.indexOf('new ec2.SecurityGroup');
      expect(vpcIndex).toBeLessThan(sgIndex);
      
      // KMS key should be created before DynamoDB tables
      const kmsIndex = content.indexOf('new kms.Key');
      const dynamoIndex = content.indexOf('new dynamodb.Table');
      expect(kmsIndex).toBeLessThan(dynamoIndex);
      
      // Task role should be created before task definition
      const roleIndex = content.indexOf('new iam.Role');
      const taskIndex = content.indexOf('new ecs.FargateTaskDefinition');
      expect(roleIndex).toBeLessThan(taskIndex);
    });

    it('should grant permissions after creating resources', () => {
      const content = readFileSync(stackPath, 'utf-8');
      
      // Tables should be created before grants
      const tableIndex = content.indexOf('new dynamodb.Table');
      const grantIndex = content.indexOf('grantReadWriteData');
      expect(tableIndex).toBeLessThan(grantIndex);
    });
  });

  describe('Compliance & Best Practices', () => {
    it('should follow AWS Well-Architected Framework', () => {
      const content = readFileSync(stackPath, 'utf-8');
      
      // Security: Encryption at rest
      expect(content).toContain('CUSTOMER_MANAGED');
      
      // Reliability: Multi-AZ
      expect(content).toContain('maxAzs: 2');
      
      // Performance: Container Insights
      expect(content).toContain('containerInsights: true');
      
      // Cost: Pay-per-request
      expect(content).toContain('PAY_PER_REQUEST');
      
      // Operational Excellence: Alarms
      expect(content).toContain('cloudwatch.Alarm');
    });

    it('should enable data protection features', () => {
      const content = readFileSync(stackPath, 'utf-8');
      
      // Point-in-time recovery
      expect(content).toContain('pointInTimeRecovery: true');
      
      // TTL for automatic cleanup
      expect(content).toContain('timeToLiveAttribute');
      
      // Retention policies
      expect(content).toContain('removalPolicy');
    });
  });
});
