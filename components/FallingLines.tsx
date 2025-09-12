"use client";

import { useEffect, useRef } from 'react';

interface Line {
  x: number;
  startY: number;
  endY: number;
  opacity: number;
  maxOpacity: number;
  width: number;
  speed: number;
  color: string;
  phase: 'appearing' | 'visible' | 'disappearing';
  glowSize: number;
}

export default function FallingLines() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const linesRef = useRef<Line[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Configuration
    const maxLines = 8;
    const colors = [
      '#8b5cf6',  // Violet principal
      '#a78bfa',  // Violet clair
      '#7c3aed',  // Violet foncé
      '#c4a5fd',  // Lavande
      '#9333ea'   // Purple
    ];

    // Resize canvas
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    // Create vertical line
    const createVerticalLine = () => {
      const x = Math.random() * canvas.width;
      const startY = -200;
      const endY = startY + 100 + Math.random() * 200;

      linesRef.current.push({
        x,
        startY,
        endY,
        opacity: 0,
        maxOpacity: 0.4 + Math.random() * 0.4,
        width: 1 + Math.random() * 2,
        speed: 2 + Math.random() * 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        phase: 'appearing',
        glowSize: 10 + Math.random() * 20
      });
    };

    // Update lines
    const updateLines = () => {
      for (let i = linesRef.current.length - 1; i >= 0; i--) {
        const line = linesRef.current[i];
        
        // Move line down
        line.startY += line.speed;
        line.endY += line.speed;
        
        // Handle opacity
        if (line.phase === 'appearing') {
          line.opacity = Math.min(line.opacity + 0.02, line.maxOpacity);
          if (line.opacity >= line.maxOpacity) {
            line.phase = 'visible';
          }
        } else if (line.startY > canvas.height - 100) {
          line.phase = 'disappearing';
        }
        
        if (line.phase === 'disappearing') {
          line.opacity = Math.max(line.opacity - 0.02, 0);
        }
        
        // Remove if completely out
        if (line.startY > canvas.height + 100) {
          linesRef.current.splice(i, 1);
        }
      }
      
      // Create new lines
      if (linesRef.current.length < maxLines && Math.random() > 0.95) {
        createVerticalLine();
      }
    };

    // Draw line with glow effect
    const drawLine = (line: Line) => {
      if (line.opacity <= 0) return;
      
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      
      // Create gradient for the line
      const gradient = ctx.createLinearGradient(
        line.x, line.startY,
        line.x, line.endY
      );
      
      gradient.addColorStop(0, 'transparent');
      gradient.addColorStop(0.1, line.color);
      gradient.addColorStop(0.9, line.color);
      gradient.addColorStop(1, 'transparent');
      
      // Draw multiple layers for glow
      // External glow layer
      ctx.beginPath();
      ctx.moveTo(line.x, line.startY);
      ctx.lineTo(line.x, line.endY);
      ctx.strokeStyle = line.color;
      ctx.lineWidth = line.width * 4;
      ctx.globalAlpha = line.opacity * 0.1;
      ctx.shadowColor = line.color;
      ctx.shadowBlur = line.glowSize;
      ctx.stroke();
      
      // Middle layer
      ctx.beginPath();
      ctx.moveTo(line.x, line.startY);
      ctx.lineTo(line.x, line.endY);
      ctx.strokeStyle = gradient;
      ctx.lineWidth = line.width * 2;
      ctx.globalAlpha = line.opacity * 0.3;
      ctx.stroke();
      
      // Main line
      ctx.beginPath();
      ctx.moveTo(line.x, line.startY);
      ctx.lineTo(line.x, line.endY);
      ctx.strokeStyle = gradient;
      ctx.lineWidth = line.width;
      ctx.globalAlpha = line.opacity * 0.8;
      ctx.stroke();
      
      // Bright white center
      ctx.beginPath();
      ctx.moveTo(line.x, line.startY);
      ctx.lineTo(line.x, line.endY);
      ctx.strokeStyle = 'white';
      ctx.lineWidth = line.width * 0.3;
      ctx.globalAlpha = line.opacity;
      ctx.stroke();
      
      ctx.restore();
    };

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      updateLines();
      
      // Draw all lines
      linesRef.current.forEach(line => drawLine(line));
      
      animationRef.current = requestAnimationFrame(animate);
    };

    // Initialize
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Create initial lines
    for (let i = 0; i < 5; i++) {
      setTimeout(() => createVerticalLine(), i * 500);
    }
    
    animate();

    // Cleanup
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute top-0 left-0 w-full h-full pointer-events-none z-[1]"
      style={{ mixBlendMode: 'screen' }}
    />
  );
}