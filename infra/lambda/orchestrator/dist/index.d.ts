/**
 * Lambda Orchestrator for OnlyFans Browser Workers
 *
 * Receives SQS messages
 * → Launches ECS Fargate tasks with proper configuration
 * → Handles retry + error handling
 * → Publishes CloudWatch metrics
 */
import type { SQSEvent } from 'aws-lambda';
export declare const handler: (event: SQSEvent) => Promise<{
    statusCode: number;
    body: string;
}>;
//# sourceMappingURL=index.d.ts.map