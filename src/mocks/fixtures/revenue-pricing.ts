export const mockPricingRecommendations = {
  subscription: {
    current: 9.99,
    recommended: 12.99,
    revenueImpact: 30,
    reasoning:
      'Based on your engagement rate and subscriber retention, you can increase your price by 30% without significant churn.',
    confidence: 0.85,
  },
  ppv: [
    {
      contentId: 'content_123',
      contentType: 'video' as const,
      recommendedRange: { min: 25, max: 35 },
      expectedRevenue: { min: 2500, max: 3500 },
    },
  ],
  metadata: {
    lastUpdated: new Date().toISOString(),
    dataPoints: 1234,
  },
};

