import { PrismaClient } from '@prisma/client';

/**
 * Segmentation Service (Stub)
 * Full implementation will be done in Task 4
 */
export class SegmentationService {
  constructor(private prisma: PrismaClient) {}

  async addUserToSegment(userId: string, segmentId: string) {
    // TODO: Implement in Task 4
    console.log(`Adding user ${userId} to segment ${segmentId}`);
  }

  async removeUserFromSegment(userId: string, segmentId: string) {
    // TODO: Implement in Task 4
    console.log(`Removing user ${userId} from segment ${segmentId}`);
  }
}

// Singleton
let segmentationService: SegmentationService | null = null;

export function getSegmentationService(): SegmentationService {
  if (!segmentationService) {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    segmentationService = new SegmentationService(prisma);
  }
  return segmentationService;
}
