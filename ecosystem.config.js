module.exports = {
  apps: [
    {
      name: 'ai-queue-worker',
      script: 'scripts/ai-queue-worker.sh',
      interpreter: '/bin/bash',
      env: {
        HUNTAZE_API_BASE: process.env.HUNTAZE_API_BASE || 'http://localhost:3000',
        INTERVAL_SECONDS: process.env.INTERVAL_SECONDS || '5',
        AWS_REGION: process.env.AWS_REGION || 'us-east-1',
      },
      autorestart: true,
      restart_delay: 2000,
    },
    {
      name: 'ai-sqs-consumer',
      script: 'scripts/ai-sqs-consumer.js',
      env: {
        AWS_REGION: process.env.AWS_REGION || 'us-east-1',
        SQS_AI_QUEUE: process.env.SQS_AI_QUEUE || 'huntaze-ai-processing',
        AI_QUEUE_BATCH: process.env.AI_QUEUE_BATCH || '5',
        AI_QUEUE_WAIT: process.env.AI_QUEUE_WAIT || '20',
        AI_QUEUE_VISIBILITY: process.env.AI_QUEUE_VISIBILITY || '120',
      },
      autorestart: true,
      restart_delay: 2000,
    },
  ],
}
