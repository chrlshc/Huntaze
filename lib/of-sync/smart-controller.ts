import { DynamoDBClient, GetItemCommand, QueryCommand } from '@aws-sdk/client-dynamodb';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';

// --- CONFIGURATION ---
const REGION = process.env.AWS_REGION || 'us-east-2';
const SQS_QUEUE_URL = process.env.SQS_QUEUE_URL!;

// Noms des tables (Variables d'environnement Vercel)
const TABLE_ANALYTICS = process.env.OF_DDB_ANALYTICS_TABLE || 'Huntaze_Analytics';
const TABLE_FANS = process.env.OF_DDB_FANS_TABLE || 'Huntaze_Fans';

// Initialisation des clients (hors du handler pour réutilisation Lambda/Vercel)
const dbClient = new DynamoDBClient({ region: REGION });
const sqsClient = new SQSClient({ region: REGION });

export type SyncType = 'financials' | 'fans' | 'content';

interface SyncResult {
  status: 'cached' | 'queued' | 'error';
  data?: any;
  message?: string;
  cachedAt?: string;
}

/**
 * Smart Sync Controller - Le gardien du budget Bright Data
 * 
 * Vérifie si on a déjà des données récentes dans DynamoDB avant de lancer
 * un scrape payant via le Browser Worker.
 * 
 * Coût: 
 * - Cache hit = 0$ (lecture DynamoDB gratuite)
 * - Cache miss = ~0.001$ (scrape Bright Data)
 */
export async function triggerSmartSync(
  userId: string, 
  type: SyncType, 
  forceRefresh: boolean = false
): Promise<SyncResult> {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  // 1. Si on force le refresh (bouton manuel), on saute le cache
  if (!forceRefresh) {
    const cachedData = await checkCache(userId, type, today);
    if (cachedData) {
      console.log(`💰 [CACHE HIT] Données ${type} trouvées pour ${userId}. Pas de scrape.`);
      return { 
        status: 'cached', 
        data: cachedData,
        cachedAt: today
      };
    }
  }

  // 2. Si pas de cache (ou forcé), on déclenche le Scrape via SQS
  console.log(`🚀 [SQS TRIGGER] Envoi demande de scrape pour ${type} (User: ${userId})`);
  
  try {
    await sqsClient.send(new SendMessageCommand({
      QueueUrl: SQS_QUEUE_URL,
      MessageBody: JSON.stringify({
        task_type: `scrape_${type}`,
        user_id: userId,
        timestamp: new Date().toISOString()
      }),
      // Groupe de messages pour éviter les doublons (FIFO queue)
      MessageGroupId: `${userId}-${type}`,
      // Déduplication sur 5 minutes
      MessageDeduplicationId: `${userId}-${type}-${today}-${Math.floor(Date.now() / 300000)}`
    }));

    return { 
      status: 'queued', 
      message: 'Synchronisation lancée. Les données arriveront sous peu.' 
    };
  } catch (error) {
    console.error("❌ Erreur SQS:", error);
    return { 
      status: 'error', 
      message: "Impossible de lancer le worker de synchronisation." 
    };
  }
}

/**
 * Vérifie l'existence de données récentes dans DynamoDB
 * Coût: ~0$ (Free Tier: 25 RCU gratuites/mois)
 */
async function checkCache(userId: string, type: SyncType, dateKey: string) {
  try {
    if (type === 'financials') {
      // Pour les finances, on cherche une entrée avec la date d'aujourd'hui
      const { Item } = await dbClient.send(new GetItemCommand({
        TableName: TABLE_ANALYTICS,
        Key: marshall({ userId: userId, date: dateKey })
      }));
      return Item ? unmarshall(Item) : null;
    }

    if (type === 'fans') {
      // Pour les fans, on vérifie si on a AU MOINS un fan pour ce créateur
      // Dans une V2, on vérifiera une date de dernière synchro
      const { Count } = await dbClient.send(new QueryCommand({
        TableName: TABLE_FANS,
        KeyConditionExpression: "creatorId = :uid",
        ExpressionAttributeValues: marshall({ ":uid": userId }),
        Limit: 1 // On veut juste savoir s'il y en a un
      }));

      // Si on a des fans, on considère que c'est "caché" (sauf force refresh)
      return (Count && Count > 0) ? { cached: true, count: Count } : null;
    }

    if (type === 'content') {
      // Pour le contenu, même logique que les fans
      const { Count } = await dbClient.send(new QueryCommand({
        TableName: process.env.OF_DDB_CONTENT_TABLE || 'Huntaze_Content',
        KeyConditionExpression: "userId = :uid",
        ExpressionAttributeValues: marshall({ ":uid": userId }),
        Limit: 1
      }));
      return (Count && Count > 0) ? { cached: true, count: Count } : null;
    }

    return null;
  } catch (error) {
    console.error(`⚠️ Erreur lecture cache DynamoDB (${type}):`, error);
    return null; // En cas d'erreur, on assume pas de cache (fail-safe)
  }
}

/**
 * Récupère les données depuis le cache DynamoDB
 * Utilisé après un scrape réussi ou pour afficher les données existantes
 */
export async function getFromCache(userId: string, type: SyncType, dateKey?: string) {
  const today = dateKey || new Date().toISOString().split('T')[0];
  
  try {
    if (type === 'financials') {
      const { Item } = await dbClient.send(new GetItemCommand({
        TableName: TABLE_ANALYTICS,
        Key: marshall({ userId, date: today })
      }));
      return Item ? unmarshall(Item) : null;
    }

    if (type === 'fans') {
      const { Items } = await dbClient.send(new QueryCommand({
        TableName: TABLE_FANS,
        KeyConditionExpression: "creatorId = :uid",
        ExpressionAttributeValues: marshall({ ":uid": userId }),
        Limit: 100 // Max 100 fans pour la beta
      }));
      return Items ? Items.map(item => unmarshall(item)) : [];
    }

    return null;
  } catch (error) {
    console.error(`❌ Erreur getFromCache (${type}):`, error);
    return null;
  }
}
