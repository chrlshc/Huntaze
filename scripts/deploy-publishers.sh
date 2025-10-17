#!/usr/bin/env bash
set -euo pipefail

# Deploy publisher Lambdas (Twitter, Instagram) and update code from repo sources

ENV=${ENV:-production}
REGION=${REGION:-us-east-1}
POSTS_TABLE=${POSTS_TABLE:-huntaze-posts}
PUBKEYS_TABLE=${PUBKEYS_TABLE:-huntaze-pubkeys}
TOKENS_TABLE=${TOKENS_TABLE:-huntaze-oauth-tokens}

echo "[step] Deploy base publisher stacks (roles, mappings)"
aws cloudformation deploy \
  --template-file infrastructure/publishers.yaml \
  --stack-name huntaze-publishers \
  --parameter-overrides Environment="$ENV" PostsTableName="$POSTS_TABLE" PubKeysTableName="$PUBKEYS_TABLE" TokensTableName="$TOKENS_TABLE" UploadBucketName="${UPLOAD_BUCKET:-huntaze-media-vault-$ENV}" \
  --region "$REGION" --capabilities CAPABILITY_NAMED_IAM --no-fail-on-empty-changeset

echo "[step] Update publisher-twitter code"
ZIP=/tmp/publisher-twitter.zip
rm -f "$ZIP"; (cd lambda/publishers/twitter && cp -f ../_core.js ./_core.js && zip -q -r "$ZIP" index.js _core.js)
aws lambda update-function-code --function-name publisher-twitter --zip-file fileb://"$ZIP" --region "$REGION" >/dev/null
aws lambda update-function-configuration --function-name publisher-twitter --region "$REGION" \
  --environment "Variables={POSTS_TABLE=$POSTS_TABLE,PUBKEYS_TABLE=$PUBKEYS_TABLE,TOKENS_TABLE=$TOKENS_TABLE,ENABLE_PUBLISH=${ENABLE_PUBLISH:-false}}" >/dev/null || true

echo "[step] Update publisher-instagram code"
ZIP=/tmp/publisher-instagram.zip
rm -f "$ZIP";
if [ -d lambda/publishers/instagram/node_modules ]; then
  (cd lambda/publishers/instagram && cp -f ../_core.js ./_core.js && zip -q -r "$ZIP" index.js _core.js helpers.s3.js node_modules)
else
  (cd lambda/publishers/instagram && cp -f ../_core.js ./_core.js && zip -q -r "$ZIP" index.js _core.js helpers.s3.js)
fi
aws lambda update-function-code --function-name publisher-instagram --zip-file fileb://"$ZIP" --region "$REGION" >/dev/null
aws lambda update-function-configuration --function-name publisher-instagram --region "$REGION" \
  --environment "Variables={POSTS_TABLE=$POSTS_TABLE,PUBKEYS_TABLE=$PUBKEYS_TABLE,TOKENS_TABLE=$TOKENS_TABLE,ENABLE_PUBLISH=${ENABLE_PUBLISH:-false},UPLOAD_BUCKET=${UPLOAD_BUCKET:-huntaze-media-vault-$ENV}}" >/dev/null || true

echo "[step] Update publisher-tiktok code"
ZIP=/tmp/publisher-tiktok.zip
rm -f "$ZIP"; (cd lambda/publishers/tiktok && cp -f ../_core.js ./_core.js && zip -q -r "$ZIP" index.js _core.js)
aws lambda update-function-code --function-name publisher-tiktok --zip-file fileb://"$ZIP" --region "$REGION" >/dev/null
aws lambda update-function-configuration --function-name publisher-tiktok --region "$REGION" \
  --environment "Variables={POSTS_TABLE=$POSTS_TABLE,PUBKEYS_TABLE=$PUBKEYS_TABLE,TOKENS_TABLE=$TOKENS_TABLE,ENABLE_PUBLISH=${TIKTOK_ENABLE_PUBLISH:-false},UPLOAD_BUCKET=${UPLOAD_BUCKET:-huntaze-media-vault-$ENV},TIKTOK_BASE=${TIKTOK_BASE:-https://open.tiktokapis.com},TIKTOK_MODE=${TIKTOK_MODE:-FILE_UPLOAD}}" >/dev/null || true

echo "[step] Update publisher-reddit code"
ZIP=/tmp/publisher-reddit.zip
rm -f "$ZIP"; (cd lambda/publishers/reddit && cp -f ../_core.js ./_core.js && zip -q -r "$ZIP" index.js _core.js)
aws lambda update-function-code --function-name publisher-reddit --zip-file fileb://"$ZIP" --region "$REGION" >/dev/null
aws lambda update-function-configuration --function-name publisher-reddit --region "$REGION" \
  --environment "Variables={POSTS_TABLE=$POSTS_TABLE,PUBKEYS_TABLE=$PUBKEYS_TABLE,TOKENS_TABLE=$TOKENS_TABLE,ENABLE_PUBLISH=${REDDIT_ENABLE_PUBLISH:-false},REDDIT_DEFAULT_SR=${REDDIT_DEFAULT_SR:-}}" >/dev/null || true

echo "[ok] Publishers deployed"
