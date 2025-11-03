'use strict';
const { ECSClient, RunTaskCommand } = require('@aws-sdk/client-ecs');
const { DynamoDBClient, GetItemCommand, UpdateItemCommand } = require('@aws-sdk/client-dynamodb');

const ecs = new ECSClient({});
const ddb = new DynamoDBClient({});

const CLUSTER = process.env.OF_ECS_CLUSTER_ARN;
const TASK_DEF = process.env.OF_ECS_TASKDEF_ARN || process.env.TASK_DEFINITION_ARN;
const SUBNETS = (process.env.OF_VPC_SUBNETS || '').split(',').filter(Boolean);
const SECURITY_GROUP = process.env.OF_TASK_SG_ID;
const SESSIONS_TABLE = process.env.OF_DDB_SESSIONS_TABLE;
const MESSAGES_TABLE = process.env.OF_DDB_MESSAGES_TABLE; // reserved for future use
const KMS_KEY_ID = process.env.OF_KMS_KEY_ID || '';

const COMMON_ENV = (jobUserId) => {
  const base = [
    { name: 'USER_ID', value: String(jobUserId) },
    { name: 'OF_DDB_SESSIONS_TABLE', value: SESSIONS_TABLE || '' },
    { name: 'OF_DDB_MESSAGES_TABLE', value: MESSAGES_TABLE || '' },
  ];
  if (KMS_KEY_ID) base.push({ name: 'OF_KMS_KEY_ID', value: KMS_KEY_ID });
  return base;
};

exports.handler = async (event) => {
  // quick guard for missing env
  if (!CLUSTER || !TASK_DEF || SUBNETS.length === 0 || !SECURITY_GROUP || !SESSIONS_TABLE) {
    console.error('lambda.env.missing', { CLUSTER: !!CLUSTER, TASK_DEF: !!TASK_DEF, SUBNETS: SUBNETS.length, SECURITY_GROUP: !!SECURITY_GROUP, SESSIONS_TABLE: !!SESSIONS_TABLE });
    return { batchItemFailures: event.Records?.map(r => ({ itemIdentifier: r.messageId })) || [] };
  }

  const failures = [];
  for (const r of event.Records || []) {
    let job;
    try { job = JSON.parse(r.body); } catch { failures.push({ itemIdentifier: r.messageId }); continue; }
    const userId = job.userId || job.USER_ID;
    const type = job.type || 'send';

    // try to acquire lock to avoid concurrent sends per user
    try {
      const now = Math.floor(Date.now() / 1000);
      const lockTtl = now + 120;
      await ddb.send(new UpdateItemCommand({
        TableName: SESSIONS_TABLE,
        Key: { userId: { S: String(userId) } },
        UpdateExpression: 'SET isSending = :true, lockExpiry = :exp',
        ConditionExpression: 'attribute_not_exists(isSending) OR isSending = :false OR lockExpiry < :now',
        ExpressionAttributeValues: {
          ':true': { BOOL: true }, ':false': { BOOL: false }, ':now': { N: String(now) }, ':exp': { N: String(lockTtl) }
        }
      }));
    } catch (e) {
      failures.push({ itemIdentifier: r.messageId });
      continue;
    }

    try {
      const baseEnv = COMMON_ENV(userId);
      if (type === 'login') {
        const env = [
          { name: 'ACTION', value: 'login' },
          { name: 'OF_LOGIN_SECRET_NAME', value: `of/creds/${userId}` },
          ...baseEnv
        ];
        await ecs.send(new RunTaskCommand({
          cluster: CLUSTER,
          taskDefinition: TASK_DEF,
          count: 1,
          launchType: 'FARGATE',
          networkConfiguration: { awsvpcConfiguration: { assignPublicIp: 'DISABLED', subnets: SUBNETS, securityGroups: [SECURITY_GROUP] } },
          overrides: { containerOverrides: [{ name: 'of-browser-worker', environment: env }] }
        }));
      } else {
        const text = job.content?.text || job.message || '';
        const env = [
          { name: 'ACTION', value: 'send' },
          { name: 'CONVERSATION_ID', value: String(job.conversationId || '') },
          { name: 'CONTENT_TEXT', value: String(text) },
          ...baseEnv
        ];
        if (job.ppv && typeof job.ppv.priceCents === 'number') {
          env.push(
            { name: 'PPV_PRICE_CENTS', value: String(job.ppv.priceCents) },
            ...job.ppv.variant ? [{ name: 'PPV_VARIANT', value: String(job.ppv.variant) }] : [],
            ...job.ppv.mediaUrl ? [{ name: 'PPV_MEDIA_URL', value: String(job.ppv.mediaUrl) }] : []
          );
        }
        await ecs.send(new RunTaskCommand({
          cluster: CLUSTER,
          taskDefinition: TASK_DEF,
          count: 1,
          launchType: 'FARGATE',
          networkConfiguration: { awsvpcConfiguration: { assignPublicIp: 'DISABLED', subnets: SUBNETS, securityGroups: [SECURITY_GROUP] } },
          overrides: { containerOverrides: [{ name: 'of-browser-worker', environment: env }] }
        }));
      }
    } catch (e) {
      console.error('runTask.error', e?.message || e);
      failures.push({ itemIdentifier: r.messageId });
    } finally {
      try {
        await ddb.send(new UpdateItemCommand({ TableName: SESSIONS_TABLE, Key: { userId: { S: String(job.userId) } }, UpdateExpression: 'REMOVE isSending, lockExpiry' }));
      } catch {}
    }
  }
  return { batchItemFailures: failures };
};
