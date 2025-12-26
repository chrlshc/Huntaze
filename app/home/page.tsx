import { HandCoins, CalendarRange, BarChart3, MessageSquare, Settings, Bell, Home as HomeIcon, Search } from 'lucide-react';
import Image from 'next/image';
import ConnectorGraph, { type NodeDef, type LinkDef } from '@/components/hz/ConnectorGraph';
import SectionExplainer from '@/components/hz/SectionExplainer';

export default function HomePage() {
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

        {/* Contenu */}
        <main className="hz-main" role="main">
          <div className="hz-page">
            <h1>Welcome to Huntaze</h1>

            {/* 2 cartes “héros” */}
            <section className="hz-grid-hero">
              <article className="hz-card hz-card--hero">
                <h2>Revenue Snapshot</h2>
                <div className="hz-card__footer hz-actions">
                  <a className="hz-button primary" href="/analytics">Connect Analytics</a>
                </div>
              </article>

              <article className="hz-card hz-card--hero">
                <h2>Today's Priorities</h2>
                <div className="hz-card__footer hz-actions">
                  <a className="hz-button" href="/dashboard/onlyfans">Open Queue</a>
                </div>
              </article>
            </section>

            {/* Connected overview graph (varied layout) */}
            {(() => {
              const nodes: NodeDef[] = [
                { id: 'hub', title: 'Home', x: 50, y: 42 },
                { id: 'analytics', title: 'Analytics', statusUrl: '/api/analytics/overview', x: 18, y: 26, connectHref: '/analytics' },
                { id: 'campaigns', title: 'Campaigns', x: 82, y: 26, connectHref: '/campaigns' },
                { id: 'payments', title: 'Payments', x: 50, y: 82, connectHref: '/billing' },
              ];
              const links: LinkDef[] = [
                { from: 'hub', to: 'analytics' },
                { from: 'hub', to: 'campaigns' },
                { from: 'hub', to: 'payments' },
              ];
              return <ConnectorGraph nodes={nodes} links={links} hideStatus cardWidth={220} />;
            })()}

            <SectionExplainer
              title="Start Here Each Morning"
              description="Home gathers the revenue snapshot, priority queue, and connector health so you can spot blockers before diving deeper."
              actionLabel="Review today's playbook"
            />

            {/* Cards removed per request */}
          </div>
        </main>
      </div>
    </div>
  );
}
