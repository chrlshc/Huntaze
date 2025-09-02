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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContentAccessGuard = exports.ContentAccess = exports.CONTENT_ACCESS_KEY = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const paywall_service_1 = require("../services/paywall.service");
const jwt_1 = require("@nestjs/jwt");
exports.CONTENT_ACCESS_KEY = 'contentAccess';
const ContentAccess = (options) => (target, key, descriptor) => {
    if (descriptor) {
        Reflect.defineMetadata(exports.CONTENT_ACCESS_KEY, options || {}, descriptor.value);
        return descriptor;
    }
    Reflect.defineMetadata(exports.CONTENT_ACCESS_KEY, options || {}, target);
    return target;
};
exports.ContentAccess = ContentAccess;
let ContentAccessGuard = class ContentAccessGuard {
    reflector;
    paywallService;
    jwtService;
    constructor(reflector, paywallService, jwtService) {
        this.reflector = reflector;
        this.paywallService = paywallService;
        this.jwtService = jwtService;
    }
    async canActivate(context) {
        const options = this.reflector.get(exports.CONTENT_ACCESS_KEY, context.getHandler()) || {};
        const request = context.switchToHttp().getRequest();
        // Extraire l'ID du produit depuis les paramètres ou le body
        const productId = request.params.productId || request.body.productId;
        if (!productId) {
            return false;
        }
        // Vérifier le token d'accès direct si présent
        const accessToken = request.query.token || request.headers['x-access-token'];
        if (accessToken) {
            try {
                const payload = this.jwtService.verify(accessToken);
                if (payload.type === 'content_access' &&
                    payload.productId === productId &&
                    payload.fanId) {
                    // Attacher les infos au request pour usage ultérieur
                    request.contentAccess = {
                        productId: payload.productId,
                        fanId: payload.fanId,
                        verified: true
                    };
                    return true;
                }
            }
            catch (error) {
                // Token invalide, continuer avec la vérification normale
            }
        }
        // Obtenir l'ID du fan depuis l'authentification
        const fanId = request.user?.fanId || request.user?.id;
        // Vérifier l'accès
        const accessCheck = await this.paywallService.checkAccess(productId, fanId);
        // Si preview autorisé et pas d'accès complet
        if (options.allowPreview && !accessCheck.hasAccess) {
            request.contentAccess = {
                productId,
                fanId,
                previewOnly: true,
                requiresPurchase: accessCheck.requiresPurchase,
                price: accessCheck.price,
                currency: accessCheck.currency
            };
            return true;
        }
        // Attacher les infos d'accès au request
        request.contentAccess = {
            productId,
            fanId,
            hasAccess: accessCheck.hasAccess,
            accessType: accessCheck.accessType,
            expiresAt: accessCheck.expiresAt
        };
        return accessCheck.hasAccess;
    }
};
exports.ContentAccessGuard = ContentAccessGuard;
exports.ContentAccessGuard = ContentAccessGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector,
        paywall_service_1.PaywallService,
        jwt_1.JwtService])
], ContentAccessGuard);
//# sourceMappingURL=content-access.guard.js.map