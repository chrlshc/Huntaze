import * as path from 'path'
import * as cdk from 'aws-cdk-lib'
import { Duration, RemovalPolicy } from 'aws-cdk-lib'
import { Construct } from 'constructs'
import * as apigwv2 from '@aws-cdk/aws-apigatewayv2-alpha'
import * as apigwInt from '@aws-cdk/aws-apigatewayv2-integrations-alpha'
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb'
import * as sqs from 'aws-cdk-lib/aws-sqs'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as nodeLambda from 'aws-cdk-lib/aws-lambda-nodejs'
import * as eventSources from 'aws-cdk-lib/aws-lambda-event-sources'
import * as s3 from 'aws-cdk-lib/aws-s3'
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import * as ecs from 'aws-cdk-lib/aws-ecs'
import * as ecr from 'aws-cdk-lib/aws-ecr'
import * as kms from 'aws-cdk-lib/aws-kms'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as cw from 'aws-cdk-lib/aws-cloudwatch'
import * as cwActions from 'aws-cdk-lib/aws-cloudwatch-actions'
import * as sns from 'aws-cdk-lib/aws-sns'
import * as subs from 'aws-cdk-lib/aws-sns-subscriptions'
import * as logs from 'aws-cdk-lib/aws-logs'
import * as events from 'aws-cdk-lib/aws-events'
import * as targets from 'aws-cdk-lib/aws-events-targets'

export class HuntazeByoIpStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    const jobsTable = new dynamodb.Table(this, 'JobsTable', {
      partitionKey: { name: 'jobId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      timeToLiveAttribute: 'ttl',
      removalPolicy: RemovalPolicy.RETAIN,
    })

    jobsTable.addGlobalSecondaryIndex({
      indexName: 'statusByDue',
      partitionKey: { name: 'status', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'dueAt', type: dynamodb.AttributeType.NUMBER },
    })

    jobsTable.addGlobalSecondaryIndex({
      indexName: 'assignedByLease',
      partitionKey: { name: 'assignedTo', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'leaseExpiresAt', type: dynamodb.AttributeType.NUMBER },
    })

    const agentsTable = new dynamodb.Table(this, 'AgentsTable', {
      partitionKey: { name: 'agentId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      timeToLiveAttribute: 'ttl',
      removalPolicy: RemovalPolicy.RETAIN,
    })

    const limitsTable = new dynamodb.Table(this, 'CreatorLimits', {
      partitionKey: { name: 'creatorId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.RETAIN,
    })

    const kmsKey = new kms.Key(this, 'ByoIpKmsKey', {
      enableKeyRotation: true,
    })

    const patchesBucket = new s3.Bucket(this, 'AgentPatchesBucket', {
      versioned: true,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: kmsKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
    })

    const logsBucket = new s3.Bucket(this, 'AgentLogsBucket', {
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: kmsKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
    })

    const resultsBucket = new s3.Bucket(this, 'OfResultsBucket', {
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: kmsKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_ENFORCED,
    })

    // DLQ for failed dispatches
    const jobsDlq = new sqs.Queue(this, 'JobsDLQ', {
      retentionPeriod: Duration.days(14),
      encryption: sqs.QueueEncryption.KMS_MANAGED
    })

    const jobsQueue = new sqs.Queue(this, 'JobsQueue', {
      // Per AWS guidance for SQS→Lambda, set VT >= 6× Lambda timeout (60s → 360s)
      visibilityTimeout: Duration.seconds(360),
      retentionPeriod: Duration.days(4),
      encryption: sqs.QueueEncryption.KMS_MANAGED,
      deadLetterQueue: { maxReceiveCount: 5, queue: jobsDlq }
    })

    const nodeFnDefaults: Omit<nodeLambda.NodejsFunctionProps, 'entry'> = {
      runtime: lambda.Runtime.NODEJS_16_X,
      bundling: {
        externalModules: ['aws-sdk'],
        format: nodeLambda.OutputFormat.CJS,
        target: 'node16',
      },
      memorySize: 256,
      timeout: Duration.seconds(15),
      logRetention: cdk.aws_logs.RetentionDays.ONE_WEEK,
      environment: {
        JOBS_TABLE: jobsTable.tableName,
        AGENTS_TABLE: agentsTable.tableName,
        LIMITS_TABLE: limitsTable.tableName,
        JOBS_QUEUE_URL: jobsQueue.queueUrl,
        PATCHES_BUCKET: patchesBucket.bucketName,
        LOGS_BUCKET: logsBucket.bucketName,
        RESULTS_BUCKET: resultsBucket.bucketName,
        STAGE: process.env.STAGE ?? 'prod',
      },
      depsLockFilePath: path.join(process.cwd(), 'package-lock.json'),
    }

    const wsConnect = new nodeLambda.NodejsFunction(this, 'WsConnectFn', {
      ...nodeFnDefaults,
      entry: path.join(process.cwd(), 'src/functions/ws-connect.ts'),
      environment: {
        ...nodeFnDefaults.environment,
        WS_JWT_SECRET: process.env.WS_JWT_SECRET ?? '',
      },
    })

    const wsMessage = new nodeLambda.NodejsFunction(this, 'WsMessageFn', {
      ...nodeFnDefaults,
      entry: path.join(process.cwd(), 'src/functions/ws-message.ts'),
      timeout: Duration.seconds(20),
    })

    const wsDisconnect = new nodeLambda.NodejsFunction(this, 'WsDisconnectFn', {
      ...nodeFnDefaults,
      entry: path.join(process.cwd(), 'src/functions/ws-disconnect.ts'),
    })

    const dispatcher = new nodeLambda.NodejsFunction(this, 'DispatcherFn', {
      ...nodeFnDefaults,
      entry: path.join(process.cwd(), 'src/functions/dispatcher-sqs.ts'),
      timeout: Duration.seconds(60),
    })

    jobsQueue.grantConsumeMessages(dispatcher)
    jobsTable.grantReadWriteData(wsMessage)
    jobsTable.grantReadWriteData(dispatcher)
    agentsTable.grantReadWriteData(wsConnect)
    agentsTable.grantReadWriteData(wsMessage)
    agentsTable.grantReadWriteData(wsDisconnect)
    // Dispatcher needs to read and occasionally update AgentsTable
    agentsTable.grantReadWriteData(dispatcher)
    limitsTable.grantReadData(wsMessage)
    patchesBucket.grantRead(wsMessage)
    logsBucket.grantWrite(wsMessage)

    const wsApi = new apigwv2.WebSocketApi(this, 'ByoIpWsApi', {
      connectRouteOptions: {
        integration: new apigwInt.WebSocketLambdaIntegration('ConnectIntegration', wsConnect),
      },
      disconnectRouteOptions: {
        integration: new apigwInt.WebSocketLambdaIntegration('DisconnectIntegration', wsDisconnect),
      },
      defaultRouteOptions: {
        integration: new apigwInt.WebSocketLambdaIntegration('DefaultIntegration', wsMessage),
      },
    })

    const wsStage = new apigwv2.WebSocketStage(this, 'ByoIpWsStage', {
      webSocketApi: wsApi,
      stageName: 'prod',
      autoDeploy: true,
    })

    const manageConnectionsPolicy = new iam.PolicyStatement({
      actions: ['execute-api:ManageConnections'],
      resources: [
        `arn:aws:execute-api:${this.region}:${this.account}:${wsApi.apiId}/${wsStage.stageName}/POST/@connections/*`,
      ],
    })

    wsMessage.addToRolePolicy(manageConnectionsPolicy)
    dispatcher.addToRolePolicy(manageConnectionsPolicy)

    const cwPutMetrics = new iam.PolicyStatement({
      actions: ['cloudwatch:PutMetricData'],
      resources: ['*'],
      conditions: { StringEquals: { 'cloudwatch:namespace': ['Huntaze/ByoIP', 'Huntaze/Dispatcher'] } as any },
    })
    wsMessage.addToRolePolicy(cwPutMetrics)
    dispatcher.addToRolePolicy(cwPutMetrics)

    const wsUrl = `https://${wsApi.apiId}.execute-api.${this.region}.amazonaws.com/${wsStage.stageName}`
    wsMessage.addEnvironment('WS_CALLBACK_URL', wsUrl)
    dispatcher.addEnvironment('WS_CALLBACK_URL', wsUrl)

    dispatcher.addEventSource(new eventSources.SqsEventSource(jobsQueue, {
      batchSize: 5,
      reportBatchItemFailures: true,
      maxBatchingWindow: Duration.seconds(10),
    }))

    // ECS Cloud Runner (Fargate)
    const vpc = ec2.Vpc.fromLookup(this, 'DefaultVpc', { isDefault: true })
    const cluster = new ecs.Cluster(this, 'OfEcsCluster', { vpc })
    // Enable capacity providers to allow FARGATE_SPOT
    cluster.enableFargateCapacityProviders()

    const execRole = new iam.Role(this, 'OfWorkerExecRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
    })
    execRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy'))

    const taskRole = new iam.Role(this, 'OfWorkerTaskRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
    })
    taskRole.addToPolicy(new iam.PolicyStatement({ actions: ['secretsmanager:GetSecretValue', 'kms:Decrypt'], resources: ['*'] }))
    resultsBucket.grantReadWrite(taskRole)
    kmsKey.grantEncryptDecrypt(taskRole)
    taskRole.addToPolicy(new iam.PolicyStatement({
      actions: ['cloudwatch:PutMetricData'], resources: ['*'],
      conditions: { StringEquals: { 'cloudwatch:namespace': 'Huntaze/Dispatcher' } as any },
    }))

    const taskDef = new ecs.FargateTaskDefinition(this, 'OfWorkerTaskDef', {
      cpu: 1024,
      memoryLimitMiB: 2048,
      executionRole: execRole,
      taskRole,
      runtimePlatform: { cpuArchitecture: ecs.CpuArchitecture.X86_64, operatingSystemFamily: ecs.OperatingSystemFamily.LINUX },
    })
    ;(taskDef.node.defaultChild as cdk.CfnResource).addPropertyOverride('EphemeralStorage.SizeInGiB', 40)
    const repo = ecr.Repository.fromRepositoryName(this, 'OfWorkerRepo', 'of-worker')
    const container = taskDef.addContainer('ofworker', {
      image: ecs.ContainerImage.fromEcrRepository(repo),
      logging: ecs.LogDrivers.awsLogs({ streamPrefix: 'ofworker' }),
      environment: { RESULTS_BUCKET: resultsBucket.bucketName },
    })
    container.addUlimits({ name: ecs.UlimitName.NOFILE, softLimit: 65535, hardLimit: 65535 })

    const taskSg = new ec2.SecurityGroup(this, 'OfWorkerSg', { vpc, allowAllOutbound: true })
    const selected = vpc.selectSubnets({ subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS })

    dispatcher.addToRolePolicy(new iam.PolicyStatement({ actions: ['ecs:RunTask'], resources: [taskDef.taskDefinitionArn] }))
    dispatcher.addToRolePolicy(new iam.PolicyStatement({ actions: ['iam:PassRole'], resources: [execRole.roleArn, taskRole.roleArn], conditions: { StringEquals: { 'iam:PassedToService': 'ecs-tasks.amazonaws.com' } as any } }))
    resultsBucket.grantPut(dispatcher)
    kmsKey.grantEncrypt(dispatcher)

    dispatcher.addEnvironment('RUN_MODE', process.env.RUN_MODE ?? 'ws')
    dispatcher.addEnvironment('ECS_CLUSTER_ARN', cluster.clusterArn)
    dispatcher.addEnvironment('ECS_TASK_DEF_ARN', taskDef.taskDefinitionArn)
    dispatcher.addEnvironment('ECS_SUBNET_IDS', selected.subnetIds.join(','))
    dispatcher.addEnvironment('ECS_SECURITY_GROUP_ID', taskSg.securityGroupId)
    // Cost/reliability toggles (defaults safe for prod)
    dispatcher.addEnvironment('FARGATE_SPOT_DEFAULT', process.env.FARGATE_SPOT_DEFAULT ?? '0')
    dispatcher.addEnvironment('PUBLIC_TASKS', process.env.PUBLIC_TASKS ?? '0')

    new cdk.CfnOutput(this, 'EcsClusterArn', { value: cluster.clusterArn })
    new cdk.CfnOutput(this, 'EcsTaskDefArn', { value: taskDef.taskDefinitionArn })
    new cdk.CfnOutput(this, 'EcsSubnets', { value: selected.subnetIds.join(',') })
    new cdk.CfnOutput(this, 'EcsSecurityGroupId', { value: taskSg.securityGroupId })
    new cdk.CfnOutput(this, 'ResultsBucketName', { value: resultsBucket.bucketName })

    // Allow redrive back from DLQ to main queue
    const jobsQueueCfn = jobsQueue.node.defaultChild as sqs.CfnQueue
    jobsQueueCfn.redriveAllowPolicy = {
      redrivePermission: 'byQueue',
      sourceQueueArns: [jobsDlq.queueArn],
    }

    // Deprecated dashboard placeholder with banner + link to the new ops dashboard
    const region = cdk.Stack.of(this).region
    const stage = process.env.STAGE ?? 'prod'
    const dashLink = `https://console.aws.amazon.com/cloudwatch/home?region=${region}#dashboards:name=BYOIP-Ops-${stage}`
    const runbookLink = `https://github.com/<org>/<repo>/blob/main/infra/aws-cdk/README.md#triage-runbook`
    const oldDash = new cw.Dashboard(this, `ByoIpRunnerDash-${stage}`, {
      dashboardName: `ByoIpRunner-${stage}`,
    })
    oldDash.addWidgets(new cw.TextWidget({
      markdown: `## 🚨 This dashboard is **deprecated**  \nUse **BYOIP-Ops-${stage}** going forward.  \n**Runbook:** 👉 [Open Triage Runbook](${runbookLink})\n\n[➡️ Open BYOIP-Ops-${stage}](${dashLink})`,
      width: 24,
      height: 6,
    }))

    // SNS topic for ops alerts
    const opsTopic = new sns.Topic(this, 'OpsAlertsTopic', { displayName: 'BYOIP Ops Alerts' })
    const opsEmail = process.env.OPS_ALERTS_EMAIL
    if (opsEmail && stage === 'prod') {
      opsTopic.addSubscription(new subs.EmailSubscription(opsEmail))
    }
    const alertMode = (process.env.ALERT_MODE ?? 'composite').toLowerCase()
    const emailOnCompositeOnly = alertMode === 'composite'

    // Alarms: queue health and dispatcher errors
    const ageAlarm = new cw.Alarm(this, 'JobsOldestAgeHigh', {
      alarmDescription: `Main queue backlog high. Triage via ${dashLink} — Runbook: ${runbookLink}`,
      metric: jobsQueue.metricApproximateAgeOfOldestMessage({
        period: Duration.minutes(1),
        statistic: 'Maximum'
      }),
      threshold: 300, // > 5 minutes
      evaluationPeriods: 5,
      datapointsToAlarm: 3,
      treatMissingData: cw.TreatMissingData.NOT_BREACHING
    })
    if (!emailOnCompositeOnly) ageAlarm.addAlarmAction(new cwActions.SnsAction(opsTopic))

    const visibleAlarm = new cw.Alarm(this, 'JobsVisibleHigh', {
      alarmDescription: `Main queue visible count high. Triage via ${dashLink} — Runbook: ${runbookLink}`,
      metric: jobsQueue.metricApproximateNumberOfMessagesVisible({
        period: Duration.minutes(1),
        statistic: 'Average'
      }),
      threshold: 25,
      evaluationPeriods: 5,
      treatMissingData: cw.TreatMissingData.NOT_BREACHING
    })
    if (!emailOnCompositeOnly) visibleAlarm.addAlarmAction(new cwActions.SnsAction(opsTopic))

    const dlqAlarm = new cw.Alarm(this, 'JobsDLQNotEmpty', {
      alarmDescription: `DLQ has visible messages. Triage via ${dashLink} — Runbook: ${runbookLink}`,
      metric: jobsDlq.metricApproximateNumberOfMessagesVisible({
        period: Duration.minutes(1),
        statistic: 'Maximum'
      }),
      threshold: 0,
      evaluationPeriods: 1,
      comparisonOperator: cw.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cw.TreatMissingData.NOT_BREACHING
    })
    if (!emailOnCompositeOnly) dlqAlarm.addAlarmAction(new cwActions.SnsAction(opsTopic))
    dlqAlarm.addOkAction(new cwActions.SnsAction(opsTopic))

    const dispatcherErrors = new cw.Metric({
      namespace: 'AWS/Lambda',
      metricName: 'Errors',
      period: Duration.minutes(1),
      statistic: 'Sum',
      dimensionsMap: { FunctionName: dispatcher.functionName }
    })
    const errorsAlarm = new cw.Alarm(this, 'DispatcherErrorsHigh', {
      alarmDescription: `Dispatcher Lambda errors > 0. Triage via ${dashLink} — Runbook: ${runbookLink}`,
      metric: dispatcherErrors,
      threshold: 0,
      evaluationPeriods: 1,
      comparisonOperator: cw.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cw.TreatMissingData.NOT_BREACHING
    })
    if (!emailOnCompositeOnly) errorsAlarm.addAlarmAction(new cwActions.SnsAction(opsTopic))

    // Lambda throttles
    const throttlesAlarm = new cw.Alarm(this, 'DispatcherThrottles', {
      alarmDescription: `Dispatcher Lambda throttles detected. Triage via ${dashLink} — Runbook: ${runbookLink}`,
      metric: dispatcher.metricThrottles({ period: Duration.minutes(5), statistic: 'Sum' }),
      threshold: 0,
      evaluationPeriods: 3,
      datapointsToAlarm: 2,
      comparisonOperator: cw.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cw.TreatMissingData.NOT_BREACHING,
    })
    if (!emailOnCompositeOnly) throttlesAlarm.addAlarmAction(new cwActions.SnsAction(opsTopic))

    // Lambda duration nearing timeout (80% of 60s = 48s)
    const durationAlarm = new cw.Alarm(this, 'DispatcherDurationHigh', {
      alarmDescription: `Dispatcher duration nearing timeout. Triage via ${dashLink} — Runbook: ${runbookLink}`,
      metric: dispatcher.metricDuration({ period: Duration.minutes(1), statistic: 'Maximum' }),
      threshold: 48000, // ms
      evaluationPeriods: 3,
      datapointsToAlarm: 2,
      comparisonOperator: cw.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      treatMissingData: cw.TreatMissingData.NOT_BREACHING,
    })
    if (!emailOnCompositeOnly) durationAlarm.addAlarmAction(new cwActions.SnsAction(opsTopic))

    // Partial-batch failure rate (custom metrics emitted by dispatcher)
    const batchItemsMetric = new cw.Metric({
      namespace: 'Huntaze/Dispatcher',
      metricName: 'DispatcherBatchItems',
      period: Duration.minutes(1),
      statistic: 'Sum',
      dimensionsMap: { FunctionName: dispatcher.functionName, Stage: stage },
    })
    const batchFailsMetric = new cw.Metric({
      namespace: 'Huntaze/Dispatcher',
      metricName: 'DispatcherBatchItemFailures',
      period: Duration.minutes(1),
      statistic: 'Sum',
      dimensionsMap: { FunctionName: dispatcher.functionName, Stage: stage },
    })
    const failPctExpr = new cw.MathExpression({
      expression: 'IF(m > 0, 100 * f / m, 0)',
      usingMetrics: { f: batchFailsMetric, m: batchItemsMetric },
      label: 'Dispatcher Partial Fail %',
      period: Duration.minutes(1),
    })
    const partialFailAlarm = new cw.Alarm(this, 'DispatcherPartialFailHigh', {
      alarmDescription: `Dispatcher partial-fail rate > threshold. Triage via ${dashLink} — Runbook: ${runbookLink}`,
      metric: failPctExpr,
      threshold: 10, // >10% partial failures
      evaluationPeriods: 3,
      datapointsToAlarm: 2,
      comparisonOperator: cw.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      treatMissingData: cw.TreatMissingData.NOT_BREACHING,
    })
    if (!emailOnCompositeOnly) partialFailAlarm.addAlarmAction(new cwActions.SnsAction(opsTopic))

    // Composite: DLQNotEmpty OR (Errors AND Backlog)
    const composite = new cw.CompositeAlarm(this, 'CriticalQueueHealth', {
      alarmRule: cw.AlarmRule.anyOf(
        cw.AlarmRule.fromAlarm(dlqAlarm, cw.AlarmState.ALARM),
        cw.AlarmRule.allOf(
          cw.AlarmRule.fromAlarm(errorsAlarm, cw.AlarmState.ALARM),
          cw.AlarmRule.fromAlarm(ageAlarm, cw.AlarmState.ALARM),
        )
      ),
      alarmDescription: `DLQ>0 OR (Dispatcher Errors AND Queue backlog). Triage via ${dashLink} — Runbook: ${runbookLink}`,
    })
    composite.addAlarmAction(new cwActions.SnsAction(opsTopic))
    composite.addOkAction(new cwActions.SnsAction(opsTopic))

    // ---- Ops Dashboard (compact triage) ----
    const mDlqVisible = jobsDlq.metricApproximateNumberOfMessagesVisible({
      period: Duration.minutes(1), statistic: 'Maximum',
    })
    const mMainAge = jobsQueue.metricApproximateAgeOfOldestMessage({
      period: Duration.minutes(1), statistic: 'Maximum',
    })
    const mMainVisible = jobsQueue.metricApproximateNumberOfMessagesVisible({
      period: Duration.minutes(1), statistic: 'Average',
    })

    const mErrors = dispatcher.metricErrors({ period: Duration.minutes(5), statistic: 'Sum' })
    const mThrottles = dispatcher.metricThrottles({ period: Duration.minutes(5), statistic: 'Sum' })
    const mDurationP95 = dispatcher.metricDuration({ period: Duration.minutes(5), statistic: 'p95' })

    const mItemsDash = new cw.Metric({
      namespace: 'Huntaze/Dispatcher', metricName: 'DispatcherBatchItems',
      dimensionsMap: { FunctionName: dispatcher.functionName, Stage: stage },
      period: Duration.minutes(1), statistic: 'Sum',
    })
    const mFailsDash = new cw.Metric({
      namespace: 'Huntaze/Dispatcher', metricName: 'DispatcherBatchItemFailures',
      dimensionsMap: { FunctionName: dispatcher.functionName, Stage: stage },
      period: Duration.minutes(1), statistic: 'Sum',
    })
    const mFailPct = new cw.MathExpression({
      expression: 'IF(items > 0, 100 * failures / items, 0)',
      usingMetrics: { failures: mFailsDash, items: mItemsDash },
      period: Duration.minutes(1),
      label: 'Partial-fail %',
    })

    const opsDash = new cw.Dashboard(this, `BYOIPOpsDash-${stage}`, {
      dashboardName: `BYOIP-Ops-${stage}`,
    })

    opsDash.addWidgets(new cw.TextWidget({
      markdown: `# BYO-IP Ops — **${stage}**\nUse this dashboard for triage.  \n**Runbook:** 👉 [Open Triage Runbook](${runbookLink})`,
      width: 24,
    }))

    opsDash.addWidgets(new cw.SingleValueWidget({
      title: 'Now',
      metrics: [mDlqVisible, mMainAge, mFailPct, mErrors, mThrottles],
      width: 24,
    }))

    opsDash.addWidgets(
      new cw.GraphWidget({ title: 'DLQ — visible messages', left: [mDlqVisible], width: 8 }),
      new cw.GraphWidget({ title: 'Main queue — age (s) / visible', left: [mMainAge], right: [mMainVisible], width: 16 }),
    )

    opsDash.addWidgets(
      new cw.GraphWidget({ title: 'Dispatcher — Errors & Throttles', left: [mErrors, mThrottles], width: 12 }),
      new cw.GraphWidget({ title: 'Dispatcher — Duration p95 (ms)', left: [mDurationP95], width: 12 }),
    )

    opsDash.addWidgets(
      new cw.GraphWidget({ title: 'Partial-fail % (1-min)', left: [mFailPct], width: 12 }),
      new cw.GraphWidget({ title: 'Batch items vs failures', left: [mItemsDash, mFailsDash], width: 12 }),
    )

    // Optional: show alarm states inline if desired
    opsDash.addWidgets(new cw.AlarmStatusWidget({
      title: 'Critical alarms',
      alarms: [dlqAlarm, ageAlarm, errorsAlarm, throttlesAlarm, durationAlarm, partialFailAlarm],
      width: 24,
    }))

    const hbMetric = new cw.Metric({
      namespace: 'Huntaze/ByoIP',
      metricName: 'AgentHeartbeats',
      period: Duration.minutes(5),
      statistic: 'Sum'
    })
    const hbAlarm = new cw.Alarm(this, 'AgentsNoHeartbeats', {
      alarmDescription: `Agents heartbeats low. Triage via ${dashLink} — Runbook: ${runbookLink}`,
      metric: hbMetric,
      threshold: 1,
      evaluationPeriods: 1,
      comparisonOperator: cw.ComparisonOperator.LESS_THAN_THRESHOLD,
      treatMissingData: cw.TreatMissingData.BREACHING
    })
    if (!emailOnCompositeOnly) hbAlarm.addAlarmAction(new cwActions.SnsAction(opsTopic))

    // Metric filter for stale connections (410) → custom metric
    const staleFilter = new logs.MetricFilter(this, 'DispatcherStaleConnFilter', {
      logGroup: dispatcher.logGroup,
      filterPattern: logs.FilterPattern.literal('Agent connection stale'),
      metricNamespace: 'Huntaze/Dispatcher',
      metricName: 'StaleConnections410',
      metricValue: '1',
      defaultValue: 0,
    })
    const staleAlarm = new cw.Alarm(this, 'DispatcherStaleConnHigh', {
      alarmDescription: `Dispatcher stale connections rising. Triage via ${dashLink} — Runbook: ${runbookLink}`,
      metric: new cw.Metric({
        namespace: 'Huntaze/Dispatcher',
        metricName: 'StaleConnections410',
        statistic: 'Sum',
        period: Duration.minutes(5),
      }),
      threshold: 5,
      evaluationPeriods: 1,
      comparisonOperator: cw.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      treatMissingData: cw.TreatMissingData.NOT_BREACHING,
    })
    if (!emailOnCompositeOnly) staleAlarm.addAlarmAction(new cwActions.SnsAction(opsTopic))

    // S3 results ingestor (EventBridge S3 → Lambda)
    const resultIngest = new nodeLambda.NodejsFunction(this, 'ResultIngestFn', {
      ...nodeFnDefaults,
      entry: path.join(process.cwd(), 'src/functions/result-ingestor.ts'),
    })
    jobsTable.grantReadWriteData(resultIngest)
    resultsBucket.grantRead(resultIngest)

    const s3EbRule = new events.Rule(this, 'ResultsIngestRule', {
      description: 'Ingest result.json from results bucket',
      eventPattern: {
        source: ['aws.s3'],
        detailType: ['Object Created'],
        detail: {
          bucket: { name: [resultsBucket.bucketName] as any },
        },
      },
    })
    s3EbRule.addTarget(new targets.LambdaFunction(resultIngest, {
      deadLetterQueue: jobsDlq,
    }))

    // ---- Scheduler: periodic check_notifications (toggle via ENABLE_NOTIFS_SCHED) ----
    const enableSched = (process.env.ENABLE_NOTIFS_SCHED ?? 'true').toLowerCase() === 'true'
    const schedAgentId = process.env.SCHEDULER_AGENT_ID ?? 'DEV-AGENT-123'
    const schedCreatorId = process.env.SCHEDULER_CREATOR_ID ?? 'creator-xyz'
    const checkRule = new events.Rule(this, `CheckNotificationsSchedule-${stage}`, {
      description: 'Periodic check_notifications job (EventBridge → SQS)',
      schedule: events.Schedule.rate(Duration.minutes(10)),
      enabled: enableSched && stage === 'prod',
    })
    checkRule.addTarget(new targets.SqsQueue(jobsQueue, {
      message: events.RuleTargetInput.fromObject({
        jobId: events.EventField.fromPath('$.id'),
        agentId: schedAgentId,
        creatorId: schedCreatorId,
        type: 'check_notifications',
        payload: { since_id: '' },
      }),
    }))

    // Helpful outputs for agent configuration
    new cdk.CfnOutput(this, 'WebSocketUrl', {
      value: `wss://${wsApi.apiId}.execute-api.${this.region}.amazonaws.com/${wsStage.stageName}`,
    })
    new cdk.CfnOutput(this, 'JobsQueueUrl', { value: jobsQueue.queueUrl })
    new cdk.CfnOutput(this, 'OpsAlertsTopicArn', { value: opsTopic.topicArn })
  }
}
