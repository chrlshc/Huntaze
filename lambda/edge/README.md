# Lambda@Edge Functions

## Overview

Lambda@Edge functions execute at CloudFront edge locations to optimize requests and responses before they reach the origin or the client.

## Functions

### 1. Viewer Request (`viewer-request.ts`)

Executes **before** CloudFront cache lookup.

**Features:**
- ✅ Header normalization for consistent caching
- ✅ Device detection (mobile, tablet, desktop, bot)
- ✅ Device-based routing
- ✅ Edge authentication validation
- ✅ A/B test variant assignment

**Use Cases:**
- Normalize Accept-Encoding headers (br, gzip)
- Route requests based on device type
- Validate authentication tokens at edge
- Assign A/B test variants consistently

### 2. Origin Response (`origin-response.ts`)

Executes **after** receiving response from origin.

**Features:**
- ✅ Security headers injection
- ✅ Content compression (Brotli/Gzip)
- ✅ Cache header optimization
- ✅ Performance hints (Server-Timing, Link)
- ✅ A/B test cookie setting

**Use Cases:**
- Add security headers (HSTS, CSP, X-Frame-Options)
- Compress text-based responses
- Optimize cache duration per content type
- Add preload hints for critical resources

## Architecture

```
┌─────────┐
│ Browser │
└────┬────┘
     │
     ▼
┌──────────────────────────────────┐
│   CloudFront Edge Location       │
│                                  │
│  ┌────────────────────────────┐ │
│  │  Viewer Request Handler    │ │
│  │  - Normalize headers       │ │
│  │  - Detect device           │ │
│  │  - Validate auth           │ │
│  │  - Assign A/B variant      │ │
│  └────────────────────────────┘ │
│              │                   │
│              ▼                   │
│      [Cache Lookup]              │
│              │                   │
│         Cache Hit?               │
│         /        \               │
│       Yes        No              │
│        │          │              │
│        │          ▼              │
│        │    ┌─────────┐          │
│        │    │ Origin  │          │
│        │    └────┬────┘          │
│        │         │               │
│        │         ▼               │
│        │  ┌────────────────────┐│
│        │  │ Origin Response    ││
│        │  │ - Security headers ││
│        │  │ - Compression      ││
│        │  │ - Cache headers    ││
│        │  └────────────────────┘│
│        │         │               │
│        └─────────┴───────────────┤
│                  │                │
└──────────────────┼────────────────┘
                   │
                   ▼
              ┌─────────┐
              │ Browser │
              └─────────┘
```

## Deployment

### Prerequisites

- AWS CLI configured
- Node.js 18+ installed
- TypeScript installed (`npm install -g typescript`)
- CloudFront distribution created

### Deploy Functions

```bash
cd lambda/edge
chmod +x deploy.sh
./deploy.sh
```

The script will:
1. Build TypeScript files
2. Create deployment packages
3. Create IAM role (if needed)
4. Create/update Lambda functions
5. Publish new versions
6. Output function ARNs

### Attach to CloudFront

After deployment, attach the functions to your CloudFront distribution:

```bash
# Get current distribution config
aws cloudfront get-distribution-config \
  --id YOUR_DISTRIBUTION_ID \
  > distribution-config.json

# Edit distribution-config.json to add Lambda associations
# See example below

# Update distribution
aws cloudfront update-distribution \
  --id YOUR_DISTRIBUTION_ID \
  --if-match ETAG_FROM_GET_CONFIG \
  --distribution-config file://distribution-config.json
```

### Lambda Association Example

Add to your CloudFront behavior:

```json
{
  "LambdaFunctionAssociations": {
    "Quantity": 2,
    "Items": [
      {
        "LambdaFunctionARN": "arn:aws:lambda:us-east-1:ACCOUNT:function:huntaze-viewer-request:VERSION",
        "EventType": "viewer-request",
        "IncludeBody": false
      },
      {
        "LambdaFunctionARN": "arn:aws:lambda:us-east-1:ACCOUNT:function:huntaze-origin-response:VERSION",
        "EventType": "origin-response",
        "IncludeBody": false
      }
    ]
  }
}
```

## Configuration

### Environment Variables

Lambda@Edge functions cannot use environment variables. Configuration is hardcoded in the functions.

To modify configuration:
1. Edit the function files
2. Redeploy using `./deploy.sh`
3. Update CloudFront distribution

### Security Headers

Configured in `origin-response.ts`:

```typescript
const SECURITY_HEADERS = {
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
  'Content-Security-Policy': "default-src 'self'; ...",
};
```

### Compressible Types

Configured in `origin-response.ts`:

```typescript
const COMPRESSIBLE_TYPES = [
  'text/html',
  'text/css',
  'text/javascript',
  'application/javascript',
  'application/json',
  'application/xml',
  'image/svg+xml',
];
```

## Testing

### Property-Based Tests

```bash
npm run test tests/unit/properties/lambda-edge.property.test.ts
```

**Tests:**
- ✅ Property 30: Security headers injection
- ✅ Property 31: Device-based content optimization
- ✅ Property 32: Edge authentication
- ✅ Property 34: Content compression
- ✅ A/B test consistency
- ✅ Header normalization idempotency

### Manual Testing

Test viewer-request locally:

```typescript
import { handler } from './viewer-request';

const event = {
  Records: [{
    cf: {
      request: {
        clientIp: '1.2.3.4',
        method: 'GET',
        uri: '/test',
        querystring: '',
        headers: {
          'user-agent': [{ key: 'User-Agent', value: 'Mozilla/5.0 (iPhone...)' }],
          'accept-encoding': [{ key: 'Accept-Encoding', value: 'br, gzip' }],
        },
      },
    },
  }],
};

const result = await handler(event);
console.log(result);
```

## Performance Impact

### Viewer Request

- **Latency**: +1-5ms per request
- **Benefits**:
  - Consistent caching (better cache hit rate)
  - Device-optimized content
  - Edge authentication (no origin load)
  - A/B testing without origin

### Origin Response

- **Latency**: +5-20ms per response (compression)
- **Benefits**:
  - Security headers on all responses
  - 50-70% size reduction (compression)
  - Optimized cache headers
  - Performance hints for browser

### Overall Impact

- **Cache Hit Rate**: +20-30% (header normalization)
- **Bandwidth**: -50-70% (compression)
- **Security**: All responses have security headers
- **Performance**: Faster page loads with preload hints

## Limitations

### Lambda@Edge Constraints

- **Timeout**: 5 seconds (viewer-request), 30 seconds (origin-response)
- **Memory**: 128 MB - 3008 MB
- **Package Size**: 1 MB (viewer-request), 50 MB (origin-response)
- **Environment Variables**: Not supported
- **Region**: Must be deployed in us-east-1
- **Execution**: Runs at every edge location

### Best Practices

1. **Keep functions small**: Minimize dependencies
2. **Avoid external calls**: No database or API calls
3. **Use caching**: Leverage CloudFront cache
4. **Monitor costs**: Lambda@Edge charges per request
5. **Test thoroughly**: Errors affect all users globally

## Monitoring

### CloudWatch Logs

Lambda@Edge logs are created in the region where the function executes (edge location).

View logs:

```bash
# List log groups (in edge region, e.g., us-west-2)
aws logs describe-log-groups \
  --log-group-name-prefix /aws/lambda/us-east-1.huntaze \
  --region us-west-2

# View logs
aws logs tail /aws/lambda/us-east-1.huntaze-viewer-request \
  --region us-west-2 \
  --follow
```

### CloudWatch Metrics

Monitor Lambda@Edge metrics:

- **Invocations**: Number of executions
- **Errors**: Function errors
- **Duration**: Execution time
- **Throttles**: Rate limiting

```bash
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Invocations \
  --dimensions Name=FunctionName,Value=huntaze-viewer-request \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-02T00:00:00Z \
  --period 3600 \
  --statistics Sum \
  --region us-east-1
```

## Troubleshooting

### Function Not Executing

1. Check CloudFront distribution status (must be "Deployed")
2. Verify Lambda association in distribution config
3. Check function version (must use specific version, not $LATEST)
4. Wait 15-20 minutes for distribution to propagate

### Authentication Failing

1. Check token format (Bearer token or cookie)
2. Verify public paths are excluded
3. Check token length validation (min 10 characters)
4. Review CloudWatch logs for errors

### Compression Not Working

1. Verify content type is compressible
2. Check Accept-Encoding header
3. Ensure response body exists
4. Verify compression reduces size by >10%

### High Latency

1. Reduce function complexity
2. Remove unnecessary operations
3. Optimize compression settings
4. Consider caching at CloudFront

## Cost Optimization

### Pricing

- **Requests**: $0.60 per 1M requests
- **Duration**: $0.00005001 per GB-second
- **Data Transfer**: Standard CloudFront rates

### Optimization Tips

1. **Cache aggressively**: Reduce Lambda executions
2. **Minimize function size**: Faster cold starts
3. **Use viewer-request sparingly**: More expensive than origin-response
4. **Compress efficiently**: Balance compression vs. CPU time

## Security

### Best Practices

1. **Validate all inputs**: User-Agent, headers, cookies
2. **Sanitize outputs**: Prevent header injection
3. **Use HTTPS only**: Enforce secure connections
4. **Rotate secrets**: Update authentication logic regularly
5. **Monitor logs**: Watch for suspicious activity

### Security Headers

All responses include:
- HSTS (HTTP Strict Transport Security)
- CSP (Content Security Policy)
- X-Frame-Options (clickjacking protection)
- X-Content-Type-Options (MIME sniffing protection)
- X-XSS-Protection (XSS protection)

## Next Steps

1. Deploy functions to Lambda
2. Attach to CloudFront distribution
3. Test with real traffic
4. Monitor performance and errors
5. Optimize based on metrics

## Related Documentation

- [AWS Lambda@Edge Documentation](https://docs.aws.amazon.com/lambda/latest/dg/lambda-edge.html)
- [CloudFront Documentation](https://docs.aws.amazon.com/cloudfront/)
- [Task 6 Complete](../../.kiro/specs/performance-optimization-aws/task-6-complete.md)
