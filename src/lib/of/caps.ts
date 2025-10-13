import { DynamoDBClient, UpdateItemCommand } from '@aws-sdk/client-dynamodb';

const REGION = process.env.OF_AWS_REGION || process.env.AWS_REGION || 'us-east-1';
const CAPS_TABLE = process.env.OF_DDB_FAN_CAPS_TABLE || 'HuntazeFanCaps';

function isoDay(d: Date) {
  return d.toISOString().slice(0, 10);
}

/**
 * Atomically checks and increments per-fan caps (day/week), with optional cooldown.
 * If table/env is not configured, silently allows.
 */
export async function checkAndIncrementCaps(
  userId: string,
  fanId: string,
  kind: 'DM' | 'PPV',
  now: Date = new Date(),
  limits: { dmPerDay?: number; ppvPerDay?: number } = { dmPerDay: 3, ppvPerDay: 1 },
): Promise<boolean> {
  try {
    if (!CAPS_TABLE) return true;
    const ddb = new DynamoDBClient({ region: REGION });
    const dayKey = isoDay(now);
    const isPPV = kind === 'PPV';
    const cap = isPPV ? (limits.ppvPerDay ?? 1) : (limits.dmPerDay ?? 3);

    const updates = isPPV
      ? 'SET countPPVDay = if_not_exists(countPPVDay, :z) + :one, dayKey = :day'
      : 'SET countDMDay = if_not_exists(countDMDay, :z) + :one, dayKey = :day';
    const condition = isPPV
      ? 'attribute_not_exists(countPPVDay) OR countPPVDay < :cap'
      : 'attribute_not_exists(countDMDay) OR countDMDay < :cap';

    await ddb.send(new UpdateItemCommand({
      TableName: CAPS_TABLE,
      Key: { userFan: { S: `${userId}#${fanId}` } },
      UpdateExpression: updates,
      ConditionExpression: condition,
      ExpressionAttributeValues: {
        ':one': { N: '1' },
        ':z': { N: '0' },
        ':cap': { N: String(cap) },
        ':day': { S: dayKey },
      },
    }));
    return true;
  } catch {
    return false;
  }
}

