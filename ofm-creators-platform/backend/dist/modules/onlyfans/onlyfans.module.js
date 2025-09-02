"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OnlyFansModule = void 0;
const common_1 = require("@nestjs/common");
const onlyfans_import_service_1 = require("./services/onlyfans-import.service");
const onlyfans_import_controller_1 = require("./controllers/onlyfans-import.controller");
const onlyfans_webhook_service_1 = require("./services/onlyfans-webhook.service");
const onlyfans_automation_service_1 = require("./services/onlyfans-automation.service");
const ledger_module_1 = require("@modules/ledger/ledger.module");
const prisma_module_1 = require("@infrastructure/prisma/prisma.module");
let OnlyFansModule = class OnlyFansModule {
};
exports.OnlyFansModule = OnlyFansModule;
exports.OnlyFansModule = OnlyFansModule = __decorate([
    (0, common_1.Module)({
        imports: [
            prisma_module_1.PrismaModule,
            ledger_module_1.LedgerModule
        ],
        controllers: [
            onlyfans_import_controller_1.OnlyFansImportController
        ],
        providers: [
            onlyfans_import_service_1.OnlyFansImportService,
            onlyfans_webhook_service_1.OnlyFansWebhookService,
            onlyfans_automation_service_1.OnlyFansAutomationService
        ],
        exports: [
            onlyfans_import_service_1.OnlyFansImportService,
            onlyfans_webhook_service_1.OnlyFansWebhookService,
            onlyfans_automation_service_1.OnlyFansAutomationService
        ]
    })
], OnlyFansModule);
//# sourceMappingURL=onlyfans.module.js.map