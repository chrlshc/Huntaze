import { DynamoDBClient, GetItemCommand, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { KMSClient, DecryptCommand, EncryptCommand } from '@aws-sdk/client-kms';

const REGION = process.env.OF_AWS_REGION || process.env.AWS_REGION || 'eu-west-3';
const TABLE = process.env.OF_DDB_SESSIONS_TABLE || 'HuntazeOfSessions';
const KMS_KEY_ID = process.env.OF_KMS_KEY_ID as string;

const ddb = new DynamoDBClient({ region: REGION });
const kms = new KMSClient({ region: REGION });

export type AwsSessionRecord = {
  userId: string;
  cookiesCipherB64: string;
  requiresAction?: boolean;
  updatedAt?: string;
};

export async function putEncryptedCookies(userId: string, cookiesJson: string) {
  if (!KMS_KEY_ID) throw new Error('OF_KMS_KEY_ID not set');
  const enc = await kms.send(new EncryptCommand({
    KeyId: KMS_KEY_ID,
    Plaintext: Buffer.from(cookiesJson, 'utf-8'),
  }));
  const b64 = Buffer.from(enc.CiphertextBlob as Uint8Array).toString('base64');
  await ddb.send(new PutItemCommand({
    TableName: TABLE,
    Item: {
      userId: { S: userId },
      cookiesCipherB64: { S: b64 },
      requiresAction: { BOOL: false },
      linkState: { S: 'CONNECTED' },
      updatedAt: { S: new Date().toISOString() },
    }
  }));
}

export async function getDecryptedCookies(userId: string): Promise<string | null> {
  const res = await ddb.send(new GetItemCommand({
    TableName: TABLE,
    Key: { userId: { S: userId } }
  }));
  const b64 = res.Item?.cookiesCipherB64?.S;
  if (!b64) return null;
  const dec = await kms.send(new DecryptCommand({
    CiphertextBlob: Buffer.from(b64, 'base64'),
  }));
  return Buffer.from(dec.Plaintext as Uint8Array).toString('utf-8');
}

export async function getSessionMeta(userId: string): Promise<{ updatedAt: string | null; requiresAction: boolean | null }>
{
  const res = await ddb.send(new GetItemCommand({
    TableName: TABLE,
    Key: { userId: { S: userId } },
    ProjectionExpression: 'updatedAt, requiresAction',
  }));
  const updatedAt = res.Item?.updatedAt?.S ?? null;
  const requiresAction = typeof res.Item?.requiresAction?.BOOL === 'boolean' ? !!res.Item!.requiresAction!.BOOL : null;
  return { updatedAt, requiresAction };
}
