/**
 * Huntaze OnlyFans Infrastructure Stack (CDK)
 *
 * Provisions:
 * - ECS Fargate cluster for Playwright browser workers
 * - DynamoDB tables (sessions, threads, messages)
 * - KMS encryption
 * - Secrets Manager
 * - CloudWatch monitoring
 */
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
export declare class HuntazeOnlyFansStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps);
}
