/**
 * Exemple d'intégration du système de notes avec l'agent de messagerie
 * 
 * Ce fichier montre comment enrichir les réponses IA avec les notes des fans
 * et comment détecter automatiquement de nouvelles notes
 */

import { FoundryMessagingAgent } from './messaging.foundry';
import { enrichFanContext, generateEnrichedSystemPrompt } from '../../fans/fan-context-enricher';
import { onFanMessageReceived } from '../../fans/auto-note-detector';

/**
 * Exemple d'utilisation : Générer une réponse enrichie avec les notes du fan
 */
export async function generateResponseWithNotes(
  creatorId: number,
  fanId: string,
  message: string,
  context?: {
    fanHistory?: any[];
    creatorStyle?: string;
    previousMessages?: any[];
    personalityProfile?: any;
  }
) {
  // 1. Charger le contexte enrichi du fan (profil + notes)
  const fanContext = await enrichFanContext(creatorId, fanId);

  console.log(`[MessagingWithNotes] Fan context loaded:`, {
    totalNotes: fanContext.totalNotes,
    hasManualNotes: fanContext.hasManualNotes,
    hasAINotes: fanContext.hasAINotes,
    status: fanContext.profile?.status,
  });

  // 2. Créer l'agent de messagerie Foundry
  const agent = new FoundryMessagingAgent();

  // 3. Enrichir le contexte avec les notes
  const enrichedContext = {
    ...context,
    // Ajouter les notes dans le contexte
    fanNotes: fanContext.summary,
    fanProfile: fanContext.profile,
    // Ajouter les points clés pour référence rapide
    fanPreferences: fanContext.keyPoints.preferences,
    fanInterests: fanContext.keyPoints.interests,
    importantNotes: fanContext.keyPoints.importantNotes,
  };

  // 4. Générer la réponse avec le contexte enrichi
  const response = await agent.generateResponse(
    creatorId,
    fanId,
    message,
    enrichedContext
  );

  // 5. Analyser le message du fan pour détecter de nouvelles notes
  // (en arrière-plan, non-bloquant)
  onFanMessageReceived(creatorId, fanId, undefined, message).catch(error => {
    console.error('[MessagingWithNotes] Failed to analyze message for notes:', error);
  });

  return {
    ...response,
    // Ajouter des métadonnées sur le contexte utilisé
    contextUsed: {
      notesCount: fanContext.totalNotes,
      profileStatus: fanContext.profile?.status,
      hasPersonalization: fanContext.totalNotes > 0,
    },
  };
}

/**
 * Exemple : Prompt système enrichi avec les notes
 */
export function buildEnrichedSystemPrompt(
  basePrompt: string,
  fanContext: Awaited<ReturnType<typeof enrichFanContext>>
): string {
  return generateEnrichedSystemPrompt(basePrompt, fanContext);
}

/**
 * Exemple d'utilisation complète
 */
export async function exampleUsage() {
  const creatorId = 1;
  const fanId = 'fan_123';
  const message = "Hey! J'adore tes photos en extérieur, tu en feras d'autres bientôt ?";

  // Générer une réponse personnalisée
  const response = await generateResponseWithNotes(
    creatorId,
    fanId,
    message,
    {
      creatorStyle: 'friendly and flirty',
      previousMessages: [
        { role: 'fan', content: 'Salut!' },
        { role: 'creator', content: 'Hey! Comment ça va?' },
      ],
    }
  );

  console.log('Response:', response.response);
  console.log('Confidence:', response.confidence);
  console.log('Context used:', response.contextUsed);

  // La note "Aime les photos en extérieur" sera automatiquement
  // détectée et ajoutée en base avec source='ai'
}
