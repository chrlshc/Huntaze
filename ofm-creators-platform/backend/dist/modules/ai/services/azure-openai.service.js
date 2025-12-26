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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AzureOpenAIService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const openai_1 = require("@azure/openai");
const system_prompts_1 = require("../prompts/system-prompts");
let AzureOpenAIService = class AzureOpenAIService {
    configService;
    client;
    deploymentName;
    constructor(configService) {
        this.configService = configService;
        const endpoint = this.configService.get('azureOpenAI.endpoint');
        const apiKey = this.configService.get('azureOpenAI.apiKey');
        this.deploymentName = this.configService.get('azureOpenAI.deploymentName', 'gpt-4');
        if (!endpoint || !apiKey) {
            throw new Error('Azure OpenAI configuration is missing');
        }
        this.client = new openai_1.OpenAIClient(endpoint, new openai_1.AzureKeyCredential(apiKey));
    }
    async draftFanMessage(params) {
        const stylePrompt = params.customInstructions || system_prompts_1.STYLE_PROMPTS[params.creatorStyle];
        const messages = [
            { role: 'system', content: system_prompts_1.HUNTAZE_SYSTEM_PROMPT },
            { role: 'system', content: stylePrompt },
            { role: 'system', content: system_prompts_1.MESSAGE_DRAFTING_PROMPT },
            {
                role: 'user',
                content: `Draft a message for fan "${params.fanName}".
Context: ${params.context || 'General check-in'}
Conversation history: ${params.conversationHistory || 'New conversation'}`
            }
        ];
        const response = await this.client.getChatCompletions(this.deploymentName, messages, {
            temperature: 0.7,
            maxTokens: 200,
        });
        return response.choices[0]?.message?.content || 'Unable to generate message';
    }
    async generateContentIdeas(params) {
        const messages = [
            { role: 'system', content: system_prompts_1.HUNTAZE_SYSTEM_PROMPT },
            { role: 'system', content: system_prompts_1.CONTENT_SUGGESTION_PROMPT },
            {
                role: 'user',
                content: `Generate content ideas for a creator.
Niche: ${params.creatorNiche || 'General'}
Recent content: ${params.recentContent?.join(', ') || 'N/A'}
Top performing: ${params.topPerformingContent?.join(', ') || 'N/A'}`
            }
        ];
        const response = await this.client.getChatCompletions(this.deploymentName, messages, {
            temperature: 0.8,
            maxTokens: 500,
        });
        const content = response.choices[0]?.message?.content || '';
        return content.split('\n').filter(line => line.trim().length > 0);
    }
    async analyzeFan(params) {
        const messages = [
            { role: 'system', content: system_prompts_1.HUNTAZE_SYSTEM_PROMPT },
            { role: 'system', content: system_prompts_1.FAN_ANALYSIS_PROMPT },
            {
                role: 'user',
                content: `Analyze fan behavior:
Fan ID: ${params.fanId}
Total purchases: ${params.purchaseHistory.length}
Total spent: $${params.purchaseHistory.reduce((sum, p) => sum + p.amount, 0)}
Message count: ${params.messageHistory.length}
Last active: ${params.lastActive.toISOString()}`
            }
        ];
        const response = await this.client.getChatCompletions(this.deploymentName, messages, {
            temperature: 0.3,
            maxTokens: 400,
        });
        const content = response.choices[0]?.message?.content || '';
        // Parse the response (this is a simplified example)
        return {
            insights: content,
            recommendations: [
                'Personalized PPV offer',
                'Re-engagement campaign',
                'VIP tier upgrade'
            ],
            estimatedLTV: 500 // This would be calculated based on actual data
        };
    }
    async createPPVDescription(params) {
        const messages = [
            { role: 'system', content: system_prompts_1.HUNTAZE_SYSTEM_PROMPT },
            { role: 'system', content: system_prompts_1.PPV_DESCRIPTION_PROMPT },
            {
                role: 'user',
                content: `Create PPV description:
Type: ${params.contentType}
Theme: ${params.contentTheme}
Price: $${params.price}
Style: ${params.creatorStyle}`
            }
        ];
        const response = await this.client.getChatCompletions(this.deploymentName, messages, {
            temperature: 0.7,
            maxTokens: 150,
        });
        return response.choices[0]?.message?.content || 'Unable to generate description';
    }
    async generateAnalyticsInsights(params) {
        const messages = [
            { role: 'system', content: system_prompts_1.HUNTAZE_SYSTEM_PROMPT },
            { role: 'system', content: system_prompts_1.ANALYTICS_INSIGHT_PROMPT },
            {
                role: 'user',
                content: `Analyze performance data:
Period: ${params.period}
Revenue trend: ${params.revenue.join(', ')}
Fan growth: ${params.fanGrowth.join(', ')}
Top content types: ${params.contentPerformance.map(c => c.type).join(', ')}`
            }
        ];
        const response = await this.client.getChatCompletions(this.deploymentName, messages, {
            temperature: 0.3,
            maxTokens: 600,
        });
        const content = response.choices[0]?.message?.content || '';
        // Parse insights from response
        return {
            summary: 'Revenue up 15% this month',
            insights: [
                'Video content performing 2x better than photos',
                'Peak engagement times: 8-10 PM EST',
                'VIP fans spending 3x more than regular'
            ],
            recommendations: [
                'Increase video content production',
                'Launch VIP tier with exclusive benefits',
                'Schedule posts during peak hours'
            ]
        };
    }
    async moderateContent(content) {
        // Use Azure Content Safety API or OpenAI moderation
        // This is a placeholder implementation
        const bannedWords = ['explicit', 'inappropriate', 'violation'];
        const issues = bannedWords.filter(word => content.toLowerCase().includes(word));
        return {
            safe: issues.length === 0,
            issues: issues.length > 0 ? issues : undefined
        };
    }
};
exports.AzureOpenAIService = AzureOpenAIService;
exports.AzureOpenAIService = AzureOpenAIService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], AzureOpenAIService);
//# sourceMappingURL=azure-openai.service.js.map