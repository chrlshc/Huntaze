// Utility: Put encrypted OnlyFans cookies into DynamoDB using KMS
// Usage:
//   OF_AWS_REGION=eu-west-3 \
//   OF_DDB_SESSIONS_TABLE=HuntazeOfSessions \
//   OF_KMS_KEY_ID=arn:aws:kms:... \
//   node scripts/of-put-cookies.mjs <userId> <cookies.json>

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { KMSClient, EncryptCommand } from '@aws-sdk/client-kms';

const [,, userIdArg, cookiesFileArg] = process.argv;
if (!userIdArg || !cookiesFileArg) {
  console.error('Usage: node scripts/of-put-cookies.mjs <userId> <cookies.json>');
  process.exit(1);
}

const REGION = process.env.OF_AWS_REGION || process.env.AWS_REGION || 'eu-west-3';
const TABLE = process.env.OF_DDB_SESSIONS_TABLE;
const KMS_KEY_ID = process.env.OF_KMS_KEY_ID;

if (!TABLE || !KMS_KEY_ID) {
  console.error('Missing env: OF_DDB_SESSIONS_TABLE and/or OF_KMS_KEY_ID');
  process.exit(2);
}

const userId = userIdArg;
const cookiesPath = resolve(process.cwd(), cookiesFileArg);
const cookiesJson = readFileSync(cookiesPath, 'utf-8');

const ddb = new DynamoDBClient({ region: REGION });
const kms = new KMSClient({ region: REGION });

try {
  const enc = await kms.send(new EncryptCommand({
    KeyId: KMS_KEY_ID,
    Plaintext: Buffer.from(cookiesJson, 'utf-8'),
  }));
  const b64 = Buffer.from(enc.CiphertextBlob).toString('base64');
  await ddb.send(new PutItemCommand({
    TableName: TABLE,
    Item: {
      userId: { S: userId },
      cookiesCipherB64: { S: b64 },
      requiresAction: { BOOL: false },
      updatedAt: { S: new Date().toISOString() },
    }
  }));
  console.log('OK - cookies stored for', userId);
} catch (e) {
  console.error('Failed:', e?.message || e);
  process.exit(3);
}

