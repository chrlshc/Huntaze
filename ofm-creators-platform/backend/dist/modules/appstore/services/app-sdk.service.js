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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppSDKClient = exports.AppSdkService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const rxjs_1 = require("rxjs");
/**
 * SDK Service pour les développeurs d'applications
 * Fournit une interface simplifiée pour interagir avec la plateforme
 */
let AppSdkService = class AppSdkService {
    http;
    config;
    jwt;
    apiBaseUrl;
    constructor(http, config, jwt) {
        this.http = http;
        this.config = config;
        this.jwt = jwt;
        this.apiBaseUrl = this.config.get('app.url') + '/api/v1';
    }
    /**
     * Génère le SDK client pour une application
     */
    generateSDK(appId, apiKey) {
        return new AppSDKClient(this.apiBaseUrl, appId, apiKey, this.http);
    }
    /**
     * Génère la documentation de l'API pour les développeurs
     */
    generateApiDocs() {
        return {
            version: '1.0.0',
            baseUrl: this.apiBaseUrl,
            authentication: {
                type: 'Bearer',
                header: 'Authorization',
                format: 'Bearer {api_key}'
            },
            endpoints: this.getEndpointDocumentation(),
            webhooks: this.getWebhookDocumentation(),
            scopes: this.getScopeDocumentation(),
            rateLimits: this.getRateLimitDocumentation(),
            examples: this.getExampleCode()
        };
    }
    /**
     * Valide un token d'accès d'application
     */
    async validateAppToken(token) {
        try {
            const payload = this.jwt.verify(token);
            if (payload.type !== 'app_access') {
                return { valid: false };
            }
            return {
                valid: true,
                appId: payload.appId,
                creatorId: payload.creatorId,
                scopes: payload.scopes
            };
        }
        catch (error) {
            return { valid: false };
        }
    }
    /**
     * Génère un exemple de webhook handler
     */
    generateWebhookHandler(webhookSecret) {
        return `
import express from 'express';
import crypto from 'crypto';

const app = express();
app.use(express.json());

const WEBHOOK_SECRET = '${webhookSecret}';

function verifyWebhookSignature(payload, signature) {
  const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
  hmac.update(JSON.stringify(payload));
  const expectedSignature = hmac.digest('hex');
  return signature === expectedSignature;
}

app.post('/webhook', (req, res) => {
  const signature = req.headers['x-app-signature'];
  
  if (!verifyWebhookSignature(req.body, signature)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const { event, data } = req.body;

  switch (event) {
    case 'app.installed':
      console.log('App installed for creator:', data.creatorId);
      // Handle installation
      break;
      
    case 'app.uninstalled':
      console.log('App uninstalled for creator:', data.creatorId);
      // Handle uninstallation
      break;
      
    case 'subscription.created':
      console.log('New subscription:', data);
      // Handle new subscription
      break;
      
    default:
      console.log('Unknown event:', event);
  }

  res.json({ received: true });
});

app.listen(3000, () => {
  console.log('Webhook handler listening on port 3000');
});
`;
    }
    getEndpointDocumentation() {
        return [
            {
                method: 'GET',
                path: '/creators/{creatorId}/profile',
                description: 'Get creator profile information',
                scopes: ['creators:read'],
                parameters: [
                    { name: 'creatorId', type: 'string', required: true, in: 'path' }
                ],
                responses: {
                    200: { description: 'Creator profile', schema: 'CreatorProfile' },
                    404: { description: 'Creator not found' }
                }
            },
            {
                method: 'GET',
                path: '/creators/{creatorId}/fans',
                description: 'List creator fans',
                scopes: ['fans:read'],
                parameters: [
                    { name: 'creatorId', type: 'string', required: true, in: 'path' },
                    { name: 'page', type: 'number', required: false, in: 'query' },
                    { name: 'limit', type: 'number', required: false, in: 'query' }
                ],
                responses: {
                    200: { description: 'List of fans', schema: 'FanList' }
                }
            },
            {
                method: 'POST',
                path: '/creators/{creatorId}/campaigns',
                description: 'Create a campaign',
                scopes: ['campaigns:write'],
                parameters: [
                    { name: 'creatorId', type: 'string', required: true, in: 'path' }
                ],
                body: {
                    schema: 'CreateCampaignRequest',
                    required: true
                },
                responses: {
                    201: { description: 'Campaign created', schema: 'Campaign' },
                    400: { description: 'Invalid request' }
                }
            },
            {
                method: 'GET',
                path: '/creators/{creatorId}/analytics',
                description: 'Get creator analytics',
                scopes: ['analytics:read'],
                parameters: [
                    { name: 'creatorId', type: 'string', required: true, in: 'path' },
                    { name: 'startDate', type: 'string', required: false, in: 'query' },
                    { name: 'endDate', type: 'string', required: false, in: 'query' }
                ],
                responses: {
                    200: { description: 'Analytics data', schema: 'Analytics' }
                }
            }
        ];
    }
    getWebhookDocumentation() {
        return [
            {
                event: 'app.installed',
                description: 'Triggered when a creator installs your app',
                payload: {
                    creatorId: 'string',
                    installationId: 'string',
                    accessToken: 'string',
                    settings: 'object'
                }
            },
            {
                event: 'app.uninstalling',
                description: 'Triggered before a creator uninstalls your app',
                payload: {
                    creatorId: 'string',
                    installationId: 'string'
                }
            },
            {
                event: 'app.config_updated',
                description: 'Triggered when a creator updates app settings',
                payload: {
                    creatorId: 'string',
                    installationId: 'string',
                    settings: 'object'
                }
            },
            {
                event: 'subscription.created',
                description: 'New subscription created (if subscriptions:read scope)',
                payload: {
                    subscriptionId: 'string',
                    fanId: 'string',
                    planId: 'string',
                    creatorId: 'string'
                }
            },
            {
                event: 'content.published',
                description: 'New content published (if products:read scope)',
                payload: {
                    productId: 'string',
                    creatorId: 'string',
                    type: 'string',
                    title: 'string'
                }
            }
        ];
    }
    getScopeDocumentation() {
        return [
            {
                scope: 'creators:read',
                description: 'Read creator profile information',
                endpoints: ['/creators/{id}/profile']
            },
            {
                scope: 'fans:read',
                description: 'Read fan information and lists',
                endpoints: ['/creators/{id}/fans', '/fans/{id}']
            },
            {
                scope: 'campaigns:read',
                description: 'Read campaign information',
                endpoints: ['/creators/{id}/campaigns', '/campaigns/{id}']
            },
            {
                scope: 'campaigns:write',
                description: 'Create and update campaigns',
                endpoints: ['POST /creators/{id}/campaigns', 'PUT /campaigns/{id}']
            },
            {
                scope: 'analytics:read',
                description: 'Read analytics and metrics',
                endpoints: ['/creators/{id}/analytics', '/campaigns/{id}/metrics']
            },
            {
                scope: 'products:read',
                description: 'Read product/content information',
                endpoints: ['/creators/{id}/products', '/products/{id}']
            },
            {
                scope: 'products:write',
                description: 'Create and update products',
                endpoints: ['POST /creators/{id}/products', 'PUT /products/{id}']
            }
        ];
    }
    getRateLimitDocumentation() {
        return {
            default: {
                requests: 1000,
                window: '1 hour',
                headers: {
                    'X-RateLimit-Limit': 'Request limit',
                    'X-RateLimit-Remaining': 'Requests remaining',
                    'X-RateLimit-Reset': 'Reset timestamp'
                }
            },
            endpoints: {
                '/campaigns': { requests: 100, window: '1 hour' },
                '/analytics': { requests: 500, window: '1 hour' },
                '/webhooks': { requests: 10000, window: '1 hour' }
            }
        };
    }
    getExampleCode() {
        return {
            nodejs: `
const OfmSDK = require('@ofm/sdk');

const sdk = new OfmSDK({
  appId: 'your_app_id',
  apiKey: 'your_api_key'
});

// Get creator profile
const creator = await sdk.creators.get('creator_id');

// List fans
const fans = await sdk.fans.list('creator_id', {
  page: 1,
  limit: 50
});

// Create a campaign
const campaign = await sdk.campaigns.create('creator_id', {
  name: 'Welcome Campaign',
  type: 'email',
  subject: 'Welcome!',
  content: 'Thank you for joining...',
  targetTags: ['new_subscriber']
});
`,
            python: `
from ofm_sdk import OfmSDK

sdk = OfmSDK(
    app_id='your_app_id',
    api_key='your_api_key'
)

# Get creator profile
creator = sdk.creators.get('creator_id')

# List fans
fans = sdk.fans.list('creator_id', page=1, limit=50)

# Create a campaign
campaign = sdk.campaigns.create('creator_id', {
    'name': 'Welcome Campaign',
    'type': 'email',
    'subject': 'Welcome!',
    'content': 'Thank you for joining...',
    'target_tags': ['new_subscriber']
})
`,
            curl: `
# Get creator profile
curl -X GET https://api.ofm-creators.com/v1/creators/{creator_id}/profile \\
  -H "Authorization: Bearer your_api_key"

# Create a campaign
curl -X POST https://api.ofm-creators.com/v1/creators/{creator_id}/campaigns \\
  -H "Authorization: Bearer your_api_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Welcome Campaign",
    "type": "email",
    "subject": "Welcome!",
    "content": "Thank you for joining...",
    "targetTags": ["new_subscriber"]
  }'
`
        };
    }
};
exports.AppSdkService = AppSdkService;
exports.AppSdkService = AppSdkService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof axios_1.HttpService !== "undefined" && axios_1.HttpService) === "function" ? _a : Object, config_1.ConfigService,
        jwt_1.JwtService])
], AppSdkService);
/**
 * Client SDK pour les applications
 */
class AppSDKClient {
    baseUrl;
    appId;
    apiKey;
    http;
    constructor(baseUrl, appId, apiKey, http) {
        this.baseUrl = baseUrl;
        this.appId = appId;
        this.apiKey = apiKey;
        this.http = http;
    }
    /**
     * Envoie une requête API
     */
    async request(method, path, data, params) {
        const url = `${this.baseUrl}${path}`;
        const headers = {
            'Authorization': `Bearer ${this.apiKey}`,
            'X-App-ID': this.appId,
            'Content-Type': 'application/json'
        };
        try {
            const response = await (0, rxjs_1.firstValueFrom)(this.http.request({
                method,
                url,
                headers,
                data,
                params
            }));
            return response.data;
        }
        catch (error) {
            if (error.response) {
                throw new Error(`API Error: ${error.response.status} - ${error.response.data.message}`);
            }
            throw error;
        }
    }
    /**
     * Envoie un événement à la plateforme
     */
    async sendEvent(event, data) {
        await this.request('POST', '/apps/events', {
            appId: this.appId,
            event,
            data,
            timestamp: new Date()
        });
    }
    /**
     * Met à jour la configuration de l'app pour un créateur
     */
    async updateConfig(creatorId, config) {
        await this.request('PUT', `/apps/${this.appId}/creators/${creatorId}/config`, {
            settings: config
        });
    }
}
exports.AppSDKClient = AppSDKClient;
//# sourceMappingURL=app-sdk.service.js.map