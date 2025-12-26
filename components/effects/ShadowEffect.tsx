'use client';

import { useEffect, useRef } from 'react';

export type ShadowEffectVariant = 'huntaze' | 'perfect' | 'eminence' | 'basic';

interface ShadowEffectProps {
  variant?: ShadowEffectVariant;
}

class HuntazeLines {
  lines: any[] = [];
  time = 0;

  colors = {
    purple: getComputedStyle(document.documentElement).getPropertyValue('--accent-primary').trim() || '#8b5cf6',
    pink: getComputedStyle(document.documentElement).getPropertyValue('--accent-error').trim() || 'var(--accent-error)',
    purpleLight: getComputedStyle(document.documentElement).getPropertyValue('--accent-primary-hover').trim() || '#7c3aed',
    pinkLight: getComputedStyle(document.documentElement).getPropertyValue('--accent-warning').trim() || 'var(--accent-warning)',
    white: getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim() || '#fafafa'
  };

  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private variant: ShadowEffectVariant;
  private animationId: number | null = null;
  private handleResize: () => void;

  constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, variant: ShadowEffectVariant) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.variant = variant;
    this.handleResize = () => this.resizeCanvas();
    this.init();
  }

  init() {
    this.resizeCanvas();
    window.addEventListener('resize', this.handleResize);
    this.createLines();
    this.animate();
  }

  dispose() {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
    }
    window.removeEventListener('resize', this.handleResize);
  }

  resizeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  createLines() {
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    const radius = 350;

    const lineCount = this.variant === 'basic' ? 8 : 12;

    for (let i = 0; i < lineCount; i++) {
      const angle = (Math.PI * 2 / lineCount) * i;
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
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;

    const currentAngle = line.angle + this.time * line.speed;

    const startX = centerX + Math.cos(currentAngle) * line.radius;
    const startY = centerY + Math.sin(currentAngle) * line.radius;
    const endX = centerX + Math.cos(currentAngle) * (line.radius + line.length);
    const endY = centerY + Math.sin(currentAngle) * (line.radius + line.length);

    const pulse = Math.sin(this.time * 0.002 + line.angle) * 0.3 + 0.7;

    this.ctx.save();
    this.ctx.globalCompositeOperation = 'screen';

    this.ctx.beginPath();
    this.ctx.moveTo(startX, startY);
    this.ctx.lineTo(endX, endY);
    this.ctx.strokeStyle = line.glowColor;
    this.ctx.lineWidth = line.width * 8;
    this.ctx.globalAlpha = line.opacity * pulse * 0.1;
    this.ctx.shadowColor = line.glowColor;
    this.ctx.shadowBlur = 30;
    this.ctx.stroke();

    this.ctx.beginPath();
    this.ctx.moveTo(startX, startY);
    this.ctx.lineTo(endX, endY);
    this.ctx.strokeStyle = line.color;
    this.ctx.lineWidth = line.width * 4;
    this.ctx.globalAlpha = line.opacity * pulse * 0.3;
    this.ctx.shadowColor = line.color;
    this.ctx.shadowBlur = 20;
    this.ctx.stroke();

    this.ctx.beginPath();
    this.ctx.moveTo(startX, startY);
    this.ctx.lineTo(endX, endY);
    this.ctx.strokeStyle = line.color;
    this.ctx.lineWidth = line.width;
    this.ctx.globalAlpha = line.opacity * pulse * 0.8;
    this.ctx.shadowColor = line.color;
    this.ctx.shadowBlur = 10;
    this.ctx.stroke();

    this.ctx.beginPath();
    this.ctx.moveTo(startX, startY);
    this.ctx.lineTo(endX, endY);
    this.ctx.strokeStyle = this.colors.white;
    this.ctx.lineWidth = line.width * 0.3;
    this.ctx.globalAlpha = line.opacity * pulse;
    this.ctx.shadowBlur = 0;
    this.ctx.stroke();

    this.ctx.restore();
  }

  animate = () => {
    const bgPrimary = getComputedStyle(document.documentElement).getPropertyValue('--bg-primary').trim() || '#09090b';
    this.ctx.fillStyle = `${bgPrimary}1a`;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.time++;
    this.lines.forEach(line => this.drawLine(line));

    this.animationId = requestAnimationFrame(this.animate);
  }
}

class ShadowLinesEffect {
  shadowLines: any[] = [];
  floatingOrbs: any[] = [];
  time = 0;

  colors = {
    primary: getComputedStyle(document.documentElement).getPropertyValue('--accent-primary').trim() || '#8b5cf6',
    secondary: getComputedStyle(document.documentElement).getPropertyValue('--accent-primary-hover').trim() || '#7c3aed',
    tertiary: getComputedStyle(document.documentElement).getPropertyValue('--accent-error').trim() || 'var(--accent-error)',
    glow: getComputedStyle(document.documentElement).getPropertyValue('--accent-bg-emphasis').trim() || 'rgba(139, 92, 246, 0.18)',
    dark: getComputedStyle(document.documentElement).getPropertyValue('--accent-primary-active').trim() || '#6d28d9'
  };

  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private animationId: number | null = null;
  private handleResize: () => void;

  constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.handleResize = () => this.resizeCanvas();
    this.init();
  }

  init() {
    this.resizeCanvas();
    window.addEventListener('resize', this.handleResize);
    this.createShadowLines();
    this.createFloatingOrbs();
    this.animate();
  }

  dispose() {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
    }
    window.removeEventListener('resize', this.handleResize);
  }

  resizeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  createShadowLines() {
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    const radius = 300;

    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 / 8) * i;
      this.shadowLines.push({
        startX: centerX + Math.cos(angle) * radius,
        startY: centerY + Math.sin(angle) * radius,
        endX: centerX + Math.cos(angle + 0.5) * (radius + 100),
        endY: centerY + Math.sin(angle + 0.5) * (radius + 100),
        cp1x: centerX + Math.cos(angle + 0.2) * (radius + 50),
        cp1y: centerY + Math.sin(angle + 0.2) * (radius + 50),
        cp2x: centerX + Math.cos(angle + 0.3) * (radius + 80),
        cp2y: centerY + Math.sin(angle + 0.3) * (radius + 80),
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
    for (let i = 0; i < 6; i++) {
      this.floatingOrbs.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        radius: 3 + Math.random() * 5,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        opacity: 0.5 + Math.random() * 0.3,
        pulsePhase: Math.random() * Math.PI * 2,
        color: this.getRandomColor()
      });
    }
  }

  getRandomColor() {
    const colors = [this.colors.primary, this.colors.secondary, this.colors.tertiary];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  drawShadowLine(line: any) {
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    const radius = 300;

    const animatedAngle = line.angle + this.time * line.speed + line.offset;
    const radiusVariation = Math.sin(this.time * 0.001 + line.offset) * 50;
    const currentRadius = radius + radiusVariation;

    line.startX = centerX + Math.cos(animatedAngle) * currentRadius;
    line.startY = centerY + Math.sin(animatedAngle) * currentRadius;
    line.endX = centerX + Math.cos(animatedAngle + 0.5) * (currentRadius + 100);
    line.endY = centerY + Math.sin(animatedAngle + 0.5) * (currentRadius + 100);
    line.cp1x = centerX + Math.cos(animatedAngle + 0.2) * (currentRadius + 50);
    line.cp1y = centerY + Math.sin(animatedAngle + 0.2) * (currentRadius + 50);
    line.cp2x = centerX + Math.cos(animatedAngle + 0.3) * (currentRadius + 80);
    line.cp2y = centerY + Math.sin(animatedAngle + 0.3) * (currentRadius + 80);

    const pulse = Math.sin(this.time * 0.002 + line.offset) * 0.2 + 0.8;

    this.ctx.save();
    this.ctx.globalCompositeOperation = 'screen';

    for (let i = 4; i >= 0; i--) {
      this.ctx.beginPath();
      this.ctx.moveTo(line.startX, line.startY);
      this.ctx.bezierCurveTo(
        line.cp1x, line.cp1y,
        line.cp2x, line.cp2y,
        line.endX, line.endY
      );

      if (i === 0) {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, ' + (line.opacity * pulse) + ')';
        this.ctx.lineWidth = line.width * 0.3;
      } else {
        this.ctx.strokeStyle = line.color;
        this.ctx.globalAlpha = (line.opacity * pulse) / (i * 2);
        this.ctx.lineWidth = line.width * (i + 1);
        this.ctx.shadowColor = line.color;
        this.ctx.shadowBlur = 10 * i;
      }

      this.ctx.stroke();
    }

    this.ctx.restore();
  }

  drawFloatingOrb(orb: any) {
    orb.x += orb.vx;
    orb.y += orb.vy;

    if (orb.x < 0 || orb.x > this.canvas.width) orb.vx *= -1;
    if (orb.y < 0 || orb.y > this.canvas.height) orb.vy *= -1;

    orb.pulsePhase += 0.02;
    const pulse = Math.sin(orb.pulsePhase) * 0.3 + 0.7;

    this.ctx.save();
    this.ctx.globalCompositeOperation = 'screen';

    const gradient = this.ctx.createRadialGradient(
      orb.x, orb.y, 0,
      orb.x, orb.y, orb.radius * 3
    );
    gradient.addColorStop(0, 'rgba(255, 255, 255, ' + orb.opacity + ')');
    gradient.addColorStop(0.3, orb.color);
    gradient.addColorStop(1, 'transparent');

    this.ctx.fillStyle = gradient;
    this.ctx.globalAlpha = orb.opacity * pulse;
    this.ctx.fillRect(
      orb.x - orb.radius * 3,
      orb.y - orb.radius * 3,
      orb.radius * 6,
      orb.radius * 6
    );

    this.ctx.beginPath();
    this.ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2);
    this.ctx.fillStyle = 'rgba(255, 255, 255, ' + (orb.opacity * pulse) + ')';
    this.ctx.fill();

    this.ctx.restore();
  }

  animate = () => {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.time++;

    this.shadowLines.forEach(line => this.drawShadowLine(line));
    this.floatingOrbs.forEach(orb => this.drawFloatingOrb(orb));

    this.animationId = requestAnimationFrame(this.animate);
  }
}

/**
 * Unified shadow effect component with multiple visual variants
 * Consolidates: HuntazeShadowEffect, PerfectShadowEffect, EminenceShadowEffect, BasicShadowEffect
 */
export default function ShadowEffect({ variant = 'huntaze' }: ShadowEffectProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let effectInstance: HuntazeLines | ShadowLinesEffect | null = null;

    if (variant === 'huntaze' || variant === 'basic') {
      effectInstance = new HuntazeLines(canvas, ctx, variant);
    }

    if (variant === 'perfect' || variant === 'eminence') {
      effectInstance = new ShadowLinesEffect(canvas, ctx);
    }

    return () => {
      effectInstance?.dispose();
    };
  }, [variant]);

  // Background styles based on variant using design tokens
  const getBackgroundStyle = () => {
    switch (variant) {
      case 'huntaze':
      case 'basic':
        return { background: 'var(--bg-primary)' };
      case 'perfect':
      case 'eminence':
        return { background: 'linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 50%, var(--bg-tertiary) 100%)' };
      default:
        return { background: 'var(--bg-primary)' };
    }
  };

  return (
    <div className="fixed inset-0 pointer-events-none">
      <div 
        className="absolute inset-0"
        style={getBackgroundStyle()}
      />
      
      <canvas
        ref={canvasRef}
        className="absolute inset-0 z-10"
      />
    </div>
  );
}
