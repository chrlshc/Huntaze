import { PrismaService } from '@infrastructure/database/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CacheService } from '@infrastructure/cache/cache.service';
import { WebhookService } from '@infrastructure/webhook/webhook.service';
import { App, InstalledApp } from '@prisma/client';
import { CreateAppDto, UpdateAppDto, AppFilterDto, InstallAppDto, AppConfigDto, AppWebhookDto, AppPermissionsDto } from '../dto/app.dto';
interface AppWithInstallation extends App {
    installation?: InstalledApp;
    installCount?: number;
    rating?: number;
}
export declare class AppRegistryService {
    private readonly prisma;
    private readonly eventEmitter;
    private readonly cache;
    private readonly webhook;
    private readonly requiredScopes;
    constructor(prisma: PrismaService, eventEmitter: EventEmitter2, cache: CacheService, webhook: WebhookService);
    /**
     * Enregistre une nouvelle application
     */
    registerApp(dto: CreateAppDto): Promise<App>;
    /**
     * Met à jour une application
     */
    updateApp(appId: string, dto: UpdateAppDto): Promise<App>;
    /**
     * Publie une application
     */
    publishApp(appId: string): Promise<App>;
    /**
     * Obtient le catalogue d'applications
     */
    getAppDirectory(filter: AppFilterDto, creatorId?: string): Promise<{
        apps: AppWithInstallation[];
        total: number;
        categories: Record<string, number>;
    }>;
    /**
     * Installe une application pour un créateur
     */
    installApp(creatorId: string, dto: InstallAppDto): Promise<InstalledApp>;
    /**
     * Désinstalle une application
     */
    uninstallApp(creatorId: string, appId: string): Promise<void>;
    /**
     * Met à jour la configuration d'une app installée
     */
    updateAppConfig(creatorId: string, appId: string, config: AppConfigDto): Promise<InstalledApp>;
    /**
     * Gère les webhooks entrants d'une app
     */
    handleAppWebhook(appId: string, signature: string, payload: AppWebhookDto): Promise<void>;
    /**
     * Obtient les permissions d'une app pour un créateur
     */
    getAppPermissions(appId: string, creatorId: string): Promise<AppPermissionsDto>;
    /**
     * Suspend une app installée
     */
    suspendApp(creatorId: string, appId: string, reason: string): Promise<void>;
    private validateScopes;
    private generateSlug;
    private generateApiKey;
    private generateWebhookSecret;
    private storeAppSecrets;
    private validateAppForPublication;
    private generateAppAccessToken;
    private sendWebhook;
    private getAppWebhookSecret;
    private generateWebhookSignature;
    private verifyWebhookSignature;
    private revokeAppAccess;
    private getAppRestrictions;
    private handleContentCreated;
    private handleAnalyticsReport;
    private handleTaskCompleted;
}
export {};
//# sourceMappingURL=app-registry.service.d.ts.map