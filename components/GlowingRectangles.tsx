'use client';

import { motion } from 'framer-motion';

const GlowingRectangle = ({ 
  width = 200, 
  height = 150, 
  delay = 0, 
  duration = 4,
  className = "",
  blur = 80
}: { 
  width?: number;
  height?: number;
  delay?: number;
  duration?: number;
  className?: string;
  blur?: number;
}) => {
  return (
    <motion.div
      className={`absolute rounded-2xl ${className}`}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.3) 0%, rgba(236, 72, 153, 0.3) 100%)',
        border: '1px solid rgba(168, 85, 247, 0.5)',
        filter: `blur(${blur}px)`,
      }}
      animate={{
        opacity: [0.3, 0.6, 0.3],
        scale: [1, 1.1, 1],
      }}
      transition={{
        duration,
        repeat: Infinity,
        delay,
        ease: "easeInOut"
      }}
    />
  );
};

export default function GlowingRectangles() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {/* Large rectangles with heavy blur for ambiance */}
      <GlowingRectangle 
        width={400} 
        height={300} 
        className="top-[10%] left-[5%]" 
        delay={0}
        blur={100}
      />
      <GlowingRectangle 
        width={350} 
        height={250} 
        className="top-[60%] right-[10%]" 
        delay={1.5}
        blur={90}
      />
      <GlowingRectangle 
        width={300} 
        height={400} 
        className="bottom-[20%] left-[15%]" 
        delay={3}
        blur={120}
      />
      
      {/* Medium rectangles */}
      <GlowingRectangle 
        width={250} 
        height={180} 
        className="top-[30%] right-[20%]" 
        delay={0.5}
        blur={70}
      />
      <GlowingRectangle 
        width={280} 
        height={200} 
        className="top-[50%] left-[30%]" 
        delay={2}
        blur={80}
      />
      <GlowingRectangle 
        width={220} 
        height={160} 
        className="bottom-[10%] right-[25%]" 
        delay={2.5}
        blur={75}
      />
      
      {/* Small rectangles for detail */}
      <GlowingRectangle 
        width={150} 
        height={100} 
        className="top-[20%] left-[40%]" 
        delay={1}
        blur={60}
      />
      <GlowingRectangle 
        width={180} 
        height={120} 
        className="top-[70%] left-[60%]" 
        delay={1.8}
        blur={65}
      />
      <GlowingRectangle 
        width={160} 
        height={110} 
        className="bottom-[40%] right-[5%]" 
        delay={3.5}
        blur={70}
      />
      
      {/* Extra small rectangles scattered around */}
      <GlowingRectangle 
        width={100} 
        height={80} 
        className="top-[5%] right-[30%]" 
        delay={0.3}
        blur={50}
      />
      <GlowingRectangle 
        width={120} 
        height={90} 
        className="bottom-[30%] left-[50%]" 
        delay={2.2}
        blur={55}
      />
      <GlowingRectangle 
        width={90} 
        height={70} 
        className="top-[45%] right-[40%]" 
        delay={4}
        blur={45}
      />
      
      {/* Shadow eminence effect - subtle sharp rectangles */}
      <motion.div
        className="absolute top-[25%] left-[20%] w-[180px] h-[120px] rounded-lg"
        style={{
          background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, rgba(236, 72, 153, 0.1) 100%)',
          border: '1px solid rgba(168, 85, 247, 0.2)',
          backdropFilter: 'blur(2px)',
        }}
        animate={{
          opacity: [0.1, 0.3, 0.1],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div
        className="absolute bottom-[35%] right-[15%] w-[150px] h-[100px] rounded-lg"
        style={{
          background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%)',
          border: '1px solid rgba(236, 72, 153, 0.2)',
          backdropFilter: 'blur(2px)',
        }}
        animate={{
          opacity: [0.1, 0.25, 0.1],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          delay: 2,
          ease: "easeInOut"
        }}
      />
    </div>
  );
}