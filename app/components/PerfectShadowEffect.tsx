'use client';

import { useEffect, useRef } from 'react';

export default function PerfectShadowEffect() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Classe pour créer les lignes d'ombre néon AUTOUR du contenu
    class ShadowLinesEffect {
      shadowLines: any[] = [];
      floatingOrbs: any[] = [];
      energyBeams: any[] = [];
      time = 0;
      mouseX = 0;
      mouseY = 0;
      
      // Palette de couleurs Shadow
      colors = {
        primary: '#8A2BE2',     // Violet
        secondary: '#C724B1',   // Rose néon
        tertiary: '#FF1493',    // Deep pink
        glow: '#E0B0FF',       // Lavande clair
        dark: '#4B0082'        // Indigo
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
        
        // Créer les lignes d'ombre flottantes
        this.createShadowLines();
        this.createFloatingOrbs();
        this.createEnergyBeams();
      }
      
      resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
      
      createShadowLines() {
        // Créer des lignes qui flottent AUTOUR du contenu central
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = 300;
        
        for (let i = 0; i < 8; i++) {
          const angle = (Math.PI * 2 / 8) * i;
          this.shadowLines.push({
            // Position de départ en cercle autour du centre
            startX: centerX + Math.cos(angle) * radius,
            startY: centerY + Math.sin(angle) * radius,
            // Position de fin
            endX: centerX + Math.cos(angle + 0.5) * (radius + 100),
            endY: centerY + Math.sin(angle + 0.5) * (radius + 100),
            // Points de contrôle pour courbe de Bézier
            cp1x: centerX + Math.cos(angle + 0.2) * (radius + 50),
            cp1y: centerY + Math.sin(angle + 0.2) * (radius + 50),
            cp2x: centerX + Math.cos(angle + 0.3) * (radius + 80),
            cp2y: centerY + Math.sin(angle + 0.3) * (radius + 80),
            // Propriétés d'animation
            angle: angle,
            speed: 0.002 + Math.random() * 0.003,
            width: 2 + Math.random() * 2,
            opacity: 0.3 + Math.random() * 0.4,
            color: this.getRandomColor(),
            offset: Math.random() * Math.PI * 2
          });
        }
      }
      
      createFloatingOrbs() {
        // Créer des orbes qui flottent autour
        for (let i = 0; i < 6; i++) {
          this.floatingOrbs.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            radius: 3 + Math.random() * 5,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5,
            opacity: 0.5 + Math.random() * 0.3,
            pulsePhase: Math.random() * Math.PI * 2,
            color: this.getRandomColor()
          });
        }
      }
      
      createEnergyBeams() {
        // Créer des faisceaux d'énergie qui apparaissent périodiquement
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
      
      getRandomColor() {
        const colors = [this.colors.primary, this.colors.secondary, this.colors.tertiary];
        return colors[Math.floor(Math.random() * colors.length)];
      }
      
      drawShadowLine(line: any) {
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = 300;
        
        // Animer la ligne autour du centre
        const animatedAngle = line.angle + this.time * line.speed + line.offset;
        const radiusVariation = Math.sin(this.time * 0.001 + line.offset) * 50;
        const currentRadius = radius + radiusVariation;
        
        // Recalculer les positions avec l'animation
        line.startX = centerX + Math.cos(animatedAngle) * currentRadius;
        line.startY = centerY + Math.sin(animatedAngle) * currentRadius;
        line.endX = centerX + Math.cos(animatedAngle + 0.5) * (currentRadius + 100);
        line.endY = centerY + Math.sin(animatedAngle + 0.5) * (currentRadius + 100);
        line.cp1x = centerX + Math.cos(animatedAngle + 0.2) * (currentRadius + 50);
        line.cp1y = centerY + Math.sin(animatedAngle + 0.2) * (currentRadius + 50);
        line.cp2x = centerX + Math.cos(animatedAngle + 0.3) * (currentRadius + 80);
        line.cp2y = centerY + Math.sin(animatedAngle + 0.3) * (currentRadius + 80);
        
        // Pulse d'opacité
        const pulse = Math.sin(this.time * 0.002 + line.offset) * 0.2 + 0.8;
        
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        
        // Dessiner plusieurs couches pour l'effet néon
        for (let i = 4; i >= 0; i--) {
          ctx.beginPath();
          ctx.moveTo(line.startX, line.startY);
          ctx.bezierCurveTo(
            line.cp1x, line.cp1y,
            line.cp2x, line.cp2y,
            line.endX, line.endY
          );
          
          if (i === 0) {
            // Ligne centrale blanche
            ctx.strokeStyle = 'rgba(255, 255, 255, ' + (line.opacity * pulse) + ')';
            ctx.lineWidth = line.width * 0.3;
          } else {
            // Couches de glow
            ctx.strokeStyle = line.color;
            ctx.globalAlpha = (line.opacity * pulse) / (i * 2);
            ctx.lineWidth = line.width * (i + 1);
            ctx.shadowColor = line.color;
            ctx.shadowBlur = 10 * i;
          }
          
          ctx.stroke();
        }
        
        ctx.restore();
      }
      
      drawFloatingOrb(orb: any) {
        // Animer l'orbe
        orb.x += orb.vx;
        orb.y += orb.vy;
        
        // Rebondir sur les bords
        if (orb.x < 0 || orb.x > canvas.width) orb.vx *= -1;
        if (orb.y < 0 || orb.y > canvas.height) orb.vy *= -1;
        
        // Pulse
        orb.pulsePhase += 0.02;
        const pulse = Math.sin(orb.pulsePhase) * 0.3 + 0.7;
        
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        
        // Gradient radial pour l'orbe
        const gradient = ctx.createRadialGradient(
          orb.x, orb.y, 0,
          orb.x, orb.y, orb.radius * 3
        );
        gradient.addColorStop(0, 'rgba(255, 255, 255, ' + orb.opacity + ')');
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
        
        // Centre brillant
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, ' + (orb.opacity * pulse) + ')';
        ctx.fill();
        
        ctx.restore();
      }
      
      triggerEnergyBeam() {
        // Déclencher un faisceau d'énergie aléatoirement
        if (Math.random() > 0.98) {
          const beam = this.energyBeams.find((b: any) => !b.active);
          if (beam) {
            beam.active = true;
            beam.progress = 0;
            
            // Position aléatoire sur les bords
            const side = Math.floor(Math.random() * 4);
            switch(side) {
              case 0: // Haut
                beam.startX = Math.random() * canvas.width;
                beam.startY = 0;
                beam.endX = canvas.width / 2 + (Math.random() - 0.5) * 200;
                beam.endY = canvas.height / 2 + (Math.random() - 0.5) * 200;
                break;
              case 1: // Droite
                beam.startX = canvas.width;
                beam.startY = Math.random() * canvas.height;
                beam.endX = canvas.width / 2 + (Math.random() - 0.5) * 200;
                beam.endY = canvas.height / 2 + (Math.random() - 0.5) * 200;
                break;
              case 2: // Bas
                beam.startX = Math.random() * canvas.width;
                beam.startY = canvas.height;
                beam.endX = canvas.width / 2 + (Math.random() - 0.5) * 200;
                beam.endY = canvas.height / 2 + (Math.random() - 0.5) * 200;
                break;
              case 3: // Gauche
                beam.startX = 0;
                beam.startY = Math.random() * canvas.height;
                beam.endX = canvas.width / 2 + (Math.random() - 0.5) * 200;
                beam.endY = canvas.height / 2 + (Math.random() - 0.5) * 200;
                break;
            }
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
        
        // Calculer la position actuelle du faisceau
        const currentX = beam.startX + (beam.endX - beam.startX) * beam.progress;
        const currentY = beam.startY + (beam.endY - beam.startY) * beam.progress;
        
        // Traînée du faisceau
        const trailLength = 100;
        const trailX = currentX - (beam.endX - beam.startX) * (trailLength / canvas.width);
        const trailY = currentY - (beam.endY - beam.startY) * (trailLength / canvas.height);
        
        // Gradient pour le faisceau
        const gradient = ctx.createLinearGradient(trailX, trailY, currentX, currentY);
        gradient.addColorStop(0, 'transparent');
        gradient.addColorStop(0.5, beam.color);
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0.8)');
        
        // Dessiner le faisceau
        ctx.beginPath();
        ctx.moveTo(trailX, trailY);
        ctx.lineTo(currentX, currentY);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = beam.width;
        ctx.shadowColor = beam.color;
        ctx.shadowBlur = 20;
        ctx.stroke();
        
        // Point lumineux à l'extrémité
        ctx.beginPath();
        ctx.arc(currentX, currentY, beam.width * 2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fill();
        
        ctx.restore();
      }
      
      animate = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        this.time++;
        
        // Dessiner les effets
        this.shadowLines.forEach(line => this.drawShadowLine(line));
        this.floatingOrbs.forEach(orb => this.drawFloatingOrb(orb));
        
        // Déclencher et dessiner les faisceaux d'énergie
        this.triggerEnergyBeam();
        this.energyBeams.forEach(beam => this.drawEnergyBeam(beam));
        
        requestAnimationFrame(this.animate);
      }
    }

    // Initialiser l'effet
    new ShadowLinesEffect();

    return () => {
      // Cleanup handled by garbage collection
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none">
      {/* Background gradient exactement comme le HTML */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(135deg, #0a0a0a 0%, #1a0a2e 50%, #16213e 100%)'
        }}
      />
      
      {/* Canvas pour les lignes */}
      <canvas
        ref={canvasRef}
        id="shadowCanvas"
        className="absolute inset-0 z-10"
      />
    </div>
  );
}