import { ConfigService } from '@nestjs/config';
export declare class SmartLinksSecurityService {
    private configService;
    private readonly logger;
    private readonly allowedDomains;
    private readonly blockedIPs;
    private readonly suspiciousUserAgents;
    constructor(configService: ConfigService);
    /**
     * Validate target URL to prevent open redirects
     */
    validateTargetUrl(targetUrl: string): {
        valid: boolean;
        reason?: string;
    };
    /**
     * Check if request should be blocked based on IP/UA
     */
    shouldBlockRequest(ip: string, userAgent?: string): boolean;
    /**
     * Detect bot traffic patterns
     */
    detectBotPattern(ip: string, slug: string, clicksInLastMinute: number): Promise<boolean>;
    /**
     * Add IP to temporary blocklist
     */
    addToBlocklist(ip: string, reason: string, durationMinutes?: number): Promise<void>;
    /**
     * Generate secure random slug
     */
    generateSecureSlug(length?: number): string;
    /**
     * Sanitize user input for metadata
     */
    sanitizeMetadata(metadata: any): Record<string, any>;
    private extractDomain;
    private isAllowedDomain;
    private containsSuspiciousPatterns;
    private isSuspiciousUserAgent;
}
//# sourceMappingURL=smart-links-security.service.d.ts.map