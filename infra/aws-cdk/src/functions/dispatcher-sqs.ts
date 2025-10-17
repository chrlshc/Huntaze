import { SQSEvent, SQSBatchResponse } from 'aws-lambda'
import AWS from 'aws-sdk'

const ddb = new AWS.DynamoDB.DocumentClient()
const cloudwatch = new AWS.CloudWatch()
const ecs = new AWS.ECS()
const s3 = new AWS.S3()

function managementClient() {
  const url = process.env.WS_CALLBACK_URL
  if (!url) throw new Error('WS_CALLBACK_URL not set')
  return new AWS.ApiGatewayManagementApi({ endpoint: url })
}

type JobRecord = {
  jobId: string
  agentId: string
  payload: unknown
  type: string
  creatorId?: string
}

export const handler = async (event: SQSEvent): Promise<SQSBatchResponse> => {
  const mgmt = managementClient()
  const failures: { itemIdentifier: string }[] = []
  for (const record of event.Records) {
    let job: JobRecord
    try {
      job = JSON.parse(record.body)
    } catch (err) {
      console.error('Invalid job payload', err)
      failures.push({ itemIdentifier: record.messageId })
      continue
    }

    if (!job.agentId) {
      console.warn('Job missing agentId', job.jobId)
      failures.push({ itemIdentifier: record.messageId })
      continue
    }

    const runMode = process.env.RUN_MODE || 'ws'
    if (runMode === 'ecs') {
      const FARGATE_SPOT_DEFAULT = (process.env.FARGATE_SPOT_DEFAULT ?? '0') === '1'
      const PUBLIC_TASKS = (process.env.PUBLIC_TASKS ?? '0') === '1'
      const pickCapacity = (j: any) => {
        if ((j as any)?.critical || (j as any)?.runOnSpot === false) {
          return [{ capacityProvider: 'FARGATE', weight: 1 }]
        }
        return FARGATE_SPOT_DEFAULT ? [{ capacityProvider: 'FARGATE_SPOT', weight: 1 }] : [{ capacityProvider: 'FARGATE', weight: 1 }]
      }
      // Upsert assigned status for observability
      try {
        const now = Date.now()
        await ddb
          .update({
            TableName: process.env.JOBS_TABLE!,
            Key: { jobId: job.jobId },
            ConditionExpression: 'attribute_not_exists(#s) OR #s = :queued',
            UpdateExpression: [
              'SET #s = :assigned',
              'assignedTo = :agent',
              'leaseExpiresAt = :lease',
              'creatorId = if_not_exists(creatorId, :creatorId)',
              '#type = if_not_exists(#type, :type)',
              'payload = if_not_exists(payload, :payload)',
              'createdAt = if_not_exists(createdAt, :now)'
            ].join(', '),
            ExpressionAttributeNames: { '#s': 'status', '#type': 'type' },
            ExpressionAttributeValues: {
              ':assigned': 'assigned',
              ':queued': 'queued',
              ':agent': job.agentId,
              ':lease': now + 360000,
              ':creatorId': job.creatorId || 'unknown',
              ':type': job.type,
              ':payload': (job as any).payload || {},
              ':now': now
            }
          })
          .promise()
      } catch (e) {
        const err = e as AWS.AWSError
        if (err.code !== 'ConditionalCheckFailedException') {
          console.error('Failed to upsert job record (ecs)', { jobId: job.jobId, err: err.message })
        }
      }

      // Dispatch via ECS Fargate
      try {
        const bucket = process.env.RESULTS_BUCKET!
        const key = `jobs/${job.jobId}/input.json`
        await s3.putObject({ Bucket: bucket, Key: key, Body: JSON.stringify(job), ContentType: 'application/json' }).promise()

        const networkCfg = {
          awsvpcConfiguration: {
            subnets: (process.env.ECS_SUBNET_IDS || '').split(',').filter(Boolean),
            securityGroups: [process.env.ECS_SECURITY_GROUP_ID!],
            assignPublicIp: PUBLIC_TASKS ? 'ENABLED' : 'DISABLED',
          },
        }
        const capacity = pickCapacity(job)
        const baseParams: AWS.ECS.RunTaskRequest = {
          cluster: process.env.ECS_CLUSTER_ARN!,
          taskDefinition: process.env.ECS_TASK_DEF_ARN!,
          capacityProviderStrategy: capacity,
          networkConfiguration: networkCfg as any,
          overrides: {
            containerOverrides: [
              {
                name: 'ofworker',
                environment: [
                  { name: 'STAGE', value: process.env.STAGE || 'prod' },
                  { name: 'JOB_S3_KEY', value: key },
                  { name: 'JOB_ID', value: job.jobId },
                  { name: 'CREATOR_ID', value: job.creatorId || job.agentId },
                  { name: 'RESULTS_BUCKET', value: process.env.RESULTS_BUCKET! },
                ],
              },
            ],
          },
        }

        let resp = await ecs.runTask(baseParams).promise()
        if (!resp.tasks?.length) {
          const failures = JSON.stringify(resp.failures || [])
          const looksCapacity = /CAPACITY|FARGATE_SPOT/i.test(failures)
          if (capacity[0].capacityProvider === 'FARGATE_SPOT' && looksCapacity) {
            // Fallback on-demand
            resp = await ecs
              .runTask({ ...baseParams, capacityProviderStrategy: [{ capacityProvider: 'FARGATE', weight: 1 }] as any })
              .promise()
          }
        }
        if (!resp.tasks?.length) throw new Error(JSON.stringify(resp.failures))

        // Metrics: one item dispatched
        await cloudwatch
          .putMetricData({
            Namespace: 'Huntaze/Dispatcher',
            MetricData: [
              {
                MetricName: 'DispatcherBatchItems',
                Value: 1,
                Dimensions: [
                  { Name: 'FunctionName', Value: process.env.AWS_LAMBDA_FUNCTION_NAME || 'DispatcherFn' },
                  { Name: 'Stage', Value: process.env.STAGE || 'prod' },
                ],
              },
            ],
          })
          .promise()
        continue
      } catch (e) {
        console.error('ECS RunTask failed', (e as AWS.AWSError).message)
        failures.push({ itemIdentifier: record.messageId })
        continue
      }
    }

    const agent = await ddb
      .get({ TableName: process.env.AGENTS_TABLE!, Key: { agentId: job.agentId } })
      .promise()

    const connectionId = agent.Item?.connectionId as string | undefined
    const status = agent.Item?.status
    const now = Date.now()

    // Upsert job record on assignment to aid diagnostics, even if connection is stale.
    try {
      await ddb
        .update({
          TableName: process.env.JOBS_TABLE!,
          Key: { jobId: job.jobId },
          ConditionExpression: 'attribute_not_exists(#s) OR #s = :queued',
          UpdateExpression: [
            'SET #s = :assigned',
            'assignedTo = :agent',
            'leaseExpiresAt = :lease',
            'creatorId = if_not_exists(creatorId, :creatorId)',
            '#type = if_not_exists(#type, :type)',
            'payload = if_not_exists(payload, :payload)',
            'createdAt = if_not_exists(createdAt, :now)'
          ].join(', '),
          ExpressionAttributeNames: { '#s': 'status', '#type': 'type' },
          ExpressionAttributeValues: {
            ':assigned': 'assigned',
            ':queued': 'queued',
            ':agent': job.agentId,
            ':lease': now + 360000,
            ':creatorId': job.creatorId || 'unknown',
            ':type': job.type,
            ':payload': job.payload || {},
            ':now': now
          }
        })
        .promise()
    } catch (e) {
      // If condition fails because status already moved forward, continue.
      const err = e as AWS.AWSError
      if (err.code !== 'ConditionalCheckFailedException') {
        console.error('Failed to upsert job record', { jobId: job.jobId, err: err.message })
      }
    }

    if (!connectionId || status !== 'online') {
      console.warn('Agent offline or no connectionId; will retry via SQS redelivery', job.agentId)
      failures.push({ itemIdentifier: record.messageId })
      continue
    }

    try {
      await mgmt
        .postToConnection({
          ConnectionId: connectionId,
          Data: JSON.stringify({ t: 'job_assign', job }),
        })
        .promise()

      // Emit assignment metric
      await cloudwatch.putMetricData({
        Namespace: 'Huntaze/Dispatcher',
        MetricData: [{
          MetricName: 'JobsAssigned',
          Value: 1,
          Dimensions: [
            { Name: 'AgentId', Value: job.agentId },
            { Name: 'Stage', Value: process.env.STAGE || 'prod' },
          ],
        }],
      }).promise()
    } catch (err) {
      if ((err as AWS.AWSError).statusCode === 410) {
        console.warn('Agent connection stale, marking offline', job.agentId)
        await ddb
          .update({
            TableName: process.env.AGENTS_TABLE!,
            Key: { agentId: job.agentId },
            UpdateExpression: 'SET #s = :offline REMOVE connectionId',
            ExpressionAttributeNames: { '#s': 'status' },
            ExpressionAttributeValues: { ':offline': 'offline' },
          })
          .promise()
        // request redelivery
        failures.push({ itemIdentifier: record.messageId })
      } else {
        console.error('Failed to deliver job', err)
        failures.push({ itemIdentifier: record.messageId })
      }
    }
  }
  // Emit batch-level partial-failure metrics (optional observability)
  try {
    await cloudwatch
      .putMetricData({
        Namespace: 'Huntaze/Dispatcher',
        MetricData: [
          {
            MetricName: 'DispatcherBatchItems',
            Value: event.Records.length,
            Dimensions: [
              { Name: 'FunctionName', Value: process.env.AWS_LAMBDA_FUNCTION_NAME || 'DispatcherFn' },
              { Name: 'Stage', Value: process.env.STAGE || 'prod' },
            ],
          },
          {
            MetricName: 'DispatcherBatchItemFailures',
            Value: failures.length,
            Dimensions: [
              { Name: 'FunctionName', Value: process.env.AWS_LAMBDA_FUNCTION_NAME || 'DispatcherFn' },
              { Name: 'Stage', Value: process.env.STAGE || 'prod' },
            ],
          },
        ],
      })
      .promise()
  } catch (err) {
    console.warn('Failed to emit batch metrics', err)
  }

  return { batchItemFailures: failures }
}
