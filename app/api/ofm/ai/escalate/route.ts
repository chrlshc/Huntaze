import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSession } from '@/lib/auth';
import { DynamoDBClient, UpdateItemCommand } from '@aws-sdk/client-dynamodb';

const schema = z.object({ conversationId: z.string().min(1), reason: z.string().optional() });

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession().catch(() => null);
    const userId = (session as any)?.user?.id as string | undefined;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { conversationId, reason } = schema.parse(await req.json().catch(() => ({})));

    const table = process.env.OF_DDB_THREADS_TABLE;
    if (table) {
      const region = process.env.OF_AWS_REGION || process.env.AWS_REGION || 'us-east-1';
      const ddb = new DynamoDBClient({ region });
      await ddb.send(
        new UpdateItemCommand({
          TableName: table,
          Key: { userId: { S: userId }, threadId: { S: conversationId } },
          UpdateExpression: 'SET escalated = :t, escalationReason = :r, updatedAt = :iso',
          ExpressionAttributeValues: {
            ':t': { BOOL: true },
            ':r': { S: reason || '' },
            ':iso': { S: new Date().toISOString() },
          },
        }),
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    if (e?.issues) return NextResponse.json({ error: 'Invalid request', details: e.issues }, { status: 400 });
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

