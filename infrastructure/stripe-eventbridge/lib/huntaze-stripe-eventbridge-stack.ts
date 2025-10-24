import {
  Stack,
  StackProps,
  Duration,
  RemovalPolicy,
  CfnOutput
} from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as events from 'aws-cdk-lib/aws-events';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNode from 'aws-cdk-lib/aws-lambda-nodejs';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as snsSubscriptions from 'aws-cdk-lib/aws-sns-subscriptions';

interface HuntazeStripeEventBridgeStackProps extends StackProps {
  stripePartnerEventSourceName: string;
  environment: string;
  createKmsKey?: boolean;
}

export class HuntazeStripeEventBridgeStack extends Stack {
  constructor(scope: Construct, id: string, props: HuntazeStripeEventBridgeStackProps) {
    super(scope, id, props);

    const {
      stripePartnerEventSourceName: sourceName,
      environment,
      createKmsKey = false
    } = props;

    // 🔐 Clé KMS optionnelle pour chiffrer le bus et les archives
    const busKey = createKmsKey
      ? new kms.Key(this, 'EventBusKey', {
          alias: `alias/huntaze-stripe-eventbus-${environment}`,
          description: 'Clé KMS pour chiffrer le bus EventBridge Stripe et les archives',
          enableKeyRotation: true,
          removalPolicy: environment === 'prod' ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY
        })
      : undefined;

    // 📡 Associer la partner event source Stripe → créer un event bus partenaire
    const partnerBusL1 = new events.CfnEventBus(this, 'StripePartnerBus', {
      name: sourceName,
      eventSourceName: sourceName,
      kmsKeyIdentifier: busKey?.keyArn,
      // Logs détaillés pour le debugging (à ajuster en prod)
      logConfig: {
        level: environment === 'prod' ? 'ERROR' : 'INFO',
        includeDetail: environment === 'prod' ? 'NONE' : 'FULL'
      }
    });

    // Référence L2 pour créer des règles et cibles
    const partnerBus = events.EventBus.fromEventBusName(
      this,
      'StripePartnerBusRef',
      sourceName
    );

    // 📧 Topic SNS pour les notifications d'erreur
    const alertTopic = new sns.Topic(this, 'StripeEventAlerts', {
      topicName: `huntaze-stripe-alerts-${environment}`,
      displayName: 'Huntaze Stripe Event Alerts'
    });

    // 💳 Lambda pour traiter les événements de paiement
    const paymentsHandler = new lambdaNode.NodejsFunction(this, 'PaymentsHandler', {
      entry: 'lambda/payments.ts',
      functionName: `huntaze-stripe-payments-${environment}`,
      runtime: lambda.Runtime.NODEJS_20_X,
      timeout: Duration.seconds(30),
      memorySize: 512,
      logRetention: logs.RetentionDays.ONE_MONTH,
      environment: {
        POWERTOOLS_LOG_LEVEL: environment === 'prod' ? 'WARN' : 'INFO',
        ENVIRONMENT: environment,
        DATABASE_URL: process.env.DATABASE_URL || '',
        HUNTAZE_API_URL: process.env.HUNTAZE_API_URL || '',
        STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || ''
      },
      bundling: {
        externalModules: ['aws-sdk'],
        minify: true,
        sourceMap: true
      }
    });

    // Permissions pour la Lambda payments
    paymentsHandler.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'secretsmanager:GetSecretValue'
      ],
      resources: [`arn:aws:secretsmanager:${this.region}:${this.account}:secret:huntaze/*`]
    }));

    // 📊 Lambda pour traiter les événements de billing/abonnements
    const billingHandler = new lambdaNode.NodejsFunction(this, 'BillingHandler', {
      entry: 'lambda/billing.ts',
      functionName: `huntaze-stripe-billing-${environment}`,
      runtime: lambda.Runtime.NODEJS_20_X,
      timeout: Duration.seconds(30),
      memorySize: 512,
      logRetention: logs.RetentionDays.ONE_MONTH,
      environment: {
        POWERTOOLS_LOG_LEVEL: environment === 'prod' ? 'WARN' : 'INFO',
        ENVIRONMENT: environment,
        DATABASE_URL: process.env.DATABASE_URL || '',
        HUNTAZE_API_URL: process.env.HUNTAZE_API_URL || ''
      },
      bundling: {
        externalModules: ['aws-sdk'],
        minify: true,
        sourceMap: true
      }
    });

    // 🔄 DLQ pour les invocations EventBridge -> Lambda
    const paymentsDlq = new sqs.Queue(this, 'PaymentsTargetDLQ', {
      queueName: `huntaze-stripe-payments-dlq-${environment}`,
      retentionPeriod: Duration.days(14),
      visibilityTimeout: Duration.minutes(5)
    });

    const billingDlq = new sqs.Queue(this, 'BillingTargetDLQ', {
      queueName: `huntaze-stripe-billing-dlq-${environment}`,
      retentionPeriod: Duration.days(14),
      visibilityTimeout: Duration.minutes(5)
    });

    // 📝 File FIFO pour l'audit et l'ingestion (avec DLQ)
    const auditDlq = new sqs.Queue(this, 'StripeAuditDLQ', {
      queueName: `huntaze-stripe-audit-dlq-${environment}`,
      retentionPeriod: Duration.days(14)
    });

    const auditQueue = new sqs.Queue(this, 'StripeAuditFifo', {
      queueName: `huntaze-stripe-events-${environment}.fifo`,
      fifo: true,
      contentBasedDeduplication: true,
      deadLetterQueue: { 
        queue: auditDlq, 
        maxReceiveCount: 5 
      },
      retentionPeriod: Duration.days(7),
      visibilityTimeout: Duration.minutes(5)
    });

    // 🎯 Règles EventBridge pour les paiements
    const paymentsRule = new events.Rule(this, 'PaymentsRule', {
      ruleName: `huntaze-stripe-payments-${environment}`,
      description: 'Événements de paiement Stripe → Lambda',
      eventBus: partnerBus,
      eventPattern: {
        detailType: [
          'payment_intent.succeeded',
          'payment_intent.payment_failed',
          'payment_intent.canceled',
          'charge.succeeded',
          'charge.failed',
          'checkout.session.completed',
          'checkout.session.expired'
        ]
      },
      enabled: true
    });

    paymentsRule.addTarget(
      new targets.LambdaFunction(paymentsHandler, {
        deadLetterQueue: paymentsDlq,
        maxEventAge: Duration.hours(2),
        retryAttempts: 3
      })
    );

    // 🎯 Règles EventBridge pour le billing/abonnements
    const billingRule = new events.Rule(this, 'BillingRule', {
      ruleName: `huntaze-stripe-billing-${environment}`,
      description: 'Événements de billing/abonnements Stripe → Lambda + SQS',
      eventBus: partnerBus,
      eventPattern: {
        detailType: [
          'invoice.paid',
          'invoice.payment_failed',
          'invoice.payment_action_required',
          'customer.subscription.created',
          'customer.subscription.updated',
          'customer.subscription.deleted',
          'customer.subscription.trial_will_end',
          'customer.created',
          'customer.updated',
          'customer.deleted'
        ]
      },
      enabled: true
    });

    // Envoyer vers Lambda pour traitement immédiat
    billingRule.addTarget(
      new targets.LambdaFunction(billingHandler, {
        deadLetterQueue: billingDlq,
        maxEventAge: Duration.hours(2),
        retryAttempts: 3
      })
    );

    // Envoyer aussi vers SQS FIFO pour audit/backup
    billingRule.addTarget(
      new targets.SqsQueue(auditQueue, {
        // Group ID par customer pour maintenir l'ordre par client
        messageGroupId: targets.RuleTargetInput.fromEventPath('$.detail.data.object.customer')
      })
    );

    // 🎯 Règle pour tous les autres événements (audit complet)
    const auditRule = new events.Rule(this, 'AuditRule', {
      ruleName: `huntaze-stripe-audit-${environment}`,
      description: 'Tous les événements Stripe → SQS FIFO pour audit',
      eventBus: partnerBus,
      eventPattern: {
        // Capturer tous les événements Stripe
        source: [{ prefix: 'aws.partner/stripe.com' }]
      },
      enabled: true
    });

    auditRule.addTarget(
      new targets.SqsQueue(auditQueue, {
        messageGroupId: targets.RuleTargetInput.fromText('audit-all')
      })
    );

    // 📦 Archive pour rejouer les événements
    const archive = new events.CfnArchive(this, 'StripeArchive', {
      archiveName: `huntaze-stripe-archive-${environment}`,
      description: 'Archive des événements Stripe pour replay EventBridge',
      eventSourceArn: partnerBus.eventBusArn,
      retentionDays: environment === 'prod' ? 90 : 30,
      eventPattern: {
        source: [{ prefix: 'aws.partner/stripe.com' }]
      }
    });
    archive.addDependency(partnerBusL1);

    // 📊 Monitoring et alarmes CloudWatch
    this.createMonitoring(environment, {
      paymentsRule,
      billingRule,
      paymentsHandler,
      billingHandler,
      paymentsDlq,
      billingDlq,
      auditQueue,
      auditDlq,
      alertTopic,
      sourceName
    });

    // 📤 Outputs utiles
    new CfnOutput(this, 'StripePartnerEventSourceName', {
      value: sourceName,
      description: 'Nom de la partner event source Stripe'
    });

    new CfnOutput(this, 'EventBusArn', {
      value: partnerBus.eventBusArn,
      description: 'ARN du bus EventBridge partenaire Stripe'
    });

    new CfnOutput(this, 'PaymentsLambdaArn', {
      value: paymentsHandler.functionArn,
      description: 'ARN de la Lambda de traitement des paiements'
    });

    new CfnOutput(this, 'BillingLambdaArn', {
      value: billingHandler.functionArn,
      description: 'ARN de la Lambda de traitement du billing'
    });

    new CfnOutput(this, 'AuditQueueUrl', {
      value: auditQueue.queueUrl,
      description: 'URL de la file SQS FIFO d\'audit'
    });

    new CfnOutput(this, 'AlertTopicArn', {
      value: alertTopic.topicArn,
      description: 'ARN du topic SNS pour les alertes'
    });
  }

  private createMonitoring(
    environment: string,
    resources: {
      paymentsRule: events.Rule;
      billingRule: events.Rule;
      paymentsHandler: lambda.Function;
      billingHandler: lambda.Function;
      paymentsDlq: sqs.Queue;
      billingDlq: sqs.Queue;
      auditQueue: sqs.Queue;
      auditDlq: sqs.Queue;
      alertTopic: sns.Topic;
      sourceName: string;
    }
  ) {
    const {
      paymentsRule,
      billingRule,
      paymentsHandler,
      billingHandler,
      paymentsDlq,
      billingDlq,
      auditQueue,
      auditDlq,
      alertTopic,
      sourceName
    } = resources;

    // 🚨 Alarme pour les échecs d'invocation EventBridge
    const paymentsFailedInvocations = new cloudwatch.Metric({
      namespace: 'AWS/Events',
      metricName: 'FailedInvocations',
      dimensionsMap: {
        RuleName: paymentsRule.ruleName,
        EventBusName: sourceName
      },
      statistic: 'Sum',
      period: Duration.minutes(5)
    });

    new cloudwatch.Alarm(this, 'PaymentsFailedInvocationsAlarm', {
      alarmName: `huntaze-stripe-payments-failed-invocations-${environment}`,
      alarmDescription: 'Échecs d\'invocation de la règle de paiements Stripe',
      metric: paymentsFailedInvocations,
      threshold: 1,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
    }).addAlarmAction(new cloudwatch.SnsAction(alertTopic));

    // 🚨 Alarme pour les erreurs Lambda payments
    new cloudwatch.Alarm(this, 'PaymentsLambdaErrorsAlarm', {
      alarmName: `huntaze-stripe-payments-lambda-errors-${environment}`,
      alarmDescription: 'Erreurs dans la Lambda de traitement des paiements',
      metric: paymentsHandler.metricErrors({ 
        period: Duration.minutes(5),
        statistic: 'Sum'
      }),
      threshold: 1,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
    }).addAlarmAction(new cloudwatch.SnsAction(alertTopic));

    // 🚨 Alarme pour les erreurs Lambda billing
    new cloudwatch.Alarm(this, 'BillingLambdaErrorsAlarm', {
      alarmName: `huntaze-stripe-billing-lambda-errors-${environment}`,
      alarmDescription: 'Erreurs dans la Lambda de traitement du billing',
      metric: billingHandler.metricErrors({ 
        period: Duration.minutes(5),
        statistic: 'Sum'
      }),
      threshold: 1,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
    }).addAlarmAction(new cloudwatch.SnsAction(alertTopic));

    // 🚨 Alarme pour le backlog de la file d'audit
    new cloudwatch.Alarm(this, 'AuditQueueBacklogAlarm', {
      alarmName: `huntaze-stripe-audit-queue-backlog-${environment}`,
      alarmDescription: 'Backlog important dans la file d\'audit Stripe',
      metric: auditQueue.metricApproximateAgeOfOldestMessage({
        period: Duration.minutes(5),
        statistic: 'Maximum'
      }),
      threshold: 300, // 5 minutes
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
    }).addAlarmAction(new cloudwatch.SnsAction(alertTopic));

    // 🚨 Alarme pour les messages dans les DLQ
    new cloudwatch.Alarm(this, 'PaymentsDLQMessagesAlarm', {
      alarmName: `huntaze-stripe-payments-dlq-messages-${environment}`,
      alarmDescription: 'Messages dans la DLQ des paiements Stripe',
      metric: paymentsDlq.metricApproximateNumberOfVisibleMessages({
        period: Duration.minutes(5),
        statistic: 'Maximum'
      }),
      threshold: 1,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
    }).addAlarmAction(new cloudwatch.SnsAction(alertTopic));

    new cloudwatch.Alarm(this, 'BillingDLQMessagesAlarm', {
      alarmName: `huntaze-stripe-billing-dlq-messages-${environment}`,
      alarmDescription: 'Messages dans la DLQ du billing Stripe',
      metric: billingDlq.metricApproximateNumberOfVisibleMessages({
        period: Duration.minutes(5),
        statistic: 'Maximum'
      }),
      threshold: 1,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
    }).addAlarmAction(new cloudwatch.SnsAction(alertTopic));

    // 📊 Dashboard CloudWatch
    const dashboard = new cloudwatch.Dashboard(this, 'StripeEventBridgeDashboard', {
      dashboardName: `HuntazeStripeEventBridge-${environment}`,
      widgets: [
        [
          new cloudwatch.GraphWidget({
            title: 'Invocations EventBridge',
            left: [
              new cloudwatch.Metric({
                namespace: 'AWS/Events',
                metricName: 'Invocations',
                dimensionsMap: { RuleName: paymentsRule.ruleName },
                statistic: 'Sum'
              }),
              new cloudwatch.Metric({
                namespace: 'AWS/Events',
                metricName: 'Invocations',
                dimensionsMap: { RuleName: billingRule.ruleName },
                statistic: 'Sum'
              })
            ],
            width: 12,
            height: 6
          })
        ],
        [
          new cloudwatch.GraphWidget({
            title: 'Erreurs Lambda',
            left: [
              paymentsHandler.metricErrors(),
              billingHandler.metricErrors()
            ],
            width: 12,
            height: 6
          })
        ],
        [
          new cloudwatch.GraphWidget({
            title: 'Files SQS',
            left: [
              auditQueue.metricApproximateNumberOfVisibleMessages(),
              paymentsDlq.metricApproximateNumberOfVisibleMessages(),
              billingDlq.metricApproximateNumberOfVisibleMessages()
            ],
            width: 12,
            height: 6
          })
        ]
      ]
    });
  }
}