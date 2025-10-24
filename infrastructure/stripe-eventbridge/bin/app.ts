#!/usr/bin/env ts-node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { HuntazeStripeEventBridgeStack } from '../lib/huntaze-stripe-eventbridge-stack';

const app = new cdk.App();

// Récupérer le nom de la partner event source Stripe
const stripePartnerEventSourceName = 
  app.node.tryGetContext('stripeEventSourceName') ||
  process.env.STRIPE_EVENT_SOURCE;

if (!stripePartnerEventSourceName) {
  throw new Error(
    'Vous devez fournir le nom de la partner event source Stripe via:\n' +
    '  --context stripeEventSourceName="aws.partner/stripe.com/ACCOUNT_ID/DESTINATION_ID"\n' +
    '  ou la variable d\'environnement STRIPE_EVENT_SOURCE\n\n' +
    'Récupérez ce nom depuis Stripe Dashboard → Event Destinations → Amazon EventBridge'
  );
}

// Configuration de l'environnement
const environment = app.node.tryGetContext('environment') || 'dev';
const createKmsKey = app.node.tryGetContext('createKmsKey') === 'true';

new HuntazeStripeEventBridgeStack(app, `HuntazeStripeEventBridge-${environment}`, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'eu-west-1'
  },
  stripePartnerEventSourceName,
  environment,
  createKmsKey,
  tags: {
    Project: 'Huntaze',
    Component: 'StripeEventBridge',
    Environment: environment,
    ManagedBy: 'CDK'
  }
});

app.synth();