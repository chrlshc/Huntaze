import { PrismaService } from '@/infrastructure/database/prisma.service';
import { AuditLogService } from '@/modules/audit/services/audit-log.service';
import { UserRole } from '@/core/decorators/roles.decorator';
import { Permission } from '@/core/guards/permissions.guard';
export interface UserWithRole {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    createdAt: Date;
    lastLogin?: Date;
    isActive: boolean;
    twoFactorEnabled: boolean;
}
export declare class UserRbacService {
    private readonly prisma;
    private readonly auditLog;
    constructor(prisma: PrismaService, auditLog: AuditLogService);
    /**
     * Get user by ID with role information
     */
    getUserWithRole(userId: string): Promise<UserWithRole | null>;
    /**
     * Check if user has permission
     */
    hasPermission(user: UserWithRole, permission: Permission): boolean;
    /**
     * Check if user has all permissions
     */
    hasAllPermissions(user: UserWithRole, permissions: Permission[]): boolean;
    /**
     * Check if user has any of the permissions
     */
    hasAnyPermission(user: UserWithRole, permissions: Permission[]): boolean;
    /**
     * Update user role (admin only)
     */
    updateUserRole(adminId: string, targetUserId: string, newRole: UserRole): Promise<void>;
    /**
     * Get users by role
     */
    getUsersByRole(role: UserRole): Promise<UserWithRole[]>;
    /**
     * Check resource ownership
     */
    checkResourceOwnership(userId: string, resourceType: string, resourceId: string): Promise<boolean>;
    /**
     * Get user permissions
     */
    getUserPermissions(user: UserWithRole): Permission[];
    /**
     * Elevate privileges temporarily (for specific operations)
     */
    elevatePrivileges(userId: string, reason: string, duration?: number): Promise<string>;
}
//# sourceMappingURL=user-rbac.service.d.ts.map