'use client';

import { useEffect, useState } from 'react';

interface DeviceInfo {
  isMobile: boolean;
  isTouch: boolean;
  isLowEnd: boolean;
  batteryLevel?: number;
  connection?: string;
}

export function useMobileOptimizations() {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({
    isMobile: false,
    isTouch: false,
    isLowEnd: false
  });

  useEffect(() => {
    // Detect device capabilities
    const checkDevice = async () => {
      const info: DeviceInfo = {
        isMobile: /Android|iPhone|iPad|iPod/i.test(navigator.userAgent),
        isTouch: 'ontouchstart' in window,
        isLowEnd: false
      };

      // Check device memory (if available)
      if ('deviceMemory' in navigator) {
        info.isLowEnd = (navigator as any).deviceMemory < 4;
      }

      // Check connection quality
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        info.connection = connection?.effectiveType;
        if (connection?.effectiveType === '2g' || connection?.effectiveType === 'slow-2g') {
          info.isLowEnd = true;
        }
      }

      // Check battery level
      if ('getBattery' in navigator) {
        try {
          const battery = await (navigator as any).getBattery();
          info.batteryLevel = battery.level;
          
          // Reduce animations on low battery
          if (!battery.charging && battery.level < 0.2) {
            document.body.classList.add('low-battery');
            info.isLowEnd = true;
          }
        } catch (e) {
          console.log('Battery API not available');
        }
      }

      // Apply optimizations
      if (info.isMobile) {
        document.body.classList.add('is-mobile');
      }
      
      if (info.isTouch) {
        document.body.classList.add('is-touch');
      }
      
      if (info.isLowEnd) {
        document.body.classList.add('low-end-device');
        // Disable heavy animations
        document.documentElement.style.setProperty('--animation-duration', '0.2s');
        document.documentElement.style.setProperty('--max-concurrent-animations', '2');
      }

      // Check for reduced motion preference
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        document.body.classList.add('reduced-motion');
      }

      setDeviceInfo(info);
    };

    checkDevice();

    // Monitor performance
    if ('PerformanceObserver' in window) {
      const perfObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          // Log slow interactions
          if (entry.duration > 100) {
            console.warn('Slow interaction detected:', entry.name, entry.duration);
          }
        }
      });
      
      try {
        perfObserver.observe({ entryTypes: ['measure', 'navigation'] });
      } catch (e) {
        console.log('Performance monitoring not fully supported');
      }
    }
  }, []);

  return deviceInfo;
}

// Touch-optimized button wrapper
export function TouchButton({ 
  children, 
  onClick, 
  className = '' 
}: { 
  children: React.ReactNode; 
  onClick?: () => void;
  className?: string;
}) {
  const [isPressed, setIsPressed] = useState(false);

  return (
    <button
      className={`
        min-h-[44px] min-w-[44px] 
        touch-manipulation select-none
        ${isPressed ? 'scale-95' : ''}
        ${className}
      `}
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={() => {
        setIsPressed(false);
        onClick?.();
      }}
      onClick={onClick}
      style={{
        WebkitTapHighlightColor: 'transparent',
        touchAction: 'manipulation'
      }}
    >
      {children}
    </button>
  );
}

// Optimized image component
export function OptimizedImage({
  src,
  alt,
  className = '',
  priority = false
}: {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority);

  useEffect(() => {
    if (priority) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setIsInView(true);
          }
        });
      },
      { threshold: 0.1, rootMargin: '50px' }
    );

    const element = document.getElementById(`img-${src}`);
    if (element) {
      observer.observe(element);
    }

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [src, priority]);

  return (
    <div id={`img-${src}`} className={`relative ${className}`}>
      {/* Blur placeholder */}
      {!isLoaded && (
        <div 
          className="absolute inset-0 bg-gray-800 animate-pulse"
          style={{
            filter: 'blur(20px)',
            transform: 'scale(1.1)'
          }}
        />
      )}
      
      {/* Actual image */}
      {isInView && (
        <img
          src={src}
          alt={alt}
          className={`${className} ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity`}
          onLoad={() => setIsLoaded(true)}
          loading={priority ? 'eager' : 'lazy'}
        />
      )}
    </div>
  );
}

// Mobile-specific styles
export const mobileStyles = `
  /* Touch-optimized styles */
  .is-touch button,
  .is-touch a,
  .is-touch [role="button"] {
    min-height: 44px;
    min-width: 44px;
  }

  /* Disable hover effects on touch devices */
  .is-touch *:hover {
    transform: none !important;
  }

  /* Low-end device optimizations */
  .low-end-device .glass-card {
    backdrop-filter: none;
    background: rgba(255, 255, 255, 0.08);
  }

  .low-end-device [class*="animate-"] {
    animation-duration: 0.2s !important;
  }

  .low-end-device .gradient-mesh-fallback {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    animation: none;
  }

  /* Low battery mode */
  .low-battery * {
    animation: none !important;
    transition: opacity 0.2s ease !important;
  }

  /* Mobile-specific layout adjustments */
  @media (max-width: 768px) {
    .glass-card {
      backdrop-filter: blur(10px);
    }

    .text-6xl {
      font-size: 2.5rem;
    }

    .text-7xl {
      font-size: 3rem;
    }

    .text-8xl {
      font-size: 3.5rem;
    }

    .px-12 {
      padding-left: 2rem;
      padding-right: 2rem;
    }

    .py-24 {
      padding-top: 4rem;
      padding-bottom: 4rem;
    }
  }
`;