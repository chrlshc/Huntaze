Handoff — OF AWS Pipeline (status + next steps)

Overview
- Region: us-east-1
- Infra deployed (CDK): SQS, DynamoDB (Sessions/Messages/Threads), KMS, VPC, ECS Cluster, two Lambdas (SendWorker, SyncDispatcher), EventBridge rule (inbox sync every 5 minutes).
- App configured (Amplify env): OF_* variables set on branches main and chore-struct-api-auth-onboarding.
- API/UI added in repo:
  - Login managé (ECS): app/api/of/login/start/route.ts
  - Upload cookies: app/api/of/sessions/cookies/route.ts + UI app/of-connect/cookies/page.tsx
  - Queue helpers: src/lib/queue/of-sqs.ts
  - Worker (Playwright) actions login/send/inbox + CloudWatch metrics: infra/fargate/browser-worker/src/index.ts
- ECR repository created for worker image: 317805897534.dkr.ecr.us-east-1.amazonaws.com/huntaze/of-browser-worker
- ECS TaskDefinition configured to pull image from ECR tag :main (CDK updated & deployed with USE_ECR_IMAGE=1).

CDK Outputs (for reference)
- SendQueueUrl: https://sqs.us-east-1.amazonaws.com/317805897534/HuntazeOfSendQueue
- SessionsTable: HuntazeOfSessions
- MessagesTable: HuntazeOfMessages
- ThreadsTable: HuntazeOfThreads
- KmsKeyArn: arn:aws:kms:us-east-1:317805897534:key/c554a2c6-56e1-430c-b191-78e56502c0df
- ClusterArn: arn:aws:ecs:us-east-1:317805897534:cluster/HuntazeOfStack-OfClusterA7E617DB-KCjV1djdLFpy
- TaskDefArn: arn:aws:ecs:us-east-1:317805897534:task-definition/HuntazeOfStackBrowserWorkerTaskCED33274:2
- TaskSecurityGroup: sg-09703d6419b6ddb45
- SubnetsPrivate: subnet-014b23eb1375b769f,subnet-01a73352bd6799a61

What’s working already (no Docker on dev)
- Upload cookies path is fully functional via UI and API.
- API /api/of/send enqueues to SQS if OF_SQS_SEND_QUEUE_URL is set (it is), SendWorker triggers ECS.
- Inbox sync via EventBridge every 5 minutes (Lambda → ECS) is wired.

What needs the worker image
- The “Login managé (ECS)” and actual send/inbox browser automation require the worker image that contains our code.
- We switched CDK to use ECR (image tag :main). As soon as the image is pushed, ECS tasks will use it.

Two build options (picked: Docker local)
1) GitHub Actions (OIDC → ECR) — prepared, but can consume CI minutes.
2) Docker local (chosen): build once locally and push to ECR.

Next Steps After Reboot (Docker)
See commands in handoff/of-aws/commands.sh

Smoke validation
- After pushing the image, run a quick ECS task with ACTION=inbox to confirm the container starts (even without cookies). Then check CloudWatch logs group /huntaze/of/browser-worker.
- Full login test: POST /api/of/login/start with credentials → ECS ACTION=login stores cookies (KMS+DDD) for userId.

Troubleshooting
- If docker build says “Cannot connect to the Docker daemon”: open Docker Desktop, wait for it to become healthy (docker info), then retry.
- If ECR login fails: ensure aws sts get-caller-identity works for the intended account (317805897534) and region us-east-1.
- If ECS task fails to start: verify VPC subnets/SG in the run-task command; check IAM of task execution role (we attached AmazonECSTaskExecutionRolePolicy).

