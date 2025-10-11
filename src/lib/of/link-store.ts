import { DynamoDBClient, GetItemCommand, PutItemCommand } from '@aws-sdk/client-dynamodb';

const REGION = process.env.OF_AWS_REGION || process.env.AWS_REGION || 'us-east-1';
const TABLE = process.env.OF_DDB_SESSIONS_TABLE || 'HuntazeOfSessions';

const ddb = new DynamoDBClient({ region: REGION });

export type OfLinkState = 'PENDING' | 'LOGIN_STARTED' | 'OTP_REQUIRED' | 'FACEID_REQUIRED' | 'CONNECTED' | 'FAILED';

export async function setOfLinkStatus(userId: string, opts: { state: OfLinkState; errorCode?: string | null }) {
  await ddb.send(new PutItemCommand({
    TableName: TABLE,
    Item: {
      userId: { S: userId },
      linkState: { S: opts.state },
      ...(opts.errorCode ? { errorCode: { S: String(opts.errorCode) } } : {}),
      updatedAt: { S: new Date().toISOString() },
    },
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

