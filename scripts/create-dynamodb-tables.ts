import { DynamoDBClient, CreateTableCommand, DescribeTableCommand } from '@aws-sdk/client-dynamodb';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1',
  ...(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
    ? {
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
          ...(process.env.AWS_SESSION_TOKEN && { sessionToken: process.env.AWS_SESSION_TOKEN }),
        },
      }
    : {}),
});

const tables = [
  {
    TableName: 'huntaze-onlyfans-sessions',
    KeySchema: [
      { AttributeName: 'sessionId', KeyType: 'HASH' },
      { AttributeName: 'userId', KeyType: 'RANGE' }
    ],
    AttributeDefinitions: [
      { AttributeName: 'sessionId', AttributeType: 'S' },
      { AttributeName: 'userId', AttributeType: 'S' }
    ],
    BillingMode: 'PAY_PER_REQUEST',
    TimeToLiveSpecification: {
      AttributeName: 'ttl',
      Enabled: true
    }
  },
  {
    TableName: 'huntaze-ai-interactions',
    KeySchema: [
      { AttributeName: 'interactionId', KeyType: 'HASH' }
    ],
    AttributeDefinitions: [
      { AttributeName: 'interactionId', AttributeType: 'S' },
      { AttributeName: 'creatorId', AttributeType: 'S' },
      { AttributeName: 'fanId', AttributeType: 'S' },
      { AttributeName: 'timestamp', AttributeType: 'N' }
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'creatorId-timestamp-index',
        KeySchema: [
          { AttributeName: 'creatorId', KeyType: 'HASH' },
          { AttributeName: 'timestamp', KeyType: 'RANGE' }
        ],
        Projection: { ProjectionType: 'ALL' }
      },
      {
        IndexName: 'fanId-timestamp-index',
        KeySchema: [
          { AttributeName: 'fanId', KeyType: 'HASH' },
          { AttributeName: 'timestamp', KeyType: 'RANGE' }
        ],
        Projection: { ProjectionType: 'ALL' }
      }
    ],
    BillingMode: 'PAY_PER_REQUEST'
  },
  {
    TableName: 'huntaze-analytics-events',
    KeySchema: [
      { AttributeName: 'eventId', KeyType: 'HASH' }
    ],
    AttributeDefinitions: [
      { AttributeName: 'eventId', AttributeType: 'S' },
      { AttributeName: 'userId', AttributeType: 'S' },
      { AttributeName: 'timestamp', AttributeType: 'N' }
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'userId-timestamp-index',
        KeySchema: [
          { AttributeName: 'userId', KeyType: 'HASH' },
          { AttributeName: 'timestamp', KeyType: 'RANGE' }
        ],
        Projection: { ProjectionType: 'ALL' }
      }
    ],
    BillingMode: 'PAY_PER_REQUEST',
    TimeToLiveSpecification: {
      AttributeName: 'ttl',
      Enabled: true
    }
  }
];

async function tableExists(tableName: string): Promise<boolean> {
  try {
    await client.send(new DescribeTableCommand({ TableName: tableName }));
    return true;
  } catch (error: any) {
    if (error.name === 'ResourceNotFoundException') {
      return false;
    }
    throw error;
  }
}

async function createTables() {
  console.log('🚀 Creating DynamoDB tables for OnlyFans integration...\n');

  for (const tableDefinition of tables) {
    const { TableName } = tableDefinition;
    
    try {
      const exists = await tableExists(TableName);
      
      if (exists) {
        console.log(`✅ Table ${TableName} already exists`);
        continue;
      }

      console.log(`📦 Creating table ${TableName}...`);
      await client.send(new CreateTableCommand(tableDefinition as any));
      console.log(`✅ Table ${TableName} created successfully`);
      
    } catch (error: any) {
      console.error(`❌ Failed to create table ${TableName}:`, error.message);
      process.exit(1);
    }
  }

  console.log('\n✨ All tables created successfully!');
  console.log('\n📝 Next steps:');
  console.log('1. Copy .env.onlyfans.example to .env.local');
  console.log('2. Fill in your API keys and credentials');
  console.log('3. Run the application with npm run dev');
}

// Execute
createTables().catch(console.error);
