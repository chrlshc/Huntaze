import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient, QueryCommand, PutItemCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb';

type TokenItem = {
  userId: string;
  platform: 'tiktok' | 'reddit' | 'instagram';
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number; // ms epoch
  scope?: string[];
};

const TABLE = 'huntaze-oauth-tokens';
const client = new DynamoDBClient({ region: process.env.AWS_REGION || process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1' });

async function handle(request: NextRequest) {
  const headerSecret = request.headers.get('x-cron-secret') || request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  const querySecret = request.nextUrl.searchParams.get('secret');
  const isVercelCron = !!request.headers.get('x-vercel-cron');
  const okSecret = (process.env.CRON_SECRET || '');
  if (!isVercelCron && !headerSecret && !querySecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!isVercelCron && (headerSecret || querySecret) !== okSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = Date.now();
  // Lightweight lock to avoid overlapping runs (Vercel + EventBridge)
  try {
    await client.send(
      new UpdateItemCommand({
        TableName: TABLE,
        Key: { userId: { S: 'cron' }, platform: { S: 'refresh-oauth' } },
        UpdateExpression: 'SET expiresAt = :exp',
        ExpressionAttributeValues: {
          ':exp': { N: String(now + 10 * 60 * 1000) }, // lock 10 min
          ':now': { N: String(now) },
        },
        ConditionExpression: 'attribute_not_exists(expiresAt) OR expiresAt < :now',
      })
    );
  } catch (e) {
    return NextResponse.json({ ok: true, skipped: 'lock_active' });
  }
  const results: any[] = [];
  let refreshed = 0;

  async function queryExpiring(platform: TokenItem['platform'], cutoffMs: number): Promise<TokenItem[]> {
    const out = await client.send(
      new QueryCommand({
        TableName: TABLE,
        IndexName: 'byExpiry',
        KeyConditionExpression: 'platform = :p AND expiresAt <= :t',
        ExpressionAttributeValues: {
          ':p': { S: platform },
          ':t': { N: String(cutoffMs) },
        },
      })
    );
    return (out.Items || []).map((it) => ({
      userId: it.userId?.S || '',
      platform: (it.platform?.S || platform) as any,
      accessToken: it.accessToken?.S || '',
      refreshToken: it.refreshToken?.S || undefined,
      expiresAt: it.expiresAt?.N ? Number(it.expiresAt.N) : undefined,
      scope: it.scope?.S ? String(it.scope.S).split(',').filter(Boolean) : undefined,
    }));
  }

  const toRefresh: TokenItem[] = [];
  // Reddit: 20 minutes
  toRefresh.push(...(await queryExpiring('reddit', now + 20 * 60 * 1000)));
  // TikTok: 12 hours
  toRefresh.push(...(await queryExpiring('tiktok', now + 12 * 60 * 60 * 1000)));
  // Instagram: 7 days
  toRefresh.push(...(await queryExpiring('instagram', now + 7 * 24 * 60 * 60 * 1000)));

  for (const tok of toRefresh) {
    const msLeft = typeof tok.expiresAt === 'number' ? tok.expiresAt - now : undefined;
    try {
      switch (tok.platform) {
        case 'reddit': {
          // Refresh if < 20 minutes left
          if (!tok.refreshToken || (msLeft !== undefined && msLeft > 20 * 60 * 1000)) break;
          const resp = await fetch('https://www.reddit.com/api/v1/access_token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'Authorization': `Basic ${Buffer.from(`${process.env.REDDIT_CLIENT_ID}:${process.env.REDDIT_CLIENT_SECRET}`).toString('base64')}`,
              'User-Agent': process.env.REDDIT_USER_AGENT || 'Huntaze:v1.0.0',
            },
            body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: tok.refreshToken }),
          });
          if (resp.ok) {
            const data = await resp.json();
            tok.accessToken = data.access_token || tok.accessToken;
            tok.refreshToken = data.refresh_token || tok.refreshToken;
            tok.expiresAt = Date.now() + (data.expires_in || 3600) * 1000;
            await persist(tok);
            refreshed++;
            results.push({ platform: tok.platform, userId: tok.userId, status: 'refreshed' });
          }
          break;
        }
        case 'tiktok': {
          // Refresh if < 12 hours left
          if (!tok.refreshToken || (msLeft !== undefined && msLeft > 12 * 60 * 60 * 1000)) break;
          const resp = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              client_key: process.env.TIKTOK_CLIENT_KEY || '',
              client_secret: process.env.TIKTOK_CLIENT_SECRET || '',
              grant_type: 'refresh_token',
              refresh_token: tok.refreshToken,
            }),
          });
          if (resp.ok) {
            const data = await resp.json();
            tok.accessToken = data.access_token || tok.accessToken;
            tok.refreshToken = data.refresh_token || tok.refreshToken;
            tok.expiresAt = Date.now() + (data.expires_in || 86400) * 1000;
            await persist(tok);
            refreshed++;
            results.push({ platform: tok.platform, userId: tok.userId, status: 'refreshed' });
          }
          break;
        }
        case 'instagram': {
          // Long-lived; refresh if < 7 days left
          if (!tok.accessToken || (msLeft !== undefined && msLeft > 7 * 24 * 60 * 60 * 1000)) break;
          const url = `https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${encodeURIComponent(tok.accessToken)}`;
          const resp = await fetch(url);
          if (resp.ok) {
            const data = await resp.json();
            tok.accessToken = data.access_token || tok.accessToken;
            tok.expiresAt = Date.now() + (data.expires_in || 60 * 24 * 60 * 60) * 1000;
            await persist(tok);
            refreshed++;
            results.push({ platform: tok.platform, userId: tok.userId, status: 'refreshed' });
          }
          break;
        }
      }
    } catch (e: any) {
      results.push({ platform: tok.platform, userId: tok.userId, error: e?.message || 'refresh_failed' });
    }
  }

  return NextResponse.json({ ok: true, refreshed, results });
}

export async function POST(request: NextRequest) {
  return handle(request);
}

export async function GET(request: NextRequest) {
  return handle(request);
}

async function persist(tok: TokenItem) {
  await client.send(
    new PutItemCommand({
      TableName: TABLE,
      Item: {
        userId: { S: tok.userId },
        platform: { S: tok.platform },
        accessToken: { S: tok.accessToken || '' },
        refreshToken: { S: tok.refreshToken || '' },
        expiresAt: { N: String(tok.expiresAt || (Date.now() + 3600 * 1000)) },
        scope: { S: (tok.scope || []).join(',') },
      },
    })
  );
}
