"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = () => ({
    app: {
        env: process.env.NODE_ENV || 'development',
        port: parseInt(process.env.PORT, 10) || 3000,
        host: process.env.HOST || '0.0.0.0',
        name: process.env.APP_NAME || 'Huntaze Platform',
        url: process.env.APP_URL || 'http://localhost:3000',
    },
    database: {
        url: process.env.DATABASE_URL,
        maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS, 10) || 20,
        connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT, 10) || 5000,
    },
    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT, 10) || 6379,
        password: process.env.REDIS_PASSWORD,
        db: parseInt(process.env.REDIS_DB, 10) || 0,
        keyPrefix: process.env.REDIS_KEY_PREFIX || 'huntaze:',
    },
    jwt: {
        secret: process.env.JWT_SECRET,
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
        refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
        issuer: process.env.JWT_ISSUER || 'huntaze-platform',
    },
    stripe: {
        secretKey: process.env.STRIPE_SECRET_KEY,
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
        webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
        connectWebhookSecret: process.env.STRIPE_CONNECT_WEBHOOK_SECRET,
        apiVersion: '2023-10-16',
    },
    aws: {
        region: process.env.AWS_REGION || 'us-east-1',
        s3: {
            bucket: process.env.AWS_S3_BUCKET,
            publicBucket: process.env.AWS_S3_PUBLIC_BUCKET,
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            signedUrlExpiry: parseInt(process.env.AWS_S3_SIGNED_URL_EXPIRY, 10) || 3600,
        },
        ses: {
            fromEmail: process.env.AWS_SES_FROM_EMAIL || 'noreply@huntaze.com',
            replyToEmail: process.env.AWS_SES_REPLY_TO_EMAIL || 'charles@huntaze.com',
        },
    },
    temporal: {
        address: process.env.TEMPORAL_ADDRESS || 'localhost:7233',
        namespace: process.env.TEMPORAL_NAMESPACE || 'default',
        taskQueue: process.env.TEMPORAL_TASK_QUEUE || 'ofm-creators-queue',
    },
    oauth: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackUrl: process.env.GOOGLE_CALLBACK_URL,
        },
        onlyfans: {
            clientId: process.env.ONLYFANS_CLIENT_ID,
            clientSecret: process.env.ONLYFANS_CLIENT_SECRET,
            callbackUrl: process.env.ONLYFANS_CALLBACK_URL,
        },
        patreon: {
            clientId: process.env.PATREON_CLIENT_ID,
            clientSecret: process.env.PATREON_CLIENT_SECRET,
            callbackUrl: process.env.PATREON_CALLBACK_URL,
        },
    },
    cors: {
        origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3001'],
    },
    throttle: {
        ttl: parseInt(process.env.THROTTLE_TTL, 10) || 60,
        limit: parseInt(process.env.THROTTLE_LIMIT, 10) || 100,
    },
    security: {
        bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS, 10) || 10,
        otpExpiry: parseInt(process.env.OTP_EXPIRY, 10) || 300, // 5 minutes
        maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS, 10) || 5,
        lockoutDuration: parseInt(process.env.LOCKOUT_DURATION, 10) || 900, // 15 minutes
    },
    email: {
        provider: process.env.EMAIL_PROVIDER || 'ses',
        templates: {
            welcome: process.env.EMAIL_TEMPLATE_WELCOME,
            passwordReset: process.env.EMAIL_TEMPLATE_PASSWORD_RESET,
            subscription: process.env.EMAIL_TEMPLATE_SUBSCRIPTION,
            payout: process.env.EMAIL_TEMPLATE_PAYOUT,
        },
    },
    sms: {
        provider: process.env.SMS_PROVIDER || 'twilio',
        twilio: {
            accountSid: process.env.TWILIO_ACCOUNT_SID,
            authToken: process.env.TWILIO_AUTH_TOKEN,
            fromNumber: process.env.TWILIO_FROM_NUMBER,
        },
    },
    compliance: {
        kyc: {
            provider: process.env.KYC_PROVIDER || 'stripe',
            verificationThreshold: parseInt(process.env.KYC_VERIFICATION_THRESHOLD, 10) || 10000,
        },
        tax: {
            provider: process.env.TAX_PROVIDER || 'taxjar',
            taxjarApiKey: process.env.TAXJAR_API_KEY,
        },
    },
    analytics: {
        mixpanel: {
            token: process.env.MIXPANEL_TOKEN,
            apiSecret: process.env.MIXPANEL_API_SECRET,
        },
        segment: {
            writeKey: process.env.SEGMENT_WRITE_KEY,
        },
    },
    monitoring: {
        sentry: {
            dsn: process.env.SENTRY_DSN,
            environment: process.env.NODE_ENV,
            tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE) || 0.1,
        },
        datadog: {
            apiKey: process.env.DATADOG_API_KEY,
            appKey: process.env.DATADOG_APP_KEY,
        },
    },
    azureOpenAI: {
        endpoint: process.env.AZURE_OPENAI_ENDPOINT,
        apiKey: process.env.AZURE_OPENAI_API_KEY,
        deploymentName: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-4',
        apiVersion: process.env.AZURE_OPENAI_API_VERSION || '2024-02-01',
        maxTokens: parseInt(process.env.AZURE_OPENAI_MAX_TOKENS || '4096', 10) || 4096,
        temperature: parseFloat(process.env.AZURE_OPENAI_TEMPERATURE || '0.7') || 0.7,
    },
    features: {
        enableSubscriptions: process.env.FEATURE_SUBSCRIPTIONS === 'true',
        enablePaywall: process.env.FEATURE_PAYWALL === 'true',
        enableAppStore: process.env.FEATURE_APP_STORE === 'true',
        enableCampaigns: process.env.FEATURE_CAMPAIGNS === 'true',
        enableAnalytics: process.env.FEATURE_ANALYTICS === 'true',
        enableCompliance: process.env.FEATURE_COMPLIANCE === 'true',
        maintenanceMode: process.env.MAINTENANCE_MODE === 'true',
    },
    limits: {
        maxFileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 104857600, // 100MB
        maxVideoSize: parseInt(process.env.MAX_VIDEO_SIZE, 10) || 1073741824, // 1GB
        maxImagesPerPost: parseInt(process.env.MAX_IMAGES_PER_POST, 10) || 20,
        maxProductsPerCreator: parseInt(process.env.MAX_PRODUCTS_PER_CREATOR, 10) || 1000,
        maxSubscriptionPlans: parseInt(process.env.MAX_SUBSCRIPTION_PLANS, 10) || 10,
    },
    cache: {
        ttl: {
            default: parseInt(process.env.CACHE_TTL_DEFAULT, 10) || 300, // 5 minutes
            user: parseInt(process.env.CACHE_TTL_USER, 10) || 600, // 10 minutes
            product: parseInt(process.env.CACHE_TTL_PRODUCT, 10) || 1800, // 30 minutes
            analytics: parseInt(process.env.CACHE_TTL_ANALYTICS, 10) || 300, // 5 minutes
        },
    },
    logging: {
        level: process.env.LOG_LEVEL || 'info',
        console: process.env.LOG_CONSOLE === 'true',
        file: {
            enabled: process.env.LOG_FILE_ENABLED !== 'false',
            dir: process.env.LOG_FILE_DIR || 'logs',
        },
        handleExceptions: process.env.LOG_HANDLE_EXCEPTIONS !== 'false',
    },
    backup: {
        enabled: process.env.BACKUP_ENABLED === 'true',
        encryptionKey: process.env.BACKUP_ENCRYPTION_KEY,
        s3Bucket: process.env.BACKUP_S3_BUCKET || 'huntaze-backups',
        retention: {
            daily: parseInt(process.env.BACKUP_RETENTION_DAILY, 10) || 7,
            weekly: parseInt(process.env.BACKUP_RETENTION_WEEKLY, 10) || 4,
            monthly: parseInt(process.env.BACKUP_RETENTION_MONTHLY, 10) || 12,
        },
        schedule: {
            daily: process.env.BACKUP_SCHEDULE_DAILY || '0 3 * * *',
            test: process.env.BACKUP_SCHEDULE_TEST || '0 14 * * 0',
        },
    },
});
//# sourceMappingURL=configuration.js.map