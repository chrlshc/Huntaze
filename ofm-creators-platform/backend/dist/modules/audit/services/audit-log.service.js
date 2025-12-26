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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditLogService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("@/infrastructure/database/prisma.service");
const logger_service_1 = require("@/core/logger/logger.service");
const crypto = __importStar(require("crypto"));
let AuditLogService = class AuditLogService {
    prisma;
    logger;
    constructor(prisma, logger) {
        this.prisma = prisma;
        this.logger = logger;
    }
    /**
     * Log an audit event
     */
    async log(entry) {
        try {
            // Generate unique ID
            const id = crypto.randomUUID();
            // Prepare entry
            const auditEntry = {
                id,
                userId: entry.userId,
                action: entry.action,
                resource: entry.resource,
                resourceId: entry.resourceId,
                details: entry.details ? JSON.stringify(entry.details) : null,
                ip: entry.ip,
                userAgent: entry.userAgent,
                timestamp: entry.timestamp || new Date(),
            };
            // Save to database
            await this.prisma.auditLog.create({
                data: auditEntry,
            });
            // Also log critical actions
            if (this.isCriticalAction(entry.action)) {
                this.logger.warn('Critical action performed', {
                    ...auditEntry,
                    details: entry.details, // Keep as object for structured logging
                });
            }
        }
        catch (error) {
            // Don't fail the main operation if audit logging fails
            this.logger.error('Failed to create audit log', error, { entry });
        }
    }
    /**
     * Query audit logs
     */
    async query(filter) {
        const where = {};
        if (filter.userId) {
            where.userId = filter.userId;
        }
        if (filter.action) {
            where.action = filter.action;
        }
        if (filter.resource) {
            where.resource = filter.resource;
        }
        if (filter.startDate || filter.endDate) {
            where.timestamp = {};
            if (filter.startDate) {
                where.timestamp.gte = filter.startDate;
            }
            if (filter.endDate) {
                where.timestamp.lte = filter.endDate;
            }
        }
        const [logs, total] = await Promise.all([
            this.prisma.auditLog.findMany({
                where,
                orderBy: { timestamp: 'desc' },
                take: filter.limit || 100,
                skip: filter.offset || 0,
            }),
            this.prisma.auditLog.count({ where }),
        ]);
        // Parse details JSON
        const parsedLogs = logs.map(log => ({
            ...log,
            details: log.details ? JSON.parse(log.details) : null,
        }));
        return { logs: parsedLogs, total };
    }
    /**
     * Export audit logs to CSV
     */
    async exportToCsv(filter) {
        const { logs } = await this.query({
            ...filter,
            limit: 10000, // Max export size
        });
        // CSV header
        const headers = [
            'Timestamp',
            'User ID',
            'Action',
            'Resource',
            'Resource ID',
            'IP Address',
            'User Agent',
            'Details',
        ];
        // Convert logs to CSV rows
        const rows = logs.map(log => [
            log.timestamp.toISOString(),
            log.userId,
            log.action,
            log.resource,
            log.resourceId || '',
            log.ip || '',
            log.userAgent || '',
            JSON.stringify(log.details || {}),
        ]);
        // Build CSV
        const csv = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')),
        ].join('\n');
        // Log the export action
        await this.log({
            userId: 'system',
            action: 'audit_log_export',
            resource: 'audit_log',
            details: {
                filter,
                rowCount: logs.length,
            },
        });
        return csv;
    }
    /**
     * Clean up old audit logs (retention policy)
     */
    async cleanup(retentionDays = 90) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
        const result = await this.prisma.auditLog.deleteMany({
            where: {
                timestamp: {
                    lt: cutoffDate,
                },
            },
        });
        this.logger.log(`Cleaned up ${result.count} audit log entries older than ${retentionDays} days`);
        return result.count;
    }
    /**
     * Get audit summary for a user
     */
    async getUserSummary(userId, days = 30) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        const logs = await this.prisma.auditLog.findMany({
            where: {
                userId,
                timestamp: { gte: startDate },
            },
            orderBy: { timestamp: 'desc' },
        });
        // Count actions
        const actionCounts = {};
        logs.forEach(log => {
            actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
        });
        // Get last 10 actions
        const lastActions = logs.slice(0, 10).map(log => ({
            ...log,
            details: log.details ? JSON.parse(log.details) : null,
        }));
        // Calculate risk score based on critical actions
        const riskScore = this.calculateRiskScore(actionCounts);
        return {
            actionCounts,
            lastActions,
            riskScore,
        };
    }
    /**
     * Check if an action is critical
     */
    isCriticalAction(action) {
        const criticalActions = [
            'user_delete',
            'payment_refund',
            'admin_access',
            'data_export',
            'permission_change',
            'password_reset',
            'two_factor_disable',
            'api_key_create',
            'webhook_update',
            'dmca_takedown',
        ];
        return criticalActions.includes(action);
    }
    /**
     * Calculate risk score based on actions
     */
    calculateRiskScore(actionCounts) {
        let score = 0;
        const riskWeights = {
            'login_failed': 5,
            'permission_denied': 10,
            'data_export': 20,
            'user_delete': 30,
            'payment_failed': 15,
            'two_factor_disable': 25,
        };
        Object.entries(actionCounts).forEach(([action, count]) => {
            const weight = riskWeights[action] || 1;
            score += weight * count;
        });
        // Normalize to 0-100
        return Math.min(100, Math.round(score / 10));
    }
};
exports.AuditLogService = AuditLogService;
exports.AuditLogService = AuditLogService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object, logger_service_1.LoggerService])
], AuditLogService);
//# sourceMappingURL=audit-log.service.js.map