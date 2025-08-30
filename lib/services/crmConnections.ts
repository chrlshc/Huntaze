// Simple in-memory CRM connections store for dev/demo.
// In production, persist to a database with encryption for secrets.

export type CrmProviderId = 'inflow' | 'supercreator';

export type CrmConnection = {
  id: string;
  userId: string;
  provider: CrmProviderId;
  apiKeyMasked?: string; // store masked for UI; never store plaintext in real DB
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export const crmConnections = new Map<string, CrmConnection[]>();

