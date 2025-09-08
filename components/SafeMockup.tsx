'use client';
import dynamic from 'next/dynamic';
import { useEffect, useState, ReactNode } from 'react';
import { DebugWrapper } from './DebugWrapper';

// Dynamic imports for mockups to avoid SSR issues
const DynamicIPhoneMockup = dynamic(
  () => import('./CSSMockups').then(mod => ({ default: mod.IPhoneMockup })),
  { 
    ssr: false,
    loading: () => <MockupSkeleton type="phone" />
  }
);

const DynamicDesktopMockup = dynamic(
  () => import('./CSSMockups').then(mod => ({ default: mod.DesktopMockup })),
  { 
    ssr: false,
    loading: () => <MockupSkeleton type="desktop" />
  }
);

const DynamicTabletMockup = dynamic(
  () => import('./CSSMockups').then(mod => ({ default: mod.TabletMockup })),
  { 
    ssr: false,
    loading: () => <MockupSkeleton type="tablet" />
  }
);

interface MockupSkeletonProps {
  type: 'phone' | 'desktop' | 'tablet';
}

function MockupSkeleton({ type }: MockupSkeletonProps) {
  const dimensions = {
    phone: 'w-[375px] h-[812px]',
    desktop: 'w-full max-w-4xl aspect-video',
    tablet: 'w-[384px] h-[512px]'
  };

  return (
    <div className={`${dimensions[type]} bg-gray-200 rounded-lg animate-pulse`}>
      <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-200 rounded-lg" />
    </div>
  );
}

interface SafeMockupProps {
  type: 'phone' | 'desktop' | 'tablet';
  children?: ReactNode;
  className?: string;
  scale?: number;
}

export function SafeMockup({ type, children, className = '', scale }: SafeMockupProps) {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <MockupSkeleton type={type} />;
  }

  const mockupProps = { children, className, scale };

  return (
    <DebugWrapper>
      {type === 'phone' && <DynamicIPhoneMockup {...mockupProps} />}
      {type === 'desktop' && <DynamicDesktopMockup {...mockupProps} />}
      {type === 'tablet' && <DynamicTabletMockup {...mockupProps} />}
    </DebugWrapper>
  );
}

// Safe DeviceShowcase with hydration protection
export const SafeDeviceShowcase = dynamic(
  () => import('./CSSMockups').then(mod => ({ 
    default: function Wrapper(props: any) {
      const [mounted, setMounted] = useState(false);
      
      useEffect(() => {
        setMounted(true);
      }, []);

      if (!mounted) {
        return (
          <div className="device-showcase bg-gradient-to-br from-purple-100 to-pink-100 rounded-3xl p-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <MockupSkeleton type="desktop" />
              <MockupSkeleton type="tablet" />
              <MockupSkeleton type="phone" />
            </div>
          </div>
        );
      }

      return <mod.DeviceShowcase {...props} />;
    }
  })),
  { ssr: false }
);