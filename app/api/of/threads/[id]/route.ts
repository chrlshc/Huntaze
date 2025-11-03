import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getServerSession } from '@/lib/auth';
import { DynamoDBClient, QueryCommand } from '@aws-sdk/client-dynamodb';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: conversationId } = await params;
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const messages = mockMessages[conversationId] || [];

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
