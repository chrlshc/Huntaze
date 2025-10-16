#!/usr/bin/env bash
set -euo pipefail

# Helper for AWS SSO login (interactive). This does NOT store keys.
# Usage:
#   AWS_PROFILE=${AWS_PROFILE:-huntaze-sso} AWS_SDK_LOAD_CONFIG=1 ./scripts/aws-sso-login.sh

PROFILE=${AWS_PROFILE:-huntaze-sso}
echo "Using AWS_PROFILE=${PROFILE}"
echo "If not configured, run: aws configure sso"
echo "SSO start URL: https://d-906627e8bc.awsapps.com/start/#"
echo "SSO region: us-east-1"

aws sso login --profile "${PROFILE}"
aws sts get-caller-identity --profile "${PROFILE}" --output json

