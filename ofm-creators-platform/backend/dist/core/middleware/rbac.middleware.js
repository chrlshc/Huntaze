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
exports.RbacMiddleware = void 0;
const common_1 = require("@nestjs/common");
const user_rbac_service_1 = require("@/modules/users/services/user-rbac.service");
let RbacMiddleware = class RbacMiddleware {
    userRbacService;
    constructor(userRbacService) {
        this.userRbacService = userRbacService;
    }
    async use(req, res, next) {
        // If user is authenticated (from JWT), enrich with RBAC data
        if (req.user && req.user.id) {
            try {
                const userWithRole = await this.userRbacService.getUserWithRole(req.user.id);
                if (userWithRole) {
                    // Add permissions to request
                    req.user = {
                        ...req.user,
                        role: userWithRole.role,
                        permissions: this.userRbacService.getUserPermissions(userWithRole),
                    };
                }
            }
            catch (error) {
                console.error('Failed to load user RBAC data:', error);
            }
        }
        next();
    }
};
exports.RbacMiddleware = RbacMiddleware;
exports.RbacMiddleware = RbacMiddleware = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [user_rbac_service_1.UserRbacService])
], RbacMiddleware);
//# sourceMappingURL=rbac.middleware.js.map