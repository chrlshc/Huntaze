import { DynamoDBClient, DescribeTableCommand } from '@aws-sdk/client-dynamodb';
const ddb = new DynamoDBClient({ region: process.env.AWS_REGION||'us-east-1' });
const out = await ddb.send(new DescribeTableCommand({ TableName:'huntaze-oauth-tokens' }));
const t = out.Table;
const gsis = (t?.GlobalSecondaryIndexes||[]).map(ix=>({Name:ix.IndexName,Status:ix.IndexStatus,PK:ix.KeySchema?.[0]?.AttributeName,SK:ix.KeySchema?.[1]?.AttributeName}));
console.log(JSON.stringify({ Name:t?.TableName, Billing:t?.BillingModeSummary?.BillingMode||'PAY_PER_REQUEST', GSIs:gsis }, null, 2));
