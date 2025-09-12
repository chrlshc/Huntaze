'use client';

import { useEffect, useRef } from 'react';

export default function VerticalLinesEffect() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const lines: any[] = [];

    // Create random vertical lines
    function createLine() {
      return {
        x: Math.random() * canvas.width,
        y: -100,
        length: 100 + Math.random() * 200,
        speed: 2 + Math.random() * 4,
        width: 1 + Math.random() * 3,
        opacity: 0.3 + Math.random() * 0.7,
        color: Math.random() > 0.5 ? '#8A2BE2' : '#C724B1'
      };
    }

    // Initialize with some lines
    for (let i = 0; i < 5; i++) {
      const line = createLine();
      line.y = Math.random() * canvas.height;
      lines.push(line);
    }

    function animate() {
      // Clear canvas with fade effect
      ctx.fillStyle = 'rgba(11, 6, 20, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Update and draw lines
      for (let i = lines.length - 1; i >= 0; i--) {
        const line = lines[i];
        
        // Move line down
        line.y += line.speed;
        
        // Remove line if it's off screen
        if (line.y > canvas.height + line.length) {
          lines.splice(i, 1);
          continue;
        }
        
        // Draw line
        const gradient = ctx.createLinearGradient(
          line.x, line.y,
          line.x, line.y + line.length
        );
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
        gradient.addColorStop(0.1, `${line.color}${Math.floor(line.opacity * 255).toString(16)}`);
        gradient.addColorStop(0.9, `${line.color}${Math.floor(line.opacity * 255).toString(16)}`);
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.beginPath();
        ctx.moveTo(line.x, line.y);
        ctx.lineTo(line.x, line.y + line.length);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = line.width;
        ctx.shadowColor = line.color;
        ctx.shadowBlur = 10;
        ctx.stroke();
        
        // Add glow effect
        ctx.beginPath();
        ctx.moveTo(line.x, line.y);
        ctx.lineTo(line.x, line.y + line.length);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = line.width * 3;
        ctx.globalAlpha = 0.3;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
      
      // Add new lines randomly
      if (Math.random() < 0.05 && lines.length < 10) {
        lines.push(createLine());
      }

      requestAnimationFrame(animate);
    }

    animate();

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
    <div className="fixed inset-0 pointer-events-none">
      {/* Dark background */}
      <div 
        className="absolute inset-0"
        style={{
          background: '#0a0614'
        }}
      />
      
      {/* Canvas with vertical lines */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
        style={{ opacity: 0.8 }}
      />
    </div>
  );
}