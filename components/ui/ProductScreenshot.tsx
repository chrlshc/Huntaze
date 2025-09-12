'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';

interface ProductScreenshotProps {
  src: string;
  alt: string;
  priority?: boolean;
  className?: string;
}

export default function ProductScreenshot({ 
  src, 
  alt, 
  priority = false,
  className = ''
}: ProductScreenshotProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.2 }}
      className={`relative ${className}`}
    >
      {/* Glow effect derrière la capture */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 blur-3xl" />
      
      {/* Container avec bordure subtile */}
      <div className="relative rounded-xl overflow-hidden border border-white/10 bg-black/50 backdrop-blur-sm">
        <Image
          src={src}
          alt={alt}
          width={1200}
          height={800}
          priority={priority}
          className="w-full h-auto"
          quality={95}
        />
        
        {/* Overlay gradient pour meilleure intégration */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
      </div>
      
      {/* Badge "Live Demo" */}
      <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1 bg-green-500/20 backdrop-blur-sm rounded-full border border-green-500/30">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        <span className="text-xs font-medium text-green-400">Live Demo</span>
      </div>
    </motion.div>
  );
}