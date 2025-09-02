import { PrismaService } from '@infrastructure/prisma/prisma.service';
export declare class AttributionWorker {
    private prisma;
    private readonly logger;
    private readonly attributionWindows;
    constructor(prisma: PrismaService);
    processAttributions(): Promise<void>;
    private attributeOrder;
    private updateFanSegments;
    private updateCreatorSegments;
    cleanupOldData(): Promise<void>;
}
//# sourceMappingURL=attribution.worker.d.ts.map