// Azure Content Safety (REST) wrapper with minimal dependencies
// Optional integration: enable with AZURE_CONTENT_SAFETY_ENDPOINT present

import type { ContentLabel } from '@/services/content-moderation';

export type AzureCategory = 'Hate' | 'Violence' | 'Sexual' | 'SelfHarm';

export interface AzureViolation {
  category: AzureCategory;
  severity: number; // image: 0/2/4/6
}

export class AzureContentSafetyService {
  private endpoint: string;
  private clientPromise: Promise<any> | null = null;

  constructor() {
    const endpoint = process.env.AZURE_CONTENT_SAFETY_ENDPOINT;
    if (!endpoint) throw new Error('AZURE_CONTENT_SAFETY_ENDPOINT is required');
    this.endpoint = endpoint;
  }

  private getClient(): Promise<any> {
    if (this.clientPromise) return this.clientPromise;
    this.clientPromise = (async () => {
      const { default: createClient, isUnexpected } = await import('@azure-rest/ai-content-safety');
      const { DefaultAzureCredential } = await import('@azure/identity');
      const credential = new DefaultAzureCredential();
      const client = createClient(this.endpoint, credential);
      return { client, isUnexpected };
    })();
    return this.clientPromise;
  }

  // Analyze an image buffer via Azure Content Safety and map to ContentLabel[]
  async analyzeImageToLabels(image: Buffer): Promise<ContentLabel[]> {
    const { client, isUnexpected } = await this.getClient();
    const b64 = image.toString('base64');
    const result = await client.path('/image:analyze').post({ body: { image: { content: b64 } } });
    if (isUnexpected(result)) {
      throw new Error(`Content Safety error: ${result.status}`);
    }
    const categories = (result.body as any)?.categoriesAnalysis || [];
    const labels: ContentLabel[] = [];
    for (const c of categories) {
      const cat: AzureCategory | undefined = c.category;
      const sev = c.severity ?? 0;
      if (!cat) continue;
      // Map Azure categories to our label taxonomy
      if (cat === 'Sexual') {
        if (sev >= 4) labels.push({ name: 'Explicit Nudity', confidence: 0.9 });
        else if (sev >= 2) labels.push({ name: 'Suggestive', confidence: 0.8 });
      }
      if (cat === 'Violence' && sev >= 2) labels.push({ name: 'Graphic Violence', confidence: 0.75 });
      if (cat === 'Hate' && sev >= 2) labels.push({ name: 'Hate Symbols', confidence: 0.75 });
      if (cat === 'SelfHarm' && sev >= 2) labels.push({ name: 'Self Harm', confidence: 0.7 });
    }
    return labels;
  }
}
