/**
 * Unit Tests for Azure Vision Service
 * 
 * Phase 6: Content Generation with Azure AI Vision
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Create mock functions
const mockGenerateFromMultimodal = vi.fn();
const mockGenerateText = vi.fn();
const mockSetDeployment = vi.fn();

// Mock the Azure OpenAI Service
vi.mock('../../../lib/ai/azure/azure-openai.service', () => ({
  AzureOpenAIService: class MockAzureOpenAIService {
    generateFromMultimodal = mockGenerateFromMultimodal;
    generateText = mockGenerateText;
    setDeployment = mockSetDeployment;
  },
}));

import {
  AzureVisionService,
  type ImageAnalysisResult,
  type GeneratedCaption,
  type HashtagSuggestion,
  type VideoAnalysisResult,
  type MultiModalOptimization,
} from '../../../lib/ai/azure/azure-vision.service';

describe('AzureVisionService', () => {
  let service: AzureVisionService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new AzureVisionService();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ==========================================================================
  // Image Analysis Tests (Requirement 7.1)
  // ==========================================================================

  describe('analyzeImage', () => {
    it('should analyze an image and return structured results', async () => {
      const mockAnalysis: Partial<ImageAnalysisResult> = {
        description: 'A beautiful sunset over the ocean',
        tags: ['sunset', 'ocean', 'nature', 'sky'],
        objects: [
          { name: 'sun', confidence: 0.95 },
          { name: 'water', confidence: 0.92 },
        ],
        colors: {
          dominantColors: ['orange', 'blue', 'purple'],
          accentColor: '#FF6B35',
          isBwImg: false,
        },
        categories: [
          { name: 'nature', score: 0.98 },
          { name: 'landscape', score: 0.85 },
        ],
        adult: {
          isAdultContent: false,
          isRacyContent: false,
          isGoryContent: false,
          adultScore: 0.01,
          racyScore: 0.02,
          goreScore: 0.0,
        },
        confidence: 0.95,
      };

      mockGenerateFromMultimodal.mockResolvedValue({
        text: JSON.stringify(mockAnalysis),
        usage: { promptTokens: 100, completionTokens: 200, totalTokens: 300 },
      });

      const result = await service.analyzeImage('https://example.com/sunset.jpg');

      expect(result.description).toBe('A beautiful sunset over the ocean');
      expect(result.tags).toContain('sunset');
      expect(result.objects).toHaveLength(2);
      expect(result.confidence).toBe(0.95);
      expect(mockGenerateFromMultimodal).toHaveBeenCalledTimes(1);
    });

    it('should handle images with adult content detection', async () => {
      const mockAnalysis = {
        description: 'Test image',
        tags: ['test'],
        objects: [],
        colors: { dominantColors: ['black'], accentColor: '#000', isBwImg: true },
        categories: [{ name: 'test', score: 0.5 }],
        adult: {
          isAdultContent: true,
          isRacyContent: true,
          isGoryContent: false,
          adultScore: 0.85,
          racyScore: 0.75,
          goreScore: 0.0,
        },
        confidence: 0.9,
      };

      mockGenerateFromMultimodal.mockResolvedValue({
        text: JSON.stringify(mockAnalysis),
      });

      const result = await service.analyzeImage('https://example.com/test.jpg');

      expect(result.adult.isAdultContent).toBe(true);
      expect(result.adult.adultScore).toBe(0.85);
    });
  });

  describe('analyzeMultipleImages', () => {
    it('should analyze multiple images in parallel', async () => {
      const mockAnalysis = {
        description: 'Test image',
        tags: ['test'],
        objects: [],
        colors: { dominantColors: ['red'], accentColor: '#F00', isBwImg: false },
        categories: [{ name: 'test', score: 0.8 }],
        adult: {
          isAdultContent: false,
          isRacyContent: false,
          isGoryContent: false,
          adultScore: 0.0,
          racyScore: 0.0,
          goreScore: 0.0,
        },
        confidence: 0.9,
      };

      mockGenerateFromMultimodal.mockResolvedValue({
        text: JSON.stringify(mockAnalysis),
      });

      const urls = [
        'https://example.com/image1.jpg',
        'https://example.com/image2.jpg',
        'https://example.com/image3.jpg',
      ];

      const results = await service.analyzeMultipleImages(urls);

      expect(results).toHaveLength(3);
      expect(mockGenerateFromMultimodal).toHaveBeenCalledTimes(3);
    });
  });

  // ==========================================================================
  // Caption Generation Tests (Requirement 7.1, 7.5)
  // ==========================================================================

  describe('generateCaption', () => {
    it('should generate a caption with default options', async () => {
      const mockCaption: GeneratedCaption = {
        caption: 'Chasing sunsets and good vibes ✨',
        hashtags: ['#sunset', '#vibes', '#nature'],
        emojis: ['✨', '🌅'],
        confidence: 0.92,
        alternativeCaptions: [
          'Golden hour magic',
          'Nature at its finest',
        ],
      };

      mockGenerateFromMultimodal.mockResolvedValue({
        text: JSON.stringify(mockCaption),
      });

      const result = await service.generateCaption('https://example.com/sunset.jpg');

      expect(result.caption).toBe('Chasing sunsets and good vibes ✨');
      expect(result.hashtags).toContain('#sunset');
      expect(result.confidence).toBeGreaterThan(0.9);
    });

    it('should respect style options', async () => {
      const mockCaption: GeneratedCaption = {
        caption: 'Professional sunset photography showcase',
        hashtags: ['#photography', '#professional'],
        emojis: [],
        confidence: 0.88,
        alternativeCaptions: [],
      };

      mockGenerateFromMultimodal.mockResolvedValue({
        text: JSON.stringify(mockCaption),
      });

      const result = await service.generateCaption('https://example.com/sunset.jpg', {
        style: 'professional',
        includeEmojis: false,
      });

      expect(result.emojis).toHaveLength(0);
      expect(mockGenerateFromMultimodal).toHaveBeenCalled();
    });

    it('should handle different languages', async () => {
      const mockCaption: GeneratedCaption = {
        caption: 'Coucher de soleil magnifique',
        hashtags: ['#coucherdesoleil', '#nature'],
        emojis: ['🌅'],
        confidence: 0.85,
        alternativeCaptions: [],
      };

      mockGenerateFromMultimodal.mockResolvedValue({
        text: JSON.stringify(mockCaption),
      });

      const result = await service.generateCaption('https://example.com/sunset.jpg', {
        language: 'fr',
      });

      expect(result.caption).toContain('soleil');
    });
  });

  describe('generateMultiImageCaption', () => {
    it('should generate cohesive caption for multiple images', async () => {
      const mockCaption: GeneratedCaption = {
        caption: 'From sunrise to sunset, every moment counts 🌅✨',
        hashtags: ['#dayinthelife', '#moments'],
        emojis: ['🌅', '✨'],
        confidence: 0.9,
        alternativeCaptions: [],
        imageReferences: ['sunrise from image 1', 'sunset from image 2'],
      };

      mockGenerateFromMultimodal.mockResolvedValue({
        text: JSON.stringify(mockCaption),
      });

      const urls = [
        'https://example.com/sunrise.jpg',
        'https://example.com/sunset.jpg',
      ];

      const result = await service.generateMultiImageCaption(urls);

      expect(result.caption).toContain('sunrise');
      expect(result.caption).toContain('sunset');
    });
  });


  // ==========================================================================
  // Hashtag Generation Tests (Requirement 7.2)
  // ==========================================================================

  describe('generateHashtags', () => {
    it('should generate relevant hashtags from image', async () => {
      const mockHashtags: HashtagSuggestion[] = [
        { hashtag: '#sunset', relevance: 0.98, trending: true, category: 'nature' },
        { hashtag: '#goldenhour', relevance: 0.95, trending: true, category: 'photography' },
        { hashtag: '#oceanview', relevance: 0.88, trending: false, category: 'travel' },
      ];

      mockGenerateFromMultimodal.mockResolvedValue({
        text: JSON.stringify({ hashtags: mockHashtags }),
      });

      const result = await service.generateHashtags('https://example.com/sunset.jpg');

      expect(result).toHaveLength(3);
      expect(result[0].hashtag).toBe('#sunset');
      expect(result[0].relevance).toBe(0.98);
      expect(result[0].trending).toBe(true);
    });

    it('should respect maxHashtags option', async () => {
      const mockHashtags: HashtagSuggestion[] = [
        { hashtag: '#tag1', relevance: 0.9, trending: false, category: 'lifestyle' },
        { hashtag: '#tag2', relevance: 0.8, trending: false, category: 'lifestyle' },
        { hashtag: '#tag3', relevance: 0.7, trending: false, category: 'lifestyle' },
        { hashtag: '#tag4', relevance: 0.6, trending: false, category: 'lifestyle' },
        { hashtag: '#tag5', relevance: 0.5, trending: false, category: 'lifestyle' },
      ];

      mockGenerateFromMultimodal.mockResolvedValue({
        text: JSON.stringify({ hashtags: mockHashtags }),
      });

      const result = await service.generateHashtags('https://example.com/image.jpg', {
        maxHashtags: 5,
      });

      expect(result.length).toBeLessThanOrEqual(5);
    });

    it('should include trending hashtags when requested', async () => {
      const mockHashtags: HashtagSuggestion[] = [
        { hashtag: '#trending1', relevance: 0.85, trending: true, category: 'lifestyle' },
        { hashtag: '#evergreen', relevance: 0.9, trending: false, category: 'lifestyle' },
      ];

      mockGenerateFromMultimodal.mockResolvedValue({
        text: JSON.stringify({ hashtags: mockHashtags }),
      });

      const result = await service.generateHashtags('https://example.com/image.jpg', {
        includeTrending: true,
      });

      const hasTrending = result.some(h => h.trending);
      expect(hasTrending).toBe(true);
    });
  });

  describe('extractVisualThemes', () => {
    it('should extract themes from image analysis', async () => {
      const mockAnalysis = {
        description: 'Beach scene',
        tags: ['beach', 'ocean', 'sand'],
        objects: [{ name: 'umbrella', confidence: 0.9 }],
        colors: { dominantColors: ['blue'], accentColor: '#00F', isBwImg: false },
        categories: [{ name: 'outdoor', score: 0.95 }],
        adult: {
          isAdultContent: false,
          isRacyContent: false,
          isGoryContent: false,
          adultScore: 0.0,
          racyScore: 0.0,
          goreScore: 0.0,
        },
        confidence: 0.9,
      };

      mockGenerateFromMultimodal.mockResolvedValue({
        text: JSON.stringify(mockAnalysis),
      });

      const themes = await service.extractVisualThemes('https://example.com/beach.jpg');

      expect(themes).toContain('beach');
      expect(themes).toContain('ocean');
      expect(themes).toContain('umbrella');
      expect(themes).toContain('outdoor');
    });
  });

  // ==========================================================================
  // Video Analysis Tests (Requirement 7.4)
  // ==========================================================================

  describe('analyzeVideo', () => {
    it('should analyze video and extract key frames', async () => {
      const mockVideoAnalysis: VideoAnalysisResult = {
        keyFrames: [
          {
            timestamp: 0,
            imageUrl: '',
            description: 'Opening scene with beach view',
            objects: [{ name: 'beach', confidence: 0.95 }],
          },
          {
            timestamp: 30,
            imageUrl: '',
            description: 'Sunset over the water',
            objects: [{ name: 'sunset', confidence: 0.92 }],
          },
        ],
        scenes: [
          {
            startTime: 0,
            endTime: 30,
            description: 'Beach introduction',
            sentiment: 'positive',
          },
          {
            startTime: 30,
            endTime: 60,
            description: 'Sunset sequence',
            sentiment: 'positive',
          },
        ],
        duration: 60,
        description: 'A beautiful beach sunset video',
        tags: ['beach', 'sunset', 'nature'],
        moderationResult: {
          isApproved: true,
          flags: [],
          confidence: 0.98,
        },
      };

      mockGenerateText.mockResolvedValue({
        text: JSON.stringify(mockVideoAnalysis),
      });

      const result = await service.analyzeVideo('https://example.com/video.mp4');

      expect(result.keyFrames).toHaveLength(2);
      expect(result.scenes).toHaveLength(2);
      expect(result.duration).toBe(60);
      expect(result.moderationResult.isApproved).toBe(true);
    });

    it('should detect content moderation issues', async () => {
      const mockVideoAnalysis: VideoAnalysisResult = {
        keyFrames: [{ timestamp: 0, imageUrl: '', description: 'Test', objects: [] }],
        scenes: [{ startTime: 0, endTime: 10, description: 'Test', sentiment: 'neutral' }],
        duration: 10,
        description: 'Test video',
        tags: ['test'],
        moderationResult: {
          isApproved: false,
          flags: ['inappropriate_content'],
          confidence: 0.85,
        },
      };

      mockGenerateText.mockResolvedValue({
        text: JSON.stringify(mockVideoAnalysis),
      });

      const result = await service.analyzeVideo('https://example.com/video.mp4');

      expect(result.moderationResult.isApproved).toBe(false);
      expect(result.moderationResult.flags).toContain('inappropriate_content');
    });
  });

  // ==========================================================================
  // Multi-Modal Optimization Tests (Requirement 7.3)
  // ==========================================================================

  describe('optimizeContent', () => {
    it('should provide optimization recommendations', async () => {
      const mockOptimization: MultiModalOptimization = {
        textScore: 0.7,
        visualScore: 0.85,
        combinedScore: 0.78,
        recommendations: [
          {
            type: 'text',
            suggestion: 'Add more engaging call-to-action',
            impact: 'high',
            reasoning: 'The image shows excitement but the text is passive',
          },
          {
            type: 'hashtag',
            suggestion: 'Include trending hashtags related to the visual theme',
            impact: 'medium',
            reasoning: 'Visual analysis shows beach content which is trending',
          },
        ],
        predictedEngagement: 0.82,
      };

      mockGenerateFromMultimodal.mockResolvedValue({
        text: JSON.stringify(mockOptimization),
      });

      const result = await service.optimizeContent(
        'https://example.com/beach.jpg',
        'Just another day at the beach'
      );

      expect(result.textScore).toBe(0.7);
      expect(result.visualScore).toBe(0.85);
      expect(result.recommendations).toHaveLength(2);
      expect(result.predictedEngagement).toBe(0.82);
    });

    it('should optimize for different target metrics', async () => {
      const mockOptimization: MultiModalOptimization = {
        textScore: 0.6,
        visualScore: 0.9,
        combinedScore: 0.75,
        recommendations: [
          {
            type: 'text',
            suggestion: 'Add product link for conversion',
            impact: 'high',
            reasoning: 'Image shows product but no purchase path',
          },
        ],
        predictedEngagement: 0.7,
      };

      mockGenerateFromMultimodal.mockResolvedValue({
        text: JSON.stringify(mockOptimization),
      });

      const result = await service.optimizeContent(
        'https://example.com/product.jpg',
        'Check out this product',
        { targetMetric: 'conversion' }
      );

      expect(result.recommendations[0].suggestion).toContain('conversion');
    });
  });

  describe('predictPerformance', () => {
    it('should predict content performance', async () => {
      const mockPrediction = {
        score: 0.85,
        factors: [
          'High visual appeal',
          'Trending hashtags',
          'Optimal posting time',
        ],
      };

      mockGenerateFromMultimodal.mockResolvedValue({
        text: JSON.stringify(mockPrediction),
      });

      const result = await service.predictPerformance(
        'https://example.com/image.jpg',
        'Amazing sunset vibes',
        ['#sunset', '#vibes', '#nature']
      );

      expect(result.score).toBe(0.85);
      expect(result.factors).toHaveLength(3);
    });
  });

  // ==========================================================================
  // Edge Cases and Error Handling
  // ==========================================================================

  describe('Edge Cases', () => {
    it('should handle empty image URL gracefully', async () => {
      mockGenerateFromMultimodal.mockRejectedValue(
        new Error('Invalid image URL')
      );

      await expect(service.analyzeImage('')).rejects.toThrow();
    });

    it('should handle API errors gracefully', async () => {
      mockGenerateFromMultimodal.mockRejectedValue(
        new Error('API rate limit exceeded')
      );

      await expect(
        service.generateCaption('https://example.com/image.jpg')
      ).rejects.toThrow('API rate limit exceeded');
    });

    it('should handle malformed JSON response', async () => {
      mockGenerateFromMultimodal.mockResolvedValue({
        text: 'not valid json',
      });

      await expect(
        service.analyzeImage('https://example.com/image.jpg')
      ).rejects.toThrow();
    });
  });
});
