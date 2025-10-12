#!/usr/bin/env node
/*
  Simple ECS RunTask load launcher for the OF Browser Worker.

  Env vars:
    CLUSTER_ARN        - ECS cluster ARN
    TASK_DEF_ARN       - Task definition ARN
    SUBNETS            - comma-separated private subnet IDs
    SECURITY_GROUP     - security group ID for tasks
    COUNT              - total tasks to launch (default 1)
    CONCURRENCY        - max concurrent launches (default 5)
    ACTION             - login|inbox|send (default login)
    USER_IDS           - comma-separated userIds (used for ACTION=login)
    CONVERSATION_ID    - for ACTION=send
    CONTENT_TEXT       - for ACTION=send

  Example:
    USER_IDS="u1,u2,u3" COUNT=3 ACTION=login \
    CLUSTER_ARN=arn:aws:ecs:... TASK_DEF_ARN=arn:aws:ecs:... \
    SUBNETS=subnet-aaa,subnet-bbb SECURITY_GROUP=sg-123 \
    node scripts/of-load-test.js
*/

const { ECSClient, RunTaskCommand } = require('@aws-sdk/client-ecs');
const fs = require('fs');
const path = require('path');

const ecs = new ECSClient({});

function envPair(name, value) {
  return value == null ? null : { name, value: String(value) };
}

async function runOne({ cluster, taskDef, subnets, securityGroup, action, userId, conversationId, contentText }) {
  const common = [
    envPair('OF_DDB_SESSIONS_TABLE', process.env.OF_DDB_SESSIONS_TABLE),
    envPair('OF_DDB_MESSAGES_TABLE', process.env.OF_DDB_MESSAGES_TABLE),
    envPair('OF_DDB_THREADS_TABLE', process.env.OF_DDB_THREADS_TABLE),
    envPair('OF_KMS_KEY_ID', process.env.OF_KMS_KEY_ID),
    envPair('APP_ORIGIN', process.env.APP_ORIGIN || process.env.NEXT_PUBLIC_APP_URL),
    envPair('WORKER_TOKEN', process.env.WORKER_TOKEN || process.env.OF_WORKER_TOKEN),
    envPair('TRACE_S3_BUCKET', process.env.TRACE_S3_BUCKET),
    envPair('TRACE_S3_PREFIX', process.env.TRACE_S3_PREFIX),
    envPair('TRACE_KMS_KEY', process.env.TRACE_KMS_KEY),
  ].filter(Boolean);

  const env = [envPair('ACTION', action), ...common];
  if (action === 'login') {
    env.push(envPair('USER_ID', userId));
    env.push(envPair('OF_CREDS_SECRET_ID', `of/creds/${userId}`));
  } else if (action === 'send') {
    env.push(envPair('USER_ID', userId));
    env.push(envPair('CONVERSATION_ID', conversationId));
    env.push(envPair('CONTENT_TEXT', contentText));
  }

  const cmd = new RunTaskCommand({
    cluster,
    taskDefinition: taskDef,
    count: 1,
    launchType: 'FARGATE',
    networkConfiguration: {
      awsvpcConfiguration: { assignPublicIp: 'DISABLED', subnets, securityGroups: [securityGroup] },
    },
    overrides: {
      containerOverrides: [{ name: 'of-browser-worker', environment: env }],
    },
  });
  const out = await ecs.send(cmd);
  const arn = out.tasks?.[0]?.taskArn || 'unknown-task';
  console.log(JSON.stringify({ started: arn, userId, action }));
}

function parseArgs(argv) {
  const out = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const k = a.replace(/^--/, '');
      const v = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : '1';
      out[k] = v;
    }
  }
  return out;
}

async function main() {
  const args = parseArgs(process.argv);
  const cluster = args.cluster || process.env.CLUSTER_ARN;
  const taskDef = args['task-def'] || process.env.TASK_DEF_ARN;
  const subnets = (args.subnets || process.env.SUBNETS || '').split(',').filter(Boolean);
  const securityGroup = args['security-group'] || process.env.SECURITY_GROUP;
  if (!cluster || !taskDef || subnets.length === 0 || !securityGroup) {
    console.error('Missing required env: CLUSTER_ARN, TASK_DEF_ARN, SUBNETS, SECURITY_GROUP');
    process.exit(1);
  }
  const action = (args.action || process.env.ACTION || 'login').toLowerCase();
  const count = Number(args.count || process.env.COUNT || '1');
  const concurrency = Number(args.concurrency || process.env.CONCURRENCY || '5');
  const userIds = (args['user-ids'] || process.env.USER_IDS || '').split(',').filter(Boolean);
  const conversationId = args['conversation-id'] || process.env.CONVERSATION_ID || '';
  const contentText = args['content-text'] || process.env.CONTENT_TEXT || '';

  const jobs = [];
  if (action === 'login') {
    if (userIds.length < count) {
      console.error('Provide USER_IDS (comma) with at least COUNT userIds for ACTION=login');
      process.exit(1);
    }
    for (let i = 0; i < count; i++) {
      jobs.push({ userId: userIds[i] });
    }
  } else if (action === 'send') {
    if (!conversationId || !contentText) {
      console.error('CONVERSATION_ID and CONTENT_TEXT are required for ACTION=send');
      process.exit(1);
    }
    const uid = userIds[0] || process.env.USER_ID || '';
    if (!uid) {
      console.error('Provide USER_ID or USER_IDS[0] for ACTION=send');
      process.exit(1);
    }
    for (let i = 0; i < count; i++) jobs.push({ userId: uid });
  } else if (action === 'inbox') {
    const uid = userIds[0] || process.env.USER_ID || '';
    if (!uid) {
      console.error('Provide USER_ID or USER_IDS[0] for ACTION=inbox');
      process.exit(1);
    }
    for (let i = 0; i < count; i++) jobs.push({ userId: uid });
  }

  let inFlight = 0;
  let idx = 0;
  const started = [];
  await new Promise((resolve) => {
    const pump = () => {
      while (inFlight < concurrency && idx < jobs.length) {
        const job = jobs[idx++];
        inFlight++;
        runOne({ cluster, taskDef, subnets, securityGroup, action, userId: job.userId, conversationId, contentText })
          .then((r) => { started.push({ userId: job.userId }); })
          .catch((e) => console.error(JSON.stringify({ error: e?.message || String(e) })))
          .finally(() => {
            inFlight--;
            if (idx >= jobs.length && inFlight === 0) resolve(null);
            else setImmediate(pump);
          });
      }
    };
    pump();
  });

  try {
    const outDir = path.join(process.cwd(), 'reports');
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, 'report.json'), JSON.stringify({ action, count, concurrency, started }, null, 2));
    console.log('Wrote reports/report.json');
  } catch (e) {
    console.error('Failed to write report:', e.message || e);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
