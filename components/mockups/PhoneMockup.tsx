'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface PhoneMockupProps {
  children: ReactNode;
  delay?: number;
  className?: string;
  variant?: 'iphone14' | 'iphone15pro';
}

export default function PhoneMockup({ 
  children, 
  delay = 0, 
  className = '',
  variant = 'iphone14'
}: PhoneMockupProps) {
  return (
    <motion.div 
      className={`relative ${className}`}
      style={{
        width: '375px',
        height: '812px',
      }}
      initial={{ opacity: 0, scale: 0.8, y: 100 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay, duration: 0.8, ease: "easeOut" }}
    >
      {/* Phone Frame */}
      <div className="absolute inset-0 bg-gray-900 rounded-[60px] shadow-2xl">
        {/* Dynamic Island / Notch */}
        {variant === 'iphone15pro' ? (
          <div className="absolute top-6 left-1/2 transform -translate-x-1/2 w-[120px] h-[35px] bg-black rounded-full" />
        ) : (
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-[150px] h-[30px] bg-black rounded-b-3xl" />
        )}
        
        {/* Volume buttons */}
        <div className="absolute left-[-2px] top-[120px] w-[4px] h-[30px] bg-gray-800 rounded-l" />
        <div className="absolute left-[-2px] top-[160px] w-[4px] h-[50px] bg-gray-800 rounded-l" />
        <div className="absolute left-[-2px] top-[220px] w-[4px] h-[50px] bg-gray-800 rounded-l" />
        
        {/* Power button */}
        <div className="absolute right-[-2px] top-[180px] w-[4px] h-[80px] bg-gray-800 rounded-r" />
        
        {/* Screen */}
        <div className="absolute inset-[3px] bg-black rounded-[57px] overflow-hidden">
          <div className="absolute inset-0 bg-gray-950">
            {children}
          </div>
        </div>
      </div>
      
      {/* Reflection effect */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent rounded-[60px] pointer-events-none" />
    </motion.div>
  );
}