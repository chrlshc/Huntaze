'use client';

import { Line } from 'react-chartjs-2';
import { getChartOptions } from '@/lib/config/chartConfig';
import { useEffect, useState } from 'react';

/**
 * PerformanceCharts Component
 * 
 * Uses react-chartjs-2 Line component with responsive options.
 * Displays 7-day performance data.
 * 
 * Requirements: 1.5
 */

interface PerformanceChartsProps {
  data?: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      borderColor?: string;
      backgroundColor?: string;
    }[];
  };
}

// Sample 7-day data
const defaultData = {
  labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  datasets: [
    {
      label: 'Revenue',
      data: [1200, 1900, 1500, 2100, 1800, 2400, 2200],
      borderColor: 'rgb(99, 102, 241)',
      backgroundColor: 'rgba(99, 102, 241, 0.1)',
    },
    {
      label: 'New Fans',
      data: [15, 22, 18, 28, 24, 32, 29],
      borderColor: 'rgb(139, 92, 246)',
      backgroundColor: 'rgba(139, 92, 246, 0.1)',
    },
  ],
};

export default function PerformanceCharts({ data = defaultData }: PerformanceChartsProps) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check if dark mode is active
    const checkDarkMode = () => {
      const theme = document.documentElement.getAttribute('data-theme');
      setIsDark(theme === 'dark');
    };

    checkDarkMode();

    // Watch for theme changes
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    return () => observer.disconnect();
  }, []);

  const chartOptions = getChartOptions(isDark, {
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
      },
      tooltip: {
        enabled: true,
        mode: 'index' as const,
        intersect: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  });

  return (
    <div className="w-full h-[300px] md:h-[400px]">
      <Line data={data} options={chartOptions} />
    </div>
  );
}
