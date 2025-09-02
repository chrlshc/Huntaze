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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExportController = void 0;
const common_1 = require("@nestjs/common");
const express_1 = require("express");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("@modules/auth/guards/jwt-auth.guard");
const roles_guard_1 = require("@modules/auth/guards/roles.guard");
const roles_decorator_1 = require("@modules/auth/decorators/roles.decorator");
const export_service_1 = require("./export.service");
let ExportController = class ExportController {
    exportService;
    constructor(exportService) {
        this.exportService = exportService;
    }
    async exportData(req, res, view, format, range) {
        // Validate parameters
        if (!['overview', 'campaigns', 'social', 'crm'].includes(view)) {
            throw new common_1.BadRequestException('Invalid view parameter');
        }
        if (!['csv', 'json', 'pdf'].includes(format)) {
            throw new common_1.BadRequestException('Invalid format parameter');
        }
        const creatorId = req.user.creatorId || req.user.id;
        try {
            const buffer = await this.exportService.exportData(creatorId, view, format, range || '7d');
            // Set appropriate headers
            const filename = `huntaze-${view}-${range || '7d'}-${new Date().toISOString().split('T')[0]}.${format}`;
            const contentType = this.getContentType(format);
            res.setHeader('Content-Type', contentType);
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            res.setHeader('Content-Length', buffer.length);
            res.send(buffer);
        }
        catch (error) {
            throw new common_1.BadRequestException(`Export failed: ${error.message}`);
        }
    }
    getContentType(format) {
        const contentTypes = {
            csv: 'text/csv',
            json: 'application/json',
            pdf: 'application/pdf',
        };
        return contentTypes[format];
    }
};
exports.ExportController = ExportController;
__decorate([
    (0, common_1.Get)(':view.:format'),
    (0, swagger_1.ApiOperation)({ summary: 'Export analytics data in various formats' }),
    (0, swagger_1.ApiParam)({
        name: 'view',
        enum: ['overview', 'campaigns', 'social', 'crm'],
        description: 'The analytics view to export',
    }),
    (0, swagger_1.ApiParam)({
        name: 'format',
        enum: ['csv', 'json', 'pdf'],
        description: 'The export format',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'range',
        enum: ['7d', '28d'],
        required: false,
        description: 'Date range for the export',
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Export generated successfully',
    }),
    (0, roles_decorator_1.Roles)('creator', 'admin'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Res)()),
    __param(2, (0, common_1.Param)('view')),
    __param(3, (0, common_1.Param)('format')),
    __param(4, (0, common_1.Query)('range')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, typeof (_a = typeof express_1.Response !== "undefined" && express_1.Response) === "function" ? _a : Object, String, String, String]),
    __metadata("design:returntype", Promise)
], ExportController.prototype, "exportData", null);
exports.ExportController = ExportController = __decorate([
    (0, swagger_1.ApiTags)('Export'),
    (0, common_1.Controller)('export'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [export_service_1.ExportService])
], ExportController);
//# sourceMappingURL=export.controller.js.map