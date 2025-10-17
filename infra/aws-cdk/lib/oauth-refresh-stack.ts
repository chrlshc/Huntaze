import * as cdk from 'aws-cdk-lib'
import { Construct } from 'constructs'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as nodeLambda from 'aws-cdk-lib/aws-lambda-nodejs'
import * as events from 'aws-cdk-lib/aws-events'
import * as targets from 'aws-cdk-lib/aws-events-targets'
import * as sqs from 'aws-cdk-lib/aws-sqs'
import * as cw from 'aws-cdk-lib/aws-cloudwatch'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as path from 'path'

export class OAuthRefreshStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    const stage = this.node.tryGetContext('stage') || process.env.STAGE || 'prod'
    const tableName = process.env.TOKENS_TABLE || 'huntaze-oauth-tokens'

    const fn = new nodeLambda.NodejsFunction(this, 'RefreshOAuthTokensFn', {
      entry: path.join(process.cwd(), 'lambda/refresh-oauth-tokens/index.ts'),
      runtime: lambda.Runtime.NODEJS_20_X,
      timeout: cdk.Duration.minutes(2),
      memorySize: 256,
      // Avoid reserved concurrency on small accounts; rely on natural throttling
      environment: {
        TOKENS_TABLE: tableName,
        JITTER_SECONDS: (process.env.JITTER_SECONDS || '120'),
        TIKTOK_CLIENT_KEY: process.env.TIKTOK_CLIENT_KEY || '',
        TIKTOK_CLIENT_SECRET: process.env.TIKTOK_CLIENT_SECRET || '',
        REDDIT_CLIENT_ID: process.env.REDDIT_CLIENT_ID || '',
        REDDIT_CLIENT_SECRET: process.env.REDDIT_CLIENT_SECRET || '',
        REDDIT_USER_AGENT: process.env.REDDIT_USER_AGENT || 'Huntaze:v1.0.0 (by /u/unknown)'
      },
      bundling: {
        format: nodeLambda.OutputFormat.ESM,
        minify: true,
        sourceMap: false,
      },
    })

    // IAM minimal: DynamoDB table (Query/Scan/Put/Update) + GSI byExpiry
    const tableArn = `arn:aws:dynamodb:${this.region}:${this.account}:table/${tableName}`
    const indexArn = `${tableArn}/index/byExpiry`
    fn.addToRolePolicy(new iam.PolicyStatement({
      actions: [
        'dynamodb:Query',
        'dynamodb:Scan',
        'dynamodb:PutItem',
        'dynamodb:UpdateItem',
        'dynamodb:DescribeTable',
      ],
      resources: [tableArn, indexArn],
    }))

    // Dead-letter queue shared by EventBridge rules
    const dlq = new sqs.Queue(this, `OAuthRefreshDLQ-${stage}`)

    // Rule: rate(15 minutes) for TikTok + Reddit
    const rateRule = new events.Rule(this, `RefreshOAuthRate15m-${stage}`, {
      description: 'Refresh OAuth tokens for TikTok and Reddit every 15 minutes',
      schedule: events.Schedule.rate(cdk.Duration.minutes(15)),
      enabled: true,
    })
    rateRule.addTarget(new targets.LambdaFunction(fn, {
      event: events.RuleTargetInput.fromObject({ providers: ['tiktok', 'reddit'] }),
      deadLetterQueue: dlq,
      retryAttempts: 2,
      maxEventAge: cdk.Duration.hours(2),
    }))

    // Rule: cron for Instagram every 3 days at 09:00 UTC
    const cronRule = new events.Rule(this, `RefreshOAuthIG-${stage}`, {
      description: 'Refresh long-lived Instagram tokens every 3 days',
      schedule: events.Schedule.cron({ minute: '0', hour: '9', day: '*/3' }),
      enabled: true,
    })
    cronRule.addTarget(new targets.LambdaFunction(fn, {
      event: events.RuleTargetInput.fromObject({ providers: ['instagram'] }),
      deadLetterQueue: dlq,
      retryAttempts: 2,
      maxEventAge: cdk.Duration.hours(2),
    }))

    // CloudWatch alarms (Lambda Errors/Throttles)
    new cw.Alarm(this, `RefreshLambdaErrors-${stage}`, {
      alarmDescription: 'Refresh OAuth Lambda errors detected',
      metric: new cw.Metric({
        namespace: 'AWS/Lambda',
        metricName: 'Errors',
        dimensionsMap: { FunctionName: fn.functionName },
        statistic: 'Sum',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 1,
      evaluationPeriods: 1,
      comparisonOperator: cw.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      treatMissingData: cw.TreatMissingData.NOT_BREACHING,
    })
    new cw.Alarm(this, `RefreshLambdaThrottles-${stage}`, {
      alarmDescription: 'Refresh OAuth Lambda throttles detected',
      metric: new cw.Metric({
        namespace: 'AWS/Lambda',
        metricName: 'Throttles',
        dimensionsMap: { FunctionName: fn.functionName },
        statistic: 'Sum',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 1,
      evaluationPeriods: 1,
      comparisonOperator: cw.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      treatMissingData: cw.TreatMissingData.NOT_BREACHING,
    })

    // EventBridge FailedInvocations alarms
    new cw.Alarm(this, `RateRuleFailedInvocations-${stage}`, {
      alarmDescription: 'EventBridge rate rule failed invocations detected',
      metric: new cw.Metric({
        namespace: 'AWS/Events',
        metricName: 'FailedInvocations',
        dimensionsMap: { RuleName: rateRule.ruleName },
        statistic: 'Sum',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 1,
      evaluationPeriods: 1,
      comparisonOperator: cw.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      treatMissingData: cw.TreatMissingData.NOT_BREACHING,
    })
    new cw.Alarm(this, `IGRuleFailedInvocations-${stage}`, {
      alarmDescription: 'EventBridge IG cron rule failed invocations detected',
      metric: new cw.Metric({
        namespace: 'AWS/Events',
        metricName: 'FailedInvocations',
        dimensionsMap: { RuleName: cronRule.ruleName },
        statistic: 'Sum',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 1,
      evaluationPeriods: 1,
      comparisonOperator: cw.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      treatMissingData: cw.TreatMissingData.NOT_BREACHING,
    })

    new cdk.CfnOutput(this, 'RefreshOAuthFnName', { value: fn.functionName })
  }
}
