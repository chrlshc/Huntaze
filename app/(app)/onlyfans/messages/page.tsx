'use client';

/**
 * OnlyFans Messages Page
 *
 * Full-screen, 3-column messaging layout using the MessagingInterface component.
 * Provides conversation list, active chat, and fan context panel.
 */

import { ContentPageErrorBoundary } from '@/components/dashboard/ContentPageErrorBoundary';
import { MessagingInterface } from '../../../../components/messages/MessagingInterface';
import { useEffect, Suspense } from 'react';
import { ENABLE_MOCK_DATA } from '@/lib/config/mock-data';
import { EmptyState } from '@/components/ui/EmptyState';

function MessagingPageContent() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, flex: '1 1 auto' }}>
      <MessagingInterface />
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
  if (!ENABLE_MOCK_DATA) {
    return (
      <div className="p-6">
        <EmptyState
          variant="no-data"
          title="Messages aren’t available yet"
          description="This screen currently uses demo data and is disabled outside demo mode."
        />
      </div>
    );
  }

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

  return (
    <ContentPageErrorBoundary pageName="OnlyFans Messages">
      <Suspense fallback={<MessagingLoadingFallback />}>
        <MessagingPageContent />
      </Suspense>
    </ContentPageErrorBoundary>
  );
}
