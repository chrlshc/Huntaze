// Smart Onboarding System - Redis Configuration and Cache Management
import Redis from 'ioredis';
import { CACHE_KEYS, CACHE_TTL } from './database';
// Redis connection configuration (nullable when disabled)
export const REDIS_CONFIG = process.env.REDIS_HOST || process.env.REDIS_URL
    ? {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        db: parseInt(process.env.REDIS_DB || '0'),
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        keepAlive: 30000,
        family: 4,
        keyPrefix: 'huntaze:smart_onboarding:',
    }
    : null;
// Small no-op client for environments without Redis
const createNoopRedis = () => {
    const pipeline = () => ({
        del: () => pipeline(),
        setex: () => pipeline(),
        hset: () => pipeline(),
        expire: () => pipeline(),
        sadd: () => pipeline(),
        exec: async () => [],
    });
    const noop = {
        get: async () => null,
        setex: async () => undefined,
        hset: async () => undefined,
        expire: async () => undefined,
        sadd: async () => undefined,
        pipeline,
        on: () => noop,
    };
    return noop;
};
// Create Redis client instance
export const createRedisClient = () => {
    const redisDisabled = process.env.SMART_ONBOARDING_REDIS_ENABLED === 'false' ||
        (!REDIS_CONFIG && !process.env.REDIS_URL);
    // Skip Redis entirely when disabled or during build
    if (redisDisabled || process.env.NEXT_PHASE === 'phase-production-build') {
        console.warn('Smart Onboarding Redis disabled - using in-memory noop client');
        return createNoopRedis();
    }
    const redis = REDIS_CONFIG ? new Redis(REDIS_CONFIG) : new Redis();
    redis.on('connect', () => {
        console.log('Smart Onboarding Redis client connected');
    });
    redis.on('error', (error) => {
        console.error('Smart Onboarding Redis client error:', error);
    });
    redis.on('close', () => {
        console.log('Smart Onboarding Redis client connection closed');
    });
    return redis;
};
// Cache management utilities
export class SmartOnboardingCache {
    redis;
    constructor(redisClient) {
        this.redis = redisClient || createRedisClient();
    }
    // User-specific cache operations
    async getUserProfile(userId) {
        const key = CACHE_KEYS.USER_PROFILE(userId);
        const cached = await this.redis.get(key);
        return cached ? JSON.parse(cached) : null;
    }
    async setUserProfile(userId, profile) {
        const key = CACHE_KEYS.USER_PROFILE(userId);
        await this.redis.setex(key, CACHE_TTL.USER_PROFILE, JSON.stringify(profile));
    }
    async getUserJourney(userId) {
        const key = CACHE_KEYS.USER_JOURNEY(userId);
        const cached = await this.redis.get(key);
        return cached ? JSON.parse(cached) : null;
    }
    async setUserJourney(userId, journey) {
        const key = CACHE_KEYS.USER_JOURNEY(userId);
        await this.redis.setex(key, CACHE_TTL.USER_JOURNEY, JSON.stringify(journey));
    }
    async getUserPersona(userId) {
        const key = CACHE_KEYS.USER_PERSONA(userId);
        const cached = await this.redis.get(key);
        return cached ? JSON.parse(cached) : null;
    }
    async setUserPersona(userId, persona) {
        const key = CACHE_KEYS.USER_PERSONA(userId);
        await this.redis.setex(key, CACHE_TTL.USER_PERSONA, JSON.stringify(persona));
    }
    async getEngagementScore(userId) {
        const key = CACHE_KEYS.ENGAGEMENT_SCORE(userId);
        const cached = await this.redis.get(key);
        return cached ? parseFloat(cached) : null;
    }
    async setEngagementScore(userId, score) {
        const key = CACHE_KEYS.ENGAGEMENT_SCORE(userId);
        await this.redis.setex(key, CACHE_TTL.ENGAGEMENT_SCORE, score.toString());
    }
    // Content cache operations
    async getLearningPath(pathId) {
        const key = CACHE_KEYS.LEARNING_PATH(pathId);
        const cached = await this.redis.get(key);
        return cached ? JSON.parse(cached) : null;
    }
    async setLearningPath(pathId, path) {
        const key = CACHE_KEYS.LEARNING_PATH(pathId);
        await this.redis.setex(key, CACHE_TTL.LEARNING_PATH, JSON.stringify(path));
    }
    async getStepContent(stepId) {
        const key = CACHE_KEYS.STEP_CONTENT(stepId);
        const cached = await this.redis.get(key);
        return cached ? JSON.parse(cached) : null;
    }
    async setStepContent(stepId, content) {
        const key = CACHE_KEYS.STEP_CONTENT(stepId);
        await this.redis.setex(key, CACHE_TTL.STEP_CONTENT, JSON.stringify(content));
    }
    async getContentRecommendations(userId, stepId) {
        const key = CACHE_KEYS.CONTENT_RECOMMENDATIONS(userId, stepId);
        const cached = await this.redis.get(key);
        return cached ? JSON.parse(cached) : null;
    }
    async setContentRecommendations(userId, stepId, recommendations) {
        const key = CACHE_KEYS.CONTENT_RECOMMENDATIONS(userId, stepId);
        await this.redis.setex(key, CACHE_TTL.CONTENT_RECOMMENDATIONS, JSON.stringify(recommendations));
    }
    // ML model cache operations
    async getModelPredictions(userId, modelType) {
        const key = CACHE_KEYS.MODEL_PREDICTIONS(userId, modelType);
        const cached = await this.redis.get(key);
        return cached ? JSON.parse(cached) : null;
    }
    async setModelPredictions(userId, modelType, predictions) {
        const key = CACHE_KEYS.MODEL_PREDICTIONS(userId, modelType);
        await this.redis.setex(key, CACHE_TTL.MODEL_PREDICTIONS, JSON.stringify(predictions));
    }
    async getSuccessPrediction(userId) {
        const key = CACHE_KEYS.SUCCESS_PREDICTION(userId);
        const cached = await this.redis.get(key);
        return cached ? JSON.parse(cached) : null;
    }
    async setSuccessPrediction(userId, prediction) {
        const key = CACHE_KEYS.SUCCESS_PREDICTION(userId);
        await this.redis.setex(key, CACHE_TTL.SUCCESS_PREDICTION, JSON.stringify(prediction));
    }
    // System cache operations
    async getSystemMetrics() {
        const key = CACHE_KEYS.SYSTEM_METRICS;
        const cached = await this.redis.get(key);
        return cached ? JSON.parse(cached) : null;
    }
    async setSystemMetrics(metrics) {
        const key = CACHE_KEYS.SYSTEM_METRICS;
        await this.redis.setex(key, CACHE_TTL.SYSTEM_METRICS, JSON.stringify(metrics));
    }
    async getActiveExperiments() {
        const key = CACHE_KEYS.ACTIVE_EXPERIMENTS;
        const cached = await this.redis.get(key);
        return cached ? JSON.parse(cached) : null;
    }
    async setActiveExperiments(experiments) {
        const key = CACHE_KEYS.ACTIVE_EXPERIMENTS;
        await this.redis.setex(key, CACHE_TTL.ACTIVE_EXPERIMENTS, JSON.stringify(experiments));
    }
    async getModelPerformance(modelId) {
        const key = CACHE_KEYS.MODEL_PERFORMANCE(modelId);
        const cached = await this.redis.get(key);
        return cached ? JSON.parse(cached) : null;
    }
    async setModelPerformance(modelId, performance) {
        const key = CACHE_KEYS.MODEL_PERFORMANCE(modelId);
        await this.redis.setex(key, CACHE_TTL.MODEL_PERFORMANCE, JSON.stringify(performance));
    }
    // Batch operations
    async invalidateUserCache(userId) {
        const keys = [
            CACHE_KEYS.USER_PROFILE(userId),
            CACHE_KEYS.USER_JOURNEY(userId),
            CACHE_KEYS.USER_PERSONA(userId),
            CACHE_KEYS.ENGAGEMENT_SCORE(userId),
            CACHE_KEYS.SUCCESS_PREDICTION(userId)
        ];
        const pipeline = this.redis.pipeline();
        keys.forEach(key => pipeline.del(key));
        await pipeline.exec();
    }
    async warmupUserCache(userId, data) {
        const pipeline = this.redis.pipeline();
        if (data.profile) {
            pipeline.setex(CACHE_KEYS.USER_PROFILE(userId), CACHE_TTL.USER_PROFILE, JSON.stringify(data.profile));
        }
        if (data.journey) {
            pipeline.setex(CACHE_KEYS.USER_JOURNEY(userId), CACHE_TTL.USER_JOURNEY, JSON.stringify(data.journey));
        }
        if (data.persona) {
            pipeline.setex(CACHE_KEYS.USER_PERSONA(userId), CACHE_TTL.USER_PERSONA, JSON.stringify(data.persona));
        }
        if (data.engagementScore !== undefined) {
            pipeline.setex(CACHE_KEYS.ENGAGEMENT_SCORE(userId), CACHE_TTL.ENGAGEMENT_SCORE, data.engagementScore.toString());
        }
        if (data.successPrediction) {
            pipeline.setex(CACHE_KEYS.SUCCESS_PREDICTION(userId), CACHE_TTL.SUCCESS_PREDICTION, JSON.stringify(data.successPrediction));
        }
        await pipeline.exec();
    }
    // Real-time session management
    async startUserSession(userId, sessionId) {
        const sessionKey = `session:${sessionId}`;
        const userSessionsKey = `user_sessions:${userId}`;
        const pipeline = this.redis.pipeline();
        pipeline.hset(sessionKey, {
            userId,
            startTime: Date.now(),
            lastActivity: Date.now(),
            status: 'active'
        });
        pipeline.expire(sessionKey, 3600); // 1 hour session timeout
        pipeline.sadd(userSessionsKey, sessionId);
        pipeline.expire(userSessionsKey, 86400); // 24 hours
        await pipeline.exec();
    }
    async updateSessionActivity(sessionId) {
        const sessionKey = `session:${sessionId}`;
        await this.redis.hset(sessionKey, 'lastActivity', Date.now());
    }
    async endUserSession(userId, sessionId) {
        const sessionKey = `session:${sessionId}`;
        const userSessionsKey = `user_sessions:${userId}`;
        const pipeline = this.redis.pipeline();
        pipeline.hset(sessionKey, {
            endTime: Date.now(),
            status: 'ended'
        });
        pipeline.srem(userSessionsKey, sessionId);
        pipeline.expire(sessionKey, 300); // Keep ended session for 5 minutes
        await pipeline.exec();
    }
    async getUserActiveSessions(userId) {
        const userSessionsKey = `user_sessions:${userId}`;
        return await this.redis.smembers(userSessionsKey);
    }
    // Real-time event streaming
    async publishEvent(channel, event) {
        await this.redis.publish(channel, JSON.stringify(event));
    }
    async subscribeToEvents(channels, callback) {
        const subscriber = this.redis.duplicate();
        subscriber.subscribe(...channels);
        subscriber.on('message', (channel, message) => {
            try {
                const parsedMessage = JSON.parse(message);
                callback(channel, parsedMessage);
            }
            catch (error) {
                console.error('Error parsing Redis message:', error);
            }
        });
        return subscriber;
    }
    // Rate limiting
    async checkRateLimit(key, limit, windowSeconds) {
        const now = Date.now();
        const windowStart = now - (windowSeconds * 1000);
        const pipeline = this.redis.pipeline();
        pipeline.zremrangebyscore(key, 0, windowStart);
        pipeline.zcard(key);
        pipeline.zadd(key, now, now);
        pipeline.expire(key, windowSeconds);
        const results = await pipeline.exec();
        const currentCount = results?.[1]?.[1] || 0;
        const allowed = currentCount < limit;
        const remaining = Math.max(0, limit - currentCount - 1);
        const resetTime = now + (windowSeconds * 1000);
        return { allowed, remaining, resetTime };
    }
    // Generic cache operations (for base repository use)
    async get(key) {
        return await this.redis.get(key);
    }
    async set(key, value) {
        await this.redis.set(key, value);
    }
    async setex(key, seconds, value) {
        await this.redis.setex(key, seconds, value);
    }
    async del(...keys) {
        if (keys.length > 0) {
            await this.redis.del(...keys);
        }
    }
    async mget(...keys) {
        return await this.redis.mget(...keys);
    }
    async keys(pattern) {
        return await this.redis.keys(pattern);
    }
    pipeline() {
        return this.redis.pipeline();
    }
    // Health check
    async ping() {
        return await this.redis.ping();
    }
    async healthCheck() {
        const start = Date.now();
        try {
            await this.redis.ping();
            const latency = Date.now() - start;
            return { status: 'healthy', latency };
        }
        catch (error) {
            const latency = Date.now() - start;
            return {
                status: 'unhealthy',
                latency,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    // Cleanup and maintenance
    async cleanup() {
        // Clean up expired sessions
        const sessionKeys = await this.redis.keys('session:*');
        const expiredSessions = [];
        for (const key of sessionKeys) {
            const session = await this.redis.hgetall(key);
            if (session.status === 'ended' ||
                (session.lastActivity && Date.now() - parseInt(session.lastActivity) > 3600000)) {
                expiredSessions.push(key);
            }
        }
        if (expiredSessions.length > 0) {
            await this.redis.del(...expiredSessions);
        }
        // Clean up old rate limit keys
        const rateLimitKeys = await this.redis.keys('rate_limit:*');
        for (const key of rateLimitKeys) {
            const ttl = await this.redis.ttl(key);
            if (ttl === -1) { // No expiration set
                await this.redis.expire(key, 3600); // Set 1 hour expiration
            }
        }
    }
    // Disconnect
    async disconnect() {
        await this.redis.quit();
    }
}
// Export singleton instance
export const smartOnboardingCache = new SmartOnboardingCache();
// Export Redis client for direct use
export const redisClient = createRedisClient();
// WebSocket event channels
export const WEBSOCKET_CHANNELS = {
    USER_EVENTS: (userId) => `user:${userId}:events`,
    SYSTEM_EVENTS: 'system:events',
    ENGAGEMENT_ALERTS: 'engagement:alerts',
    INTERVENTION_EVENTS: 'intervention:events',
    CONTENT_UPDATES: 'content:updates',
    ML_MODEL_UPDATES: 'ml:model_updates',
    EXPERIMENT_EVENTS: 'experiments:events'
};
// Cache warming strategies
export const CACHE_WARMING_STRATEGIES = {
    // Warm cache for new user
    NEW_USER: async (userId, cache) => {
        // Pre-load default learning paths
        const defaultPaths = ['content_creator', 'business_user', 'beginner_friendly'];
        for (const pathId of defaultPaths) {
            // This would be loaded from database in real implementation
            await cache.setLearningPath(pathId, { id: pathId, preloaded: true });
        }
    },
    // Warm cache for returning user
    RETURNING_USER: async (userId, cache) => {
        // Pre-load user-specific data
        // This would fetch from database and warm cache
        console.log(`Warming cache for returning user: ${userId}`);
    },
    // Warm cache for high-engagement users
    HIGH_ENGAGEMENT: async (userId, cache) => {
        // Pre-load advanced content and recommendations
        console.log(`Warming cache for high-engagement user: ${userId}`);
    }
};
