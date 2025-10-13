import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getServerSession } from '@/lib/auth';
import { DynamoDBClient, QueryCommand } from '@aws-sdk/client-dynamodb';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession().catch(() => null);
    const userId = (session as any)?.user?.id as string | undefined;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const messagesTable = process.env.OF_DDB_MESSAGES_TABLE;
    const region = process.env.OF_AWS_REGION || process.env.AWS_REGION || 'us-east-1';

    if (!messagesTable) {
      // fallback to upstream proxy
      const token = cookies().get('access_token')?.value;
      if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      const upstream = `${process.env.NEXT_PUBLIC_API_URL}/of/threads/${params.id}`;
      const res = await fetch(upstream, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
      return new NextResponse(res.body, { status: res.status, headers: res.headers });
    }

    const ddb = new DynamoDBClient({ region });
    const userThread = `${userId}#${params.id}`;
    const out = await ddb.send(new QueryCommand({
      TableName: messagesTable,
      KeyConditionExpression: 'userThread = :pk AND begins_with(sortKey, :prefix)',
      ExpressionAttributeValues: { ':pk': { S: userThread }, ':prefix': { S: 'ts#' } },
      ScanIndexForward: true,
      Limit: 500,
    }));

    const messages = (out.Items || []).map((it) => ({
      id: it.messageId?.S || it.sortKey?.S || '',
      conversationId: params.id,
      platformMessageId: it.messageId?.S || '',
      senderId: it.direction?.S === 'OUT' ? userId : 'fan',
      content: { text: it.text?.S },
      isFromCreator: it.direction?.S === 'OUT',
      readAt: undefined,
      createdAt: new Date((Number(it.createdAt?.N || '0')) * 1000),
    }));

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Error proxying OF thread:', error);
    return NextResponse.json({ error: 'Upstream error' }, { status: 502 });
  }
}
