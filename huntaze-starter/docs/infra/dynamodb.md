Ensure DynamoDB Tables (Analytics + Tokens)

Requirements
- AWS CLI configured with appropriate credentials
- Region set via `AWS_REGION` (defaults to `us-east-1`)

Create tables and enable TTL
```
AWS_REGION=us-east-1 \
ANALYTICS_TABLE=huntaze-analytics-events \
TOKENS_TABLE=huntaze-oauth-tokens \
bash scripts/dynamodb-ensure-tables.sh
```

Notes
- TTL is enabled on `ANALYTICS_TABLE` for the `ttl` attribute.
- Table creation is idempotent; script checks existence first.

