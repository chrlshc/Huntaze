import { DynamoDBClient, QueryCommand } from '@aws-sdk/client-dynamodb';
const ddb = new DynamoDBClient({ region: process.env.AWS_REGION||'us-east-1' });
const cutoffMs = Date.now() + 20*60*1000;
const res = await ddb.send(new QueryCommand({ TableName:'huntaze-oauth-tokens', IndexName:'byExpiry', KeyConditionExpression:'platform = :p AND expiresAt <= :t', ExpressionAttributeValues:{ ':p':{S:'reddit'}, ':t':{N:String(cutoffMs)} }, Limit:5 }));
console.log(JSON.stringify({Count: res.Count, Sample: (res.Items||[]).slice(0,3)}, null, 2));
