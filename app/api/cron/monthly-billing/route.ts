import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { makeReqLogger } from '@/lib/logger';
import { OnlyFansAPI, decryptApiKey } from '@/lib/integrations/onlyfans';
import { CommissionTracker } from '@/lib/billing/commission-tracker';

// This endpoint should be called monthly by a cron job
// Use Vercel Cron, AWS EventBridge, or GitHub Actions
export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const log = makeReqLogger({ requestId });
  try {
    // Verify cron secret
    const cronSecret = request.headers.get('x-cron-secret');
    if (cronSecret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all active users with OnlyFans connections
    const users = await getActiveUsersWithOnlyFans();
    
    const results = [];
    
    for (const user of users) {
      try {
        // Decrypt stored API key
        const apiKey = decryptApiKey(user.onlyfansApiKeyEncrypted);
        
        // Initialize OnlyFans API
        const onlyFans = new OnlyFansAPI({
          userId: user.onlyfansUserId,
          apiKey: apiKey,
        });
        
        // Get current month earnings
        const now = new Date();
        const monthlyEarnings = await onlyFans.getMonthlyEarnings(
          now.getFullYear(),
          now.getMonth() + 1
        );
        
        // Report earnings for commission calculation
        const commission = await CommissionTracker.reportEarnings({
          userId: user.id,
          monthlyRevenue: monthlyEarnings,
          platform: 'onlyfans',
          period: {
            start: new Date(now.getFullYear(), now.getMonth(), 1),
            end: new Date(now.getFullYear(), now.getMonth() + 1, 0),
          },
        });
        
        results.push({
          userId: user.id,
          earnings: monthlyEarnings,
          commission: commission,
          status: 'success',
        });
        
        // Store earnings in database for records
        await storeMonthlyEarnings(user.id, monthlyEarnings, commission);
        
      } catch (error: any) {
        log.error('monthly_billing_user_failed', { userId: user.id, error: error?.message || 'unknown_error' });
        results.push({
          userId: user.id,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
    
    const r = NextResponse.json({
      processed: results.length,
      results: results,
      requestId,
    });
    r.headers.set('X-Request-Id', requestId);
    return r;
    
  } catch (error: any) {
    log.error('monthly_billing_failed', { error: error?.message || 'unknown_error' });
    const r = NextResponse.json({ error: 'Processing failed', requestId }, { status: 500 });
    r.headers.set('X-Request-Id', requestId);
    return r;
  }
}

// Helper functions (implement with your database)
async function getActiveUsersWithOnlyFans(): Promise<any[]> {
  try {
    const { DynamoDBClient } = await import('@aws-sdk/client-dynamodb');
    const { DynamoDBDocumentClient, QueryCommand, BatchGetCommand } = await import('@aws-sdk/lib-dynamodb');
    const REGION = process.env.AWS_REGION || process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1';
    const TABLE = process.env.USERS_TABLE || '';
    if (!TABLE) return [];

    const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }));

    // 1) Page through GSI ActiveSubscribers to get userIds of active users
    const userIds: string[] = [];
    let ExclusiveStartKey: Record<string, any> | undefined = undefined;
    do {
      const page = await ddb.send(
        new QueryCommand({
          TableName: TABLE,
          IndexName: 'ActiveSubscribers',
          KeyConditionExpression: 'subscriptionStatus = :s',
          ExpressionAttributeValues: { ':s': 'active' },
          ProjectionExpression: 'userId', // KEYS_ONLY projection returns table PK
          ExclusiveStartKey,
        })
      );
      for (const it of page.Items ?? []) {
        const uid = (it as any).userId;
        if (uid && typeof uid === 'string') userIds.push(uid);
      }
      ExclusiveStartKey = page.LastEvaluatedKey as any;
    } while (ExclusiveStartKey);

    if (!userIds.length) return [];

    // 2) Batch-get full user records (needed fields not projected on KEYS_ONLY index)
    const results: any[] = [];
    const chunkSize = 100; // DynamoDB BatchGet hard limit
    for (let i = 0; i < userIds.length; i += chunkSize) {
      const chunk = userIds.slice(i, i + chunkSize);
      const out = await ddb.send(
        new BatchGetCommand({
          RequestItems: {
            [TABLE]: {
              Keys: chunk.map((userId) => ({ userId })),
              ProjectionExpression: 'userId, onlyfansUserId, onlyfansApiKeyEncrypted',
            },
          },
        })
      );
      const items = (out.Responses?.[TABLE] as any[]) || [];
      for (const item of items) {
        if (item?.onlyfansUserId && item?.onlyfansApiKeyEncrypted) {
          results.push({
            id: item.userId, // normalize to existing code path
            onlyfansUserId: item.onlyfansUserId,
            onlyfansApiKeyEncrypted: item.onlyfansApiKeyEncrypted,
          });
        }
      }
    }

    return results;
  } catch {
    return [];
  }
}

async function storeMonthlyEarnings(userId: string, earnings: number, commission: any): Promise<void> {
  try {
    const { DynamoDBClient } = await import('@aws-sdk/client-dynamodb');
    const { DynamoDBDocumentClient, UpdateCommand } = await import('@aws-sdk/lib-dynamodb');
    const REGION = process.env.AWS_REGION || process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1';
    const TABLE = process.env.USERS_TABLE || '';
    if (!TABLE) return;
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }));
    await ddb.send(
      new UpdateCommand({
        TableName: TABLE,
        Key: { userId },
        UpdateExpression:
          'SET lastMonthlyEarnings = :e, lastCommission = :c, earningsByMonth.#m = :e, updatedAt = :t',
        ExpressionAttributeNames: { '#m': monthKey },
        ExpressionAttributeValues: {
          ':e': earnings,
          ':c': commission?.commission ?? commission ?? 0,
          ':t': new Date().toISOString(),
        },
      })
    );
  } catch {
    // best-effort
  }
}
