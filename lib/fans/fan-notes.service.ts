/**
 * Fan Notes Service
 * 
 * Gère les notes sur les fans pour l'IA et les créateurs.
 * Permet de stocker les préférences, intérêts et infos importantes
 * que l'IA peut utiliser pour personnaliser les réponses.
 */

import { prisma } from '@/lib/prisma';

// Types
export type NoteCategory = 
  | 'preferences'      // Ce que le fan aime (type de contenu, style)
  | 'interests'        // Centres d'intérêt (hobbies, sujets)
  | 'personal'         // Infos personnelles (anniversaire, métier)
  | 'purchase_behavior'// Comportement d'achat (budget, fréquence)
  | 'communication_style' // Style de communication préféré
  | 'emotional_state'  // État émotionnel et besoins (lonely, stressed, excited)
  | 'important';       // Notes importantes à ne pas oublier

export type NoteSource = 'manual' | 'ai';

export interface FanNote {
  id: string;
  creatorId: number;
  fanId: string;
  fanUsername?: string | null;
  category: NoteCategory;
  content: string;
  source: NoteSource;
  confidence?: number | null;
  metadata?: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateNoteInput {
  creatorId: number;
  fanId: string;
  fanUsername?: string;
  category: NoteCategory;
  content: string;
  source?: NoteSource;
  confidence?: number;
  metadata?: Record<string, unknown>;
}

export interface UpdateNoteInput {
  category?: NoteCategory;
  content?: string;
  confidence?: number;
  metadata?: Record<string, unknown>;
}

export interface FanNotesFilter {
  creatorId: number;
  fanId: string;
  category?: NoteCategory;
  source?: NoteSource;
}

export interface FanProfile {
  id: string;
  creatorId: number;
  fanId: string;
  fanUsername?: string | null;
  fanDisplayName?: string | null;
  totalSpent: number;
  avgOrderValue: number;
  purchaseCount: number;
  messageCount: number;
  lastMessageAt?: Date | null;
  subscribedAt?: Date | null;
  status: 'vip' | 'active' | 'at-risk' | 'churned';
  aiSummary?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Service de gestion des notes sur les fans
 */
export class FanNotesService {
  
  // ============================================
  // CRUD Notes
  // ============================================

  /**
   * Créer une nouvelle note sur un fan
   */
  async createNote(input: CreateNoteInput): Promise<FanNote> {
    const note = await prisma.fanNote.create({
      data: {
        creatorId: input.creatorId,
        fanId: input.fanId,
        fanUsername: input.fanUsername,
        category: input.category,
        content: input.content,
        source: input.source || 'manual',
        confidence: input.confidence ?? 1.0,
        metadata: input.metadata || null,
      },
    });

    return this.mapNote(note);
  }

  /**
   * Récupérer toutes les notes d'un fan
   */
  async getNotes(filter: FanNotesFilter): Promise<FanNote[]> {
    const where: Record<string, unknown> = {
      creatorId: filter.creatorId,
      fanId: filter.fanId,
    };

    if (filter.category) {
      where.category = filter.category;
    }
    if (filter.source) {
      where.source = filter.source;
    }

    const notes = await prisma.fanNote.findMany({
      where,
      orderBy: [
        { category: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    return notes.map(this.mapNote);
  }

  /**
   * Récupérer les notes groupées par catégorie
   */
  async getNotesByCategory(
    creatorId: number,
    fanId: string
  ): Promise<Record<NoteCategory, FanNote[]>> {
    const notes = await this.getNotes({ creatorId, fanId });
    
    const grouped: Record<NoteCategory, FanNote[]> = {
      preferences: [],
      interests: [],
      personal: [],
      purchase_behavior: [],
      communication_style: [],
      important: [],
    };

    for (const note of notes) {
      grouped[note.category].push(note);
    }

    return grouped;
  }

  /**
   * Mettre à jour une note
   */
  async updateNote(noteId: string, input: UpdateNoteInput): Promise<FanNote> {
    const note = await prisma.fanNote.update({
      where: { id: noteId },
      data: {
        ...(input.category && { category: input.category }),
        ...(input.content && { content: input.content }),
        ...(input.confidence !== undefined && { confidence: input.confidence }),
        ...(input.metadata && { metadata: input.metadata }),
      },
    });

    return this.mapNote(note);
  }

  /**
   * Supprimer une note
   */
  async deleteNote(noteId: string): Promise<void> {
    await prisma.fanNote.delete({
      where: { id: noteId },
    });
  }

  /**
   * Supprimer toutes les notes d'un fan (GDPR)
   */
  async deleteAllNotesForFan(creatorId: number, fanId: string): Promise<number> {
    const result = await prisma.fanNote.deleteMany({
      where: { creatorId, fanId },
    });
    return result.count;
  }

  // ============================================
  // Profil Fan
  // ============================================

  /**
   * Récupérer ou créer le profil d'un fan
   */
  async getOrCreateProfile(
    creatorId: number,
    fanId: string,
    fanUsername?: string,
    fanDisplayName?: string
  ): Promise<FanProfile> {
    let profile = await prisma.fanProfile.findUnique({
      where: {
        creatorId_fanId: { creatorId, fanId },
      },
    });

    if (!profile) {
      profile = await prisma.fanProfile.create({
        data: {
          creatorId,
          fanId,
          fanUsername,
          fanDisplayName,
        },
      });
    }

    return this.mapProfile(profile);
  }

  /**
   * Mettre à jour les métriques d'un profil fan
   */
  async updateProfileMetrics(
    creatorId: number,
    fanId: string,
    metrics: Partial<{
      totalSpent: number;
      avgOrderValue: number;
      purchaseCount: number;
      messageCount: number;
      lastMessageAt: Date;
      status: string;
    }>
  ): Promise<FanProfile> {
    const profile = await prisma.fanProfile.upsert({
      where: {
        creatorId_fanId: { creatorId, fanId },
      },
      update: metrics,
      create: {
        creatorId,
        fanId,
        ...metrics,
      },
    });

    return this.mapProfile(profile);
  }

  // ============================================
  // Contexte pour l'IA
  // ============================================

  /**
   * Récupérer le contexte complet d'un fan pour l'IA
   * Inclut le profil + toutes les notes formatées
   */
  async getFanContextForAI(
    creatorId: number,
    fanId: string
  ): Promise<{
    profile: FanProfile | null;
    notes: Record<NoteCategory, FanNote[]>;
    summary: string;
  }> {
    const [profile, notesByCategory] = await Promise.all([
      prisma.fanProfile.findUnique({
        where: { creatorId_fanId: { creatorId, fanId } },
      }),
      this.getNotesByCategory(creatorId, fanId),
    ]);

    // Générer un résumé textuel pour le prompt IA
    const summary = this.generateAISummary(
      profile ? this.mapProfile(profile) : null,
      notesByCategory
    );

    return {
      profile: profile ? this.mapProfile(profile) : null,
      notes: notesByCategory,
      summary,
    };
  }

  /**
   * Générer un résumé textuel des notes pour l'IA
   */
  private generateAISummary(
    profile: FanProfile | null,
    notes: Record<NoteCategory, FanNote[]>
  ): string {
    const parts: string[] = [];

    if (profile) {
      parts.push(`Fan: ${profile.fanDisplayName || profile.fanUsername || profile.fanId}`);
      parts.push(`Status: ${profile.status}`);
      if (profile.totalSpent > 0) {
        parts.push(`Total spent: $${profile.totalSpent.toFixed(2)}`);
      }
      if (profile.aiSummary) {
        parts.push(`Summary: ${profile.aiSummary}`);
      }
    }

    const categoryLabels: Record<NoteCategory, string> = {
      preferences: 'Preferences',
      interests: 'Interests',
      personal: 'Personal info',
      purchase_behavior: 'Purchase behavior',
      communication_style: 'Communication style',
      important: 'Important',
    };

    for (const [category, categoryNotes] of Object.entries(notes)) {
      if (categoryNotes.length > 0) {
        const label = categoryLabels[category as NoteCategory];
        const noteTexts = categoryNotes.map(n => `- ${n.content}`).join('\n');
        parts.push(`\n${label}:\n${noteTexts}`);
      }
    }

    return parts.join('\n');
  }

  // ============================================
  // Notes IA automatiques
  // ============================================

  /**
   * Ajouter une note détectée par l'IA
   */
  async addAINote(
    creatorId: number,
    fanId: string,
    category: NoteCategory,
    content: string,
    confidence: number,
    metadata?: Record<string, unknown>
  ): Promise<FanNote> {
    // Vérifier si une note similaire existe déjà
    const existingNotes = await prisma.fanNote.findMany({
      where: {
        creatorId,
        fanId,
        category,
        source: 'ai',
      },
    });

    // Éviter les doublons (même contenu)
    const isDuplicate = existingNotes.some(
      n => n.content.toLowerCase() === content.toLowerCase()
    );

    if (isDuplicate) {
      // Retourner la note existante
      const existing = existingNotes.find(
        n => n.content.toLowerCase() === content.toLowerCase()
      );
      return this.mapNote(existing!);
    }

    return this.createNote({
      creatorId,
      fanId,
      category,
      content,
      source: 'ai',
      confidence,
      metadata,
    });
  }

  // ============================================
  // Helpers
  // ============================================

  private mapNote(note: {
    id: string;
    creatorId: number;
    fanId: string;
    fanUsername: string | null;
    category: string;
    content: string;
    source: string;
    confidence: number | null;
    metadata: unknown;
    createdAt: Date;
    updatedAt: Date;
  }): FanNote {
    return {
      id: note.id,
      creatorId: note.creatorId,
      fanId: note.fanId,
      fanUsername: note.fanUsername,
      category: note.category as NoteCategory,
      content: note.content,
      source: note.source as NoteSource,
      confidence: note.confidence,
      metadata: note.metadata as Record<string, unknown> | null,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
    };
  }

  private mapProfile(profile: {
    id: string;
    creatorId: number;
    fanId: string;
    fanUsername: string | null;
    fanDisplayName: string | null;
    totalSpent: number;
    avgOrderValue: number;
    purchaseCount: number;
    messageCount: number;
    lastMessageAt: Date | null;
    subscribedAt: Date | null;
    status: string;
    aiSummary: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): FanProfile {
    return {
      id: profile.id,
      creatorId: profile.creatorId,
      fanId: profile.fanId,
      fanUsername: profile.fanUsername,
      fanDisplayName: profile.fanDisplayName,
      totalSpent: profile.totalSpent,
      avgOrderValue: profile.avgOrderValue,
      purchaseCount: profile.purchaseCount,
      messageCount: profile.messageCount,
      lastMessageAt: profile.lastMessageAt,
      subscribedAt: profile.subscribedAt,
      status: profile.status as 'vip' | 'active' | 'at-risk' | 'churned',
      aiSummary: profile.aiSummary,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };
  }
}

// Export singleton
export const fanNotesService = new FanNotesService();
