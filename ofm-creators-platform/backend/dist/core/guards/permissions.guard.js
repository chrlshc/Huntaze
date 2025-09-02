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
exports.PermissionsGuard = exports.RequirePermissions = exports.PERMISSIONS_KEY = exports.ROLE_PERMISSIONS = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
// Role to permissions mapping
exports.ROLE_PERMISSIONS = {
    creator: [
        'content:create',
        'content:read',
        'content:update',
        'content:delete',
        'content:publish',
        'fans:view',
        'fans:message',
        'analytics:view',
        'settings:view',
        'settings:update',
    ],
    staff: [
        'content:read',
        'fans:view',
        'fans:export',
        'analytics:view',
        'analytics:export',
        'audit:view',
    ],
    admin: [
        // Admins get all permissions
        'content:create',
        'content:read',
        'content:update',
        'content:delete',
        'content:publish',
        'fans:view',
        'fans:message',
        'fans:export',
        'analytics:view',
        'analytics:export',
        'settings:view',
        'settings:update',
        'admin:users',
        'admin:billing',
        'admin:system',
        'audit:view',
        'audit:export',
    ],
};
exports.PERMISSIONS_KEY = 'permissions';
const RequirePermissions = (...permissions) => {
    return (target, propertyKey, descriptor) => {
        Reflect.defineMetadata(exports.PERMISSIONS_KEY, permissions, descriptor?.value || target);
        return descriptor || target;
    };
};
exports.RequirePermissions = RequirePermissions;
let PermissionsGuard = class PermissionsGuard {
    reflector;
    constructor(reflector) {
        this.reflector = reflector;
    }
    canActivate(context) {
        const requiredPermissions = this.reflector.get(exports.PERMISSIONS_KEY, context.getHandler());
        if (!requiredPermissions || requiredPermissions.length === 0) {
            return true;
        }
        const { user } = context.switchToHttp().getRequest();
        if (!user || !user.role) {
            return false;
        }
        const userPermissions = exports.ROLE_PERMISSIONS[user.role] || [];
        // Check if user has all required permissions
        return requiredPermissions.every(permission => userPermissions.includes(permission));
    }
};
exports.PermissionsGuard = PermissionsGuard;
exports.PermissionsGuard = PermissionsGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector])
], PermissionsGuard);
//# sourceMappingURL=permissions.guard.js.map