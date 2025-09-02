"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CrossChannelAnalyticsModule = void 0;
const common_1 = require("@nestjs/common");
const cross_channel_analytics_controller_1 = require("./cross-channel-analytics.controller");
const cross_channel_analytics_service_1 = require("./cross-channel-analytics.service");
const prisma_module_1 = require("@infrastructure/prisma/prisma.module");
let CrossChannelAnalyticsModule = class CrossChannelAnalyticsModule {
};
exports.CrossChannelAnalyticsModule = CrossChannelAnalyticsModule;
exports.CrossChannelAnalyticsModule = CrossChannelAnalyticsModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule],
        controllers: [cross_channel_analytics_controller_1.CrossChannelAnalyticsController],
        providers: [cross_channel_analytics_service_1.CrossChannelAnalyticsService],
        exports: [cross_channel_analytics_service_1.CrossChannelAnalyticsService],
    })
], CrossChannelAnalyticsModule);
//# sourceMappingURL=cross-channel-analytics.module.js.map