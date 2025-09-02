import { PrismaService } from '../../../prisma/prisma.service';
interface BackupIndex {
    backupId: string;
    timestamp: Date;
    tables: TableIndex[];
    metadata: {
        totalSize: number;
        recordCount: number;
        checksum: string;
    };
}
interface TableIndex {
    tableName: string;
    recordCount: number;
    sizeBytes: number;
    checksum: string;
    dateRange?: {
        min: Date;
        max: Date;
    };
    chunks: ChunkIndex[];
}
interface ChunkIndex {
    chunkId: string;
    startOffset: number;
    endOffset: number;
    recordCount: number;
    firstRecord?: any;
    lastRecord?: any;
}
export declare class IndexedBackupService {
    private prisma;
    private readonly logger;
    private readonly indexDir;
    constructor(prisma: PrismaService);
    private ensureIndexDirectory;
    createBackupWithIndex(backupId: string): Promise<BackupIndex>;
    private indexTable;
    restoreSelectiveTables(backupId: string, tableNames: string[], options?: {
        dateFrom?: Date;
        dateTo?: Date;
        skipRecords?: number;
        maxRecords?: number;
    }): Promise<any>;
    private selectChunks;
    searchInBackup(backupId: string, searchCriteria: {
        table: string;
        field: string;
        value: any;
    }): Promise<any[]>;
    private getTableList;
    private extractKeyInfo;
    private hasDateField;
    private getDateRange;
    private calculateIndexChecksum;
    private saveIndex;
    private loadIndex;
    private loadChunk;
    private restoreChunk;
    getBackupIndexes(options?: {
        startDate?: Date;
        endDate?: Date;
        limit?: number;
    }): Promise<BackupIndex[]>;
}
export {};
//# sourceMappingURL=indexed-backup.service.d.ts.map