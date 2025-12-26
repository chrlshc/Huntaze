const MOCK_ENV_VALUES = new Set(['1', 'true', 'yes', 'on']);
const ALLOWED_APP_ENVS = new Set(['demo', 'staging']);

const isProductionBuild = process.env.NODE_ENV === 'production';
const appEnv = process.env.APP_ENV?.toLowerCase();
const appEnvAllowed = !appEnv || ALLOWED_APP_ENVS.has(appEnv);
const mockEnvValue = process.env.ENABLE_MOCK_DATA?.toLowerCase();
const mockEnvEnabled = typeof mockEnvValue === 'string' && MOCK_ENV_VALUES.has(mockEnvValue);

// Safety: never allow mock/demo data in production builds.
export function isMockEnabled(): boolean {
  return !isProductionBuild && appEnvAllowed && mockEnvEnabled;
}

export const ENABLE_MOCK_DATA = isMockEnabled();

export function assertMockEnabled(routeName: string): Response | null {
  if (isMockEnabled()) return null;

  const payload = {
    error: {
      code: 'MOCK_DISABLED',
      message: `Mock data disabled for ${routeName}. Set ENABLE_MOCK_DATA=1 with NODE_ENV != 'production' (and APP_ENV=demo|staging if set) to enable.`,
    },
  };

  return new Response(JSON.stringify(payload), {
    status: 501,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
}
