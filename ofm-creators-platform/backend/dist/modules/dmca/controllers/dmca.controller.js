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
exports.DmcaController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("@/core/guards/jwt-auth.guard");
const roles_guard_1 = require("@/core/guards/roles.guard");
const roles_decorator_1 = require("@/core/decorators/roles.decorator");
const dmca_service_1 = require("../services/dmca.service");
const stream_1 = require("stream");
let DmcaController = class DmcaController {
    dmcaService;
    constructor(dmcaService) {
        this.dmcaService = dmcaService;
    }
    async createTakedown(request, req) {
        const takedownId = await this.dmcaService.createTakedownRequest(req.user.id, request);
        return {
            success: true,
            takedownId,
            message: 'DMCA takedown request submitted successfully',
        };
    }
    async getUserTakedowns(status, req) {
        const takedowns = await this.dmcaService.getUserTakedowns(req.user.id, status);
        return {
            takedowns,
            total: takedowns.length,
        };
    }
    async getTakedownDetails(id, req) {
        const takedown = await this.dmcaService.getUserTakedowns(req.user.id);
        const details = takedown.find(t => t.id === id);
        if (!details) {
            throw new Error('Takedown request not found');
        }
        return details;
    }
    async downloadNotice(id, req) {
        const takedown = await this.dmcaService.getUserTakedowns(req.user.id);
        const details = takedown.find(t => t.id === id);
        if (!details) {
            throw new Error('Takedown request not found');
        }
        const notice = this.dmcaService.generateDmcaNotice(details);
        const stream = stream_1.Readable.from([notice]);
        return new common_1.StreamableFile(stream);
    }
    async updateTakedown(id, update, req) {
        await this.dmcaService.updateTakedownStatus(req.user.id, id, update);
        return {
            success: true,
            message: 'Takedown status updated',
        };
    }
    async getStats(req) {
        const stats = await this.dmcaService.getDmcaStats(req.user.id);
        return stats;
    }
    async getGlobalStats() {
        const stats = await this.dmcaService.getDmcaStats();
        return stats;
    }
    getRunbook(type) {
        const runbook = this.dmcaService.getIncidentRunbook(type);
        return {
            type,
            runbook,
            lastUpdated: '2024-01-01',
        };
    }
    async checkContentMatch(body, req) {
        const isMatch = await this.dmcaService.checkContentMatch(body.contentHash, req.user.id);
        return {
            isMatch,
            message: isMatch
                ? 'This content matches your original work'
                : 'No matching content found',
        };
    }
};
exports.DmcaController = DmcaController;
__decorate([
    (0, common_1.Post)('takedown'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], DmcaController.prototype, "createTakedown", null);
__decorate([
    (0, common_1.Get)('takedowns'),
    __param(0, (0, common_1.Query)('status')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], DmcaController.prototype, "getUserTakedowns", null);
__decorate([
    (0, common_1.Get)('takedowns/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], DmcaController.prototype, "getTakedownDetails", null);
__decorate([
    (0, common_1.Get)('takedowns/:id/notice'),
    (0, common_1.Header)('Content-Type', 'text/plain'),
    (0, common_1.Header)('Content-Disposition', 'attachment; filename="dmca-notice.txt"'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], DmcaController.prototype, "downloadNotice", null);
__decorate([
    (0, common_1.Put)('takedowns/:id'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin', 'staff'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], DmcaController.prototype, "updateTakedown", null);
__decorate([
    (0, common_1.Get)('stats'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DmcaController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)('stats/global'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin', 'staff'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DmcaController.prototype, "getGlobalStats", null);
__decorate([
    (0, common_1.Get)('runbook/:type'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin', 'staff'),
    __param(0, (0, common_1.Param)('type')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], DmcaController.prototype, "getRunbook", null);
__decorate([
    (0, common_1.Post)('check-match'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], DmcaController.prototype, "checkContentMatch", null);
exports.DmcaController = DmcaController = __decorate([
    (0, common_1.Controller)('dmca'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [dmca_service_1.DmcaService])
], DmcaController);
//# sourceMappingURL=dmca.controller.js.map