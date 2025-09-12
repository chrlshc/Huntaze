'use client'

import React from 'react'
import { motion } from 'framer-motion'

export default function AppMockupSection() {
  return (
    <section className="relative bg-black py-20 px-4 overflow-hidden">
      <div className="mx-auto max-w-7xl">
        {/* Section Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 tracking-tight">
            Your AI-powered command center
          </h2>
          <p className="text-lg md:text-xl text-white/80 max-w-3xl mx-auto mb-8">
            Everything you need to manage, automate, and scale your creator business in one powerful platform
          </p>
          
          {/* Video Demo Link */}
          <button className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 font-medium group">
            <svg 
              className="w-5 h-5" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Watch 2-min demo</span>
            <span className="transition-transform group-hover:translate-x-1">→</span>
          </button>
        </motion.div>

        {/* Browser Mockup */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
          className="relative mx-auto max-w-6xl"
        >
          <div className="browser-mockup">
            {/* Browser Chrome */}
            <div className="browser-toolbar">
              <div className="browser-buttons">
                <div className="browser-button red"></div>
                <div className="browser-button yellow"></div>
                <div className="browser-button green"></div>
              </div>
              <div className="browser-url">🔒 huntaze.app/dashboard</div>
            </div>

            {/* App Interface */}
            <div className="app-content">
              {/* Sidebar */}
              <div className="app-sidebar">
                <div className="logo">
                  <div className="logo-icon">H</div>
                  <span>Huntaze</span>
                </div>
                <nav className="nav-items">
                  <div className="nav-item active">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    <span>Dashboard</span>
                  </div>
                  <div className="nav-item">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    <span>Conversations</span>
                    <span className="badge">147</span>
                  </div>
                  <div className="nav-item">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                    <span>Content</span>
                  </div>
                  <div className="nav-item">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <span>Analytics</span>
                  </div>
                  <div className="nav-item">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Revenue</span>
                  </div>
                </nav>
              </div>

              {/* Main Content */}
              <div className="main-content">
                <div className="content-header">
                  <div>
                    <h2>AI Conversation Manager</h2>
                    <p>147 active conversations · 89% AI automated</p>
                  </div>
                  <button className="action-btn">New Campaign</button>
                </div>

                {/* Conversations Grid */}
                <div className="conversations-grid">
                  <div className="conversation-card">
                    <div className="conversation-header">
                      <div className="user-avatar">JD</div>
                      <div className="user-info">
                        <h4>Jessica Davis</h4>
                        <span className="status">AI Responding</span>
                      </div>
                      <div className="conversation-meta">
                        <span className="revenue">$147</span>
                        <span className="time">2m ago</span>
                      </div>
                    </div>
                    <div className="conversation-preview">
                      "Hey! I loved your latest post about..."
                    </div>
                    <div className="ai-suggestion">
                      <span className="ai-label">AI Suggestion:</span>
                      <p>Thank them and suggest premium content package</p>
                    </div>
                  </div>

                  <div className="conversation-card">
                    <div className="conversation-header">
                      <div className="user-avatar">MR</div>
                      <div className="user-info">
                        <h4>Mike Roberts</h4>
                        <span className="status">Human Review</span>
                      </div>
                      <div className="conversation-meta">
                        <span className="revenue">$298</span>
                        <span className="time">5m ago</span>
                      </div>
                    </div>
                    <div className="conversation-preview">
                      "Can we discuss a custom package?"
                    </div>
                    <div className="ai-suggestion warning">
                      <span className="ai-label">Action Required:</span>
                      <p>High-value conversation needs human input</p>
                    </div>
                  </div>

                  <div className="conversation-card">
                    <div className="conversation-header">
                      <div className="user-avatar">ST</div>
                      <div className="user-info">
                        <h4>Sarah Thompson</h4>
                        <span className="status">Converted</span>
                      </div>
                      <div className="conversation-meta">
                        <span className="revenue">$89</span>
                        <span className="time">1h ago</span>
                      </div>
                    </div>
                    <div className="conversation-preview">
                      "Just subscribed! Can't wait to see..."
                    </div>
                    <div className="ai-suggestion success">
                      <span className="ai-label">Completed:</span>
                      <p>Successfully converted to premium tier</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
        
        {/* Interactive Demo Note */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          viewport={{ once: true }}
          className="mt-8 text-center"
        >
          <p className="text-sm text-gray-500 dark:text-gray-400">
            💡 Pro tip: The dashboard updates in real-time as fans interact with your content
          </p>
        </motion.div>
      </div>

      <style jsx>{`
        .browser-mockup {
          background: #1a1a1a;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 
            0 25px 50px rgba(0, 0, 0, 0.5),
            0 0 0 1px rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .browser-toolbar {
          background: linear-gradient(to bottom, #3a3a3a, #2a2a2a);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          padding: 12px 16px;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .browser-buttons {
          display: flex;
          gap: 8px;
        }

        .browser-button {
          width: 12px;
          height: 12px;
          border-radius: 50%;
        }

        .browser-button.red { background: #ff5f56; }
        .browser-button.yellow { background: #ffbd2e; }
        .browser-button.green { background: #27ca3f; }

        .browser-url {
          flex: 1;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 6px;
          padding: 6px 12px;
          color: #9ca3af;
          font-size: 14px;
          text-align: center;
        }

        .app-content {
          background: #0f1117;
          height: 600px;
          display: flex;
        }

        .app-sidebar {
          width: 280px;
          background: #0a0d13;
          border-right: 1px solid rgba(255, 255, 255, 0.1);
          padding: 1.5rem;
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 2rem;
        }

        .logo-icon {
          width: 36px;
          height: 36px;
          background: linear-gradient(135deg, #667eea, #764ba2);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 1.125rem;
          color: white;
        }

        .logo span {
          font-weight: 600;
          font-size: 1.125rem;
          color: white;
        }

        .nav-items {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          border-radius: 8px;
          color: rgba(255, 255, 255, 0.8);
          transition: all 0.2s;
          cursor: pointer;
          position: relative;
        }

        .nav-item:hover {
          background: rgba(255, 255, 255, 0.05);
          color: white;
        }

        .nav-item.active {
          background: rgba(102, 126, 234, 0.1);
          color: #667eea;
          border: 1px solid rgba(102, 126, 234, 0.2);
        }

        .nav-item svg {
          width: 20px;
          height: 20px;
        }

        .badge {
          margin-left: auto;
          background: #667eea;
          color: white;
          font-size: 0.75rem;
          padding: 0.125rem 0.5rem;
          border-radius: 12px;
        }

        .main-content {
          flex: 1;
          padding: 2rem;
          overflow: auto;
        }

        .content-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .content-header h2 {
          font-size: 1.875rem;
          font-weight: 700;
          color: white;
          margin-bottom: 0.25rem;
        }

        .content-header p {
          color: rgba(255, 255, 255, 0.8);
          font-size: 0.875rem;
        }

        .action-btn {
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          border: none;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }

        .action-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
        }

        .conversations-grid {
          display: grid;
          gap: 1rem;
        }

        .conversation-card {
          background: #1a1d24;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 1.5rem;
          transition: all 0.2s;
        }

        .conversation-card:hover {
          border-color: rgba(102, 126, 234, 0.3);
          transform: translateY(-2px);
        }

        .conversation-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .user-avatar {
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, #667eea, #764ba2);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          color: white;
        }

        .user-info {
          flex: 1;
        }

        .user-info h4 {
          font-weight: 600;
          color: white;
          margin-bottom: 0.125rem;
        }

        .status {
          font-size: 0.75rem;
          color: #667eea;
        }

        .conversation-meta {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 0.25rem;
        }

        .revenue {
          font-weight: 600;
          color: #22c55e;
        }

        .time {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.5);
        }

        .conversation-preview {
          color: rgba(255, 255, 255, 0.9);
          margin-bottom: 1rem;
          font-size: 0.875rem;
          line-height: 1.5;
        }

        .ai-suggestion {
          background: rgba(102, 126, 234, 0.1);
          border: 1px solid rgba(102, 126, 234, 0.2);
          border-radius: 8px;
          padding: 0.75rem;
        }

        .ai-suggestion.warning {
          background: rgba(251, 191, 36, 0.1);
          border-color: rgba(251, 191, 36, 0.2);
        }

        .ai-suggestion.success {
          background: rgba(34, 197, 94, 0.1);
          border-color: rgba(34, 197, 94, 0.2);
        }

        .ai-label {
          font-size: 0.75rem;
          font-weight: 600;
          color: #667eea;
          margin-bottom: 0.25rem;
          display: block;
        }

        .warning .ai-label {
          color: #fbbf24;
        }

        .success .ai-label {
          color: #22c55e;
        }

        .ai-suggestion p {
          color: rgba(255, 255, 255, 0.8);
          font-size: 0.875rem;
          margin: 0;
        }

        /* Add gradient background */
        section::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle at 30% 50%, rgba(139, 92, 246, 0.1) 0%, transparent 40%),
                      radial-gradient(circle at 70% 50%, rgba(236, 72, 153, 0.1) 0%, transparent 40%);
          pointer-events: none;
        }
        
        /* Mobile Responsive */
        @media (max-width: 768px) {
          .browser-mockup {
            margin: 0 -1rem;
            border-radius: 0;
          }

          .app-sidebar {
            display: none;
          }

          .content-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }

          .conversation-header {
            flex-wrap: wrap;
          }

          .conversation-meta {
            flex-direction: row;
            gap: 1rem;
          }
        }
      `}</style>
    </section>
  )
}