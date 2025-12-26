'use client';

import { useEffect, useRef } from 'react';

export default function EminenceShadowEffect() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const shadowLinesRef = useRef<any[]>([]);
  const floatingOrbsRef = useRef<any[]>([]);
  const energyBeamsRef = useRef<any[]>([]);
  const timeRef = useRef(0);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Palette de couleurs Eminence in Shadow
    const colors = {
      primary: '#8A2BE2',     // Violet
      secondary: '#C724B1',   // Rose néon
      tertiary: '#FF1493',    // Deep pink
      glow: '#E0B0FF',       // Lavande clair
      dark: '#4B0082'        // Indigo
    };

    // Configuration responsive
    const isMobile = window.innerWidth < 768;
    const config = {
      lineCount: isMobile ? 5 : 8,
      orbCount: isMobile ? 4 : 6,
      beamCount: isMobile ? 2 : 3,
      radius: isMobile ? 200 : 300
    };

    // Resize canvas
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Mouse tracking
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Get random color
    const getRandomColor = () => {
      const colorArray = [colors.primary, colors.secondary, colors.tertiary];
      return colorArray[Math.floor(Math.random() * colorArray.length)];
    };

    // Create shadow lines that orbit around center
    const createShadowLines = () => {
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      
      for (let i = 0; i < config.lineCount; i++) {
        const angle = (Math.PI * 2 / config.lineCount) * i;
        shadowLinesRef.current.push({
          angle: angle,
          speed: 0.002 + Math.random() * 0.003,
          width: 2 + Math.random() * 2,
          opacity: 0.3 + Math.random() * 0.4,
          color: getRandomColor(),
          offset: Math.random() * Math.PI * 2,
          radiusOffset: Math.random() * 50 - 25,
          length: 80 + Math.random() * 40
        });
      }
    };

    // Create floating orbs
    const createFloatingOrbs = () => {
      for (let i = 0; i < config.orbCount; i++) {
        floatingOrbsRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          radius: 3 + Math.random() * 5,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          opacity: 0.5 + Math.random() * 0.3,
          pulsePhase: Math.random() * Math.PI * 2,
          color: getRandomColor()
        });
      }
    };

    // Create energy beams
    const createEnergyBeams = () => {
      for (let i = 0; i < config.beamCount; i++) {
        energyBeamsRef.current.push({
          active: false,
          startX: 0,
          startY: 0,
          endX: 0,
          endY: 0,
          progress: 0,
          speed: 0.02,
          width: 3,
          color: colors.secondary
        });
      }
    };

    // Initialize all effects
    createShadowLines();
    createFloatingOrbs();
    createEnergyBeams();

    // Draw shadow line
    const drawShadowLine = (line: any) => {
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = config.radius + line.radiusOffset;
      
      // Animate line around center
      const animatedAngle = line.angle + timeRef.current * line.speed + line.offset;
      const radiusVariation = Math.sin(timeRef.current * 0.001 + line.offset) * 30;
      const currentRadius = radius + radiusVariation;
      
      // Calculate positions
      const startX = centerX + Math.cos(animatedAngle) * currentRadius;
      const startY = centerY + Math.sin(animatedAngle) * currentRadius;
      const endX = centerX + Math.cos(animatedAngle + 0.3) * (currentRadius + line.length);
      const endY = centerY + Math.sin(animatedAngle + 0.3) * (currentRadius + line.length);
      
      // Control points for bezier curve
      const cp1x = centerX + Math.cos(animatedAngle + 0.1) * (currentRadius + line.length * 0.3);
      const cp1y = centerY + Math.sin(animatedAngle + 0.1) * (currentRadius + line.length * 0.3);
      const cp2x = centerX + Math.cos(animatedAngle + 0.2) * (currentRadius + line.length * 0.7);
      const cp2y = centerY + Math.sin(animatedAngle + 0.2) * (currentRadius + line.length * 0.7);
      
      // Mouse interaction
      const mouseDistance = Math.sqrt(
        Math.pow(mouseRef.current.x - startX, 2) + 
        Math.pow(mouseRef.current.y - startY, 2)
      );
      const mouseInfluence = Math.max(0, 1 - mouseDistance / 200);
      
      // Pulse opacity
      const pulse = Math.sin(timeRef.current * 0.002 + line.offset) * 0.2 + 0.8;
      
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      
      // Draw multiple layers for neon effect
      for (let i = 4; i >= 0; i--) {
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, endX, endY);
        
        if (i === 0) {
          // White center line
          ctx.strokeStyle = `rgba(255, 255, 255, ${line.opacity * pulse * (1 + mouseInfluence)})`;
          ctx.lineWidth = line.width * 0.3;
        } else {
          // Glow layers
          ctx.strokeStyle = line.color;
          ctx.globalAlpha = (line.opacity * pulse * (1 + mouseInfluence)) / (i * 2);
          ctx.lineWidth = line.width * (i + 1);
          ctx.shadowColor = line.color;
          ctx.shadowBlur = 10 * i;
        }
        
        ctx.stroke();
      }
      
      ctx.restore();
    };

    // Draw floating orb
    const drawFloatingOrb = (orb: any) => {
      // Update position
      orb.x += orb.vx;
      orb.y += orb.vy;
      
      // Bounce off edges
      if (orb.x < 0 || orb.x > canvas.width) orb.vx *= -1;
      if (orb.y < 0 || orb.y > canvas.height) orb.vy *= -1;
      
      // Pulse
      orb.pulsePhase += 0.02;
      const pulse = Math.sin(orb.pulsePhase) * 0.3 + 0.7;
      
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      
      // Radial gradient for orb
      const gradient = ctx.createRadialGradient(
        orb.x, orb.y, 0,
        orb.x, orb.y, orb.radius * 3
      );
      gradient.addColorStop(0, `rgba(255, 255, 255, ${orb.opacity})`);
      gradient.addColorStop(0.3, orb.color);
      gradient.addColorStop(1, 'transparent');
      
      ctx.fillStyle = gradient;
      ctx.globalAlpha = orb.opacity * pulse;
      ctx.fillRect(
        orb.x - orb.radius * 3,
        orb.y - orb.radius * 3,
        orb.radius * 6,
        orb.radius * 6
      );
      
      // Bright center
      ctx.beginPath();
      ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${orb.opacity * pulse})`;
      ctx.fill();
      
      ctx.restore();
    };

    // Trigger energy beam
    const triggerEnergyBeam = () => {
      if (Math.random() > 0.98) {
        const beam = energyBeamsRef.current.find((b: any) => !b.active);
        if (beam) {
          beam.active = true;
          beam.progress = 0;
          
          // Random edge position
          const side = Math.floor(Math.random() * 4);
          const centerX = canvas.width / 2;
          const centerY = canvas.height / 2;
          
          switch(side) {
            case 0: // Top
              beam.startX = Math.random() * canvas.width;
              beam.startY = 0;
              break;
            case 1: // Right
              beam.startX = canvas.width;
              beam.startY = Math.random() * canvas.height;
              break;
            case 2: // Bottom
              beam.startX = Math.random() * canvas.width;
              beam.startY = canvas.height;
              break;
            case 3: // Left
              beam.startX = 0;
              beam.startY = Math.random() * canvas.height;
              break;
          }
          
          // Target near center
          beam.endX = centerX + (Math.random() - 0.5) * 200;
          beam.endY = centerY + (Math.random() - 0.5) * 200;
        }
      }
    };

    // Draw energy beam
    const drawEnergyBeam = (beam: any) => {
      if (!beam.active) return;
      
      beam.progress += beam.speed;
      if (beam.progress >= 1) {
        beam.active = false;
        return;
      }
      
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      
      // Current position
      const currentX = beam.startX + (beam.endX - beam.startX) * beam.progress;
      const currentY = beam.startY + (beam.endY - beam.startY) * beam.progress;
      
      // Trail
      const trailLength = 100;
      const trailX = currentX - (beam.endX - beam.startX) * (trailLength / canvas.width);
      const trailY = currentY - (beam.endY - beam.startY) * (trailLength / canvas.height);
      
      // Gradient
      const gradient = ctx.createLinearGradient(trailX, trailY, currentX, currentY);
      gradient.addColorStop(0, 'transparent');
      gradient.addColorStop(0.5, beam.color);
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0.8)');
      
      // Draw beam
      ctx.beginPath();
      ctx.moveTo(trailX, trailY);
      ctx.lineTo(currentX, currentY);
      ctx.strokeStyle = gradient;
      ctx.lineWidth = beam.width;
      ctx.shadowColor = beam.color;
      ctx.shadowBlur = 20;
      ctx.stroke();
      
      // Bright point at tip
      ctx.beginPath();
      ctx.arc(currentX, currentY, beam.width * 2, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.fill();
      
      ctx.restore();
    };

    // Animation loop
    let animationId: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      timeRef.current++;
      
      // Draw all effects
      shadowLinesRef.current.forEach(line => drawShadowLine(line));
      floatingOrbsRef.current.forEach(orb => drawFloatingOrb(orb));
      
      // Trigger and draw energy beams
      triggerEnergyBeam();
      energyBeamsRef.current.forEach(beam => drawEnergyBeam(beam));
      
      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <div className="absolute inset-0">
      {/* Dark professional gradient background */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(139, 43, 226, 0.05) 0%, rgba(75, 0, 130, 0.1) 50%, #0b0614 100%)'
        }}
      />
      
      {/* Canvas for shadow effects */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 z-10"
        style={{ 
          pointerEvents: 'none',
          opacity: 0.8
        }}
      />
      
      {/* Subtle grid overlay */}
      <div 
        className="absolute inset-0 z-5 opacity-10"
        style={{
          backgroundImage: `
            linear-gradient(rgba(139, 43, 226, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(139, 43, 226, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }}
      />
    </div>
  );
}