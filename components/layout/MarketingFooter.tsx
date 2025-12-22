'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { navigationConfig } from '@/config/navigation';
import { cn } from '@/lib/utils';

export interface MarketingFooterProps {
  className?: string;
}

/**
 * MarketingFooter component
 * 
 * Provides consistent footer across all marketing pages with:
 * - Product, company, legal, and resource links
 * - Social media links (if configured)
 * - Copyright notice
 * - Consistent styling across all pages
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */
export function MarketingFooter({ className }: MarketingFooterProps) {
  const currentYear = new Date().getFullYear();
  const pathname = usePathname();
  const disableHover = pathname === '/';

  return (
    <footer
      className={cn(
        'border-t bg-background',
        className
      )}
    >
      <div className="container px-4 py-12 md:px-6 md:py-16">
        {/* Footer Grid */}
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:gap-12">
          {/* Footer Sections */}
          {navigationConfig.footer.map((section) => (
            <div key={section.title}>
              <h3 className="mb-4 text-sm font-semibold text-foreground">
                {section.title}
              </h3>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.href}>
                    {link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                          'text-sm text-muted-foreground',
                          !disableHover && 'transition-colors hover:text-foreground'
                        )}
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className={cn(
                          'text-sm text-muted-foreground',
                          !disableHover && 'transition-colors hover:text-foreground'
                        )}
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="my-8 border-t" />

        {/* Bottom Section */}
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          {/* Copyright */}
          <p className="text-sm text-muted-foreground">
            © {currentYear} Huntaze. All rights reserved.
          </p>

          {/* Social Links */}
          {navigationConfig.social && navigationConfig.social.length > 0 && (
            <div className="flex items-center gap-4">
              {navigationConfig.social.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.platform}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      'text-muted-foreground',
                      !disableHover && 'transition-colors hover:text-foreground'
                    )}
                    aria-label={`Visit our ${social.platform} page`}
                  >
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </a>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}
