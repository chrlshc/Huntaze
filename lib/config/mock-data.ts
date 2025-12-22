import { isMockApiMode } from '@/config/api-mode';

const isProductionBuild = process.env.NODE_ENV === 'production';

// Safety: never allow mock/demo data in production builds.
export const ENABLE_MOCK_DATA = !isProductionBuild && isMockApiMode();
