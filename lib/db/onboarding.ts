import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const REGION = process.env.AWS_REGION || process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1';
const TABLE = process.env.USERS_TABLE || '';
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }));

export async function saveOnboarding(userId: string, step: string, data: Record<string, any>) {
  if (!TABLE) return;
  await ddb.send(
    new UpdateCommand({
      TableName: TABLE,
      Key: { userId },
      UpdateExpression: 'SET onboarding = if_not_exists(onboarding, :o), onboarding.#s = :d, updatedAt = :t',
      ExpressionAttributeNames: { '#s': step },
      ExpressionAttributeValues: {
        ':o': {},
        ':d': data,
        ':t': new Date().toISOString(),
      },
    })
  );
}

