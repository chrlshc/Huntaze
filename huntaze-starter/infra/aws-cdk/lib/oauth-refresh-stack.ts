import * as cdk from 'aws-cdk-lib'
import { Construct } from 'constructs'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as events from 'aws-cdk-lib/aws-events'
import * as targets from 'aws-cdk-lib/aws-events-targets'
import * as sqs from 'aws-cdk-lib/aws-sqs'
import * as iam from 'aws-cdk-lib/aws-iam'

export class OAuthRefreshStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    const dlq = new sqs.Queue(this, 'OAuthRefreshDLQ', {
      retentionPeriod: cdk.Duration.days(14),
    })

    const fn = new lambda.Function(this, 'RefreshOAuthTokensFn', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('../../lambda/refresh-oauth-tokens'),
      timeout: cdk.Duration.seconds(30),
      environment: {
        TOKENS_TABLE: process.env.TOKENS_TABLE || 'huntaze-oauth-tokens',
        ANALYTICS_TABLE: process.env.ANALYTICS_TABLE || 'huntaze-analytics-events',
        REDDIT_USER_AGENT: process.env.REDDIT_USER_AGENT || 'Huntaze:v1.0.0',
        TIKTOK_CLIENT_KEY: process.env.TIKTOK_CLIENT_KEY || '',
        TIKTOK_CLIENT_SECRET: process.env.TIKTOK_CLIENT_SECRET || '',
        REDDIT_CLIENT_ID: process.env.REDDIT_CLIENT_ID || '',
        REDDIT_CLIENT_SECRET: process.env.REDDIT_CLIENT_SECRET || '',
      },
    })

    // Allow Lambda to read/write tokens + analytics
    fn.addToRolePolicy(new iam.PolicyStatement({
      actions: ['dynamodb:Scan', 'dynamodb:UpdateItem', 'dynamodb:PutItem'],
      resources: ['*'],
    }))

    // EventBridge rules
    // TikTok + Reddit: rate(15 minutes)
    new events.Rule(this, 'TikTokRedditRefreshRule', {
      schedule: events.Schedule.rate(cdk.Duration.minutes(15)),
      targets: [new targets.LambdaFunction(fn, { deadLetterQueue: dlq })],
    })

    // Instagram: cron(0 9 */3 * ? *) UTC (every 3 days at 09:00)
    new events.Rule(this, 'InstagramRefreshRule', {
      schedule: events.Schedule.cron({ minute: '0', hour: '9', day: '*/3' }),
      targets: [new targets.LambdaFunction(fn, { deadLetterQueue: dlq })],
    })

    // Basic CloudWatch Alarms would be added here (Errors/Throttles)

    // --- Scheduler Consumer (no OF auto-post) ---
    const scheduleFn = new lambda.Function(this, 'ScheduleConsumerFn', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('../../lambda/schedule-consumer'),
      timeout: cdk.Duration.seconds(30),
      environment: {
        ANALYTICS_TABLE: process.env.ANALYTICS_TABLE || 'huntaze-analytics-events',
        SQS_PUBLISHER_INSTAGRAM_URL: process.env.SQS_PUBLISHER_INSTAGRAM_URL || '',
        SQS_PUBLISHER_TIKTOK_URL: process.env.SQS_PUBLISHER_TIKTOK_URL || '',
        SQS_PUBLISHER_REDDIT_URL: process.env.SQS_PUBLISHER_REDDIT_URL || '',
      },
    })
    scheduleFn.addToRolePolicy(new iam.PolicyStatement({
      actions: ['dynamodb:Scan', 'dynamodb:UpdateItem', 'dynamodb:PutItem'],
      resources: ['*'],
    }))
    scheduleFn.addToRolePolicy(new iam.PolicyStatement({
      actions: ['sqs:SendMessage'],
      resources: ['*'],
    }))

    new events.Rule(this, 'ScheduleConsumerRule', {
      schedule: events.Schedule.rate(cdk.Duration.minutes(1)),
      targets: [new targets.LambdaFunction(scheduleFn, { deadLetterQueue: dlq })],
    })
  }
}
