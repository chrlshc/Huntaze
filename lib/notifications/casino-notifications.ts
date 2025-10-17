import { SNSClient, PublishCommand, SubscribeCommand, CreateTopicCommand } from '@aws-sdk/client-sns';
import { DynamoDBClient, PutItemCommand, QueryCommand } from '@aws-sdk/client-dynamodb';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';

const sns = new SNSClient({ region: process.env.AWS_REGION || 'us-east-1' });
const dynamodb = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const sqs = new SQSClient({ region: process.env.AWS_REGION || 'us-east-1' });

// Topics for different notification types
const TOPICS = {
  newFan: process.env.SNS_TOPIC_NEW_FAN || '',
  newMessage: process.env.SNS_TOPIC_NEW_MESSAGE || '',
  newTip: process.env.SNS_TOPIC_NEW_TIP || '',
  milestone: process.env.SNS_TOPIC_MILESTONE || ''
};

// Queue for delayed notifications
const NOTIFICATION_QUEUE = process.env.SQS_NOTIFICATION_QUEUE || '';

export interface CasinoNotification {
  type: 'new_fan' | 'new_message' | 'new_tip' | 'milestone' | 'engagement';
  title: string;
  message: string;
  data: Record<string, any>;
  delay?: number; // Seconds to delay
  priority: 'high' | 'medium' | 'low';
}

/**
 * Casino-style notification patterns
 */
const NOTIFICATION_PATTERNS = {
  new_fan: [
    '🎉 {name} just subscribed!',
    '💎 New VIP fan: {name}',
    '🔥 {name} is your newest admirer!',
    '✨ Welcome {name} to your exclusive club!'
  ],
  new_message: [
    '💬 {name} sent you a message',
    '📨 New message from {name}',
    '💕 {name} wants to chat!',
    '🔔 {name} is waiting for your reply'
  ],
  new_tip: [
    '💰 {name} just tipped ${amount}!',
    '🤑 ${amount} tip from {name}!',
    '💸 Cha-ching! ${amount} from {name}',
    '💎 {name} spoiled you with ${amount}!'
  ],
  milestone: [
    '🏆 You hit {milestone} fans!',
    '🎯 Achievement unlocked: {milestone}',
    '🚀 Incredible! {milestone} reached!',
    '👑 New record: {milestone}!'
  ]
};

/**
 * Send immediate notification
 */
export async function sendNotification(notification: CasinoNotification) {
  try {
    // Get topic ARN based on notification type
    const topicArn = TOPICS[notification.type] || TOPICS.newMessage;
    
    if (!topicArn) {
      console.warn('No SNS topic configured for notification type:', notification.type);
      return;
    }

    // Add randomization for casino effect
    const pattern = getRandomPattern(notification.type);
    const formattedMessage = formatMessage(pattern, notification.data);

    const command = new PublishCommand({
      TopicArn: topicArn,
      Message: JSON.stringify({
        default: formattedMessage,
        title: notification.title,
        data: notification.data,
        timestamp: new Date().toISOString()
      }),
      MessageStructure: 'json',
      MessageAttributes: {
        priority: {
          DataType: 'String',
          StringValue: notification.priority
        },
        type: {
          DataType: 'String',
          StringValue: notification.type
        }
      }
    });

    await sns.send(command);
    
    // Track notification
    await trackNotification(notification);
    
  } catch (error) {
    console.error('Failed to send notification:', error);
  }
}

/**
 * Schedule delayed notification (drip effect)
 */
export async function scheduleNotification(
  notification: CasinoNotification,
  delaySeconds: number
) {
  if (!NOTIFICATION_QUEUE) {
    console.warn('No SQS queue configured for delayed notifications');
    return;
  }

  try {
    const command = new SendMessageCommand({
      QueueUrl: NOTIFICATION_QUEUE,
      MessageBody: JSON.stringify(notification),
      DelaySeconds: Math.min(delaySeconds, 900), // Max 15 minutes
      MessageAttributes: {
        type: {
          DataType: 'String',
          StringValue: notification.type
        },
        scheduledFor: {
          DataType: 'String',
          StringValue: new Date(Date.now() + delaySeconds * 1000).toISOString()
        }
      }
    });

    await sqs.send(command);
  } catch (error) {
    console.error('Failed to schedule notification:', error);
  }
}

/**
 * Create drip notification campaign
 */
export async function createDripCampaign(
  userId: string,
  campaignType: 'welcome' | 'reengagement' | 'upsell'
) {
  const campaigns = {
    welcome: [
      { delay: 0, type: 'milestone', data: { milestone: 'Welcome!' } },
      { delay: 300, type: 'engagement', data: { message: 'Check out exclusive content' } },
      { delay: 3600, type: 'engagement', data: { message: '50% off your first purchase' } }
    ],
    reengagement: [
      { delay: 0, type: 'engagement', data: { message: 'We miss you!' } },
      { delay: 86400, type: 'engagement', data: { message: 'Come back for 20% off' } },
      { delay: 259200, type: 'engagement', data: { message: 'Last chance for exclusive content' } }
    ],
    upsell: [
      { delay: 0, type: 'engagement', data: { message: 'You unlocked VIP access!' } },
      { delay: 1800, type: 'engagement', data: { message: 'Exclusive bundle just for you' } }
    ]
  };

  const campaign = campaigns[campaignType];
  if (!campaign) return;

  for (const step of campaign) {
    await scheduleNotification({
      type: step.type as any,
      title: `${campaignType} Campaign`,
      message: step.data.message || '',
      data: { ...step.data, userId },
      priority: 'medium'
    }, step.delay);
  }
}

/**
 * Batch send notifications with casino timing
 */
export async function batchSendWithCasinoEffect(
  notifications: CasinoNotification[],
  spacingMs = 2000 // 2 seconds between notifications
) {
  for (let i = 0; i < notifications.length; i++) {
    const delay = i * spacingMs / 1000; // Convert to seconds
    await scheduleNotification(notifications[i], delay);
  }
}

/**
 * Track notification metrics
 */
async function trackNotification(notification: CasinoNotification) {
  try {
    await dynamodb.send(new PutItemCommand({
      TableName: 'NotificationMetrics',
      Item: {
        notificationId: { S: `${Date.now()}-${Math.random()}` },
        type: { S: notification.type },
        timestamp: { N: Date.now().toString() },
        priority: { S: notification.priority },
        data: { S: JSON.stringify(notification.data) }
      }
    }));
  } catch (error) {
    console.error('Failed to track notification:', error);
  }
}

/**
 * Get random notification pattern
 */
function getRandomPattern(type: string): string {
  const patterns = NOTIFICATION_PATTERNS[type] || NOTIFICATION_PATTERNS.new_message;
  return patterns[Math.floor(Math.random() * patterns.length)];
}

/**
 * Format message with data
 */
function formatMessage(pattern: string, data: Record<string, any>): string {
  return pattern.replace(/{(\w+)}/g, (match, key) => {
    return data[key] || match;
  });
}

/**
 * Subscribe to notifications
 */
export async function subscribeToNotifications(
  endpoint: string,
  protocol: 'email' | 'sms' | 'application',
  notificationTypes: Array<keyof typeof TOPICS>
) {
  const subscriptions = [];
  
  for (const type of notificationTypes) {
    const topicArn = TOPICS[type];
    if (!topicArn) continue;

    try {
      const command = new SubscribeCommand({
        TopicArn: topicArn,
        Protocol: protocol,
        Endpoint: endpoint,
        Attributes: {
          FilterPolicy: JSON.stringify({
            priority: ['high', 'medium']
          })
        }
      });

      const result = await sns.send(command);
      subscriptions.push({
        type,
        subscriptionArn: result.SubscriptionArn
      });
    } catch (error) {
      console.error(`Failed to subscribe to ${type}:`, error);
    }
  }
  
  return subscriptions;
}

/**
 * Create notification topics (run once during setup)
 */
export async function createNotificationTopics() {
  const topics = ['NewFan', 'NewMessage', 'NewTip', 'Milestone'];
  
  for (const topic of topics) {
    try {
      const command = new CreateTopicCommand({
        Name: `Huntaze-${topic}-${process.env.NODE_ENV || 'development'}`
      });
      
      const result = await sns.send(command);
      console.log(`Created topic ${topic}:`, result.TopicArn);
    } catch (error) {
      console.error(`Failed to create topic ${topic}:`, error);
    }
  }
}