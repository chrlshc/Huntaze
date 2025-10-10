import Image from 'next/image';
import ConnectorGraph, { type LinkDef, type NodeDef } from '@/components/hz/ConnectorGraph';
import SectionExplainer from '@/components/hz/SectionExplainer';
import { HandCoins, CalendarRange, BarChart3, MessageSquare, Settings, Bell, Home as HomeIcon, Search } from 'lucide-react';

export default function AnalyticsPage() {
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
            <h1>Analytics</h1>

            {(() => {
              const nodes: NodeDef[] = [
                { id: 'hub', title: 'Analytics', x: 50, y: 42 },
                { id: 'overview', title: 'Overview', statusUrl: '/api/analytics/overview', x: 18, y: 26 },
                { id: 'acquisition', title: 'Acquisition', statusUrl: '/api/analytics/overview', x: 82, y: 26 },
                { id: 'revenue', title: 'Revenue', statusUrl: '/api/analytics/overview', x: 50, y: 82 },
              ];
              const links: LinkDef[] = [
                { from: 'hub', to: 'overview' },
                { from: 'hub', to: 'acquisition' },
                { from: 'hub', to: 'revenue' },
              ];
              return <ConnectorGraph nodes={nodes} links={links} hideStatus cardWidth={220} />;
            })()}

            <SectionExplainer
              title="Trust the Numbers"
              description="Analytics blends acquisition, engagement, and revenue views into a single workspace so you can turn channel performance into next steps faster."
              actionLabel="Open performance reports"
            />

            {/* Cards removed per request */}
          </div>
        </main>
      </div>
    </div>
  );
}
