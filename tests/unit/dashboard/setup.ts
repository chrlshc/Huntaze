/**
 * Test setup for dashboard grid layout tests
 * Loads the CSS tokens into the test environment
 */

import { beforeAll } from 'vitest';
import fs from 'fs';
import path from 'path';

beforeAll(() => {
  // Load the dashboard CSS tokens
  const cssPath = path.join(process.cwd(), 'styles/dashboard-shopify-tokens.css');
  const css = fs.readFileSync(cssPath, 'utf-8');
  
  // Create a style element and inject the CSS
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);
});
