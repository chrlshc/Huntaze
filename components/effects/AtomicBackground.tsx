'use client';

import { useEffect, useRef } from 'react';

export interface AtomicBackgroundProps {
  className?: string;
  particleCount?: number;
  connectionDistance?: number;
  particleSpeed?: number;
}

/**
 * Atomic particle background effect with connections
 * Features:
 * - Animated particles with glow effects
 * - Dynamic connections between nearby particles
 * - Pulsing animation
 * - Responsive to window resize
 * 
 * Consolidates: AtomicBackground, SimpleAtomicEffect, IAmAtomicEffect, DebugAtomicEffect
 */
export default function AtomicBackground({ 
  className = '',
  particleCount = 40,
  connectionDistance = 120,
  particleSpeed = 0.5
}: AtomicBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let particles: Particle[] = [];
    let animationId: number;

    // Get colors from CSS custom properties
    const getComputedColor = (property: string) => {
      return getComputedStyle(document.documentElement).getPropertyValue(property).trim();
    };

    const config = {
      particleCount,
      connectionDistance,
      particleSpeed,
      colors: {
        purple: getComputedColor('--accent-primary') || '#8b5cf6',
        pink: getComputedColor('--accent-error') || 'var(--accent-error)',
        violet: getComputedColor('--accent-primary-hover') || '#7c3aed'
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
        this.x = Math.random() * (canvas?.width || 0);
        this.y = Math.random() * (canvas?.height || 0);
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
        const canvasWidth = canvas?.width || 0;
        const canvasHeight = canvas?.height || 0;
        
        if (this.x < 0 || this.x > canvasWidth) {
          this.vx *= -1;
          this.x = Math.max(0, Math.min(canvasWidth, this.x));
        }
        if (this.y < 0 || this.y > canvasHeight) {
          this.vy *= -1;
          this.y = Math.max(0, Math.min(canvasHeight, this.y));
        }

        // Pulse effect
        this.pulsePhase += this.pulseSpeed;
      }

      draw(context: CanvasRenderingContext2D) {
        const currentGlowRadius = this.glowRadius + Math.sin(this.pulsePhase) * 5;
        const currentOpacity = this.opacity + Math.sin(this.pulsePhase) * 0.2;

        // Draw glow using design token colors
        const gradient = context.createRadialGradient(
          this.x, this.y, 0,
          this.x, this.y, currentGlowRadius
        );
        // Convert hex to rgba for gradient
        const hexToRgba = (hex: string, alpha: number) => {
          const r = parseInt(hex.slice(1, 3), 16);
          const g = parseInt(hex.slice(3, 5), 16);
          const b = parseInt(hex.slice(5, 7), 16);
          return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        };
        gradient.addColorStop(0, hexToRgba(config.colors.purple, currentOpacity * 0.8));
        gradient.addColorStop(0.4, hexToRgba(config.colors.pink, currentOpacity * 0.3));
        gradient.addColorStop(1, 'transparent');

        context.save();
        context.fillStyle = gradient;
        context.fillRect(
          this.x - currentGlowRadius,
          this.y - currentGlowRadius,
          currentGlowRadius * 2,
          currentGlowRadius * 2
        );
        context.restore();

        // Draw center particle
        context.save();
        context.beginPath();
        context.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        context.fillStyle = this.color;
        context.shadowColor = this.color;
        context.shadowBlur = 10;
        context.fill();
        context.restore();
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
            ctx.shadowColor = 'var(--accent-primary)';
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
      ctx.clearRect(0, 0, canvas?.width || 0, canvas?.height || 0);

      // Update and draw particles
      particles.forEach(particle => {
        particle.update();
      });

      // Draw connections first (behind particles)
      drawConnections();

      // Draw particles
      particles.forEach(particle => {
        particle.draw(ctx);
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [particleCount, connectionDistance, particleSpeed]);

  return (
    <div className={`absolute inset-0 ${className}`}>
      {/* Dark gradient background using design tokens */}
      <div 
        className="absolute inset-0"
        style={{
          background: `linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 50%, var(--bg-tertiary) 100%)`
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
      {/* Gradient overlay for depth using design tokens */}
      <div 
        className="absolute inset-0 z-20 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 50% 50%, transparent 0%, var(--bg-primary) 70%)'
        }}
      />
    </div>
  );
}
