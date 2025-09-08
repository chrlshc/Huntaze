'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface MockupProps {
  children?: ReactNode;
  className?: string;
  scale?: number;
}

export function IPhoneMockup({ children, className = '', scale = 1 }: MockupProps) {
  return (
    <motion.div
      className={`iphone-mockup-css ${className}`}
      style={{ '--scale': scale } as any}
      whileHover={{ 
        transform: 'perspective(1000px) rotateY(-5deg) rotateX(2deg) scale(1.05)' 
      }}
      transition={{ duration: 0.3 }}
    >
      <div className="iphone-frame">
        <div className="iphone-notch" />
        <div className="iphone-screen">
          {children}
        </div>
      </div>
    </motion.div>
  );
}

export function DesktopMockup({ children, className = '' }: MockupProps) {
  return (
    <motion.div
      className={`desktop-mockup-css ${className}`}
      whileHover={{ 
        transform: 'rotateY(-4deg) scale(1.02)' 
      }}
      transition={{ duration: 0.3 }}
    >
      <div className="desktop-frame">
        <div className="desktop-header">
          <div className="desktop-controls">
            <span className="control-red" />
            <span className="control-yellow" />
            <span className="control-green" />
          </div>
          <div className="desktop-url-bar">
            app.huntaze.com
          </div>
        </div>
        <div className="desktop-screen">
          {children}
        </div>
      </div>
    </motion.div>
  );
}

export function TabletMockup({ children, className = '' }: MockupProps) {
  return (
    <motion.div
      className={`tablet-mockup-css ${className}`}
      whileHover={{ 
        transform: 'rotateY(-8deg) rotateX(5deg) scale(1.03)' 
      }}
      transition={{ duration: 0.3 }}
    >
      <div className="tablet-frame">
        <div className="tablet-screen">
          {children}
        </div>
      </div>
    </motion.div>
  );
}

export function DeviceShowcase({ className = '' }: { className?: string }) {
  return (
    <div className={`device-showcase ${className}`}>
      <DesktopMockup className="showcase-desktop">
        <div className="demo-content bg-gradient-to-br from-purple-100 to-pink-100 h-full flex items-center justify-center">
          <span className="text-2xl font-bold text-purple-600">Dashboard</span>
        </div>
      </DesktopMockup>
      
      <TabletMockup className="showcase-tablet">
        <div className="demo-content bg-gradient-to-br from-blue-100 to-cyan-100 h-full flex items-center justify-center">
          <span className="text-xl font-bold text-blue-600">Analytics</span>
        </div>
      </TabletMockup>
      
      <IPhoneMockup className="showcase-phone" scale={0.8}>
        <div className="demo-content bg-gradient-to-br from-green-100 to-emerald-100 h-full flex items-center justify-center">
          <span className="text-lg font-bold text-green-600">Mobile</span>
        </div>
      </IPhoneMockup>
    </div>
  );
}