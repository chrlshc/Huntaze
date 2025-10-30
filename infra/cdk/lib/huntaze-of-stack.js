"use strict";
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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.HuntazeOnlyFansStack = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const ecs = __importStar(require("aws-cdk-lib/aws-ecs"));
const ec2 = __importStar(require("aws-cdk-lib/aws-ec2"));
const dynamodb = __importStar(require("aws-cdk-lib/aws-dynamodb"));
const kms = __importStar(require("aws-cdk-lib/aws-kms"));
const secretsmanager = __importStar(require("aws-cdk-lib/aws-secretsmanager"));
const logs = __importStar(require("aws-cdk-lib/aws-logs"));
const iam = __importStar(require("aws-cdk-lib/aws-iam"));
const ecr = __importStar(require("aws-cdk-lib/aws-ecr"));
const cloudwatch = __importStar(require("aws-cdk-lib/aws-cloudwatch"));
class HuntazeOnlyFansStack extends cdk.Stack {
    constructor(scope, id, props) {
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
        const taskDefinition = new ecs.FargateTaskDefinition(this, 'BrowserWorkerTask', {
            memoryLimitMiB: 8192,
            cpu: 2048,
            taskRole,
            family: 'HuntazeOfStackBrowserWorkerTaskCED33274'
        });
        // Container
        const container = taskDefinition.addContainer('of-browser-worker', {
            image: ecs.ContainerImage.fromEcrRepository(ecr.Repository.fromRepositoryName(this, 'BrowserWorkerRepo', 'huntaze/of-browser-worker'), 'main'),
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
exports.HuntazeOnlyFansStack = HuntazeOnlyFansStack;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaHVudGF6ZS1vZi1zdGFjay5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImh1bnRhemUtb2Ytc3RhY2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7Ozs7R0FTRzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBRUgsaURBQW1DO0FBQ25DLHlEQUEyQztBQUMzQyx5REFBMkM7QUFDM0MsbUVBQXFEO0FBQ3JELHlEQUEyQztBQUMzQywrRUFBaUU7QUFDakUsMkRBQTZDO0FBQzdDLHlEQUEyQztBQUMzQyx5REFBMkM7QUFDM0MsdUVBQXlEO0FBR3pELE1BQWEsb0JBQXFCLFNBQVEsR0FBRyxDQUFDLEtBQUs7SUFDakQsWUFBWSxLQUFnQixFQUFFLEVBQVUsRUFBRSxLQUFzQjtRQUM5RCxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUV4QiwrQ0FBK0M7UUFDL0MsaURBQWlEO1FBQ2pELCtDQUErQztRQUMvQyxNQUFNLEdBQUcsR0FBRyxJQUFJLEdBQUcsQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLFlBQVksRUFBRTtZQUMxQyxNQUFNLEVBQUUsQ0FBQztZQUNULFdBQVcsRUFBRSxDQUFDLEVBQUUsNENBQTRDO1lBQzVELG1CQUFtQixFQUFFO2dCQUNuQjtvQkFDRSxRQUFRLEVBQUUsRUFBRTtvQkFDWixJQUFJLEVBQUUsUUFBUTtvQkFDZCxVQUFVLEVBQUUsR0FBRyxDQUFDLFVBQVUsQ0FBQyxNQUFNO2lCQUNsQzthQUNGO1NBQ0YsQ0FBQyxDQUFDO1FBRUgsTUFBTSxhQUFhLEdBQUcsSUFBSSxHQUFHLENBQUMsYUFBYSxDQUFDLElBQUksRUFBRSxpQkFBaUIsRUFBRTtZQUNuRSxHQUFHO1lBQ0gsZ0JBQWdCLEVBQUUsSUFBSSxFQUFFLDhCQUE4QjtZQUN0RCxXQUFXLEVBQUUsNENBQTRDO1NBQzFELENBQUMsQ0FBQztRQUVILCtDQUErQztRQUMvQyxzQkFBc0I7UUFDdEIs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QUFDLENBQUM7QUFFSCxHQUFHLENBQUMsS0FBSyxFQUFFLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEh1bnRhemUgT25seUZhbnMgSW5mcmFzdHJ1Y3R1cmUgU3RhY2sgKENESylcbiAqIFxuICogUHJvdmlzaW9uczpcbiAqIC0gRUNTIEZhcmdhdGUgY2x1c3RlciBmb3IgUGxheXdyaWdodCBicm93c2VyIHdvcmtlcnNcbiAqIC0gRHluYW1vREIgdGFibGVzIChzZXNzaW9ucywgdGhyZWFkcywgbWVzc2FnZXMpXG4gKiAtIEtNUyBlbmNyeXB0aW9uXG4gKiAtIFNlY3JldHMgTWFuYWdlclxuICogLSBDbG91ZFdhdGNoIG1vbml0b3JpbmdcbiAqL1xuXG5pbXBvcnQgKiBhcyBjZGsgZnJvbSAnYXdzLWNkay1saWInO1xuaW1wb3J0ICogYXMgZWNzIGZyb20gJ2F3cy1jZGstbGliL2F3cy1lY3MnO1xuaW1wb3J0ICogYXMgZWMyIGZyb20gJ2F3cy1jZGstbGliL2F3cy1lYzInO1xuaW1wb3J0ICogYXMgZHluYW1vZGIgZnJvbSAnYXdzLWNkay1saWIvYXdzLWR5bmFtb2RiJztcbmltcG9ydCAqIGFzIGttcyBmcm9tICdhd3MtY2RrLWxpYi9hd3Mta21zJztcbmltcG9ydCAqIGFzIHNlY3JldHNtYW5hZ2VyIGZyb20gJ2F3cy1jZGstbGliL2F3cy1zZWNyZXRzbWFuYWdlcic7XG5pbXBvcnQgKiBhcyBsb2dzIGZyb20gJ2F3cy1jZGstbGliL2F3cy1sb2dzJztcbmltcG9ydCAqIGFzIGlhbSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtaWFtJztcbmltcG9ydCAqIGFzIGVjciBmcm9tICdhd3MtY2RrLWxpYi9hd3MtZWNyJztcbmltcG9ydCAqIGFzIGNsb3Vkd2F0Y2ggZnJvbSAnYXdzLWNkay1saWIvYXdzLWNsb3Vkd2F0Y2gnO1xuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSAnY29uc3RydWN0cyc7XG5cbmV4cG9ydCBjbGFzcyBIdW50YXplT25seUZhbnNTdGFjayBleHRlbmRzIGNkay5TdGFjayB7XG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzPzogY2RrLlN0YWNrUHJvcHMpIHtcbiAgICBzdXBlcihzY29wZSwgaWQsIHByb3BzKTtcblxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgLy8gMS4gVlBDICYgTmV0d29ya2luZyAoU2ltcGxpZmllZCAtIFB1YmxpYyBvbmx5KVxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgY29uc3QgdnBjID0gbmV3IGVjMi5WcGModGhpcywgJ0h1bnRhemVWcGMnLCB7XG4gICAgICBtYXhBenM6IDIsXG4gICAgICBuYXRHYXRld2F5czogMCwgLy8gTm8gTkFUIGdhdGV3YXlzIHRvIGF2b2lkIEVJUCBxdW90YSBpc3N1ZXNcbiAgICAgIHN1Ym5ldENvbmZpZ3VyYXRpb246IFtcbiAgICAgICAge1xuICAgICAgICAgIGNpZHJNYXNrOiAyNCxcbiAgICAgICAgICBuYW1lOiAnUHVibGljJyxcbiAgICAgICAgICBzdWJuZXRUeXBlOiBlYzIuU3VibmV0VHlwZS5QVUJMSUNcbiAgICAgICAgfVxuICAgICAgXVxuICAgIH0pO1xuXG4gICAgY29uc3Qgc2VjdXJpdHlHcm91cCA9IG5ldyBlYzIuU2VjdXJpdHlHcm91cCh0aGlzLCAnQnJvd3NlcldvcmtlclNHJywge1xuICAgICAgdnBjLFxuICAgICAgYWxsb3dBbGxPdXRib3VuZDogdHJ1ZSwgLy8gUmVxdWlyZWQgdG8gYWNjZXNzIE9ubHlGYW5zXG4gICAgICBkZXNjcmlwdGlvbjogJ1NlY3VyaXR5IGdyb3VwIGZvciBPbmx5RmFucyBicm93c2VyIHdvcmtlcidcbiAgICB9KTtcblxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgLy8gMi4gRW5jcnlwdGlvbiAoS01TKVxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgY29uc3Qga21zS2V5ID0gbmV3IGttcy5LZXkodGhpcywgJ0h1bnRhemVLbXNLZXknLCB7XG4gICAgICBlbmFibGVLZXlSb3RhdGlvbjogdHJ1ZSxcbiAgICAgIGRlc2NyaXB0aW9uOiAnS01TIGtleSBmb3IgSHVudGF6ZSBPbmx5RmFucyBkYXRhIGVuY3J5cHRpb24nLFxuICAgICAgYWxpYXM6ICdodW50YXplL29ubHlmYW5zJ1xuICAgIH0pO1xuXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAvLyAzLiBEeW5hbW9EQiBUYWJsZXNcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXG4gICAgLy8gU2Vzc2lvbnMgKENvb2tpZXMgKyBBdXRoKVxuICAgIGNvbnN0IHNlc3Npb25zVGFibGUgPSBuZXcgZHluYW1vZGIuVGFibGUodGhpcywgJ0h1bnRhemVPZlNlc3Npb25zJywge1xuICAgICAgcGFydGl0aW9uS2V5OiB7IG5hbWU6ICd1c2VySWQnLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxuICAgICAgZW5jcnlwdGlvbjogZHluYW1vZGIuVGFibGVFbmNyeXB0aW9uLkNVU1RPTUVSX01BTkFHRUQsXG4gICAgICBlbmNyeXB0aW9uS2V5OiBrbXNLZXksXG4gICAgICBiaWxsaW5nTW9kZTogZHluYW1vZGIuQmlsbGluZ01vZGUuUEFZX1BFUl9SRVFVRVNULFxuICAgICAgdGltZVRvTGl2ZUF0dHJpYnV0ZTogJ2V4cGlyZXNBdCcsXG4gICAgICBwb2ludEluVGltZVJlY292ZXJ5OiB0cnVlLFxuICAgICAgcmVtb3ZhbFBvbGljeTogY2RrLlJlbW92YWxQb2xpY3kuUkVUQUlOXG4gICAgfSk7XG5cbiAgICAvLyBDb252ZXJzYXRpb25zXG4gICAgY29uc3QgdGhyZWFkc1RhYmxlID0gbmV3IGR5bmFtb2RiLlRhYmxlKHRoaXMsICdIdW50YXplT2ZUaHJlYWRzJywge1xuICAgICAgcGFydGl0aW9uS2V5OiB7IG5hbWU6ICd1c2VySWQnLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxuICAgICAgc29ydEtleTogeyBuYW1lOiAnZmFuSWQnLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxuICAgICAgZW5jcnlwdGlvbjogZHluYW1vZGIuVGFibGVFbmNyeXB0aW9uLkNVU1RPTUVSX01BTkFHRUQsXG4gICAgICBlbmNyeXB0aW9uS2V5OiBrbXNLZXksXG4gICAgICBiaWxsaW5nTW9kZTogZHluYW1vZGIuQmlsbGluZ01vZGUuUEFZX1BFUl9SRVFVRVNULFxuICAgICAgcG9pbnRJblRpbWVSZWNvdmVyeTogdHJ1ZSxcbiAgICAgIHJlbW92YWxQb2xpY3k6IGNkay5SZW1vdmFsUG9saWN5LlJFVEFJTlxuICAgIH0pO1xuXG4gICAgLy8gTWVzc2FnZXNcbiAgICBjb25zdCBtZXNzYWdlc1RhYmxlID0gbmV3IGR5bmFtb2RiLlRhYmxlKHRoaXMsICdIdW50YXplT2ZNZXNzYWdlcycsIHtcbiAgICAgIHBhcnRpdGlvbktleTogeyBuYW1lOiAndGFza0lkJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcbiAgICAgIHRpbWVUb0xpdmVBdHRyaWJ1dGU6ICdleHBpcmVzQXQnLFxuICAgICAgZW5jcnlwdGlvbjogZHluYW1vZGIuVGFibGVFbmNyeXB0aW9uLkNVU1RPTUVSX01BTkFHRUQsXG4gICAgICBlbmNyeXB0aW9uS2V5OiBrbXNLZXksXG4gICAgICBiaWxsaW5nTW9kZTogZHluYW1vZGIuQmlsbGluZ01vZGUuUEFZX1BFUl9SRVFVRVNULFxuICAgICAgcmVtb3ZhbFBvbGljeTogY2RrLlJlbW92YWxQb2xpY3kuUkVUQUlOXG4gICAgfSk7XG5cbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIC8vIDQuIFNlY3JldHMgTWFuYWdlclxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgY29uc3Qgb2ZDcmVkZW50aWFsc1NlY3JldCA9IG5ldyBzZWNyZXRzbWFuYWdlci5TZWNyZXQodGhpcywgJ09mQ3JlZGVudGlhbHMnLCB7XG4gICAgICBzZWNyZXROYW1lOiAnb2YvY3JlZHMvaHVudGF6ZScsXG4gICAgICBkZXNjcmlwdGlvbjogJ09ubHlGYW5zIGNyZWRlbnRpYWxzJyxcbiAgICAgIGdlbmVyYXRlU2VjcmV0U3RyaW5nOiB7XG4gICAgICAgIHNlY3JldFN0cmluZ1RlbXBsYXRlOiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgZW1haWw6ICdwbGFjZWhvbGRlckBleGFtcGxlLmNvbScsXG4gICAgICAgICAgcGFzc3dvcmQ6ICdwbGFjZWhvbGRlcidcbiAgICAgICAgfSksXG4gICAgICAgIGdlbmVyYXRlU3RyaW5nS2V5OiAnc2Vzc2lvblRva2VuJ1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAvLyA1LiBDbG91ZFdhdGNoIExvZ3NcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIGNvbnN0IGxvZ0dyb3VwID0gbmV3IGxvZ3MuTG9nR3JvdXAodGhpcywgJ0Jyb3dzZXJXb3JrZXJMb2dzJywge1xuICAgICAgbG9nR3JvdXBOYW1lOiAnL2h1bnRhemUvb2YvYnJvd3Nlci13b3JrZXInLFxuICAgICAgcmV0ZW50aW9uOiBsb2dzLlJldGVudGlvbkRheXMuVFdPX1dFRUtTLFxuICAgICAgcmVtb3ZhbFBvbGljeTogY2RrLlJlbW92YWxQb2xpY3kuREVTVFJPWVxuICAgIH0pO1xuXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAvLyA2LiBFQ1MgQ2x1c3RlclxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgY29uc3QgY2x1c3RlciA9IG5ldyBlY3MuQ2x1c3Rlcih0aGlzLCAnSHVudGF6ZUVjc0NsdXN0ZXInLCB7XG4gICAgICB2cGMsXG4gICAgICBjbHVzdGVyTmFtZTogJ2h1bnRhemUtb2YtZmFyZ2F0ZScsXG4gICAgICBjb250YWluZXJJbnNpZ2h0czogdHJ1ZVxuICAgIH0pO1xuXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAvLyA3LiBUYXNrIERlZmluaXRpb25cbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXG4gICAgLy8gSUFNIFJvbGUgZm9yIHRhc2tcbiAgICBjb25zdCB0YXNrUm9sZSA9IG5ldyBpYW0uUm9sZSh0aGlzLCAnQnJvd3NlcldvcmtlclRhc2tSb2xlJywge1xuICAgICAgYXNzdW1lZEJ5OiBuZXcgaWFtLlNlcnZpY2VQcmluY2lwYWwoJ2Vjcy10YXNrcy5hbWF6b25hd3MuY29tJyksXG4gICAgICBkZXNjcmlwdGlvbjogJ1JvbGUgZm9yIGJyb3dzZXIgd29ya2VyIHRhc2snXG4gICAgfSk7XG5cbiAgICAvLyBQZXJtaXNzaW9uc1xuICAgIHNlc3Npb25zVGFibGUuZ3JhbnRSZWFkV3JpdGVEYXRhKHRhc2tSb2xlKTtcbiAgICB0aHJlYWRzVGFibGUuZ3JhbnRSZWFkV3JpdGVEYXRhKHRhc2tSb2xlKTtcbiAgICBtZXNzYWdlc1RhYmxlLmdyYW50UmVhZFdyaXRlRGF0YSh0YXNrUm9sZSk7XG4gICAga21zS2V5LmdyYW50RW5jcnlwdERlY3J5cHQodGFza1JvbGUpO1xuICAgIG9mQ3JlZGVudGlhbHNTZWNyZXQuZ3JhbnRSZWFkKHRhc2tSb2xlKTtcbiAgICBsb2dHcm91cC5ncmFudFdyaXRlKHRhc2tSb2xlKTtcblxuICAgIC8vIFRhc2sgRGVmaW5pdGlvblxuICAgIGNvbnN0IHRhc2tEZWZpbml0aW9uID0gbmV3IGVjcy5GYXJnYXRlVGFza0RlZmluaXRpb24oXG4gICAgICB0aGlzLFxuICAgICAgJ0Jyb3dzZXJXb3JrZXJUYXNrJyxcbiAgICAgIHtcbiAgICAgICAgbWVtb3J5TGltaXRNaUI6IDgxOTIsXG4gICAgICAgIGNwdTogMjA0OCxcbiAgICAgICAgdGFza1JvbGUsXG4gICAgICAgIGZhbWlseTogJ0h1bnRhemVPZlN0YWNrQnJvd3NlcldvcmtlclRhc2tDRUQzMzI3NCdcbiAgICAgIH1cbiAgICApO1xuXG4gICAgLy8gQ29udGFpbmVyXG4gICAgY29uc3QgY29udGFpbmVyID0gdGFza0RlZmluaXRpb24uYWRkQ29udGFpbmVyKCdvZi1icm93c2VyLXdvcmtlcicsIHtcbiAgICAgIGltYWdlOiBlY3MuQ29udGFpbmVySW1hZ2UuZnJvbUVjclJlcG9zaXRvcnkoXG4gICAgICAgIGVjci5SZXBvc2l0b3J5LmZyb21SZXBvc2l0b3J5TmFtZShcbiAgICAgICAgICB0aGlzLFxuICAgICAgICAgICdCcm93c2VyV29ya2VyUmVwbycsXG4gICAgICAgICAgJ2h1bnRhemUvb2YtYnJvd3Nlci13b3JrZXInXG4gICAgICAgICksXG4gICAgICAgICdtYWluJ1xuICAgICAgKSxcbiAgICAgIGxvZ2dpbmc6IGVjcy5Mb2dEcml2ZXIuYXdzTG9ncyh7XG4gICAgICAgIHN0cmVhbVByZWZpeDogJ29mLWJyb3dzZXInLFxuICAgICAgICBsb2dHcm91cFxuICAgICAgfSksXG4gICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICBOT0RFX0VOVjogJ3Byb2R1Y3Rpb24nLFxuICAgICAgICBBV1NfUkVHSU9OOiAndXMtZWFzdC0xJyxcbiAgICAgICAgT0ZfRERCX1NFU1NJT05TX1RBQkxFOiBzZXNzaW9uc1RhYmxlLnRhYmxlTmFtZSxcbiAgICAgICAgT0ZfRERCX1RIUkVBRFNfVEFCTEU6IHRocmVhZHNUYWJsZS50YWJsZU5hbWUsXG4gICAgICAgIE9GX0REQl9NRVNTQUdFU19UQUJMRTogbWVzc2FnZXNUYWJsZS50YWJsZU5hbWUsXG4gICAgICAgIE9GX0tNU19LRVlfSUQ6IGttc0tleS5rZXlBcm4sXG4gICAgICAgIE9GX0xPR0lOX1NFQ1JFVF9OQU1FOiBvZkNyZWRlbnRpYWxzU2VjcmV0LnNlY3JldE5hbWVcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgLy8gOC4gQ2xvdWRXYXRjaCBBbGFybXNcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIFxuICAgIC8vIFRhc2sgZmFpbHVyZSBhbGFybVxuICAgIGNvbnN0IHRhc2tGYWlsdXJlTWV0cmljID0gbmV3IGNsb3Vkd2F0Y2guTWV0cmljKHtcbiAgICAgIG5hbWVzcGFjZTogJ0VDUy9Db250YWluZXJJbnNpZ2h0cycsXG4gICAgICBtZXRyaWNOYW1lOiAnVGFza0NvdW50JyxcbiAgICAgIGRpbWVuc2lvbnNNYXA6IHtcbiAgICAgICAgQ2x1c3Rlck5hbWU6IGNsdXN0ZXIuY2x1c3Rlck5hbWVcbiAgICAgIH0sXG4gICAgICBzdGF0aXN0aWM6ICdBdmVyYWdlJyxcbiAgICAgIHBlcmlvZDogY2RrLkR1cmF0aW9uLm1pbnV0ZXMoMSlcbiAgICB9KTtcblxuICAgIG5ldyBjbG91ZHdhdGNoLkFsYXJtKHRoaXMsICdCcm93c2VyV29ya2VyRmFpbHVyZUFsYXJtJywge1xuICAgICAgbWV0cmljOiB0YXNrRmFpbHVyZU1ldHJpYyxcbiAgICAgIHRocmVzaG9sZDogMCxcbiAgICAgIGV2YWx1YXRpb25QZXJpb2RzOiAyLFxuICAgICAgYWxhcm1EZXNjcmlwdGlvbjogJ0FsZXJ0IGlmIGJyb3dzZXIgd29ya2VyIHRhc2tzIGZhaWwnLFxuICAgICAgYWxhcm1OYW1lOiAnaHVudGF6ZS1vZi1icm93c2VyLXdvcmtlci1mYWlsdXJlJyxcbiAgICAgIHRyZWF0TWlzc2luZ0RhdGE6IGNsb3Vkd2F0Y2guVHJlYXRNaXNzaW5nRGF0YS5OT1RfQlJFQUNISU5HXG4gICAgfSk7XG5cbiAgICAvLyBIaWdoIGVycm9yIHJhdGUgYWxhcm1cbiAgICBjb25zdCBlcnJvclJhdGVNZXRyaWMgPSBuZXcgY2xvdWR3YXRjaC5NZXRyaWMoe1xuICAgICAgbmFtZXNwYWNlOiAnSHVudGF6ZS9Pbmx5RmFucy9Ccm93c2VyV29ya2VyJyxcbiAgICAgIG1ldHJpY05hbWU6ICdCcm93c2VyVGFza0Vycm9yJyxcbiAgICAgIHN0YXRpc3RpYzogJ1N1bScsXG4gICAgICBwZXJpb2Q6IGNkay5EdXJhdGlvbi5taW51dGVzKDUpXG4gICAgfSk7XG5cbiAgICBuZXcgY2xvdWR3YXRjaC5BbGFybSh0aGlzLCAnQnJvd3NlcldvcmtlckVycm9yUmF0ZUFsYXJtJywge1xuICAgICAgbWV0cmljOiBlcnJvclJhdGVNZXRyaWMsXG4gICAgICB0aHJlc2hvbGQ6IDEwLFxuICAgICAgZXZhbHVhdGlvblBlcmlvZHM6IDEsXG4gICAgICBhbGFybURlc2NyaXB0aW9uOiAnQWxlcnQgaWYgYnJvd3NlciB3b3JrZXIgZXJyb3IgcmF0ZSBpcyBoaWdoJyxcbiAgICAgIGFsYXJtTmFtZTogJ2h1bnRhemUtb2YtYnJvd3Nlci13b3JrZXItZXJyb3ItcmF0ZSdcbiAgICB9KTtcblxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgLy8gOS4gT3V0cHV0c1xuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ0NsdXN0ZXJBcm4nLCB7XG4gICAgICB2YWx1ZTogY2x1c3Rlci5jbHVzdGVyQXJuLFxuICAgICAgZXhwb3J0TmFtZTogJ0h1bnRhemVFY3NDbHVzdGVyQXJuJyxcbiAgICAgIGRlc2NyaXB0aW9uOiAnRUNTIENsdXN0ZXIgQVJOIGZvciBicm93c2VyIHdvcmtlcnMnXG4gICAgfSk7XG5cbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnVGFza0RlZmluaXRpb25Bcm4nLCB7XG4gICAgICB2YWx1ZTogdGFza0RlZmluaXRpb24udGFza0RlZmluaXRpb25Bcm4sXG4gICAgICBleHBvcnROYW1lOiAnSHVudGF6ZUJyb3dzZXJXb3JrZXJUYXNrRGVmJyxcbiAgICAgIGRlc2NyaXB0aW9uOiAnVGFzayBEZWZpbml0aW9uIEFSTidcbiAgICB9KTtcblxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdTZXNzaW9uc1RhYmxlTmFtZScsIHtcbiAgICAgIHZhbHVlOiBzZXNzaW9uc1RhYmxlLnRhYmxlTmFtZSxcbiAgICAgIGV4cG9ydE5hbWU6ICdIdW50YXplT2ZTZXNzaW9uc1RhYmxlJyxcbiAgICAgIGRlc2NyaXB0aW9uOiAnRHluYW1vREIgU2Vzc2lvbnMgVGFibGUnXG4gICAgfSk7XG5cbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnU3VibmV0SWRzJywge1xuICAgICAgdmFsdWU6IHZwYy5wdWJsaWNTdWJuZXRzLm1hcChzID0+IHMuc3VibmV0SWQpLmpvaW4oJywnKSxcbiAgICAgIGV4cG9ydE5hbWU6ICdIdW50YXplRWNzU3VibmV0cycsXG4gICAgICBkZXNjcmlwdGlvbjogJ1N1Ym5ldCBJRHMgZm9yIEVDUyB0YXNrcydcbiAgICB9KTtcblxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdTZWN1cml0eUdyb3VwSWQnLCB7XG4gICAgICB2YWx1ZTogc2VjdXJpdHlHcm91cC5zZWN1cml0eUdyb3VwSWQsXG4gICAgICBleHBvcnROYW1lOiAnSHVudGF6ZUVjc1NlY3VyaXR5R3JvdXAnLFxuICAgICAgZGVzY3JpcHRpb246ICdTZWN1cml0eSBHcm91cCBJRCBmb3IgRUNTIHRhc2tzJ1xuICAgIH0pO1xuXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ0ttc0tleUFybicsIHtcbiAgICAgIHZhbHVlOiBrbXNLZXkua2V5QXJuLFxuICAgICAgZXhwb3J0TmFtZTogJ0h1bnRhemVLbXNLZXlBcm4nLFxuICAgICAgZGVzY3JpcHRpb246ICdLTVMgS2V5IEFSTiBmb3IgZW5jcnlwdGlvbidcbiAgICB9KTtcbiAgfVxufVxuXG4vLyBNYWluIGFwcFxuY29uc3QgYXBwID0gbmV3IGNkay5BcHAoKTtcblxubmV3IEh1bnRhemVPbmx5RmFuc1N0YWNrKGFwcCwgJ0h1bnRhemVPbmx5RmFuc1N0YWNrJywge1xuICBlbnY6IHtcbiAgICBhY2NvdW50OiBwcm9jZXNzLmVudi5DREtfREVGQVVMVF9BQ0NPVU5UIHx8ICczMTc4MDU4OTc1MzQnLFxuICAgIHJlZ2lvbjogcHJvY2Vzcy5lbnYuQ0RLX0RFRkFVTFRfUkVHSU9OIHx8ICd1cy1lYXN0LTEnXG4gIH0sXG4gIGRlc2NyaXB0aW9uOiAnSHVudGF6ZSBPbmx5RmFucyBJbmZyYXN0cnVjdHVyZSAtIEVDUyBGYXJnYXRlICsgRHluYW1vREIgKyBLTVMnXG59KTtcblxuYXBwLnN5bnRoKCk7XG4iXX0=