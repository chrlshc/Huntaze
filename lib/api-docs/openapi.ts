// OpenAPI Documentation Generator from tRPC

import { generateOpenApiDocument } from 'trpc-openapi';
import { appRouter } from '@/server/routers/app';

export const openApiDocument = generateOpenApiDocument(appRouter, {
  title: 'Huntaze API',
  version: '2.0.0',
  baseUrl: 'https://api.huntaze.com',
  docsUrl: 'https://docs.huntaze.com',
  tags: ['OnlyFans', 'Campaigns', 'Analytics', 'Billing', 'Users'],
  description: 'Huntaze Creator Platform API - OnlyFans Management & Analytics',
});

export function getOpenApiSpec() {
  return openApiDocument;
}
