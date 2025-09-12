export interface ABTestVariant {
  type: 'price' | 'hook' | 'cadence' | 'dm_tone' | 'posting_frequency';
  variantA: string;
  variantB: string;
  description: string;
  expectedImpact: string;
  confidence: 'high' | 'medium' | 'low';
  testDuration: string; // e.g., "7 days", "2 weeks"
  successMetrics: string[]; // keys like subscription_rate, churn_rate, ltv, etc.
}

export const abTestVariants: Record<string, ABTestVariant[]> = {
  gfe: [
    {
      type: 'price',
      variantA: '9.99',
      variantB: '12.99',
      description: 'Premium positioning test',
      expectedImpact: '+15–25% revenue per subscriber',
      confidence: 'high',
      testDuration: '2 weeks',
      successMetrics: ['subscription_rate', 'churn_rate', 'ltv'],
    },
    {
      type: 'hook',
      variantA: 'Your virtual girlfriend 💕',
      variantB: 'Intimate connection awaits 💖',
      description: 'Direct vs emotional connection approach',
      expectedImpact: '+10–20% conversion rate',
      confidence: 'medium',
      testDuration: '1 week',
      successMetrics: ['click_through_rate', 'subscription_rate'],
    },
    {
      type: 'dm_tone',
      variantA: 'Hey babe! Thanks for subscribing! 💕',
      variantB: 'Welcome to our intimate journey together 💖',
      description: 'Casual vs romantic first message',
      expectedImpact: '+5–15% first week retention',
      confidence: 'medium',
      testDuration: '1 week',
      successMetrics: ['dm_open_rate', 'ppv_conversion_rate', 'retention_7d'],
    },
  ],
  cosplay: [
    {
      type: 'price',
      variantA: '15.00',
      variantB: '19.99',
      description: 'Creative premium test',
      expectedImpact: '+20–30% revenue with quality audience',
      confidence: 'high',
      testDuration: '2 weeks',
      successMetrics: ['subscription_rate', 'custom_request_rate'],
    },
    {
      type: 'posting_frequency',
      variantA: '5 posts per week',
      variantB: '7 posts per week',
      description: 'Quality vs quantity content strategy',
      expectedImpact: '+/–10% engagement per post',
      confidence: 'medium',
      testDuration: '3 weeks',
      successMetrics: ['engagement_rate', 'time_per_post', 'subscriber_growth'],
    },
  ],
};

