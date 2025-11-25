# Lighthouse Performance Optimization Guide

This guide provides actionable steps to optimize marketing pages to achieve a Lighthouse performance score of ≥ 90.

## Quick Reference

### Performance Threshold
- **Target**: Lighthouse Performance Score ≥ 90
- **Requirement**: 6.5

### Core Web Vitals Targets
- **FCP** (First Contentful Paint): < 2.0s
- **LCP** (Largest Contentful Paint): < 2.5s
- **CLS** (Cumulative Layout Shift): < 0.1
- **TBT** (Total Blocking Time): < 300ms
- **Speed Index**: < 3.5s

## Running Lighthouse Audits

### Option 1: Using the Script
```bash
# Start your development server
npm run dev

# In another terminal, run the audit
./scripts/lighthouse-marketing-audit.sh
```

### Option 2: Using Lighthouse CI
```bash
npm run lighthouse:ci
```

### Option 3: Manual Lighthouse
```bash
# Install Lighthouse globally if not already installed
npm install -g lighthouse

# Run on a specific page
lighthouse http://localhost:3000/features --view
```

## Common Performance Issues and Fixes

### 1. Large JavaScript Bundles

**Symptoms:**
- High Total Blocking Time (TBT)
- Slow Time to Interactive (TTI)
- Large bundle sizes

**Solutions:**

#### A. Implement Code Splitting
```typescript
// Before: Direct import
import { HeavyComponent } from '@/components/HeavyComponent';

// After: Dynamic import
import dynamic from 'next/dynamic';

const HeavyComponent = dynamic(() => import('@/components/HeavyComponent'), {
  loading: () => <div>Loading...</div>,
  ssr: true
});
```

#### B. Use Dynamic Imports for Heavy Libraries
```typescript
// For libraries like framer-motion, chart.js, etc.
const MotionDiv = dynamic(
  () => import('framer-motion').then(mod => mod.motion.div),
  { ssr: false }
);
```

#### C. Analyze Bundle Size
```bash
npm run build
# Check .next/analyze/ for bundle analysis
```

### 2. Unoptimized Images

**Symptoms:**
- High LCP
- Large resource sizes
- "Properly size images" warning

**Solutions:**

#### A. Use Next.js Image Component
```typescript
// Before: Regular img tag
<img src="/hero.jpg" alt="Hero" />

// After: Next.js Image
import Image from 'next/image';

<Image
  src="/hero.jpg"
  alt="Hero"
  width={1200}
  height={600}
  priority // For above-the-fold images
  quality={85}
/>
```

#### B. Optimize Image Formats
- Use WebP or AVIF formats
- Compress images before uploading
- Use appropriate sizes for different viewports

#### C. Lazy Load Below-the-Fold Images
```typescript
<Image
  src="/feature.jpg"
  alt="Feature"
  width={800}
  height={400}
  loading="lazy" // Default for non-priority images
/>
```

### 3. Render-Blocking Resources

**Symptoms:**
- High FCP
- "Eliminate render-blocking resources" warning

**Solutions:**

#### A. Inline Critical CSS
```typescript
// In app/layout.tsx or page-specific layout
export default function Layout({ children }) {
  return (
    <html>
      <head>
        <style dangerouslySetInnerHTML={{ __html: criticalCSS }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

#### B. Defer Non-Critical CSS
```typescript
// Use next/font for font optimization
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
});
```

#### C. Preload Critical Resources
```typescript
// In app/layout.tsx
export default function Layout({ children }) {
  return (
    <html>
      <head>
        <link rel="preload" href="/fonts/inter.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

### 4. Cumulative Layout Shift (CLS)

**Symptoms:**
- CLS > 0.1
- Content jumping during load

**Solutions:**

#### A. Reserve Space for Images
```typescript
// Always specify width and height
<Image
  src="/hero.jpg"
  alt="Hero"
  width={1200}
  height={600}
/>
```

#### B. Reserve Space for Dynamic Content
```css
/* Use aspect-ratio or min-height */
.skeleton {
  min-height: 400px;
  aspect-ratio: 16 / 9;
}
```

#### C. Avoid Inserting Content Above Existing Content
```typescript
// Use skeleton screens instead of loading spinners
<div className="min-h-[400px]">
  {loading ? <Skeleton /> : <Content />}
</div>
```

### 5. Unused JavaScript and CSS

**Symptoms:**
- "Remove unused JavaScript" warning
- "Remove unused CSS" warning

**Solutions:**

#### A. Tree Shaking
```typescript
// Import only what you need
// Before:
import * as Icons from 'lucide-react';

// After:
import { ChevronRight, Star } from 'lucide-react';
```

#### B. Remove Unused Dependencies
```bash
# Analyze dependencies
npm run build
# Remove unused packages
npm uninstall unused-package
```

#### C. Use Tailwind CSS Purge
```javascript
// tailwind.config.js
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  // Tailwind will automatically purge unused styles
};
```

### 6. Third-Party Scripts

**Symptoms:**
- High TBT
- "Reduce the impact of third-party code" warning

**Solutions:**

#### A. Use Next.js Script Component
```typescript
import Script from 'next/script';

// Load analytics after page is interactive
<Script
  src="https://analytics.example.com/script.js"
  strategy="lazyOnload"
/>
```

#### B. Self-Host Third-Party Scripts
```typescript
// Instead of loading from CDN, self-host and serve from your domain
<Script src="/scripts/analytics.js" strategy="afterInteractive" />
```

### 7. Server Response Time

**Symptoms:**
- High TTFB (Time to First Byte)
- Slow server response

**Solutions:**

#### A. Use Static Generation
```typescript
// For marketing pages, use static generation
export const dynamic = 'force-static';

export default function Page() {
  return <div>Static content</div>;
}
```

#### B. Implement Caching
```typescript
// Add cache headers
export async function GET() {
  return new Response(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
```

## Page-Specific Optimizations

### Homepage (/)
- Prioritize hero image loading
- Defer below-the-fold content
- Minimize initial JavaScript bundle
- Use static generation

### Features Page (/features)
- Lazy load feature cards
- Use intersection observer for animations
- Optimize feature icons (use SVG)
- Implement virtual scrolling for long lists

### Pricing Page (/pricing)
- Static generation for pricing tiers
- Lazy load FAQ section
- Minimize JavaScript for interactive elements
- Use CSS for hover effects instead of JS

## Monitoring and Continuous Optimization

### 1. Set Up Lighthouse CI
```bash
# Add to CI/CD pipeline
npm run lighthouse:ci
```

### 2. Monitor Core Web Vitals
- Use Google Search Console
- Implement Real User Monitoring (RUM)
- Track metrics in analytics

### 3. Regular Audits
```bash
# Run weekly audits
./scripts/lighthouse-marketing-audit.sh
```

### 4. Performance Budget
```json
{
  "budgets": [
    {
      "resourceSizes": [
        { "resourceType": "script", "budget": 300 },
        { "resourceType": "image", "budget": 500 },
        { "resourceType": "stylesheet", "budget": 100 }
      ]
    }
  ]
}
```

## Troubleshooting

### Issue: Lighthouse Score Varies Between Runs
**Solution:** Run multiple audits and average the scores. Use Lighthouse CI for consistent results.

### Issue: Good Score Locally, Poor Score in Production
**Solution:** Check CDN configuration, ensure compression is enabled, verify caching headers.

### Issue: Mobile Score Lower Than Desktop
**Solution:** Test with mobile throttling, optimize for slower networks, reduce JavaScript execution time.

### Issue: Score Drops After Deployment
**Solution:** Compare bundle sizes, check for new dependencies, review recent code changes.

## Resources

- [Lighthouse Documentation](https://developers.google.com/web/tools/lighthouse)
- [Web.dev Performance](https://web.dev/performance/)
- [Next.js Performance](https://nextjs.org/docs/app/building-your-application/optimizing)
- [Core Web Vitals](https://web.dev/vitals/)

## Checklist for Each Page

- [ ] Images use Next.js Image component
- [ ] Images have width and height specified
- [ ] Above-the-fold images use `priority` prop
- [ ] Heavy components use dynamic imports
- [ ] Third-party scripts use Next.js Script component
- [ ] Page uses static generation where possible
- [ ] No layout shift during load
- [ ] Fonts are optimized with next/font
- [ ] CSS is minimal and purged
- [ ] JavaScript bundle is code-split
- [ ] No render-blocking resources
- [ ] Lighthouse score ≥ 90

## Next Steps

1. Run the Lighthouse audit script
2. Identify pages below threshold
3. Apply relevant optimizations from this guide
4. Re-run audits to verify improvements
5. Repeat until all pages meet threshold
