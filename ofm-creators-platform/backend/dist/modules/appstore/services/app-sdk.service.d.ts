import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
/**
 * SDK Service pour les développeurs d'applications
 * Fournit une interface simplifiée pour interagir avec la plateforme
 */
export declare class AppSdkService {
    private readonly http;
    private readonly config;
    private readonly jwt;
    private readonly apiBaseUrl;
    constructor(http: HttpService, config: ConfigService, jwt: JwtService);
    /**
     * Génère le SDK client pour une application
     */
    generateSDK(appId: string, apiKey: string): AppSDKClient;
    /**
     * Génère la documentation de l'API pour les développeurs
     */
    generateApiDocs(): ApiDocumentation;
    /**
     * Valide un token d'accès d'application
     */
    validateAppToken(token: string): Promise<{
        valid: boolean;
        appId?: string;
        creatorId?: string;
        scopes?: string[];
    }>;
    /**
     * Génère un exemple de webhook handler
     */
    generateWebhookHandler(webhookSecret: string): string;
    private getEndpointDocumentation;
    private getWebhookDocumentation;
    private getScopeDocumentation;
    private getRateLimitDocumentation;
    private getExampleCode;
}
/**
 * Client SDK pour les applications
 */
export declare class AppSDKClient {
    private readonly baseUrl;
    private readonly appId;
    private readonly apiKey;
    private readonly http;
    constructor(baseUrl: string, appId: string, apiKey: string, http: HttpService);
    /**
     * Envoie une requête API
     */
    request<T = any>(method: string, path: string, data?: any, params?: any): Promise<T>;
    /**
     * Envoie un événement à la plateforme
     */
    sendEvent(event: string, data: any): Promise<void>;
    /**
     * Met à jour la configuration de l'app pour un créateur
     */
    updateConfig(creatorId: string, config: any): Promise<void>;
}
interface ApiDocumentation {
    version: string;
    baseUrl: string;
    authentication: {
        type: string;
        header: string;
        format: string;
    };
    endpoints: EndpointDoc[];
    webhooks: WebhookDoc[];
    scopes: ScopeDoc[];
    rateLimits: RateLimitDoc;
    examples: Record<string, string>;
}
interface EndpointDoc {
    method: string;
    path: string;
    description: string;
    scopes: string[];
    parameters?: Array<{
        name: string;
        type: string;
        required: boolean;
        in: 'path' | 'query' | 'header';
    }>;
    body?: {
        schema: string;
        required: boolean;
    };
    responses: Record<number, {
        description: string;
        schema?: string;
    }>;
}
interface WebhookDoc {
    event: string;
    description: string;
    payload: Record<string, string>;
}
interface ScopeDoc {
    scope: string;
    description: string;
    endpoints: string[];
}
interface RateLimitDoc {
    default: {
        requests: number;
        window: string;
        headers: Record<string, string>;
    };
    endpoints: Record<string, {
        requests: number;
        window: string;
    }>;
}
export {};
//# sourceMappingURL=app-sdk.service.d.ts.map