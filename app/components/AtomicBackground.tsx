'use client';

import { useEffect, useRef } from 'react';

interface AtomicBackgroundProps {
  className?: string;
}

export default function AtomicBackground({ className = '' }: AtomicBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let particles: Particle[] = [];
    let animationId: number;

    // Configuration based on the provided example
    const config = {
      particleCount: 40,
      connectionDistance: 120,
      particleSpeed: 0.5,
      colors: {
        purple: '#8A2BE2',
        pink: '#FF1493',
        violet: '#9932CC'
      }
    };

    // Resize canvas
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Get random color
    const getRandomColor = () => {
      const colors = [config.colors.purple, config.colors.pink, config.colors.violet];
      return colors[Math.floor(Math.random() * colors.length)];
    };

    // Particle class
    class Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      opacity: number;
      color: string;
      glowRadius: number;
      pulsePhase: number;
      pulseSpeed: number;

      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * config.particleSpeed;
        this.vy = (Math.random() - 0.5) * config.particleSpeed;
        this.radius = Math.random() * 3 + 1;
        this.opacity = Math.random() * 0.5 + 0.3;
        this.color = getRandomColor();
        this.glowRadius = Math.random() * 20 + 10;
        this.pulsePhase = Math.random() * Math.PI * 2;
        this.pulseSpeed = Math.random() * 0.02 + 0.01;
      }

      update() {
        // Update position
        this.x += this.vx;
        this.y += this.vy;

        // Bounce off edges
        if (this.x < 0 || this.x > canvas.width) {
          this.vx *= -1;
          this.x = Math.max(0, Math.min(canvas.width, this.x));
        }
        if (this.y < 0 || this.y > canvas.height) {
          this.vy *= -1;
          this.y = Math.max(0, Math.min(canvas.height, this.y));
        }

        // Pulse effect
        this.pulsePhase += this.pulseSpeed;
      }

      draw() {
        const currentGlowRadius = this.glowRadius + Math.sin(this.pulsePhase) * 5;
        const currentOpacity = this.opacity + Math.sin(this.pulsePhase) * 0.2;

        // Draw glow
        const gradient = ctx.createRadialGradient(
          this.x, this.y, 0,
          this.x, this.y, currentGlowRadius
        );
        gradient.addColorStop(0, `rgba(138, 43, 226, ${currentOpacity * 0.8})`);
        gradient.addColorStop(0.4, `rgba(255, 20, 147, ${currentOpacity * 0.3})`);
        gradient.addColorStop(1, 'transparent');

        ctx.save();
        ctx.fillStyle = gradient;
        ctx.fillRect(
          this.x - currentGlowRadius,
          this.y - currentGlowRadius,
          currentGlowRadius * 2,
          currentGlowRadius * 2
        );
        ctx.restore();

        // Draw center particle
        ctx.save();
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.restore();
      }
    }

    // Draw connections between particles
    const drawConnections = () => {
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < config.connectionDistance) {
            const opacity = (1 - distance / config.connectionDistance) * 0.8;

            ctx.save();
            
            // Base line with glow
            ctx.strokeStyle = `rgba(138, 43, 226, ${opacity})`;
            ctx.lineWidth = 1;
            ctx.shadowColor = '#8A2BE2';
            ctx.shadowBlur = 8;

            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();

            // Pink overlay line
            ctx.strokeStyle = `rgba(255, 20, 147, ${opacity * 0.7})`;
            ctx.lineWidth = 0.5;
            ctx.shadowColor = '#FF1493';
            ctx.shadowBlur = 5;

            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();

            ctx.restore();
          }
        }
      }
    };

    // Initialize particles
    for (let i = 0; i < config.particleCount; i++) {
      particles.push(new Particle());
    }

    // Animation loop
    const animate = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update and draw particles
      particles.forEach(particle => {
        particle.update();
      });

      // Draw connections first (behind particles)
      drawConnections();

      // Draw particles
      particles.forEach(particle => {
        particle.draw();
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  return (
    <div className={`absolute inset-0 ${className}`}>
      {/* Dark gradient background */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(135deg, #0a0a0a 0%, #1a0a2e 50%, #16213e 100%)'
        }}
      />
      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 z-10"
        style={{
          pointerEvents: 'none',
        }}
      />
      {/* Gradient overlay for depth */}
      <div 
        className="absolute inset-0 z-20 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 50% 50%, transparent 0%, rgba(10, 10, 10, 0.3) 70%)'
        }}
      />
    </div>
  );
}