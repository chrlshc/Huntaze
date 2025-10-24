import { test, expect, Page } from '@playwright/test';

test.describe('Content Creation User Journeys', () => {
  let page: Page;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    
    // Mock API responses
    await page.route('**/api/auth/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: { id: 'user1', name: 'Test Creator', role: 'creator' },
          token: 'mock-jwt-token',
        }),
      });
    });

    await page.route('**/api/content-ideas/generate', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            ideas: [
              {
                id: 'idea1',
                title: 'Morning Workout Routine',
                description: 'High-energy morning workout to start your day',
                category: 'video',
                tags: ['fitness', 'morning', 'workout'],
                difficulty: 'medium',
                estimatedEngagement: 85,
                trendScore: 75,
              },
            ],
            recommendations: ['Focus on morning content', 'Use motivational tone'],
            nextSteps: ['Schedule for 7 AM', 'Prepare equipment'],
          },
        }),
      });
    });

    await page.route('**/api/media/upload', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'asset1',
          url: '/uploads/workout-video.mp4',
          type: 'video',
          status: 'processed',
        }),
      });
    });

    await page.route('**/api/schedule', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'schedule1',
          status: 'scheduled',
          scheduledFor: '2024-02-01T07:00:00Z',
        }),
      });
    });

    // Navigate to content creation dashboard
    await page.goto('/dashboard/content-creation');
    await page.waitForLoadState('networkidle');
  });

  test('Creator can generate content ideas with AI assistance @smoke', async () => {
    // Step 1: Access AI content generator
    await expect(page.locator('h1')).toContainText('Content Creation');
    
    const generateButton = page.locator('[data-testid="generate-ideas-btn"]');
    await expect(generateButton).toBeVisible();
    await generateButton.click();

    // Step 2: Fill creator profile information
    await page.fill('[data-testid="niche-input"]', 'fitness, lifestyle');
    await page.selectOption('[data-testid="content-type-select"]', 'video');
    await page.fill('[data-testid="audience-preferences"]', 'motivation, workout tips');

    // Step 3: Set generation options
    await page.selectOption('[data-testid="focus-area-select"]', 'trending');
    await page.fill('[data-testid="idea-count"]', '5');

    // Step 4: Generate ideas
    const submitButton = page.locator('[data-testid="submit-generation"]');
    await submitButton.click();

    // Step 5: Verify loading state
    await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible();
    await expect(page.locator('text=Generating content ideas...')).toBeVisible();

    // Step 6: Verify results
    await expect(page.locator('[data-testid="generated-ideas"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="idea-card"]')).toHaveCount(1);
    
    const ideaCard = page.locator('[data-testid="idea-card"]').first();
    await expect(ideaCard.locator('h3')).toContainText('Morning Workout Routine');
    await expect(ideaCard.locator('[data-testid="engagement-score"]')).toContainText('85%');
    await expect(ideaCard.locator('[data-testid="trend-score"]')).toContainText('75%');

    // Step 7: Verify recommendations
    await expect(page.locator('[data-testid="recommendations"]')).toBeVisible();
    await expect(page.locator('text=Focus on morning content')).toBeVisible();
    await expect(page.locator('text=Use motivational tone')).toBeVisible();
  });

  test('Creator can upload and manage media assets', async () => {
    // Navigate to media library
    await page.click('[data-testid="media-library-tab"]');
    await expect(page.locator('h2')).toContainText('Media Library');

    // Upload new asset
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'workout-video.mp4',
      mimeType: 'video/mp4',
      buffer: Buffer.from('mock video content'),
    });

    // Verify upload progress
    await expect(page.locator('[data-testid="upload-progress"]')).toBeVisible();
    await expect(page.locator('text=Uploading...')).toBeVisible();

    // Verify successful upload
    await expect(page.locator('[data-testid="asset-card"]')).toBeVisible({ timeout: 15000 });
    
    const assetCard = page.locator('[data-testid="asset-card"]').first();
    await expect(assetCard.locator('[data-testid="asset-type"]')).toContainText('video');
    await expect(assetCard.locator('[data-testid="asset-status"]')).toContainText('processed');

    // Test asset actions
    await assetCard.hover();
    await expect(assetCard.locator('[data-testid="edit-asset-btn"]')).toBeVisible();
    await expect(assetCard.locator('[data-testid="delete-asset-btn"]')).toBeVisible();
    await expect(assetCard.locator('[data-testid="use-asset-btn"]')).toBeVisible();

    // Edit asset metadata
    await assetCard.locator('[data-testid="edit-asset-btn"]').click();
    await expect(page.locator('[data-testid="asset-edit-modal"]')).toBeVisible();
    
    await page.fill('[data-testid="asset-title"]', 'Morning Workout Video');
    await page.fill('[data-testid="asset-description"]', 'High-energy workout routine');
    await page.fill('[data-testid="asset-tags"]', 'fitness, workout, morning');
    
    await page.click('[data-testid="save-asset-btn"]');
    await expect(page.locator('[data-testid="asset-edit-modal"]')).not.toBeVisible();
  });

  test('Creator can schedule content across multiple platforms', async () => {
    // Navigate to scheduler
    await page.click('[data-testid="scheduler-tab"]');
    await expect(page.locator('h2')).toContainText('Content Scheduler');

    // Create new scheduled post
    await page.click('[data-testid="new-schedule-btn"]');
    await expect(page.locator('[data-testid="schedule-modal"]')).toBeVisible();

    // Select content and media
    await page.selectOption('[data-testid="content-idea-select"]', 'idea1');
    await page.selectOption('[data-testid="media-asset-select"]', 'asset1');

    // Configure caption and hashtags
    await page.fill('[data-testid="caption-input"]', 'Start your day strong! 💪 Here\'s my go-to morning routine');
    await page.fill('[data-testid="hashtags-input"]', '#fitness #morning #workout #motivation');

    // Select platforms
    await page.check('[data-testid="platform-instagram"]');
    await page.check('[data-testid="platform-tiktok"]');
    await page.check('[data-testid="platform-twitter"]');

    // Set schedule time
    await page.fill('[data-testid="schedule-date"]', '2024-02-01');
    await page.fill('[data-testid="schedule-time"]', '07:00');

    // Preview content
    await page.click('[data-testid="preview-btn"]');
    await expect(page.locator('[data-testid="content-preview"]')).toBeVisible();
    
    // Verify preview for each platform
    await expect(page.locator('[data-testid="instagram-preview"]')).toBeVisible();
    await expect(page.locator('[data-testid="tiktok-preview"]')).toBeVisible();
    await expect(page.locator('[data-testid="twitter-preview"]')).toBeVisible();

    // Schedule content
    await page.click('[data-testid="schedule-submit-btn"]');
    
    // Verify success
    await expect(page.locator('[data-testid="schedule-success"]')).toBeVisible();
    await expect(page.locator('text=Content scheduled successfully')).toBeVisible();

    // Verify in calendar view
    await page.click('[data-testid="calendar-view-btn"]');
    await expect(page.locator('[data-testid="calendar"]')).toBeVisible();
    await expect(page.locator('[data-testid="scheduled-item"]')).toBeVisible();
  });

  test('Creator can collaborate with team members in real-time', async () => {
    // Navigate to collaboration workspace
    await page.click('[data-testid="collaboration-tab"]');
    await expect(page.locator('h2')).toContainText('Team Collaboration');

    // Start collaborative editing session
    await page.click('[data-testid="new-collaboration-btn"]');
    await page.fill('[data-testid="session-name"]', 'Morning Content Planning');
    await page.click('[data-testid="start-session-btn"]');

    // Verify collaboration interface
    await expect(page.locator('[data-testid="collaboration-workspace"]')).toBeVisible();
    await expect(page.locator('[data-testid="team-members-panel"]')).toBeVisible();
    await expect(page.locator('[data-testid="chat-panel"]')).toBeVisible();

    // Simulate team member joining
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('team-member-joined', {
        detail: { userId: 'user2', name: 'Team Member', avatar: '/avatar2.jpg' }
      }));
    });

    await expect(page.locator('[data-testid="member-user2"]')).toBeVisible();
    await expect(page.locator('text=Team Member joined the session')).toBeVisible();

    // Test real-time editing
    await page.fill('[data-testid="collaborative-caption"]', 'Collaborative caption edit');
    
    // Simulate receiving changes from team member
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('content-updated', {
        detail: { 
          field: 'hashtags', 
          value: '#teamwork #collaboration #content',
          userId: 'user2',
          userName: 'Team Member'
        }
      }));
    });

    await expect(page.locator('[data-testid="hashtags-input"]')).toHaveValue('#teamwork #collaboration #content');
    await expect(page.locator('text=Updated by Team Member')).toBeVisible();

    // Test chat functionality
    await page.fill('[data-testid="chat-input"]', 'Great idea for the morning content!');
    await page.press('[data-testid="chat-input"]', 'Enter');
    
    await expect(page.locator('[data-testid="chat-message"]').last()).toContainText('Great idea for the morning content!');

    // Test conflict resolution
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('edit-conflict', {
        detail: { 
          field: 'caption',
          conflictingChanges: [
            { userId: 'user1', value: 'Version A' },
            { userId: 'user2', value: 'Version B' }
          ]
        }
      }));
    });

    await expect(page.locator('[data-testid="conflict-resolution-modal"]')).toBeVisible();
    await page.click('[data-testid="resolve-conflict-merge"]');
    await expect(page.locator('[data-testid="conflict-resolution-modal"]')).not.toBeVisible();
  });

  test('Creator can analyze content performance and get AI insights', async () => {
    // Navigate to analytics
    await page.click('[data-testid="analytics-tab"]');
    await expect(page.locator('h2')).toContainText('Content Analytics');

    // Verify dashboard overview
    await expect(page.locator('[data-testid="total-views"]')).toBeVisible();
    await expect(page.locator('[data-testid="engagement-rate"]')).toBeVisible();
    await expect(page.locator('[data-testid="revenue-generated"]')).toBeVisible();

    // Test performance charts
    await expect(page.locator('[data-testid="engagement-chart"]')).toBeVisible();
    await expect(page.locator('[data-testid="revenue-chart"]')).toBeVisible();

    // Filter by date range
    await page.click('[data-testid="date-filter"]');
    await page.click('[data-testid="last-30-days"]');
    
    // Verify charts update
    await expect(page.locator('[data-testid="chart-loading"]')).toBeVisible();
    await expect(page.locator('[data-testid="chart-loading"]')).not.toBeVisible({ timeout: 5000 });

    // View top performing content
    await page.click('[data-testid="top-content-tab"]');
    await expect(page.locator('[data-testid="top-content-list"]')).toBeVisible();
    
    const topContentItem = page.locator('[data-testid="content-item"]').first();
    await expect(topContentItem.locator('[data-testid="content-title"]')).toBeVisible();
    await expect(topContentItem.locator('[data-testid="engagement-score"]')).toBeVisible();
    await expect(topContentItem.locator('[data-testid="revenue-amount"]')).toBeVisible();

    // Get AI insights
    await page.click('[data-testid="ai-insights-btn"]');
    await expect(page.locator('[data-testid="ai-insights-panel"]')).toBeVisible();
    
    // Verify AI recommendations
    await expect(page.locator('[data-testid="insight-recommendation"]')).toHaveCount.greaterThan(0);
    await expect(page.locator('text=Based on your content performance')).toBeVisible();

    // Test insight actions
    const firstInsight = page.locator('[data-testid="insight-recommendation"]').first();
    await firstInsight.locator('[data-testid="apply-insight-btn"]').click();
    
    await expect(page.locator('[data-testid="insight-applied-success"]')).toBeVisible();
  });

  test('Creator can handle errors and recover gracefully', async () => {
    // Test network error handling
    await page.route('**/api/content-ideas/generate', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' }),
      });
    });

    // Attempt to generate content
    await page.click('[data-testid="generate-ideas-btn"]');
    await page.fill('[data-testid="niche-input"]', 'fitness');
    await page.click('[data-testid="submit-generation"]');

    // Verify error handling
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('text=Failed to generate content ideas')).toBeVisible();
    await expect(page.locator('[data-testid="retry-btn"]')).toBeVisible();

    // Test retry functionality
    await page.route('**/api/content-ideas/generate', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { ideas: [], recommendations: [], nextSteps: [] },
        }),
      });
    });

    await page.click('[data-testid="retry-btn"]');
    await expect(page.locator('[data-testid="error-message"]')).not.toBeVisible();

    // Test offline handling
    await page.context().setOffline(true);
    
    await page.click('[data-testid="media-library-tab"]');
    await expect(page.locator('[data-testid="offline-message"]')).toBeVisible();
    await expect(page.locator('text=You are currently offline')).toBeVisible();

    // Test recovery when back online
    await page.context().setOffline(false);
    await page.waitForTimeout(1000); // Wait for reconnection
    
    await expect(page.locator('[data-testid="offline-message"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="online-indicator"]')).toBeVisible();
  });

  test('Creator workflow is accessible and keyboard navigable', async () => {
    // Test keyboard navigation
    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid="generate-ideas-btn"]')).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid="media-library-tab"]')).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid="scheduler-tab"]')).toBeFocused();

    // Test screen reader support
    const generateButton = page.locator('[data-testid="generate-ideas-btn"]');
    await expect(generateButton).toHaveAttribute('aria-label', 'Generate content ideas with AI');

    // Test high contrast mode
    await page.emulateMedia({ colorScheme: 'dark' });
    await expect(page.locator('body')).toHaveClass(/dark-theme/);

    // Test reduced motion
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.click('[data-testid="generate-ideas-btn"]');
    
    // Animations should be disabled
    const modal = page.locator('[data-testid="generation-modal"]');
    await expect(modal).toHaveCSS('animation-duration', '0s');
  });

  test('Creator can work efficiently on mobile devices', async () => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Verify mobile layout
    await expect(page.locator('[data-testid="mobile-nav"]')).toBeVisible();
    await expect(page.locator('[data-testid="desktop-nav"]')).not.toBeVisible();

    // Test mobile navigation
    await page.click('[data-testid="mobile-menu-btn"]');
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();

    await page.click('[data-testid="mobile-content-creation"]');
    await expect(page.locator('h1')).toContainText('Content Creation');

    // Test touch interactions
    await page.tap('[data-testid="generate-ideas-btn"]');
    await expect(page.locator('[data-testid="generation-form"]')).toBeVisible();

    // Test mobile-optimized forms
    await page.fill('[data-testid="niche-input"]', 'fitness');
    await page.tap('[data-testid="submit-generation"]');

    // Verify mobile-friendly loading state
    await expect(page.locator('[data-testid="mobile-loading"]')).toBeVisible();

    // Test swipe gestures for media carousel
    const mediaCarousel = page.locator('[data-testid="media-carousel"]');
    await mediaCarousel.hover();
    
    // Simulate swipe left
    await page.mouse.down();
    await page.mouse.move(-100, 0);
    await page.mouse.up();

    // Verify carousel moved
    await expect(page.locator('[data-testid="carousel-item-2"]')).toBeVisible();
  });
});