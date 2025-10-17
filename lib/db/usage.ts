import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const REGION = process.env.AWS_REGION || process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1';
const TABLE = process.env.USERS_TABLE || '';

const ddb = TABLE ? DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION })) : null as any;

export async function getUsage(userId: string) {
  if (!TABLE || !ddb) return { messagesToday: 0, tokensMonth: 0, lastDay: null };
  const res = await ddb.send(new GetCommand({ TableName: TABLE, Key: { userId } }));
  const item: any = res.Item || {};
  const usage = item.usage || {};
  return {
    messagesToday: usage.messagesToday || 0,
    tokensMonth: usage.tokensMonth || 0,
    lastDay: usage.lastDay || null,
  };
}

export async function incrementUsage(userId: string, tokensIn: number, tokensOut: number) {
  if (!TABLE || !ddb) return;
  const day = new Date().toISOString().slice(0,10);
  const tokens = Math.max(0, (tokensIn||0) + (tokensOut||0));
  await ddb.send(new UpdateCommand({
    TableName: TABLE,
    Key: { userId },
    UpdateExpression: `SET usage = if_not_exists(usage, :u), usage.lastDay = :d, usage.messagesToday = (case when usage.lastDay = :d then usage.messagesToday + :one else :one end), usage.tokensMonth = (case when begins_with(:d, :month) and begins_with(usage.lastDay, :month) then usage.tokensMonth + :tok else :tok end)` as any,
    ExpressionAttributeValues: {
      ':u': { messagesToday: 0, tokensMonth: 0, lastDay: day },
      ':d': day,
      ':one': 1,
      ':tok': tokens,
      ':month': day.slice(0,7),
    },
  }));
}

export function getPlanLimits(plan: 'starter'|'pro'|'scale') {
  const msgs = {
    starter: Number(process.env.PLAN_MAX_MSGS_DAILY_STARTER || 40),
    pro: Number(process.env.PLAN_MAX_MSGS_DAILY_PRO || 120),
    scale: Number(process.env.PLAN_MAX_MSGS_DAILY_SCALE || 250),
  }[plan];
  const tokens = {
    starter: Number(process.env.PLAN_MAX_TOKENS_MONTHLY_STARTER || 1_000_000),
    pro: Number(process.env.PLAN_MAX_TOKENS_MONTHLY_PRO || 3_000_000),
    scale: Number(process.env.PLAN_MAX_TOKENS_MONTHLY_SCALE || 10_000_000),
  }[plan];
  return { messagesDaily: msgs, tokensMonthly: tokens };
}

