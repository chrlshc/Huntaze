import { AzureOpenAI } from 'openai';
import { getSecretFromEnv } from '../aws/secrets';

let azureClient: AzureOpenAI | null = null;
let initialisationPromise: Promise<AzureOpenAI> | null = null;

async function createAzureClient(): Promise<AzureOpenAI> {
  const apiKey = await getSecretFromEnv({
    directValueEnv: 'AZURE_OPENAI_API_KEY',
    secretNameEnv: 'AZURE_OPENAI_API_KEY_SECRET_NAME',
    defaultSecretName: 'azure-openai-key',
  });

  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
  if (!endpoint) {
    throw new Error('Azure OpenAI endpoint not configured. Set AZURE_OPENAI_ENDPOINT.');
  }

  const apiVersion = process.env.AZURE_OPENAI_API_VERSION || '2024-02-15-preview';

  return new AzureOpenAI({
    apiKey,
    endpoint,
    apiVersion,
    defaultHeaders: {
      'api-key': apiKey,
    },
  });
}

export async function getAzureOpenAI(): Promise<AzureOpenAI> {
  if (azureClient) {
    return azureClient;
  }

  if (!initialisationPromise) {
    initialisationPromise = createAzureClient()
      .then((client) => {
        azureClient = client;
        return client;
      })
      .catch((error) => {
        initialisationPromise = null;
        throw error;
      });
  }

  return initialisationPromise;
}

export function getDefaultAzureDeployment(): string {
  return process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-4o';
}

// Helper function for development/testing with mock responses
export async function callAzureOpenAI(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  options?: {
    temperature?: number;
    maxTokens?: number;
    model?: string;
  }
): Promise<string> {
  const deploymentName = getDefaultAzureDeployment();
  
  // In development, return mock responses if Azure is not configured
  if (
    process.env.NODE_ENV === 'development' &&
    !process.env.AZURE_OPENAI_API_KEY &&
    !process.env.AZURE_OPENAI_API_KEY_SECRET_NAME
  ) {
    console.log('🤖 Using mock AI response (configure Azure OpenAI for real responses)');
    return generateMockResponse(messages[messages.length - 1].content);
  }

  try {
    const client = await getAzureOpenAI();
    const response = await client.chat.completions.create({
      model: deploymentName,
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 1000,
    });

    return response.choices[0]?.message?.content || 'Désolé, je n\'ai pas pu générer une réponse.';
  } catch (error) {
    console.error('Azure OpenAI error:', error);
    
    // Fallback to mock in case of error
    if (process.env.NODE_ENV === 'development') {
      return generateMockResponse(messages[messages.length - 1].content);
    }
    
    throw error;
  }
}

// Mock response generator for development
function generateMockResponse(userInput: string): string {
  const input = userInput.toLowerCase();
  
  // Message responses
  if (input.includes('salut') || input.includes('bonjour')) {
    return 'Coucou toi! 😘 Comment vas-tu aujourd\'hui? J\'ai pensé à toi toute la journée... Tu veux voir ce que j\'ai préparé spécialement pour toi? 💕';
  }
  
  if (input.includes('custom') || input.includes('personnalisé')) {
    return 'Oh j\'adore faire des customs! 😍 Dis-moi exactement ce que tu veux voir et je vais te faire quelque chose d\'incroyable. Prix spécial pour toi: 75€ au lieu de 100€! 💋';
  }
  
  if (input.includes('photo') || input.includes('pic')) {
    return 'J\'ai justement pris de nouvelles photos super hot aujourd\'hui! 🔥 Pack de 20 photos exclusives à seulement 25€. Tu veux un petit aperçu? 😈';
  }
  
  // Content optimization
  if (input.includes('titre') || input.includes('optimise')) {
    const titles = [
      '🔥 Contenu EXCLUSIF - Seulement pour mes VIP',
      '💦 Nouvelle vidéo HOT disponible maintenant',
      '🎁 Surprise spéciale pour mes fans préférés',
      '⏰ DERNIÈRE CHANCE - 50% de réduction'
    ];
    return `Voici quelques suggestions de titres optimisés:\n\n${titles.join('\n')}`;
  }
  
  // Revenue tips
  if (input.includes('revenu') || input.includes('argent')) {
    return `Pour augmenter tes revenus, voici mes conseils:

1. 📸 Poste entre 20h-22h (heure EU) = +40% engagement
2. 💬 Réponds dans les 5 min = 3x plus de tips
3. 🎯 Focus sur tes top 20% de fans = 80% des revenus
4. 🔥 Utilise "exclusif" et "limité" dans tes titres

Veux-tu que je t'aide avec l'une de ces stratégies?`;
  }
  
  // Default response
  return 'Je suis là pour t\'aider à maximiser tes revenus! Dis-moi ce dont tu as besoin: réponses aux messages, optimisation de contenu, ou conseils stratégiques? 💪';
}
