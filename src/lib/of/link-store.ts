import { DynamoDBClient, GetItemCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb';

const REGION = process.env.OF_AWS_REGION || process.env.AWS_REGION || 'us-east-1';
const TABLE = process.env.OF_DDB_SESSIONS_TABLE || 'HuntazeOfSessions';

const ddb = new DynamoDBClient({ region: REGION });

export type OfLinkState = 'PENDING' | 'LOGIN_STARTED' | 'OTP_REQUIRED' | 'FACEID_REQUIRED' | 'CONNECTED' | 'FAILED';

export async function setOfLinkStatus(userId: string, opts: { state: OfLinkState; errorCode?: string | null }) {
  const now = new Date().toISOString();
  const hasError = typeof opts.errorCode === 'string' && opts.errorCode.length > 0;
  const updateExpr = hasError
    ? 'SET linkState = :s, updatedAt = :ts, errorCode = :e'
    : 'SET linkState = :s, updatedAt = :ts';
  const exprVals: any = {
    ':s': { S: opts.state },
    ':ts': { S: now },
  };
  if (hasError) exprVals[':e'] = { S: String(opts.errorCode) };

  await ddb.send(new UpdateItemCommand({
    TableName: TABLE,
    Key: { userId: { S: userId } },
    UpdateExpression: updateExpr,
    ExpressionAttributeValues: exprVals,
  }));
}

export async function getOfLinkStatus(userId: string): Promise<{ state: OfLinkState; updatedAt?: string; errorCode?: string } | null> {
  const res = await ddb.send(new GetItemCommand({
    TableName: TABLE,
    Key: { userId: { S: userId } },
  }));
  const item = res.Item;
  if (!item) return null;
  const state = item.linkState?.S as OfLinkState | undefined;
  if (!state) return null;
  return {
    state,
    updatedAt: item.updatedAt?.S,
    errorCode: item.errorCode?.S,
  };
}
