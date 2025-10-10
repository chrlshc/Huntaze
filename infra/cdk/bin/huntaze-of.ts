#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { HuntazeOfStack } from '../lib/huntaze-of-stack';

const app = new cdk.App();
new HuntazeOfStack(app, 'HuntazeOfStack', {
  env: { region: process.env.CDK_DEFAULT_REGION, account: process.env.CDK_DEFAULT_ACCOUNT }
});

