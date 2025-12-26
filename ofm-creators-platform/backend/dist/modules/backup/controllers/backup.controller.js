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
exports.BackupController = void 0;
const common_1 = require("@nestjs/common");
const backup_service_1 = require("../services/backup.service");
const jwt_auth_guard_1 = require("../../../core/guards/jwt-auth.guard");
const roles_guard_1 = require("../../../core/guards/roles.guard");
const roles_decorator_1 = require("../../../core/decorators/roles.decorator");
const roles_guard_2 = require("../../../core/guards/roles.guard");
let BackupController = class BackupController {
    backupService;
    constructor(backupService) {
        this.backupService = backupService;
    }
    async createManualBackup(body) {
        return this.backupService.createManualBackup(body.type);
    }
    async getBackupStatus() {
        // Would return recent backup logs from database
        return {
            lastBackup: new Date(),
            nextScheduled: new Date(Date.now() + 24 * 60 * 60 * 1000),
            status: 'healthy',
        };
    }
};
exports.BackupController = BackupController;
__decorate([
    (0, common_1.Post)('manual'),
    (0, roles_decorator_1.Roles)(roles_guard_2.UserRole.Admin),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BackupController.prototype, "createManualBackup", null);
__decorate([
    (0, common_1.Get)('status'),
    (0, roles_decorator_1.Roles)(roles_guard_2.UserRole.Admin),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], BackupController.prototype, "getBackupStatus", null);
exports.BackupController = BackupController = __decorate([
    (0, common_1.Controller)('backup'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [backup_service_1.BackupService])
], BackupController);
//# sourceMappingURL=backup.controller.js.map