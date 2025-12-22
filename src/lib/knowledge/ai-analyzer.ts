import { z } from 'zod';
import { callAzureAI, cleanDeepSeekOutput } from '../../lib/ai/providers/azure-ai';

export interface AnalysisResult {
  title: string;
  playbook: string; // La recette psychologique
  tags: string[];
  psychologicalTriggers: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

const analysisSchema = z.object({
  title: z.string().describe('Un titre court et percutant (ex: "Teasing Visuel + Urgence")'),
  playbook: z.string().describe('Explique la logique étape par étape. (ex: 1. Compliment, 2. Création du manque...)'),
  tags: z.array(z.string()).describe('Tags décrivant la technique (ex: ["sales", "psychology", "high_ticket"])'),
  psychologicalTriggers: z.array(z.string()).describe('Déclencheurs psychologiques utilisés (ex: ["scarcity", "social_proof", "reciprocity"])'),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).describe('Niveau de difficulté de la technique')
});

export async function analyzeSuccessfulMessage(
  originalText: string, 
  tipAmount: number,
  context?: {
    creatorNiche?: string;
    platform?: string;
    messageLength?: number;
    responseTime?: number;
  }
): Promise<AnalysisResult> {
  const systemPrompt = `
Tu es un expert en psychologie de la vente et en analyse de conversations sur OnlyFans.
Ta mission : Analyser un message qui a généré un tip de ${tipAmount}$.

PRINCIPES CLÉS:
1. ANONYMISATION: Ne jamais inclure de détails personnels ou de PII dans ton analyse
2. STRATÉGIE > CONTENU: Extraire la STRUCTURE et la STRATÉGIE sous-jacente, pas le texte brut
3. PSYCHOLOGIE: Identifier les déclencheurs psychologiques qui ont mené à la conversion
4. REPRODUCTIBILITÉ: La "recette" doit pouvoir être réutilisée dans d'autres contextes

CONTEXTE:
${context ? `
- Niche du créateur: ${context.creatorNiche || 'non spécifié'}
- Plateforme: ${context.platform || 'chat'}
- Longueur du message: ${context.messageLength || originalText.length} caractères
- Temps de réponse: ${context.responseTime ? context.responseTime + 's' : 'non spécifié'}
` : ''}

FORMAT DE SORTIE JSON attendu:
{
  "title": "Titre court et mémorable",
  "playbook": "Description étape par étape de la stratégie psychologique",
  "tags": ["tag1", "tag2", "tag3"],
  "psychologicalTriggers": ["trigger1", "trigger2"],
  "difficulty": "beginner|intermediate|advanced"
}

EXEMPLES DE STRATÉGIES À IDENTIFIER:
- Faux dilemme (proposer 2 options payantes)
- Teasing progressif (révéler graduellement)
- Validation sociale (mentionner d'autres clients)
- Urgence temporelle ("offre limitée")
- Réciprocité (donner avant de demander)
- Exclusivité ("juste pour toi")
- Montée en puissance (commencer doux, finir intense)
`;

  try {
    const response = await callAzureAI({
      model: 'deepseek', // Utiliser DeepSeek
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Message à analyser: "${originalText}"\n\nTip reçu: ${tipAmount}$\n\nAnalyse cette conversation et extrais la stratégie psychologique qui a fonctionné.` }
      ],
      temperature: 0.3,
    });

    const content = response.content;
    if (!content) {
      throw new Error('No response from DeepSeek');
    }

    // Clean DeepSeek reasoning output before parsing
    const cleanedContent = cleanDeepSeekOutput(content);
    const parsed = JSON.parse(cleanedContent);
    
    return {
      title: parsed.title || 'Technique de Vente',
      playbook: parsed.playbook || 'Message ayant généré du revenu',
      tags: Array.isArray(parsed.tags) ? parsed.tags : ['sales'],
      psychologicalTriggers: Array.isArray(parsed.psychologicalTriggers) ? parsed.psychologicalTriggers : ['curiosity'],
      difficulty: parsed.difficulty || 'beginner'
    };
  } catch (error) {
    console.error('Erreur lors de l\'analyse IA:', error);
    
    // Fallback basique si l'IA échoue
    return {
      title: generateFallbackTitle(originalText, tipAmount),
      playbook: generateFallbackPlaybook(originalText, tipAmount),
      tags: generateFallbackTags(originalText),
      psychologicalTriggers: ['curiosity'],
      difficulty: 'beginner'
    };
  }
}

// Fonctions de fallback si l'IA n'est pas disponible
function generateFallbackTitle(text: string, tipAmount: number): string {
  const lowerText = text.toLowerCase();
  
  if (tipAmount > 50) return 'Technique High Ticket';
  if (lowerText.includes('photo') || lowerText.includes('vidéo')) return 'Vente de Contenu Visuel';
  if (lowerText.includes('bébé') || lowerText.includes('baby')) return 'Approche Affectueuse';
  if (lowerText.includes('urgent') || lowerText.includes('maintenant')) return 'Technique d\'Urgence';
  
  return 'Message Convertissant';
}

function generateFallbackPlaybook(text: string, tipAmount: number): string {
  return `Message ayant généré ${tipAmount}$ en contenu direct. La stratégie semble basée sur une proposition claire avec un appel à l'action direct. Le ton est ${text.length > 100 ? 'conversationnel et détaillé' : 'direct et concis'}.`;
}

function generateFallbackTags(text: string): string[] {
  const tags = [];
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes('photo')) tags.push('content_sale');
  if (lowerText.includes('vidéo')) tags.push('video_sale');
  if (lowerText.includes('personnalisé') || lowerText.includes('custom')) tags.push('custom_content');
  if (lowerText.includes('urgent') || lowerText.includes('vite')) tags.push('urgency');
  if (lowerText.includes('seulement') || lowerText.includes('juste')) tags.push('exclusivity');
  
  if (tags.length === 0) tags.push('direct_message');
  
  return tags;
}

// Analyse par batch pour optimiser les coûts
export async function analyzeBatch(
  messages: Array<{ text: string; tipAmount: number; context?: any }>
): Promise<AnalysisResult[]> {
  const results: AnalysisResult[] = [];
  const batchSize = 5; // Limiter pour éviter de surcharger l'API
  
  for (let i = 0; i < messages.length; i += batchSize) {
    const batch = messages.slice(i, i + batchSize);
    
    const batchPromises = batch.map(msg => 
      analyzeSuccessfulMessage(msg.text, msg.tipAmount, msg.context)
        .catch(error => {
          console.error(`Erreur sur le message ${i}:`, error);
          return null;
        })
    );
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults.filter(r => r !== null) as AnalysisResult[]);
    
    // Petit délai entre les batches pour respecter les rate limits
    if (i + batchSize < messages.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return results;
}

// Calcul du score de qualité basé sur le tip et la complexité
export function calculateQualityScore(
  tipAmount: number, 
  messageLength: number,
  difficulty: 'beginner' | 'intermediate' | 'advanced'
): number {
  let score = 0;
  
  // Score basé sur le montant du tip (normalisé sur 100)
  score += Math.min(tipAmount / 100, 1) * 50;
  
  // Bonus pour les messages efficaces (court mais lucratif)
  if (messageLength < 200 && tipAmount > 20) score += 20;
  
  // Bonus selon la difficulté
  const difficultyBonus = {
    beginner: 0,
    intermediate: 15,
    advanced: 30
  };
  score += difficultyBonus[difficulty];
  
  return Math.min(score, 100);
}
