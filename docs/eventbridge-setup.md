# EventBridge Configuration for Huntaze

## 1. Stripe Events Rule

**Name**: `huntaze-stripe-events`

**Event Pattern** :
```json
{
  "source": ["aws.partner/stripe.com/*/YOUR_STRIPE_ACCOUNT_ID"],
  "detail-type": [
    "checkout.session.completed",
    "invoice.created",
    "invoice.payment_succeeded", 
    "customer.subscription.created",
    "customer.subscription.updated",
    "customer.subscription.deleted"
  ]
}
```

**Target**:
- Type: API destination
- Endpoint: `https://huntaze.com/api/eventbridge/stripe`
- Method: POST
- Headers:
  - `x-api-key`: `${EVENTBRIDGE_API_KEY}`
  - `Content-Type`: `application/json`

## 2. Monthly Billing Rule (Scheduled)

**Name**: `huntaze-monthly-commission`

**Schedule**: `cron(0 2 1 * ? *)` (1st of the month at 2:00 AM UTC)

**Target**:
- Type: Lambda function
- Function: `huntaze-calculate-commissions`
- Or API destination: `https://huntaze.com/api/cron/monthly-billing`

## 3. Lambda for Monthly Billing (Optional)

If you use Lambda instead of an API destination:

```javascript
exports.handler = async (event) => {
  const users = await getUsersWithActiveSubscriptions();
  
  for (const user of users) {
    // Get OnlyFans earnings
    const earnings = await getMonthlyEarnings(user);
    
    // Send to commission endpoint
    await fetch('https://huntaze.com/api/eventbridge/commission', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.EVENTBRIDGE_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: user.id,
        monthlyEarnings: earnings,
        subscriptionTier: user.tier
      })
    });
  }
};
```

## 4. Required Environment Variables

In AWS Amplify, add:

```
EVENTBRIDGE_API_KEY=<secure-32-char-key>
DATA_ENCRYPTION_KEY=<base64-32-byte-key>
CRON_SECRET=<secure-32-char-key>
```

## 5. Configuration Tests

To test the integration:

1. **Test Stripe Event**:
```bash
curl -X POST https://huntaze.com/api/eventbridge/stripe \
  -H "x-api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "detail": {
      "type": "checkout.session.completed",
      "data": {
        "object": {
          "metadata": { "userId": "test123" }
        }
      }
    }
  }'
```

2. **Test Commission Calculation**:
```bash
curl -X POST https://huntaze.com/api/eventbridge/commission \
  -H "x-api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test123",
    "monthlyEarnings": 10000,
    "subscriptionTier": "pro"
  }'
```
