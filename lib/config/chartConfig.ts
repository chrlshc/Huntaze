/**
 * Chart.js Configuration
 * 
 * This file registers and configures Chart.js components globally.
 * Import this file in your root layout to ensure Chart.js is properly configured.
 */

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Default Chart.js options
export const defaultChartOptions: ChartOptions<'line'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: 'top' as const,
      labels: {
        usePointStyle: true,
        padding: 15,
        font: {
          size: 12,
          family: "'Inter', sans-serif",
        },
      },
    },
    tooltip: {
      enabled: true,
      mode: 'index',
      intersect: false,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      titleFont: {
        size: 13,
        family: "'Inter', sans-serif",
      },
      bodyFont: {
        size: 12,
        family: "'Inter', sans-serif",
      },
      padding: 12,
      cornerRadius: 8,
    },
  },
  scales: {
    x: {
      grid: {
        display: false,
      },
      ticks: {
        font: {
          size: 11,
          family: "'Inter', sans-serif",
        },
      },
    },
    y: {
      beginAtZero: true,
      grid: {
        color: 'rgba(0, 0, 0, 0.05)',
      },
      ticks: {
        font: {
          size: 11,
          family: "'Inter', sans-serif",
        },
      },
    },
  },
  interaction: {
    mode: 'nearest',
    axis: 'x',
    intersect: false,
  },
};

// Dark mode chart options
export const darkModeChartOptions: Partial<ChartOptions<'line'>> = {
  plugins: {
    legend: {
      labels: {
        color: '#EDEDED',
      },
    },
    tooltip: {
      backgroundColor: 'rgba(31, 31, 31, 0.95)',
      titleColor: '#EDEDED',
      bodyColor: '#EDEDED',
      borderColor: 'var(--bg-tertiary)',
      borderWidth: 1,
    },
  },
  scales: {
    x: {
      grid: {
        color: 'rgba(255, 255, 255, 0.05)',
      },
      ticks: {
        color: '#A1A1AA',
      },
    },
    y: {
      grid: {
        color: 'rgba(255, 255, 255, 0.05)',
      },
      ticks: {
        color: '#A1A1AA',
      },
    },
  },
};

// Helper function to merge options based on theme
export function getChartOptions(
  isDark: boolean,
  customOptions?: Partial<ChartOptions<'line'>>
): ChartOptions<'line'> {
  const baseOptions = isDark
    ? { ...defaultChartOptions, ...darkModeChartOptions }
    : defaultChartOptions;

  return {
    ...baseOptions,
    ...customOptions,
  } as ChartOptions<'line'>;
}

export default ChartJS;
