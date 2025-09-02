"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var IndexedBackupService_1;
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.IndexedBackupService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma/prisma.service");
const crypto = __importStar(require("crypto"));
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
let IndexedBackupService = IndexedBackupService_1 = class IndexedBackupService {
    prisma;
    logger = new common_1.Logger(IndexedBackupService_1.name);
    indexDir = '/var/backup-indexes';
    constructor(prisma) {
        this.prisma = prisma;
        this.ensureIndexDirectory();
    }
    async ensureIndexDirectory() {
        try {
            await fs.mkdir(this.indexDir, { recursive: true });
        }
        catch (error) {
            this.logger.error('Failed to create index directory', error);
        }
    }
    async createBackupWithIndex(backupId) {
        this.logger.log(`Creating indexed backup: ${backupId}`);
        const startTime = Date.now();
        const index = {
            backupId,
            timestamp: new Date(),
            tables: [],
            metadata: {
                totalSize: 0,
                recordCount: 0,
                checksum: '',
            },
        };
        // Get all tables to backup
        const tables = await this.getTableList();
        for (const table of tables) {
            const tableIndex = await this.indexTable(table, backupId);
            index.tables.push(tableIndex);
            index.metadata.totalSize += tableIndex.sizeBytes;
            index.metadata.recordCount += tableIndex.recordCount;
        }
        // Calculate overall checksum
        index.metadata.checksum = this.calculateIndexChecksum(index);
        // Save index
        await this.saveIndex(index);
        const duration = Date.now() - startTime;
        this.logger.log(`Indexed backup created in ${duration}ms`);
        return index;
    }
    async indexTable(tableName, backupId) {
        const chunkSize = 10000; // Records per chunk
        const tableIndex = {
            tableName,
            recordCount: 0,
            sizeBytes: 0,
            checksum: '',
            chunks: [],
        };
        // Get total count
        const totalCount = await this.prisma[tableName].count();
        tableIndex.recordCount = totalCount;
        // Create chunks for efficient partial restore
        const chunks = Math.ceil(totalCount / chunkSize);
        for (let i = 0; i < chunks; i++) {
            const skip = i * chunkSize;
            const take = Math.min(chunkSize, totalCount - skip);
            // Get chunk data
            const chunkData = await this.prisma[tableName].findMany({
                skip,
                take,
                orderBy: { id: 'asc' },
            });
            if (chunkData.length > 0) {
                const chunk = {
                    chunkId: `${tableName}_${i}`,
                    startOffset: skip,
                    endOffset: skip + chunkData.length - 1,
                    recordCount: chunkData.length,
                    firstRecord: this.extractKeyInfo(chunkData[0]),
                    lastRecord: this.extractKeyInfo(chunkData[chunkData.length - 1]),
                };
                tableIndex.chunks.push(chunk);
                // Calculate size (approximate)
                const chunkJson = JSON.stringify(chunkData);
                tableIndex.sizeBytes += Buffer.byteLength(chunkJson);
            }
        }
        // Extract date range if applicable
        if (await this.hasDateField(tableName)) {
            const dateRange = await this.getDateRange(tableName);
            tableIndex.dateRange = dateRange;
        }
        // Calculate table checksum
        tableIndex.checksum = crypto
            .createHash('sha256')
            .update(JSON.stringify(tableIndex.chunks))
            .digest('hex');
        return tableIndex;
    }
    async restoreSelectiveTables(backupId, tableNames, options) {
        this.logger.log(`Selective restore from backup: ${backupId}`);
        // Load index
        const index = await this.loadIndex(backupId);
        if (!index) {
            throw new Error(`Index not found for backup: ${backupId}`);
        }
        const results = {
            tablesRestored: [],
            recordsRestored: 0,
            errors: [],
        };
        for (const tableName of tableNames) {
            const tableIndex = index.tables.find(t => t.tableName === tableName);
            if (!tableIndex) {
                results.errors.push(`Table ${tableName} not found in backup`);
                continue;
            }
            try {
                // Determine which chunks to restore
                const chunksToRestore = this.selectChunks(tableIndex, options);
                for (const chunk of chunksToRestore) {
                    await this.restoreChunk(backupId, tableName, chunk);
                    results.recordsRestored += chunk.recordCount;
                }
                results.tablesRestored.push(tableName);
            }
            catch (error) {
                results.errors.push(`Failed to restore ${tableName}: ${error.message}`);
            }
        }
        return results;
    }
    selectChunks(tableIndex, options) {
        let chunks = [...tableIndex.chunks];
        // Filter by date range if applicable
        if (options?.dateFrom || options?.dateTo) {
            // This would need actual implementation based on chunk metadata
            chunks = chunks.filter(chunk => {
                // Check if chunk contains records in date range
                return true; // Placeholder
            });
        }
        // Apply skip/limit
        if (options?.skipRecords) {
            const skipChunks = Math.floor(options.skipRecords / 10000);
            chunks = chunks.slice(skipChunks);
        }
        if (options?.maxRecords) {
            let recordCount = 0;
            chunks = chunks.filter(chunk => {
                if (recordCount >= options.maxRecords)
                    return false;
                recordCount += chunk.recordCount;
                return true;
            });
        }
        return chunks;
    }
    async searchInBackup(backupId, searchCriteria) {
        const index = await this.loadIndex(backupId);
        if (!index) {
            throw new Error(`Index not found for backup: ${backupId}`);
        }
        const tableIndex = index.tables.find(t => t.tableName === searchCriteria.table);
        if (!tableIndex) {
            throw new Error(`Table ${searchCriteria.table} not found in backup`);
        }
        const results = [];
        // Search through chunks
        for (const chunk of tableIndex.chunks) {
            // Load chunk data
            const chunkData = await this.loadChunk(backupId, searchCriteria.table, chunk.chunkId);
            // Search in chunk
            const matches = chunkData.filter(record => record[searchCriteria.field] === searchCriteria.value);
            results.push(...matches);
        }
        return results;
    }
    async getTableList() {
        // Get all Prisma model names
        const models = Object.keys(this.prisma).filter(key => !key.startsWith('_') && !key.startsWith('$'));
        return models;
    }
    extractKeyInfo(record) {
        // Extract only key fields for index
        return {
            id: record.id,
            createdAt: record.createdAt,
            updatedAt: record.updatedAt,
        };
    }
    async hasDateField(tableName) {
        // Check if table has date fields
        try {
            const sample = await this.prisma[tableName].findFirst();
            return sample && ('createdAt' in sample || 'timestamp' in sample);
        }
        catch {
            return false;
        }
    }
    async getDateRange(tableName) {
        const oldest = await this.prisma[tableName].findFirst({
            orderBy: { createdAt: 'asc' },
        });
        const newest = await this.prisma[tableName].findFirst({
            orderBy: { createdAt: 'desc' },
        });
        return {
            min: oldest?.createdAt || new Date(),
            max: newest?.createdAt || new Date(),
        };
    }
    calculateIndexChecksum(index) {
        const content = JSON.stringify({
            tables: index.tables.map(t => ({
                name: t.tableName,
                checksum: t.checksum,
                count: t.recordCount,
            })),
        });
        return crypto.createHash('sha256').update(content).digest('hex');
    }
    async saveIndex(index) {
        const indexPath = path.join(this.indexDir, `${index.backupId}.json`);
        await fs.writeFile(indexPath, JSON.stringify(index, null, 2));
        // Also save to database for quick queries
        await this.prisma.backupIndex.create({
            data: {
                backupId: index.backupId,
                timestamp: index.timestamp,
                metadata: index.metadata,
                tables: index.tables,
            },
        });
    }
    async loadIndex(backupId) {
        try {
            // Try database first
            const dbIndex = await this.prisma.backupIndex.findUnique({
                where: { backupId },
            });
            if (dbIndex) {
                return {
                    backupId: dbIndex.backupId,
                    timestamp: dbIndex.timestamp,
                    tables: dbIndex.tables,
                    metadata: dbIndex.metadata,
                };
            }
            // Fallback to file
            const indexPath = path.join(this.indexDir, `${backupId}.json`);
            const content = await fs.readFile(indexPath, 'utf-8');
            return JSON.parse(content);
        }
        catch {
            return null;
        }
    }
    async loadChunk(backupId, tableName, chunkId) {
        // Would load actual chunk data from backup storage
        // This is a placeholder
        return [];
    }
    async restoreChunk(backupId, tableName, chunk) {
        // Would restore actual chunk data
        this.logger.log(`Restoring chunk ${chunk.chunkId} for table ${tableName}`);
    }
    async getBackupIndexes(options) {
        const where = {};
        if (options?.startDate || options?.endDate) {
            where.timestamp = {};
            if (options.startDate)
                where.timestamp.gte = options.startDate;
            if (options.endDate)
                where.timestamp.lte = options.endDate;
        }
        const indexes = await this.prisma.backupIndex.findMany({
            where,
            take: options?.limit,
            orderBy: { timestamp: 'desc' },
        });
        return indexes.map(idx => ({
            backupId: idx.backupId,
            timestamp: idx.timestamp,
            tables: idx.tables,
            metadata: idx.metadata,
        }));
    }
};
exports.IndexedBackupService = IndexedBackupService;
exports.IndexedBackupService = IndexedBackupService = IndexedBackupService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object])
], IndexedBackupService);
//# sourceMappingURL=indexed-backup.service.js.map