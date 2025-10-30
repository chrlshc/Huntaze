/* eslint-disable @typescript-eslint/no-var-requires */
// Minimal shim to capture the mocked apiClient once and reuse it in timers

declare global {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  var __optimisticApiClient: any | undefined;
}

let loadingPromise: Promise<any> | null = null;

export async function getOptimisticApiClient() {
  if (globalThis.__optimisticApiClient) return globalThis.__optimisticApiClient;
  if (loadingPromise) return loadingPromise;
  loadingPromise = import('../api').then((mod: any) => {
    const client = mod?.apiClient ?? mod?.default?.apiClient ?? mod;
    globalThis.__optimisticApiClient = client;
    return client;
  });
  return loadingPromise;
}
