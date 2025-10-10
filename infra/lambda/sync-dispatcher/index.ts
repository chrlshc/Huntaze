import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb';
import { ECSClient, RunTaskCommand } from '@aws-sdk/client-ecs';

const ddb = new DynamoDBClient({});
const ecs = new ECSClient({});

const TABLE_SESSIONS = process.env.OF_DDB_SESSIONS_TABLE!;
const CLUSTER = process.env.OF_ECS_CLUSTER_ARN!;
const TASK_DEF = process.env.OF_ECS_TASKDEF_ARN!;
const SUBNETS = process.env.OF_VPC_SUBNETS!.split(',');
const SECURITY_GROUP = process.env.OF_TASK_SG_ID!;

const COMMON_ENV = {
  OF_DDB_SESSIONS_TABLE: process.env.OF_DDB_SESSIONS_TABLE!,
  OF_DDB_MESSAGES_TABLE: process.env.OF_DDB_MESSAGES_TABLE!,
  OF_KMS_KEY_ID: process.env.OF_KMS_KEY_ID!,
};

export const handler = async () => {
  const sessions = await ddb.send(new ScanCommand({ TableName: TABLE_SESSIONS, Limit: 200 }));
  const users = (sessions.Items || []).map(i => i.userId?.S).filter(Boolean) as string[];

  for (const userId of users) {
    await ecs.send(new RunTaskCommand({
      cluster: CLUSTER,
      taskDefinition: TASK_DEF,
      count: 1,
      launchType: 'FARGATE',
      networkConfiguration: {
        awsvpcConfiguration: {
          assignPublicIp: 'DISABLED',
          subnets: SUBNETS,
          securityGroups: [SECURITY_GROUP],
        }
      },
      overrides: {
        containerOverrides: [{
          name: 'of-browser-worker',
          environment: [
            { name: 'ACTION', value: 'inbox' },
            { name: 'USER_ID', value: userId },
            ...Object.entries(COMMON_ENV).map(([name, value]) => ({ name, value })) as any
          ]
        }]
      }
    }));
  }
};

