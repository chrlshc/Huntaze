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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRbacService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("@/infrastructure/database/prisma.service");
const audit_log_service_1 = require("@/modules/audit/services/audit-log.service");
const permissions_guard_1 = require("@/core/guards/permissions.guard");
let UserRbacService = class UserRbacService {
    prisma;
    auditLog;
    constructor(prisma, auditLog) {
        this.prisma = prisma;
        this.auditLog = auditLog;
    }
    /**
     * Get user by ID with role information
     */
    async getUserWithRole(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                createdAt: true,
                lastLogin: true,
                isActive: true,
                twoFactorEnabled: true,
            },
        });
        if (!user)
            return null;
        return {
            ...user,
            role: user.role,
        };
    }
    /**
     * Check if user has permission
     */
    hasPermission(user, permission) {
        const userPermissions = permissions_guard_1.ROLE_PERMISSIONS[user.role] || [];
        return userPermissions.includes(permission);
    }
    /**
     * Check if user has all permissions
     */
    hasAllPermissions(user, permissions) {
        return permissions.every(permission => this.hasPermission(user, permission));
    }
    /**
     * Check if user has any of the permissions
     */
    hasAnyPermission(user, permissions) {
        return permissions.some(permission => this.hasPermission(user, permission));
    }
    /**
     * Update user role (admin only)
     */
    async updateUserRole(adminId, targetUserId, newRole) {
        // Get admin user
        const admin = await this.getUserWithRole(adminId);
        if (!admin || admin.role !== 'admin') {
            throw new common_1.ForbiddenException('Only admins can change user roles');
        }
        // Get target user
        const targetUser = await this.getUserWithRole(targetUserId);
        if (!targetUser) {
            throw new Error('User not found');
        }
        // Prevent demoting the last admin
        if (targetUser.role === 'admin' && newRole !== 'admin') {
            const adminCount = await this.prisma.user.count({
                where: { role: 'admin', isActive: true },
            });
            if (adminCount <= 1) {
                throw new Error('Cannot remove the last admin');
            }
        }
        // Update role
        await this.prisma.user.update({
            where: { id: targetUserId },
            data: { role: newRole },
        });
        // Log the change
        await this.auditLog.log({
            userId: adminId,
            action: 'user_role_change',
            resource: 'user',
            resourceId: targetUserId,
            details: {
                oldRole: targetUser.role,
                newRole,
            },
        });
    }
    /**
     * Get users by role
     */
    async getUsersByRole(role) {
        const users = await this.prisma.user.findMany({
            where: { role },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                createdAt: true,
                lastLogin: true,
                isActive: true,
                twoFactorEnabled: true,
            },
            orderBy: { createdAt: 'desc' },
        });
        return users.map(user => ({
            ...user,
            role: user.role,
        }));
    }
    /**
     * Check resource ownership
     */
    async checkResourceOwnership(userId, resourceType, resourceId) {
        const user = await this.getUserWithRole(userId);
        if (!user)
            return false;
        // Admins own everything
        if (user.role === 'admin')
            return true;
        // Check specific resource ownership
        switch (resourceType) {
            case 'content':
                const content = await this.prisma.content.findUnique({
                    where: { id: resourceId },
                    select: { userId: true },
                });
                return content?.userId === userId;
            case 'media':
                const media = await this.prisma.media.findUnique({
                    where: { id: resourceId },
                    select: { userId: true },
                });
                return media?.userId === userId;
            case 'fan':
                const fan = await this.prisma.fan.findUnique({
                    where: { id: resourceId },
                    select: { creatorId: true },
                });
                return fan?.creatorId === userId;
            default:
                return false;
        }
    }
    /**
     * Get user permissions
     */
    getUserPermissions(user) {
        return permissions_guard_1.ROLE_PERMISSIONS[user.role] || [];
    }
    /**
     * Elevate privileges temporarily (for specific operations)
     */
    async elevatePrivileges(userId, reason, duration = 3600) {
        const user = await this.getUserWithRole(userId);
        if (!user)
            throw new Error('User not found');
        // Only staff can request elevation
        if (user.role !== 'staff') {
            throw new common_1.ForbiddenException('Only staff can request privilege elevation');
        }
        // Generate elevation token
        const token = crypto.randomUUID();
        const expiresAt = new Date(Date.now() + duration * 1000);
        // Store elevation request (would be in Redis in production)
        await this.prisma.privilegeElevation.create({
            data: {
                userId,
                token,
                reason,
                expiresAt,
                approved: false,
            },
        });
        // Log elevation request
        await this.auditLog.log({
            userId,
            action: 'privilege_elevation_request',
            resource: 'system',
            details: { reason, duration },
        });
        // Notify admins (in production, send email/slack)
        console.log(`Privilege elevation requested by ${user.email}: ${reason}`);
        return token;
    }
};
exports.UserRbacService = UserRbacService;
exports.UserRbacService = UserRbacService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object, audit_log_service_1.AuditLogService])
], UserRbacService);
//# sourceMappingURL=user-rbac.service.js.map