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
exports.OnlyFansImportController = void 0;
const common_1 = require("@nestjs/common");
const onlyfans_import_service_1 = require("../services/onlyfans-import.service");
const csv_import_dto_1 = require("../dto/csv-import.dto");
const jwt_auth_guard_1 = require("@infrastructure/auth/guards/jwt-auth.guard");
const current_user_decorator_1 = require("@infrastructure/auth/decorators/current-user.decorator");
const prisma_service_1 = require("@infrastructure/prisma/prisma.service");
let OnlyFansImportController = class OnlyFansImportController {
    onlyFansImportService;
    prisma;
    constructor(onlyFansImportService, prisma) {
        this.onlyFansImportService = onlyFansImportService;
        this.prisma = prisma;
    }
    /**
     * Import CSV data from OnlyFans
     */
    async importCSV(user, dto) {
        // Verify the source belongs to the user
        const source = await this.prisma.externalEarningsSource.findFirst({
            where: {
                id: dto.sourceId,
                creatorId: user.creatorId,
                platform: 'OF'
            }
        });
        if (!source) {
            throw new common_1.BadRequestException('Invalid source or unauthorized');
        }
        return this.onlyFansImportService.importCSV(dto);
    }
    /**
     * Get engagement analytics
     */
    async getEngagementAnalytics(user) {
        return this.onlyFansImportService.getEngagementAnalytics(user.creatorId);
    }
    /**
     * Parse CSV file and preview import
     */
    async previewImport(user, body) {
        const delimiter = body.delimiter || ',';
        const lines = body.csvContent.trim().split('\n');
        if (lines.length < 2) {
            throw new common_1.BadRequestException('CSV must have header and at least one data row');
        }
        const headers = lines[0].split(delimiter).map(h => h.trim());
        const rows = lines.slice(1, Math.min(6, lines.length)).map(line => {
            const values = line.split(delimiter);
            const row = {};
            headers.forEach((header, index) => {
                row[header] = values[index]?.trim() || '';
            });
            return row;
        });
        // Validate headers based on type
        const requiredHeaders = this.getRequiredHeaders(body.type);
        const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
        return {
            type: body.type,
            headers,
            requiredHeaders,
            missingHeaders,
            isValid: missingHeaders.length === 0,
            sampleRows: rows,
            totalRows: lines.length - 1
        };
    }
    /**
     * Get CSV templates
     */
    async getTemplates() {
        return {
            subscribers: {
                name: 'OnlyFans Subscribers',
                headers: [
                    'username', 'name', 'email', 'status', 'subscription_price',
                    'subscription_start', 'subscription_end', 'rebill_status',
                    'total_spent', 'messages_sent', 'tips_sent', 'ppv_purchased',
                    'join_date', 'last_active'
                ],
                sample: [
                    {
                        username: 'fan123',
                        name: 'John Doe',
                        email: 'john@example.com',
                        status: 'active',
                        subscription_price: '9.99',
                        subscription_start: '2024-01-01',
                        subscription_end: '2024-02-01',
                        rebill_status: 'on',
                        total_spent: '99.99',
                        messages_sent: '25',
                        tips_sent: '5',
                        ppv_purchased: '3',
                        join_date: '2023-06-15',
                        last_active: '2024-01-20'
                    }
                ]
            },
            revenue: {
                name: 'OnlyFans Revenue',
                headers: [
                    'date', 'type', 'username', 'gross_amount', 'platform_fee',
                    'net_amount', 'currency', 'status', 'description',
                    'message_id', 'post_id', 'stream_id'
                ],
                sample: [
                    {
                        date: '2024-01-20T10:30:00Z',
                        type: 'subscription',
                        username: 'fan123',
                        gross_amount: '9.99',
                        platform_fee: '2.00',
                        net_amount: '7.99',
                        currency: 'USD',
                        status: 'completed',
                        description: 'Monthly subscription',
                        message_id: '',
                        post_id: '',
                        stream_id: ''
                    }
                ]
            },
            content: {
                name: 'OnlyFans Content',
                headers: [
                    'post_id', 'created_at', 'type', 'visibility', 'price',
                    'likes', 'comments', 'tips', 'ppv_purchases', 'total_revenue'
                ],
                sample: [
                    {
                        post_id: 'post_12345',
                        created_at: '2024-01-15T14:30:00Z',
                        type: 'photo',
                        visibility: 'subscribers',
                        price: '',
                        likes: '245',
                        comments: '32',
                        tips: '5',
                        ppv_purchases: '0',
                        total_revenue: '25.00'
                    }
                ]
            }
        };
    }
    /**
     * Get source connections
     */
    async getSources(user) {
        return this.prisma.externalEarningsSource.findMany({
            where: {
                creatorId: user.creatorId,
                platform: 'OF'
            },
            select: {
                id: true,
                externalHandle: true,
                currency: true,
                connectedAt: true,
                lastSync: true,
                active: true
            }
        });
    }
    /**
     * Create new OnlyFans source
     */
    async createSource(user, body) {
        return this.prisma.externalEarningsSource.create({
            data: {
                creatorId: user.creatorId,
                platform: 'OF',
                externalHandle: body.externalHandle,
                currency: body.currency,
                metadata: {
                    addedBy: user.id,
                    addedAt: new Date()
                }
            }
        });
    }
    getRequiredHeaders(type) {
        switch (type) {
            case 'subscribers':
                return ['username', 'status', 'total_spent', 'join_date', 'last_active'];
            case 'revenue':
                return ['date', 'type', 'username', 'gross_amount', 'platform_fee', 'net_amount', 'currency'];
            case 'content':
                return ['post_id', 'created_at', 'type', 'total_revenue'];
            default:
                return [];
        }
    }
};
exports.OnlyFansImportController = OnlyFansImportController;
__decorate([
    (0, common_1.Post)('import'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, csv_import_dto_1.OnlyFansCSVImportDto]),
    __metadata("design:returntype", Promise)
], OnlyFansImportController.prototype, "importCSV", null);
__decorate([
    (0, common_1.Get)('analytics/engagement'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], OnlyFansImportController.prototype, "getEngagementAnalytics", null);
__decorate([
    (0, common_1.Post)('preview'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], OnlyFansImportController.prototype, "previewImport", null);
__decorate([
    (0, common_1.Get)('templates'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], OnlyFansImportController.prototype, "getTemplates", null);
__decorate([
    (0, common_1.Get)('sources'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], OnlyFansImportController.prototype, "getSources", null);
__decorate([
    (0, common_1.Post)('sources'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], OnlyFansImportController.prototype, "createSource", null);
exports.OnlyFansImportController = OnlyFansImportController = __decorate([
    (0, common_1.Controller)('onlyfans'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [onlyfans_import_service_1.OnlyFansImportService,
        prisma_service_1.PrismaService])
], OnlyFansImportController);
//# sourceMappingURL=onlyfans-import.controller.js.map