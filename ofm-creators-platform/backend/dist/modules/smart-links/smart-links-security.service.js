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
var SmartLinksSecurityService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SmartLinksSecurityService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const url_1 = require("url");
let SmartLinksSecurityService = SmartLinksSecurityService_1 = class SmartLinksSecurityService {
    configService;
    logger = new common_1.Logger(SmartLinksSecurityService_1.name);
    allowedDomains;
    blockedIPs;
    suspiciousUserAgents;
    constructor(configService) {
        this.configService = configService;
        // Initialize allowed domains for open redirect protection
        this.allowedDomains = new Set([
            'huntaze.com',
            'app.huntaze.com',
            'onlyfans.com',
            'fansly.com',
            'patreon.com',
            'loyalfans.com',
            'fanvue.com',
            ...this.configService.get('ALLOWED_REDIRECT_DOMAINS', '').split(',').filter(Boolean),
        ]);
        // Initialize blocked IPs (could be loaded from Redis/DB)
        this.blockedIPs = new Set();
        // Bot user agent patterns
        this.suspiciousUserAgents = [
            /bot/i,
            /crawler/i,
            /spider/i,
            /scraper/i,
            /curl/i,
            /wget/i,
            /python-requests/i,
            /go-http-client/i,
            /postman/i,
            /insomnia/i,
        ];
    }
    /**
     * Validate target URL to prevent open redirects
     */
    validateTargetUrl(targetUrl) {
        try {
            const url = new url_1.URL(targetUrl);
            // Check protocol
            if (!['http:', 'https:'].includes(url.protocol)) {
                return { valid: false, reason: 'Invalid protocol' };
            }
            // Extract domain without subdomain for comparison
            const hostname = url.hostname.toLowerCase();
            const domain = this.extractDomain(hostname);
            // Check if domain is allowed
            if (!this.isAllowedDomain(domain)) {
                this.logger.warn(`Blocked redirect to unauthorized domain: ${domain}`);
                return { valid: false, reason: 'Unauthorized domain' };
            }
            // Check for suspicious patterns
            if (this.containsSuspiciousPatterns(targetUrl)) {
                return { valid: false, reason: 'Suspicious URL pattern' };
            }
            return { valid: true };
        }
        catch (error) {
            return { valid: false, reason: 'Invalid URL format' };
        }
    }
    /**
     * Check if request should be blocked based on IP/UA
     */
    shouldBlockRequest(ip, userAgent) {
        // Check IP blocklist
        if (this.blockedIPs.has(ip)) {
            return true;
        }
        // Check user agent for bots
        if (userAgent && this.isSuspiciousUserAgent(userAgent)) {
            return true;
        }
        return false;
    }
    /**
     * Detect bot traffic patterns
     */
    async detectBotPattern(ip, slug, clicksInLastMinute) {
        // High frequency clicking from same IP
        if (clicksInLastMinute > 60) {
            this.logger.warn(`Bot pattern detected: ${ip} clicked ${clicksInLastMinute} times on ${slug}`);
            await this.addToBlocklist(ip, 'high_frequency_clicks');
            return true;
        }
        return false;
    }
    /**
     * Add IP to temporary blocklist
     */
    async addToBlocklist(ip, reason, durationMinutes = 60) {
        this.blockedIPs.add(ip);
        // Schedule removal
        setTimeout(() => {
            this.blockedIPs.delete(ip);
        }, durationMinutes * 60 * 1000);
        this.logger.log(`Added ${ip} to blocklist for ${durationMinutes}min. Reason: ${reason}`);
        // In production, also update Redis/DB
        // await this.redis.setex(`blocked_ip:${ip}`, durationMinutes * 60, reason);
    }
    /**
     * Generate secure random slug
     */
    generateSecureSlug(length = 6) {
        const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        const randomValues = new Uint8Array(length);
        // Use crypto.getRandomValues for cryptographically secure randomness
        require('crypto').randomFillSync(randomValues);
        let slug = '';
        for (let i = 0; i < length; i++) {
            slug += charset[randomValues[i] % charset.length];
        }
        return slug;
    }
    /**
     * Sanitize user input for metadata
     */
    sanitizeMetadata(metadata) {
        if (!metadata || typeof metadata !== 'object') {
            return {};
        }
        const sanitized = {};
        for (const [key, value] of Object.entries(metadata)) {
            // Only allow safe keys
            if (!/^[a-zA-Z0-9_]+$/.test(key)) {
                continue;
            }
            // Sanitize values
            if (typeof value === 'string') {
                // Remove any potential XSS
                sanitized[key] = value
                    .replace(/[<>]/g, '')
                    .substring(0, 1000); // Limit length
            }
            else if (typeof value === 'number' || typeof value === 'boolean') {
                sanitized[key] = value;
            }
            // Skip complex objects
        }
        return sanitized;
    }
    extractDomain(hostname) {
        const parts = hostname.split('.');
        if (parts.length >= 2) {
            return parts.slice(-2).join('.');
        }
        return hostname;
    }
    isAllowedDomain(domain) {
        return this.allowedDomains.has(domain) ||
            Array.from(this.allowedDomains).some(allowed => domain.endsWith(`.${allowed}`));
    }
    containsSuspiciousPatterns(url) {
        const suspicious = [
            /javascript:/i,
            /data:/i,
            /vbscript:/i,
            /<script/i,
            /onclick=/i,
            /onerror=/i,
            /%0d%0a/i, // CRLF injection
            /\r\n/,
        ];
        return suspicious.some(pattern => pattern.test(url));
    }
    isSuspiciousUserAgent(userAgent) {
        return this.suspiciousUserAgents.some(pattern => pattern.test(userAgent));
    }
};
exports.SmartLinksSecurityService = SmartLinksSecurityService;
exports.SmartLinksSecurityService = SmartLinksSecurityService = SmartLinksSecurityService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], SmartLinksSecurityService);
//# sourceMappingURL=smart-links-security.service.js.map