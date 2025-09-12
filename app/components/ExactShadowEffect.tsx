'use client';

import { useEffect, useRef } from 'react';

export default function ExactShadowEffect() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    class ShadowLinesEffect {
      shadowLines: any[] = [];
      floatingOrbs: any[] = [];
      energyBeams: any[] = [];
      time = 0;
      mouseX = 0;
      mouseY = 0;
      isMobile = window.innerWidth < 768;
      
      colors = {
        primary: '#8A2BE2',
        secondary: '#C724B1', 
        tertiary: '#FF1493'
      };
      
      constructor() {
        this.init();
        this.animate();
      }
      
      init() {
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        window.addEventListener('mousemove', (e) => {
          this.mouseX = e.clientX;
          this.mouseY = e.clientY;
        });
        
        this.createShadowLines();
        if (!this.isMobile) {
          this.createFloatingOrbs();
          this.createEnergyBeams();
        }
      }
      
      resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
      
      createShadowLines() {
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = 300;
        
        // 8 curved bezier lines rotating around center
        for (let i = 0; i < 8; i++) {
          const angle = (Math.PI * 2 / 8) * i;
          this.shadowLines.push({
            angle: angle,
            speed: 0.002 + Math.random() * 0.003,
            width: 2 + Math.random() * 2,
            opacity: 0.3 + Math.random() * 0.4,
            color: [this.colors.primary, this.colors.secondary, this.colors.tertiary][Math.floor(Math.random() * 3)],
            offset: Math.random() * Math.PI * 2,
            baseRadius: radius,
            pulseAmount: 20 + Math.random() * 30
          });
        }
      }
      
      createFloatingOrbs() {
        for (let i = 0; i < 5; i++) {
          this.floatingOrbs.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            radius: 3 + Math.random() * 5,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5,
            opacity: 0.5 + Math.random() * 0.3,
            pulsePhase: Math.random() * Math.PI * 2,
            color: [this.colors.primary, this.colors.secondary, this.colors.tertiary][Math.floor(Math.random() * 3)]
          });
        }
      }
      
      createEnergyBeams() {
        for (let i = 0; i < 3; i++) {
          this.energyBeams.push({
            active: false,
            startX: 0,
            startY: 0,
            endX: 0,
            endY: 0,
            progress: 0,
            speed: 0.02,
            width: 3,
            color: this.colors.secondary
          });
        }
      }
      
      drawShadowLine(line: any) {
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        
        // Animate line around center with pulse
        const animatedAngle = line.angle + this.time * line.speed + line.offset;
        const pulse = Math.sin(this.time * 0.001 + line.offset) * line.pulseAmount;
        const currentRadius = line.baseRadius + pulse;
        
        // Mouse interaction
        const mouseDistance = Math.sqrt(
          Math.pow(this.mouseX - centerX, 2) + 
          Math.pow(this.mouseY - centerY, 2)
        );
        const mouseAngle = Math.atan2(this.mouseY - centerY, this.mouseX - centerX);
        const angleDiff = Math.abs(mouseAngle - animatedAngle);
        const mouseInfluence = Math.max(0, 1 - angleDiff / Math.PI) * (1 - mouseDistance / 500) * 50;
        
        // Bezier curve points
        const startX = centerX + Math.cos(animatedAngle) * (currentRadius + mouseInfluence);
        const startY = centerY + Math.sin(animatedAngle) * (currentRadius + mouseInfluence);
        const endX = centerX + Math.cos(animatedAngle + 0.5) * (currentRadius + 100);
        const endY = centerY + Math.sin(animatedAngle + 0.5) * (currentRadius + 100);
        const cp1x = centerX + Math.cos(animatedAngle + 0.2) * (currentRadius + 50);
        const cp1y = centerY + Math.sin(animatedAngle + 0.2) * (currentRadius + 50);
        const cp2x = centerX + Math.cos(animatedAngle + 0.3) * (currentRadius + 80);
        const cp2y = centerY + Math.sin(animatedAngle + 0.3) * (currentRadius + 80);
        
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        
        // Multi-layer glow effect
        for (let i = 4; i >= 0; i--) {
          ctx.beginPath();
          ctx.moveTo(startX, startY);
          ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, endX, endY);
          
          if (i === 0) {
            ctx.strokeStyle = `rgba(255, 255, 255, ${line.opacity})`;
            ctx.lineWidth = line.width * 0.3;
          } else {
            ctx.strokeStyle = line.color;
            ctx.globalAlpha = line.opacity / (i * 2);
            ctx.lineWidth = line.width * (i + 1);
            ctx.shadowColor = line.color;
            ctx.shadowBlur = 10 * i;
          }
          
          ctx.stroke();
        }
        
        ctx.restore();
      }
      
      drawFloatingOrb(orb: any) {
        orb.x += orb.vx;
        orb.y += orb.vy;
        
        if (orb.x < 0 || orb.x > canvas.width) orb.vx *= -1;
        if (orb.y < 0 || orb.y > canvas.height) orb.vy *= -1;
        
        orb.pulsePhase += 0.02;
        const pulse = Math.sin(orb.pulsePhase) * 0.3 + 0.7;
        
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        
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
        
        ctx.restore();
      }
      
      triggerEnergyBeam() {
        if (Math.random() > 0.98 && !this.isMobile) {
          const beam = this.energyBeams.find((b: any) => !b.active);
          if (beam) {
            beam.active = true;
            beam.progress = 0;
            
            const side = Math.floor(Math.random() * 4);
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            
            switch(side) {
              case 0:
                beam.startX = Math.random() * canvas.width;
                beam.startY = 0;
                break;
              case 1:
                beam.startX = canvas.width;
                beam.startY = Math.random() * canvas.height;
                break;
              case 2:
                beam.startX = Math.random() * canvas.width;
                beam.startY = canvas.height;
                break;
              case 3:
                beam.startX = 0;
                beam.startY = Math.random() * canvas.height;
                break;
            }
            
            beam.endX = centerX + (Math.random() - 0.5) * 200;
            beam.endY = centerY + (Math.random() - 0.5) * 200;
          }
        }
      }
      
      drawEnergyBeam(beam: any) {
        if (!beam.active) return;
        
        beam.progress += beam.speed;
        if (beam.progress >= 1) {
          beam.active = false;
          return;
        }
        
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        
        const currentX = beam.startX + (beam.endX - beam.startX) * beam.progress;
        const currentY = beam.startY + (beam.endY - beam.startY) * beam.progress;
        
        const trailLength = 100;
        const trailX = currentX - (beam.endX - beam.startX) * (trailLength / canvas.width);
        const trailY = currentY - (beam.endY - beam.startY) * (trailLength / canvas.height);
        
        const gradient = ctx.createLinearGradient(trailX, trailY, currentX, currentY);
        gradient.addColorStop(0, 'transparent');
        gradient.addColorStop(0.5, beam.color);
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0.8)');
        
        ctx.beginPath();
        ctx.moveTo(trailX, trailY);
        ctx.lineTo(currentX, currentY);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = beam.width;
        ctx.shadowColor = beam.color;
        ctx.shadowBlur = 20;
        ctx.stroke();
        
        ctx.restore();
      }
      
      animate = () => {
        // Clear canvas each frame
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        this.time++;
        
        // Draw all effects
        this.shadowLines.forEach(line => this.drawShadowLine(line));
        
        if (!this.isMobile) {
          this.floatingOrbs.forEach(orb => this.drawFloatingOrb(orb));
          this.triggerEnergyBeam();
          this.energyBeams.forEach(beam => this.drawEnergyBeam(beam));
        }
        
        requestAnimationFrame(this.animate);
      }
    }

    new ShadowLinesEffect();

    return () => {
      // Cleanup
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none">
      <div 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(135deg, #0a0a0a 0%, #1a0a2e 50%, #16213e 100%)'
        }}
      />
      
      <canvas
        ref={canvasRef}
        className="absolute inset-0 z-10"
      />
    </div>
  );
}