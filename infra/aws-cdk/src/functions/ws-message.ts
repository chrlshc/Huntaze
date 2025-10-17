import { APIGatewayProxyWebsocketEventV2 } from 'aws-lambda'
import AWS from 'aws-sdk'

const ddb = new AWS.DynamoDB.DocumentClient()
const cloudwatch = new AWS.CloudWatch()
const s3 = new AWS.S3()

function managementClient() {
  const url = process.env.WS_CALLBACK_URL
  if (!url) throw new Error('WS_CALLBACK_URL not set')
  return new AWS.ApiGatewayManagementApi({ endpoint: url })
}

type AgentMessage =
  | { t: 'hb'; v?: string; ts?: number }
  | { t: 'job_ack'; id: string; attempt?: number }
  | { t: 'job_result'; id: string; status: 'success' | 'error'; payload?: unknown; error?: { code?: string; message?: string }; retryable?: boolean; durationMs?: number }
  | { t: 'circuit_breaker'; reason?: string }
  | { t: string; [key: string]: unknown }

async function findAgentByConnection(connectionId: string) {
  const scan = await ddb
    .scan({
      TableName: process.env.AGENTS_TABLE!,
      FilterExpression: 'connectionId = :cid',
      ExpressionAttributeValues: { ':cid': connectionId },
      Limit: 1,
    })
    .promise()
  return (scan.Items ?? [])[0]
}

async function post(connectionId: string, data: unknown) {
  const mgmt = managementClient()
  await mgmt.postToConnection({ ConnectionId: connectionId, Data: JSON.stringify(data) }).promise()
}

export const handler = async (event: APIGatewayProxyWebsocketEventV2) => {
  if (!event.body) return { statusCode: 400, body: 'missing body' }
  const message = JSON.parse(event.body) as AgentMessage
  const connectionId = event.requestContext.connectionId!
  const agent = await findAgentByConnection(connectionId)
  if (!agent) {
    return { statusCode: 404, body: 'agent not registered' }
  }

  switch (message.t) {
    case 'hb': {
      await ddb
        .update({
          TableName: process.env.AGENTS_TABLE!,
          Key: { agentId: agent.agentId },
          UpdateExpression: 'SET lastHbAt = :ts, version = :ver, #s = :status',
          ExpressionAttributeValues: {
            ':ts': Date.now(),
            ':ver': message.v ?? agent.version ?? 'unknown',
            ':status': 'online',
          },
          ExpressionAttributeNames: { '#s': 'status' },
        })
        .promise()

      await cloudwatch
        .putMetricData({
          Namespace: 'Huntaze/ByoIP',
          MetricData: [
            {
              MetricName: 'AgentHeartbeats',
              Value: 1,
              Dimensions: [{ Name: 'AgentId', Value: agent.agentId }],
            },
          ],
        })
        .promise()

      await post(connectionId, { t: 'hb_ack', ts: Date.now() })
      break
    }
    case 'notify': {
      try {
        const ts = Date.now()
        const key = `notifications/${message.creatorId || 'unknown'}/${ts}-${(agent.agentId || 'agent')}.json`
        await s3.putObject({
          Bucket: process.env.LOGS_BUCKET!,
          Key: key,
          Body: JSON.stringify({ ts, ...message }),
          ContentType: 'application/json',
        }).promise()
        await cloudwatch.putMetricData({
          Namespace: 'Huntaze/ByoIP',
          MetricData: [{ MetricName: 'NotificationsIngested', Value: 1 }],
        }).promise()
      } catch (err) {
        // swallow to avoid failing the connection
      }
      break
    }

    case 'job_ack': {
      await ddb
        .update({
          TableName: process.env.JOBS_TABLE!,
          Key: { jobId: message.id },
          UpdateExpression: 'SET #s = :running, leaseExpiresAt = :lease',
          ExpressionAttributeNames: { '#s': 'status' },
          ExpressionAttributeValues: {
            ':running': 'running',
            ':lease': Date.now() + 120000,
          },
        })
        .promise()
      break
    }

    case 'job_result': {
      const success = message.status === 'success'
      await ddb
        .update({
          TableName: process.env.JOBS_TABLE!,
          Key: { jobId: message.id },
          UpdateExpression: 'SET #s = :status, result = :res, completedAt = :ts',
          ExpressionAttributeNames: { '#s': 'status' },
          ExpressionAttributeValues: {
            ':status': success ? 'succeeded' : 'failed',
            ':res': success ? message.payload ?? null : { error: message.error ?? null },
            ':ts': Date.now(),
          },
        })
        .promise()

      await cloudwatch.putMetricData({
        Namespace: 'Huntaze/ByoIP',
        MetricData: [{
          MetricName: success ? 'JobsCompleted' : 'JobsFailed',
          Value: 1,
          Dimensions: [{ Name: 'AgentId', Value: agent.agentId }],
        }],
      }).promise()
      break
    }

    case 'circuit_breaker': {
      await ddb
        .update({
          TableName: process.env.AGENTS_TABLE!,
          Key: { agentId: agent.agentId },
          UpdateExpression: 'SET #s = :paused, pauseReason = :reason',
          ExpressionAttributeNames: { '#s': 'status' },
          ExpressionAttributeValues: {
            ':paused': 'paused',
            ':reason': message.reason ?? 'unknown',
          },
        })
        .promise()
      break
    }

    default: {
      await post(connectionId, { t: 'noop' })
    }
  }

  return { statusCode: 200, body: 'ok' }
}
