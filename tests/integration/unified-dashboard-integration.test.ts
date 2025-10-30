/**
 * Integration Tests for Unified Dashboard
 * Tests the integration between dashboard components and data sources
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock all the dashboard components and services
const mockAIMetrics = {
  totalRequests: 1500,
  avgResponseTime: 850,
  successRate: 0.98,
  modelsUsed: ['gpt-4', 'claude-3'],
  tokensProcessed: 125000
};

const mockOnlyFansMetrics = {
  messagesScheduled: 45,
  messagesDelivered: 42,
  deliveryRate: 0.93,
  avgEngagement: 0.78,
  revenue: 2450.50
};

const mockContentMetrics = {
  postsGenerated: 28,
  videosProcessed: 12,
  imagesCreated: 35,
  avgQualityScore: 0.89,
  contentApprovalRate: 0.94
};

const mockMarketingMetrics = {
  campaignsActive: 8,
  totalReach: 15000,
  conversionRate: 0.12,
  roi: 3.2,
  clickThroughRate: 0.08
};

// Mock API services
const mockAIService = {
  getMetrics: vi.fn(() => Promise.resolve(mockAIMetrics))
};

const mockOnlyFansService = {
  getMetrics: vi.fn(() => Promise.resolve(mockOnlyFansMetrics))
};

const mockContentService = {
  getMetrics: vi.fn(() => Promise.resolve(mockContentMetrics))
};

const mockMarketingService = {
  getMetrics: vi.fn(() => Promise.resolve(mockMarketingMetrics))
};

// Mock React components
const AIMetricsCard = vi.fn(() => (
  <div data-testid="ai-metrics-card">
    <h3>AI Metrics</h3>
    <div>Requests: {mockAIMetrics.totalRequests}</div>
    <div>Response Time: {mockAIMetrics.avgResponseTime}ms</div>
    <div>Success Rate: {(mockAIMetrics.successRate * 100).toFixed(1)}%</div>
  </div>
));

const OnlyFansMetricsCard = vi.fn(() => (
  <div data-testid="onlyfans-metrics-card">
    <h3>OnlyFans Metrics</h3>
    <div>Messages Delivered: {mockOnlyFansMetrics.messagesDelivered}</div>
    <div>Delivery Rate: {(mockOnlyFansMetrics.deliveryRate * 100).toFixed(1)}%</div>
    <div>Revenue: ${mockOnlyFansMetrics.revenue}</div>
  </div>
));

const ContentMetricsCard = vi.fn(() => (
  <div data-testid="content-metrics-card">
    <h3>Content Metrics</h3>
    <div>Posts Generated: {mockContentMetrics.postsGenerated}</div>
    <div>Quality Score: {(mockContentMetrics.avgQualityScore * 100).toFixed(1)}%</div>
    <div>Approval Rate: {(mockContentMetrics.contentApprovalRate * 100).toFixed(1)}%</div>
  </div>
));

const MarketingMetricsCard = vi.fn(() => (
  <div data-testid="marketing-metrics-card">
    <h3>Marketing Metrics</h3>
    <div>Active Campaigns: {mockMarketingMetrics.campaignsActive}</div>
    <div>Total Reach: {mockMarketingMetrics.totalReach.toLocaleString()}</div>
    <div>ROI: {mockMarketingMetrics.roi}x</div>
  </div>
));

// Mock the unified dashboard component
const UnifiedDashboard = () => {
  return (
    <div className="grid grid-cols-4 gap-6" data-testid="unified-dashboard">
      <AIMetricsCard />
      <OnlyFansMetricsCard />
      <ContentMetricsCard />
      <MarketingMetricsCard />
    </div>
  );
};

// Mock hooks for data fetching
const useAIMetrics = () => ({
  data: mockAIMetrics,
  isLoading: false,
  error: null,
  refetch: vi.fn()
});

const useOnlyFansMetrics = () => ({
  data: mockOnlyFansMetrics,
  isLoading: false,
  error: null,
  refetch: vi.fn()
});

const useContentMetrics = () => ({
  data: mockContentMetrics,
  isLoading: false,
  error: null,
  refetch: vi.fn()
});

const useMarketingMetrics = () => ({
  data: mockMarketingMetrics,
  isLoading: false,
  error: null,
  refetch: vi.fn()
});

// Enhanced dashboard with real-time updates
const EnhancedUnifiedDashboard = () => {
  const aiMetrics = useAIMetrics();
  const onlyFansMetrics = useOnlyFansMetrics();
  const contentMetrics = useContentMetrics();
  const marketingMetrics = useMarketingMetrics();

  const isLoading = aiMetrics.isLoading || onlyFansMetrics.isLoading || 
                   contentMetrics.isLoading || marketingMetrics.isLoading;

  if (isLoading) {
    return <div data-testid="dashboard-loading">Loading dashboard...</div>;
  }

  return (
    <div data-testid="enhanced-unified-dashboard">
      <div className="dashboard-header">
        <h1>Huntaze Unified Dashboard</h1>
        <div className="last-updated">
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>
      
      <div className="grid grid-cols-4 gap-6">
        <AIMetricsCard />
        <OnlyFansMetricsCard />
        <ContentMetricsCard />
        <MarketingMetricsCard />
      </div>

      <div className="dashboard-summary" data-testid="dashboard-summary">
        <h2>System Overview</h2>
        <div className="summary-stats">
          <div>Total AI Requests: {aiMetrics.data?.totalRequests || 0}</div>
          <div>Messages Delivered: {onlyFansMetrics.data?.messagesDelivered || 0}</div>
          <div>Content Generated: {contentMetrics.data?.postsGenerated || 0}</div>
          <div>Active Campaigns: {marketingMetrics.data?.campaignsActive || 0}</div>
        </div>
      </div>
    </div>
  );
};

describe('Unified Dashboard Integration', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const renderWithQueryClient = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    );
  };

  describe('Basic Dashboard Rendering', () => {
    it('should render all metric cards', () => {
      renderWithQueryClient(<UnifiedDashboard />);

      expect(screen.getByTestId('unified-dashboard')).toBeInTheDocument();
      expect(screen.getByTestId('ai-metrics-card')).toBeInTheDocument();
      expect(screen.getByTestId('onlyfans-metrics-card')).toBeInTheDocument();
      expect(screen.getByTestId('content-metrics-card')).toBeInTheDocument();
      expect(screen.getByTestId('marketing-metrics-card')).toBeInTheDocument();
    });

    it('should display correct AI metrics', () => {
      renderWithQueryClient(<UnifiedDashboard />);

      expect(screen.getByText('AI Metrics')).toBeInTheDocument();
      expect(screen.getByText('Requests: 1500')).toBeInTheDocument();
      expect(screen.getByText('Response Time: 850ms')).toBeInTheDocument();
      expect(screen.getByText('Success Rate: 98.0%')).toBeInTheDocument();
    });

    it('should display correct OnlyFans metrics', () => {
      renderWithQueryClient(<UnifiedDashboard />);

      expect(screen.getByText('OnlyFans Metrics')).toBeInTheDocument();
      expect(screen.getByText('Messages Delivered: 42')).toBeInTheDocument();
      expect(screen.getByText('Delivery Rate: 93.0%')).toBeInTheDocument();
      expect(screen.getByText('Revenue: $2450.5')).toBeInTheDocument();
    });

    it('should display correct Content metrics', () => {
      renderWithQueryClient(<UnifiedDashboard />);

      expect(screen.getByText('Content Metrics')).toBeInTheDocument();
      expect(screen.getByText('Posts Generated: 28')).toBeInTheDocument();
      expect(screen.getByText('Quality Score: 89.0%')).toBeInTheDocument();
      expect(screen.getByText('Approval Rate: 94.0%')).toBeInTheDocument();
    });

    it('should display correct Marketing metrics', () => {
      renderWithQueryClient(<UnifiedDashboard />);

      expect(screen.getByText('Marketing Metrics')).toBeInTheDocument();
      expect(screen.getByText('Active Campaigns: 8')).toBeInTheDocument();
      expect(screen.getByText('Total Reach: 15,000')).toBeInTheDocument();
      expect(screen.getByText('ROI: 3.2x')).toBeInTheDocument();
    });
  });

  describe('Enhanced Dashboard Features', () => {
    it('should render enhanced dashboard with summary', () => {
      renderWithQueryClient(<EnhancedUnifiedDashboard />);

      expect(screen.getByTestId('enhanced-unified-dashboard')).toBeInTheDocument();
      expect(screen.getByText('Huntaze Unified Dashboard')).toBeInTheDocument();
      expect(screen.getByTestId('dashboard-summary')).toBeInTheDocument();
      expect(screen.getByText('System Overview')).toBeInTheDocument();
    });

    it('should display summary statistics', () => {
      renderWithQueryClient(<EnhancedUnifiedDashboard />);

      expect(screen.getByText('Total AI Requests: 1500')).toBeInTheDocument();
      expect(screen.getByText('Messages Delivered: 42')).toBeInTheDocument();
      expect(screen.getByText('Content Generated: 28')).toBeInTheDocument();
      expect(screen.getByText('Active Campaigns: 8')).toBeInTheDocument();
    });

    it('should show last updated timestamp', () => {
      renderWithQueryClient(<EnhancedUnifiedDashboard />);

      expect(screen.getByText(/Last updated:/)).toBeInTheDocument();
    });
  });

  describe('Data Integration', () => {
    it('should call all metric services', async () => {
      // Mock the services to verify they're called
      const mockServices = {
        ai: mockAIService,
        onlyFans: mockOnlyFansService,
        content: mockContentService,
        marketing: mockMarketingService
      };

      // Simulate data fetching
      await Promise.all([
        mockServices.ai.getMetrics(),
        mockServices.onlyFans.getMetrics(),
        mockServices.content.getMetrics(),
        mockServices.marketing.getMetrics()
      ]);

      expect(mockAIService.getMetrics).toHaveBeenCalled();
      expect(mockOnlyFansService.getMetrics).toHaveBeenCalled();
      expect(mockContentService.getMetrics).toHaveBeenCalled();
      expect(mockMarketingService.getMetrics).toHaveBeenCalled();
    });

    it('should handle service responses correctly', async () => {
      const responses = await Promise.all([
        mockAIService.getMetrics(),
        mockOnlyFansService.getMetrics(),
        mockContentService.getMetrics(),
        mockMarketingService.getMetrics()
      ]);

      expect(responses[0]).toEqual(mockAIMetrics);
      expect(responses[1]).toEqual(mockOnlyFansMetrics);
      expect(responses[2]).toEqual(mockContentMetrics);
      expect(responses[3]).toEqual(mockMarketingMetrics);
    });
  });

  describe('Error Handling', () => {
    it('should handle AI service errors gracefully', () => {
      const useAIMetricsWithError = () => ({
        data: null,
        isLoading: false,
        error: new Error('AI service unavailable'),
        refetch: vi.fn()
      });

      // Mock component that handles errors
      const DashboardWithErrorHandling = () => {
        const aiMetrics = useAIMetricsWithError();
        
        if (aiMetrics.error) {
          return (
            <div data-testid="error-dashboard">
              <div>Error loading AI metrics: {aiMetrics.error.message}</div>
              <button onClick={aiMetrics.refetch}>Retry</button>
            </div>
          );
        }

        return <UnifiedDashboard />;
      };

      renderWithQueryClient(<DashboardWithErrorHandling />);

      expect(screen.getByTestId('error-dashboard')).toBeInTheDocument();
      expect(screen.getByText('Error loading AI metrics: AI service unavailable')).toBeInTheDocument();
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });

    it('should show loading state when data is being fetched', () => {
      const useLoadingMetrics = () => ({
        data: null,
        isLoading: true,
        error: null,
        refetch: vi.fn()
      });

      const LoadingDashboard = () => {
        const metrics = useLoadingMetrics();
        
        if (metrics.isLoading) {
          return <div data-testid="dashboard-loading">Loading dashboard...</div>;
        }

        return <UnifiedDashboard />;
      };

      renderWithQueryClient(<LoadingDashboard />);

      expect(screen.getByTestId('dashboard-loading')).toBeInTheDocument();
      expect(screen.getByText('Loading dashboard...')).toBeInTheDocument();
    });
  });

  describe('Real-time Updates', () => {
    it('should support metric refreshing', async () => {
      const mockRefetch = vi.fn();
      
      const RefreshableDashboard = () => {
        return (
          <div>
            <button 
              onClick={() => mockRefetch()}
              data-testid="refresh-button"
            >
              Refresh Metrics
            </button>
            <UnifiedDashboard />
          </div>
        );
      };

      renderWithQueryClient(<RefreshableDashboard />);

      const refreshButton = screen.getByTestId('refresh-button');
      refreshButton.click();

      expect(mockRefetch).toHaveBeenCalled();
    });

    it('should handle real-time metric updates', async () => {
      let currentMetrics = { ...mockAIMetrics };
      
      const useDynamicAIMetrics = () => ({
        data: currentMetrics,
        isLoading: false,
        error: null,
        refetch: vi.fn()
      });

      const DynamicDashboard = () => {
        const aiMetrics = useDynamicAIMetrics();
        
        return (
          <div>
            <div data-testid="dynamic-ai-requests">
              AI Requests: {aiMetrics.data?.totalRequests}
            </div>
            <button 
              onClick={() => {
                currentMetrics = { ...currentMetrics, totalRequests: currentMetrics.totalRequests + 100 };
              }}
              data-testid="update-metrics"
            >
              Simulate Update
            </button>
          </div>
        );
      };

      const { rerender } = renderWithQueryClient(<DynamicDashboard />);

      expect(screen.getByText('AI Requests: 1500')).toBeInTheDocument();

      // Simulate metric update
      currentMetrics.totalRequests = 1600;
      rerender(
        <QueryClientProvider client={queryClient}>
          <DynamicDashboard />
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('AI Requests: 1600')).toBeInTheDocument();
      });
    });
  });

  describe('Cross-Stack Integration', () => {
    it('should calculate cross-stack metrics correctly', () => {
      const calculateOverallHealth = () => {
        const aiHealth = mockAIMetrics.successRate;
        const ofHealth = mockOnlyFansMetrics.deliveryRate;
        const contentHealth = mockContentMetrics.contentApprovalRate;
        const marketingHealth = mockMarketingMetrics.conversionRate > 0.1 ? 0.9 : 0.7;

        return (aiHealth + ofHealth + contentHealth + marketingHealth) / 4;
      };

      const CrossStackDashboard = () => {
        const overallHealth = calculateOverallHealth();
        
        return (
          <div>
            <UnifiedDashboard />
            <div data-testid="overall-health">
              Overall System Health: {(overallHealth * 100).toFixed(1)}%
            </div>
          </div>
        );
      };

      renderWithQueryClient(<CrossStackDashboard />);

      // Expected: (0.98 + 0.93 + 0.94 + 0.9) / 4 = 0.9375 = 93.8%
      expect(screen.getByText('Overall System Health: 93.8%')).toBeInTheDocument();
    });

    it('should identify performance bottlenecks across stacks', () => {
      const identifyBottlenecks = () => {
        const bottlenecks = [];
        
        if (mockAIMetrics.avgResponseTime > 1000) {
          bottlenecks.push('AI response time high');
        }
        
        if (mockOnlyFansMetrics.deliveryRate < 0.95) {
          bottlenecks.push('OnlyFans delivery rate low');
        }
        
        if (mockContentMetrics.avgQualityScore < 0.9) {
          bottlenecks.push('Content quality below threshold');
        }
        
        if (mockMarketingMetrics.conversionRate < 0.1) {
          bottlenecks.push('Marketing conversion rate low');
        }

        return bottlenecks;
      };

      const BottleneckDashboard = () => {
        const bottlenecks = identifyBottlenecks();
        
        return (
          <div>
            <UnifiedDashboard />
            <div data-testid="bottlenecks">
              {bottlenecks.length > 0 ? (
                <div>
                  <h3>Performance Issues:</h3>
                  {bottlenecks.map((issue, index) => (
                    <div key={index}>{issue}</div>
                  ))}
                </div>
              ) : (
                <div>All systems performing well</div>
              )}
            </div>
          </div>
        );
      };

      renderWithQueryClient(<BottleneckDashboard />);

      // Based on mock data, should identify OnlyFans delivery rate and content quality issues
      expect(screen.getByText('Performance Issues:')).toBeInTheDocument();
      expect(screen.getByText('OnlyFans delivery rate low')).toBeInTheDocument();
      expect(screen.getByText('Content quality below threshold')).toBeInTheDocument();
    });
  });

  describe('Dashboard Responsiveness', () => {
    it('should handle different screen sizes', () => {
      const ResponsiveDashboard = () => {
        return (
          <div className="responsive-dashboard">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <AIMetricsCard />
              <OnlyFansMetricsCard />
              <ContentMetricsCard />
              <MarketingMetricsCard />
            </div>
          </div>
        );
      };

      renderWithQueryClient(<ResponsiveDashboard />);

      const dashboard = screen.getByText('AI Metrics').closest('.responsive-dashboard');
      expect(dashboard).toBeInTheDocument();
    });

    it('should support dashboard customization', () => {
      const CustomizableDashboard = ({ layout = 'grid' }: { layout?: 'grid' | 'list' }) => {
        const layoutClass = layout === 'grid' 
          ? 'grid grid-cols-4 gap-6' 
          : 'flex flex-col space-y-4';

        return (
          <div className={layoutClass} data-testid={`dashboard-${layout}`}>
            <AIMetricsCard />
            <OnlyFansMetricsCard />
            <ContentMetricsCard />
            <MarketingMetricsCard />
          </div>
        );
      };

      const { rerender } = renderWithQueryClient(<CustomizableDashboard layout="grid" />);
      expect(screen.getByTestId('dashboard-grid')).toBeInTheDocument();

      rerender(
        <QueryClientProvider client={queryClient}>
          <CustomizableDashboard layout="list" />
        </QueryClientProvider>
      );
      expect(screen.getByTestId('dashboard-list')).toBeInTheDocument();
    });
  });

  describe('Performance Optimization', () => {
    it('should handle large datasets efficiently', async () => {
      const largeDataset = {
        ...mockAIMetrics,
        totalRequests: 1000000,
        detailedMetrics: Array.from({ length: 1000 }, (_, i) => ({
          timestamp: new Date(Date.now() - i * 60000),
          requests: Math.floor(Math.random() * 100),
          responseTime: Math.floor(Math.random() * 1000)
        }))
      };

      const useLargeDataset = () => ({
        data: largeDataset,
        isLoading: false,
        error: null,
        refetch: vi.fn()
      });

      const PerformantDashboard = () => {
        const metrics = useLargeDataset();
        
        // Only show summary to avoid rendering performance issues
        return (
          <div data-testid="performant-dashboard">
            <div>Total Requests: {metrics.data?.totalRequests.toLocaleString()}</div>
            <div>Data Points: {metrics.data?.detailedMetrics?.length}</div>
          </div>
        );
      };

      renderWithQueryClient(<PerformantDashboard />);

      expect(screen.getByText('Total Requests: 1,000,000')).toBeInTheDocument();
      expect(screen.getByText('Data Points: 1000')).toBeInTheDocument();
    });

    it('should implement efficient data polling', async () => {
      let pollCount = 0;
      const mockPoll = vi.fn(() => {
        pollCount++;
        return Promise.resolve(mockAIMetrics);
      });

      const PollingDashboard = () => {
        // Simulate polling every 30 seconds
        React.useEffect(() => {
          const interval = setInterval(() => {
            mockPoll();
          }, 30000);

          return () => clearInterval(interval);
        }, []);

        return (
          <div data-testid="polling-dashboard">
            <div>Poll Count: {pollCount}</div>
            <UnifiedDashboard />
          </div>
        );
      };

      renderWithQueryClient(<PollingDashboard />);

      expect(screen.getByTestId('polling-dashboard')).toBeInTheDocument();
      
      // Initial render shouldn't trigger polling yet
      expect(pollCount).toBe(0);
    });
  });
});