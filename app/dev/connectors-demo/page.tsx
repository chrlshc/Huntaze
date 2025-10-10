import Image from 'next/image';
import { HandCoins, CalendarRange, BarChart3, MessageSquare, Settings, Bell, Home as HomeIcon, Search } from 'lucide-react';
import ConnectorCard from '@/components/hz/ConnectorCard';

export default function ConnectorsDemoPage() {
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
            <h1>Connectors Demo</h1>

            {/* Horizontal flow example */}
            <section aria-labelledby="flowHorizontal" style={{ marginTop: 8 }}>
              <h2 id="flowHorizontal">Linear workflow</h2>
              <div className="hz-horizontal-flow">
                <div className="hz-step">
                  <div className="hz-step-line" />
                  <div style={{ width: 280 }}>
                    <ConnectorCard
                      title="Import"
                      description="Import your data."
                      status="connected"
                      actions={[{ label: 'Import', href: '#', primary: true }]}
                    />
                  </div>
                </div>

                <div className="hz-step">
                  <div className="hz-step-line" />
                  <div style={{ width: 280 }}>
                    <ConnectorCard
                      title="Configure"
                      description="Define settings."
                      status="attention"
                      actions={[{ label: 'Configure', href: '#', primary: true }]}
                    />
                  </div>
                </div>

                <div className="hz-step">
                  <div style={{ width: 280 }}>
                    <ConnectorCard
                      title="Validate"
                      description="Test & activate."
                      status="error"
                      statusText="Action required"
                      actions={[{ label: 'Validate', href: '#', primary: true }]}
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Vertical flow example */}
            <section aria-labelledby="flowVertical" style={{ marginTop: 32 }}>
              <h2 id="flowVertical">Checklist</h2>
              <div className="hz-vertical-flow">
                <div className="hz-connector">
                  <span className="hz-marker done" />
                  <div style={{ maxWidth: 420 }}>
                    <ConnectorCard
                      title="Analytics"
                      description="Surface MRR & churn."
                      status="connected"
                      actions={[{ label: 'Open', href: '#' }]}
                    />
                  </div>
                </div>

                <div className="hz-connector">
                  <span className="hz-marker pending" />
                  <div style={{ maxWidth: 420 }}>
                    <ConnectorCard
                      title="Campaigns"
                      description="Plan messages."
                      status="attention"
                      statusText="Not connected"
                      actions={[{ label: 'Connect', href: '#', primary: true }]}
                    />
                  </div>
                </div>

                <div className="hz-connector">
                  <span className="hz-marker error" />
                  <div style={{ maxWidth: 420 }}>
                    <ConnectorCard
                      title="Payments"
                      description="Configure payouts."
                      status="error"
                      actions={[{ label: 'Configure', href: '#' }]}
                    />
                  </div>
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
