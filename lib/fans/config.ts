/**
 * Configuration du système de notes des fans
 */

export const FAN_NOTES_CONFIG = {
  // Seuils de confiance pour l'ajout automatique
  AUTO_ADD_THRESHOLD: 0.8, // Très élevé - seules les notes très fiables
  SUGGEST_THRESHOLD: 0.6,  // Notes suggérées à l'utilisateur
  
  // Longueur des notes
  MIN_NOTE_LENGTH: 3,
  MAX_NOTE_LENGTH: 100,
  
  // Validation
  MIN_MEANINGFUL_WORDS: 1, // Minimum de mots significatifs
  
  // Blacklist - Mots à ignorer (notes inutiles)
  BLACKLIST_WORDS: [
    // Salutations
    'salut', 'hello', 'hey', 'hi', 'bonjour', 'bonsoir',
    // Phrases vagues
    'ça', 'ca', 'cela', 'that', 'this', 'it',
    // Mots trop courts
    'toi', 'tu', 'te', 'you', 'your', 'me', 'moi',
    // Compliments génériques
    'belle', 'beau', 'sexy', 'hot', 'beautiful', 'gorgeous',
    // Phrases incomplètes
    'bien', 'mal', 'ok', 'okay', 'oui', 'non', 'yes', 'no',
  ],
  
  // Whitelist - Mots qui augmentent la confiance
  QUALITY_KEYWORDS: [
    'fitness', 'yoga', 'gaming', 'travel', 'music', 'art',
    'cooking', 'sport', 'photography', 'reading', 'movies',
    'series', 'anime', 'manga', 'fashion', 'makeup',
  ],
  
  // Patterns à éviter (regex)
  INVALID_PATTERNS: [
    /^[a-z]{1,2}$/i,           // Mots de 1-2 lettres
    /[<>{}[\]\\|`~]/,          // Caractères bizarres
    /^(le|la|les|un|une|des)$/i, // Articles seuls
  ],
  
  // Limites
  MAX_NOTES_PER_FAN: 50,     // Maximum de notes par fan
  MAX_AUTO_NOTES_PER_DAY: 5, // Maximum de notes auto par jour
  
  // Cache
  CACHE_TTL_SECONDS: 3600,   // 1 heure
} as const;

/**
 * Vérifie si un mot est dans la blacklist
 */
export function isBlacklisted(word: string): boolean {
  const lowerWord = word.toLowerCase();
  return FAN_NOTES_CONFIG.BLACKLIST_WORDS.some(
    blacklisted => lowerWord === blacklisted || lowerWord.startsWith(blacklisted + ' ')
  );
}

/**
 * Vérifie si un mot est un mot de qualité
 */
export function isQualityKeyword(word: string): boolean {
  return FAN_NOTES_CONFIG.QUALITY_KEYWORDS.some(
    keyword => word.toLowerCase().includes(keyword)
  );
}

/**
 * Vérifie si un contenu est valide
 */
export function isValidNoteContent(content: string): boolean {
  // Longueur
  if (content.length < FAN_NOTES_CONFIG.MIN_NOTE_LENGTH || 
      content.length > FAN_NOTES_CONFIG.MAX_NOTE_LENGTH) {
    return false;
  }
  
  // Patterns invalides
  for (const pattern of FAN_NOTES_CONFIG.INVALID_PATTERNS) {
    if (pattern.test(content)) {
      return false;
    }
  }
  
  // Mots significatifs
  const words = content.split(/\s+/).filter(w => w.length > 2);
  if (words.length < FAN_NOTES_CONFIG.MIN_MEANINGFUL_WORDS) {
    return false;
  }
  
  return true;
}
