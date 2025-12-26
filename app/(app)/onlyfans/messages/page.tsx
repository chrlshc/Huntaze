'use client';

/**
 * OnlyFans Messages Page
 *
 * Full-screen, 3-column messaging layout.
 * Uses OFMessagingInterface (scraper backend) or MessagingInterface (legacy)
 */

import { ContentPageErrorBoundary } from '@/components/dashboard/ContentPageErrorBoundary';
import { OFMessagingInterface } from '@/components/messages/OFMessagingInterface';
import { MessagingInterface } from '@/components/messages/MessagingInterface';
import { ShopifyConnectionCard, ConnectionIllustration } from '@/components/ui/shopify/ShopifyConnectionCard';
import '@/components/ui/shopify/ShopifyConnectionCard.css';
import { useIntegrations } from '@/hooks/useIntegrations';
import { useEffect, Suspense, useState, useMemo } from 'react';
import { MessageCircle } from 'lucide-react';

// Feature flag - set to true to use the new scraper-backed system
const USE_OF_SCRAPER_BACKEND = true;

function MessagingPageContent() {
  const [useNewBackend, setUseNewBackend] = useState(USE_OF_SCRAPER_BACKEND);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, flex: '1 1 auto' }}>
      {/* Dev toggle - remove in production */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-yellow-100 border-b border-yellow-300 px-4 py-1 text-xs flex items-center gap-2">
          <span>Backend:</span>
          <button
            onClick={() => setUseNewBackend(false)}
            className={`px-2 py-0.5 rounded ${!useNewBackend ? 'bg-yellow-500 text-white' : 'bg-white'}`}
          >
            Legacy
          </button>
          <button
            onClick={() => setUseNewBackend(true)}
            className={`px-2 py-0.5 rounded ${useNewBackend ? 'bg-green-500 text-white' : 'bg-white'}`}
          >
            OF Scraper
          </button>
        </div>
      )}
      
      {useNewBackend ? <OFMessagingInterface /> : <MessagingInterface />}
    </div>
  );
}

function MessagingLoadingFallback() {
  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '100%', 
      minHeight: 'calc(100vh - 64px)',
      backgroundColor: '#f5f5f5'
    }}>
      <div style={{ textAlign: 'center', color: '#666' }}>
        <div style={{ 
          width: 40, 
          height: 40, 
          border: '3px solid #e0e0e0', 
          borderTopColor: '#333', 
          borderRadius: '50%', 
          animation: 'spin 1s linear infinite',
          margin: '0 auto 16px'
        }} />
        <p>Loading messages...</p>
      </div>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default function OnlyFansMessagesPage() {
  const { integrations, loading: integrationsLoading } = useIntegrations();
  
  // Check if OnlyFans is connected
  const isOnlyFansConnected = useMemo(() => {
    return integrations.some(
      (integration) => integration.provider === 'onlyfans' && integration.isConnected
    );
  }, [integrations]);

  useEffect(() => {
    const className = 'onlyfans-messages-page';
    document.documentElement.classList.add(className);
    document.body.classList.add(className);

    // Ensure the dashboard main scroll position doesn't carry over from
    // the previous page (this page uses internal panel scrolling).
    const main = document.getElementById('main-content');
    main?.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });

    return () => {
      document.documentElement.classList.remove(className);
      document.body.classList.remove(className);
    };
  }, []);

  // Show connection card if OnlyFans is not connected
  if (!integrationsLoading && !isOnlyFansConnected) {
    return (
      <ContentPageErrorBoundary pageName="OnlyFans Messages">
        <div className="polaris-analytics" style={{ padding: '24px' }}>
          <div className="page-header" style={{ marginBottom: '24px' }}>
            <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MessageCircle size={24} /> Messages
            </h1>
            <p className="page-meta">Manage your OnlyFans conversations</p>
          </div>

          <ShopifyConnectionCard
            illustration={<ConnectionIllustration type="message" />}
            title="Connect OnlyFans to manage messages"
            description="Link your OnlyFans account to sync and manage your conversations."
            actionLabel="Go to integrations"
            actionHref="/integrations"
            secondaryLabel="Learn more about messaging"
            secondaryHref="/docs/messages"
          />
        </div>
      </ContentPageErrorBoundary>
    );
  }

  return (
    <ContentPageErrorBoundary pageName="OnlyFans Messages">
      <Suspense fallback={<MessagingLoadingFallback />}>
        <MessagingPageContent />
      </Suspense>
    </ContentPageErrorBoundary>
  );
}
