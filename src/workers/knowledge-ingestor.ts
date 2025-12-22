import { PrismaClient } from '@prisma/client';
import { analyzeSuccessfulMessage, analyzeBatch, calculateQualityScore } from '../lib/knowledge/ai-analyzer';
import { getAzureEmbedding } from '../lib/ai/providers/azure-ai';
import crypto from 'crypto';

// Types pour les messages scrapés
export interface ScrapedMessage {
  id: string;
  text: string;
  isFromCreator: boolean;
  tipAmount: number;
  createdAt: Date;
  fanId?: string;
  responseTime?: number; // temps avant la réponse en secondes
}

export interface IngestionOptions {
  minTipAmount?: number; // Filtre minimum pour considérer un message comme "succès"
  maxMessageLength?: number; // Éviter les messages trop longs
  batchSize?: number; // Taille des batchs pour l'analyse
  enableDeduplication?: boolean; // Éviter les doublons
}

export interface IngestionResult {
  success: boolean;
  totalMessages: number;
  successfulMessages: number;
  skippedMessages: number;
  errors: string[];
  duration: number;
}

export class KnowledgeIngestor {
  private prisma: PrismaClient;
  private defaultOptions: Required<IngestionOptions> = {
    minTipAmount: 5, // Minimum 5$ pour considérer comme succès
    maxMessageLength: 1000,
    batchSize: 5,
    enableDeduplication: true,
  };

  constructor(prisma?: PrismaClient) {
    this.prisma = prisma || new PrismaClient();
  }

  /**
   * Point d'entrée principal pour l'ingestion
   */
  async ingestHistory(
    userId: number,
    rawMessages: ScrapedMessage[],
    options: Partial<IngestionOptions> = {}
  ): Promise<IngestionResult> {
    const startTime = Date.now();
    const opts = { ...this.defaultOptions, ...options };
    
    console.log(`🚀 Démarrage de l'ingestion pour l'utilisateur ${userId}...`);
    console.log(`📊 ${rawMessages.length} messages bruts reçus`);

    const result: IngestionResult = {
      success: true,
      totalMessages: rawMessages.length,
      successfulMessages: 0,
      skippedMessages: 0,
      errors: [],
      duration: 0,
    };

    try {
      // 1. FILTRAGE - Ne garder que les messages pertinents
      const filteredMessages = this.filterMessages(rawMessages, opts);
      console.log(`💰 ${filteredMessages.length} messages qualifiés après filtrage`);

      if (filteredMessages.length === 0) {
        console.log('⚠️ Aucun message à traiter après filtrage');
        result.duration = Date.now() - startTime;
        return result;
      }

      // 2. DÉDUPLICATION - Éviter les doublons
      const uniqueMessages = opts.enableDeduplication 
        ? await this.deduplicateMessages(filteredMessages, userId)
        : filteredMessages;
      
      if (opts.enableDeduplication) {
        console.log(`🔄 ${uniqueMessages.length} messages uniques après déduplication`);
      }

      // 3. ANALYSE PAR BATCH - Traitement par lots pour optimiser les coûts
      const batches = this.createBatches(uniqueMessages, opts.batchSize);
      console.log(`📦 Traitement en ${batches.length} batches de ${opts.batchSize} messages`);

      for (let i = 0; i < batches.length; i++) {
        console.log(`\n--- Batch ${i + 1}/${batches.length} ---`);
        
        try {
          const batchResult = await this.processBatch(batches[i], userId, opts);
          result.successfulMessages += batchResult.successful;
          result.skippedMessages += batchResult.skipped;
          result.errors.push(...batchResult.errors);
          
          // Pause entre batches pour respecter les rate limits
          if (i < batches.length - 1) {
            await this.sleep(2000);
          }
        } catch (error) {
          const errorMsg = `Erreur sur le batch ${i + 1}: ${error}`;
          console.error(`❌ ${errorMsg}`);
          result.errors.push(errorMsg);
        }
      }

      // 4. NETTOYAGE - Archiver les anciennes connaissances si nécessaire
      await this.cleanupOldKnowledge(userId);

      console.log(`\n✅ Ingestion terminée:`);
      console.log(`   - Messages traités: ${result.successfulMessages}`);
      console.log(`   - Messages ignorés: ${result.skippedMessages}`);
      console.log(`   - Erreurs: ${result.errors.length}`);

    } catch (error) {
      console.error('❌ Erreur critique lors de l\'ingestion:', error);
      result.success = false;
      result.errors.push(`Erreur critique: ${error}`);
    }

    result.duration = Date.now() - startTime;
    return result;
  }

  /**
   * Filtre les messages pour ne garder que les plus pertinents
   */
  private filterMessages(messages: ScrapedMessage[], options: Required<IngestionOptions>): ScrapedMessage[] {
    return messages.filter(msg => {
      // Doit venir du créateur
      if (!msg.isFromCreator) return false;
      
      // Doit avoir un tip minimum
      if (msg.tipAmount < options.minTipAmount) return false;
      
      // Ne pas être trop long
      if (msg.text.length > options.maxMessageLength) return false;
      
      // Éviter les messages trop courts ou vides
      if (msg.text.trim().length < 10) return false;
      
      // Éviter les messages génériques
      const genericPatterns = ['merci', 'thank you', 'ok', 'yes', 'no', 'bye'];
      if (genericPatterns.some(pattern => msg.text.toLowerCase().includes(pattern))) {
        return false;
      }
      
      return true;
    });
  }

  /**
   * Évite les doublons en utilisant un hash du message
   */
  private async deduplicateMessages(messages: ScrapedMessage[], userId: number): Promise<ScrapedMessage[]> {
    const existingHashes = await this.getExistingMessageHashes(userId);
    const uniqueMessages: ScrapedMessage[] = [];
    
    for (const msg of messages) {
      const hash = this.hashMessage(msg.text);
      
      if (!existingHashes.has(hash)) {
        uniqueMessages.push(msg);
        existingHashes.add(hash);
      }
    }
    
    return uniqueMessages;
  }

  /**
   * Crée des batches pour le traitement
   */
  private createBatches(messages: ScrapedMessage[], batchSize: number): ScrapedMessage[][] {
    const batches: ScrapedMessage[][] = [];
    for (let i = 0; i < messages.length; i += batchSize) {
      batches.push(messages.slice(i, i + batchSize));
    }
    return batches;
  }

  /**
   * Traite un batch de messages
   */
  private async processBatch(
    messages: ScrapedMessage[],
    userId: number,
    options: Required<IngestionOptions>
  ): Promise<{
    successful: number;
    skipped: number;
    errors: string[];
  }> {
    const result = { successful: 0, skipped: 0, errors: [] as string[] };

    // Préparer les messages pour l'analyse batch
    const messagesForAnalysis = messages.map(msg => ({
      text: msg.text,
      tipAmount: msg.tipAmount,
      context: {
        messageLength: msg.text.length,
        responseTime: msg.responseTime,
      }
    }));

    // Analyse par batch
    const analyses = await analyzeBatch(messagesForAnalysis);

    // Traiter chaque résultat
    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      const analysis = analyses[i];

      if (!analysis) {
        result.errors.push(`Échec de l'analyse pour le message ${msg.id}`);
        continue;
      }

      try {
        await this.saveKnowledgeItem(msg, analysis, userId);
        result.successful++;
        console.log(`✅ Stratégie sauvegardée: "${analysis.title}" (${msg.tipAmount}$)`);
      } catch (error) {
        result.errors.push(`Erreur sauvegarde message ${msg.id}: ${error}`);
        console.error(`❌ Erreur sauvegarde:`, error);
      }
    }

    return result;
  }

  /**
   * Sauvegarde un item dans la base de connaissances
   */
  private async saveKnowledgeItem(
    message: ScrapedMessage,
    analysis: any,
    userId: number
  ): Promise<void> {
    // Générer l'embedding sur la stratégie (pas le texte original)
    const embeddingText = `Title: ${analysis.title}\nStrategy: ${analysis.playbook}\nTags: ${analysis.tags.join(', ')}`;
    
    const embedding = await getAzureEmbedding(embeddingText);
    const embeddingString = `[${embedding.join(',')}]`;
    const messageHash = this.hashMessage(message.text);
    const qualityScore = calculateQualityScore(
      message.tipAmount,
      message.text.length,
      analysis.difficulty
    );

    // Utiliser raw SQL pour éviter les problèmes avec Prisma et pgvector
    await this.prisma.$executeRaw`
      INSERT INTO "KnowledgeBaseItem" (
        id, 
        status, 
        "creatorId", 
        kind, 
        source, 
        niche, 
        platform, 
        language, 
        title, 
        "inputText", 
        "outputText", 
        payload, 
        score, 
        "revenueUsd", 
        embedding, 
        "createdAt", 
        "updatedAt"
      ) VALUES (
        ${`kbi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`},
        'ACTIVE',
        ${userId},
        'CHAT_CLOSER_PLAY',
        'SCRAPED_HISTORY',
        'lifestyle',
        'onlyfans',
        'en',
        ${analysis.title},
        ${message.text.substring(0, 500)}, // Input tronqué pour la recherche
        ${analysis.playbook},
        ${JSON.stringify({
          originalHash: messageHash,
          originalLength: message.text.length,
          tipAmount: message.tipAmount,
          tags: analysis.tags,
          psychologicalTriggers: analysis.psychologicalTriggers,
          difficulty: analysis.difficulty,
          fanId: message.fanId,
          responseTime: message.responseTime,
          ingestedAt: new Date().toISOString()
        })},
        ${qualityScore},
        ${message.tipAmount},
        ${embeddingString}::vector,
        NOW(),
        NOW()
      )
      ON CONFLICT DO NOTHING
    `;
  }

  /**
   * Récupère les hashes de messages déjà existants
   */
  private async getExistingMessageHashes(userId: number): Promise<Set<string>> {
    const results = await this.prisma.$queryRaw<Array<{ originalHash: string }>>`
      SELECT payload->>'originalHash' as "originalHash"
      FROM "KnowledgeBaseItem"
      WHERE "creatorId" = ${userId}
        AND source = 'SCRAPED_HISTORY'
        AND payload->>'originalHash' IS NOT NULL
    `;
    
    return new Set(results.map(r => r.originalHash));
  }

  /**
   * Nettoie les anciennes connaissances (garde seulement les meilleures)
   */
  private async cleanupOldKnowledge(userId: number): Promise<void> {
    // Archive les items avec un score faible ou anciens
    await this.prisma.$executeRaw`
      UPDATE "KnowledgeBaseItem"
      SET status = 'ARCHIVED'
      WHERE "creatorId" = ${userId}
        AND source = 'SCRAPED_HISTORY'
        AND status = 'ACTIVE'
        AND (
          score < 30 
          OR "createdAt" < NOW() - INTERVAL '90 days'
        )
    `;
  }

  /**
   * Génère un hash unique pour un message
   */
  private hashMessage(text: string): string {
    return crypto.createHash('sha256').update(text.trim().toLowerCase()).digest('hex').substring(0, 16);
  }

  /**
   * Pause utilitaire
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Statistiques sur les connaissances d'un utilisateur
   */
  async getKnowledgeStats(userId: number): Promise<{
    total: number;
    byDifficulty: Record<string, number>;
    averageTip: number;
    totalRevenue: number;
  }> {
    const stats = await this.prisma.$queryRaw<Array<{
      total: bigint;
      avgTip: number;
      totalRevenue: number;
    }>>`
      SELECT 
        COUNT(*) as total,
        AVG(payload->>'tipAmount'::decimal) as "avgTip",
        SUM(payload->>'tipAmount'::decimal) as "totalRevenue"
      FROM "KnowledgeBaseItem"
      WHERE "creatorId" = ${userId}
        AND source = 'SCRAPED_HISTORY'
        AND status = 'ACTIVE'
    `;

    const byDifficulty = await this.prisma.$queryRaw<Array<{ difficulty: string; count: bigint }>>`
      SELECT 
        payload->>'difficulty' as difficulty,
        COUNT(*) as count
      FROM "KnowledgeBaseItem"
      WHERE "creatorId" = ${userId}
        AND source = 'SCRAPED_HISTORY'
        AND status = 'ACTIVE'
      GROUP BY payload->>'difficulty'
    `;

    return {
      total: Number(stats[0]?.total || 0),
      averageTip: Number(stats[0]?.avgTip || 0),
      totalRevenue: Number(stats[0]?.totalRevenue || 0),
      byDifficulty: byDifficulty.reduce((acc, item) => {
        acc[item.difficulty || 'unknown'] = Number(item.count);
        return acc;
      }, {} as Record<string, number>),
    };
  }
}

// Export du singleton
export const knowledgeIngestor = new KnowledgeIngestor();
