import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
export type Permission = 'content:create' | 'content:read' | 'content:update' | 'content:delete' | 'content:publish' | 'fans:view' | 'fans:message' | 'fans:export' | 'analytics:view' | 'analytics:export' | 'settings:view' | 'settings:update' | 'admin:users' | 'admin:billing' | 'admin:system' | 'audit:view' | 'audit:export';
export declare const ROLE_PERMISSIONS: Record<string, Permission[]>;
export declare const PERMISSIONS_KEY = "permissions";
export declare const RequirePermissions: (...permissions: Permission[]) => (target: any, propertyKey?: string, descriptor?: PropertyDescriptor) => any;
export declare class PermissionsGuard implements CanActivate {
    private reflector;
    constructor(reflector: Reflector);
    canActivate(context: ExecutionContext): boolean;
}
//# sourceMappingURL=permissions.guard.d.ts.map