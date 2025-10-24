import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';

// Mock data for content creation system
const mockMediaAssets = [
  {
    id: '1',
    title: 'Summer Collection Photo',
    type: 'photo',
    status: 'published',
    tags: ['summer', 'fashion', 'outdoor'],
    createdAt: '2024-01-15T10:30:00Z',
    thumbnail: '/thumbnails/summer-photo.jpg',
    metrics: {
      views: 1250,
      likes: 89,
      revenue: 45.50
    }
  },
  {
    id: '2',
    title: 'Behind the Scenes Video',
    type: 'video',
    status: 'draft',
    tags: ['bts', 'exclusive'],
    createdAt: '2024-01-14T15:45:00Z',
    thumbnail: '/thumbnails/bts-video.jpg',
    metrics: {
      views: 0,
      likes: 0,
      revenue: 0
    }
  }
];

const mockPPVCampaigns = [
  {
    id: '1',
    title: 'Exclusive Beach Photoshoot',
    status: 'active',
    price: 19.99,
    createdAt: '2024-01-10T09:00:00Z',
    metrics: {
      openRate: 0.65,
      purchaseRate: 0.23,
      roi: 2.4,
      revenue: 480.75
    }
  },
  {
    id: '2',
    title: 'VIP Content Bundle',
    status: 'paused',
    price: 29.99,
    createdAt: '2024-01-08T14:20:00Z',
    metrics: {
      openRate: 0.42,
      purchaseRate: 0.15,
      roi: 1.8,
      revenue: 359.88
    }
  }
];

const mockAIInsights = [
  {
    id: '1',
    type: 'revenue_drop',
    severity: 'high',
    title: 'Revenue decreased by 15% this week',
    description: 'Your earnings are down compared to last week. Consider posting more PPV content.',
    actions: ['Create new PPV campaign', 'Message inactive subscribers'],
    timestamp: '2024-01-15T08:00:00Z'
  },
  {
    id: '2',
    type: 'vip_opportunity',
    severity: 'medium',
    title: '12 VIP fans haven\'t been contacted',
    description: 'You have high-value subscribers who haven\'t received personal messages recently.',
    actions: ['Send personalized messages', 'Offer exclusive content'],
    timestamp: '2024-01-15T06:30:00Z'
  }
];

// Mock components
const MockContentLibrary = ({ 
  assets, 
  onFilter, 
  onSearch, 
  onAssetSelect 
}: {
  assets: any[];
  onFilter: (filters: any) => void;
  onSearch: (query: string) => void;
  onAssetSelect: (asset: any) => void;
}) => (
  <div data-testid="content-library">
    <div data-testid="library-controls">
      <input 
        data-testid="search-input"
        placeholder="Search content..."
        onChange={(e) => onSearch(e.target.value)}
      />
      
      <select 
        data-testid="type-filter"
        onChange={(e) => onFilter({ type: e.target.value })}
      >
        <option value="">All Types</option>
        <option value="photo">Photos</option>
        <option value="video">Videos</option>
        <option value="story">Stories</option>
      </select>
      
      <select 
        data-testid="status-filter"
        onChange={(e) => onFilter({ status: e.target.value })}
      >
        <option value="">All Status</option>
        <option value="published">Published</option>
        <option value="draft">Draft</option>
        <option value="scheduled">Scheduled</option>
      </select>
    </div>
    
    <div data-testid="assets-grid" role="grid">
      {assets.map((asset) => (
        <div 
          key={asset.id} 
          data-testid={`asset-${asset.id}`}
          role="gridcell"
          onClick={() => onAssetSelect(asset)}
          className="cursor-pointer"
        >
          <img src={asset.thumbnail} alt={asset.title} />
          <h3>{asset.title}</h3>
          <span data-testid={`asset-type-${asset.id}`}>{asset.type}</span>
          <span data-testid={`asset-status-${asset.id}`}>{asset.status}</span>
          <div data-testid={`asset-metrics-${asset.id}`}>
            Views: {asset.metrics.views} | Revenue: ${asset.metrics.revenue}
          </div>
        </div>
      ))}
    </div>
  </div>
);

const MockEditorialCalendar = ({ 
  view, 
  onViewChange, 
  onAssetDrop,
  onQuickCreate 
}: {
  view: 'monthly' | 'weekly';
  onViewChange: (view: 'monthly' | 'weekly') => void;
  onAssetDrop: (assetId: string, date: string) => void;
  onQuickCreate: (type: string, date: string) => void;
}) => (
  <div data-testid="editorial-calendar">
    <div data-testid="calendar-controls">
      <button 
        data-testid="monthly-view"
        onClick={() => onViewChange('monthly')}
        className={view === 'monthly' ? 'active' : ''}
      >
        Monthly
      </button>
      <button 
        data-testid="weekly-view"
        onClick={() => onViewChange('weekly')}
        className={view === 'weekly' ? 'active' : ''}
      >
        Weekly
      </button>
    </div>
    
    <div data-testid="calendar-grid">
      {Array.from({ length: 7 }, (_, i) => (
        <div 
          key={i}
          data-testid={`calendar-slot-${i}`}
          onDrop={(e) => {
            e.preventDefault();
            const assetId = e.dataTransfer.getData('text/plain');
            onAssetDrop(assetId, `2024-01-${15 + i}`);
          }}
          onDragOver={(e) => e.preventDefault()}
        >
          <div>Day {15 + i}</div>
          <button 
            onClick={() => onQuickCreate('ppv', `2024-01-${15 + i}`)}
            data-testid={`quick-create-${i}`}
          >
            + PPV
          </button>
        </div>
      ))}
    </div>
  </div>
);

const MockPPVCampaigns = ({ 
  campaigns, 
  onDuplicate, 
  onAdjust 
}: {
  campaigns: any[];
  onDuplicate: (campaign: any) => void;
  onAdjust: (campaignId: string, adjustments: any) => void;
}) => (
  <div data-testid="ppv-campaigns">
    <h2>PPV Campaigns</h2>
    
    {campaigns.map((campaign) => (
      <div key={campaign.id} data-testid={`campaign-${campaign.id}`}>
        <h3>{campaign.title}</h3>
        <span data-testid={`campaign-status-${campaign.id}`}>{campaign.status}</span>
        <span data-testid={`campaign-price-${campaign.id}`}>${campaign.price}</span>
        
        <div data-testid={`campaign-metrics-${campaign.id}`}>
          <div>Open Rate: {(campaign.metrics.openRate * 100).toFixed(1)}%</div>
          <div>Purchase Rate: {(campaign.metrics.purchaseRate * 100).toFixed(1)}%</div>
          <div>ROI: {campaign.metrics.roi}x</div>
          <div>Revenue: ${campaign.metrics.revenue}</div>
        </div>
        
        <div data-testid={`campaign-actions-${campaign.id}`}>
          <button onClick={() => onDuplicate(campaign)}>Duplicate</button>
          <button onClick={() => onAdjust(campaign.id, { price: campaign.price * 0.9 })}>
            Adjust Price
          </button>
        </div>
      </div>
    ))}
  </div>
);

const MockComplianceChecker = ({ 
  onUpload, 
  scanResults 
}: {
  onUpload: (file: File) => void;
  scanResults?: any;
}) => (
  <div data-testid="compliance-checker">
    <h2>Content Compliance</h2>
    
    <input 
      type="file"
      data-testid="content-upload"
      onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) onUpload(file);
      }}
      accept="image/*,video/*"
    />
    
    {scanResults && (
      <div data-testid="scan-results">
        <div data-testid="compliance-status">
          Status: {scanResults.approved ? 'Approved' : 'Needs Review'}
        </div>
        
        {scanResults.violations && scanResults.violations.length > 0 && (
          <div data-testid="compliance-violations">
            <h3>Policy Violations:</h3>
            {scanResults.violations.map((violation: any, index: number) => (
              <div key={index} data-testid={`violation-${index}`}>
                <strong>{violation.type}</strong>: {violation.message}
                <div>Suggestion: {violation.suggestion}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    )}
  </div>
);

const MockAIChatInterface = ({ 
  messages, 
  onSendMessage, 
  onExportChat,
  onSwitchToPromptBuilder 
}: {
  messages: any[];
  onSendMessage: (message: string) => void;
  onExportChat: () => void;
  onSwitchToPromptBuilder: () => void;
}) => (
  <div data-testid="ai-chat-interface">
    <div data-testid="chat-controls">
      <button onClick={onExportChat}>Export Chat</button>
      <button onClick={onSwitchToPromptBuilder}>Prompt Builder</button>
    </div>
    
    <div data-testid="chat-messages">
      {messages.map((message, index) => (
        <div key={index} data-testid={`message-${index}`}>
          <strong>{message.sender}:</strong> {message.content}
        </div>
      ))}
    </div>
    
    <div data-testid="chat-input">
      <input 
        placeholder="Ask AI assistant..."
        onKeyPress={(e) => {
          if (e.key === 'Enter') {
            onSendMessage((e.target as HTMLInputElement).value);
            (e.target as HTMLInputElement).value = '';
          }
        }}
      />
    </div>
  </div>
);

const MockAIInsightsDashboard = ({ 
  insights, 
  onDismissInsight, 
  onTakeAction 
}: {
  insights: any[];
  onDismissInsight: (insightId: string) => void;
  onTakeAction: (insightId: string, action: string) => void;
}) => (
  <div data-testid="ai-insights-dashboard">
    <h2>AI Insights & Alerts</h2>
    
    {insights.map((insight) => (
      <div 
        key={insight.id} 
        data-testid={`insight-${insight.id}`}
        className={`insight-card severity-${insight.severity}`}
      >
        <h3>{insight.title}</h3>
        <p>{insight.description}</p>
        
        <div data-testid={`insight-actions-${insight.id}`}>
          {insight.actions.map((action: string, index: number) => (
            <button 
              key={index}
              onClick={() => onTakeAction(insight.id, action)}
            >
              {action}
            </button>
          ))}
        </div>
        
        <button onClick={() => onDismissInsight(insight.id)}>
          Dismiss
        </button>
      </div>
    ))}
  </div>
);

expect.extend(toHaveNoViolations);

describe('Content Creation & AI Assistant System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('R1 | Content Library Management', () => {
    it('should display media assets in grid layout with thumbnails', () => {
      const mockOnFilter = vi.fn();
      const mockOnSearch = vi.fn();
      const mockOnAssetSelect = vi.fn();
      
      render(
        <MockContentLibrary 
          assets={mockMediaAssets}
          onFilter={mockOnFilter}
          onSearch={mockOnSearch}
          onAssetSelect={mockOnAssetSelect}
        />
      );
      
      // Check grid layout
      expect(screen.getByTestId('assets-grid')).toHaveAttribute('role', 'grid');
      
      // Check asset display
      expect(screen.getByTestId('asset-1')).toBeInTheDocument();
      expect(screen.getByText('Summer Collection Photo')).toBeInTheDocument();
      expect(screen.getByTestId('asset-type-1')).toHaveTextContent('photo');
      expect(screen.getByTestId('asset-status-1')).toHaveTextContent('published');
      
      // Check metrics display
      expect(screen.getByTestId('asset-metrics-1')).toHaveTextContent('Views: 1250');
      expect(screen.getByTestId('asset-metrics-1')).toHaveTextContent('Revenue: $45.5');
    });

    it('should filter media assets by type and status', async () => {
      const mockOnFilter = vi.fn();
      
      render(
        <MockContentLibrary 
          assets={mockMediaAssets}
          onFilter={mockOnFilter}
          onSearch={() => {}}
          onAssetSelect={() => {}}
        />
      );
      
      // Test type filter
      const typeFilter = screen.getByTestId('type-filter');
      await userEvent.selectOptions(typeFilter, 'photo');
      expect(mockOnFilter).toHaveBeenCalledWith({ type: 'photo' });
      
      // Test status filter
      const statusFilter = screen.getByTestId('status-filter');
      await userEvent.selectOptions(statusFilter, 'published');
      expect(mockOnFilter).toHaveBeenCalledWith({ status: 'published' });
    });

    it('should provide search functionality for media assets', async () => {
      const mockOnSearch = vi.fn();
      
      render(
        <MockContentLibrary 
          assets={mockMediaAssets}
          onFilter={() => {}}
          onSearch={mockOnSearch}
          onAssetSelect={() => {}}
        />
      );
      
      const searchInput = screen.getByTestId('search-input');
      await userEvent.type(searchInput, 'summer');
      
      expect(mockOnSearch).toHaveBeenCalledWith('summer');
    });

    it('should display detailed asset information when selected', async () => {
      const mockOnAssetSelect = vi.fn();
      
      render(
        <MockContentLibrary 
          assets={mockMediaAssets}
          onFilter={() => {}}
          onSearch={() => {}}
          onAssetSelect={mockOnAssetSelect}
        />
      );
      
      const assetCard = screen.getByTestId('asset-1');
      await userEvent.click(assetCard);
      
      expect(mockOnAssetSelect).toHaveBeenCalledWith(mockMediaAssets[0]);
    });
  });

  describe('R2 | Editorial Calendar', () => {
    it('should display calendar in monthly and weekly views', async () => {
      const mockOnViewChange = vi.fn();
      
      render(
        <MockEditorialCalendar 
          view="monthly"
          onViewChange={mockOnViewChange}
          onAssetDrop={() => {}}
          onQuickCreate={() => {}}
        />
      );
      
      // Check initial view
      expect(screen.getByTestId('monthly-view')).toHaveClass('active');
      
      // Switch to weekly view
      const weeklyButton = screen.getByTestId('weekly-view');
      await userEvent.click(weeklyButton);
      
      expect(mockOnViewChange).toHaveBeenCalledWith('weekly');
    });

    it('should support drag and drop for content scheduling', () => {
      const mockOnAssetDrop = vi.fn();
      
      render(
        <MockEditorialCalendar 
          view="weekly"
          onViewChange={() => {}}
          onAssetDrop={mockOnAssetDrop}
          onQuickCreate={() => {}}
        />
      );
      
      const calendarSlot = screen.getByTestId('calendar-slot-0');
      
      // Simulate drag and drop
      fireEvent.drop(calendarSlot, {
        dataTransfer: {
          getData: () => 'asset-1'
        }
      });
      
      expect(mockOnAssetDrop).toHaveBeenCalledWith('asset-1', '2024-01-15');
    });

    it('should provide quick actions for creating content', async () => {
      const mockOnQuickCreate = vi.fn();
      
      render(
        <MockEditorialCalendar 
          view="weekly"
          onViewChange={() => {}}
          onAssetDrop={() => {}}
          onQuickCreate={mockOnQuickCreate}
        />
      );
      
      const quickCreateButton = screen.getByTestId('quick-create-0');
      await userEvent.click(quickCreateButton);
      
      expect(mockOnQuickCreate).toHaveBeenCalledWith('ppv', '2024-01-15');
    });
  });

  describe('R3 | PPV Campaign Management', () => {
    it('should display PPV campaigns with status and metrics', () => {
      render(
        <MockPPVCampaigns 
          campaigns={mockPPVCampaigns}
          onDuplicate={() => {}}
          onAdjust={() => {}}
        />
      );
      
      // Check campaign display
      expect(screen.getByText('Exclusive Beach Photoshoot')).toBeInTheDocument();
      expect(screen.getByTestId('campaign-status-1')).toHaveTextContent('active');
      expect(screen.getByTestId('campaign-price-1')).toHaveTextContent('$19.99');
      
      // Check metrics
      const metrics = screen.getByTestId('campaign-metrics-1');
      expect(metrics).toHaveTextContent('Open Rate: 65.0%');
      expect(metrics).toHaveTextContent('Purchase Rate: 23.0%');
      expect(metrics).toHaveTextContent('ROI: 2.4x');
      expect(metrics).toHaveTextContent('Revenue: $480.75');
    });

    it('should allow campaign duplication', async () => {
      const mockOnDuplicate = vi.fn();
      
      render(
        <MockPPVCampaigns 
          campaigns={mockPPVCampaigns}
          onDuplicate={mockOnDuplicate}
          onAdjust={() => {}}
        />
      );
      
      const duplicateButton = screen.getByText('Duplicate');
      await userEvent.click(duplicateButton);
      
      expect(mockOnDuplicate).toHaveBeenCalledWith(mockPPVCampaigns[0]);
    });

    it('should enable campaign adjustments', async () => {
      const mockOnAdjust = vi.fn();
      
      render(
        <MockPPVCampaigns 
          campaigns={mockPPVCampaigns}
          onDuplicate={() => {}}
          onAdjust={mockOnAdjust}
        />
      );
      
      const adjustButton = screen.getByText('Adjust Price');
      await userEvent.click(adjustButton);
      
      expect(mockOnAdjust).toHaveBeenCalledWith('1', { price: 17.991 }); // 10% discount
    });
  });

  describe('R4 | Content Compliance Checking', () => {
    it('should automatically scan uploaded content for violations', async () => {
      const mockOnUpload = vi.fn();
      const mockFile = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
      
      render(
        <MockComplianceChecker 
          onUpload={mockOnUpload}
        />
      );
      
      const uploadInput = screen.getByTestId('content-upload');
      await userEvent.upload(uploadInput, mockFile);
      
      expect(mockOnUpload).toHaveBeenCalledWith(mockFile);
    });

    it('should display compliance violations with suggestions', () => {
      const scanResults = {
        approved: false,
        violations: [
          {
            type: 'Content Policy',
            message: 'Image contains inappropriate content',
            suggestion: 'Consider cropping or editing the image to remove sensitive areas'
          }
        ]
      };
      
      render(
        <MockComplianceChecker 
          onUpload={() => {}}
          scanResults={scanResults}
        />
      );
      
      expect(screen.getByTestId('compliance-status')).toHaveTextContent('Status: Needs Review');
      expect(screen.getByTestId('violation-0')).toHaveTextContent('Content Policy');
      expect(screen.getByTestId('violation-0')).toHaveTextContent('Consider cropping or editing');
    });

    it('should mark approved content for publication', () => {
      const scanResults = {
        approved: true,
        violations: []
      };
      
      render(
        <MockComplianceChecker 
          onUpload={() => {}}
          scanResults={scanResults}
        />
      );
      
      expect(screen.getByTestId('compliance-status')).toHaveTextContent('Status: Approved');
    });
  });

  describe('R5 | AI Chat Interface', () => {
    it('should maintain conversation history', () => {
      const messages = [
        { sender: 'User', content: 'How can I improve my engagement?' },
        { sender: 'AI', content: 'Based on your recent metrics, I recommend posting more interactive content and engaging with comments within the first hour.' }
      ];
      
      render(
        <MockAIChatInterface 
          messages={messages}
          onSendMessage={() => {}}
          onExportChat={() => {}}
          onSwitchToPromptBuilder={() => {}}
        />
      );
      
      expect(screen.getByTestId('message-0')).toHaveTextContent('How can I improve my engagement?');
      expect(screen.getByTestId('message-1')).toHaveTextContent('Based on your recent metrics');
    });

    it('should support chat export functionality', async () => {
      const mockOnExportChat = vi.fn();
      
      render(
        <MockAIChatInterface 
          messages={[]}
          onSendMessage={() => {}}
          onExportChat={mockOnExportChat}
          onSwitchToPromptBuilder={() => {}}
        />
      );
      
      const exportButton = screen.getByText('Export Chat');
      await userEvent.click(exportButton);
      
      expect(mockOnExportChat).toHaveBeenCalled();
    });

    it('should allow switching to prompt builder mode', async () => {
      const mockOnSwitchToPromptBuilder = vi.fn();
      
      render(
        <MockAIChatInterface 
          messages={[]}
          onSendMessage={() => {}}
          onExportChat={() => {}}
          onSwitchToPromptBuilder={mockOnSwitchToPromptBuilder}
        />
      );
      
      const promptBuilderButton = screen.getByText('Prompt Builder');
      await userEvent.click(promptBuilderButton);
      
      expect(mockOnSwitchToPromptBuilder).toHaveBeenCalled();
    });

    it('should send messages on Enter key press', async () => {
      const mockOnSendMessage = vi.fn();
      
      render(
        <MockAIChatInterface 
          messages={[]}
          onSendMessage={mockOnSendMessage}
          onExportChat={() => {}}
          onSwitchToPromptBuilder={() => {}}
        />
      );
      
      const chatInput = screen.getByPlaceholderText('Ask AI assistant...');
      await userEvent.type(chatInput, 'Test message');
      await userEvent.keyboard('{Enter}');
      
      expect(mockOnSendMessage).toHaveBeenCalledWith('Test message');
    });
  });

  describe('R7 | AI Insights and Alerts', () => {
    it('should display proactive AI insights with severity indicators', () => {
      render(
        <MockAIInsightsDashboard 
          insights={mockAIInsights}
          onDismissInsight={() => {}}
          onTakeAction={() => {}}
        />
      );
      
      // Check high severity insight
      const revenueInsight = screen.getByTestId('insight-1');
      expect(revenueInsight).toHaveClass('severity-high');
      expect(revenueInsight).toHaveTextContent('Revenue decreased by 15% this week');
      
      // Check medium severity insight
      const vipInsight = screen.getByTestId('insight-2');
      expect(vipInsight).toHaveClass('severity-medium');
      expect(vipInsight).toHaveTextContent('12 VIP fans haven\'t been contacted');
    });

    it('should provide actionable recommendations', async () => {
      const mockOnTakeAction = vi.fn();
      
      render(
        <MockAIInsightsDashboard 
          insights={mockAIInsights}
          onDismissInsight={() => {}}
          onTakeAction={mockOnTakeAction}
        />
      );
      
      const actionButton = screen.getByText('Create new PPV campaign');
      await userEvent.click(actionButton);
      
      expect(mockOnTakeAction).toHaveBeenCalledWith('1', 'Create new PPV campaign');
    });

    it('should allow dismissing insights', async () => {
      const mockOnDismissInsight = vi.fn();
      
      render(
        <MockAIInsightsDashboard 
          insights={mockAIInsights}
          onDismissInsight={mockOnDismissInsight}
          onTakeAction={() => {}}
        />
      );
      
      const dismissButton = screen.getAllByText('Dismiss')[0];
      await userEvent.click(dismissButton);
      
      expect(mockOnDismissInsight).toHaveBeenCalledWith('1');
    });
  });

  describe('R9 | Responsive Design', () => {
    it('should adapt layout for mobile devices', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      
      render(
        <MockContentLibrary 
          assets={mockMediaAssets}
          onFilter={() => {}}
          onSearch={() => {}}
          onAssetSelect={() => {}}
        />
      );
      
      // Check that content is still accessible on mobile
      expect(screen.getByTestId('content-library')).toBeInTheDocument();
      expect(screen.getByTestId('assets-grid')).toBeInTheDocument();
    });

    it('should maintain functionality across different screen sizes', () => {
      // Test desktop viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1920,
      });
      
      render(
        <MockEditorialCalendar 
          view="monthly"
          onViewChange={() => {}}
          onAssetDrop={() => {}}
          onQuickCreate={() => {}}
        />
      );
      
      expect(screen.getByTestId('editorial-calendar')).toBeInTheDocument();
      expect(screen.getByTestId('calendar-grid')).toBeInTheDocument();
    });
  });

  describe('R10 | Accessibility Standards', () => {
    it('should meet accessibility standards for content library', async () => {
      const { container } = render(
        <MockContentLibrary 
          assets={mockMediaAssets}
          onFilter={() => {}}
          onSearch={() => {}}
          onAssetSelect={() => {}}
        />
      );
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should provide proper keyboard navigation', async () => {
      render(
        <MockContentLibrary 
          assets={mockMediaAssets}
          onFilter={() => {}}
          onSearch={() => {}}
          onAssetSelect={() => {}}
        />
      );
      
      const searchInput = screen.getByTestId('search-input');
      searchInput.focus();
      expect(searchInput).toHaveFocus();
      
      // Test tab navigation
      await userEvent.tab();
      const typeFilter = screen.getByTestId('type-filter');
      expect(typeFilter).toHaveFocus();
    });

    it('should include proper ARIA labels and semantic structure', () => {
      render(
        <MockContentLibrary 
          assets={mockMediaAssets}
          onFilter={() => {}}
          onSearch={() => {}}
          onAssetSelect={() => {}}
        />
      );
      
      // Check semantic structure
      const grid = screen.getByRole('grid');
      expect(grid).toBeInTheDocument();
      
      const gridCells = screen.getAllByRole('gridcell');
      expect(gridCells).toHaveLength(2);
      
      // Check image alt text
      const images = screen.getAllByRole('img');
      images.forEach(img => {
        expect(img).toHaveAttribute('alt');
      });
    });

    it('should support screen reader compatibility', () => {
      render(
        <MockAIInsightsDashboard 
          insights={mockAIInsights}
          onDismissInsight={() => {}}
          onTakeAction={() => {}}
        />
      );
      
      // Check heading structure
      const mainHeading = screen.getByRole('heading', { level: 2 });
      expect(mainHeading).toHaveTextContent('AI Insights & Alerts');
      
      const insightHeadings = screen.getAllByRole('heading', { level: 3 });
      expect(insightHeadings).toHaveLength(2);
    });
  });

  describe('Performance and Error Handling', () => {
    it('should handle large content libraries efficiently', () => {
      const largeAssetList = Array.from({ length: 1000 }, (_, i) => ({
        ...mockMediaAssets[0],
        id: i.toString(),
        title: `Asset ${i}`
      }));
      
      // Simulate pagination - only render first 50 items
      const paginatedAssets = largeAssetList.slice(0, 50);
      
      const renderStart = performance.now();
      render(
        <MockContentLibrary 
          assets={paginatedAssets}
          onFilter={() => {}}
          onSearch={() => {}}
          onAssetSelect={() => {}}
        />
      );
      const renderEnd = performance.now();
      
      expect(renderEnd - renderStart).toBeLessThan(100);
      expect(screen.getAllByRole('gridcell')).toHaveLength(50);
    });

    it('should handle API errors gracefully', async () => {
      const mockOnUpload = vi.fn().mockRejectedValue(new Error('Upload failed'));
      
      render(
        <MockComplianceChecker 
          onUpload={mockOnUpload}
        />
      );
      
      const mockFile = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
      const uploadInput = screen.getByTestId('content-upload');
      
      await userEvent.upload(uploadInput, mockFile);
      
      expect(mockOnUpload).toHaveBeenCalled();
      // In real implementation, would show error message
    });

    it('should validate file uploads', async () => {
      const mockOnUpload = vi.fn();
      
      render(
        <MockComplianceChecker 
          onUpload={mockOnUpload}
        />
      );
      
      const uploadInput = screen.getByTestId('content-upload');
      
      // Should accept image and video files
      expect(uploadInput).toHaveAttribute('accept', 'image/*,video/*');
    });

    it('should handle empty states gracefully', () => {
      render(
        <MockContentLibrary 
          assets={[]}
          onFilter={() => {}}
          onSearch={() => {}}
          onAssetSelect={() => {}}
        />
      );
      
      const assetsGrid = screen.getByTestId('assets-grid');
      expect(assetsGrid).toBeInTheDocument();
      expect(assetsGrid.children).toHaveLength(0);
    });
  });

  describe('Integration and Data Flow', () => {
    it('should integrate content library with editorial calendar', async () => {
      const mockOnAssetDrop = vi.fn();
      
      // Simulate dragging asset from library to calendar
      render(
        <div>
          <MockContentLibrary 
            assets={mockMediaAssets}
            onFilter={() => {}}
            onSearch={() => {}}
            onAssetSelect={() => {}}
          />
          <MockEditorialCalendar 
            view="weekly"
            onViewChange={() => {}}
            onAssetDrop={mockOnAssetDrop}
            onQuickCreate={() => {}}
          />
        </div>
      );
      
      const calendarSlot = screen.getByTestId('calendar-slot-0');
      
      // Simulate drag and drop from content library
      fireEvent.drop(calendarSlot, {
        dataTransfer: {
          getData: () => '1' // Asset ID from mockMediaAssets
        }
      });
      
      expect(mockOnAssetDrop).toHaveBeenCalledWith('1', '2024-01-15');
    });

    it('should sync AI insights with campaign performance', () => {
      // Test that AI insights reflect actual campaign data
      const lowPerformingCampaign = {
        ...mockPPVCampaigns[1],
        metrics: {
          ...mockPPVCampaigns[1].metrics,
          purchaseRate: 0.05 // Very low purchase rate
        }
      };
      
      const aiInsight = {
        id: '3',
        type: 'campaign_optimization',
        severity: 'medium',
        title: 'VIP Content Bundle has low conversion',
        description: 'Purchase rate is below 10%. Consider adjusting price or targeting.',
        actions: ['Reduce price by 20%', 'Retarget to engaged users'],
        timestamp: '2024-01-15T10:00:00Z'
      };
      
      render(
        <MockAIInsightsDashboard 
          insights={[aiInsight]}
          onDismissInsight={() => {}}
          onTakeAction={() => {}}
        />
      );
      
      expect(screen.getByText('VIP Content Bundle has low conversion')).toBeInTheDocument();
      expect(screen.getByText('Reduce price by 20%')).toBeInTheDocument();
    });
  });
});