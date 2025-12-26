"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AICostOptimizerService_1;
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AICostOptimizerService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../../../prisma/prisma.service");
const schedule_1 = require("@nestjs/schedule");
const crypto = __importStar(require("crypto"));
let AICostOptimizerService = AICostOptimizerService_1 = class AICostOptimizerService {
    configService;
    prisma;
    logger = new common_1.Logger(AICostOptimizerService_1.name);
    requestCache = new Map();
    monthlyBudget = {
        azure: 600,
        anthropic: 250,
    };
    monthlySpent = {
        azure: 0,
        anthropic: 0,
    };
    constructor(configService, prisma) {
        this.configService = configService;
        this.prisma = prisma;
        this.loadMonthlySpending();
    }
    async optimizeAIRequest(request) {
        // 1. Check cache first
        const cacheKey = this.generateCacheKey(request);
        const cached = this.getFromCache(cacheKey);
        if (cached) {
            this.logger.log(`Cache hit for request: ${request.purpose}`);
            return { ...cached, fromCache: true };
        }
        // 2. Choose most cost-effective provider
        const provider = this.selectProvider(request);
        // 3. Optimize request parameters
        const optimizedRequest = this.optimizeParameters(request, provider);
        // 4. Batch if possible
        if (this.canBatch(request)) {
            return this.addToBatch(optimizedRequest);
        }
        // 5. Execute request
        const response = await this.executeRequest(optimizedRequest, provider);
        // 6. Cache response
        this.cacheResponse(cacheKey, response);
        // 7. Track costs
        await this.trackCost(provider, optimizedRequest, response);
        return response;
    }
    selectProvider(request) {
        // Check budget remaining
        const azureBudgetRemaining = this.monthlyBudget.azure - this.monthlySpent.azure;
        const anthropicBudgetRemaining = this.monthlyBudget.anthropic - this.monthlySpent.anthropic;
        // Estimate request cost
        const estimatedTokens = this.estimateTokens(request);
        const azureCost = this.calculateCost('azure', 'gpt-4', estimatedTokens);
        const anthropicCost = this.calculateCost('anthropic', 'claude-3', estimatedTokens);
        // Decision logic
        if (request.purpose === 'chat' && anthropicBudgetRemaining > anthropicCost) {
            // Claude is better for conversations
            return 'anthropic';
        }
        else if (request.purpose === 'analysis' && azureBudgetRemaining > azureCost) {
            // GPT-4 is better for analysis
            return 'azure';
        }
        else if (azureBudgetRemaining > azureCost) {
            return 'azure';
        }
        else if (anthropicBudgetRemaining > anthropicCost) {
            return 'anthropic';
        }
        else {
            // Budget exceeded, use cheaper model
            this.logger.warn('AI budget exceeded, falling back to cheaper model');
            return 'azure-gpt-35'; // Cheaper fallback
        }
    }
    optimizeParameters(request, provider) {
        const optimized = { ...request };
        // Reduce max tokens based on purpose
        if (request.purpose === 'classification') {
            optimized.maxTokens = Math.min(request.maxTokens, 50);
        }
        else if (request.purpose === 'summary') {
            optimized.maxTokens = Math.min(request.maxTokens, 200);
        }
        // Adjust temperature for deterministic tasks
        if (['classification', 'extraction'].includes(request.purpose)) {
            optimized.temperature = 0;
        }
        // Use cheaper model for simple tasks
        if (provider === 'azure' && this.isSimpleTask(request)) {
            optimized.model = 'gpt-3.5-turbo';
        }
        return optimized;
    }
    canBatch(request) {
        // Batch similar requests within 100ms window
        return ['classification', 'extraction'].includes(request.purpose);
    }
    async addToBatch(request) {
        // Implementation for request batching
        // Collect similar requests and send as single API call
        return this.executeRequest(request, 'azure');
    }
    generateCacheKey(request) {
        const content = `${request.prompt}-${request.model}-${request.maxTokens}-${request.temperature}`;
        return crypto.createHash('sha256').update(content).digest('hex');
    }
    getFromCache(key) {
        const cached = this.requestCache.get(key);
        if (cached && Date.now() - cached.timestamp < 3600000) { // 1 hour TTL
            return cached.data;
        }
        return null;
    }
    cacheResponse(key, response) {
        this.requestCache.set(key, {
            data: response,
            timestamp: Date.now(),
        });
        // Limit cache size
        if (this.requestCache.size > 1000) {
            const firstKey = this.requestCache.keys().next().value;
            this.requestCache.delete(firstKey);
        }
    }
    estimateTokens(request) {
        // Rough estimation: 1 token ≈ 4 characters
        const promptTokens = Math.ceil(request.prompt.length / 4);
        const responseTokens = request.maxTokens;
        return promptTokens + responseTokens;
    }
    calculateCost(provider, model, tokens) {
        const rates = {
            azure: {
                'gpt-4': { input: 0.03, output: 0.06 },
                'gpt-3.5-turbo': { input: 0.0015, output: 0.002 },
            },
            anthropic: {
                'claude-3': { input: 0.015, output: 0.075 },
                'claude-instant': { input: 0.0008, output: 0.0024 },
            },
        };
        const rate = rates[provider]?.[model] || { input: 0.01, output: 0.01 };
        // Assume 50/50 input/output split
        return (tokens * 0.5 * rate.input + tokens * 0.5 * rate.output) / 1000;
    }
    isSimpleTask(request) {
        const simpleTasks = ['classification', 'yes/no', 'sentiment', 'extraction'];
        return simpleTasks.includes(request.purpose) || request.prompt.length < 500;
    }
    async executeRequest(request, provider) {
        // Would implement actual API calls to Azure/Anthropic
        this.logger.log(`Executing ${provider} request: ${request.purpose}`);
        // Mock response
        return {
            provider,
            model: request.model,
            response: 'AI response here',
            usage: {
                promptTokens: 100,
                completionTokens: 50,
                totalTokens: 150,
            },
        };
    }
    async trackCost(provider, request, response) {
        const cost = this.calculateCost(provider, request.model, response.usage.totalTokens);
        this.monthlySpent[provider] += cost;
        // Log to database
        await this.prisma.aiUsageLog.create({
            data: {
                provider,
                model: request.model,
                purpose: request.purpose,
                userId: request.userId,
                promptTokens: response.usage.promptTokens,
                completionTokens: response.usage.completionTokens,
                totalTokens: response.usage.totalTokens,
                cost,
                cached: false,
                timestamp: new Date(),
            },
        });
    }
    async resetMonthlyBudget() {
        this.monthlySpent = {
            azure: 0,
            anthropic: 0,
        };
        this.logger.log('Monthly AI budget reset');
    }
    async loadMonthlySpending() {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        const spending = await this.prisma.aiUsageLog.groupBy({
            by: ['provider'],
            where: {
                timestamp: {
                    gte: startOfMonth,
                },
            },
            _sum: {
                cost: true,
            },
        });
        spending.forEach(s => {
            if (s.provider in this.monthlySpent) {
                this.monthlySpent[s.provider] = s._sum.cost || 0;
            }
        });
    }
    async getUsageReport() {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        const usage = await this.prisma.aiUsageLog.groupBy({
            by: ['provider', 'model', 'purpose'],
            where: {
                timestamp: {
                    gte: startOfMonth,
                },
            },
            _sum: {
                totalTokens: true,
                cost: true,
            },
            _count: true,
        });
        return {
            budget: this.monthlyBudget,
            spent: this.monthlySpent,
            remaining: {
                azure: this.monthlyBudget.azure - this.monthlySpent.azure,
                anthropic: this.monthlyBudget.anthropic - this.monthlySpent.anthropic,
            },
            usage,
            cacheHitRate: this.calculateCacheHitRate(),
        };
    }
    calculateCacheHitRate() {
        // Would calculate from logs
        return 0.35; // 35% cache hit rate
    }
    // Batch processing for bulk operations
    async processBatch(requests) {
        // Group by similar prompts
        const groups = this.groupSimilarRequests(requests);
        const results = [];
        for (const group of groups) {
            if (group.length > 5) {
                // Process as single request with multiple items
                const batchResult = await this.processBatchGroup(group);
                results.push(...batchResult);
            }
            else {
                // Process individually
                for (const req of group) {
                    const result = await this.optimizeAIRequest(req);
                    results.push(result);
                }
            }
        }
        return results;
    }
    groupSimilarRequests(requests) {
        const groups = new Map();
        requests.forEach(req => {
            const key = `${req.purpose}-${req.model}`;
            if (!groups.has(key)) {
                groups.set(key, []);
            }
            groups.get(key).push(req);
        });
        return Array.from(groups.values());
    }
    async processBatchGroup(group) {
        // Combine multiple requests into one
        const batchPrompt = this.createBatchPrompt(group);
        const batchRequest = {
            prompt: batchPrompt,
            model: group[0].model,
            maxTokens: group[0].maxTokens * group.length,
            temperature: group[0].temperature,
            userId: 'system-batch',
            purpose: group[0].purpose,
        };
        const response = await this.optimizeAIRequest(batchRequest);
        // Split response back to individual results
        return this.splitBatchResponse(response, group.length);
    }
    createBatchPrompt(requests) {
        return requests.map((req, i) => `Item ${i + 1}:\n${req.prompt}`).join('\n\n---\n\n');
    }
    splitBatchResponse(response, count) {
        // Implementation to split batched response
        return Array(count).fill(response);
    }
};
exports.AICostOptimizerService = AICostOptimizerService;
__decorate([
    (0, schedule_1.Cron)('0 0 1 * *') // First day of month
    ,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AICostOptimizerService.prototype, "resetMonthlyBudget", null);
__decorate([
    (0, schedule_1.Cron)('0 * * * *') // Every hour
    ,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AICostOptimizerService.prototype, "loadMonthlySpending", null);
exports.AICostOptimizerService = AICostOptimizerService = AICostOptimizerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService, typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object])
], AICostOptimizerService);
//# sourceMappingURL=ai-cost-optimizer.service.js.map