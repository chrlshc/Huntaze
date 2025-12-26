"use strict";
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
exports.HuntazeOfStack = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const aws_cdk_lib_1 = require("aws-cdk-lib");
const dynamo = __importStar(require("aws-cdk-lib/aws-dynamodb"));
const kms = __importStar(require("aws-cdk-lib/aws-kms"));
const sqs = __importStar(require("aws-cdk-lib/aws-sqs"));
const ec2 = __importStar(require("aws-cdk-lib/aws-ec2"));
const ecs = __importStar(require("aws-cdk-lib/aws-ecs"));
const ecr_assets = __importStar(require("aws-cdk-lib/aws-ecr-assets"));
const iam = __importStar(require("aws-cdk-lib/aws-iam"));
const logs = __importStar(require("aws-cdk-lib/aws-logs"));
const lambda = __importStar(require("aws-cdk-lib/aws-lambda"));
const lambdaNode = __importStar(require("aws-cdk-lib/aws-lambda-nodejs"));
const events = __importStar(require("aws-cdk-lib/aws-events"));
const targets = __importStar(require("aws-cdk-lib/aws-events-targets"));
const ecr = __importStar(require("aws-cdk-lib/aws-ecr"));
const cloudwatch = __importStar(require("aws-cdk-lib/aws-cloudwatch"));
const sns = __importStar(require("aws-cdk-lib/aws-sns"));
const cloudwatch_actions = __importStar(require("aws-cdk-lib/aws-cloudwatch-actions"));
const path = __importStar(require("path"));
const cr = __importStar(require("aws-cdk-lib/custom-resources"));
class HuntazeOfStack extends aws_cdk_lib_1.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        const key = new kms.Key(this, 'OfSessionsKmsKey', {
            alias: 'alias/huntaze-of-sessions',
            enableKeyRotation: true
        });
        const sessions = new dynamo.Table(this, 'Sessions', {
            tableName: 'HuntazeOfSessions',
            partitionKey: { name: 'userId', type: dynamo.AttributeType.STRING },
            billingMode: dynamo.BillingMode.PAY_PER_REQUEST,
            removalPolicy: aws_cdk_lib_1.RemovalPolicy.RETAIN,
            encryption: dynamo.TableEncryption.AWS_MANAGED,
        });
        const messages = new dynamo.Table(this, 'Messages', {
            tableName: 'HuntazeOfMessages',
            partitionKey: { name: 'id', type: dynamo.AttributeType.STRING },
            billingMode: dynamo.BillingMode.PAY_PER_REQUEST,
            removalPolicy: aws_cdk_lib_1.RemovalPolicy.RETAIN,
            encryption: dynamo.TableEncryption.AWS_MANAGED,
        });
        // Threads mapping (userId, conversationId) -> url
        const threads = new dynamo.Table(this, 'Threads', {
            tableName: 'HuntazeOfThreads',
            partitionKey: { name: 'userId', type: dynamo.AttributeType.STRING },
            sortKey: { name: 'conversationId', type: dynamo.AttributeType.STRING },
            billingMode: dynamo.BillingMode.PAY_PER_REQUEST,
            removalPolicy: aws_cdk_lib_1.RemovalPolicy.RETAIN,
            encryption: dynamo.TableEncryption.AWS_MANAGED,
        });
        const sendQueue = new sqs.Queue(this, 'OfSendQueue', {
            queueName: 'HuntazeOfSendQueue',
            visibilityTimeout: aws_cdk_lib_1.Duration.seconds(120),
            retentionPeriod: aws_cdk_lib_1.Duration.days(4)
        });
        // Keep legacy VPC but ensure no NAT Gateway is created (cost-safe)
        const vpc = new ec2.Vpc(this, 'OfVpc', { natGateways: 0, maxAzs: 2 });
        // New cost-safe VPC for workers (public-only, no NAT)
        const workerVpc = new ec2.Vpc(this, 'WorkerVpc', {
            ipAddresses: ec2.IpAddresses.cidr('10.2.0.0/16'),
            natGateways: 0,
            maxAzs: 2,
            subnetConfiguration: [
                { name: 'Public', subnetType: ec2.SubnetType.PUBLIC, cidrMask: 20 },
            ],
        });
        const taskSg = new ec2.SecurityGroup(this, 'OfTaskSg', { vpc: workerVpc, description: 'Egress-only', allowAllOutbound: true });
        const cluster = new ecs.Cluster(this, 'OfCluster', { vpc: workerVpc });
        const useRegistryImage = (process.env.USE_REGISTRY_IMAGE === '1' || process.env.USE_REGISTRY_IMAGE === 'true');
        const useEcrImage = (process.env.USE_ECR_IMAGE === '1' || process.env.USE_ECR_IMAGE === 'true');
        const taskDef = new ecs.FargateTaskDefinition(this, 'BrowserWorkerTask', {
            memoryLimitMiB: 8192,
            cpu: 2048,
            runtimePlatform: {
                cpuArchitecture: ecs.CpuArchitecture.X86_64,
                operatingSystemFamily: ecs.OperatingSystemFamily.LINUX,
            },
        });
        const logGroup = new logs.LogGroup(this, 'BrowserWorkerLogs', {
            logGroupName: '/huntaze/of/browser-worker', retention: logs.RetentionDays.ONE_WEEK, removalPolicy: aws_cdk_lib_1.RemovalPolicy.DESTROY
        });
        let image;
        // Resolve repo root regardless of current working directory (handles CodeBuild/CDK contexts)
        const repoRoot = path.resolve(__dirname, '../../../..');
        if (useEcrImage) {
            const ecrRepoName = process.env.ECR_REPOSITORY || 'huntaze/of-browser-worker';
            const ecrTag = process.env.ECR_IMAGE_TAG || 'main';
            const repo = ecr.Repository.fromRepositoryName(this, 'BrowserWorkerEcrRepo', ecrRepoName);
            image = ecs.ContainerImage.fromEcrRepository(repo, ecrTag);
        }
        else if (useRegistryImage) {
            // Keep registry fallback aligned with worker's Playwright version
            image = ecs.ContainerImage.fromRegistry('mcr.microsoft.com/playwright:v1.56.0-jammy');
        }
        else {
            if (useEcrImage) {
                throw new Error('USE_ECR_IMAGE=1 is set but ECR branch not selected; refusing to build DockerImageAsset');
            }
            image = ecs.ContainerImage.fromDockerImageAsset(new ecr_assets.DockerImageAsset(this, 'BrowserWorkerImage', {
                directory: path.resolve(repoRoot, 'infra/fargate/browser-worker'),
                platform: ecr_assets.Platform.LINUX_AMD64,
            }));
        }
        const container = taskDef.addContainer('of-browser-worker', {
            image,
            logging: ecs.LogDrivers.awsLogs({ logGroup, streamPrefix: 'of-browser' }),
            environment: {
                OF_DDB_SESSIONS_TABLE: sessions.tableName,
                OF_DDB_MESSAGES_TABLE: messages.tableName,
                OF_DDB_THREADS_TABLE: threads.tableName,
                OF_KMS_KEY_ID: key.keyArn,
            },
            command: useRegistryImage && !useEcrImage ? ['node', '-e', "console.log('Browser worker placeholder image (no app code)'); setTimeout(()=>{}, 3600000);"] : undefined,
        });
        // Force runtime platform to X86_64 to match image arch
        const cfnTask = taskDef.node.defaultChild;
        cfnTask.addOverride('Properties.RuntimePlatform.CpuArchitecture', 'X86_64');
        cfnTask.addOverride('Properties.RuntimePlatform.OperatingSystemFamily', 'LINUX');
        container.addUlimits({ name: ecs.UlimitName.NOFILE, softLimit: 8192, hardLimit: 8192 });
        sessions.grantReadWriteData(taskDef.taskRole);
        messages.grantReadWriteData(taskDef.taskRole);
        threads.grantReadWriteData(taskDef.taskRole);
        key.grantEncryptDecrypt(taskDef.taskRole);
        // Optionally allow worker to upload Playwright artifacts to S3 if TRACE_S3_BUCKET is provided at deploy-time
        const traceBucketName = process.env.TRACE_S3_BUCKET;
        if (traceBucketName) {
            taskDef.taskRole.addToPrincipalPolicy(new iam.PolicyStatement({
                actions: ['s3:PutObject'],
                resources: [
                    `arn:aws:s3:::${traceBucketName}/*`
                ],
            }));
        }
        taskDef.taskRole.addToPrincipalPolicy(new iam.PolicyStatement({
            actions: ['secretsmanager:GetSecretValue'],
            resources: [
                `arn:aws:secretsmanager:${cdk.Stack.of(this).region}:${cdk.Stack.of(this).account}:secret:of/creds/*`
            ]
        }));
        if (taskDef.executionRole) {
            taskDef.executionRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy'));
        }
        const depsLockFilePath = path.resolve(repoRoot, 'infra/cdk/package-lock.json');
        const sendWorker = new lambdaNode.NodejsFunction(this, 'SendWorker', {
            runtime: lambda.Runtime.NODEJS_18_X,
            entry: path.resolve(repoRoot, 'infra/lambda/send-worker/index.ts'),
            timeout: aws_cdk_lib_1.Duration.seconds(30), memorySize: 256,
            depsLockFilePath,
            bundling: {
                externalModules: ['@aws-sdk/*'],
                target: 'node18',
                minify: false,
                sourceMap: false,
            },
            environment: {
                OF_ECS_CLUSTER_ARN: cluster.clusterArn,
                OF_ECS_TASKDEF_ARN: taskDef.taskDefinitionArn,
                // Use public subnets of WorkerVpc (assignPublicIp ENABLED in dispatcher)
                OF_VPC_SUBNETS: workerVpc.publicSubnets.map(s => s.subnetId).join(','),
                OF_TASK_SG_ID: taskSg.securityGroupId,
                OF_DDB_SESSIONS_TABLE: sessions.tableName,
                OF_DDB_MESSAGES_TABLE: messages.tableName,
                OF_KMS_KEY_ID: key.keyArn,
                APP_ORIGIN: process.env.APP_ORIGIN || process.env.NEXT_PUBLIC_APP_URL || 'https://app.huntaze.com',
                WORKER_TOKEN: process.env.WORKER_TOKEN || process.env.OF_WORKER_TOKEN || '',
            }
        });
        // Allow the send worker Lambda to read/write session state (mutex, flags)
        sessions.grantReadWriteData(sendWorker);
        messages.grantReadWriteData(sendWorker);
        const { SqsEventSource } = require('aws-cdk-lib/aws-lambda-event-sources');
        sendWorker.addEventSource(new SqsEventSource(sendQueue, {
            batchSize: 10,
            reportBatchItemFailures: true,
            maxConcurrency: 10,
        }));
        sendWorker.addToRolePolicy(new iam.PolicyStatement({ actions: ['ecs:RunTask', 'iam:PassRole'], resources: ['*'] }));
        const syncDispatcher = new lambdaNode.NodejsFunction(this, 'SyncDispatcher', {
            runtime: lambda.Runtime.NODEJS_18_X,
            entry: path.resolve(repoRoot, 'infra/lambda/sync-dispatcher/index.ts'),
            timeout: aws_cdk_lib_1.Duration.seconds(60), memorySize: 256,
            depsLockFilePath,
            bundling: {
                externalModules: ['@aws-sdk/*'],
                target: 'node18',
                minify: false,
                sourceMap: false,
            },
            environment: {
                OF_ECS_CLUSTER_ARN: cluster.clusterArn,
                OF_ECS_TASKDEF_ARN: taskDef.taskDefinitionArn,
                OF_VPC_SUBNETS: workerVpc.publicSubnets.map(s => s.subnetId).join(','),
                OF_TASK_SG_ID: taskSg.securityGroupId,
                OF_DDB_SESSIONS_TABLE: sessions.tableName,
                OF_DDB_MESSAGES_TABLE: messages.tableName,
                OF_KMS_KEY_ID: key.keyArn,
                APP_ORIGIN: process.env.APP_ORIGIN || process.env.NEXT_PUBLIC_APP_URL || 'https://app.huntaze.com',
                WORKER_TOKEN: process.env.WORKER_TOKEN || process.env.OF_WORKER_TOKEN || '',
            }
        });
        sessions.grantReadData(syncDispatcher);
        syncDispatcher.addToRolePolicy(new iam.PolicyStatement({ actions: ['ecs:RunTask', 'iam:PassRole'], resources: ['*'] }));
        // Feature flag: disable periodic inbox sync by default; enable with `-c enableInboxSync=true`
        const enableInboxSync = this.node.tryGetContext('enableInboxSync') === 'true';
        if (enableInboxSync) {
            new events.Rule(this, 'InboxSyncRule', {
                schedule: events.Schedule.rate(aws_cdk_lib_1.Duration.minutes(5)),
                targets: [new targets.LambdaFunction(syncDispatcher)]
            });
        }
        // Alarms and Dashboard for OFWorker custom metrics
        const alertsTopicArn = process.env.ALERTS_SNS_TOPIC_ARN || `arn:aws:sns:${cdk.Stack.of(this).region}:${cdk.Stack.of(this).account}:alerts`;
        const alertsTopic = sns.Topic.fromTopicArn(this, 'AlertsTopic', alertsTopicArn);
        const ns = 'Huntaze/OFWorker';
        const loginFailuresMetric = new cloudwatch.Metric({ namespace: ns, metricName: 'LoginFailures', statistic: 'sum', period: aws_cdk_lib_1.Duration.minutes(60) });
        const memUsageMetric = new cloudwatch.Metric({ namespace: ns, metricName: 'MemoryUsageMB', statistic: 'max', period: aws_cdk_lib_1.Duration.minutes(5) });
        const loginFailAlarm = new cloudwatch.Alarm(this, 'OFLoginFailuresGt5', {
            metric: loginFailuresMetric,
            threshold: 5,
            evaluationPeriods: 1,
            datapointsToAlarm: 1,
            treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
            alarmDescription: 'OF login failures > 5 in the last hour',
        });
        loginFailAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(alertsTopic));
        const memHighAlarm = new cloudwatch.Alarm(this, 'OFMemoryUsageHigh', {
            metric: memUsageMetric,
            threshold: 7000,
            evaluationPeriods: 1,
            datapointsToAlarm: 1,
            treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
            alarmDescription: 'OF worker memory usage over 7000 MB',
        });
        memHighAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(alertsTopic));
        const dashboard = new cloudwatch.Dashboard(this, 'OFWorkerDashboard', { dashboardName: `${cdk.Stack.of(this).stackName}-OFWorker` });
        dashboard.addWidgets(new cloudwatch.GraphWidget({
            title: 'Login Success/Failure (per 5m)',
            width: 12,
            left: [
                new cloudwatch.Metric({ namespace: ns, metricName: 'LoginSuccessCount', statistic: 'sum', period: aws_cdk_lib_1.Duration.minutes(5) }),
                new cloudwatch.Metric({ namespace: ns, metricName: 'LoginFailureCount', statistic: 'sum', period: aws_cdk_lib_1.Duration.minutes(5) }),
            ],
        }), new cloudwatch.GraphWidget({
            title: 'Action Duration (ms)',
            width: 12,
            left: [new cloudwatch.Metric({ namespace: ns, metricName: 'ActionDurationMs', statistic: 'avg', period: aws_cdk_lib_1.Duration.minutes(5) })],
        }), new cloudwatch.GraphWidget({
            title: 'Session Duration (ms) & Memory (MB)',
            width: 24,
            left: [
                new cloudwatch.Metric({ namespace: ns, metricName: 'SessionDurationMs', statistic: 'avg', period: aws_cdk_lib_1.Duration.minutes(5) }),
                new cloudwatch.Metric({ namespace: ns, metricName: 'MemoryUsageMB', statistic: 'max', period: aws_cdk_lib_1.Duration.minutes(5) }),
            ],
        }));
        new cdk.CfnOutput(this, 'SendQueueUrl', { value: sendQueue.queueUrl });
        new cdk.CfnOutput(this, 'SessionsTable', { value: sessions.tableName });
        new cdk.CfnOutput(this, 'MessagesTable', { value: messages.tableName });
        new cdk.CfnOutput(this, 'ThreadsTable', { value: threads.tableName });
        new cdk.CfnOutput(this, 'KmsKeyArn', { value: key.keyArn });
        new cdk.CfnOutput(this, 'ClusterArn', { value: cluster.clusterArn });
        new cdk.CfnOutput(this, 'TaskDefArn', { value: taskDef.taskDefinitionArn });
        new cdk.CfnOutput(this, 'TaskSecurityGroup', { value: taskSg.securityGroupId });
        new cdk.CfnOutput(this, 'WorkerSubnetsPublic', { value: workerVpc.publicSubnets.map(s => s.subnetId).join(',') });
        // Persist commonly-needed values to SSM Parameter Store for CI/load tests
        // Use AwsCustomResource with Overwrite=true to avoid failures if parameters already exist.
        const putParam = (id, name, value) => new cr.AwsCustomResource(this, id, {
            onCreate: { service: 'SSM', action: 'putParameter', parameters: { Name: name, Type: 'String', Value: value, Overwrite: true }, physicalResourceId: cr.PhysicalResourceId.of(`${name}:v1`) },
            onUpdate: { service: 'SSM', action: 'putParameter', parameters: { Name: name, Type: 'String', Value: value, Overwrite: true }, physicalResourceId: cr.PhysicalResourceId.of(`${name}:v1`) },
            policy: cr.AwsCustomResourcePolicy.fromSdkCalls({ resources: cr.AwsCustomResourcePolicy.ANY_RESOURCE }),
        });
        putParam('OfClusterArnParam', '/huntaze/of/clusterArn', cluster.clusterArn);
        putParam('OfTaskDefArnParam', '/huntaze/of/taskDefArn', taskDef.taskDefinitionArn);
        putParam('OfSubnetsParam', '/huntaze/of/subnets', workerVpc.publicSubnets.map(s => s.subnetId).join(','));
        putParam('OfSecurityGroupParam', '/huntaze/of/securityGroup', taskSg.securityGroupId);
        putParam('OfUserIdsParam', '/huntaze/of/userIds', process.env.OF_LOADTEST_USER_IDS || 'user1,user2');
    }
}
exports.HuntazeOfStack = HuntazeOfStack;
