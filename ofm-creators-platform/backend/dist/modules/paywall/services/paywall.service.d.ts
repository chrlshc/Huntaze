import { PrismaService } from '@infrastructure/database/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Product, ProductType, Purchase } from '@prisma/client';
import { CreateProductDto, UpdateProductDto } from '../dto/product.dto';
import { PurchaseProductDto } from '../dto/purchase.dto';
import { StripeService } from '@infrastructure/payment/stripe.service';
import { CommissionService } from '@modules/subscription/services/commission.service';
import { CacheService } from '@infrastructure/cache/cache.service';
import { StorageService } from '@infrastructure/storage/storage.service';
interface AccessCheckResult {
    hasAccess: boolean;
    accessType: 'owner' | 'subscription' | 'purchase' | 'free' | 'none';
    expiresAt?: Date;
    requiresPurchase?: boolean;
    price?: number;
    currency?: string;
}
export declare class PaywallService {
    private readonly prisma;
    private readonly jwt;
    private readonly stripe;
    private readonly commission;
    private readonly eventEmitter;
    private readonly cache;
    private readonly storage;
    constructor(prisma: PrismaService, jwt: JwtService, stripe: StripeService, commission: CommissionService, eventEmitter: EventEmitter2, cache: CacheService, storage: StorageService);
    /**
     * Crée un nouveau produit avec paywall
     */
    createProduct(creatorId: string, dto: CreateProductDto): Promise<Product>;
    /**
     * Met à jour un produit
     */
    updateProduct(productId: string, creatorId: string, dto: UpdateProductDto): Promise<Product>;
    /**
     * Vérifie l'accès à un produit
     */
    checkAccess(productId: string, fanId?: string): Promise<AccessCheckResult>;
    /**
     * Génère un lien d'accès sécurisé
     */
    generateAccessLink(productId: string, fanId: string, expiresIn?: number): Promise<string>;
    /**
     * Achète un produit
     */
    purchaseProduct(fanId: string, dto: PurchaseProductDto): Promise<Purchase>;
    /**
     * Obtient le contenu sécurisé
     */
    getSecureContent(productId: string, fanId: string): Promise<{
        contentUrl: string;
        contentType: ProductType;
        watermarked: boolean;
    }>;
    /**
     * Obtient les statistiques d'un produit
     */
    getProductStats(productId: string, creatorId: string): Promise<{
        views: number;
        purchases: number;
        revenue: number;
        conversionRate: number;
        topCountries: Array<{
            country: string;
            count: number;
        }>;
    }>;
    /**
     * Obtient le total des commissions du mois en cours
     */
    private getMonthlyCommissionToDate;
}
export {};
//# sourceMappingURL=paywall.service.d.ts.map