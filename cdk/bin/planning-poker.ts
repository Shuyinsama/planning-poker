#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { PlanningPokerStack } from '../lib/planning-poker-stack';

const app = new cdk.App();

new PlanningPokerStack(app, 'PlanningPokerStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
  description: 'Planning Poker WebSocket API with DynamoDB backend',
});

app.synth();
