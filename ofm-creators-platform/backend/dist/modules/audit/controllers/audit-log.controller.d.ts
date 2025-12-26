import { StreamableFile } from '@nestjs/common';
import { AuditLogService } from '../services/audit-log.service';
export declare class AuditLogController {
    private readonly auditLogService;
    constructor(auditLogService: AuditLogService);
    getLogs(query: {
        userId?: string;
        action?: string;
        resource?: string;
        startDate?: string;
        endDate?: string;
        limit?: string;
        offset?: string;
    }, req: any): Promise<{
        logs: any[];
        total: number;
    }>;
    exportLogs(query: {
        userId?: string;
        action?: string;
        resource?: string;
        startDate?: string;
        endDate?: string;
    }, req: any): Promise<StreamableFile>;
    getUserSummary(days: string | undefined, req: any): Promise<{
        actionCounts: Record<string, number>;
        lastActions: any[];
        riskScore: number;
    }>;
}
//# sourceMappingURL=audit-log.controller.d.ts.map