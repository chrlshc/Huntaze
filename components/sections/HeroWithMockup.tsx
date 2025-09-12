'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

export default function HeroWithMockup() {
  return (
    <section className="hero">
      <div className="hero-content">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          The platform built for<br />
          premium creators
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          Automate conversations, boost revenue, and scale your exclusive content business with AI.
        </motion.p>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="actions"
        >
          <Link href="/auth" className="btn">
            Start for free
          </Link>
          <Link href="/pricing" className="btn-secondary">
            View plans
          </Link>
        </motion.div>
      </div>

      <motion.div 
        className="hero-visual"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
      >
          <div className="browser-mockup">
            {/* Browser Header */}
            <div className="browser-toolbar">
              <div className="browser-buttons">
                <div className="browser-button red"></div>
                <div className="browser-button yellow"></div>
                <div className="browser-button green"></div>
              </div>
              <div className="browser-url">🔒 huntaze.app</div>
            </div>

            {/* App Content */}
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
                    <span>Inbox</span>
                    <span className="badge">24</span>
                  </div>
                  <div className="nav-item">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <span>Analytics</span>
                  </div>
                </nav>
              </div>

              {/* Main Dashboard */}
              <div className="main-content">
                <div className="content-header">
                  <div>
                    <h2>Welcome back, Sarah</h2>
                    <p>Here's what's happening today</p>
                  </div>
                  <button className="create-btn">Create Post</button>
                </div>

                <div className="stats-grid">
                  <div className="stat-card">
                    <span className="stat-label">Total Revenue</span>
                    <span className="stat-value">$147,298</span>
                    <span className="stat-change positive">+23.5%</span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-label">Subscribers</span>
                    <span className="stat-value">4,832</span>
                    <span className="stat-change positive">+18.2%</span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-label">Messages</span>
                    <span className="stat-value">342</span>
                    <span className="stat-change">AI: 89%</span>
                  </div>
                </div>

                <div className="chart-area">
                  <div className="chart-placeholder">
                    <svg viewBox="0 0 400 200" className="chart-svg">
                      <path
                        d="M 0,150 C 50,140 100,120 150,100 C 200,80 250,90 300,70 C 350,50 400,60 400,40"
                        fill="none"
                        stroke="url(#gradient)"
                        strokeWidth="3"
                      />
                      <defs>
                        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#8B5CF6" />
                          <stop offset="100%" stopColor="#EC4899" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
      </motion.div>

      <style jsx>{`
        /* Structure générale */
        .hero {
          position: relative;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 10rem 2rem 4rem 2rem;
          background: #000;
          color: #fff;
          overflow: hidden;
        }

        .hero-content {
          text-align: left;
          z-index: 2;
          width: 100%;
        }

        .actions {
          display: flex;
          align-items: center;
        }

        .btn,
        .btn-secondary {
          padding: 1rem 2rem;
          border-radius: 8px;
          font-size: 1.125rem;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.2s;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
        }

        .btn {
          background: white;
          color: black;
          border: none;
        }

        .btn:hover {
          background: rgba(255, 255, 255, 0.9);
          transform: translateY(-1px);
        }

        .btn-secondary {
          background: transparent;
          color: rgba(255, 255, 255, 0.7);
          border: none;
          font-weight: 500;
          padding: 1rem 0.5rem;
          position: relative;
        }

        .btn-secondary:hover {
          color: #fff;
        }
        
        .btn-secondary::after {
          content: '→';
          margin-left: 0.5rem;
          transition: transform 0.2s;
        }
        
        .btn-secondary:hover::after {
          transform: translateX(3px);
        }

        .hero-visual {
          position: relative;
          width: 100%;
          display: flex;
          justify-content: center;
          align-items: flex-start;
          pointer-events: none;
        }

        /* Browser Mockup avec effet Linear */
        .browser-mockup {
          background: #1a1a1a;
          border-radius: 16px;
          overflow: hidden;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 
            0 30px 60px rgba(0, 0, 0, 0.6),
            0 15px 30px rgba(0, 0, 0, 0.4),
            0 0 0 1px rgba(255, 255, 255, 0.05);
        }

        .browser-mockup:hover {
          transform: perspective(1000px) rotateX(2deg) rotateY(-4deg) scale(1.02);
          box-shadow: 
            0 35px 70px rgba(0, 0, 0, 0.7),
            0 15px 35px rgba(0, 0, 0, 0.5);
        }

        @keyframes float {
          0%, 100% { 
            transform: perspective(1000px) rotateX(5deg) rotateY(-8deg) translateY(0px); 
          }
          50% { 
            transform: perspective(1000px) rotateX(5deg) rotateY(-8deg) translateY(-8px); 
          }
        }

        /* Browser Toolbar Style Linear */
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
          cursor: pointer;
          transition: opacity 0.2s;
        }

        .browser-button:hover { opacity: 0.8; }
        .browser-button.red { background: #ff5f56; }
        .browser-button.yellow { background: #ffbd2e; }  
        .browser-button.green { background: #27ca3f; }
        
        /* FINITION MOCKUP HUNTAZE - NIVEAU LINEAR */
        .browser-button.close { background: #ff5f56; }
        .browser-button.minimize { background: #ffbd2e; }
        .browser-button.maximize { background: #27ca3f; }

        .browser-url {
          flex: 1;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 6px;
          padding: 6px 12px;
          color: #9ca3af;
          font-size: 14px;
          font-family: 'SF Mono', Monaco, 'Consolas', monospace;
          text-align: center;
        }

        /* App Content */
        .app-content {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          height: calc(100% - 53px);
          display: flex;
          position: relative;
          overflow: hidden;
        }

        .app-content::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: 
            radial-gradient(circle at 20% 80%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.08) 0%, transparent 50%);
          pointer-events: none;
        }
        
        /* Background avec profondeur supplémentaire */
        .app-interface::before, .browser-content::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: 
            radial-gradient(circle at 30% 70%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 70% 30%, rgba(255, 255, 255, 0.08) 0%, transparent 50%);
          pointer-events: none;
          z-index: 0;
        }

        .app-sidebar {
          width: 280px;
          background: rgba(0, 0, 0, 0.2);
          border-right: 1px solid rgba(255, 255, 255, 0.1);
          padding: 1.5rem;
          backdrop-filter: blur(10px);
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
          background: white;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 1.125rem;
          color: #764ba2;
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
          padding: 0.625rem 0.75rem;
          border-radius: 6px;
          color: rgba(255, 255, 255, 0.7);
          transition: all 0.2s;
          cursor: pointer;
          font-size: 0.813rem;
          position: relative;
        }

        .nav-item:hover {
          background: rgba(255, 255, 255, 0.1);
          color: white;
        }

        .nav-item.active {
          background: rgba(255, 255, 255, 0.15);
          color: white;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .nav-item svg {
          width: 20px;
          height: 20px;
        }

        .badge {
          margin-left: auto;
          background: rgba(255, 255, 255, 0.25);
          color: white;
          font-size: 0.75rem;
          padding: 0.125rem 0.5rem;
          border-radius: 12px;
        }

        /* Main Content */
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
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 0.25rem;
          color: white;
        }

        .content-header p {
          color: rgba(255, 255, 255, 0.7);
          font-size: 0.875rem;
        }

        .create-btn {
          background: white;
          color: #764ba2;
          padding: 0.625rem 1.25rem;
          border-radius: 8px;
          border: none;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .create-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .stat-card {
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.25);
          border-radius: 12px;
          padding: 24px 20px;
          transition: all 0.3s ease;
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .stat-card:hover {
          transform: translateY(-2px);
          background: rgba(255, 255, 255, 0.2);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
        }
        
        /* Glassmorphisme renforcé pour toutes les stats */
        .stat-card, [class*="stat"], .stats div {
          background: rgba(255, 255, 255, 0.15) !important;
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          transition: all 0.3s ease;
        }

        .stat-card:hover {
          background: rgba(255, 255, 255, 0.2) !important;
          transform: translateY(-2px);
        }

        .stat-label {
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.7);
        }

        .stat-value {
          font-size: 2rem;
          font-weight: 700;
          color: white;
        }

        .stat-change {
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.7);
        }

        .stat-change.positive {
          color: #22c55e;
        }

        .chart-area {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 12px;
          padding: 2rem;
          height: 250px;
          display: flex;
          align-items: center;
          justify-content: center;
          backdrop-filter: blur(10px);
        }

        .chart-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .chart-svg {
          width: 100%;
          height: 100%;
          max-width: 500px;
        }

        /* Mobile First - Default styles for mobile */
        .hero {
          padding: 6rem 1rem 2rem 1rem;
        }
        
        .hero-content h1 {
          font-size: 2.5rem;
        }
        
        .hero-content p {
          font-size: 1.125rem;
        }
        
        .actions {
          flex-direction: column;
          gap: 1rem;
          width: 100%;
        }
        
        .btn, .btn-secondary {
          width: 100%;
          justify-content: center;
          padding: 1rem 2rem;
        }
        
        .hero-visual {
          height: 400px;
          margin-top: 2rem;
        }
        
        .browser-mockup {
          width: 100%;
          max-width: 380px;
          transform: none !important;
          animation: none !important;
        }
        
        /* Tablet and up */
        @media (min-width: 768px) {
          .hero {
            padding: 8rem 2rem 3rem 2rem;
          }
          
          .hero-content h1 {
            font-size: clamp(3rem, 6vw, 4.5rem);
          }
          
          .hero-content p {
            font-size: 1.375rem;
          }
          
          .actions {
            flex-direction: row;
            width: auto;
          }
          
          .btn, .btn-secondary {
            width: auto;
          }
          
          .hero-visual {
            height: 500px;
          }
          
          .browser-mockup {
            width: 900px;
            max-width: none;
            transform: perspective(1200px) rotateX(5deg) rotateY(-8deg) !important;
            animation: float 6s ease-in-out infinite !important;
          }
          
          .browser-mockup:hover {
            transform: scale(1.02) !important;
          }
          
          .stats-grid {
            grid-template-columns: 1fr;
          }

          .app-sidebar {
            display: none;
          }
        }
        
        /* Desktop and up */
        @media (min-width: 1024px) {
          .hero {
            padding: 10rem 2rem 4rem 2rem;
          }
          
          .hero-content {
            max-width: 1200px;
            margin-bottom: 6rem;
          }
          
          .hero-content h1 {
            font-size: clamp(3.5rem, 8vw, 5.5rem);
            margin-bottom: 2.5rem;
          }
          
          .hero-content p {
            font-size: 1.5rem;
            margin-bottom: 3.5rem;
            max-width: 750px;
          }
          
          .actions {
            gap: 2.5rem;
            margin-top: 3rem;
          }
          
          .hero-visual {
            height: 600px;
            max-width: 1400px;
          }
          
          .browser-mockup {
            width: 1600px;
          }
          
          .stats-grid {
            grid-template-columns: repeat(3, 1fr);
          }
          
          .app-sidebar {
            display: block;
          }
        }
      `}</style>
    </section>
  )
}