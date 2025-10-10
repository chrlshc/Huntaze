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

// ../lambda/sync-dispatcher/index.ts
var sync_dispatcher_exports = {};
__export(sync_dispatcher_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(sync_dispatcher_exports);
var import_client_dynamodb = require("@aws-sdk/client-dynamodb");
var import_client_ecs = require("@aws-sdk/client-ecs");
var ddb = new import_client_dynamodb.DynamoDBClient({});
var ecs = new import_client_ecs.ECSClient({});
var TABLE_SESSIONS = process.env.OF_DDB_SESSIONS_TABLE;
var CLUSTER = process.env.OF_ECS_CLUSTER_ARN;
var TASK_DEF = process.env.OF_ECS_TASKDEF_ARN;
var SUBNETS = process.env.OF_VPC_SUBNETS.split(",");
var SECURITY_GROUP = process.env.OF_TASK_SG_ID;
var COMMON_ENV = {
  OF_DDB_SESSIONS_TABLE: process.env.OF_DDB_SESSIONS_TABLE,
  OF_DDB_MESSAGES_TABLE: process.env.OF_DDB_MESSAGES_TABLE,
  OF_KMS_KEY_ID: process.env.OF_KMS_KEY_ID
};
var handler = async () => {
  const sessions = await ddb.send(new import_client_dynamodb.ScanCommand({ TableName: TABLE_SESSIONS, Limit: 200 }));
  const users = (sessions.Items || []).map((i) => i.userId?.S).filter(Boolean);
  for (const userId of users) {
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
        containerOverrides: [{
          name: "of-browser-worker",
          environment: [
            { name: "ACTION", value: "inbox" },
            { name: "USER_ID", value: userId },
            ...Object.entries(COMMON_ENV).map(([name, value]) => ({ name, value }))
          ]
        }]
      }
    }));
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
