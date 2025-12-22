/**
 * Auto Note Detector
 * 
 * Détecte automatiquement des notes dans les messages des fans
 * et les ajoute en base avec source='ai'
 */

import { fanNotesService, NoteCategory } from './fan-notes.service';
import { extractPotentialNotes } from './fan-context-enricher';

export interface MessageAnalysisResult {
  notesDetected: number;
  notesAdded: number;
  notes: Array<{
    category: NoteCategory;
    content: string;
    confidence: number;
    added: boolean;
  }>;
}

/**
 * Analyse un message et ajoute automatiquement les notes détectées
 */
export async function analyzeAndAddNotes(
  creatorId: number,
  fanId: string,
  fanUsername: string | undefined,
  message: string,
  options: {
    minConfidence?: number; // Seuil minimum de confiance (0-1)
    autoAdd?: boolean; // Ajouter automatiquement ou juste détecter
  } = {}
): Promise<MessageAnalysisResult> {
  const { minConfidence = 0.6, autoAdd = true } = options;

  // Extraire les notes potentielles
  const potentialNotes = extractPotentialNotes(message);

  const result: MessageAnalysisResult = {
    notesDetected: potentialNotes.length,
    notesAdded: 0,
    notes: [],
  };

  // Filtrer par confiance
  const validNotes = potentialNotes.filter(n => n.confidence >= minConfidence);

  // Ajouter les notes en base si autoAdd=true
  for (const note of validNotes) {
    let added = false;

    if (autoAdd) {
      try {
        await fanNotesService.addAINote(
          creatorId,
          fanId,
          note.category,
          note.content,
          note.confidence,
          {
            detectedFrom: 'message',
            originalMessage: message.substring(0, 200), // Garder un extrait
            detectedAt: new Date().toISOString(),
          }
        );
        added = true;
        result.notesAdded++;
      } catch (error) {
        console.error('[AutoNoteDetector] Failed to add note:', error);
      }
    }

    result.notes.push({
      category: note.category,
      content: note.content,
      confidence: note.confidence,
      added,
    });
  }

  return result;
}

/**
 * Analyse un message avec l'IA pour extraire des insights plus avancés
 * (optionnel - nécessite un appel IA)
 */
export async function analyzeMessageWithAI(
  message: string,
  context?: {
    previousMessages?: string[];
    fanHistory?: any;
  }
): Promise<Array<{ category: NoteCategory; content: string; confidence: number }>> {
  // TODO: Implémenter l'analyse IA avancée
  // Pour l'instant, utilise juste la détection par patterns
  return extractPotentialNotes(message);
}

/**
 * Hook à appeler après chaque message reçu d'un fan
 * 
 * SEUIL DE CONFIANCE ÉLEVÉ (0.8) pour éviter les notes inutiles
 * Seules les notes très fiables sont ajoutées automatiquement
 */
export async function onFanMessageReceived(
  creatorId: number,
  fanId: string,
  fanUsername: string | undefined,
  message: string
): Promise<void> {
  try {
    const result = await analyzeAndAddNotes(
      creatorId,
      fanId,
      fanUsername,
      message,
      {
        minConfidence: 0.8, // SEUIL ÉLEVÉ - Seules les notes très fiables
        autoAdd: true,
      }
    );

    if (result.notesAdded > 0) {
      console.log(`[AutoNoteDetector] Added ${result.notesAdded} high-confidence notes for fan ${fanId}`);
    }
  } catch (error) {
    console.error('[AutoNoteDetector] Error analyzing message:', error);
  }
}
