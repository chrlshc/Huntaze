#!/usr/bin/env bash
set -euo pipefail

# Local infra synth/publish/deploy mirroring buildspec.yml
# Usage:
#   AWS_PROFILE=... ACCT=317805897534 REGION=us-east-1 DEPLOY=1 \
#     bash scripts/deploy-infra-local.sh

ROOT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
cd "${ROOT_DIR}"

USE_ECR_IMAGE=${USE_ECR_IMAGE:-1}
ECR_REPOSITORY=${ECR_REPOSITORY:-huntaze/of-browser-worker}
ECR_IMAGE_TAG=${ECR_IMAGE_TAG:-main}
STACKS=${STACKS:-main,ci}
CDK_QUALIFIER=${CDK_QUALIFIER:-hnb659fds}

REGION=${REGION:-${AWS_REGION:-${AWS_DEFAULT_REGION:-us-east-1}}}
ACCT=${ACCT:-$(aws sts get-caller-identity --query Account --output text)}

export USE_ECR_IMAGE ECR_REPOSITORY ECR_IMAGE_TAG CDK_QUALIFIER
export AWS_DEFAULT_REGION="${REGION}" AWS_REGION="${REGION}" CDK_DEFAULT_REGION="${REGION}"
export CDK_DEFAULT_ACCOUNT="${ACCT}"

echo "Account=${ACCT} Region=${REGION} Qualifier=${CDK_QUALIFIER}"
echo "ECR repo=${ECR_REPOSITORY} tag=${ECR_IMAGE_TAG} USE_ECR_IMAGE=${USE_ECR_IMAGE}"

echo "Installing infra/cdk deps ..."
npm ci --prefix infra/cdk --no-audit --no-fund

echo "Building CDK app ..."
npm run build --prefix infra/cdk

export PATH="$PATH:$(pwd)/infra/cdk/node_modules/.bin"

echo "Synthesizing stacks (${STACKS}) to dist/ ..."
rm -rf dist && mkdir -p dist
STACKS="${STACKS}" npx --yes cdk -a "node ./infra/cdk/dist/bin/huntaze-of.js" synth -o dist

echo "Publishing CDK assets via manifest ..."
npx --yes cdk-assets -p dist/manifest.json publish

# Some environments also publish the per-stack assets file; harmless if already covered by manifest
if [[ -f dist/HuntazeOfStack.assets.json ]]; then
  npx --yes cdk-assets -p dist/HuntazeOfStack.assets.json publish || true
fi

if [[ "${DEPLOY:-0}" == "1" ]]; then
  echo "Deploying CloudFormation stacks ..."
  npx --yes cdk -a "node ./infra/cdk/dist/bin/huntaze-of.js" deploy HuntazeOfStack HuntazeOfCiStack --require-approval never
else
  echo "Skipping cdk deploy (set DEPLOY=1 to enable)."
fi

echo "Done."
