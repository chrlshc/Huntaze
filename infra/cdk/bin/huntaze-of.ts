#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
// Use dynamic requires to avoid constructing unused stacks at synth time

const app = new cdk.App();
const stacks = (process.env.STACKS || 'main,ci').split(',').map(s => s.trim());
const resolvedRegion = process.env.CDK_DEFAULT_REGION || process.env.AWS_REGION || 'us-east-1';
const resolvedAccount = process.env.CDK_DEFAULT_ACCOUNT || process.env.AWS_ACCOUNT_ID;
const env = { region: resolvedRegion, account: resolvedAccount } as any;
const qualifier = process.env.CDK_QUALIFIER || 'ofq1abcde';
const synthesizer = new cdk.DefaultStackSynthesizer({ qualifier });
if (stacks.includes('main')) {
  const { HuntazeOfStack } = require('../lib/huntaze-of-stack');
  new HuntazeOfStack(app, 'HuntazeOfStack', { env, synthesizer });
}
if (stacks.includes('ci')) {
  const { HuntazeOfCiStack } = require('../lib/huntaze-of-ci-stack');
  new HuntazeOfCiStack(app, 'HuntazeOfCiStack', { env, synthesizer });
}
