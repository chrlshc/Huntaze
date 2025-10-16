import { SQSEvent, SQSBatchResponse } from 'aws-lambda';
import { ECSClient, RunTaskCommand } from '@aws-sdk/client-ecs';
import { DynamoDBClient, GetItemCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb';

const ecs = new ECSClient({});
const ddb = new DynamoDBClient({});
const CLUSTER = process.env.OF_ECS_CLUSTER_ARN!;
const TASK_DEF = process.env.OF_ECS_TASKDEF_ARN!;
const SUBNETS = process.env.OF_VPC_SUBNETS!.split(',');
const SECURITY_GROUP = process.env.OF_TASK_SG_ID!;

const SESSIONS_TABLE = process.env.OF_DDB_SESSIONS_TABLE!;
const MESSAGES_TABLE = process.env.OF_DDB_MESSAGES_TABLE!;
const KMS_KEY_ID = process.env.OF_KMS_KEY_ID!;
const TRACE_S3_BUCKET = process.env.TRACE_S3_BUCKET || '';
const TRACE_S3_PREFIX = process.env.TRACE_S3_PREFIX || '';
const TRACE_KMS_KEY = process.env.TRACE_KMS_KEY || '';

const COMMON_ENV = {
  OF_DDB_SESSIONS_TABLE: SESSIONS_TABLE,
  OF_DDB_MESSAGES_TABLE: MESSAGES_TABLE,
  OF_KMS_KEY_ID: KMS_KEY_ID,
  APP_ORIGIN: process.env.APP_ORIGIN || process.env.NEXT_PUBLIC_APP_URL || '',
  WORKER_TOKEN: process.env.WORKER_TOKEN || process.env.OF_WORKER_TOKEN || '',
  ...(TRACE_S3_BUCKET ? { TRACE_S3_BUCKET } : {}),
  ...(TRACE_S3_PREFIX ? { TRACE_S3_PREFIX } : {}),
  ...(TRACE_KMS_KEY ? { TRACE_KMS_KEY } : {}),
};

type SendJob = { type?: 'send'; id: string; userId: string; conversationId: string; content: { text: string }; ppv?: { priceCents: number; caption?: string; mediaUrl?: string; variant?: 'A'|'B'|'C' } };
type LoginJob = { type: 'login'; userId: string; otp?: string };

export const handler = async (event: SQSEvent): Promise<SQSBatchResponse> => {
  // Kill-switch global
  const globalCfg = await ddb.send(new GetItemCommand({
    TableName: SESSIONS_TABLE,
    Key: { userId: { S: 'GLOBAL_SETTINGS' } },
  }));
  const pauseAll = globalCfg.Item?.pauseAll?.BOOL === true;
  if (pauseAll) {
    return { batchItemFailures: event.Records.map((r) => ({ itemIdentifier: r.messageId })) };
  }

  const failures: { itemIdentifier: string }[] = [];

  for (const r of event.Records) {
    const job = JSON.parse(r.body) as SendJob | LoginJob;

    const now = Math.floor(Date.now() / 1000);
    const lockTtl = now + 120;

    // Acquire mutex
    try {
      await ddb.send(
        new UpdateItemCommand({
          TableName: SESSIONS_TABLE,
          Key: { userId: { S: job.userId } },
          UpdateExpression: 'SET isSending = :true, lockExpiry = :exp',
          ConditionExpression: 'attribute_not_exists(isSending) OR isSending = :false OR lockExpiry < :now',
          ExpressionAttributeValues: {
            ':true': { BOOL: true },
            ':false': { BOOL: false },
            ':now': { N: String(now) },
            ':exp': { N: String(lockTtl) },
          },
        }),
      );
    } catch {
      failures.push({ itemIdentifier: r.messageId });
      continue;
    }

    try {
      const baseEnv = [
        { name: 'USER_ID', value: job.userId },
        { name: 'JOB_ID', value: (job as any).id || '' },
        ...Object.entries(COMMON_ENV).map(([name, value]) => ({ name, value })) as any,
      ];

      if ((job as LoginJob).type === 'login') {
        await ecs.send(new RunTaskCommand({
          cluster: CLUSTER,
          taskDefinition: TASK_DEF,
          count: 1,
          launchType: 'FARGATE',
          networkConfiguration: {
            awsvpcConfiguration: {
              assignPublicIp: 'ENABLED',
              subnets: SUBNETS,
              securityGroups: [SECURITY_GROUP],
            },
          },
          overrides: {
            containerOverrides: [
              {
                name: 'of-browser-worker',
                environment: [
                  { name: 'ACTION', value: 'login' },
                  { name: 'OF_CREDS_SECRET_ID', value: `of/creds/${job.userId}` },
                  ...((job as LoginJob).otp ? [{ name: 'OTP_CODE', value: (job as LoginJob).otp! }] : []),
                  ...baseEnv,
                ],
              },
            ],
          },
        }));
      } else {
        const s = job as SendJob;
        await ecs.send(new RunTaskCommand({
          cluster: CLUSTER,
          taskDefinition: TASK_DEF,
          count: 1,
          launchType: 'FARGATE',
          networkConfiguration: {
            awsvpcConfiguration: {
              assignPublicIp: 'ENABLED',
              subnets: SUBNETS,
              securityGroups: [SECURITY_GROUP],
            },
          },
          overrides: {
            containerOverrides: [
              {
                name: 'of-browser-worker',
                environment: [
                  { name: 'ACTION', value: 'send' },
                  { name: 'CONVERSATION_ID', value: s.conversationId },
                  { name: 'CONTENT_TEXT', value: s.content.text },
                  // PPV fields (optional)
                  ...(
                    s.ppv
                      ? [
                          { name: 'PPV_PRICE_CENTS', value: String(s.ppv.priceCents) },
                          ...(s.ppv.caption ? [{ name: 'PPV_CAPTION', value: s.ppv.caption }] : []),
                          ...(s.ppv.mediaUrl ? [{ name: 'PPV_MEDIA_URL', value: s.ppv.mediaUrl }] : []),
                          ...(s.ppv.variant ? [{ name: 'PPV_VARIANT', value: String(s.ppv.variant) }] : []),
                        ]
                      : []
                  ),
                  ...baseEnv,
                ],
              },
            ],
          },
        }));
      }
    } catch {
      failures.push({ itemIdentifier: r.messageId });
    } finally {
      await ddb.send(
        new UpdateItemCommand({
          TableName: SESSIONS_TABLE,
          Key: { userId: { S: job.userId } },
          UpdateExpression: 'REMOVE isSending, lockExpiry',
        }),
      );
    }
  }

  return { batchItemFailures: failures };
};
