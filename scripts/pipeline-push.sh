#!/usr/bin/env bash
set -euo pipefail

# Package current repo, upload to S3 Source bucket for the CI pipeline, and trigger CodePipeline.
#
# Usage:
#   AWS_REGION=us-east-1 bash scripts/pipeline-push.sh
#   (optional) PIPELINE_NAME=HuntazeOfWorker-Pipeline SOURCE_BUCKET=... SOURCE_KEY=source.zip bash scripts/pipeline-push.sh
#
# Notes:
# - Prefers `git archive` (tracked files only). Falls back to `zip` with excludes.
# - Requires AWS CLI credentials.

REGION="${AWS_REGION:-${AWS_DEFAULT_REGION:-us-east-1}}"
PIPELINE_NAME="${PIPELINE_NAME:-HuntazeOfWorker-Pipeline}"

echo "[info] Region: $REGION"

if [[ -z "${SOURCE_BUCKET:-}" || -z "${SOURCE_KEY:-}" ]]; then
  echo "[info] Resolving S3 Source from stack outputs (HuntazeOfCiStack)"
  read -r SOURCE_BUCKET SOURCE_KEY < <(aws cloudformation describe-stacks \
    --region "$REGION" \
    --stack-name HuntazeOfCiStack \
    --query "[Stacks[0].Outputs[?OutputKey=='SourceBucketName'].OutputValue | [0], Stacks[0].Outputs[?OutputKey=='SourceObjectKey'].OutputValue | [0]]" \
    --output text)
fi

if [[ -z "$SOURCE_BUCKET" || -z "$SOURCE_KEY" ]]; then
  echo "[error] Could not determine SOURCE_BUCKET/SOURCE_KEY. Set them explicitly or ensure stack outputs exist."
  exit 1
fi

echo "[info] Source: s3://$SOURCE_BUCKET/$SOURCE_KEY"

TMPDIR=$(mktemp -d)
ARCHIVE_ZIP="$TMPDIR/source.zip"

echo "[info] Creating working tree archive (includes uncommitted changes)"
zip -r -q "$ARCHIVE_ZIP" . \
  -x "node_modules/*" "*/node_modules/*" \
     ".git/*" ".next/*" \
     "infra/cdk/cdk.out/*" \
     ".pm2/*" \
     "deployment-logs/*" "deployment-logs-*/*" \
     "artifacts/*"

echo "[info] Uploading archive ($(du -h "$ARCHIVE_ZIP" | awk '{print $1}')) to S3"
aws s3 cp "$ARCHIVE_ZIP" "s3://$SOURCE_BUCKET/$SOURCE_KEY" --region "$REGION" --only-show-errors

echo "[info] Starting pipeline: $PIPELINE_NAME"
aws codepipeline start-pipeline-execution --name "$PIPELINE_NAME" --region "$REGION" --output json

echo "[done] Push + pipeline started."
