import { ComprehendClient, DetectSentimentCommand, DetectEntitiesCommand, DetectKeyPhrasesCommand, DetectDominantLanguageCommand } from '@aws-sdk/client-comprehend';

const comprehend = new ComprehendClient({
  region: process.env.AWS_REGION || 'us-east-1'
});

export interface SentimentResult {
  sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL' | 'MIXED';
  scores: {
    positive: number;
    negative: number;
    neutral: number;
    mixed: number;
  };
}

export interface Entity {
  text: string;
  type: 'PERSON' | 'LOCATION' | 'ORGANIZATION' | 'DATE' | 'QUANTITY' | 'OTHER';
  score: number;
}

/**
 * Analyze sentiment of text (user messages, reviews, etc)
 */
export async function analyzeSentiment(text: string, language = 'en'): Promise<SentimentResult> {
  try {
    const command = new DetectSentimentCommand({
      Text: text,
      LanguageCode: language
    });
    
    const response = await comprehend.send(command);
    
    return {
      sentiment: response.Sentiment as SentimentResult['sentiment'],
      scores: {
        positive: response.SentimentScore?.Positive || 0,
        negative: response.SentimentScore?.Negative || 0,
        neutral: response.SentimentScore?.Neutral || 0,
        mixed: response.SentimentScore?.Mixed || 0
      }
    };
  } catch (error) {
    console.error('Comprehend sentiment analysis error:', error);
    throw error;
  }
}

/**
 * Extract entities from text (names, locations, etc)
 */
export async function extractEntities(text: string, language = 'en'): Promise<Entity[]> {
  try {
    const command = new DetectEntitiesCommand({
      Text: text,
      LanguageCode: language
    });
    
    const response = await comprehend.send(command);
    
    return (response.Entities || []).map(entity => ({
      text: entity.Text || '',
      type: entity.Type as Entity['type'] || 'OTHER',
      score: entity.Score || 0
    }));
  } catch (error) {
    console.error('Comprehend entity extraction error:', error);
    throw error;
  }
}

/**
 * Extract key phrases from text
 */
export async function extractKeyPhrases(text: string, language = 'en'): Promise<string[]> {
  try {
    const command = new DetectKeyPhrasesCommand({
      Text: text,
      LanguageCode: language
    });
    
    const response = await comprehend.send(command);
    
    return (response.KeyPhrases || [])
      .filter(phrase => (phrase.Score || 0) > 0.8)
      .map(phrase => phrase.Text || '');
  } catch (error) {
    console.error('Comprehend key phrases error:', error);
    throw error;
  }
}

/**
 * Detect dominant language
 */
export async function detectLanguage(text: string): Promise<string> {
  try {
    const command = new DetectDominantLanguageCommand({
      Text: text
    });
    
    const response = await comprehend.send(command);
    
    const dominant = response.Languages?.[0];
    return dominant?.LanguageCode || 'en';
  } catch (error) {
    console.error('Comprehend language detection error:', error);
    return 'en'; // Default fallback
  }
}

/**
 * Analyze fan message for insights
 */
export async function analyzeFanMessage(message: string) {
  const [sentiment, entities, keyPhrases, language] = await Promise.all([
    analyzeSentiment(message),
    extractEntities(message),
    extractKeyPhrases(message),
    detectLanguage(message)
  ]);
  
  return {
    sentiment,
    entities,
    keyPhrases,
    language,
    insights: generateInsights(sentiment, entities, keyPhrases)
  };
}

function generateInsights(sentiment: SentimentResult, entities: Entity[], keyPhrases: string[]) {
  const insights = [];
  
  // Sentiment-based insights
  if (sentiment.sentiment === 'POSITIVE' && sentiment.scores.positive > 0.8) {
    insights.push('Highly engaged fan - great upsell opportunity');
  }
  if (sentiment.sentiment === 'NEGATIVE') {
    insights.push('Unhappy fan - needs immediate attention');
  }
  
  // Entity-based insights
  const hasPersonalInfo = entities.some(e => e.type === 'PERSON' || e.type === 'LOCATION');
  if (hasPersonalInfo) {
    insights.push('Fan shared personal details - build rapport');
  }
  
  // Key phrase insights
  const hasMoneyKeywords = keyPhrases.some(phrase => 
    /money|pay|buy|purchase|tip|spend/i.test(phrase)
  );
  if (hasMoneyKeywords) {
    insights.push('Potential buyer - payment intent detected');
  }
  
  return insights;
}