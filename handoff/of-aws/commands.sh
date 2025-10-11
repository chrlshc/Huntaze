#!/usr/bin/env bash
set -euo pipefail

# Prereqs: AWS CLI logged-in for account 317805897534 in us-east-1
# Verify: aws sts get-caller-identity && aws --version && docker --version

REGION=us-east-1
ACCOUNT=317805897534
REPO_URI=${ACCOUNT}.dkr.ecr.${REGION}.amazonaws.com/huntaze/of-browser-worker
IMAGE_TAG=main

if [ -z "${WORKER_TOKEN:-}" ]; then
  echo "\n[ERROR] WORKER_TOKEN is not set. Export it first, e.g.:"
  echo "  export WORKER_TOKEN=your-super-secret-token"
  exit 1
fi

APP_ORIGIN_DEFAULT=${APP_ORIGIN:-https://app.huntaze.com}

echo "1) Docker login to ECR"
aws ecr get-login-password --region ${REGION} | docker login --username AWS --password-stdin ${ACCOUNT}.dkr.ecr.${REGION}.amazonaws.com

echo "2) Build worker image"
DOCKER_BUILDKIT=1 docker build -t ${REPO_URI}:${IMAGE_TAG} infra/fargate/browser-worker

echo "3) Push image to ECR"
docker push ${REPO_URI}:${IMAGE_TAG}

echo "4) Smoke run (ECS task, ACTION=inbox)"
CLUSTER_ARN="arn:aws:ecs:us-east-1:317805897534:cluster/HuntazeOfStack-OfClusterA7E617DB-KCjV1djdLFpy"
TASK_DEF_ARN="arn:aws:ecs:us-east-1:317805897534:task-definition/HuntazeOfStackBrowserWorkerTaskCED33274:2"
SUBNETS="subnet-014b23eb1375b769f,subnet-01a73352bd6799a61"
SG_ID="sg-09703d6419b6ddb45"

aws ecs run-task \
  --cluster "${CLUSTER_ARN}" \
  --task-definition "${TASK_DEF_ARN}" \
  --count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[${SUBNETS}],securityGroups=[${SG_ID}],assignPublicIp=DISABLED}" \
  --overrides '{
    "containerOverrides": [{
      "name": "of-browser-worker",
      "environment": [
        {"name":"ACTION","value":"inbox"},
        {"name":"USER_ID","value":"user123"},
        {"name":"OF_DDB_THREADS_TABLE","value":"HuntazeOfThreads"},
        {"name":"OF_DDB_SESSIONS_TABLE","value":"HuntazeOfSessions"},
        {"name":"OF_DDB_MESSAGES_TABLE","value":"HuntazeOfMessages"},
        {"name":"OF_KMS_KEY_ID","value":"arn:aws:kms:us-east-1:317805897534:key/c554a2c6-56e1-430c-b191-78e56502c0df"},
        {"name":"APP_ORIGIN","value":"${APP_ORIGIN_DEFAULT}"},
        {"name":"WORKER_TOKEN","value":"${WORKER_TOKEN}"}
      ]
    }]
  }' \
  --region ${REGION}

echo "5) Tail logs (Ctrl-C to stop)"
aws logs tail /huntaze/of/browser-worker --follow --region ${REGION}

echo "Done. For full login test, call POST /api/of/login/start with credentials."
