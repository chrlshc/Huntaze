import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getServerSession } from '@/lib/auth';
import { DynamoDBClient, QueryCommand } from '@aws-sdk/client-dynamodb';
import type { OfConversation } from '@/lib/types/onlyfans';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession().catch(() => null);
    const userId = (session as any)?.user?.id as string | undefined;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const threadsTable = process.env.OF_DDB_THREADS_TABLE;
    const region = process.env.OF_AWS_REGION || process.env.AWS_REGION || 'us-east-1';

    // If no DDB table configured, fallback to upstream proxy
    if (!threadsTable) {
      const token = cookies().get('access_token')?.value;
      if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      const qs = new URL(request.url).search || '';
      const upstream = `${process.env.NEXT_PUBLIC_API_URL}/of/inbox${qs}`;
      const res = await fetch(upstream, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
      return new NextResponse(res.body, { status: res.status, headers: res.headers });
    }

    // Read from DDB Threads and shape to OfConversation[]
    const ddb = new DynamoDBClient({ region });
    const limit = Number(new URL(request.url).searchParams.get('limit') || '50');
    const query = await ddb.send(new QueryCommand({
      TableName: threadsTable,
      KeyConditionExpression: 'userId = :u',
      ExpressionAttributeValues: { ':u': { S: userId } },
      Limit: Math.min(limit, 200),
      ScanIndexForward: false,
    }));

    const conversations: OfConversation[] = (query.Items || [])
      .map((it) => ({
        id: it.threadId?.S || '',
        userId,
        platformUserId: it.fanId?.S || '',
        username: it.fanId?.S || '',
        displayName: it.fanId?.S || '',
        avatarUrl: undefined,
        isSubscribed: true,
        subscriptionPrice: undefined,
        subscriptionExpiry: undefined,
        totalSpent: 0,
        totalTips: 0,
        totalPPVPurchases: 0,
        lastPurchaseAt: undefined,
        lastMessageAt: new Date((Number(it.lastActivityAt?.N || '0')) * 1000),
        lastSeenAt: undefined,
        unreadCount: Number(it.unreadCount?.N || '0'),
        tags: (it.segmentTags?.SS || []) as string[],
        customLabels: undefined,
        welcomeMessageSent: undefined,
        createdAt: new Date(),
        updatedAt: new Date(it.updatedAt?.S || new Date().toISOString()),
      }))
      .sort((a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime());

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error('Error proxying OF inbox:', error);
    return NextResponse.json({ error: 'Upstream error' }, { status: 502 });
  }
}
