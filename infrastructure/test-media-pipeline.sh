#!/bin/bash
set -e

# Load environment variables
source .env.media

echo "🧪 Testing Huntaze Media Processing Pipeline"
echo "==========================================="

# 1. Create test image
echo "📸 Creating test images..."
mkdir -p test-uploads

# Create test images with ImageMagick or use existing
if command -v convert &> /dev/null; then
    # Safe content
    convert -size 800x600 xc:blue -pointsize 40 -draw "text 50,300 'Safe Content Test'" test-uploads/safe-test.jpg
    
    # Suggestive content simulation (text only)
    convert -size 800x600 xc:red -pointsize 40 -draw "text 50,300 'Suggestive Test'" test-uploads/suggestive-test.jpg
else
    echo "⚠️  ImageMagick not installed. Using placeholder files..."
    echo "Safe content" > test-uploads/safe-test.jpg
    echo "Suggestive content" > test-uploads/suggestive-test.jpg
fi

# 2. Upload to S3
echo "📤 Uploading test images to S3..."
TEST_USER="test-user-$(date +%s)"

aws s3 cp test-uploads/safe-test.jpg s3://$MEDIA_BUCKET/$TEST_USER/safe-test.jpg \
    --profile huntaze

aws s3 cp test-uploads/suggestive-test.jpg s3://$MEDIA_BUCKET/$TEST_USER/suggestive-test.jpg \
    --profile huntaze

echo "⏳ Waiting 10 seconds for processing..."
sleep 10

# 3. Check DynamoDB for results
echo "🔍 Checking processing results in DynamoDB..."
aws dynamodb query \
    --profile huntaze \
    --table-name $MEDIA_TABLE \
    --index-name UserIdIndex \
    --key-condition-expression "userId = :uid" \
    --expression-attribute-values "{\":uid\":{\"S\":\"$TEST_USER\"}}" \
    --output json | jq '.Items[] | {
        mediaId: .mediaId.S,
        status: .status.S,
        labels: .moderationLabels
    }'

# 4. Check CloudWatch logs
echo "📊 Recent Lambda invocations..."
aws logs tail /aws/lambda/huntaze-image-processor-production \
    --profile huntaze \
    --since 5m \
    --follow &
LOG_PID=$!

sleep 5
kill $LOG_PID 2>/dev/null || true

# 5. Check SQS queues
echo "📬 Checking message queues..."
for queue in AlertQueue EnrichmentQueue DeadLetterQueue; do
    QUEUE_URL=$(aws cloudformation describe-stacks \
        --profile huntaze \
        --stack-name huntaze-media-processing-production \
        --query "Stacks[0].Resources[?LogicalResourceId=='$queue'].PhysicalResourceId" \
        --output text)
    
    if [ ! -z "$QUEUE_URL" ]; then
        COUNT=$(aws sqs get-queue-attributes \
            --profile huntaze \
            --queue-url $QUEUE_URL \
            --attribute-names ApproximateNumberOfMessages \
            --query 'Attributes.ApproximateNumberOfMessages' \
            --output text)
        echo "$queue: $COUNT messages"
    fi
done

# Cleanup
echo "🧹 Cleaning up test files..."
rm -rf test-uploads

echo "✅ Test complete!"
echo ""
echo "📈 View real-time metrics at:"
echo "$DASHBOARD_URL"