export const ttlInSeconds = (hours = 24): number =>
  Math.floor(Date.now() / 1000) + hours * 3600;

// Optional helper to mark a synthetic user row for expiry
export async function markSyntheticUserForExpiry(userId: string, hours = 24) {
  const { DynamoDBClient } = await import('@aws-sdk/client-dynamodb');
  const { DynamoDBDocumentClient, UpdateCommand } = await import('@aws-sdk/lib-dynamodb');
  const REGION = process.env.AWS_REGION || process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1';
  const TABLE = process.env.USERS_TABLE as string;
  const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }));

  await ddb.send(
    new UpdateCommand({
      TableName: TABLE,
      Key: { userId },
      UpdateExpression: 'SET #ttl = :t',
      ExpressionAttributeNames: { '#ttl': 'ttl' },
      ExpressionAttributeValues: { ':t': ttlInSeconds(hours) },
    })
  );
}

