export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { DynamoDBClient, QueryCommand } from '@aws-sdk/client-dynamodb'
import { CloudWatchClient, GetMetricStatisticsCommand } from '@aws-sdk/client-cloudwatch'
import { SQSClient, GetQueueAttributesCommand } from '@aws-sdk/client-sqs'

const AWS_REGION = process.env.AWS_REGION || 'us-east-1'
const DDB_TABLE_SESSIONS = process.env.DDB_TABLE_SESSIONS || 'ai_sessions'
const STATUS_INDEX = process.env.DDB_STATUS_INDEX || 'status-index'
const OF_SQS_URL = process.env.OF_SQS_URL

const ddb = new DynamoDBClient({ region: AWS_REGION })
const cw = new CloudWatchClient({ region: AWS_REGION })
const sqs = new SQSClient({ region: AWS_REGION })

export async function GET() {
  try {
    // 1) Sessions by status: needs_review
    const q = new QueryCommand({
      TableName: DDB_TABLE_SESSIONS,
      IndexName: STATUS_INDEX,
      KeyConditionExpression: '#status = :s',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: { ':s': { S: 'needs_review' } },
      Limit: 100,
      ScanIndexForward: true,
    })
    const sessions = await ddb.send(q)
    const pending_reviews = sessions.Count || 0

    // 2) LLM latency metric (optional)
    let avg_llm_latency: number | null = null
    try {
      const end = new Date()
      const start = new Date(end.getTime() - 60 * 60 * 1000) // last hour
      const g = new GetMetricStatisticsCommand({
        Namespace: process.env.LLM_METRIC_NAMESPACE || 'Huntaze/LLM',
        MetricName: process.env.LLM_METRIC_NAME || 'LatencyMs',
        Dimensions: [{ Name: 'Service', Value: 'LLMProxy' }],
        StartTime: start,
        EndTime: end,
        Period: 300,
        Statistics: ['Average'],
      })
      const m = await cw.send(g)
      avg_llm_latency = m.Datapoints && m.Datapoints.length ? (m.Datapoints[0].Average as number) : null
    } catch {}

    // 3) Queue depth SQS (optional)
    let queue_depth: number | null = null
    if (OF_SQS_URL) {
      try {
        const qa = new GetQueueAttributesCommand({
          QueueUrl: OF_SQS_URL,
          AttributeNames: ['ApproximateNumberOfMessages'],
        })
        const attrs = await sqs.send(qa)
        const raw = attrs.Attributes?.ApproximateNumberOfMessages
        queue_depth = raw ? parseInt(raw, 10) : 0
      } catch {}
    }

    return NextResponse.json({ pending_reviews, avg_llm_latency, queue_depth })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'monitoring failed' }, { status: 500 })
  }
}

