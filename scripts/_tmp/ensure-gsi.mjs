import { DynamoDBClient, DescribeTableCommand, UpdateTableCommand } from '@aws-sdk/client-dynamodb';
const ddb = new DynamoDBClient({ region: process.env.AWS_REGION||'us-east-1' });
const TABLE='huntaze-oauth-tokens';
const GSI='byExpiry';
function sleep(ms){ return new Promise(r=>setTimeout(r,ms)); }
async function get(){ const out = await ddb.send(new DescribeTableCommand({ TableName: TABLE })); return out.Table; }
async function waitActive(){ for(let i=0;i<60;i++){ const s=(await get())?.TableStatus; if(s==='ACTIVE') return true; await sleep(3000);} return false; }
async function ensureGsi(){ const t=await get(); const has=(t?.GlobalSecondaryIndexes||[]).some(ix=>ix.IndexName===GSI); if(has) return 'exists'; await ddb.send(new UpdateTableCommand({ TableName: TABLE, AttributeDefinitions:[ {AttributeName:'platform',AttributeType:'S'},{AttributeName:'expiresAt',AttributeType:'N'} ], GlobalSecondaryIndexUpdates:[{ Create:{ IndexName:GSI, KeySchema:[ {AttributeName:'platform',KeyType:'HASH'},{AttributeName:'expiresAt',KeyType:'RANGE'} ], Projection:{ProjectionType:'ALL'} } }] })); return 'created'; }
async function waitGsiActive(){ for(let i=0;i<60;i++){ const t=await get(); const g=(t?.GlobalSecondaryIndexes||[]).find(ix=>ix.IndexName===GSI); if(g && g.IndexStatus==='ACTIVE') return true; await sleep(5000);} return false; }
const ok = await waitActive();
console.log('[gsi] table ACTIVE:', ok);
if(!ok) process.exit(1);
const res = await ensureGsi();
console.log('[gsi] ensure result:', res);
const okG = await waitGsiActive();
console.log('[gsi] GSI ACTIVE:', okG);
