#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { HuntazeOfCiStack } from '../lib/huntaze-of-ci-stack';

const app = new cdk.App();
new HuntazeOfCiStack(app, 'HuntazeOfCiStack', {
  env: { region: process.env.CDK_DEFAULT_REGION, account: process.env.CDK_DEFAULT_ACCOUNT }
});

