'use client';

import { useEffect, useRef } from 'react';

export default function BasicShadowEffect() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      console.error('Canvas not found');
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('Context not found');
      return;
    }

    // Set canvas size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    console.log('Canvas initialized:', canvas.width, canvas.height);

    let time = 0;

    // Simple animation loop
    function animate() {
      // Clear canvas with dark background
      ctx.fillStyle = 'rgba(10, 6, 20, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw rotating lines
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = 300;

      for (let i = 0; i < 8; i++) {
        const angle = (Math.PI * 2 / 8) * i + time * 0.001;
        
        const x1 = centerX + Math.cos(angle) * radius;
        const y1 = centerY + Math.sin(angle) * radius;
        const x2 = centerX + Math.cos(angle) * (radius + 100);
        const y2 = centerY + Math.sin(angle) * (radius + 100);

        // Draw line with glow
        ctx.strokeStyle = '#C724B1';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#C724B1';
        ctx.shadowBlur = 20;
        
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }

      time++;
      requestAnimationFrame(animate);
    }

    animate();

    // Handle resize
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <>
      {/* Dark background */}
      <div 
        className="fixed inset-0 z-0"
        style={{ backgroundColor: '#0a0614' }}
      />
      
      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 z-10"
        style={{ 
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none'
        }}
      />
    </>
  );
}