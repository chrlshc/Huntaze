import { vi } from 'vitest';

export async function flushMicrotasks() {
  // Flush microtasks so any dynamic import side-effects have run
  await Promise.resolve(); // ensure pending microtasks finish
  // Give a moment for any async operations to settle
  await new Promise(resolve => setTimeout(resolve, 0));
}