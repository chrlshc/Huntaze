"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const event_emitter_1 = require("@nestjs/event-emitter");
const schedule_1 = require("@nestjs/schedule");
const throttler_1 = require("@nestjs/throttler");
const jwt_1 = require("@nestjs/jwt");
// Infrastructure modules
const prisma_module_1 = require("./infrastructure/database/prisma.module");
const redis_module_1 = require("./infrastructure/cache/redis.module");
const stripe_module_1 = require("./infrastructure/payment/stripe.module");
const storage_module_1 = require("./infrastructure/storage/storage.module");
const queue_module_1 = require("./infrastructure/queue/queue.module");
const temporal_module_1 = require("./infrastructure/temporal/temporal.module");
// Core modules
const auth_module_1 = require("./core/auth/auth.module");
const security_module_1 = require("./core/security/security.module");
const i18n_module_1 = require("./core/i18n/i18n.module");
// Feature modules
const subscription_module_1 = require("./modules/subscription/subscription.module");
const paywall_module_1 = require("./modules/paywall/paywall.module");
const dashboard_module_1 = require("./modules/dashboard/dashboard.module");
const crm_module_1 = require("./modules/crm/crm.module");
const appstore_module_1 = require("./modules/appstore/appstore.module");
const compliance_module_1 = require("./modules/compliance/compliance.module");
const payout_module_1 = require("./modules/payout/payout.module");
const webhook_module_1 = require("./modules/webhook/webhook.module");
const smart_links_module_1 = require("./modules/smart-links/smart-links.module");
const cross_channel_analytics_module_1 = require("./modules/analytics/cross-channel/cross-channel-analytics.module");
const nba_module_1 = require("./modules/nba/nba.module");
const webhooks_module_1 = require("./modules/webhooks/webhooks.module");
const export_module_1 = require("./modules/export/export.module");
const attribution_module_1 = require("./modules/attribution/attribution.module");
const backup_module_1 = require("./modules/backup/backup.module");
// Configuration
const configuration_1 = __importDefault(require("./config/configuration"));
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            // Configuration
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                load: [configuration_1.default],
                envFilePath: ['.env.local', '.env'],
            }),
            // Event system
            event_emitter_1.EventEmitterModule.forRoot({
                wildcard: true,
                delimiter: '.',
                newListener: false,
                removeListener: false,
                maxListeners: 10,
                verboseMemoryLeak: false,
                ignoreErrors: false,
            }),
            // Scheduling
            schedule_1.ScheduleModule.forRoot(),
            // Rate limiting
            throttler_1.ThrottlerModule.forRootAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (config) => ({
                    ttl: config.get('throttle.ttl', 60),
                    limit: config.get('throttle.limit', 10),
                }),
            }),
            // JWT
            jwt_1.JwtModule.registerAsync({
                global: true,
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (config) => ({
                    secret: config.get('jwt.secret'),
                    signOptions: {
                        expiresIn: config.get('jwt.expiresIn', '7d'),
                        issuer: config.get('jwt.issuer', 'ofm-creators-platform'),
                    },
                }),
            }),
            // Infrastructure
            prisma_module_1.PrismaModule,
            redis_module_1.RedisModule,
            stripe_module_1.StripeModule,
            storage_module_1.StorageModule,
            queue_module_1.QueueModule,
            temporal_module_1.TemporalModule,
            // Core
            auth_module_1.AuthModule,
            security_module_1.SecurityModule,
            i18n_module_1.I18nModule,
            // Features
            subscription_module_1.SubscriptionModule,
            paywall_module_1.PaywallModule,
            dashboard_module_1.DashboardModule,
            crm_module_1.CrmModule,
            appstore_module_1.AppStoreModule,
            compliance_module_1.ComplianceModule,
            payout_module_1.PayoutModule,
            webhook_module_1.WebhookModule,
            smart_links_module_1.SmartLinksModule,
            cross_channel_analytics_module_1.CrossChannelAnalyticsModule,
            nba_module_1.NBAModule,
            webhooks_module_1.WebhooksModule,
            export_module_1.ExportModule,
            attribution_module_1.AttributionModule,
            backup_module_1.BackupModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map