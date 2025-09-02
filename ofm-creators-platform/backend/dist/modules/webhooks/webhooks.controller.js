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
exports.WebhooksController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const webhooks_service_1 = require("./webhooks.service");
let WebhooksController = class WebhooksController {
    webhooksService;
    constructor(webhooksService) {
        this.webhooksService = webhooksService;
    }
    async handleESPWebhook(provider, signature, payload) {
        try {
            return await this.webhooksService.handleESPWebhook(provider, payload, signature);
        }
        catch (error) {
            if (error.message === 'Invalid webhook signature') {
                throw new common_1.BadRequestException('Invalid signature');
            }
            throw error;
        }
    }
    async handleSMSWebhook(provider, signature, payload) {
        try {
            return await this.webhooksService.handleSMSWebhook(provider, payload, signature);
        }
        catch (error) {
            if (error.message === 'Invalid webhook signature') {
                throw new common_1.BadRequestException('Invalid signature');
            }
            throw error;
        }
    }
    async handleSendGrid(signature, payload) {
        return this.handleESPWebhook('sendgrid', signature, payload);
    }
    async handleMailgun(signature, payload) {
        return this.handleESPWebhook('mailgun', signature, payload);
    }
    async handleTwilio(signature, payload) {
        return this.handleSMSWebhook('twilio', signature, payload);
    }
};
exports.WebhooksController = WebhooksController;
__decorate([
    (0, common_1.Post)('esp/:provider'),
    (0, swagger_1.ApiOperation)({ summary: 'Handle ESP (Email Service Provider) webhooks' }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Webhook processed successfully',
    }),
    (0, swagger_1.ApiExcludeEndpoint)() // Hide from public API docs
    ,
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('provider')),
    __param(1, (0, common_1.Headers)('x-webhook-signature')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], WebhooksController.prototype, "handleESPWebhook", null);
__decorate([
    (0, common_1.Post)('sms/:provider'),
    (0, swagger_1.ApiOperation)({ summary: 'Handle SMS provider webhooks' }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Webhook processed successfully',
    }),
    (0, swagger_1.ApiExcludeEndpoint)() // Hide from public API docs
    ,
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('provider')),
    __param(1, (0, common_1.Headers)('x-webhook-signature')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], WebhooksController.prototype, "handleSMSWebhook", null);
__decorate([
    (0, common_1.Post)('sendgrid'),
    (0, swagger_1.ApiExcludeEndpoint)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Headers)('x-twilio-email-event-webhook-signature')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], WebhooksController.prototype, "handleSendGrid", null);
__decorate([
    (0, common_1.Post)('mailgun'),
    (0, swagger_1.ApiExcludeEndpoint)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Headers)('x-mailgun-signature')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], WebhooksController.prototype, "handleMailgun", null);
__decorate([
    (0, common_1.Post)('twilio'),
    (0, swagger_1.ApiExcludeEndpoint)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Headers)('x-twilio-signature')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], WebhooksController.prototype, "handleTwilio", null);
exports.WebhooksController = WebhooksController = __decorate([
    (0, swagger_1.ApiTags)('Webhooks'),
    (0, common_1.Controller)('webhooks'),
    __metadata("design:paramtypes", [webhooks_service_1.WebhooksService])
], WebhooksController);
//# sourceMappingURL=webhooks.controller.js.map