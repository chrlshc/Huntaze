#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { HuntazeOnlyFansStack } from '../lib/huntaze-of-stack';

const app = new cdk.App();

// ✅ FORCE us-east-1 explicitement
new HuntazeOnlyFansStack(app, 'HuntazeOnlyFansStack', {
  env: {
    account: '317805897534',
    region: 'us-east-1'  // ← EXPLICITE, pas de variables
  },
  description: 'Huntaze OnlyFans Infrastructure (us-east-1)',
  tags: {
    Project: 'Huntaze',
    Component: 'OnlyFans',
    Environment: 'production',
    ManagedBy: 'CDK',
    Region: 'us-east-1'
  },
});

app.synth();
