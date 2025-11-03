# Next.js 15 Configuration Guide

## Overview

This document provides a comprehensive guide to configuring Next.js 15.5.6 in the Huntaze application.

**Version**: Next.js 15.5.6  
**React Version**: 19.0.0  
**Configuration File**: `next.config.ts`

---

## 1. Configuration File

### 1.1 TypeScript Configuration

Next.js 15 supports TypeScript configuration files for better type safety.

**File**: `next.config.ts`

```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Your configuration here
};

export default nextConfig;
```

### 1.2 Current Configuration

```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Output configuration
  output: 'standalone',
  
  // Caching configuration
  cacheHandler: process.env.CACHE_HANDLER_PATH,
  cacheMaxMemorySize: 50 * 1024 * 1024, // 50MB
  
  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  
  // Experimental features
  experimental: {
    optimizeCss: true,
  },
  
  // Webpack configuration
  webpack: (config) => {
    config.externals.push({
      'utf-8-validate': 'commonjs utf-8-validate',
      'bufferutil': 'commonjs bufferutil',
    });
    return config;
  },
};

export default nextConfig;
```

---

## 2. Caching Configuration

### 2.1 Cache Handler

Configure custom cache handler for distributed caching:

```typescript
const nextConfig: NextConfig = {
  cacheHandler: process.env.CACHE_HANDLER_PATH,
};
```

**Environment Variable**:
```bash
CACHE_HANDLER_PATH=/path/to/cache-handler.js
```

### 2.2 Cache Memory Size

Set maximum memory size for the cache:

```typescript
const nextConfig: NextConfig = {
  cacheMaxMemorySize: 50 * 1024 * 1024, // 50MB
};
```

### 2.3 Route-Level Caching

Configure caching at the route level:

```typescript
// app/api/data/route.ts
export const dynamic = 'force-dynamic'; // No caching
export const revalidate = 3600; // Revalidate every hour
export const fetchCache = 'force-no-store'; // No fetch caching

export async function GET() {
  // Your route logic
}
```

**Options**:
- `dynamic`: `'auto'` | `'force-dynamic'` | `'error'` | `'force-static'`
- `revalidate`: `false` | `number` (seconds)
- `fetchCache`: `'auto'` | `'default-cache'` | `'only-cache'` | `'force-cache'` | `'default-no-store'` | `'only-no-store'` | `'force-no-store'`

---

## 3. Image Optimization

### 3.1 Remote Patterns

Configure allowed image domains:

```typescript
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.amazonaws.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
    ],
  },
};
```

### 3.2 Image Formats

Configure supported image formats:

```typescript
const nextConfig: NextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
  },
};
```

### 3.3 Device Sizes

Configure responsive image sizes:

```typescript
const nextConfig: NextConfig = {
  images: {
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
};
```

---

## 4. Experimental Features

### 4.1 Available Features

```typescript
const nextConfig: NextConfig = {
  experimental: {
    // CSS optimization
    optimizeCss: true,
    
    // Turbopack (development only)
    turbo: {
      rules: {
        // Custom loader rules
      },
    },
    
    // Partial Prerendering
    ppr: false,
    
    // React Compiler
    reactCompiler: false,
    
    // Server Actions
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};
```

### 4.2 Turbopack

Enable Turbopack for faster development builds:

```typescript
const nextConfig: NextConfig = {
  experimental: {
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },
};
```

**Usage**:
```bash
# Development with Turbopack
next dev --turbo
```

### 4.3 React Compiler

Enable React Compiler for automatic memoization:

```typescript
const nextConfig: NextConfig = {
  experimental: {
    reactCompiler: true,
  },
};
```

**Note**: Currently not enabled in production. Monitor React team announcements.

---

## 5. Build Configuration

### 5.1 Output Mode

Configure build output:

```typescript
const nextConfig: NextConfig = {
  output: 'standalone', // For Docker/containerized deployments
};
```

**Options**:
- `'standalone'`: Minimal standalone build
- `'export'`: Static HTML export
- `undefined`: Default Next.js server

### 5.2 Webpack Configuration

Customize webpack configuration:

```typescript
const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    // Add externals
    config.externals.push({
      'utf-8-validate': 'commonjs utf-8-validate',
      'bufferutil': 'commonjs bufferutil',
    });
    
    // Custom rules
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });
    
    return config;
  },
};
```

---

## 6. Environment Variables

### 6.1 Required Variables

```bash
# Database
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...

# Authentication
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret

# AWS
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
S3_BUCKET_NAME=your-bucket

# Email
AWS_SES_REGION=us-east-1
FROM_EMAIL=noreply@huntaze.com
```

### 6.2 Optional Variables

```bash
# Next.js
NEXT_PUBLIC_API_URL=https://api.huntaze.com
NEXT_PUBLIC_APP_URL=https://huntaze.com

# OAuth
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
TIKTOK_CLIENT_KEY=your-client-key
TIKTOK_CLIENT_SECRET=your-client-secret

# Payments
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Caching
CACHE_HANDLER_PATH=/path/to/cache-handler.js
```

---

## 7. TypeScript Configuration

### 7.1 tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

---

## 8. Performance Optimization

### 8.1 Bundle Analysis

Analyze bundle sizes:

```bash
# Install analyzer
npm install @next/bundle-analyzer

# Add to next.config.ts
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer(nextConfig);

# Run analysis
ANALYZE=true npm run build
```

### 8.2 Code Splitting

Configure code splitting:

```typescript
const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ['lodash', 'date-fns'],
  },
};
```

---

## 9. Deployment Configuration

### 9.1 AWS Amplify

**amplify.yml**:
```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: .next
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
      - .next/cache/**/*
```

### 9.2 Docker

**Dockerfile**:
```dockerfile
FROM node:18-alpine AS base

# Install dependencies
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Build application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app
ENV NODE_ENV production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["node", "server.js"]
```

---

## 10. Monitoring & Debugging

### 10.1 Build Analysis

```bash
# Verbose build output
npm run build -- --debug

# Profile build
npm run build -- --profile
```

### 10.2 Development Debugging

```bash
# Enable debug mode
NODE_OPTIONS='--inspect' npm run dev

# Verbose logging
DEBUG=* npm run dev
```

---

## 11. Best Practices

### 11.1 Configuration Management

1. Use environment variables for secrets
2. Keep configuration minimal
3. Document all custom settings
4. Version control configuration files

### 11.2 Performance

1. Enable CSS optimization
2. Configure proper caching
3. Use image optimization
4. Implement code splitting

### 11.3 Security

1. Never commit secrets
2. Use environment variables
3. Configure CSP headers
4. Enable HTTPS in production

---

## 12. Troubleshooting

### Common Issues

#### Issue: Build fails with "Module not found"
**Solution**: Check webpack externals configuration

#### Issue: Images not loading
**Solution**: Verify remote patterns configuration

#### Issue: Slow builds
**Solution**: Enable Turbopack or optimize webpack config

---

## 13. Resources

### Official Documentation
- [Next.js Configuration](https://nextjs.org/docs/app/api-reference/next-config-js)
- [Environment Variables](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)
- [TypeScript](https://nextjs.org/docs/app/building-your-application/configuring/typescript)

### Internal Documentation
- [Breaking Changes](./NEXTJS_15_BREAKING_CHANGES.md)
- [Migration Guide](./NEXTJS_15_MIGRATION_GUIDE.md)

---

**Last Updated**: November 2, 2025  
**Version**: 1.0  
**Status**: Complete
