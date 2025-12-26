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
var PromptOptimizationService_1;
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromptOptimizationService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma/prisma.service");
let PromptOptimizationService = PromptOptimizationService_1 = class PromptOptimizationService {
    prisma;
    logger = new common_1.Logger(PromptOptimizationService_1.name);
    compressionRules = [
        // Remove redundant words
        { pattern: /\b(very|really|actually|basically|literally)\b/gi, replacement: '' },
        // Simplify verbose phrases
        { pattern: /in order to/gi, replacement: 'to' },
        { pattern: /at this point in time/gi, replacement: 'now' },
        { pattern: /due to the fact that/gi, replacement: 'because' },
        // Use abbreviations for common terms
        { pattern: /\binformation\b/gi, replacement: 'info' },
        { pattern: /\bapproximately\b/gi, replacement: '~' },
        { pattern: /\bfor example\b/gi, replacement: 'e.g.' },
    ];
    constructor(prisma) {
        this.prisma = prisma;
    }
    async optimizePrompt(prompt, context) {
        const originalTokens = this.estimateTokens(prompt);
        let optimized = prompt;
        const maxReduction = context.maxReduction || 40; // Default 40% max reduction
        // Step 1: Apply compression rules
        optimized = this.applyCompressionRules(optimized, context.preserveKeywords);
        // Step 2: Remove unnecessary whitespace
        optimized = this.removeExcessWhitespace(optimized);
        // Step 3: Context-specific optimization
        optimized = this.optimizeByPurpose(optimized, context.purpose);
        // Step 4: Instruction compression
        optimized = this.compressInstructions(optimized);
        // Check reduction percentage
        const optimizedTokens = this.estimateTokens(optimized);
        const reduction = ((originalTokens - optimizedTokens) / originalTokens) * 100;
        // If reduction is too aggressive, use lighter optimization
        if (reduction > maxReduction) {
            optimized = this.lightOptimization(prompt);
        }
        return {
            original: prompt,
            optimized,
            originalTokens,
            optimizedTokens: this.estimateTokens(optimized),
            reduction: ((originalTokens - this.estimateTokens(optimized)) / originalTokens) * 100,
        };
    }
    applyCompressionRules(text, preserveKeywords) {
        let compressed = text;
        for (const rule of this.compressionRules) {
            compressed = compressed.replace(rule.pattern, rule.replacement);
        }
        // Preserve important keywords if specified
        if (preserveKeywords) {
            // This would restore any accidentally removed keywords
        }
        return compressed;
    }
    removeExcessWhitespace(text) {
        return text
            .replace(/\s+/g, ' ') // Multiple spaces to single
            .replace(/\n{3,}/g, '\n\n') // Multiple newlines to double
            .trim();
    }
    optimizeByPurpose(text, purpose) {
        switch (purpose) {
            case 'classification':
                // Remove examples if present
                return text.replace(/For example[^.]+\./gi, '');
            case 'extraction':
                // Simplify extraction instructions
                return text.replace(/Please extract and return/gi, 'Extract');
            case 'summary':
                // Compress summary instructions
                return text.replace(/Please provide a comprehensive summary of/gi, 'Summarize');
            default:
                return text;
        }
    }
    compressInstructions(text) {
        const compressionMap = {
            'Please ensure that': 'Ensure',
            'Make sure to': 'Must',
            'It is important that': 'Important:',
            'You should': 'Should',
            'You must': 'Must',
            'Do not': "Don't",
            'Cannot': "Can't",
        };
        let compressed = text;
        for (const [verbose, concise] of Object.entries(compressionMap)) {
            compressed = compressed.replace(new RegExp(verbose, 'gi'), concise);
        }
        return compressed;
    }
    lightOptimization(text) {
        // Less aggressive optimization
        return text
            .replace(/\s+/g, ' ')
            .replace(/\bvery\b/gi, '')
            .trim();
    }
    estimateTokens(text) {
        // Rough estimation: 1 token ≈ 4 characters
        // More accurate would use tiktoken
        return Math.ceil(text.length / 4);
    }
    async runABTest(originalPrompt, optimizedPrompt, testConfig) {
        const results = [];
        // Run tests alternating between original and optimized
        for (let i = 0; i < testConfig.iterations; i++) {
            const useOriginal = i % 2 === 0;
            const prompt = useOriginal ? originalPrompt : optimizedPrompt;
            // Simulate API call (would be actual in production)
            const response = await this.simulateAPICall(prompt, testConfig.model);
            // Evaluate response quality
            const quality = await this.evaluateResponseQuality(prompt, response, testConfig.evaluationCriteria);
            results.push({
                testId: testConfig.testId,
                variant: useOriginal ? 'original' : 'optimized',
                promptTokens: this.estimateTokens(prompt),
                responseQuality: quality,
                cost: this.calculateCost(prompt, response, testConfig.model),
            });
        }
        // Analyze results
        return this.analyzeABTestResults(results);
    }
    async simulateAPICall(prompt, model) {
        // In production, this would make actual API calls
        return `Response to: ${prompt.substring(0, 50)}...`;
    }
    async evaluateResponseQuality(prompt, response, criteria) {
        let score = 0;
        const maxScore = criteria.length * 100;
        for (const criterion of criteria) {
            switch (criterion) {
                case 'relevance':
                    score += this.scoreRelevance(prompt, response);
                    break;
                case 'completeness':
                    score += this.scoreCompleteness(response);
                    break;
                case 'accuracy':
                    score += this.scoreAccuracy(response);
                    break;
                case 'conciseness':
                    score += this.scoreConciseness(response);
                    break;
            }
        }
        return (score / maxScore) * 100;
    }
    scoreRelevance(prompt, response) {
        // Simple relevance scoring
        const promptKeywords = this.extractKeywords(prompt);
        const responseKeywords = this.extractKeywords(response);
        const overlap = promptKeywords.filter(k => responseKeywords.includes(k)).length;
        return (overlap / promptKeywords.length) * 100;
    }
    scoreCompleteness(response) {
        // Check if response seems complete
        if (response.length < 50)
            return 50;
        if (!response.endsWith('.'))
            return 80;
        return 100;
    }
    scoreAccuracy(response) {
        // Would implement actual accuracy checks
        return 85; // Placeholder
    }
    scoreConciseness(response) {
        // Prefer shorter responses that are still complete
        const idealLength = 200;
        const difference = Math.abs(response.length - idealLength);
        return Math.max(0, 100 - (difference / 10));
    }
    extractKeywords(text) {
        // Simple keyword extraction
        return text
            .toLowerCase()
            .split(/\W+/)
            .filter(word => word.length > 3);
    }
    calculateCost(prompt, response, model) {
        const promptTokens = this.estimateTokens(prompt);
        const responseTokens = this.estimateTokens(response);
        const rates = {
            'gpt-4': { input: 0.03, output: 0.06 },
            'gpt-3.5-turbo': { input: 0.0015, output: 0.002 },
            'claude-3': { input: 0.015, output: 0.075 },
        };
        const rate = rates[model] || { input: 0.01, output: 0.01 };
        return (promptTokens * rate.input + responseTokens * rate.output) / 1000;
    }
    analyzeABTestResults(results) {
        const originalResults = results.filter(r => r.variant === 'original');
        const optimizedResults = results.filter(r => r.variant === 'optimized');
        const analysis = {
            original: {
                avgQuality: this.average(originalResults.map(r => r.responseQuality)),
                avgCost: this.average(originalResults.map(r => r.cost)),
                avgTokens: this.average(originalResults.map(r => r.promptTokens)),
            },
            optimized: {
                avgQuality: this.average(optimizedResults.map(r => r.responseQuality)),
                avgCost: this.average(optimizedResults.map(r => r.cost)),
                avgTokens: this.average(optimizedResults.map(r => r.promptTokens)),
            },
        };
        // Calculate improvements
        const qualityDiff = analysis.optimized.avgQuality - analysis.original.avgQuality;
        const costSavings = ((analysis.original.avgCost - analysis.optimized.avgCost) / analysis.original.avgCost) * 100;
        const tokenReduction = ((analysis.original.avgTokens - analysis.optimized.avgTokens) / analysis.original.avgTokens) * 100;
        return {
            ...analysis,
            improvements: {
                qualityChange: qualityDiff,
                costSavings: costSavings,
                tokenReduction: tokenReduction,
            },
            recommendation: this.getRecommendation(qualityDiff, costSavings),
        };
    }
    average(numbers) {
        return numbers.reduce((a, b) => a + b, 0) / numbers.length;
    }
    getRecommendation(qualityDiff, costSavings) {
        if (qualityDiff < -5) {
            return 'Use original - quality degradation too high';
        }
        else if (costSavings > 20 && qualityDiff > -2) {
            return 'Use optimized - significant cost savings with acceptable quality';
        }
        else if (costSavings > 10 && qualityDiff >= 0) {
            return 'Use optimized - cost savings with maintained quality';
        }
        else {
            return 'Continue testing - results inconclusive';
        }
    }
    async saveOptimizationResults(userId, results) {
        await this.prisma.promptOptimization.create({
            data: {
                userId,
                originalPrompt: results.original,
                optimizedPrompt: results.optimized,
                originalTokens: results.originalTokens,
                optimizedTokens: results.optimizedTokens,
                tokenReduction: results.reduction,
                qualityScore: results.qualityScore,
                abTestResults: results.abTest,
                timestamp: new Date(),
            },
        });
    }
};
exports.PromptOptimizationService = PromptOptimizationService;
exports.PromptOptimizationService = PromptOptimizationService = PromptOptimizationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object])
], PromptOptimizationService);
//# sourceMappingURL=prompt-optimization.service.js.map