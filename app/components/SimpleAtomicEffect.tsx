'use client';

import { useEffect, useRef } from 'react';

export default function SimpleAtomicEffect() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    interface Particle {
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
    }

    const particles: Particle[] = [];
    let animationId: number;

    // Configuration from provided code
    const config = {
      particleCount: 40,
      connectionDistance: 120,
      particleSpeed: 0.5,
      glowIntensity: 0.6,
      colors: {
        purple: '#8A2BE2',
        pink: '#FF1493',
        violet: '#9932CC'
      }
    };

    // Setup canvas
    const setupCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    setupCanvas();
    window.addEventListener('resize', setupCanvas);

    // Get random color
    const getRandomColor = () => {
      const colors = [config.colors.purple, config.colors.pink, config.colors.violet];
      return colors[Math.floor(Math.random() * colors.length)];
    };

    // Create particles
    for (let i = 0; i < config.particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * config.particleSpeed,
        vy: (Math.random() - 0.5) * config.particleSpeed,
        radius: Math.random() * 3 + 1,
        opacity: Math.random() * 0.5 + 0.3,
        color: getRandomColor(),
        glowRadius: Math.random() * 20 + 10,
        pulsePhase: Math.random() * Math.PI * 2,
        pulseSpeed: Math.random() * 0.02 + 0.01
      });
    }

    // Update particles
    const updateParticles = () => {
      particles.forEach(particle => {
        // Update position
        particle.x += particle.vx;
        particle.y += particle.vy;
        
        // Bounce off edges
        if (particle.x < 0 || particle.x > canvas.width) {
          particle.vx *= -1;
          particle.x = Math.max(0, Math.min(canvas.width, particle.x));
        }
        
        if (particle.y < 0 || particle.y > canvas.height) {
          particle.vy *= -1;
          particle.y = Math.max(0, Math.min(canvas.height, particle.y));
        }
        
        // Pulse effect
        particle.pulsePhase += particle.pulseSpeed;
      });
    };

    // Draw connections
    const drawConnections = () => {
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < config.connectionDistance) {
            const opacity = ((config.connectionDistance - distance) / config.connectionDistance) * 0.8;
            
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

    // Draw particles
    const drawParticles = () => {
      particles.forEach(particle => {
        const currentGlowRadius = particle.glowRadius + Math.sin(particle.pulsePhase) * 5;
        const currentOpacity = particle.opacity + Math.sin(particle.pulsePhase) * 0.2;
        
        ctx.save();
        
        // Create gradient for glow
        const gradient = ctx.createRadialGradient(
          particle.x, particle.y, 0,
          particle.x, particle.y, currentGlowRadius
        );
        
        gradient.addColorStop(0, `${particle.color}${Math.floor(currentOpacity * 255).toString(16).padStart(2, '0')}`);
        gradient.addColorStop(0.5, `${particle.color}${Math.floor(currentOpacity * 100).toString(16).padStart(2, '0')}`);
        gradient.addColorStop(1, 'transparent');
        
        // Draw glow
        ctx.fillStyle = gradient;
        ctx.fillRect(
          particle.x - currentGlowRadius,
          particle.y - currentGlowRadius,
          currentGlowRadius * 2,
          currentGlowRadius * 2
        );
        
        // Draw center particle
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fillStyle = particle.color;
        ctx.shadowColor = particle.color;
        ctx.shadowBlur = 10;
        ctx.fill();
        
        ctx.restore();
      });
    };

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      updateParticles();
      drawConnections();
      drawParticles();
      
      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', setupCanvas);
    };
  }, []);

  return (
    <div className="atomic-container absolute inset-0">
      {/* Dark gradient background matching the HTML example */}
      <div 
        className="absolute inset-0 z-0" 
        style={{ 
          background: 'linear-gradient(135deg, #0a0a0a 0%, #1a0a2e 50%, #16213e 100%)' 
        }}
      />
      
      {/* Canvas for particles */}
      <canvas
        ref={canvasRef}
        className="atomic-canvas absolute inset-0 z-10"
        style={{ pointerEvents: 'none' }}
      />
      
      {/* Gradient overlay for depth */}
      <div 
        className="atomic-overlay absolute inset-0 z-20"
        style={{ 
          background: 'radial-gradient(circle at 50% 50%, transparent 0%, rgba(10, 10, 10, 0.3) 70%)',
          pointerEvents: 'none'
        }}
      />
      
      {/* Static particles for extra effect */}
      <div className="static-particles absolute inset-0 z-5 pointer-events-none">
        <div className="particle particle--large absolute w-2 h-2 rounded-full opacity-60" 
             style={{ 
               background: 'radial-gradient(circle, #8A2BE2 0%, #FF1493 70%, transparent 100%)',
               top: '20%',
               left: '15%',
               animation: 'particleFloat 6s ease-in-out infinite',
               boxShadow: '0 0 20px rgba(138, 43, 226, 0.6)'
             }} />
        <div className="particle particle--medium absolute w-[6px] h-[6px] rounded-full opacity-60"
             style={{ 
               background: 'radial-gradient(circle, #8A2BE2 0%, #FF1493 70%, transparent 100%)',
               top: '60%',
               right: '20%',
               animation: 'particleFloat 6s ease-in-out infinite 2s',
               boxShadow: '0 0 15px rgba(255, 20, 147, 0.6)'
             }} />
        <div className="particle particle--small absolute w-1 h-1 rounded-full opacity-60"
             style={{ 
               background: 'radial-gradient(circle, #8A2BE2 0%, #FF1493 70%, transparent 100%)',
               bottom: '30%',
               left: '70%',
               animation: 'particleFloat 6s ease-in-out infinite 4s',
               boxShadow: '0 0 10px rgba(138, 43, 226, 0.6)'
             }} />
      </div>
      
    </div>
  );
}