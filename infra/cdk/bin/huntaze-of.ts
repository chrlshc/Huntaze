#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
// Use dynamic requires to avoid constructing unused stacks at synth time

const app = new cdk.App();
const stacks = (process.env.STACKS || 'main,ci').split(',').map(s => s.trim());
const env = { region: process.env.CDK_DEFAULT_REGION, account: process.env.CDK_DEFAULT_ACCOUNT } as any;
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
