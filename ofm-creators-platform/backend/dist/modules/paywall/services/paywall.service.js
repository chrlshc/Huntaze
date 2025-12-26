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
var _a, _b, _c, _d;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaywallService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("@infrastructure/database/prisma.service");
const jwt_1 = require("@nestjs/jwt");
const event_emitter_1 = require("@nestjs/event-emitter");
const client_1 = require("@prisma/client");
const stripe_service_1 = require("@infrastructure/payment/stripe.service");
const commission_service_1 = require("@modules/subscription/services/commission.service");
const cache_service_1 = require("@infrastructure/cache/cache.service");
const storage_service_1 = require("@infrastructure/storage/storage.service");
const nanoid_1 = require("nanoid");
const library_1 = require("@prisma/client/runtime/library");
let PaywallService = class PaywallService {
    prisma;
    jwt;
    stripe;
    commission;
    eventEmitter;
    cache;
    storage;
    constructor(prisma, jwt, stripe, commission, eventEmitter, cache, storage) {
        this.prisma = prisma;
        this.jwt = jwt;
        this.stripe = stripe;
        this.commission = commission;
        this.eventEmitter = eventEmitter;
        this.cache = cache;
        this.storage = storage;
    }
    /**
     * Crée un nouveau produit avec paywall
     */
    async createProduct(creatorId, dto) {
        // Validation du type d'accès
        if (dto.accessType === client_1.ContentAccess.PAY_PER_VIEW && !dto.price) {
            throw new Error('Price is required for pay-per-view content');
        }
        // Upload des fichiers si fournis
        let contentUrl = dto.contentUrl;
        let thumbnailUrl = dto.thumbnailUrl;
        let previewUrl = dto.previewUrl;
        if (dto.contentFile) {
            contentUrl = await this.storage.uploadSecure(dto.contentFile, `creators/${creatorId}/products/${(0, nanoid_1.nanoid)()}`);
        }
        if (dto.thumbnailFile) {
            thumbnailUrl = await this.storage.uploadPublic(dto.thumbnailFile, `creators/${creatorId}/thumbnails/${(0, nanoid_1.nanoid)()}`);
        }
        if (dto.previewFile) {
            previewUrl = await this.storage.uploadPublic(dto.previewFile, `creators/${creatorId}/previews/${(0, nanoid_1.nanoid)()}`);
        }
        // Créer le produit
        const product = await this.prisma.product.create({
            data: {
                creatorId,
                type: dto.type,
                title: dto.title,
                description: dto.description,
                price: dto.price,
                currency: dto.currency || 'USD',
                contentUrl,
                thumbnailUrl,
                previewUrl,
                accessType: dto.accessType,
                requiresSubscription: dto.requiresSubscription || false,
                tags: dto.tags || [],
                isPublished: dto.isPublished || false,
                publishedAt: dto.isPublished ? new Date() : null
            }
        });
        this.eventEmitter.emit('product.created', {
            productId: product.id,
            creatorId,
            product
        });
        return product;
    }
    /**
     * Met à jour un produit
     */
    async updateProduct(productId, creatorId, dto) {
        const product = await this.prisma.product.findFirst({
            where: { id: productId, creatorId }
        });
        if (!product) {
            throw new Error('Product not found');
        }
        // Gestion des fichiers mis à jour
        const updateData = { ...dto };
        if (dto.contentFile) {
            // Supprimer l'ancien fichier
            if (product.contentUrl) {
                await this.storage.delete(product.contentUrl);
            }
            updateData.contentUrl = await this.storage.uploadSecure(dto.contentFile, `creators/${creatorId}/products/${(0, nanoid_1.nanoid)()}`);
        }
        if (dto.thumbnailFile) {
            if (product.thumbnailUrl) {
                await this.storage.delete(product.thumbnailUrl);
            }
            updateData.thumbnailUrl = await this.storage.uploadPublic(dto.thumbnailFile, `creators/${creatorId}/thumbnails/${(0, nanoid_1.nanoid)()}`);
        }
        if (dto.previewFile) {
            if (product.previewUrl) {
                await this.storage.delete(product.previewUrl);
            }
            updateData.previewUrl = await this.storage.uploadPublic(dto.previewFile, `creators/${creatorId}/previews/${(0, nanoid_1.nanoid)()}`);
        }
        // Mettre à jour le produit
        const updatedProduct = await this.prisma.product.update({
            where: { id: productId },
            data: {
                ...updateData,
                publishedAt: dto.isPublished && !product.isPublished ? new Date() : product.publishedAt
            }
        });
        // Invalider le cache
        await this.cache.del(`product:${productId}:*`);
        this.eventEmitter.emit('product.updated', {
            productId,
            creatorId,
            product: updatedProduct
        });
        return updatedProduct;
    }
    /**
     * Vérifie l'accès à un produit
     */
    async checkAccess(productId, fanId) {
        const cacheKey = `access:${productId}:${fanId || 'anonymous'}`;
        const cached = await this.cache.get(cacheKey);
        if (cached) {
            return cached;
        }
        const product = await this.prisma.product.findUnique({
            where: { id: productId },
            include: { creator: true }
        });
        if (!product) {
            throw new Error('Product not found');
        }
        // Le créateur a toujours accès
        if (fanId && product.creator.id === fanId) {
            const result = {
                hasAccess: true,
                accessType: 'owner'
            };
            await this.cache.set(cacheKey, result, 300); // Cache 5 min
            return result;
        }
        // Contenu gratuit
        if (product.accessType === client_1.ContentAccess.FREE) {
            const result = {
                hasAccess: true,
                accessType: 'free'
            };
            await this.cache.set(cacheKey, result, 3600); // Cache 1h
            return result;
        }
        // Pas de fanId = pas d'accès pour le contenu payant
        if (!fanId) {
            const result = {
                hasAccess: false,
                accessType: 'none',
                requiresPurchase: true,
                price: product.price?.toNumber(),
                currency: product.currency
            };
            await this.cache.set(cacheKey, result, 300);
            return result;
        }
        // Vérifier l'abonnement si requis
        if (product.accessType === client_1.ContentAccess.SUBSCRIPTION || product.requiresSubscription) {
            const subscription = await this.prisma.subscription.findFirst({
                where: {
                    fanId,
                    creatorId: product.creatorId,
                    status: { in: ['ACTIVE', 'TRIALING'] }
                }
            });
            if (subscription) {
                const result = {
                    hasAccess: true,
                    accessType: 'subscription',
                    expiresAt: subscription.currentPeriodEnd
                };
                await this.cache.set(cacheKey, result, 300);
                return result;
            }
            if (product.accessType === client_1.ContentAccess.SUBSCRIPTION) {
                const result = {
                    hasAccess: false,
                    accessType: 'none',
                    requiresPurchase: false // Nécessite un abonnement, pas un achat
                };
                await this.cache.set(cacheKey, result, 300);
                return result;
            }
        }
        // Vérifier l'achat pour pay-per-view
        if (product.accessType === client_1.ContentAccess.PAY_PER_VIEW || product.accessType === client_1.ContentAccess.MIXED) {
            const purchase = await this.prisma.purchase.findFirst({
                where: {
                    fanId,
                    productId,
                    status: 'COMPLETED'
                }
            });
            if (purchase) {
                const result = {
                    hasAccess: true,
                    accessType: 'purchase'
                };
                await this.cache.set(cacheKey, result, 3600); // Cache 1h
                return result;
            }
            const result = {
                hasAccess: false,
                accessType: 'none',
                requiresPurchase: true,
                price: product.price?.toNumber(),
                currency: product.currency
            };
            await this.cache.set(cacheKey, result, 300);
            return result;
        }
        // Par défaut, pas d'accès
        const result = {
            hasAccess: false,
            accessType: 'none'
        };
        await this.cache.set(cacheKey, result, 300);
        return result;
    }
    /**
     * Génère un lien d'accès sécurisé
     */
    async generateAccessLink(productId, fanId, expiresIn = 3600 // 1 heure par défaut
    ) {
        const accessCheck = await this.checkAccess(productId, fanId);
        if (!accessCheck.hasAccess) {
            throw new Error('Access denied');
        }
        const token = this.jwt.sign({
            productId,
            fanId,
            type: 'content_access'
        }, {
            expiresIn
        });
        return `${process.env.APP_URL}/content/view/${productId}?token=${token}`;
    }
    /**
     * Achète un produit
     */
    async purchaseProduct(fanId, dto) {
        const product = await this.prisma.product.findUnique({
            where: { id: dto.productId },
            include: { creator: true }
        });
        if (!product || !product.isPublished) {
            throw new Error('Product not available');
        }
        if (!product.price || product.accessType === client_1.ContentAccess.FREE) {
            throw new Error('Product is free');
        }
        // Vérifier si déjà acheté
        const existingPurchase = await this.prisma.purchase.findFirst({
            where: {
                fanId,
                productId: dto.productId,
                status: 'COMPLETED'
            }
        });
        if (existingPurchase) {
            throw new Error('Product already purchased');
        }
        // Obtenir le customer Stripe
        const fan = await this.prisma.fan.findUnique({
            where: { id: fanId }
        });
        if (!fan) {
            throw new Error('Fan not found');
        }
        // Créer le payment intent
        const amount = product.price.toNumber();
        const monthlyCommission = await this.getMonthlyCommissionToDate(product.creatorId);
        const commissionResult = this.commission.calculateCommission(product.price, product.creator.commissionTier, monthlyCommission);
        const paymentIntent = await this.stripe.paymentIntents.create({
            amount: Math.round(amount * 100),
            currency: product.currency.toLowerCase(),
            customer: fan.stripeCustomerId || undefined,
            payment_method: dto.paymentMethodId,
            confirm: true,
            metadata: {
                fanId,
                productId: product.id,
                creatorId: product.creatorId,
                type: 'product_purchase'
            },
            application_fee_amount: Math.round(commissionResult.platformFee.toNumber() * 100),
            transfer_data: {
                destination: product.creator.stripeAccountId
            }
        });
        // Créer l'achat
        const purchase = await this.prisma.purchase.create({
            data: {
                fanId,
                productId: product.id,
                amount: product.price,
                currency: product.currency,
                status: paymentIntent.status === 'succeeded' ? 'COMPLETED' : 'PENDING',
                stripePaymentIntentId: paymentIntent.id
            }
        });
        if (paymentIntent.status === 'succeeded') {
            // Créer la transaction
            await this.prisma.transaction.create({
                data: {
                    creatorId: product.creatorId,
                    fanId,
                    type: 'PURCHASE',
                    amount: product.price,
                    currency: product.currency,
                    platformFee: commissionResult.platformFee,
                    platformFeeRate: commissionResult.platformFeeRate,
                    netAmount: commissionResult.netAmount,
                    status: 'COMPLETED',
                    purchaseId: purchase.id,
                    metadata: {
                        productId: product.id,
                        productTitle: product.title,
                        capReached: commissionResult.capReached
                    }
                }
            });
            // Mettre à jour les statistiques
            await this.prisma.product.update({
                where: { id: product.id },
                data: {
                    purchaseCount: { increment: 1 }
                }
            });
            await this.prisma.creator.update({
                where: { id: product.creatorId },
                data: {
                    totalRevenue: { increment: product.price },
                    availableBalance: { increment: commissionResult.netAmount }
                }
            });
            // Invalider le cache d'accès
            await this.cache.del(`access:${product.id}:${fanId}`);
            this.eventEmitter.emit('product.purchased', {
                purchaseId: purchase.id,
                productId: product.id,
                fanId,
                creatorId: product.creatorId
            });
        }
        return purchase;
    }
    /**
     * Obtient le contenu sécurisé
     */
    async getSecureContent(productId, fanId) {
        const accessCheck = await this.checkAccess(productId, fanId);
        if (!accessCheck.hasAccess) {
            throw new Error('Access denied');
        }
        const product = await this.prisma.product.findUnique({
            where: { id: productId },
            include: { creator: { include: { settings: true } } }
        });
        if (!product || !product.contentUrl) {
            throw new Error('Content not found');
        }
        // Incrémenter le compteur de vues
        await this.prisma.product.update({
            where: { id: productId },
            data: { viewCount: { increment: 1 } }
        });
        // Générer une URL signée temporaire
        const signedUrl = await this.storage.getSignedUrl(product.contentUrl, 3600 // 1 heure
        );
        // Vérifier si le watermark est activé
        const watermarked = product.creator.settings?.watermarkContent || false;
        return {
            contentUrl: signedUrl,
            contentType: product.type,
            watermarked
        };
    }
    /**
     * Obtient les statistiques d'un produit
     */
    async getProductStats(productId, creatorId) {
        const product = await this.prisma.product.findFirst({
            where: { id: productId, creatorId }
        });
        if (!product) {
            throw new Error('Product not found');
        }
        // Calculer le revenu total
        const revenue = await this.prisma.transaction.aggregate({
            where: {
                metadata: {
                    path: ['productId'],
                    equals: productId
                },
                status: 'COMPLETED'
            },
            _sum: {
                amount: true
            }
        });
        // Taux de conversion
        const conversionRate = product.viewCount > 0
            ? (product.purchaseCount / product.viewCount) * 100
            : 0;
        // Top pays (simplifié pour cet exemple)
        const topCountries = [
            { country: 'US', count: Math.floor(product.purchaseCount * 0.4) },
            { country: 'UK', count: Math.floor(product.purchaseCount * 0.2) },
            { country: 'CA', count: Math.floor(product.purchaseCount * 0.15) },
            { country: 'AU', count: Math.floor(product.purchaseCount * 0.1) },
            { country: 'Other', count: Math.floor(product.purchaseCount * 0.15) }
        ].filter(c => c.count > 0);
        return {
            views: product.viewCount,
            purchases: product.purchaseCount,
            revenue: revenue._sum.amount?.toNumber() || 0,
            conversionRate: Math.round(conversionRate * 100) / 100,
            topCountries
        };
    }
    /**
     * Obtient le total des commissions du mois en cours
     */
    async getMonthlyCommissionToDate(creatorId) {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        const result = await this.prisma.transaction.aggregate({
            where: {
                creatorId,
                createdAt: { gte: startOfMonth },
                status: 'COMPLETED'
            },
            _sum: {
                platformFee: true
            }
        });
        return result._sum.platformFee || new library_1.Decimal(0);
    }
};
exports.PaywallService = PaywallService;
exports.PaywallService = PaywallService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object, jwt_1.JwtService, typeof (_b = typeof stripe_service_1.StripeService !== "undefined" && stripe_service_1.StripeService) === "function" ? _b : Object, commission_service_1.CommissionService,
        event_emitter_1.EventEmitter2, typeof (_c = typeof cache_service_1.CacheService !== "undefined" && cache_service_1.CacheService) === "function" ? _c : Object, typeof (_d = typeof storage_service_1.StorageService !== "undefined" && storage_service_1.StorageService) === "function" ? _d : Object])
], PaywallService);
//# sourceMappingURL=paywall.service.js.map