/**
 * Middleware Compatibility Layer
 * 
 * Next.js 16 uses proxy.ts, but for backward compatibility with Amplify
 * and other platforms, we keep middleware.ts that re-exports everything
 */

export { default, config } from './proxy';
