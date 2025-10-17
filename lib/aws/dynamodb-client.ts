import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, UpdateCommand, DeleteCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';

// Initialize DynamoDB client
const client = new DynamoDBClient({
  region: process.env.AWS_REGION || process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1',
  ...(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
    ? {
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
      }
    : {}),
});

// Create DynamoDB Document client for easier usage
export const dynamodb = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true,
    convertClassInstanceToMap: true,
  },
});

// Helper functions for common operations
export const dynamoHelpers = {
  async putItem(tableName: string, item: any) {
    const command = new PutCommand({
      TableName: tableName,
      Item: item,
    });
    return await dynamodb.send(command);
  },

  async getItem(tableName: string, key: any) {
    const command = new GetCommand({
      TableName: tableName,
      Key: key,
    });
    const response = await dynamodb.send(command);
    return response.Item;
  },

  async query(tableName: string, keyCondition: string, expressionValues: any, indexName?: string) {
    const command = new QueryCommand({
      TableName: tableName,
      KeyConditionExpression: keyCondition,
      ExpressionAttributeValues: expressionValues,
      ...(indexName && { IndexName: indexName }),
    });
    const response = await dynamodb.send(command);
    return response.Items || [];
  },

  async updateItem(tableName: string, key: any, updates: any) {
    const updateExpressions: string[] = [];
    const expressionValues: any = {};
    const expressionNames: any = {};

    Object.entries(updates).forEach(([field, value], index) => {
      const placeholder = `:val${index}`;
      const namePlaceholder = `#field${index}`;
      updateExpressions.push(`${namePlaceholder} = ${placeholder}`);
      expressionValues[placeholder] = value;
      expressionNames[namePlaceholder] = field;
    });

    const command = new UpdateCommand({
      TableName: tableName,
      Key: key,
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeValues: expressionValues,
      ExpressionAttributeNames: expressionNames,
      ReturnValues: 'ALL_NEW',
    });

    const response = await dynamodb.send(command);
    return response.Attributes;
  },

  async deleteItem(tableName: string, key: any) {
    const command = new DeleteCommand({
      TableName: tableName,
      Key: key,
    });
    return await dynamodb.send(command);
  },

  async scan(tableName: string, filterExpression?: string, expressionValues?: any) {
    const command = new ScanCommand({
      TableName: tableName,
      ...(filterExpression && { FilterExpression: filterExpression }),
      ...(expressionValues && { ExpressionAttributeValues: expressionValues }),
    });
    const response = await dynamodb.send(command);
    return response.Items || [];
  }
};

// Table names
export const TABLES = {
  ANALYTICS: 'huntaze-analytics',
  SESSIONS: 'huntaze-sessions',
  AI_CACHE: 'huntaze-ai-cache',
  USER_METRICS: 'huntaze-user-metrics',
  CONTENT_PERFORMANCE: 'huntaze-content-performance',
  WEBHOOKS: 'huntaze-webhooks',
  AUDIT_LOGS: 'huntaze-audit-logs'
} as const;
