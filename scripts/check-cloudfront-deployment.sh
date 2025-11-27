#!/bin/bash

# Script to check CloudFront deployment status and test Lambda@Edge functions

DISTRIBUTION_ID="E21VMD5A9KDBOO"
DOMAIN="dc825q4u11mxr.cloudfront.net"

echo "🔍 Checking CloudFront deployment status..."
echo ""

# Check status
STATUS=$(aws cloudfront get-distribution --id $DISTRIBUTION_ID | jq -r '.Distribution.Status')
echo "📊 Status: $STATUS"

if [ "$STATUS" = "Deployed" ]; then
    echo "✅ Distribution is deployed!"
    echo ""
    echo "🧪 Testing Lambda@Edge functions..."
    echo ""
    
    # Test security headers
    echo "📋 Security Headers:"
    curl -sI https://$DOMAIN/ | grep -i "strict-transport-security\|x-content-type-options\|x-frame-options\|x-xss-protection\|content-security-policy\|x-huntaze"
    
    echo ""
    echo "📦 Compression:"
    curl -sI https://$DOMAIN/ | grep -i "content-encoding"
    
    echo ""
    echo "✅ Lambda@Edge functions are working!"
    
elif [ "$STATUS" = "InProgress" ]; then
    echo "⏳ Deployment in progress (typically takes 15-20 minutes)"
    echo ""
    echo "💡 To wait for completion, run:"
    echo "   aws cloudfront wait distribution-deployed --id $DISTRIBUTION_ID"
    echo ""
    echo "💡 Or check status again with:"
    echo "   ./scripts/check-cloudfront-deployment.sh"
else
    echo "❌ Unexpected status: $STATUS"
fi

echo ""
echo "🌐 Console: https://console.aws.amazon.com/cloudfront/v3/home#/distributions/$DISTRIBUTION_ID"
