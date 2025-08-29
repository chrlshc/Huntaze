'use client';

import dynamic from 'next/dynamic';
import { ComponentProps } from 'react';

// Dynamic imports for chart components
export const DynamicLine = dynamic(
  () => import('react-chartjs-2').then(mod => mod.Line),
  { 
    ssr: false,
    loading: () => (
      <div className="animate-pulse bg-gray-200 rounded-lg h-full w-full" />
    )
  }
);

export const DynamicBar = dynamic(
  () => import('react-chartjs-2').then(mod => mod.Bar),
  { 
    ssr: false,
    loading: () => (
      <div className="animate-pulse bg-gray-200 rounded-lg h-full w-full" />
    )
  }
);

export const DynamicDoughnut = dynamic(
  () => import('react-chartjs-2').then(mod => mod.Doughnut),
  { 
    ssr: false,
    loading: () => (
      <div className="animate-pulse bg-gray-200 rounded-lg h-full w-full" />
    )
  }
);

// Export types for proper typing
export type LineProps = ComponentProps<typeof import('react-chartjs-2').Line>;
export type BarProps = ComponentProps<typeof import('react-chartjs-2').Bar>;
export type DoughnutProps = ComponentProps<typeof import('react-chartjs-2').Doughnut>;