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
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", { value: true });
exports.KycAmlService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("@infrastructure/database/prisma.service");
const stripe_service_1 = require("@infrastructure/payment/stripe.service");
const event_emitter_1 = require("@nestjs/event-emitter");
const storage_service_1 = require("@infrastructure/storage/storage.service");
const client_1 = require("@prisma/client");
const date_fns_1 = require("date-fns");
let KycAmlService = class KycAmlService {
    prisma;
    stripe;
    eventEmitter;
    storage;
    kycThresholds = {
        basic: 1000, // Vérification basique
        enhanced: 10000, // Vérification approfondie
        full: 50000 // Vérification complète
    };
    amlRules = {
        largeTransaction: 10000,
        rapidTransactions: { count: 10, window: 3600000 }, // 10 transactions en 1h
        unusualPattern: 0.8, // Score d'anomalie
        highRiskCountries: ['IR', 'KP', 'SY'], // Pays à haut risque
        suspiciousKeywords: ['bitcoin', 'crypto', 'anonymous', 'untraceable']
    };
    constructor(prisma, stripe, eventEmitter, storage) {
        this.prisma = prisma;
        this.stripe = stripe;
        this.eventEmitter = eventEmitter;
        this.storage = storage;
    }
    /**
     * Initie la vérification KYC pour un créateur
     */
    async initiateKycVerification(creatorId, dto) {
        const creator = await this.prisma.creator.findUnique({
            where: { id: creatorId },
            include: { settings: true }
        });
        if (!creator) {
            throw new Error('Creator not found');
        }
        // Déterminer le niveau de vérification requis
        const verificationLevel = this.determineVerificationLevel(creator.totalRevenue.toNumber());
        // Si Stripe Connect est utilisé, initier la vérification Stripe
        if (creator.stripeAccountId) {
            const accountLink = await this.stripe.accountLinks.create({
                account: creator.stripeAccountId,
                refresh_url: `${process.env.APP_URL}/kyc/refresh`,
                return_url: `${process.env.APP_URL}/kyc/complete`,
                type: 'account_onboarding'
            });
            // Mettre à jour le statut
            await this.prisma.creator.update({
                where: { id: creatorId },
                data: { kycStatus: client_1.KycStatus.IN_REVIEW }
            });
            return {
                verificationId: creator.stripeAccountId,
                status: client_1.KycStatus.IN_REVIEW,
                requiredDocuments: this.getRequiredDocuments(verificationLevel),
                stripeVerificationUrl: accountLink.url
            };
        }
        // Vérification manuelle
        const verificationId = `kyc_${Date.now()}`;
        // Créer l'enregistrement de vérification
        await this.createVerificationRecord(creatorId, verificationId, dto);
        return {
            verificationId,
            status: client_1.KycStatus.IN_REVIEW,
            requiredDocuments: this.getRequiredDocuments(verificationLevel)
        };
    }
    /**
     * Upload un document KYC
     */
    async uploadKycDocument(creatorId, dto, file) {
        // Valider le type de document
        if (!this.isValidDocumentType(dto.documentType)) {
            throw new Error('Invalid document type');
        }
        // Stocker le document de manière sécurisée
        const documentPath = `kyc/${creatorId}/${dto.documentType}_${Date.now()}`;
        const url = await this.storage.uploadSecure(file, documentPath, {
            encryption: true,
            access: 'private'
        });
        const document = {
            type: dto.documentType,
            status: 'pending',
            url,
            uploadedAt: new Date(),
            metadata: dto.metadata
        };
        // Stocker les métadonnées du document
        await this.storeDocumentRecord(creatorId, document);
        // Si utilisation d'un service de vérification tiers
        if (process.env.KYC_PROVIDER === 'jumio' || process.env.KYC_PROVIDER === 'onfido') {
            await this.submitToVerificationProvider(creatorId, document);
        }
        this.eventEmitter.emit('kyc.document.uploaded', {
            creatorId,
            documentType: dto.documentType
        });
        return document;
    }
    /**
     * Effectue un screening AML
     */
    async performAmlScreening(creatorId, dto) {
        const creator = await this.prisma.creator.findUnique({
            where: { id: creatorId }
        });
        if (!creator) {
            throw new Error('Creator not found');
        }
        const issues = [];
        const recommendations = [];
        // 1. Vérifier les listes de sanctions
        const sanctionCheck = await this.checkSanctionLists(creator);
        if (sanctionCheck.matches.length > 0) {
            issues.push('Name matches sanctioned entity list');
            recommendations.push('Manual review required');
        }
        // 2. Vérifier les PEP (Personnes Politiquement Exposées)
        const pepCheck = await this.checkPepStatus(creator);
        if (pepCheck.isPep) {
            issues.push('Identified as Politically Exposed Person');
            recommendations.push('Enhanced due diligence required');
        }
        // 3. Analyser les patterns de transactions
        const transactionAnalysis = await this.analyzeTransactionPatterns(creatorId);
        if (transactionAnalysis.suspiciousPatterns.length > 0) {
            issues.push(...transactionAnalysis.suspiciousPatterns);
            recommendations.push('Review transaction history');
        }
        // 4. Vérifier la géolocalisation
        const geoCheck = await this.checkGeographicRisk(creator);
        if (geoCheck.isHighRisk) {
            issues.push(`High-risk jurisdiction: ${geoCheck.country}`);
            recommendations.push('Additional verification required');
        }
        // 5. Calculer le score de risque global
        const riskScore = this.calculateAmlRiskScore({
            sanctionMatches: sanctionCheck.matches.length,
            isPep: pepCheck.isPep,
            suspiciousPatterns: transactionAnalysis.suspiciousPatterns.length,
            geoRisk: geoCheck.isHighRisk
        });
        const riskLevel = this.getRiskLevel(riskScore);
        // Créer le rapport AML
        await this.createAmlReport(creatorId, {
            screeningDate: new Date(),
            riskLevel,
            issues,
            sanctionCheck,
            pepCheck,
            transactionAnalysis,
            geoCheck
        });
        return {
            passed: issues.length === 0,
            riskLevel,
            issues,
            recommendations
        };
    }
    /**
     * Évalue le profil de risque d'un créateur
     */
    async assessRiskProfile(creatorId, dto) {
        const [creator, transactionStats, complianceHistory, behaviorAnalysis] = await Promise.all([
            this.prisma.creator.findUnique({
                where: { id: creatorId },
                include: { settings: true }
            }),
            this.getTransactionStatistics(creatorId),
            this.getComplianceHistory(creatorId),
            this.analyzeBehaviorPatterns(creatorId)
        ]);
        if (!creator) {
            throw new Error('Creator not found');
        }
        const factors = [];
        // 1. Facteur de volume de transactions
        const volumeFactor = this.assessVolumeRisk(transactionStats);
        factors.push(volumeFactor);
        // 2. Facteur de vérification KYC
        const kycFactor = this.assessKycRisk(creator.kycStatus);
        factors.push(kycFactor);
        // 3. Facteur géographique
        const geoFactor = await this.assessGeographicRisk(creator);
        factors.push(geoFactor);
        // 4. Facteur de comportement
        const behaviorFactor = this.assessBehaviorRisk(behaviorAnalysis);
        factors.push(behaviorFactor);
        // 5. Facteur d'historique de conformité
        const complianceFactor = this.assessComplianceRisk(complianceHistory);
        factors.push(complianceFactor);
        // Calculer le score total
        const totalScore = factors.reduce((sum, factor) => sum + factor.score, 0);
        const riskLevel = this.getRiskLevel(totalScore);
        const profile = {
            creatorId,
            riskLevel,
            factors,
            score: totalScore,
            lastAssessment: new Date(),
            nextReview: this.calculateNextReviewDate(riskLevel),
            restrictions: this.getRestrictions(riskLevel)
        };
        // Stocker le profil de risque
        await this.storeRiskProfile(profile);
        // Appliquer les restrictions si nécessaire
        if (profile.restrictions && profile.restrictions.length > 0) {
            await this.applyRestrictions(creatorId, profile.restrictions);
        }
        this.eventEmitter.emit('risk.profile.updated', {
            creatorId,
            riskLevel,
            score: totalScore
        });
        return profile;
    }
    /**
     * Signale une activité suspecte
     */
    async reportSuspiciousActivity(dto) {
        const reportId = `sar_${Date.now()}`;
        // Créer le rapport d'activité suspecte
        const report = await this.prisma.auditLog.create({
            data: {
                creatorId: dto.creatorId,
                actorId: dto.reportedBy || 'system',
                actorType: 'SYSTEM',
                action: 'suspicious_activity_report',
                resource: 'compliance',
                resourceId: reportId,
                metadata: {
                    type: dto.activityType,
                    description: dto.description,
                    severity: dto.severity,
                    evidence: dto.evidence,
                    transactionIds: dto.transactionIds
                }
            }
        });
        // Analyser la gravité et déterminer les actions
        const actions = await this.determineSarActions(dto);
        // Exécuter les actions immédiates
        for (const action of actions) {
            await this.executeSarAction(dto.creatorId, action, reportId);
        }
        // Si requis, notifier les autorités
        if (dto.severity === 'critical' || this.requiresRegulatorNotification(dto)) {
            await this.notifyFinancialIntelligenceUnit(report, dto);
        }
        this.eventEmitter.emit('suspicious.activity.reported', {
            reportId,
            creatorId: dto.creatorId,
            severity: dto.severity
        });
        return {
            reportId,
            status: 'filed',
            actions
        };
    }
    /**
     * Génère un rapport de conformité
     */
    async generateComplianceReport(creatorId, startDate, endDate) {
        const [creator, transactions, verificationHistory, riskAssessments, suspiciousReports] = await Promise.all([
            this.prisma.creator.findUnique({ where: { id: creatorId } }),
            this.getTransactionsForPeriod(creatorId, startDate, endDate),
            this.getVerificationHistory(creatorId, startDate, endDate),
            this.getRiskAssessmentHistory(creatorId, startDate, endDate),
            this.getSuspiciousActivityReports(creatorId, startDate, endDate)
        ]);
        if (!creator) {
            throw new Error('Creator not found');
        }
        // Analyser les transactions
        const transactionSummary = this.summarizeTransactions(transactions);
        // Identifier les red flags
        const redFlags = await this.identifyRedFlags(creatorId, transactions, suspiciousReports);
        // Calculer les métriques de conformité
        const complianceMetrics = this.calculateComplianceMetrics({
            verificationHistory,
            riskAssessments,
            suspiciousReports,
            redFlags
        });
        const report = {
            reportId: `compliance_${Date.now()}`,
            creatorId,
            period: { start: startDate, end: endDate },
            generatedAt: new Date(),
            kycStatus: {
                current: creator.kycStatus,
                lastVerified: verificationHistory[0]?.verifiedAt,
                documents: verificationHistory.length
            },
            amlStatus: {
                riskLevel: riskAssessments[0]?.riskLevel || 'unknown',
                lastScreening: riskAssessments[0]?.assessmentDate,
                alerts: redFlags.length
            },
            transactionSummary,
            suspiciousActivities: suspiciousReports,
            redFlags,
            complianceMetrics,
            recommendations: this.generateComplianceRecommendations(creator, complianceMetrics, redFlags)
        };
        // Stocker le rapport
        await this.storeComplianceReport(report);
        return report;
    }
    /**
     * Vérifie la conformité pour les taxes
     */
    async verifyTaxCompliance(creatorId) {
        const creator = await this.prisma.creator.findUnique({
            where: { id: creatorId },
            include: { settings: true }
        });
        if (!creator) {
            throw new Error('Creator not found');
        }
        const issues = [];
        const requiredForms = [];
        // Vérifier le seuil de déclaration
        const yearlyRevenue = await this.getYearlyRevenue(creatorId);
        if (yearlyRevenue > 600) { // Seuil US pour 1099
            if (!creator.settings?.w9Submitted) {
                issues.push('W-9 form not submitted');
                requiredForms.push('W-9');
            }
        }
        if (yearlyRevenue > 20000) { // Seuil pour 1099-K
            if (!creator.settings?.taxFormSubmitted) {
                issues.push('Tax information incomplete');
                requiredForms.push('1099-K');
            }
        }
        // Vérifier les exigences internationales
        if (creator.locale !== 'en-US') {
            const internationalCompliance = await this.checkInternationalTaxCompliance(creator);
            issues.push(...internationalCompliance.issues);
            requiredForms.push(...internationalCompliance.forms);
        }
        return {
            compliant: issues.length === 0,
            issues,
            requiredForms
        };
    }
    // Méthodes privées
    determineVerificationLevel(totalRevenue) {
        if (totalRevenue >= this.kycThresholds.full) {
            return 'full';
        }
        else if (totalRevenue >= this.kycThresholds.enhanced) {
            return 'enhanced';
        }
        else if (totalRevenue >= this.kycThresholds.basic) {
            return 'basic';
        }
        return 'none';
    }
    getRequiredDocuments(level) {
        const documents = {
            basic: ['government_id'],
            enhanced: ['government_id', 'proof_of_address'],
            full: ['government_id', 'proof_of_address', 'bank_statement', 'business_license']
        };
        return documents[level] || [];
    }
    isValidDocumentType(type) {
        const validTypes = [
            'passport',
            'drivers_license',
            'national_id',
            'utility_bill',
            'bank_statement',
            'business_license'
        ];
        return validTypes.includes(type);
    }
    async createVerificationRecord(creatorId, verificationId, dto) {
        await this.prisma.auditLog.create({
            data: {
                creatorId,
                actorId: creatorId,
                actorType: 'CREATOR',
                action: 'kyc.verification.initiated',
                resource: 'kyc',
                resourceId: verificationId,
                metadata: {
                    type: dto.verificationType,
                    level: dto.level
                }
            }
        });
    }
    async storeDocumentRecord(creatorId, document) {
        await this.prisma.auditLog.create({
            data: {
                creatorId,
                actorId: creatorId,
                actorType: 'CREATOR',
                action: 'kyc.document.uploaded',
                resource: 'kyc_document',
                resourceId: document.url,
                metadata: document
            }
        });
    }
    async submitToVerificationProvider(creatorId, document) {
        // Intégration avec le fournisseur de vérification
        // (Jumio, Onfido, etc.)
        console.log('Submitting document to verification provider:', {
            creatorId,
            documentType: document.type
        });
    }
    async checkSanctionLists(creator) {
        // Vérifier contre les listes de sanctions
        // (OFAC, UN, EU, etc.)
        // Implémentation simplifiée
        return { matches: [] };
    }
    async checkPepStatus(creator) {
        // Vérifier le statut PEP
        // Implémentation simplifiée
        return { isPep: false };
    }
    async analyzeTransactionPatterns(creatorId) {
        const thirtyDaysAgo = (0, date_fns_1.subDays)(new Date(), 30);
        const transactions = await this.prisma.transaction.findMany({
            where: {
                creatorId,
                createdAt: { gte: thirtyDaysAgo }
            }
        });
        const suspiciousPatterns = [];
        const patterns = [];
        // Analyser les montants
        const largeTransactions = transactions.filter(t => t.amount.toNumber() > this.amlRules.largeTransaction);
        if (largeTransactions.length > 0) {
            suspiciousPatterns.push(`${largeTransactions.length} large transactions detected`);
        }
        // Analyser la fréquence
        const hourlyGroups = this.groupTransactionsByHour(transactions);
        for (const [hour, txs] of Object.entries(hourlyGroups)) {
            if (txs.length >= this.amlRules.rapidTransactions.count) {
                suspiciousPatterns.push(`Rapid transaction pattern detected: ${txs.length} transactions in one hour`);
            }
        }
        return { suspiciousPatterns, patterns };
    }
    async checkGeographicRisk(creator) {
        // Vérifier le risque géographique
        // Implémentation simplifiée basée sur l'IP ou l'adresse
        return { isHighRisk: false };
    }
    calculateAmlRiskScore(factors) {
        let score = 0;
        if (factors.sanctionMatches > 0)
            score += 100;
        if (factors.isPep)
            score += 50;
        score += factors.suspiciousPatterns * 20;
        if (factors.geoRisk)
            score += 30;
        return score;
    }
    getRiskLevel(score) {
        if (score >= 100)
            return 'critical';
        if (score >= 50)
            return 'high';
        if (score >= 20)
            return 'medium';
        return 'low';
    }
    async createAmlReport(creatorId, data) {
        await this.prisma.auditLog.create({
            data: {
                creatorId,
                actorId: 'system',
                actorType: 'SYSTEM',
                action: 'aml.screening.completed',
                resource: 'aml_report',
                resourceId: `aml_${Date.now()}`,
                metadata: data
            }
        });
    }
    async getTransactionStatistics(creatorId) {
        const result = await this.prisma.transaction.aggregate({
            where: { creatorId },
            _sum: { amount: true },
            _count: true,
            _avg: { amount: true }
        });
        return {
            totalVolume: result._sum.amount?.toNumber() || 0,
            transactionCount: result._count,
            averageAmount: result._avg.amount?.toNumber() || 0
        };
    }
    async getComplianceHistory(creatorId) {
        return this.prisma.auditLog.findMany({
            where: {
                creatorId,
                action: { in: ['kyc.verification.completed', 'aml.screening.completed'] }
            },
            orderBy: { createdAt: 'desc' },
            take: 10
        });
    }
    async analyzeBehaviorPatterns(creatorId) {
        // Analyser les patterns de comportement
        return {
            normalBehavior: true,
            anomalies: []
        };
    }
    assessVolumeRisk(stats) {
        const monthlyVolume = stats.totalVolume / 12; // Approximation
        let score = 0;
        if (monthlyVolume > 100000)
            score = 80;
        else if (monthlyVolume > 50000)
            score = 60;
        else if (monthlyVolume > 20000)
            score = 40;
        else if (monthlyVolume > 10000)
            score = 20;
        else
            score = 10;
        return {
            category: 'Transaction Volume',
            factor: 'Monthly transaction volume',
            weight: 1.5,
            score,
            details: `$${monthlyVolume.toFixed(2)} monthly volume`
        };
    }
    assessKycRisk(status) {
        const scores = {
            PENDING: 50,
            IN_REVIEW: 40,
            APPROVED: 10,
            REJECTED: 100,
            EXPIRED: 80
        };
        return {
            category: 'KYC Verification',
            factor: 'Identity verification status',
            weight: 2.0,
            score: scores[status] || 50,
            details: `KYC status: ${status}`
        };
    }
    async assessGeographicRisk(creator) {
        // Évaluation simplifiée basée sur le pays
        const highRiskCountries = this.amlRules.highRiskCountries;
        const isHighRisk = false; // À implémenter avec la vraie géolocalisation
        return {
            category: 'Geographic',
            factor: 'Location risk',
            weight: 1.2,
            score: isHighRisk ? 80 : 10,
            details: 'Geographic risk assessment'
        };
    }
    assessBehaviorRisk(analysis) {
        return {
            category: 'Behavior',
            factor: 'Transaction patterns',
            weight: 1.0,
            score: analysis.anomalies.length * 20,
            details: `${analysis.anomalies.length} anomalies detected`
        };
    }
    assessComplianceRisk(history) {
        const violations = history.filter(h => h.metadata?.violation).length;
        return {
            category: 'Compliance History',
            factor: 'Past compliance issues',
            weight: 1.3,
            score: violations * 30,
            details: `${violations} compliance violations`
        };
    }
    calculateNextReviewDate(riskLevel) {
        const reviewIntervals = {
            low: 365, // 1 an
            medium: 180, // 6 mois
            high: 90, // 3 mois
            critical: 30 // 1 mois
        };
        const days = reviewIntervals[riskLevel] || 180;
        return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    }
    getRestrictions(riskLevel) {
        const restrictions = {
            low: [],
            medium: ['enhanced_monitoring'],
            high: ['enhanced_monitoring', 'payout_review', 'lower_limits'],
            critical: ['enhanced_monitoring', 'payout_hold', 'manual_review', 'account_freeze']
        };
        return restrictions[riskLevel] || [];
    }
    async storeRiskProfile(profile) {
        await this.prisma.auditLog.create({
            data: {
                creatorId: profile.creatorId,
                actorId: 'system',
                actorType: 'SYSTEM',
                action: 'risk.assessment.completed',
                resource: 'risk_profile',
                resourceId: profile.creatorId,
                metadata: profile
            }
        });
    }
    async applyRestrictions(creatorId, restrictions) {
        // Appliquer les restrictions
        for (const restriction of restrictions) {
            switch (restriction) {
                case 'payout_hold':
                    await this.holdPayouts(creatorId);
                    break;
                case 'account_freeze':
                    await this.freezeAccount(creatorId);
                    break;
                case 'lower_limits':
                    await this.lowerTransactionLimits(creatorId);
                    break;
            }
        }
    }
    async determineSarActions(dto) {
        const actions = ['log_activity', 'notify_compliance'];
        if (dto.severity === 'high' || dto.severity === 'critical') {
            actions.push('freeze_account', 'hold_payouts');
        }
        if (dto.severity === 'critical') {
            actions.push('notify_authorities');
        }
        return actions;
    }
    async executeSarAction(creatorId, action, reportId) {
        switch (action) {
            case 'freeze_account':
                await this.freezeAccount(creatorId);
                break;
            case 'hold_payouts':
                await this.holdPayouts(creatorId);
                break;
            case 'notify_compliance':
                await this.notifyComplianceTeam(creatorId, reportId);
                break;
        }
    }
    requiresRegulatorNotification(dto) {
        // Déterminer si une notification réglementaire est requise
        return dto.activityType === 'money_laundering' ||
            dto.activityType === 'terrorist_financing' ||
            (dto.evidence?.totalAmount && dto.evidence.totalAmount > 10000);
    }
    async notifyFinancialIntelligenceUnit(report, dto) {
        // Notifier l'unité de renseignement financier
        console.log('Notifying FIU:', {
            reportId: report.id,
            severity: dto.severity
        });
    }
    async getTransactionsForPeriod(creatorId, startDate, endDate) {
        return this.prisma.transaction.findMany({
            where: {
                creatorId,
                createdAt: {
                    gte: startDate,
                    lte: endDate
                }
            }
        });
    }
    async getVerificationHistory(creatorId, startDate, endDate) {
        return this.prisma.auditLog.findMany({
            where: {
                creatorId,
                action: { startsWith: 'kyc.' },
                createdAt: {
                    gte: startDate,
                    lte: endDate
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    }
    async getRiskAssessmentHistory(creatorId, startDate, endDate) {
        return this.prisma.auditLog.findMany({
            where: {
                creatorId,
                action: 'risk.assessment.completed',
                createdAt: {
                    gte: startDate,
                    lte: endDate
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    }
    async getSuspiciousActivityReports(creatorId, startDate, endDate) {
        return this.prisma.auditLog.findMany({
            where: {
                creatorId,
                action: 'suspicious_activity_report',
                createdAt: {
                    gte: startDate,
                    lte: endDate
                }
            }
        });
    }
    summarizeTransactions(transactions) {
        const total = transactions.reduce((sum, t) => sum + t.amount.toNumber(), 0);
        const byType = transactions.reduce((acc, t) => {
            acc[t.type] = (acc[t.type] || 0) + t.amount.toNumber();
            return acc;
        }, {});
        return {
            count: transactions.length,
            totalVolume: total,
            averageAmount: transactions.length > 0 ? total / transactions.length : 0,
            byType
        };
    }
    async identifyRedFlags(creatorId, transactions, suspiciousReports) {
        const redFlags = [];
        // Transactions importantes
        const largeTransactions = transactions.filter(t => t.amount.toNumber() > this.amlRules.largeTransaction);
        if (largeTransactions.length > 5) {
            redFlags.push(`${largeTransactions.length} large transactions in period`);
        }
        // Patterns suspects
        const rapidGroups = this.identifyRapidTransactions(transactions);
        if (rapidGroups.length > 0) {
            redFlags.push(`${rapidGroups.length} rapid transaction patterns detected`);
        }
        // Rapports d'activité suspecte
        if (suspiciousReports.length > 0) {
            redFlags.push(`${suspiciousReports.length} suspicious activity reports filed`);
        }
        return redFlags;
    }
    calculateComplianceMetrics(data) {
        return {
            verificationRate: 100, // À calculer
            screeningFrequency: 'monthly',
            alertsResolved: 95, // À calculer
            falsePositiveRate: 5 // À calculer
        };
    }
    generateComplianceRecommendations(creator, metrics, redFlags) {
        const recommendations = [];
        if (creator.kycStatus !== client_1.KycStatus.APPROVED) {
            recommendations.push('Complete KYC verification');
        }
        if (redFlags.length > 3) {
            recommendations.push('Schedule enhanced due diligence review');
        }
        if (metrics.alertsResolved < 90) {
            recommendations.push('Improve alert resolution time');
        }
        return recommendations;
    }
    async storeComplianceReport(report) {
        await this.prisma.auditLog.create({
            data: {
                creatorId: report.creatorId,
                actorId: 'system',
                actorType: 'SYSTEM',
                action: 'compliance.report.generated',
                resource: 'compliance_report',
                resourceId: report.reportId,
                metadata: report
            }
        });
    }
    async getYearlyRevenue(creatorId) {
        const yearStart = new Date();
        yearStart.setMonth(0, 1);
        yearStart.setHours(0, 0, 0, 0);
        const result = await this.prisma.transaction.aggregate({
            where: {
                creatorId,
                type: { in: [client_1.TransactionType.SUBSCRIPTION, client_1.TransactionType.PURCHASE] },
                status: 'COMPLETED',
                createdAt: { gte: yearStart }
            },
            _sum: { amount: true }
        });
        return result._sum.amount?.toNumber() || 0;
    }
    async checkInternationalTaxCompliance(creator) {
        const issues = [];
        const forms = [];
        // Logique simplifiée pour la conformité fiscale internationale
        if (creator.locale.startsWith('en-GB')) {
            forms.push('UTR'); // UK tax reference
        }
        else if (creator.locale.startsWith('fr')) {
            forms.push('SIRET'); // French business number
        }
        return { issues, forms };
    }
    groupTransactionsByHour(transactions) {
        const groups = {};
        transactions.forEach(tx => {
            const hourKey = tx.createdAt.toISOString().slice(0, 13);
            if (!groups[hourKey]) {
                groups[hourKey] = [];
            }
            groups[hourKey].push(tx);
        });
        return groups;
    }
    identifyRapidTransactions(transactions) {
        const groups = this.groupTransactionsByHour(transactions);
        return Object.entries(groups)
            .filter(([_, txs]) => txs.length >= this.amlRules.rapidTransactions.count)
            .map(([hour, txs]) => ({ hour, count: txs.length }));
    }
    async holdPayouts(creatorId) {
        // Implémenter la suspension des paiements
        console.log(`Holding payouts for creator: ${creatorId}`);
    }
    async freezeAccount(creatorId) {
        // Implémenter le gel du compte
        console.log(`Freezing account for creator: ${creatorId}`);
    }
    async lowerTransactionLimits(creatorId) {
        // Implémenter la réduction des limites
        console.log(`Lowering limits for creator: ${creatorId}`);
    }
    async notifyComplianceTeam(creatorId, reportId) {
        // Notifier l'équipe de conformité
        this.eventEmitter.emit('notification.send', {
            channel: 'email',
            to: process.env.COMPLIANCE_EMAIL,
            subject: 'Suspicious Activity Alert',
            data: { creatorId, reportId }
        });
    }
};
exports.KycAmlService = KycAmlService;
exports.KycAmlService = KycAmlService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object, typeof (_b = typeof stripe_service_1.StripeService !== "undefined" && stripe_service_1.StripeService) === "function" ? _b : Object, event_emitter_1.EventEmitter2, typeof (_c = typeof storage_service_1.StorageService !== "undefined" && storage_service_1.StorageService) === "function" ? _c : Object])
], KycAmlService);
//# sourceMappingURL=kyc-aml.service.js.map