"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SmartLinksModule = void 0;
const common_1 = require("@nestjs/common");
const smart_links_service_1 = require("./smart-links.service");
const smart_links_controller_1 = require("./smart-links.controller");
const redirect_controller_1 = require("./redirect.controller");
const prisma_module_1 = require("@infrastructure/prisma/prisma.module");
const analytics_module_1 = require("../analytics/analytics.module");
let SmartLinksModule = class SmartLinksModule {
};
exports.SmartLinksModule = SmartLinksModule;
exports.SmartLinksModule = SmartLinksModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, analytics_module_1.AnalyticsModule],
        controllers: [smart_links_controller_1.SmartLinksController, redirect_controller_1.RedirectController],
        providers: [smart_links_service_1.SmartLinksService],
        exports: [smart_links_service_1.SmartLinksService],
    })
], SmartLinksModule);
//# sourceMappingURL=smart-links.module.js.map