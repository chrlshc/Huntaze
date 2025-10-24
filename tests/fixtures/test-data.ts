/**
 * Test Data Fixtures
 * Centralized test data for consistent testing across the application
 */

// User and Authentication Data
export const mockUsers = {
  creator: {
    id: 'creator-123',
    email: 'creator@example.com',
    name: 'Test Creator',
    role: 'creator',
    subscription: 'pro',
    createdAt: new Date('2024-01-01'),
  },
  admin: {
    id: 'admin-456',
    email: 'admin@example.com',
    name: 'Test Admin',
    role: 'admin',
    permissions: ['*'],
    createdAt: new Date('2024-01-01'),
  },
  fan: {
    id: 'fan-789',
    email: 'fan@example.com',
    name: 'Test Fan',
    subscriptionTier: 'vip',
    totalSpent: 250,
    lastActive: new Date('2024-01-15'),
  },
};

// Content Creation Data
export const mockCreatorProfile = {
  id: 'creator-123',
  niche: ['fitness', 'lifestyle'],
  contentTypes: ['photo', 'video', 'story'],
  audiencePreferences: ['authentic', 'motivational', 'behind-the-scenes'],
  performanceHistory: {
    topPerformingContent: ['workout videos', 'meal prep', 'progress photos'],
    engagementPatterns: { morning: 85, afternoon: 70, evening: 90 },
    revenueByCategory: { photo: 100, video: 250, ppv: 500 },
  },
  currentGoals: [
    { type: 'growth', target: 1000, timeframe: 'month' },
    { type: 'revenue', target: 5000, timeframe: 'month' },
  ],
  constraints: {
    equipment: ['camera', 'lighting'],
    location: ['home gym', 'kitchen'],
    timeAvailability: 'evenings',
  },
};

export const mockContentIdeas = [
  {
    id: 'idea-1',
    title: 'Morning Workout Routine',
    description: 'High-energy morning workout to start your day',
    category: 'video' as const,
    tags: ['fitness', 'morning', 'workout'],
    difficulty: 'medium' as const,
    estimatedEngagement: 85,
    trendScore: 75,
    targetAudience: {
      demographics: ['18-35'],
      interests: ['fitness', 'health'],
    },
    monetizationPotential: {
      ppvSuitability: 60,
      subscriptionValue: 80,
      tipPotential: 40,
    },
    createdAt: new Date('2024-01-15'),
  },
  {
    id: 'idea-2',
    title: 'Healthy Breakfast Recipe',
    description: 'Quick and nutritious breakfast for busy mornings',
    category: 'photo' as const,
    tags: ['nutrition', 'breakfast', 'healthy'],
    difficulty: 'easy' as const,
    estimatedEngagement: 70,
    trendScore: 65,
    targetAudience: {
      demographics: ['25-45'],
      interests: ['nutrition', 'cooking'],
    },
    monetizationPotential: {
      ppvSuitability: 30,
      subscriptionValue: 60,
      tipPotential: 50,
    },
    createdAt: new Date('2024-01-15'),
  },
];

export const mockCaptions = [
  {
    id: 'caption-1',
    text: 'Start your day strong! 💪 Here\'s my go-to morning routine that gets me energized and ready to conquer anything. What\'s your favorite way to kickstart the morning?',
    tone: 'friendly' as const,
    length: 'medium' as const,
    includesEmojis: true,
    includesHashtags: false,
    engagementScore: 82,
    createdAt: new Date('2024-01-15'),
  },
  {
    id: 'caption-2',
    text: 'Fuel your body right! 🥗 This breakfast bowl is packed with nutrients and takes less than 10 minutes to make.',
    tone: 'friendly' as const,
    length: 'short' as const,
    includesEmojis: true,
    includesHashtags: false,
    engagementScore: 75,
    createdAt: new Date('2024-01-15'),
  },
];

// Fan Profile Data
export const mockFanProfile = {
  id: 'fan-789',
  name: 'John Doe',
  subscriptionTier: 'vip' as const,
  totalSpent: 250,
  lastActive: new Date('2024-01-15'),
  averageSessionDuration: 1800,
  preferredContentTypes: ['photos', 'videos'],
  interactionHistory: [
    {
      type: 'message' as const,
      content: 'Love your content!',
      timestamp: new Date('2024-01-10'),
    },
    {
      type: 'tip' as const,
      amount: 50,
      timestamp: new Date('2024-01-12'),
    },
  ],
  demographics: {
    timezone: 'America/New_York',
    language: 'en',
    estimatedAge: 28,
  },
  behaviorMetrics: {
    responseRate: 75,
    averageSpendPerSession: 25,
    contentEngagementRate: 80,
    loyaltyScore: 85,
  },
};

// Media Assets Data
export const mockMediaAssets = [
  {
    id: 'asset-1',
    url: '/uploads/workout-video.mp4',
    type: 'video' as const,
    size: 15728640,
    duration: 120,
    status: 'processed' as const,
    thumbnails: ['/thumbs/thumb1.jpg', '/thumbs/thumb2.jpg'],
    metadata: {
      width: 1920,
      height: 1080,
      fps: 30,
      codec: 'h264',
    },
    createdAt: new Date('2024-01-15'),
  },
  {
    id: 'asset-2',
    url: '/uploads/breakfast-photo.jpg',
    type: 'image' as const,
    size: 2048576,
    status: 'processed' as const,
    metadata: {
      width: 1080,
      height: 1080,
      format: 'jpeg',
    },
    createdAt: new Date('2024-01-15'),
  },
];

// Performance Metrics Data
export const mockPerformanceMetrics = [
  {
    timestamp: new Date('2024-01-10'),
    contentId: 'content-1',
    contentType: 'photo',
    metrics: {
      views: 1000,
      engagement: 75,
      revenue: 50,
      conversionRate: 5.0,
      reach: 800,
    },
  },
  {
    timestamp: new Date('2024-01-11'),
    contentId: 'content-2',
    contentType: 'video',
    metrics: {
      views: 1500,
      engagement: 90,
      revenue: 125,
      conversionRate: 8.3,
      reach: 1200,
    },
  },
  {
    timestamp: new Date('2024-01-12'),
    contentId: 'content-3',
    contentType: 'story',
    metrics: {
      views: 800,
      engagement: 60,
      revenue: 25,
      conversionRate: 3.1,
      reach: 650,
    },
  },
];

// E-commerce Test Data
export const mockProducts = [
  {
    id: 'product-1',
    name: 'Wireless Headphones',
    price: 99.99,
    salePrice: 79.99,
    image: '/products/headphones.jpg',
    inStock: true,
    rating: 4.5,
    reviewCount: 123,
    category: 'electronics',
    description: 'High-quality wireless headphones with noise cancellation',
  },
  {
    id: 'product-2',
    name: 'Fitness Tracker',
    price: 149.99,
    image: '/products/fitness-tracker.jpg',
    inStock: true,
    rating: 4.2,
    reviewCount: 89,
    category: 'fitness',
    description: 'Advanced fitness tracker with heart rate monitoring',
  },
  {
    id: 'product-3',
    name: 'Yoga Mat',
    price: 29.99,
    image: '/products/yoga-mat.jpg',
    inStock: false,
    rating: 4.8,
    reviewCount: 256,
    category: 'fitness',
    description: 'Premium non-slip yoga mat for all types of practice',
  },
];

export const mockOrders = [
  {
    id: 'order-1',
    customerId: 'customer-1',
    customerName: 'Jane Smith',
    customerEmail: 'jane@example.com',
    status: 'completed',
    total: 179.98,
    items: [
      { productId: 'product-1', quantity: 1, price: 79.99 },
      { productId: 'product-2', quantity: 1, price: 99.99 },
    ],
    shippingAddress: {
      street: '123 Main St',
      city: 'Anytown',
      state: 'CA',
      zipCode: '12345',
      country: 'US',
    },
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-12'),
  },
  {
    id: 'order-2',
    customerId: 'customer-2',
    customerName: 'Bob Johnson',
    customerEmail: 'bob@example.com',
    status: 'processing',
    total: 29.99,
    items: [
      { productId: 'product-3', quantity: 1, price: 29.99 },
    ],
    shippingAddress: {
      street: '456 Oak Ave',
      city: 'Another City',
      state: 'NY',
      zipCode: '67890',
      country: 'US',
    },
    createdAt: new Date('2024-01-14'),
    updatedAt: new Date('2024-01-14'),
  },
];

// API Response Templates
export const mockAPIResponses = {
  success: {
    success: true,
    data: {},
    meta: {
      timestamp: new Date().toISOString(),
      version: '1.0',
    },
  },
  error: {
    success: false,
    error: {
      type: 'validation_error',
      message: 'Invalid request data',
      code: 'VALIDATION_FAILED',
    },
    meta: {
      timestamp: new Date().toISOString(),
    },
  },
  rateLimited: {
    success: false,
    error: {
      type: 'rate_limit_exceeded',
      message: 'Too many requests. Please try again later.',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: 3600,
    },
    meta: {
      timestamp: new Date().toISOString(),
    },
  },
};

// Error Scenarios
export const mockErrors = {
  networkError: new Error('Network request failed'),
  validationError: new Error('Validation failed'),
  authError: new Error('Authentication required'),
  notFoundError: new Error('Resource not found'),
  serverError: new Error('Internal server error'),
};

// Utility functions for test data
export const createMockUser = (overrides = {}) => ({
  ...mockUsers.creator,
  ...overrides,
});

export const createMockProduct = (overrides = {}) => ({
  ...mockProducts[0],
  id: `product-${Math.random().toString(36).substr(2, 9)}`,
  ...overrides,
});

export const createMockOrder = (overrides = {}) => ({
  ...mockOrders[0],
  id: `order-${Math.random().toString(36).substr(2, 9)}`,
  ...overrides,
});

export const createMockContentIdea = (overrides = {}) => ({
  ...mockContentIdeas[0],
  id: `idea-${Math.random().toString(36).substr(2, 9)}`,
  ...overrides,
});

// Performance test data
export const generateLargeDataset = (count: number, factory: () => any) => {
  return Array.from({ length: count }, factory);
};

export const mockLargeProductList = generateLargeDataset(100, () => 
  createMockProduct({ name: `Product ${Math.random()}` })
);

export const mockLargeOrderList = generateLargeDataset(50, () =>
  createMockOrder({ total: Math.random() * 1000 })
);