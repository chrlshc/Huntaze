"use client";

import { useEffect, useRef } from "react";

export default function SimpleNeonTest() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Simple animated line
    let frame = 0;
    
    function draw() {
      frame++;
      
      // Clear canvas with dark background
      ctx.fillStyle = 'rgba(11, 6, 20, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw purple glowing line
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 2;
      ctx.shadowBlur = 20;
      ctx.shadowColor = '#a855f7';
      
      ctx.beginPath();
      ctx.moveTo(0, canvas.height / 2);
      
      for (let x = 0; x < canvas.width; x += 10) {
        const y = canvas.height / 2 + Math.sin((x + frame) * 0.01) * 100;
        ctx.lineTo(x, y);
      }
      
      ctx.stroke();
      
      requestAnimationFrame(draw);
    }
    
    draw();
    
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
    <canvas 
      ref={canvasRef}
      className="fixed inset-0 w-full h-full"
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none'
      }}
    />
  );
}