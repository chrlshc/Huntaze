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
exports.NBAController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("@modules/auth/guards/jwt-auth.guard");
const roles_guard_1 = require("@modules/auth/guards/roles.guard");
const roles_decorator_1 = require("@modules/auth/decorators/roles.decorator");
const nba_service_1 = require("./nba.service");
const class_validator_1 = require("class-validator");
class GetNextActionsDto {
    maxActions;
}
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(5),
    __metadata("design:type", Number)
], GetNextActionsDto.prototype, "maxActions", void 0);
let NBAController = class NBAController {
    nbaService;
    constructor(nbaService) {
        this.nbaService = nbaService;
    }
    async getNextActions(req, dto) {
        const creatorId = req.user.creatorId || req.user.id;
        const actions = await this.nbaService.getNextBestActions({
            creatorId,
            maxActions: dto.maxActions || 3,
            includeReasons: true,
        });
        return { actions };
    }
    async executeAction(req, dto) {
        const creatorId = req.user.creatorId || req.user.id;
        return this.nbaService.executeAction(creatorId, dto.actionId, dto.params || {});
    }
};
exports.NBAController = NBAController;
__decorate([
    (0, common_1.Post)('next'),
    (0, swagger_1.ApiOperation)({ summary: 'Get next best actions for creator' }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Next best actions retrieved successfully',
    }),
    (0, roles_decorator_1.Roles)('creator', 'admin'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, GetNextActionsDto]),
    __metadata("design:returntype", Promise)
], NBAController.prototype, "getNextActions", null);
__decorate([
    (0, common_1.Post)('execute'),
    (0, swagger_1.ApiOperation)({ summary: 'Execute a recommended NBA action' }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Action execution initiated',
    }),
    (0, roles_decorator_1.Roles)('creator', 'admin'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], NBAController.prototype, "executeAction", null);
exports.NBAController = NBAController = __decorate([
    (0, swagger_1.ApiTags)('NBA - Next Best Action'),
    (0, common_1.Controller)('nba'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [nba_service_1.NBAService])
], NBAController);
//# sourceMappingURL=nba.controller.js.map