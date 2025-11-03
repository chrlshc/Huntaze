import { revisionsRepository } from '@/lib/db/repositories/revisionsRepository';
import { contentItemsRepository } from '@/lib/db/repositories/contentItemsRepository';

export class RevisionService {
  // Auto-create revision when content is saved
  static async createAutoRevision(
    contentId: string,
    userId: string,
    changeType: 'edit' | 'save' | 'publish' | 'schedule' = 'edit'
  ): Promise<void> {
    try {
      // Get current content
      const content = await contentItemsRepository.getById(contentId);
      if (!content) {
        throw new Error('Content not found');
      }

      const currentSnapshot = {
        text: content.text,
        status: content.status,
        scheduledAt: content.scheduledAt,
        metadata: content.metadata,
      };

      // Check if we should create a revision
      const shouldCreate = await revisionsRepository.shouldCreateRevision(
        contentId,
        currentSnapshot
      );

      if (shouldCreate) {
        await revisionsRepository.createAutoRevision(
          contentId,
          userId,
          currentSnapshot,
          changeType
        );

        // Clean up old revisions to keep storage manageable
        await this.cleanupOldRevisions(contentId);
      }
    } catch (error) {
      console.error('Failed to create auto revision:', error);
      // Don't throw - revision creation shouldn't block the main operation
    }
  }

  // Create manual revision with custom description
  static async createManualRevision(
    contentId: string,
    userId: string,
    description: string
  ): Promise<void> {
    const content = await contentItemsRepository.getById(contentId);
    if (!content) {
      throw new Error('Content not found');
    }

    const snapshot = {
      text: content.text,
      status: content.status,
      scheduledAt: content.scheduledAt,
      metadata: content.metadata,
    };

    await revisionsRepository.create({
      contentId,
      userId,
      snapshot,
      description,
    });

    await this.cleanupOldRevisions(contentId);
  }

  // Restore content from a revision
  static async restoreFromRevision(
    revisionId: string,
    userId: string
  ): Promise<any> {
    const revision = await revisionsRepository.getById(revisionId);
    if (!revision) {
      throw new Error('Revision not found');
    }

    // Get current content to create backup
    const currentContent = await contentItemsRepository.getById(revision.contentId);
    if (!currentContent) {
      throw new Error('Content not found');
    }

    // Create backup of current state
    const backupSnapshot = {
      text: currentContent.text,
      status: currentContent.status,
      scheduledAt: currentContent.scheduledAt,
      metadata: currentContent.metadata,
    };

    await revisionsRepository.create({
      contentId: revision.contentId,
      userId,
      snapshot: backupSnapshot,
      description: 'Backup before restore',
    });

    // Restore from revision
    const restoredSnapshot = revision.snapshot;
    const updatedContent = await contentItemsRepository.update(revision.contentId, {
      text: restoredSnapshot.text || currentContent.text,
      status: restoredSnapshot.status || currentContent.status,
      scheduledAt: restoredSnapshot.scheduledAt || currentContent.scheduledAt,
      metadata: restoredSnapshot.metadata || currentContent.metadata,
    });

    // Create revision for the restore action
    await revisionsRepository.create({
      contentId: revision.contentId,
      userId,
      snapshot: {
        text: updatedContent.text,
        status: updatedContent.status,
        scheduledAt: updatedContent.scheduledAt,
        metadata: updatedContent.metadata,
      },
      description: `Restored from: ${revision.description}`,
    });

    return updatedContent;
  }

  // Clean up old revisions to keep storage manageable
  static async cleanupOldRevisions(contentId: string): Promise<void> {
    try {
      const revisionCount = await revisionsRepository.getRevisionCount(contentId);
      
      // Keep up to 50 revisions per content item
      if (revisionCount > 50) {
        await revisionsRepository.deleteOldRevisions(contentId, 50);
      }
    } catch (error) {
      console.error('Failed to cleanup old revisions:', error);
      // Don't throw - cleanup shouldn't block the main operation
    }
  }

  // Get revision statistics
  static async getRevisionStats(contentId: string): Promise<{
    totalRevisions: number;
    oldestRevision: Date | null;
    newestRevision: Date | null;
  }> {
    const revisions = await revisionsRepository.getByContentId(contentId, 1000);
    
    if (revisions.length === 0) {
      return {
        totalRevisions: 0,
        oldestRevision: null,
        newestRevision: null,
      };
    }

    const dates = revisions.map(r => r.createdAt);
    
    return {
      totalRevisions: revisions.length,
      oldestRevision: new Date(Math.min(...dates.map(d => d.getTime()))),
      newestRevision: new Date(Math.max(...dates.map(d => d.getTime()))),
    };
  }

  // Compare two revisions
  static async compareRevisions(
    revisionId1: string,
    revisionId2: string
  ): Promise<{
    revision1: any;
    revision2: any;
    differences: {
      textChanged: boolean;
      statusChanged: boolean;
      scheduleChanged: boolean;
      metadataChanged: boolean;
    };
  }> {
    const [revision1, revision2] = await Promise.all([
      revisionsRepository.getById(revisionId1),
      revisionsRepository.getById(revisionId2),
    ]);

    if (!revision1 || !revision2) {
      throw new Error('One or both revisions not found');
    }

    const snap1 = revision1.snapshot;
    const snap2 = revision2.snapshot;

    const differences = {
      textChanged: snap1.text !== snap2.text,
      statusChanged: snap1.status !== snap2.status,
      scheduleChanged: snap1.scheduledAt !== snap2.scheduledAt,
      metadataChanged: JSON.stringify(snap1.metadata) !== JSON.stringify(snap2.metadata),
    };

    return {
      revision1,
      revision2,
      differences,
    };
  }
}

export const revisionService = RevisionService;