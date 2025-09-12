'use client';

import { useEffect, useRef } from 'react';

interface SimpleNeonCanvasProps {
  className?: string;
}

export default function SimpleNeonCanvas({ className = '' }: SimpleNeonCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Setup canvas size
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    let animationId: number;
    let time = 0;

    // Lines configuration
    const lines = Array.from({ length: 15 }, (_, i) => ({
      x: Math.random() * canvas.width,
      speed: 0.5 + Math.random() * 0.5,
      amplitude: 20 + Math.random() * 30,
      offset: Math.random() * Math.PI * 2,
      opacity: 0.1 + Math.random() * 0.2
    }));

    // Animated neon lines
    const animate = () => {
      // Very subtle fade effect
      ctx.fillStyle = 'rgba(11, 6, 20, 0.02)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw animated lines
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 1;
      ctx.shadowBlur = 20;
      ctx.shadowColor = '#a855f7';

      lines.forEach((line, i) => {
        ctx.globalAlpha = line.opacity * (0.5 + 0.5 * Math.sin(time * 0.0005 + i));
        ctx.beginPath();
        
        // Draw wavy vertical line
        for (let y = 0; y <= canvas.height; y += 5) {
          const x = line.x + Math.sin((y * 0.01) + (time * 0.001 * line.speed) + line.offset) * line.amplitude;
          
          if (y === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        
        ctx.stroke();
      });

      // Add horizontal scan lines
      ctx.globalAlpha = 0.05;
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 0.5;
      
      const scanY = ((time * 0.5) % canvas.height);
      ctx.beginPath();
      ctx.moveTo(0, scanY);
      ctx.lineTo(canvas.width, scanY);
      ctx.stroke();
      
      const scanY2 = ((time * 0.5 + canvas.height / 2) % canvas.height);
      ctx.beginPath();
      ctx.moveTo(0, scanY2);
      ctx.lineTo(canvas.width, scanY2);
      ctx.stroke();

      time += 16;
      animationId = requestAnimationFrame(animate);
    };

    // Start animation
    animate();

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{
        opacity: 0.6,
      }}
    />
  );
}