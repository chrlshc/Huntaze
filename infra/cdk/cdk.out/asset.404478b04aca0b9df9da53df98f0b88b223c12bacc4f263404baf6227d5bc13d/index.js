"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// ../lambda/send-worker/index.ts
var send_worker_exports = {};
__export(send_worker_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(send_worker_exports);
var import_client_ecs = require("@aws-sdk/client-ecs");
var import_client_dynamodb = require("@aws-sdk/client-dynamodb");
var ecs = new import_client_ecs.ECSClient({});
var ddb = new import_client_dynamodb.DynamoDBClient({});
var CLUSTER = process.env.OF_ECS_CLUSTER_ARN;
var TASK_DEF = process.env.OF_ECS_TASKDEF_ARN;
var SUBNETS = process.env.OF_VPC_SUBNETS.split(",");
var SECURITY_GROUP = process.env.OF_TASK_SG_ID;
var SESSIONS_TABLE = process.env.OF_DDB_SESSIONS_TABLE;
var MESSAGES_TABLE = process.env.OF_DDB_MESSAGES_TABLE;
var KMS_KEY_ID = process.env.OF_KMS_KEY_ID;
var COMMON_ENV = {
  OF_DDB_SESSIONS_TABLE: SESSIONS_TABLE,
  OF_DDB_MESSAGES_TABLE: MESSAGES_TABLE,
  OF_KMS_KEY_ID: KMS_KEY_ID
};
var handler = async (event) => {
  const globalCfg = await ddb.send(new import_client_dynamodb.GetItemCommand({
    TableName: SESSIONS_TABLE,
    Key: { userId: { S: "GLOBAL_SETTINGS" } }
  }));
  const pauseAll = globalCfg.Item?.pauseAll?.BOOL === true;
  if (pauseAll) {
    return { batchItemFailures: event.Records.map((r) => ({ itemIdentifier: r.messageId })) };
  }
  const failures = [];
  for (const r of event.Records) {
    const job = JSON.parse(r.body);
    const now = Math.floor(Date.now() / 1e3);
    const lockTtl = now + 120;
    try {
      await ddb.send(
        new import_client_dynamodb.UpdateItemCommand({
          TableName: SESSIONS_TABLE,
          Key: { userId: { S: job.userId } },
          UpdateExpression: "SET isSending = :true, lockExpiry = :exp",
          ConditionExpression: "attribute_not_exists(isSending) OR isSending = :false OR lockExpiry < :now",
          ExpressionAttributeValues: {
            ":true": { BOOL: true },
            ":false": { BOOL: false },
            ":now": { N: String(now) },
            ":exp": { N: String(lockTtl) }
          }
        })
      );
    } catch {
      failures.push({ itemIdentifier: r.messageId });
      continue;
    }
    try {
      const baseEnv = [
        { name: "USER_ID", value: job.userId },
        ...Object.entries(COMMON_ENV).map(([name, value]) => ({ name, value }))
      ];
      if (job.type === "login") {
        await ecs.send(new import_client_ecs.RunTaskCommand({
          cluster: CLUSTER,
          taskDefinition: TASK_DEF,
          count: 1,
          launchType: "FARGATE",
          networkConfiguration: {
            awsvpcConfiguration: {
              assignPublicIp: "DISABLED",
              subnets: SUBNETS,
              securityGroups: [SECURITY_GROUP]
            }
          },
          overrides: {
            containerOverrides: [
              {
                name: "of-browser-worker",
                environment: [
                  { name: "ACTION", value: "login" },
                  { name: "OF_CREDS_SECRET_ID", value: `of/creds/${job.userId}` },
                  ...job.otp ? [{ name: "OTP_CODE", value: job.otp }] : [],
                  ...baseEnv
                ]
              }
            ]
          }
        }));
      } else {
        const s = job;
        await ecs.send(new import_client_ecs.RunTaskCommand({
          cluster: CLUSTER,
          taskDefinition: TASK_DEF,
          count: 1,
          launchType: "FARGATE",
          networkConfiguration: {
            awsvpcConfiguration: {
              assignPublicIp: "DISABLED",
              subnets: SUBNETS,
              securityGroups: [SECURITY_GROUP]
            }
          },
          overrides: {
            containerOverrides: [
              {
                name: "of-browser-worker",
                environment: [
                  { name: "ACTION", value: "send" },
                  { name: "CONVERSATION_ID", value: s.conversationId },
                  { name: "CONTENT_TEXT", value: s.content.text },
                  ...baseEnv
                ]
              }
            ]
          }
        }));
      }
    } catch {
      failures.push({ itemIdentifier: r.messageId });
    } finally {
      await ddb.send(
        new import_client_dynamodb.UpdateItemCommand({
          TableName: SESSIONS_TABLE,
          Key: { userId: { S: job.userId } },
          UpdateExpression: "REMOVE isSending, lockExpiry"
        })
      );
    }
  }
  return { batchItemFailures: failures };
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
