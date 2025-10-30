/**
 * Huntaze OnlyFans Infrastructure Stack (CDK)
 * 
 * Provisions:
 * - ECS Fargate cluster for Playwright browser workers
 * - DynamoDB tables (sessions, threads, messages)
 * - KMS encryption
 * - Secrets Manager
 * - CloudWatch monitoring
 */

import * as cdk from 'aws-cdk-lib';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import { Construct } from 'constructs';

export class HuntazeOnlyFansStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ============================================
    // 1. VPC & Networking (Simplified - Public only)
    // ============================================
    const vpc = new ec2.Vpc(this, 'HuntazeVpc', {
      maxAzs: 2,
      natGateways: 0, // No NAT gateways to avoid EIP quota issues
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC
        }
      ]
    });

    const securityGroup = new ec2.SecurityGroup(this, 'BrowserWorkerSG', {
      vpc,
      allowAllOutbound: true, // Required to access OnlyFans
      description: 'Security group for OnlyFans browser worker'
    });

    // ============================================
    // 2. Encryption (KMS)
    // ============================================
    const kmsKey = new kms.Key(this, 'HuntazeKmsKey', {
      enableKeyRotation: true,
      description: 'KMS key for Huntaze OnlyFans data encryption',
      alias: 'huntaze/onlyfans'
    });

    // ============================================
    // 3. DynamoDB Tables
    // ============================================

    // Sessions (Cookies + Auth)
    const sessionsTable = new dynamodb.Table(this, 'HuntazeOfSessions', {
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      encryption: dynamodb.TableEncryption.CUSTOMER_MANAGED,
      encryptionKey: kmsKey,
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      timeToLiveAttribute: 'expiresAt',
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN
    });

    // Conversations
    const threadsTable = new dynamodb.Table(this, 'HuntazeOfThreads', {
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'fanId', type: dynamodb.AttributeType.STRING },
      encryption: dynamodb.TableEncryption.CUSTOMER_MANAGED,
      encryptionKey: kmsKey,
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN
    });

    // Messages
    const messagesTable = new dynamodb.Table(this, 'HuntazeOfMessages', {
      partitionKey: { name: 'taskId', type: dynamodb.AttributeType.STRING },
      timeToLiveAttribute: 'expiresAt',
      encryption: dynamodb.TableEncryption.CUSTOMER_MANAGED,
      encryptionKey: kmsKey,
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN
    });

    // ============================================
    // 4. Secrets Manager
    // ============================================
    const ofCredentialsSecret = new secretsmanager.Secret(this, 'OfCredentials', {
      secretName: 'of/creds/huntaze',
      description: 'OnlyFans credentials',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({
          email: 'placeholder@example.com',
          password: 'placeholder'
        }),
        generateStringKey: 'sessionToken'
      }
    });

    // ============================================
    // 5. CloudWatch Logs
    // ============================================
    const logGroup = new logs.LogGroup(this, 'BrowserWorkerLogs', {
      logGroupName: '/huntaze/of/browser-worker',
      retention: logs.RetentionDays.TWO_WEEKS,
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    // ============================================
    // 6. ECS Cluster
    // ============================================
    const cluster = new ecs.Cluster(this, 'HuntazeEcsCluster', {
      vpc,
      clusterName: 'huntaze-of-fargate',
      containerInsights: true
    });

    // ============================================
    // 7. Task Definition
    // ============================================

    // IAM Role for task
    const taskRole = new iam.Role(this, 'BrowserWorkerTaskRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      description: 'Role for browser worker task'
    });

    // Permissions
    sessionsTable.grantReadWriteData(taskRole);
    threadsTable.grantReadWriteData(taskRole);
    messagesTable.grantReadWriteData(taskRole);
    kmsKey.grantEncryptDecrypt(taskRole);
    ofCredentialsSecret.grantRead(taskRole);
    logGroup.grantWrite(taskRole);

    // Task Definition
    const taskDefinition = new ecs.FargateTaskDefinition(
      this,
      'BrowserWorkerTask',
      {
        memoryLimitMiB: 8192,
        cpu: 2048,
        taskRole,
        family: 'HuntazeOfStackBrowserWorkerTaskCED33274'
      }
    );

    // Container
    const container = taskDefinition.addContainer('of-browser-worker', {
      image: ecs.ContainerImage.fromEcrRepository(
        ecr.Repository.fromRepositoryName(
          this,
          'BrowserWorkerRepo',
          'huntaze/of-browser-worker'
        ),
        'main'
      ),
      logging: ecs.LogDriver.awsLogs({
        streamPrefix: 'of-browser',
        logGroup
      }),
      environment: {
        NODE_ENV: 'production',
        AWS_REGION: 'us-east-1',
        OF_DDB_SESSIONS_TABLE: sessionsTable.tableName,
        OF_DDB_THREADS_TABLE: threadsTable.tableName,
        OF_DDB_MESSAGES_TABLE: messagesTable.tableName,
        OF_KMS_KEY_ID: kmsKey.keyArn,
        OF_LOGIN_SECRET_NAME: ofCredentialsSecret.secretName
      }
    });

    // ============================================
    // 8. CloudWatch Alarms
    // ============================================
    
    // Task failure alarm
    const taskFailureMetric = new cloudwatch.Metric({
      namespace: 'ECS/ContainerInsights',
      metricName: 'TaskCount',
      dimensionsMap: {
        ClusterName: cluster.clusterName
      },
      statistic: 'Average',
      period: cdk.Duration.minutes(1)
    });

    new cloudwatch.Alarm(this, 'BrowserWorkerFailureAlarm', {
      metric: taskFailureMetric,
      threshold: 0,
      evaluationPeriods: 2,
      alarmDescription: 'Alert if browser worker tasks fail',
      alarmName: 'huntaze-of-browser-worker-failure',
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
    });

    // High error rate alarm
    const errorRateMetric = new cloudwatch.Metric({
      namespace: 'Huntaze/OnlyFans/BrowserWorker',
      metricName: 'BrowserTaskError',
      statistic: 'Sum',
      period: cdk.Duration.minutes(5)
    });

    new cloudwatch.Alarm(this, 'BrowserWorkerErrorRateAlarm', {
      metric: errorRateMetric,
      threshold: 10,
      evaluationPeriods: 1,
      alarmDescription: 'Alert if browser worker error rate is high',
      alarmName: 'huntaze-of-browser-worker-error-rate'
    });

    // ============================================
    // 9. Outputs
    // ============================================
    new cdk.CfnOutput(this, 'ClusterArn', {
      value: cluster.clusterArn,
      exportName: 'HuntazeEcsClusterArn',
      description: 'ECS Cluster ARN for browser workers'
    });

    new cdk.CfnOutput(this, 'TaskDefinitionArn', {
      value: taskDefinition.taskDefinitionArn,
      exportName: 'HuntazeBrowserWorkerTaskDef',
      description: 'Task Definition ARN'
    });

    new cdk.CfnOutput(this, 'SessionsTableName', {
      value: sessionsTable.tableName,
      exportName: 'HuntazeOfSessionsTable',
      description: 'DynamoDB Sessions Table'
    });

    new cdk.CfnOutput(this, 'SubnetIds', {
      value: vpc.publicSubnets.map(s => s.subnetId).join(','),
      exportName: 'HuntazeEcsSubnets',
      description: 'Subnet IDs for ECS tasks'
    });

    new cdk.CfnOutput(this, 'SecurityGroupId', {
      value: securityGroup.securityGroupId,
      exportName: 'HuntazeEcsSecurityGroup',
      description: 'Security Group ID for ECS tasks'
    });

    new cdk.CfnOutput(this, 'KmsKeyArn', {
      value: kmsKey.keyArn,
      exportName: 'HuntazeKmsKeyArn',
      description: 'KMS Key ARN for encryption'
    });
  }
}

// Main app
const app = new cdk.App();

new HuntazeOnlyFansStack(app, 'HuntazeOnlyFansStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT || '317805897534',
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1'
  },
  description: 'Huntaze OnlyFans Infrastructure - ECS Fargate + DynamoDB + KMS'
});

app.synth();
