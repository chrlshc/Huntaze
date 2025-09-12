'use client';

import { useEffect, useRef } from 'react';

export default function IAmAtomicEffect() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let time = 0;
    const lines: any[] = [];

    // Create rotating lines like in "I Am Atomic" effect
    const lineCount = 20;
    for (let i = 0; i < lineCount; i++) {
      lines.push({
        angle: (Math.PI * 2 / lineCount) * i,
        length: 200 + Math.random() * 300,
        speed: 0.001 + Math.random() * 0.002,
        width: 1 + Math.random() * 3,
        opacity: 0.3 + Math.random() * 0.7
      });
    }

    function animate() {
      // Clear with very light fade for trail effect
      ctx.fillStyle = 'rgba(11, 6, 20, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      // Draw each line
      lines.forEach((line) => {
        const currentAngle = line.angle + time * line.speed;
        
        // Calculate line endpoints
        const x1 = centerX + Math.cos(currentAngle) * 100;
        const y1 = centerY + Math.sin(currentAngle) * 100;
        const x2 = centerX + Math.cos(currentAngle) * line.length;
        const y2 = centerY + Math.sin(currentAngle) * line.length;

        // Create gradient for each line
        const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
        gradient.addColorStop(0, 'rgba(138, 43, 226, 0)');
        gradient.addColorStop(0.5, `rgba(199, 36, 177, ${line.opacity})`);
        gradient.addColorStop(1, 'rgba(255, 20, 147, 0)');

        // Draw the line
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = line.width;
        ctx.shadowColor = '#C724B1';
        ctx.shadowBlur = 10;
        ctx.stroke();

        // Add bright point at the end
        ctx.beginPath();
        ctx.arc(x2, y2, line.width * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${line.opacity * 0.8})`;
        ctx.fill();
      });

      time++;
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
      {/* Dark purple gradient background like the image */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(circle at center, rgba(138, 43, 226, 0.2) 0%, rgba(75, 0, 130, 0.4) 50%, #0a0614 100%)'
        }}
      />
      
      {/* Canvas with the lines */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
        style={{ opacity: 0.8 }}
      />
    </div>
  );
}