"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditLogController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("@/core/guards/jwt-auth.guard");
const roles_decorator_1 = require("@/core/decorators/roles.decorator");
const roles_guard_1 = require("@/core/guards/roles.guard");
const audit_log_service_1 = require("../services/audit-log.service");
const stream_1 = require("stream");
let AuditLogController = class AuditLogController {
    auditLogService;
    constructor(auditLogService) {
        this.auditLogService = auditLogService;
    }
    async getLogs(query, req) {
        // Build filter
        const filter = {
            userId: query.userId,
            action: query.action,
            resource: query.resource,
            startDate: query.startDate ? new Date(query.startDate) : undefined,
            endDate: query.endDate ? new Date(query.endDate) : undefined,
            limit: query.limit ? parseInt(query.limit, 10) : 100,
            offset: query.offset ? parseInt(query.offset, 10) : 0,
        };
        // Non-admin staff can only see their own logs
        if (req.user.role === 'staff' && filter.userId !== req.user.id) {
            filter.userId = req.user.id;
        }
        // Log the audit log access
        await this.auditLogService.log({
            userId: req.user.id,
            action: 'audit_log_view',
            resource: 'audit_log',
            details: { filter },
            ip: req.ip,
            userAgent: req.headers['user-agent'],
        });
        return this.auditLogService.query(filter);
    }
    async exportLogs(query, req) {
        // Build filter
        const filter = {
            userId: query.userId,
            action: query.action,
            resource: query.resource,
            startDate: query.startDate ? new Date(query.startDate) : undefined,
            endDate: query.endDate ? new Date(query.endDate) : undefined,
        };
        // Generate CSV
        const csv = await this.auditLogService.exportToCsv(filter);
        // Log the export
        await this.auditLogService.log({
            userId: req.user.id,
            action: 'audit_log_export',
            resource: 'audit_log',
            details: { filter },
            ip: req.ip,
            userAgent: req.headers['user-agent'],
        });
        // Return as stream
        const stream = stream_1.Readable.from([csv]);
        return new common_1.StreamableFile(stream);
    }
    async getUserSummary(days = '30', req) {
        const userId = req.params.userId;
        // Staff can only see their own summary
        if (req.user.role === 'staff' && userId !== req.user.id) {
            throw new common_1.ForbiddenException();
        }
        return this.auditLogService.getUserSummary(userId, parseInt(days, 10));
    }
};
exports.AuditLogController = AuditLogController;
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)('admin', 'staff'),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuditLogController.prototype, "getLogs", null);
__decorate([
    (0, common_1.Get)('export'),
    (0, roles_decorator_1.Roles)('admin'),
    (0, common_1.Header)('Content-Type', 'text/csv'),
    (0, common_1.Header)('Content-Disposition', 'attachment; filename="audit-logs.csv"'),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuditLogController.prototype, "exportLogs", null);
__decorate([
    (0, common_1.Get)('summary/:userId'),
    (0, roles_decorator_1.Roles)('admin', 'staff'),
    __param(0, (0, common_1.Query)('days')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AuditLogController.prototype, "getUserSummary", null);
exports.AuditLogController = AuditLogController = __decorate([
    (0, common_1.Controller)('audit-logs'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [audit_log_service_1.AuditLogService])
], AuditLogController);
//# sourceMappingURL=audit-log.controller.js.map