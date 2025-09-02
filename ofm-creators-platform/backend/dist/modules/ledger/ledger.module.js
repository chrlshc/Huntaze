"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LedgerModule = void 0;
const common_1 = require("@nestjs/common");
const ledger_service_1 = require("./services/ledger.service");
const reconciliation_service_1 = require("./services/reconciliation.service");
const off_platform_service_1 = require("./services/off-platform.service");
const dunning_service_1 = require("./services/dunning.service");
const ledger_controller_1 = require("./controllers/ledger.controller");
const off_platform_controller_1 = require("./controllers/off-platform.controller");
const prisma_module_1 = require("@infrastructure/prisma/prisma.module");
const stripe_module_1 = require("@infrastructure/stripe/stripe.module");
const cache_module_1 = require("@infrastructure/cache/cache.module");
const temporal_module_1 = require("@infrastructure/temporal/temporal.module");
let LedgerModule = class LedgerModule {
};
exports.LedgerModule = LedgerModule;
exports.LedgerModule = LedgerModule = __decorate([
    (0, common_1.Module)({
        imports: [
            prisma_module_1.PrismaModule,
            stripe_module_1.StripeModule,
            cache_module_1.CacheModule,
            temporal_module_1.TemporalModule
        ],
        controllers: [
            ledger_controller_1.LedgerController,
            off_platform_controller_1.OffPlatformController
        ],
        providers: [
            ledger_service_1.LedgerService,
            reconciliation_service_1.ReconciliationService,
            off_platform_service_1.OffPlatformService,
            dunning_service_1.DunningService
        ],
        exports: [
            ledger_service_1.LedgerService,
            reconciliation_service_1.ReconciliationService,
            off_platform_service_1.OffPlatformService,
            dunning_service_1.DunningService
        ]
    })
], LedgerModule);
//# sourceMappingURL=ledger.module.js.map