import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { randomUUID } = await import('crypto')
    const { DynamoDBClient } = await import('@aws-sdk/client-dynamodb')
    const { DynamoDBDocumentClient, PutCommand } = await import('@aws-sdk/lib-dynamodb')
    const REGION = process.env.AWS_REGION || process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1'
    const POSTS_TABLE = process.env.POSTS_TABLE || 'huntaze-posts'
    const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }))

    const now = new Date().toISOString()
    const userId = body.userId || body.user?.id // adapt if auth is present
    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

    const post = {
      userId,
      postId: randomUUID(),
      status: 'draft',
      createdAt: now,
      updatedAt: now,
      platformTargets: Array.isArray(body.platformTargets) ? body.platformTargets : [],
      variants: body.variants || {},
      assets: Array.isArray(body.assets) ? body.assets : [],
    }
    await ddb.send(new PutCommand({ TableName: POSTS_TABLE, Item: post }))
    return NextResponse.json(post, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'failed' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })
    const { DynamoDBClient } = await import('@aws-sdk/client-dynamodb')
    const { DynamoDBDocumentClient, QueryCommand } = await import('@aws-sdk/lib-dynamodb')
    const REGION = process.env.AWS_REGION || process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1'
    const POSTS_TABLE = process.env.POSTS_TABLE || 'huntaze-posts'
    const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }))
    const out = await ddb.send(new QueryCommand({
      TableName: POSTS_TABLE,
      IndexName: 'ByUserCreatedAt',
      KeyConditionExpression: 'userId = :u',
      ExpressionAttributeValues: { ':u': userId },
      ScanIndexForward: false,
      Limit: 50,
    }))
    return NextResponse.json({ items: out.Items || [] })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'failed' }, { status: 500 })
  }
}
