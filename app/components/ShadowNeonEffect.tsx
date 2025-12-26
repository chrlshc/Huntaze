'use client';

import { useEffect, useRef } from 'react';

export default function ShadowNeonEffect() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const shadowLinesRef = useRef<any[]>([]);
  const energyTendrilsRef = useRef<any[]>([]);
  const mouseRef = useRef({ x: 0, y: 0 });
  const pulsePhaseRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Eminence in Shadow color palette
    const colors = {
      deepViolet: '#8A2BE2',
      neonPurple: '#C724B1',
      magenta: '#FF1493',
      darkPurple: '#9932CC',
      atomicGlow: '#E0B0FF',
      shadowCore: '#4B0082'
    };

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initialize shadow lines
    for (let i = 0; i < 5; i++) {
      shadowLinesRef.current.push({
        startX: Math.random() * canvas.width,
        startY: Math.random() * canvas.height,
        endX: Math.random() * canvas.width,
        endY: Math.random() * canvas.height,
        controlX1: Math.random() * canvas.width,
        controlY1: Math.random() * canvas.height,
        controlX2: Math.random() * canvas.width,
        controlY2: Math.random() * canvas.height,
        speed: Math.random() * 0.5 + 0.5,
        width: Math.random() * 3 + 2,
        opacity: 0.7,
        color: [colors.deepViolet, colors.neonPurple, colors.darkPurple][Math.floor(Math.random() * 3)]
      });
    }

    // Mouse tracking
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
    };
    canvas.addEventListener('mousemove', handleMouseMove);

    // Create energy tendril
    const createEnergyTendril = () => {
      const tendril = {
        points: [] as any[],
        color: colors.atomicGlow,
        life: 1.0,
        decay: 0.005
      };
      
      const segments = 20;
      const startAngle = Math.random() * Math.PI * 2;
      const radius = 150 + Math.random() * 100;
      
      for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const angle = startAngle + t * Math.PI;
        const r = radius * (1 - t * 0.5);
        
        tendril.points.push({
          x: canvas.width / 2 + Math.cos(angle) * r,
          y: canvas.height / 2 + Math.sin(angle) * r,
          size: (1 - t) * 5 + 1
        });
      }
      
      energyTendrilsRef.current.push(tendril);
    };

    // Initialize energy tendrils
    for (let i = 0; i < 3; i++) {
      createEnergyTendril();
    }

    // Draw neon line with multi-layer glow
    const drawNeonLine = (x1: number, y1: number, x2: number, y2: number, color: string, width = 2) => {
      const layers = [
        { width: width * 4, opacity: 0.1, blur: 30 },
        { width: width * 3, opacity: 0.2, blur: 20 },
        { width: width * 2, opacity: 0.3, blur: 10 },
        { width: width, opacity: 0.8, blur: 5 },
        { width: width * 0.5, opacity: 1, blur: 0, color: '#ffffff' }
      ];
      
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      
      layers.forEach(layer => {
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.lineWidth = layer.width;
        ctx.strokeStyle = layer.color || color;
        ctx.globalAlpha = layer.opacity;
        ctx.shadowColor = color;
        ctx.shadowBlur = layer.blur;
        ctx.stroke();
      });
      
      ctx.restore();
    };

    // Draw shadow tendril
    const drawShadowTendril = (line: any) => {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      
      const pulse = Math.sin(pulsePhaseRef.current + line.speed * 10) * 0.3 + 0.7;
      
      // Draw multiple layers for glow effect
      for (let i = 5; i >= 0; i--) {
        ctx.beginPath();
        ctx.moveTo(line.startX, line.startY);
        ctx.bezierCurveTo(
          line.controlX1, line.controlY1,
          line.controlX2, line.controlY2,
          line.endX, line.endY
        );
        
        const layerWidth = line.width * (i + 1);
        const layerOpacity = i === 0 ? 1 : 0.15;
        
        ctx.lineWidth = layerWidth;
        ctx.strokeStyle = i === 0 ? '#ffffff' : line.color;
        ctx.globalAlpha = layerOpacity * line.opacity * pulse;
        ctx.shadowColor = line.color;
        ctx.shadowBlur = 20;
        ctx.stroke();
      }
      
      ctx.restore();
    };

    // Draw atomic core
    const drawAtomicCore = () => {
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const coreRadius = 50 + Math.sin(pulsePhaseRef.current * 2) * 10;
      
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      
      const gradient = ctx.createRadialGradient(
        centerX, centerY, 0,
        centerX, centerY, coreRadius * 3
      );
      gradient.addColorStop(0, colors.atomicGlow);
      gradient.addColorStop(0.3, colors.neonPurple);
      gradient.addColorStop(0.6, colors.deepViolet);
      gradient.addColorStop(1, 'transparent');
      
      ctx.fillStyle = gradient;
      ctx.globalAlpha = 0.3 + Math.sin(pulsePhaseRef.current) * 0.1;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.restore();
    };

    // Draw energy tendrils
    const drawEnergyTendrils = () => {
      energyTendrilsRef.current = energyTendrilsRef.current.filter(tendril => tendril.life > 0);
      
      energyTendrilsRef.current.forEach(tendril => {
        tendril.life -= tendril.decay;
        
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = tendril.life;
        
        // Draw tendril as connected points
        ctx.beginPath();
        tendril.points.forEach((point: any, index: number) => {
          if (index === 0) {
            ctx.moveTo(point.x, point.y);
          } else {
            ctx.lineTo(point.x, point.y);
          }
          
          // Animate points
          point.x += Math.sin(pulsePhaseRef.current * 2 + index * 0.1) * 0.5;
          point.y += Math.cos(pulsePhaseRef.current * 2 + index * 0.1) * 0.5;
        });
        
        ctx.strokeStyle = tendril.color;
        ctx.lineWidth = 2;
        ctx.shadowColor = colors.atomicGlow;
        ctx.shadowBlur = 30;
        ctx.stroke();
        
        ctx.restore();
      });
      
      // Create new tendrils periodically
      if (Math.random() > 0.98 && energyTendrilsRef.current.length < 5) {
        createEnergyTendril();
      }
    };

    // Update shadow lines
    const updateShadowLines = () => {
      shadowLinesRef.current.forEach(line => {
        // Smooth bezier animation
        line.controlX1 += Math.sin(pulsePhaseRef.current * line.speed) * 2;
        line.controlY1 += Math.cos(pulsePhaseRef.current * line.speed) * 2;
        line.controlX2 += Math.sin(pulsePhaseRef.current * line.speed * 1.5) * 2;
        line.controlY2 += Math.cos(pulsePhaseRef.current * line.speed * 1.5) * 2;
        
        // Drift towards mouse
        const dx = mouseRef.current.x - line.endX;
        const dy = mouseRef.current.y - line.endY;
        line.endX += dx * 0.02;
        line.endY += dy * 0.02;
        
        // Wrap around screen edges
        if (line.startX < 0) line.startX = canvas.width;
        if (line.startX > canvas.width) line.startX = 0;
        if (line.startY < 0) line.startY = canvas.height;
        if (line.startY > canvas.height) line.startY = 0;
      });
    };

    // Animation loop
    let animationId: number;
    const animate = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Update phase
      pulsePhaseRef.current += 0.02;
      
      // Update and draw all effects
      updateShadowLines();
      
      // Draw atomic core background
      drawAtomicCore();
      
      // Draw shadow tendrils
      shadowLinesRef.current.forEach(line => {
        drawShadowTendril(line);
      });
      
      // Draw energy tendrils
      drawEnergyTendrils();
      
      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resizeCanvas);
      canvas.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <div className="absolute inset-0">
      {/* Dark gradient background inspired by the anime */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(139, 43, 226, 0.1) 0%, rgba(75, 0, 130, 0.2) 50%, rgba(0, 0, 0, 0.9) 100%)'
        }}
      />
      
      {/* Shadow lines background pattern */}
      <div 
        className="shadow-lines absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            repeating-linear-gradient(
              45deg,
              transparent,
              transparent 100px,
              rgba(199, 36, 177, 0.03) 100px,
              rgba(199, 36, 177, 0.03) 200px
            )
          `,
          animation: 'shadowFlow 20s linear infinite'
        }}
      />
      
      {/* Canvas for the neon effects */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 z-10 pointer-events-none"
      />
    </div>
  );
}