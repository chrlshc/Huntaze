'use client';

import { useEffect, useRef, useState } from "react";

interface FPSMonitorOptions {
  targetFPS?: number;
  sampleSize?: number;
  onLowFPS?: (fps: number) => void;
}

export function useFPSMonitor({
  targetFPS = 30,
  sampleSize = 10,
  onLowFPS,
}: FPSMonitorOptions = {}) {
  const [currentFPS, setCurrentFPS] = useState(60);
  const [isLowPerf, setIsLowPerf] = useState(false);
  const frameTimesRef = useRef<number[]>([]);
  const lastTimeRef = useRef(performance.now());
  const rafRef = useRef<number>();

  useEffect(() => {
    let frameCount = 0;

    const measureFPS = (currentTime: number) => {
      const deltaTime = currentTime - lastTimeRef.current;
      
      if (deltaTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / deltaTime);
        setCurrentFPS(fps);
        
        // Keep rolling average
        frameTimesRef.current.push(fps);
        if (frameTimesRef.current.length > sampleSize) {
          frameTimesRef.current.shift();
        }
        
        // Calculate average FPS
        const avgFPS = frameTimesRef.current.reduce((a, b) => a + b, 0) / frameTimesRef.current.length;
        
        // Check if performance is low
        if (avgFPS < targetFPS && frameTimesRef.current.length >= sampleSize) {
          setIsLowPerf(true);
          onLowFPS?.(avgFPS);
          document.body.classList.add("reduce-motion");
        } else if (avgFPS > targetFPS + 10) {
          setIsLowPerf(false);
          document.body.classList.remove("reduce-motion");
        }
        
        frameCount = 0;
        lastTimeRef.current = currentTime;
      }
      
      frameCount++;
      rafRef.current = requestAnimationFrame(measureFPS);
    };

    // Start monitoring
    rafRef.current = requestAnimationFrame(measureFPS);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [targetFPS, sampleSize, onLowFPS]);

  return { currentFPS, isLowPerf };
}