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
var AzureOpenAIService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AzureOpenAIService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const openai_1 = require("@azure/openai");
let AzureOpenAIService = AzureOpenAIService_1 = class AzureOpenAIService {
    configService;
    logger = new common_1.Logger(AzureOpenAIService_1.name);
    client;
    deploymentName;
    defaultMaxTokens;
    defaultTemperature;
    constructor(configService) {
        this.configService = configService;
        const endpoint = this.configService.get('azureOpenAI.endpoint');
        const apiKey = this.configService.get('azureOpenAI.apiKey');
        if (!endpoint || !apiKey) {
            this.logger.error('Azure OpenAI configuration is missing');
            throw new Error('Azure OpenAI configuration is missing');
        }
        this.client = new openai_1.OpenAIClient(endpoint, new openai_1.AzureKeyCredential(apiKey));
        this.deploymentName = this.configService.get('azureOpenAI.deploymentName');
        this.defaultMaxTokens = this.configService.get('azureOpenAI.maxTokens');
        this.defaultTemperature = this.configService.get('azureOpenAI.temperature');
        this.logger.log('Azure OpenAI service initialized');
    }
    async createChatCompletion(options) {
        try {
            this.logger.debug(`Creating chat completion with ${options.messages.length} messages`);
            const result = await this.client.getChatCompletions(this.deploymentName, options.messages, {
                temperature: options.temperature ?? this.defaultTemperature,
                maxTokens: options.maxTokens ?? this.defaultMaxTokens,
                topP: options.topP,
                frequencyPenalty: options.frequencyPenalty,
                presencePenalty: options.presencePenalty,
            });
            this.logger.debug(`Chat completion created: ${result.id}`);
            return {
                id: result.id,
                choices: result.choices.map(choice => ({
                    message: {
                        role: choice.message.role,
                        content: choice.message.content,
                    },
                    finishReason: choice.finishReason,
                    index: choice.index,
                })),
                usage: {
                    promptTokens: result.usage.promptTokens,
                    completionTokens: result.usage.completionTokens,
                    totalTokens: result.usage.totalTokens,
                },
            };
        }
        catch (error) {
            this.logger.error('Error creating chat completion:', error);
            throw error;
        }
    }
    async createStreamingChatCompletion(options) {
        try {
            this.logger.debug(`Creating streaming chat completion with ${options.messages.length} messages`);
            const events = await this.client.streamChatCompletions(this.deploymentName, options.messages, {
                temperature: options.temperature ?? this.defaultTemperature,
                maxTokens: options.maxTokens ?? this.defaultMaxTokens,
                topP: options.topP,
                frequencyPenalty: options.frequencyPenalty,
                presencePenalty: options.presencePenalty,
            });
            async function* streamGenerator() {
                for await (const event of events) {
                    for (const choice of event.choices) {
                        const delta = choice.delta?.content;
                        if (delta) {
                            yield delta;
                        }
                    }
                }
            }
            return streamGenerator();
        }
        catch (error) {
            this.logger.error('Error creating streaming chat completion:', error);
            throw error;
        }
    }
    async generateContentDescription(content, maxLength = 150) {
        const response = await this.createChatCompletion({
            messages: [
                {
                    role: 'system',
                    content: 'You are a helpful assistant that creates concise, engaging descriptions for content.',
                },
                {
                    role: 'user',
                    content: `Create a brief description (max ${maxLength} characters) for the following content: ${content}`,
                },
            ],
            temperature: 0.7,
            maxTokens: 100,
        });
        return response.choices[0]?.message.content || '';
    }
    async moderateContent(content) {
        const response = await this.createChatCompletion({
            messages: [
                {
                    role: 'system',
                    content: 'You are a content moderation assistant. Analyze content for inappropriate material including adult content, violence, hate speech, or harmful content. Respond with JSON: {"safe": boolean, "reason": "string if unsafe"}',
                },
                {
                    role: 'user',
                    content: `Moderate this content: ${content}`,
                },
            ],
            temperature: 0.1,
            maxTokens: 150,
        });
        try {
            const result = JSON.parse(response.choices[0]?.message.content || '{"safe": true}');
            return result;
        }
        catch {
            return { safe: true };
        }
    }
    async generateHashtags(content, count = 5) {
        const response = await this.createChatCompletion({
            messages: [
                {
                    role: 'system',
                    content: `You are a social media expert. Generate exactly ${count} relevant hashtags for content. Return only hashtags separated by commas, no # symbol.`,
                },
                {
                    role: 'user',
                    content: `Generate hashtags for: ${content}`,
                },
            ],
            temperature: 0.8,
            maxTokens: 100,
        });
        const hashtags = response.choices[0]?.message.content
            .split(',')
            .map(tag => tag.trim())
            .filter(tag => tag.length > 0)
            .slice(0, count);
        return hashtags || [];
    }
};
exports.AzureOpenAIService = AzureOpenAIService;
exports.AzureOpenAIService = AzureOpenAIService = AzureOpenAIService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], AzureOpenAIService);
//# sourceMappingURL=azure-openai.service.js.map