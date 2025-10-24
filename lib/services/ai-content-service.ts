import OpenAI from 'openai';
import { NextRequest } from 'next/server';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export interface ContentGenerationRequest {
  prompt: string;
  type: 'post' | 'story' | 'caption' | 'ideas';
  tone?: 'professional' | 'casual' | 'creative' | 'humorous';
  length?: 'short' | 'medium' | 'long';
  language?: string;
}

export interface ContentGenerationResponse {
  content: string;
  metadata: {
    model: string;
    tokens: number;
    processingTime: number;
  };
}

export class AIContentService {
  /**
   * Génère du contenu avec streaming SSE
   */
  static async generateContentStream(
    request: ContentGenerationRequest
  ): Promise<ReadableStream> {
    const systemPrompt = this.buildSystemPrompt(request);
    
    try {
      const stream = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: request.prompt
          }
        ],
        max_tokens: this.getMaxTokens(request.length),
        temperature: this.getTemperature(request.tone),
        stream: true
      });

      return new ReadableStream({
        async start(controller) {
          const encoder = new TextEncoder();
          let fullContent = '';
          const startTime = Date.now();

          try {
            for await (const chunk of stream) {
              const content = chunk.choices[0]?.delta?.content || '';
              
              if (content) {
                fullContent += content;
                
                // Envoyer le chunk via SSE
                const sseData = {
                  type: 'content',
                  data: content,
                  fullContent: fullContent
                };
                
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify(sseData)}\n\n`)
                );
              }
            }

            // Envoyer les métadonnées finales
            const endTime = Date.now();
            const finalData = {
              type: 'complete',
              data: {
                content: fullContent,
                metadata: {
                  model: 'gpt-4o-mini',
                  tokens: this.estimateTokens(fullContent),
                  processingTime: endTime - startTime
                }
              }
            };

            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(finalData)}\n\n`)
            );
            
          } catch (error) {
            const errorData = {
              type: 'error',
              data: {
                message: error instanceof Error ? error.message : 'Unknown error'
              }
            };
            
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(errorData)}\n\n`)
            );
          } finally {
            controller.close();
          }
        }
      });
    } catch (error) {
      throw new Error(`Failed to generate content: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Génère du contenu sans streaming (pour compatibilité)
   */
  static async generateContent(
    request: ContentGenerationRequest
  ): Promise<ContentGenerationResponse> {
    const systemPrompt = this.buildSystemPrompt(request);
    const startTime = Date.now();
    
    try {
      const response = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: request.prompt
          }
        ],
        max_tokens: this.getMaxTokens(request.length),
        temperature: this.getTemperature(request.tone)
      });

      const content = response.choices[0]?.message?.content || '';
      const endTime = Date.now();

      return {
        content,
        metadata: {
          model: 'gpt-4o-mini',
          tokens: response.usage?.total_tokens || this.estimateTokens(content),
          processingTime: endTime - startTime
        }
      };
    } catch (error) {
      throw new Error(`Failed to generate content: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Génère des idées de contenu
   */
  static async generateIdeas(
    topic: string,
    count: number = 5,
    type: 'post' | 'story' | 'video' = 'post'
  ): Promise<string[]> {
    const systemPrompt = `Tu es un expert en création de contenu pour les réseaux sociaux. 
    Génère ${count} idées créatives et engageantes pour des ${type}s sur le sujet : "${topic}".
    
    Chaque idée doit être :
    - Originale et créative
    - Engageante pour l'audience
    - Adaptée au format ${type}
    - Prête à être développée
    
    Réponds uniquement avec une liste numérotée des idées, sans introduction ni conclusion.`;

    try {
      const response = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: `Génère ${count} idées pour : ${topic}`
          }
        ],
        max_tokens: 500,
        temperature: 0.8
      });

      const content = response.choices[0]?.message?.content || '';
      
      // Parser les idées depuis la réponse
      const ideas = content
        .split('\n')
        .filter(line => line.trim().match(/^\d+\./))
        .map(line => line.replace(/^\d+\.\s*/, '').trim())
        .filter(idea => idea.length > 0);

      return ideas.slice(0, count);
    } catch (error) {
      throw new Error(`Failed to generate ideas: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Construit le prompt système selon le type de contenu
   */
  private static buildSystemPrompt(request: ContentGenerationRequest): string {
    const basePrompt = `Tu es un expert en création de contenu pour les réseaux sociaux.`;
    
    const typePrompts = {
      post: 'Crée un post engageant et informatif pour les réseaux sociaux.',
      story: 'Crée une story captivante et visuellement attrayante.',
      caption: 'Crée une légende accrocheuse et pertinente pour accompagner une image.',
      ideas: 'Génère des idées créatives et originales pour du contenu.'
    };

    const tonePrompts = {
      professional: 'Utilise un ton professionnel et informatif.',
      casual: 'Utilise un ton décontracté et amical.',
      creative: 'Sois créatif et original dans ton approche.',
      humorous: 'Ajoute une touche d\'humour appropriée.'
    };

    const lengthPrompts = {
      short: 'Garde le contenu concis et percutant (50-100 mots).',
      medium: 'Développe le contenu de manière équilibrée (100-200 mots).',
      long: 'Crée un contenu détaillé et complet (200-400 mots).'
    };

    let prompt = `${basePrompt}\n\n${typePrompts[request.type]}`;
    
    if (request.tone) {
      prompt += `\n${tonePrompts[request.tone]}`;
    }
    
    if (request.length) {
      prompt += `\n${lengthPrompts[request.length]}`;
    }

    if (request.language && request.language !== 'fr') {
      prompt += `\nRéponds en ${request.language}.`;
    }

    prompt += `\n\nAssure-toi que le contenu est engageant, authentique et adapté à l'audience cible.`;

    return prompt;
  }

  /**
   * Détermine le nombre maximum de tokens selon la longueur
   */
  private static getMaxTokens(length?: string): number {
    switch (length) {
      case 'short': return 150;
      case 'medium': return 300;
      case 'long': return 600;
      default: return 300;
    }
  }

  /**
   * Détermine la température selon le ton
   */
  private static getTemperature(tone?: string): number {
    switch (tone) {
      case 'professional': return 0.3;
      case 'casual': return 0.7;
      case 'creative': return 0.9;
      case 'humorous': return 0.8;
      default: return 0.7;
    }
  }

  /**
   * Estime le nombre de tokens (approximation)
   */
  private static estimateTokens(text: string): number {
    // Approximation : 1 token ≈ 4 caractères en français
    return Math.ceil(text.length / 4);
  }

  /**
   * Valide les limites d'usage selon l'abonnement
   */
  static validateUsageLimits(
    subscription: 'free' | 'pro' | 'enterprise',
    currentUsage: number
  ): { allowed: boolean; limit: number; remaining: number } {
    const limits = {
      free: 5,
      pro: -1, // Illimité
      enterprise: -1 // Illimité
    };

    const limit = limits[subscription];
    const allowed = limit === -1 || currentUsage < limit;
    const remaining = limit === -1 ? -1 : Math.max(0, limit - currentUsage);

    return { allowed, limit, remaining };
  }
}