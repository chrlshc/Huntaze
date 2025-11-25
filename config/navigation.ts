import { LucideIcon, Home, Zap, DollarSign, Info, FileText, Twitter, Linkedin, Instagram, Youtube } from 'lucide-react';

/**
 * Navigation item interface
 */
export interface NavItem {
  label: string;
  href: string;
  description?: string;
  icon?: LucideIcon;
}

/**
 * Social media link interface
 */
export interface SocialLink {
  platform: 'twitter' | 'linkedin' | 'instagram' | 'youtube';
  url: string;
  icon: LucideIcon;
}

/**
 * Footer section interface
 */
export interface FooterSection {
  title: string;
  links: Array<{
    label: string;
    href: string;
    external?: boolean;
  }>;
}

/**
 * Complete navigation configuration interface
 */
export interface NavigationConfig {
  main: NavItem[];
  footer: FooterSection[];
  social: SocialLink[];
}

/**
 * Centralized navigation configuration
 * Single source of truth for all navigation across the site
 */
export const navigationConfig: NavigationConfig = {
  main: [
    { 
      label: 'Features', 
      href: '/features',
      icon: Zap,
      description: 'Discover all platform capabilities'
    },
    { 
      label: 'Pricing', 
      href: '/pricing',
      icon: DollarSign,
      description: 'Simple, transparent pricing'
    },
    { 
      label: 'About', 
      href: '/about',
      icon: Info,
      description: 'Learn about our mission'
    },
    { 
      label: 'Case Studies', 
      href: '/case-studies',
      icon: FileText,
      description: 'See how others succeed'
    },
  ],
  footer: [
    {
      title: 'Product',
      links: [
        { label: 'Features', href: '/features' },
        { label: 'Pricing', href: '/pricing' },
        { label: 'Roadmap', href: '/roadmap' },
        { label: 'Changelog', href: '/changelog' },
      ],
    },
    {
      title: 'Company',
      links: [
        { label: 'About', href: '/about' },
        { label: 'Case Studies', href: '/case-studies' },
        { label: 'Contact', href: '/contact' },
        { label: 'Careers', href: '/careers' },
      ],
    },
    {
      title: 'Legal',
      links: [
        { label: 'Privacy Policy', href: '/privacy' },
        { label: 'Terms of Service', href: '/terms' },
        { label: 'Cookie Policy', href: '/cookies' },
      ],
    },
    {
      title: 'Resources',
      links: [
        { label: 'Documentation', href: '/docs', external: true },
        { label: 'API Reference', href: '/api-docs', external: true },
        { label: 'Support', href: '/support' },
        { label: 'Status', href: '/status', external: true },
      ],
    },
  ],
  social: [
    { 
      platform: 'twitter', 
      url: 'https://twitter.com/huntaze',
      icon: Twitter
    },
    { 
      platform: 'linkedin', 
      url: 'https://linkedin.com/company/huntaze',
      icon: Linkedin
    },
    { 
      platform: 'instagram', 
      url: 'https://instagram.com/huntaze',
      icon: Instagram
    },
    { 
      platform: 'youtube', 
      url: 'https://youtube.com/@huntaze',
      icon: Youtube
    },
  ],
};
