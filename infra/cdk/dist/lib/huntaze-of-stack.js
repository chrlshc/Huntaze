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
const path = __importStar(require("path"));
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
        const vpc = new ec2.Vpc(this, 'OfVpc', { natGateways: 1, maxAzs: 2 });
        const taskSg = new ec2.SecurityGroup(this, 'OfTaskSg', { vpc, description: 'Egress-only', allowAllOutbound: true });
        const cluster = new ecs.Cluster(this, 'OfCluster', { vpc });
        const useRegistryImage = (process.env.USE_REGISTRY_IMAGE === '1' || process.env.USE_REGISTRY_IMAGE === 'true');
        const useEcrImage = (process.env.USE_ECR_IMAGE === '1' || process.env.USE_ECR_IMAGE === 'true');
        const taskDef = new ecs.FargateTaskDefinition(this, 'BrowserWorkerTask', { memoryLimitMiB: 2048, cpu: 1024 });
        const logGroup = new logs.LogGroup(this, 'BrowserWorkerLogs', {
            logGroupName: '/huntaze/of/browser-worker', retention: logs.RetentionDays.ONE_WEEK, removalPolicy: aws_cdk_lib_1.RemovalPolicy.DESTROY
        });
        let image;
        if (useEcrImage) {
            const ecrRepoName = process.env.ECR_REPOSITORY || 'huntaze/of-browser-worker';
            const ecrTag = process.env.ECR_IMAGE_TAG || 'main';
            const repo = ecr.Repository.fromRepositoryName(this, 'BrowserWorkerEcrRepo', ecrRepoName);
            image = ecs.ContainerImage.fromEcrRepository(repo, ecrTag);
        }
        else if (useRegistryImage) {
            image = ecs.ContainerImage.fromRegistry('mcr.microsoft.com/playwright:v1.46.0-jammy');
        }
        else {
            image = ecs.ContainerImage.fromDockerImageAsset(new ecr_assets.DockerImageAsset(this, 'BrowserWorkerImage', { directory: path.join(process.cwd(), '../fargate/browser-worker') }));
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
        container.addUlimits({ name: ecs.UlimitName.NOFILE, softLimit: 8192, hardLimit: 8192 });
        sessions.grantReadWriteData(taskDef.taskRole);
        messages.grantReadWriteData(taskDef.taskRole);
        threads.grantReadWriteData(taskDef.taskRole);
        key.grantDecrypt(taskDef.taskRole);
        taskDef.taskRole.addToPrincipalPolicy(new iam.PolicyStatement({
            actions: ['secretsmanager:GetSecretValue'],
            resources: [
                `arn:aws:secretsmanager:${cdk.Stack.of(this).region}:${cdk.Stack.of(this).account}:secret:of/creds/*`
            ]
        }));
        if (taskDef.executionRole) {
            taskDef.executionRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy'));
        }
        const sendWorker = new lambdaNode.NodejsFunction(this, 'SendWorker', {
            runtime: lambda.Runtime.NODEJS_18_X,
            entry: path.join(process.cwd(), '../lambda/send-worker/index.ts'),
            timeout: aws_cdk_lib_1.Duration.seconds(30), memorySize: 256,
            environment: {
                OF_ECS_CLUSTER_ARN: cluster.clusterArn,
                OF_ECS_TASKDEF_ARN: taskDef.taskDefinitionArn,
                OF_VPC_SUBNETS: vpc.privateSubnets.map(s => s.subnetId).join(','),
                OF_TASK_SG_ID: taskSg.securityGroupId,
                OF_DDB_SESSIONS_TABLE: sessions.tableName,
                OF_DDB_MESSAGES_TABLE: messages.tableName,
                OF_KMS_KEY_ID: key.keyArn,
            }
        });
        const { SqsEventSource } = require('aws-cdk-lib/aws-lambda-event-sources');
        sendWorker.addEventSource(new SqsEventSource(sendQueue, {
            batchSize: 10,
            reportBatchItemFailures: true,
            maxConcurrency: 10,
        }));
        sendWorker.addToRolePolicy(new iam.PolicyStatement({ actions: ['ecs:RunTask', 'iam:PassRole'], resources: ['*'] }));
        const syncDispatcher = new lambdaNode.NodejsFunction(this, 'SyncDispatcher', {
            runtime: lambda.Runtime.NODEJS_18_X,
            entry: path.join(process.cwd(), '../lambda/sync-dispatcher/index.ts'),
            timeout: aws_cdk_lib_1.Duration.seconds(60), memorySize: 256,
            environment: {
                OF_ECS_CLUSTER_ARN: cluster.clusterArn,
                OF_ECS_TASKDEF_ARN: taskDef.taskDefinitionArn,
                OF_VPC_SUBNETS: vpc.privateSubnets.map(s => s.subnetId).join(','),
                OF_TASK_SG_ID: taskSg.securityGroupId,
                OF_DDB_SESSIONS_TABLE: sessions.tableName,
                OF_DDB_MESSAGES_TABLE: messages.tableName,
                OF_KMS_KEY_ID: key.keyArn,
            }
        });
        sessions.grantReadData(syncDispatcher);
        syncDispatcher.addToRolePolicy(new iam.PolicyStatement({ actions: ['ecs:RunTask', 'iam:PassRole'], resources: ['*'] }));
        new events.Rule(this, 'InboxSyncRule', {
            schedule: events.Schedule.rate(aws_cdk_lib_1.Duration.minutes(5)),
            targets: [new targets.LambdaFunction(syncDispatcher)]
        });
        new cdk.CfnOutput(this, 'SendQueueUrl', { value: sendQueue.queueUrl });
        new cdk.CfnOutput(this, 'SessionsTable', { value: sessions.tableName });
        new cdk.CfnOutput(this, 'MessagesTable', { value: messages.tableName });
        new cdk.CfnOutput(this, 'ThreadsTable', { value: threads.tableName });
        new cdk.CfnOutput(this, 'KmsKeyArn', { value: key.keyArn });
        new cdk.CfnOutput(this, 'ClusterArn', { value: cluster.clusterArn });
        new cdk.CfnOutput(this, 'TaskDefArn', { value: taskDef.taskDefinitionArn });
        new cdk.CfnOutput(this, 'TaskSecurityGroup', { value: taskSg.securityGroupId });
        new cdk.CfnOutput(this, 'SubnetsPrivate', { value: vpc.privateSubnets.map(s => s.subnetId).join(',') });
    }
}
exports.HuntazeOfStack = HuntazeOfStack;
