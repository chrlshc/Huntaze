/**
 * Exemples d'utilisation du service Gemini
 */

import { geminiService, generateText, chat, generateTextStream } from './gemini.service';

/**
 * Exemple 1: Génération de texte simple
 */
export async function exampleSimpleGeneration() {
  const prompt = 'Écris une description courte pour une plateforme de créateurs de contenu';
  
  const text = await generateText(prompt, {
    temperature: 0.7,
    maxOutputTokens: 200,
  });
  
  console.log('Texte généré:', text);
  return text;
}

/**
 * Exemple 2: Chat avec historique
 */
export async function exampleChat() {
  const messages = [
    {
      role: 'user' as const,
      parts: 'Bonjour! Je suis un créateur de contenu sur Instagram.',
    },
    {
      role: 'model' as const,
      parts: 'Bonjour! Ravi de vous rencontrer. Comment puis-je vous aider avec votre contenu Instagram?',
    },
    {
      role: 'user' as const,
      parts: 'Peux-tu me donner 3 idées de posts pour augmenter mon engagement?',
    },
  ];
  
  const response = await chat(messages, {
    temperature: 0.8,
    maxOutputTokens: 500,
  });
  
  console.log('Réponse du chat:', response);
  return response;
}

/**
 * Exemple 3: Génération en streaming
 */
export async function exampleStreaming() {
  const prompt = 'Écris un guide complet pour débuter sur TikTok en tant que créateur';
  
  console.log('Streaming...');
  
  let fullText = '';
  for await (const chunk of generateTextStream(prompt, {
    temperature: 0.7,
    maxOutputTokens: 1000,
  })) {
    process.stdout.write(chunk);
    fullText += chunk;
  }
  
  console.log('\n\nTexte complet:', fullText);
  return fullText;
}

/**
 * Exemple 4: Génération de contenu pour les créateurs
 */
export async function generateCreatorContent(
  platform: string,
  topic: string,
  tone: 'professional' | 'casual' | 'humorous' = 'casual'
) {
  const prompt = `
Génère un post pour ${platform} sur le sujet: ${topic}

Ton: ${tone}
Format: 
- Accroche captivante
- Corps du message (2-3 paragraphes)
- Call-to-action
- 3-5 hashtags pertinents

Limite: 280 caractères pour Twitter, 2200 pour Instagram, 150 pour TikTok
`;

  const content = await generateText(prompt, {
    temperature: 0.8,
    maxOutputTokens: 500,
  });
  
  return content;
}

/**
 * Exemple 5: Analyse de performance de contenu
 */
export async function analyzeContentPerformance(
  contentType: string,
  metrics: {
    views: number;
    likes: number;
    comments: number;
    shares: number;
  }
) {
  const prompt = `
Analyse ces métriques de performance pour un ${contentType}:
- Vues: ${metrics.views}
- Likes: ${metrics.likes}
- Commentaires: ${metrics.comments}
- Partages: ${metrics.shares}

Fournis:
1. Une évaluation de la performance (excellent/bon/moyen/faible)
2. Les points forts
3. Les points à améliorer
4. 3 recommandations concrètes
`;

  const analysis = await generateText(prompt, {
    temperature: 0.5,
    maxOutputTokens: 600,
  });
  
  return analysis;
}

/**
 * Exemple 6: Génération d'idées de contenu
 */
export async function generateContentIdeas(
  niche: string,
  numberOfIdeas: number = 5
) {
  const prompt = `
Génère ${numberOfIdeas} idées de contenu créatives pour un créateur dans la niche: ${niche}

Pour chaque idée, fournis:
- Titre accrocheur
- Description courte (1-2 phrases)
- Format suggéré (vidéo, image, carrousel, etc.)
- Meilleur moment pour poster
`;

  const ideas = await generateText(prompt, {
    temperature: 0.9,
    maxOutputTokens: 800,
  });
  
  return ideas;
}

/**
 * Exemple 7: Optimisation de bio/description
 */
export async function optimizeBio(
  currentBio: string,
  platform: string,
  targetAudience: string
) {
  const prompt = `
Optimise cette bio pour ${platform}:
"${currentBio}"

Audience cible: ${targetAudience}

Fournis:
1. Version optimisée de la bio
2. Explication des changements
3. Mots-clés SEO suggérés
`;

  const optimizedBio = await generateText(prompt, {
    temperature: 0.7,
    maxOutputTokens: 400,
  });
  
  return optimizedBio;
}

/**
 * Exemple 8: Génération de légendes pour images
 */
export async function generateImageCaption(
  imageDescription: string,
  mood: string,
  includeHashtags: boolean = true
) {
  const prompt = `
Génère une légende Instagram captivante pour cette image:
Description: ${imageDescription}
Mood: ${mood}

${includeHashtags ? 'Inclus 5-7 hashtags pertinents à la fin.' : 'Sans hashtags.'}

La légende doit:
- Être engageante et authentique
- Encourager l'interaction
- Refléter le mood demandé
`;

  const caption = await generateText(prompt, {
    temperature: 0.8,
    maxOutputTokens: 300,
  });
  
  return caption;
}

/**
 * Exemple 9: Compter les tokens
 */
export async function exampleTokenCounting() {
  const text = 'Ceci est un exemple de texte pour compter les tokens.';
  
  const tokenCount = await geminiService.countTokens(text);
  console.log(`Nombre de tokens: ${tokenCount}`);
  
  return tokenCount;
}

/**
 * Exemple 10: Changer de modèle
 */
export async function exampleModelSwitch() {
  // Utiliser Gemini 1.5 Flash (plus rapide, moins cher)
  geminiService.setModel('gemini-1.5-flash');
  
  const fastResponse = await generateText('Dis bonjour!', {
    maxOutputTokens: 50,
  });
  
  console.log('Réponse rapide:', fastResponse);
  
  // Revenir à Gemini 1.5 Pro (plus puissant)
  geminiService.setModel('gemini-1.5-pro');
  
  return fastResponse;
}
