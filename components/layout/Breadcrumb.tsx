'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ComponentProps } from 'react';

interface BreadcrumbItem {
  label: string;
  href: string;
  isLast: boolean;
}

function formatSegment(segment: string): string {
  // Convert kebab-case and snake_case to Title Case
  return segment
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function generateBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split('/').filter(Boolean);
  
  if (segments.length === 0) {
    return [{ label: 'Home', href: '/', isLast: true }];
  }

  return segments.map((segment, index) => ({
    label: formatSegment(segment),
    href: '/' + segments.slice(0, index + 1).join('/'),
    isLast: index === segments.length - 1,
  }));
}

export function Breadcrumb() {
  const pathname = usePathname();
  const breadcrumbs = generateBreadcrumbs(pathname || '/');

  return (
    <nav aria-label="Breadcrumb" className="flex items-center space-x-2 text-sm">
      {breadcrumbs.map((item, index) => (
        <div key={item.href} className="flex items-center">
          {index > 0 && (
            <ChevronRightIcon className="mx-2 h-4 w-4 text-gray-400 dark:text-gray-500" />
          )}
          {item.isLast ? (
            <span className="font-semibold text-gray-900 dark:text-white">{item.label}</span>
          ) : (
            <Link
              href={item.href}
              className="text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            >
              {item.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
}

function ChevronRightIcon(props: ComponentProps<'svg'>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}
