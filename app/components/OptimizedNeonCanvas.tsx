"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from 'react-intersection-observer';

type Props = {
  className?: string;
  intensity?: number;
  color?: string;
};

export default function OptimizedNeonCanvas({
  className,
  intensity = 1,
  color = "#a855f7",
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const workerRef = useRef<Worker | null>(null);
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
      if (!inView) return;

      // Clear with semi-transparent black for trail effect
      ctx.fillStyle = "rgba(11, 6, 20, 0.1)";
      ctx.fillRect(0, 0, width, height);

      // Draw lines with GPU-friendly operations
      ctx.strokeStyle = color;
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
  }, [inView, intensity, color]);

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