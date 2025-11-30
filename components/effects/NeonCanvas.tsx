"use client";

import { useEffect, useRef } from "react";
import { useInView } from 'react-intersection-observer';

export interface NeonCanvasProps {
  className?: string;
  intensity?: number;
  color?: string;
}

/**
 * Optimized neon canvas effect with performance optimizations
 * - Hardware acceleration
 * - Intersection observer for pause when not visible
 * - High DPI support with limits
 * - GPU-friendly rendering
 * 
 * Consolidates: OptimizedNeonCanvas, SimpleNeonCanvas, SimpleNeonTest
 */
export default function NeonCanvas({
  className,
  intensity = 1,
  color, // Will use design token if not provided
}: NeonCanvasProps) {
  // Use design token for default color
  const effectColor = color || getComputedStyle(document.documentElement).getPropertyValue('--accent-primary').trim() || '#8b5cf6';
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const { ref: containerRef, inView } = useInView({
    threshold: 0.1,
    rootMargin: "50px",
  });

  useEffect(() => {
    if (!inView) {
      // Pause animation when not in view
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", {
      alpha: true,
      desynchronized: true, // Better performance
    });
    if (!ctx) return;

    // Force hardware acceleration
    canvas.style.transform = "translateZ(0)";
    canvas.style.willChange = "transform";
    canvas.style.backfaceVisibility = "hidden";

    let width = canvas.offsetWidth;
    let height = canvas.offsetHeight;

    // High DPI support with limit
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Simple optimized animation
    let time = 0;
    const lines: { x: number; y: number; vx: number; opacity: number }[] = [];

    // Initialize lines
    for (let i = 0; i < 20 * intensity; i++) {
      lines.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 2,
        opacity: Math.random() * 0.5 + 0.2,
      });
    }

    // Optimized render function
    function render() {
      if (!inView || !ctx) return;

      // Clear with semi-transparent background for trail effect using design token
      const bgPrimary = getComputedStyle(document.documentElement).getPropertyValue('--bg-primary').trim() || '#09090b';
      ctx.fillStyle = `${bgPrimary}1a`; // Add alpha channel
      ctx.fillRect(0, 0, width, height);

      // Draw lines with GPU-friendly operations
      ctx.strokeStyle = effectColor;
      ctx.lineWidth = 2;
      ctx.lineCap = "round";

      lines.forEach((line, i) => {
        ctx.globalAlpha = line.opacity * Math.sin(time * 0.001 + i);
        ctx.beginPath();
        ctx.moveTo(line.x, line.y);
        ctx.lineTo(
          line.x + Math.sin(time * 0.002 + i) * 50,
          line.y + Math.cos(time * 0.001 + i) * 30
        );
        ctx.stroke();

        // Update position
        line.x += line.vx;
        if (line.x > width + 50) line.x = -50;
        if (line.x < -50) line.x = width + 50;
      });

      time += 16; // Assume 60fps
      animationRef.current = requestAnimationFrame(render);
    }

    // Handle resize efficiently
    const handleResize = () => {
      width = canvas.offsetWidth;
      height = canvas.offsetHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    };

    window.addEventListener("resize", handleResize, { passive: true });
    render();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      window.removeEventListener("resize", handleResize);
    };
  }, [inView, intensity, effectColor]);

  return (
    <div
      ref={containerRef}
      className={`${className} pointer-events-none absolute inset-0`}
      style={{
        contain: "layout style paint",
        isolation: "isolate",
      }}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{
          transform: "translateZ(0)",
          backfaceVisibility: "hidden",
        }}
      />
    </div>
  );
}
