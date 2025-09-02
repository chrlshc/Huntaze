"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AgeVerificationService_1;
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgeVerificationService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("@infrastructure/prisma/prisma.service");
const s3_service_1 = require("@infrastructure/s3/s3.service");
const audit_service_1 = require("@infrastructure/audit/audit.service");
const crypto = __importStar(require("crypto"));
const date_fns_1 = require("date-fns");
let AgeVerificationService = AgeVerificationService_1 = class AgeVerificationService {
    prisma;
    s3;
    auditService;
    logger = new common_1.Logger(AgeVerificationService_1.name);
    MIN_AGE = 18;
    VERIFICATION_METHODS = ['document', 'credit_card', 'third_party', 'self_declaration'];
    constructor(prisma, s3, auditService) {
        this.prisma = prisma;
        this.s3 = s3;
        this.auditService = auditService;
    }
    /**
     * Create age verification record
     */
    async createVerification(userId, dto) {
        // Check if user already has valid verification
        const existing = await this.prisma.ageVerification.findFirst({
            where: {
                userId,
                status: 'verified',
                expiresAt: { gt: new Date() },
            },
        });
        if (existing) {
            return existing;
        }
        // Create new verification
        const verification = await this.prisma.ageVerification.create({
            data: {
                userId,
                method: dto.method,
                status: 'pending',
                metadata: {
                    ip: dto.ipAddress,
                    userAgent: dto.userAgent,
                    jurisdiction: dto.jurisdiction,
                },
            },
        });
        // Audit event
        await this.auditService.log({
            eventType: 'age_verification.initiated',
            actorId: userId,
            resourceType: 'age_verification',
            resourceId: verification.id,
            action: 'create',
            result: 'success',
            metadata: {
                method: dto.method,
                jurisdiction: dto.jurisdiction,
            },
        });
        return verification;
    }
    /**
     * Verify age with document
     */
    async verifyWithDocument(verificationId, documentKey, documentType, userId) {
        const verification = await this.prisma.ageVerification.findUnique({
            where: { id: verificationId },
        });
        if (!verification || verification.userId !== userId) {
            throw new common_1.BadRequestException('Verification not found');
        }
        if (verification.status !== 'pending') {
            throw new common_1.BadRequestException('Verification already processed');
        }
        try {
            // In production, integrate with document verification service
            // For now, simulate verification process
            const isValid = await this.validateDocument(documentKey, documentType);
            if (!isValid) {
                throw new common_1.BadRequestException('Document validation failed');
            }
            // Extract date of birth from document (simulated)
            const dateOfBirth = new Date('2000-01-01'); // This would come from OCR/verification service
            const age = this.calculateAge(dateOfBirth);
            if (age < this.MIN_AGE) {
                await this.failVerification(verificationId, 'underage', userId);
                throw new common_1.ForbiddenException('User does not meet minimum age requirement');
            }
            // Update verification
            const updated = await this.prisma.ageVerification.update({
                where: { id: verificationId },
                data: {
                    status: 'verified',
                    verifiedAt: new Date(),
                    expiresAt: (0, date_fns_1.addYears)(new Date(), 1), // Valid for 1 year
                    documentHash: this.hashDocument(documentKey),
                    metadata: {
                        ...verification.metadata,
                        documentType,
                        dateOfBirth: dateOfBirth.toISOString(),
                        age,
                    },
                },
            });
            // Delete document after verification
            await this.s3.deleteObject(documentKey);
            // Audit success
            await this.auditService.log({
                eventType: 'age_verification.verified',
                actorId: userId,
                resourceType: 'age_verification',
                resourceId: verificationId,
                action: 'verify',
                result: 'success',
                metadata: {
                    method: 'document',
                    documentType,
                },
            });
            return updated;
        }
        catch (error) {
            // Audit failure
            await this.auditService.log({
                eventType: 'age_verification.failed',
                actorId: userId,
                resourceType: 'age_verification',
                resourceId: verificationId,
                action: 'verify',
                result: 'failure',
                errorMessage: error.message,
            });
            throw error;
        }
    }
    /**
     * Verify with credit card
     */
    async verifyWithCreditCard(verificationId, last4, userId) {
        const verification = await this.prisma.ageVerification.findUnique({
            where: { id: verificationId },
        });
        if (!verification || verification.userId !== userId) {
            throw new common_1.BadRequestException('Verification not found');
        }
        // Credit card possession implies 18+ in most jurisdictions
        const updated = await this.prisma.ageVerification.update({
            where: { id: verificationId },
            data: {
                status: 'verified',
                verifiedAt: new Date(),
                expiresAt: (0, date_fns_1.addYears)(new Date(), 1),
                metadata: {
                    ...verification.metadata,
                    verificationMethod: 'credit_card',
                    last4,
                },
            },
        });
        await this.auditService.log({
            eventType: 'age_verification.verified',
            actorId: userId,
            resourceType: 'age_verification',
            resourceId: verificationId,
            action: 'verify',
            result: 'success',
            metadata: { method: 'credit_card' },
        });
        return updated;
    }
    /**
     * Verify with third-party service
     */
    async verifyWithThirdParty(verificationId, provider, token, userId) {
        const verification = await this.prisma.ageVerification.findUnique({
            where: { id: verificationId },
        });
        if (!verification || verification.userId !== userId) {
            throw new common_1.BadRequestException('Verification not found');
        }
        // Integrate with third-party verification services
        // Examples: Jumio, Onfido, Trulioo
        const providerResult = await this.callThirdPartyProvider(provider, token);
        if (!providerResult.verified || providerResult.age < this.MIN_AGE) {
            await this.failVerification(verificationId, 'third_party_failed', userId);
            throw new common_1.ForbiddenException('Age verification failed');
        }
        const updated = await this.prisma.ageVerification.update({
            where: { id: verificationId },
            data: {
                status: 'verified',
                verifiedAt: new Date(),
                expiresAt: (0, date_fns_1.addYears)(new Date(), 2), // Third-party verifications valid longer
                metadata: {
                    ...verification.metadata,
                    provider,
                    providerRef: providerResult.referenceId,
                    confidence: providerResult.confidence,
                },
            },
        });
        await this.auditService.log({
            eventType: 'age_verification.verified',
            actorId: userId,
            resourceType: 'age_verification',
            resourceId: verificationId,
            action: 'verify',
            result: 'success',
            metadata: { method: 'third_party', provider },
        });
        return updated;
    }
    /**
     * Self declaration (only for certain jurisdictions)
     */
    async verifySelfDeclaration(verificationId, dateOfBirth, consent, userId) {
        const verification = await this.prisma.ageVerification.findUnique({
            where: { id: verificationId },
        });
        if (!verification || verification.userId !== userId) {
            throw new common_1.BadRequestException('Verification not found');
        }
        // Check if jurisdiction allows self-declaration
        const allowedJurisdictions = ['US-CA', 'US-NY']; // Example
        if (!allowedJurisdictions.includes(verification.metadata?.jurisdiction)) {
            throw new common_1.BadRequestException('Self-declaration not allowed in this jurisdiction');
        }
        if (!consent) {
            throw new common_1.BadRequestException('Consent required for self-declaration');
        }
        const age = this.calculateAge(dateOfBirth);
        if (age < this.MIN_AGE) {
            await this.failVerification(verificationId, 'underage_declared', userId);
            throw new common_1.ForbiddenException('User does not meet minimum age requirement');
        }
        const updated = await this.prisma.ageVerification.update({
            where: { id: verificationId },
            data: {
                status: 'verified',
                verifiedAt: new Date(),
                expiresAt: (0, date_fns_1.addYears)(new Date(), 1),
                metadata: {
                    ...verification.metadata,
                    method: 'self_declaration',
                    declaredAge: age,
                    declaredDob: dateOfBirth.toISOString(),
                    consentTimestamp: new Date().toISOString(),
                },
            },
        });
        await this.auditService.log({
            eventType: 'age_verification.verified',
            actorId: userId,
            resourceType: 'age_verification',
            resourceId: verificationId,
            action: 'verify',
            result: 'success',
            metadata: { method: 'self_declaration', age },
        });
        return updated;
    }
    /**
     * Check if user is verified
     */
    async isUserVerified(userId) {
        const verification = await this.prisma.ageVerification.findFirst({
            where: {
                userId,
                status: 'verified',
                expiresAt: { gt: new Date() },
            },
        });
        return !!verification;
    }
    /**
     * Get verification status
     */
    async getVerificationStatus(userId) {
        const verification = await this.prisma.ageVerification.findFirst({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
        if (!verification) {
            return { status: 'not_verified', required: true };
        }
        if (verification.status === 'verified' && verification.expiresAt > new Date()) {
            return {
                status: 'verified',
                expiresAt: verification.expiresAt,
                method: verification.method,
            };
        }
        if (verification.status === 'failed') {
            return {
                status: 'failed',
                reason: verification.failureReason,
                canRetry: this.canRetryVerification(verification),
            };
        }
        return { status: verification.status };
    }
    /**
     * Block access for unverified users
     */
    async enforceAgeGate(userId, resource) {
        const isVerified = await this.isUserVerified(userId);
        if (!isVerified) {
            // Log attempt
            await this.auditService.log({
                eventType: 'age_gate.blocked',
                actorId: userId,
                resourceType: 'content',
                resourceId: resource,
                action: 'access',
                result: 'blocked',
                metadata: { reason: 'age_not_verified' },
            });
            throw new common_1.ForbiddenException('Age verification required to access this content');
        }
        return true;
    }
    /**
     * Helper methods
     */
    calculateAge(dateOfBirth) {
        const today = new Date();
        let age = today.getFullYear() - dateOfBirth.getFullYear();
        const monthDiff = today.getMonth() - dateOfBirth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
            age--;
        }
        return age;
    }
    async validateDocument(documentKey, documentType) {
        // In production, integrate with document verification service
        // Check for tampered documents, validate formats, etc.
        return true; // Simulated
    }
    hashDocument(documentKey) {
        return crypto.createHash('sha256').update(documentKey).digest('hex');
    }
    async callThirdPartyProvider(provider, token) {
        // Integrate with actual providers
        return {
            verified: true,
            age: 21,
            confidence: 0.95,
            referenceId: `${provider}_${Date.now()}`,
        };
    }
    async failVerification(verificationId, reason, userId) {
        await this.prisma.ageVerification.update({
            where: { id: verificationId },
            data: {
                status: 'failed',
                failureReason: reason,
                failedAt: new Date(),
            },
        });
        // Check for repeated failures
        const failureCount = await this.prisma.ageVerification.count({
            where: {
                userId,
                status: 'failed',
                createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Last 24 hours
            },
        });
        if (failureCount >= 3) {
            // Flag account for review
            await this.auditService.log({
                eventType: 'age_verification.suspicious',
                actorId: userId,
                resourceType: 'user',
                resourceId: userId,
                action: 'flag',
                result: 'flagged',
                metadata: { reason: 'multiple_verification_failures', count: failureCount },
            });
        }
    }
    canRetryVerification(verification) {
        if (!verification.failedAt)
            return true;
        const hoursSinceFail = (Date.now() - verification.failedAt.getTime()) / (1000 * 60 * 60);
        // Allow retry after 24 hours for most failures
        if (verification.failureReason === 'underage') {
            return false; // Cannot retry if declared underage
        }
        return hoursSinceFail >= 24;
    }
    /**
     * Compliance reporting
     */
    async generateComplianceReport(startDate, endDate) {
        const verifications = await this.prisma.ageVerification.groupBy({
            by: ['status', 'method'],
            where: {
                createdAt: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            _count: true,
        });
        const blocked = await this.prisma.auditLog.count({
            where: {
                eventType: 'age_gate.blocked',
                createdAt: {
                    gte: startDate,
                    lte: endDate,
                },
            },
        });
        return {
            period: { start: startDate, end: endDate },
            verifications,
            totalBlocked: blocked,
            generatedAt: new Date(),
        };
    }
};
exports.AgeVerificationService = AgeVerificationService;
exports.AgeVerificationService = AgeVerificationService = AgeVerificationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, typeof (_a = typeof s3_service_1.S3Service !== "undefined" && s3_service_1.S3Service) === "function" ? _a : Object, typeof (_b = typeof audit_service_1.AuditService !== "undefined" && audit_service_1.AuditService) === "function" ? _b : Object])
], AgeVerificationService);
//# sourceMappingURL=age-verification.service.js.map