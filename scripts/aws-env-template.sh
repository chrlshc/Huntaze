#!/usr/bin/env bash
# Template for exporting a temporary AWS session (DO NOT COMMIT REAL VALUES)

export AWS_ACCESS_KEY_ID="<PASTE_AWS_ACCESS_KEY_ID>"
export AWS_SECRET_ACCESS_KEY="<PASTE_AWS_SECRET_ACCESS_KEY>"
export AWS_SESSION_TOKEN="<PASTE_AWS_SESSION_TOKEN>"
export AWS_REGION="us-east-1"

echo "Session set for region ${AWS_REGION}. Validate with: aws sts get-caller-identity"

