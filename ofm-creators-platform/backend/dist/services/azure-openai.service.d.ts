import { ConfigService } from '@nestjs/config';
export interface ChatCompletionOptions {
    messages: Array<{
        role: 'system' | 'user' | 'assistant';
        content: string;
    }>;
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
    stream?: boolean;
}
export interface ChatCompletionResponse {
    id: string;
    choices: Array<{
        message: {
            role: string;
            content: string;
        };
        finishReason: string;
        index: number;
    }>;
    usage: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
}
export declare class AzureOpenAIService {
    private configService;
    private readonly logger;
    private client;
    private deploymentName;
    private defaultMaxTokens;
    private defaultTemperature;
    constructor(configService: ConfigService);
    createChatCompletion(options: ChatCompletionOptions): Promise<ChatCompletionResponse>;
    createStreamingChatCompletion(options: ChatCompletionOptions): Promise<AsyncIterable<string>>;
    generateContentDescription(content: string, maxLength?: number): Promise<string>;
    moderateContent(content: string): Promise<{
        safe: boolean;
        reason?: string;
    }>;
    generateHashtags(content: string, count?: number): Promise<string[]>;
}
//# sourceMappingURL=azure-openai.service.d.ts.map