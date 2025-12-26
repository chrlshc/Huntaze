import { PrismaService } from '@/infrastructure/database/prisma.service';
import { LoggerService } from '@/core/logger/logger.service';
export interface AuditLogEntry {
    userId: string;
    action: string;
    resource: string;
    resourceId?: string;
    details?: any;
    ip?: string;
    userAgent?: string;
    timestamp?: Date;
}
export interface AuditLogFilter {
    userId?: string;
    action?: string;
    resource?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
}
export declare class AuditLogService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService, logger: LoggerService);
    /**
     * Log an audit event
     */
    log(entry: AuditLogEntry): Promise<void>;
    /**
     * Query audit logs
     */
    query(filter: AuditLogFilter): Promise<{
        logs: any[];
        total: number;
    }>;
    /**
     * Export audit logs to CSV
     */
    exportToCsv(filter: AuditLogFilter): Promise<string>;
    /**
     * Clean up old audit logs (retention policy)
     */
    cleanup(retentionDays?: number): Promise<number>;
    /**
     * Get audit summary for a user
     */
    getUserSummary(userId: string, days?: number): Promise<{
        actionCounts: Record<string, number>;
        lastActions: any[];
        riskScore: number;
    }>;
    /**
     * Check if an action is critical
     */
    private isCriticalAction;
    /**
     * Calculate risk score based on actions
     */
    private calculateRiskScore;
}
//# sourceMappingURL=audit-log.service.d.ts.map