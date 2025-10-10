import ConnectorGraph, { type NodeDef, type LinkDef } from '@/components/hz/ConnectorGraph';
import SectionExplainer from '@/components/hz/SectionExplainer';
import Image from 'next/image';
import { HandCoins, CalendarRange, BarChart3, MessageSquare, Settings, Bell, Home as HomeIcon, Search } from 'lucide-react';

export default function OnlyFansAssistedPage() {
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
            <h1>OnlyFans Assisted</h1>

            {(() => {
              const nodes: NodeDef[] = [
                { id: 'hub', title: 'OnlyFans Assisted', x: 50, y: 42 },
                {
                  id: 'smart',
                  title: 'Smart replies',
                  statusUrl: '/api/integrations/onlyfans/status',
                  connectHref: '/of-connect',
                  connectLabel: 'Connect OnlyFans',
                  x: 18,
                  y: 26,
                },
                {
                  id: 'mass',
                  title: 'Mass messaging',
                  statusUrl: '/api/integrations/onlyfans/status',
                  connectHref: '/of-connect',
                  connectLabel: 'Connect OnlyFans',
                  x: 82,
                  y: 26,
                },
                {
                  id: 'compliance',
                  title: 'Compliance',
                  statusUrl: '/api/integrations/onlyfans/status',
                  connectHref: '/of-connect',
                  connectLabel: 'Connect OnlyFans',
                  x: 50,
                  y: 82,
                },
              ];
              const links: LinkDef[] = [
                { from: 'hub', to: 'smart' },
                { from: 'hub', to: 'mass' },
                { from: 'hub', to: 'compliance' },
              ];
              return <ConnectorGraph nodes={nodes} links={links} hideStatus cardWidth={220} />;
            })()}

            <SectionExplainer
              title="Scale Creator Messaging"
              description="OnlyFans Assisted handles smart replies, mass outreach, and compliance guardrails together so managers can focus on growth plays instead of manual follow-ups."
              actionLabel="Customize assistant flows"
              actionHref="/of-connect"
            />

            {/* Cards removed per request */}
          </div>
        </main>
      </div>
    </div>
  );
}
