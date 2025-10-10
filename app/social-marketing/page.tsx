import ConnectorGraph, { type NodeDef, type LinkDef } from '@/components/hz/ConnectorGraph';
import SectionExplainer from '@/components/hz/SectionExplainer';
import Image from 'next/image';
import { HandCoins, CalendarRange, BarChart3, MessageSquare, Settings, Bell, Home as HomeIcon, Search } from 'lucide-react';

export default function SocialMarketingPage() {
  return (
    <div className="hz" data-theme="light">
      <div className="hz-app">
        {/* Sidebar */}
        <aside className="hz-sidebar">
          <nav className="hz-sidebar-nav" aria-label="Primary navigation">
            <a className="hz-nav-item" href="/home"><HomeIcon className="hz-icon"/> Home</a>
            <a className="hz-nav-item" href="/onlyfans-assisted"><HandCoins className="hz-icon"/> OnlyFans Assisted</a>
            <a className="hz-nav-item" href="/social-marketing"><CalendarRange className="hz-icon"/> Social Marketing</a>
            <a className="hz-nav-item" href="/analytics"><BarChart3 className="hz-icon"/> Analytics</a>
            <a className="hz-nav-item" href="/cinai"><MessageSquare className="hz-icon"/> CIN AI</a>
          </nav>
          <div className="hz-sidebar-footer">
            <nav aria-label="Secondary navigation">
              <a className="hz-nav-item" href="/account"><Settings className="hz-icon"/> Settings</a>
            </nav>
          </div>
        </aside>

        {/* Topbar */}
        <header className="hz-topbar" role="banner">
          <div className="hz-brand">
            <Image src="/logos/huntaze.svg" alt="Huntaze" width={120} height={24} />
          </div>
          <div className="hz-search">
            <div className="hz-searchbar">
              <Search className="hz-search-icon" aria-hidden />
              <input placeholder="Search" aria-label="Search" />
              <kbd className="hz-kbd">/</kbd>
            </div>
          </div>
          <div className="hz-actions">
            <button className="hz-button" aria-label="Notifications"><Bell className="hz-icon"/></button>
            <a className="hz-user" href="/account">
              <span className="hz-avatar" aria-hidden />
              <span>Alex Doe</span>
            </a>
          </div>
        </header>

        {/* Content */}
        <main className="hz-main" role="main">
          <div className="hz-page">
            <h1>Social Marketing</h1>

            {/* Connected visual graph */}
            {(() => {
              const nodes: NodeDef[] = [
                { id: 'hub', title: 'Social Marketing', x: 50, y: 42 },
                { id: 'instagram', title: 'Instagram', statusUrl: '/api/social/instagram/status', connectHref: '/auth/instagram', x: 18, y: 26 },
                { id: 'tiktok', title: 'TikTok', statusUrl: '/api/social/tiktok/status', connectHref: '/auth/tiktok', x: 82, y: 26 },
                { id: 'reddit', title: 'Reddit', statusUrl: '/api/social/reddit/status', connectHref: '/auth/reddit', x: 50, y: 82 },
              ];
              const links: LinkDef[] = [
                { from: 'hub', to: 'instagram' },
                { from: 'hub', to: 'tiktok' },
                { from: 'hub', to: 'reddit' },
              ];
              return <ConnectorGraph nodes={nodes} links={links} hideStatus cardWidth={220} />;
            })()}

            <SectionExplainer
              title="Grow Reach Without Guesswork"
              description="Social Marketing lines up Instagram, TikTok, and Reddit scheduling in one board so every launch stays paced with fresh content and status updates."
              actionLabel="Plan my next campaign"
              actionHref="/campaigns/new"
            />

            {/* Social media cards removed per request */}
          </div>
        </main>
      </div>
    </div>
  );
}
