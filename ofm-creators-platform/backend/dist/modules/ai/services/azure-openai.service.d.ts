import { ConfigService } from '@nestjs/config';
export declare class AzureOpenAIService {
    private configService;
    private client;
    private deploymentName;
    constructor(configService: ConfigService);
    draftFanMessage(params: {
        fanName: string;
        conversationHistory?: string;
        creatorStyle: 'friendly' | 'flirty' | 'professional' | 'custom';
        customInstructions?: string;
        context?: string;
    }): Promise<string>;
    generateContentIdeas(params: {
        creatorNiche?: string;
        recentContent?: string[];
        topPerformingContent?: string[];
    }): Promise<string[]>;
    analyzeFan(params: {
        fanId: string;
        purchaseHistory: any[];
        messageHistory: any[];
        lastActive: Date;
    }): Promise<{
        insights: string;
        recommendations: string[];
        estimatedLTV: number;
    }>;
    createPPVDescription(params: {
        contentType: string;
        contentTheme: string;
        price: number;
        creatorStyle: string;
    }): Promise<string>;
    generateAnalyticsInsights(params: {
        revenue: number[];
        fanGrowth: number[];
        contentPerformance: any[];
        period: string;
    }): Promise<{
        summary: string;
        insights: string[];
        recommendations: string[];
    }>;
    moderateContent(content: string): Promise<{
        safe: boolean;
        issues?: string[];
    }>;
}
//# sourceMappingURL=azure-openai.service.d.ts.map