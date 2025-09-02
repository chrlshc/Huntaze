declare const _default: () => {
    app: {
        env: string;
        port: number;
        host: string;
        name: string;
        url: string;
    };
    database: {
        url: string | undefined;
        maxConnections: number;
        connectionTimeout: number;
    };
    redis: {
        host: string;
        port: number;
        password: string | undefined;
        db: number;
        keyPrefix: string;
    };
    jwt: {
        secret: string | undefined;
        expiresIn: string;
        refreshExpiresIn: string;
        issuer: string;
    };
    stripe: {
        secretKey: string | undefined;
        publishableKey: string | undefined;
        webhookSecret: string | undefined;
        connectWebhookSecret: string | undefined;
        apiVersion: string;
    };
    aws: {
        region: string;
        s3: {
            bucket: string | undefined;
            publicBucket: string | undefined;
            accessKeyId: string | undefined;
            secretAccessKey: string | undefined;
            signedUrlExpiry: number;
        };
        ses: {
            fromEmail: string;
            replyToEmail: string;
        };
    };
    temporal: {
        address: string;
        namespace: string;
        taskQueue: string;
    };
    oauth: {
        google: {
            clientId: string | undefined;
            clientSecret: string | undefined;
            callbackUrl: string | undefined;
        };
        onlyfans: {
            clientId: string | undefined;
            clientSecret: string | undefined;
            callbackUrl: string | undefined;
        };
        patreon: {
            clientId: string | undefined;
            clientSecret: string | undefined;
            callbackUrl: string | undefined;
        };
    };
    cors: {
        origin: string[];
    };
    throttle: {
        ttl: number;
        limit: number;
    };
    security: {
        bcryptRounds: number;
        otpExpiry: number;
        maxLoginAttempts: number;
        lockoutDuration: number;
    };
    email: {
        provider: string;
        templates: {
            welcome: string | undefined;
            passwordReset: string | undefined;
            subscription: string | undefined;
            payout: string | undefined;
        };
    };
    sms: {
        provider: string;
        twilio: {
            accountSid: string | undefined;
            authToken: string | undefined;
            fromNumber: string | undefined;
        };
    };
    compliance: {
        kyc: {
            provider: string;
            verificationThreshold: number;
        };
        tax: {
            provider: string;
            taxjarApiKey: string | undefined;
        };
    };
    analytics: {
        mixpanel: {
            token: string | undefined;
            apiSecret: string | undefined;
        };
        segment: {
            writeKey: string | undefined;
        };
    };
    monitoring: {
        sentry: {
            dsn: string | undefined;
            environment: string | undefined;
            tracesSampleRate: number;
        };
        datadog: {
            apiKey: string | undefined;
            appKey: string | undefined;
        };
    };
    azureOpenAI: {
        endpoint: string | undefined;
        apiKey: string | undefined;
        deploymentName: string;
        apiVersion: string;
        maxTokens: number;
        temperature: number;
    };
    features: {
        enableSubscriptions: boolean;
        enablePaywall: boolean;
        enableAppStore: boolean;
        enableCampaigns: boolean;
        enableAnalytics: boolean;
        enableCompliance: boolean;
        maintenanceMode: boolean;
    };
    limits: {
        maxFileSize: number;
        maxVideoSize: number;
        maxImagesPerPost: number;
        maxProductsPerCreator: number;
        maxSubscriptionPlans: number;
    };
    cache: {
        ttl: {
            default: number;
            user: number;
            product: number;
            analytics: number;
        };
    };
    logging: {
        level: string;
        console: boolean;
        file: {
            enabled: boolean;
            dir: string;
        };
        handleExceptions: boolean;
    };
    backup: {
        enabled: boolean;
        encryptionKey: string | undefined;
        s3Bucket: string;
        retention: {
            daily: number;
            weekly: number;
            monthly: number;
        };
        schedule: {
            daily: string;
            test: string;
        };
    };
};
export default _default;
//# sourceMappingURL=configuration.d.ts.map