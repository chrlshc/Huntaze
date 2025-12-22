/**
 * Fan Context Enricher
 * 
 * Enrichit le contexte de l'IA avec les notes des fans
 * pour personnaliser les réponses générées.
 */

import { fanNotesService, NoteCategory, FanNote, FanProfile } from './fan-notes.service';

export interface EnrichedFanContext {
  // Profil du fan
  profile: FanProfile | null;
  
  // Notes groupées par catégorie
  notes: Record<NoteCategory, FanNote[]>;
  
  // Résumé textuel pour le prompt IA
  summary: string;
  
  // Points clés extraits pour le prompt
  keyPoints: {
    preferences: string[];
    interests: string[];
    personalInfo: string[];
    purchaseBehavior: string[];
    communicationStyle: string[];
    importantNotes: string[];
  };
  
  // Métadonnées
  totalNotes: number;
  hasManualNotes: boolean;
  hasAINotes: boolean;
}

/**
 * Enrichit le contexte d'un fan pour l'IA
 */
export async function enrichFanContext(
  creatorId: number,
  fanId: string
): Promise<EnrichedFanContext> {
  const context = await fanNotesService.getFanContextForAI(creatorId, fanId);
  
  // Extraire les points clés de chaque catégorie
  const keyPoints = {
    preferences: context.notes.preferences.map(n => n.content),
    interests: context.notes.interests.map(n => n.content),
    personalInfo: context.notes.personal.map(n => n.content),
    purchaseBehavior: context.notes.purchase_behavior.map(n => n.content),
    communicationStyle: context.notes.communication_style.map(n => n.content),
    importantNotes: context.notes.important.map(n => n.content),
  };
  
  // Compter les notes
  const allNotes = Object.values(context.notes).flat();
  const totalNotes = allNotes.length;
  const hasManualNotes = allNotes.some(n => n.source === 'manual');
  const hasAINotes = allNotes.some(n => n.source === 'ai');
  
  return {
    profile: context.profile,
    notes: context.notes,
    summary: context.summary,
    keyPoints,
    totalNotes,
    hasManualNotes,
    hasAINotes,
  };
}

/**
 * Génère un prompt système enrichi avec les notes du fan
 */
export function generateEnrichedSystemPrompt(
  basePrompt: string,
  fanContext: EnrichedFanContext
): string {
  let enrichedPrompt = basePrompt;
  
  // Ajouter les informations du profil
  if (fanContext.profile) {
    enrichedPrompt += `\n\n=== PROFIL DU FAN ===`;
    enrichedPrompt += `\nStatut: ${fanContext.profile.status}`;
    if (fanContext.profile.totalSpent > 0) {
      enrichedPrompt += `\nTotal dépensé: $${fanContext.profile.totalSpent.toFixed(2)}`;
    }
    if (fanContext.profile.purchaseCount > 0) {
      enrichedPrompt += `\nNombre d'achats: ${fanContext.profile.purchaseCount}`;
    }
  }
  
  // Ajouter les notes importantes en premier
  if (fanContext.keyPoints.importantNotes.length > 0) {
    enrichedPrompt += `\n\n⭐ NOTES IMPORTANTES À RETENIR:`;
    fanContext.keyPoints.importantNotes.forEach(note => {
      enrichedPrompt += `\n- ${note}`;
    });
  }
  
  // Ajouter les préférences
  if (fanContext.keyPoints.preferences.length > 0) {
    enrichedPrompt += `\n\n❤️ CE QUE CE FAN AIME:`;
    fanContext.keyPoints.preferences.forEach(note => {
      enrichedPrompt += `\n- ${note}`;
    });
  }
  
  // Ajouter les intérêts
  if (fanContext.keyPoints.interests.length > 0) {
    enrichedPrompt += `\n\n🎯 CENTRES D'INTÉRÊT:`;
    fanContext.keyPoints.interests.forEach(note => {
      enrichedPrompt += `\n- ${note}`;
    });
  }
  
  // Ajouter les infos personnelles
  if (fanContext.keyPoints.personalInfo.length > 0) {
    enrichedPrompt += `\n\n👤 INFOS PERSONNELLES:`;
    fanContext.keyPoints.personalInfo.forEach(note => {
      enrichedPrompt += `\n- ${note}`;
    });
  }
  
  // Ajouter le comportement d'achat
  if (fanContext.keyPoints.purchaseBehavior.length > 0) {
    enrichedPrompt += `\n\n💰 COMPORTEMENT D'ACHAT:`;
    fanContext.keyPoints.purchaseBehavior.forEach(note => {
      enrichedPrompt += `\n- ${note}`;
    });
  }
  
  // Ajouter le style de communication
  if (fanContext.keyPoints.communicationStyle.length > 0) {
    enrichedPrompt += `\n\n💬 STYLE DE COMMUNICATION PRÉFÉRÉ:`;
    fanContext.keyPoints.communicationStyle.forEach(note => {
      enrichedPrompt += `\n- ${note}`;
    });
  }
  
  // Ajouter une instruction pour utiliser ces infos
  if (fanContext.totalNotes > 0) {
    enrichedPrompt += `\n\n=== INSTRUCTIONS ===`;
    enrichedPrompt += `\nUtilise ces informations pour personnaliser ta réponse.`;
    enrichedPrompt += `\nFais référence subtilement à ses intérêts ou préférences quand c'est pertinent.`;
    enrichedPrompt += `\nRespecte son style de communication préféré.`;
  }
  
  return enrichedPrompt;
}

/**
 * Extrait automatiquement des notes potentielles d'un message
 * (pour suggestion à l'utilisateur ou ajout automatique)
 * 
 * FILTRES DE QUALITÉ:
 * - Longueur min/max
 * - Blacklist de mots inutiles
 * - Validation du contexte
 * - Score de confiance ajusté
 */
export function extractPotentialNotes(
  message: string
): Array<{ category: NoteCategory; content: string; confidence: number }> {
  const potentialNotes: Array<{ category: NoteCategory; content: string; confidence: number }> = [];
  const lowerMessage = message.toLowerCase();
  
  // BLACKLIST - Mots/phrases à ignorer (notes inutiles)
  const blacklist = [
    // Salutations basiques
    'salut', 'hello', 'hey', 'hi', 'bonjour', 'bonsoir',
    // Phrases vagues
    'ça', 'ca', 'cela', 'that', 'this', 'it',
    // Mots trop courts ou génériques
    'toi', 'tu', 'te', 'you', 'your', 'me', 'moi',
    // Compliments génériques (pas assez spécifiques)
    'belle', 'beau', 'sexy', 'hot', 'beautiful', 'gorgeous',
    // Phrases incomplètes
    'bien', 'mal', 'ok', 'okay', 'oui', 'non', 'yes', 'no',
  ];
  
  // Patterns pour détecter les intérêts SPÉCIFIQUES
  const interestPatterns = [
    { pattern: /je suis (?:passionné|passionnée) (?:de |par )?(.+)/i, category: 'interests' as NoteCategory, confidence: 0.85 },
    { pattern: /je fais (?:du |de la |de l')?(.+) (?:depuis|régulièrement)/i, category: 'interests' as NoteCategory, confidence: 0.8 },
    { pattern: /mon hobby (?:c'est|préféré est) (.+)/i, category: 'interests' as NoteCategory, confidence: 0.85 },
    { pattern: /je pratique (?:le |la |l')?(.+)/i, category: 'interests' as NoteCategory, confidence: 0.75 },
  ];
  
  // Patterns pour infos personnelles VÉRIFIABLES
  const personalPatterns = [
    { pattern: /mon anniversaire (?:est |c'est )?(?:le )?(\d{1,2}[\/\-]\d{1,2}(?:[\/\-]\d{2,4})?)/i, category: 'personal' as NoteCategory, confidence: 0.95 },
    { pattern: /je travaille (?:comme |en tant que )?([a-zà-ÿ\s]{3,30})/i, category: 'personal' as NoteCategory, confidence: 0.8 },
    { pattern: /j'habite (?:à |en |dans )?([a-zà-ÿ\s]{3,30})/i, category: 'personal' as NoteCategory, confidence: 0.75 },
    { pattern: /je suis (?:un |une )?([a-zà-ÿ]{5,30})/i, category: 'personal' as NoteCategory, confidence: 0.6 },
  ];
  
  // Patterns pour préférences de contenu SPÉCIFIQUES
  const contentPatterns = [
    { pattern: /j'adore (?:tes |vos )?(?:photos?|vidéos?) (?:de |en |avec )?([a-zà-ÿ\s]{4,50})/i, category: 'preferences' as NoteCategory, confidence: 0.8 },
    { pattern: /j'aime (?:beaucoup )?(?:quand tu |tes )?([a-zà-ÿ\s]{5,50})/i, category: 'preferences' as NoteCategory, confidence: 0.7 },
    { pattern: /je préfère (?:les |tes )?([a-zà-ÿ\s]{4,50})/i, category: 'preferences' as NoteCategory, confidence: 0.75 },
  ];
  
  const allPatterns = [...interestPatterns, ...personalPatterns, ...contentPatterns];
  
  for (const { pattern, category, confidence } of allPatterns) {
    const match = message.match(pattern);
    if (match && match[1]) {
      let content = match[1].trim();
      
      // VALIDATION 1: Longueur
      if (content.length < 3 || content.length > 100) {
        continue;
      }
      
      // VALIDATION 2: Blacklist
      const contentLower = content.toLowerCase();
      if (blacklist.some(word => contentLower === word || contentLower.startsWith(word + ' '))) {
        continue;
      }
      
      // VALIDATION 3: Pas que des pronoms/articles
      const meaningfulWords = content.split(/\s+/).filter(word => 
        word.length > 2 && !['les', 'des', 'une', 'the', 'and', 'or'].includes(word.toLowerCase())
      );
      if (meaningfulWords.length === 0) {
        continue;
      }
      
      // VALIDATION 4: Pas de caractères bizarres
      if (/[<>{}[\]\\|`~]/.test(content)) {
        continue;
      }
      
      // VALIDATION 5: Ajuster la confiance selon la qualité
      let adjustedConfidence = confidence;
      
      // Bonus si contient des mots spécifiques
      if (/fitness|yoga|gaming|travel|music|art|cooking|sport/i.test(content)) {
        adjustedConfidence += 0.1;
      }
      
      // Malus si trop court
      if (content.length < 5) {
        adjustedConfidence -= 0.2;
      }
      
      // Malus si contient des mots vagues
      if (/ça|cela|chose|truc|machin/i.test(content)) {
        adjustedConfidence -= 0.3;
      }
      
      // Ne garder que si confiance >= 0.6
      if (adjustedConfidence >= 0.6) {
        potentialNotes.push({
          category,
          content: content.charAt(0).toUpperCase() + content.slice(1),
          confidence: Math.min(adjustedConfidence, 0.95),
        });
      }
    }
  }
  
  return potentialNotes;
}

export { fanNotesService };
