#!/usr/bin/env -S node --no-warnings
import { DynamoDBClient, CreateTableCommand, DescribeTableCommand, UpdateTableCommand } from '@aws-sdk/client-dynamodb';

const TABLE = process.env.OAUTH_TABLE_NAME || 'huntaze-oauth-tokens';
const REGION = process.env.AWS_REGION || process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1';

async function main() {
  const ddb = new DynamoDBClient({ region: REGION });

  const exists = await tableExists(ddb, TABLE);
  if (!exists) {
    console.log(`[ensure-oauth-tokens-table] Creating table ${TABLE} in ${REGION}...`);
    await ddb.send(new CreateTableCommand({
      TableName: TABLE,
      BillingMode: 'PAY_PER_REQUEST',
      KeySchema: [
        { AttributeName: 'userId', KeyType: 'HASH' },
        { AttributeName: 'platform', KeyType: 'RANGE' },
      ],
      AttributeDefinitions: [
        { AttributeName: 'userId', AttributeType: 'S' },
        { AttributeName: 'platform', AttributeType: 'S' },
      ],
    }));
    console.log(`[ensure-oauth-tokens-table] Table created.`);
  } else {
    console.log(`[ensure-oauth-tokens-table] Table ${TABLE} already exists.`);
  }

  // Ensure GSI byExpiry exists (platform + expiresAt)
  const hasGsi = await gsiExists(ddb, TABLE, 'byExpiry');
  if (!hasGsi) {
    console.log(`[ensure-oauth-tokens-table] Adding GSI byExpiry...`);
    await ddb.send(new UpdateTableCommand({
      TableName: TABLE,
      AttributeDefinitions: [
        { AttributeName: 'platform', AttributeType: 'S' },
        { AttributeName: 'expiresAt', AttributeType: 'N' },
      ],
      GlobalSecondaryIndexUpdates: [
        {
          Create: {
            IndexName: 'byExpiry',
            KeySchema: [
              { AttributeName: 'platform', KeyType: 'HASH' },
              { AttributeName: 'expiresAt', KeyType: 'RANGE' },
            ],
            Projection: { ProjectionType: 'ALL' },
            ProvisionedThroughput: { ReadCapacityUnits: 1, WriteCapacityUnits: 1 },
          },
        },
      ],
    }));
    console.log(`[ensure-oauth-tokens-table] GSI byExpiry creation requested (status ACTIVE may take a few minutes).`);
  } else {
    console.log(`[ensure-oauth-tokens-table] GSI byExpiry already exists.`);
  }
}

async function tableExists(client: DynamoDBClient, name: string): Promise<boolean> {
  try {
    await client.send(new DescribeTableCommand({ TableName: name }));
    return true;
  } catch (e: any) {
    if (e?.name === 'ResourceNotFoundException') return false;
    throw e;
  }
}

async function gsiExists(client: DynamoDBClient, name: string, indexName: string): Promise<boolean> {
  try {
    const out = await client.send(new DescribeTableCommand({ TableName: name }));
    const gsis = out.Table?.GlobalSecondaryIndexes || [];
    return gsis.some((g) => g.IndexName === indexName);
  } catch (e: any) {
    if (e?.name === 'ResourceNotFoundException') return false;
    throw e;
  }
}

main().catch((err) => {
  console.error('[ensure-oauth-tokens-table] Failed:', err?.message || err);
  process.exit(1);
});

