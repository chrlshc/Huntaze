import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const REGION = process.env.AWS_REGION || process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1';
const TABLE = process.env.USERS_TABLE || '';

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }));

export async function getUserById(userId: string) {
  if (!TABLE) return null;
  const out = await ddb.send(new GetCommand({ TableName: TABLE, Key: { userId } }));
  return (out.Item as any) || null;
}

export async function setStripeCustomer(userId: string, customerId: string) {
  if (!TABLE) return;
  await ddb.send(
    new UpdateCommand({
      TableName: TABLE,
      Key: { userId },
      UpdateExpression: 'SET stripeCustomerId = :c, updatedAt = :t',
      ExpressionAttributeValues: { ':c': customerId, ':t': new Date().toISOString() },
    })
  );
}

export async function updateSubscription(
  userId: string,
  status: string,
  tier?: string | null,
  subscriptionId?: string | null
) {
  if (!TABLE) return;
  await ddb.send(
    new UpdateCommand({
      TableName: TABLE,
      Key: { userId },
      UpdateExpression:
        'SET subscriptionStatus = :s, subscriptionTier = :tier, subscriptionId = :sid, updatedAt = :t',
      ExpressionAttributeValues: {
        ':s': status,
        ':tier': tier ?? null,
        ':sid': subscriptionId ?? null,
        ':t': new Date().toISOString(),
      },
    })
  );
}

