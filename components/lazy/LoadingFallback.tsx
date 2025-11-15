import { ComponentType } from 'react';

interface LoadingFallbackProps {
  type?: 'spinner' | 'skeleton' | 'pulse';
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

export function LoadingFallback({ 
  type = 'spinner', 
  size = 'md',
  text 
}: LoadingFallbackProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  if (type === 'spinner') {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <div className={`animate-spin rounded-full border-b-2 border-gray-900 dark:border-white ${sizeClasses[size]}`}></div>
        {text && (
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">{text}</p>
        )}
      </div>
    );
  }

  if (type === 'skeleton') {
    return (
      <div className="animate-pulse space-y-4 p-8">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
      </div>
    );
  }

  if (type === 'pulse') {
    return (
      <div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-lg h-64 w-full"></div>
    );
  }

  return null;
}

// Specific loading components for different use cases
export function ChartLoading() {
  return (
    <div className="animate-pulse space-y-4 p-6">
      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
      <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
    </div>
  );
}

export function TableLoading() {
  return (
    <div className="animate-pulse space-y-3 p-6">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex space-x-4">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/6"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
        </div>
      ))}
    </div>
  );
}

export function CardLoading() {
  return (
    <div className="animate-pulse p-6 space-y-4">
      <div className="flex items-center space-x-4">
        <div className="h-12 w-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
      </div>
    </div>
  );
}

export function CalendarLoading() {
  return (
    <div className="animate-pulse p-6 space-y-4">
      <div className="flex justify-between items-center mb-4">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
        <div className="flex space-x-2">
          <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-2">
        {[...Array(35)].map((_, i) => (
          <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
        ))}
      </div>
    </div>
  );
}

export function ModalLoading() {
  return (
    <div className="animate-pulse p-6 space-y-6">
      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
      <div className="space-y-4">
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
        <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
      <div className="flex justify-end space-x-2">
        <div className="h-10 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
        <div className="h-10 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    </div>
  );
}

export default LoadingFallback;
