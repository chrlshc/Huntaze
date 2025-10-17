import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json().catch(() => ({}))
    const userId = body.userId || body.user?.id
    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })
    const scheduledAt = body.scheduledAt || new Date().toISOString()
    const now = new Date().toISOString()

    const { DynamoDBClient } = await import('@aws-sdk/client-dynamodb')
    const { DynamoDBDocumentClient, UpdateCommand } = await import('@aws-sdk/lib-dynamodb')
    const REGION = process.env.AWS_REGION || process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1'
    const POSTS_TABLE = process.env.POSTS_TABLE || 'huntaze-posts'
    const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }))
    await ddb.send(new UpdateCommand({
      TableName: POSTS_TABLE,
      Key: { userId, postId: params.id },
      ConditionExpression: 'attribute_exists(postId) AND (#s = :draft OR #s = :queued)',
      UpdateExpression: 'SET #s = :queued, scheduledAt = :when, updatedAt = :now',
      ExpressionAttributeNames: { '#s': 'status' },
      ExpressionAttributeValues: { ':draft': 'draft', ':queued': 'queued', ':when': scheduledAt, ':now': now },
    }))
    return new NextResponse(null, { status: 204 })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'failed' }, { status: 500 })
  }
}

