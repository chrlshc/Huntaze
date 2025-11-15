/**
 * Middleware Compatibility Layer
 * 
 * Next.js 16 uses proxy.ts, but for backward compatibility with Amplify
 * and other platforms, we keep middleware.ts that re-exports proxy.ts
 */

import proxy from './proxy';

export default proxy;

// Re-export config
export { config } from './proxy';
