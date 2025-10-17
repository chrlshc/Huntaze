'use client';

import { useEffect, useRef } from 'react';

export default function HuntazeShadowEffect() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    class HuntazeLines {
      lines: any[] = [];
      time = 0;
      
      // Huntaze colors
      colors = {
        purple: '#9333EA',      // Core Huntaze purple
        pink: '#EC4899',        // Huntaze pink
        purpleLight: '#A855F7', // Lighter purple
        pinkLight: '#F472B6',   // Lighter pink
        white: '#FFFFFF'
      };
      
      constructor() {
        this.init();
        this.animate();
      }
      
      init() {
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // Create actual straight lines that rotate
        this.createLines();
      }
      
      resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
      
      createLines() {
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = 350;
        
        // Create 12 straight lines
        for (let i = 0; i < 12; i++) {
          const angle = (Math.PI * 2 / 12) * i;
          this.lines.push({
            angle: angle,
            radius: radius,
            length: 150 + Math.random() * 100,
            speed: 0.001 + Math.random() * 0.002,
            width: 1 + Math.random() * 2,
            opacity: 0.3 + Math.random() * 0.4,
            color: i % 2 === 0 ? this.colors.purple : this.colors.pink,
            glowColor: i % 2 === 0 ? this.colors.purpleLight : this.colors.pinkLight
          });
        }
      }
      
      drawLine(line: any) {
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        
        // Rotate the line
        const currentAngle = line.angle + this.time * line.speed;
        
        // Start and end points of the straight line
        const startX = centerX + Math.cos(currentAngle) * line.radius;
        const startY = centerY + Math.sin(currentAngle) * line.radius;
        const endX = centerX + Math.cos(currentAngle) * (line.radius + line.length);
        const endY = centerY + Math.sin(currentAngle) * (line.radius + line.length);
        
        // Opacity pulse
        const pulse = Math.sin(this.time * 0.002 + line.angle) * 0.3 + 0.7;
        
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        
        // Draw the glow in multiple passes
        // Wide glow
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.strokeStyle = line.glowColor;
        ctx.lineWidth = line.width * 8;
        ctx.globalAlpha = line.opacity * pulse * 0.1;
        ctx.shadowColor = line.glowColor;
        ctx.shadowBlur = 30;
        ctx.stroke();
        
        // Medium glow
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.strokeStyle = line.color;
        ctx.lineWidth = line.width * 4;
        ctx.globalAlpha = line.opacity * pulse * 0.3;
        ctx.shadowColor = line.color;
        ctx.shadowBlur = 20;
        ctx.stroke();
        
        // Main line
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.strokeStyle = line.color;
        ctx.lineWidth = line.width;
        ctx.globalAlpha = line.opacity * pulse * 0.8;
        ctx.shadowColor = line.color;
        ctx.shadowBlur = 10;
        ctx.stroke();
        
        // Bright white core
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.strokeStyle = this.colors.white;
        ctx.lineWidth = line.width * 0.3;
        ctx.globalAlpha = line.opacity * pulse;
        ctx.shadowBlur = 0;
        ctx.stroke();
        
        ctx.restore();
      }
      
      animate = () => {
        // Slightly transparent background to create a trailing effect
        ctx.fillStyle = 'rgba(11, 6, 20, 0.1)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        this.time++;
        
        // Draw all lines
        this.lines.forEach(line => this.drawLine(line));
        
        requestAnimationFrame(this.animate);
      }
    }

    // Initialize the effect
    new HuntazeLines();

    return () => {
      // Cleanup
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none">
      {/* Huntaze dark background */}
      <div 
        className="absolute inset-0"
        style={{
          background: '#0b0614'
        }}
      />
      
      {/* Canvas for the lines */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 z-10"
      />
    </div>
  );
}
