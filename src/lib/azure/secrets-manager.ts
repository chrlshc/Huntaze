import { SecretClient } from '@azure/keyvault-secrets';

// Prefer Workload Identity Federation; fallback to ClientSecretCredential
export class AzureSecretsManager {
  private client?: SecretClient;

  constructor() {
    const url = process.env.AZURE_KEYVAULT_URL;
    if (!url) return;
    this.client = this.createClient(url);
  }

  private createClient(url: string): SecretClient | undefined {
    try {
      // Dynamic import to avoid hard dependency
      const mod = require('@azure/identity');
      const WorkloadIdentityCredential = mod.WorkloadIdentityCredential;
      const ClientSecretCredential = mod.ClientSecretCredential;

      let credential: any;
      if (process.env.AZURE_FEDERATED_TOKEN_FILE) {
        credential = new WorkloadIdentityCredential({
          tenantId: process.env.AZURE_TENANT_ID,
          clientId: process.env.AZURE_CLIENT_ID,
          tokenFilePath: process.env.AZURE_FEDERATED_TOKEN_FILE,
        });
      } else if (process.env.AZURE_TENANT_ID && process.env.AZURE_CLIENT_ID && process.env.AZURE_CLIENT_SECRET) {
        credential = new ClientSecretCredential(
          process.env.AZURE_TENANT_ID,
          process.env.AZURE_CLIENT_ID,
          process.env.AZURE_CLIENT_SECRET
        );
      } else {
        return undefined;
      }
      return new SecretClient(url, credential);
    } catch {
      return undefined;
    }
  }

  async getSecret(name: string): Promise<string | undefined> {
    if (!this.client) return undefined;
    const s = await this.client.getSecret(name);
    return s.value;
  }
}

