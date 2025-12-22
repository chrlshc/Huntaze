/**
 * RBAC Service
 * Content & Trends AI Engine - Phase 6
 * 
 * Role-Based Access Control with principle of least privilege.
 * Implements Zero Trust architecture for viral intelligence access.
 */

import {
  UserRole,
  Permission,
  RBACPolicy,
  PolicyCondition,
  UserIdentity,
  ResourceType,
} from './types';

// ============================================================================
// Default RBAC Policies
// ============================================================================

const DEFAULT_POLICIES: RBACPolicy[] = [
  {
    role: 'admin',
    permissions: [
      'viral_analysis:read',
      'viral_analysis:write',
      'viral_analysis:delete',
      'content_generation:read',
      'content_generation:write',
      'competitor_intelligence:read',
      'competitor_intelligence:write',
      'audit_logs:read',
      'settings:read',
      'settings:write',
      'api_keys:manage',
      'users:manage',
    ],
    resourcePatterns: ['*'],
  },
  {
    role: 'analyst',
    permissions: [
      'viral_analysis:read',
      'viral_analysis:write',
      'content_generation:read',
      'competitor_intelligence:read',
      'audit_logs:read',
    ],
    resourcePatterns: [
      'viral_analysis/*',
      'content_generation/*',
      'competitor_intelligence/*',
    ],
  },
  {
    role: 'content_creator',
    permissions: [
      'viral_analysis:read',
      'content_generation:read',
      'content_generation:write',
    ],
    resourcePatterns: [
      'viral_analysis/*',
      'content_generation/*',
    ],
  },
  {
    role: 'viewer',
    permissions: [
      'viral_analysis:read',
      'content_generation:read',
    ],
    resourcePatterns: [
      'viral_analysis/*',
      'content_generation/*',
    ],
  },
  {
    role: 'api_service',
    permissions: [
      'viral_analysis:read',
      'viral_analysis:write',
      'content_generation:read',
      'content_generation:write',
    ],
    resourcePatterns: ['*'],
    conditions: [
      {
        type: 'ip_based',
        config: { allowedCidrs: ['10.0.0.0/8', '172.16.0.0/12'] },
      },
    ],
  },
];

// ============================================================================
// RBAC Service Implementation
// ============================================================================

export class RBACService {
  private policies: Map<UserRole, RBACPolicy>;
  private customPolicies: Map<string, RBACPolicy>;

  constructor(customPolicies?: RBACPolicy[]) {
    this.policies = new Map();
    this.customPolicies = new Map();

    // Load default policies
    for (const policy of DEFAULT_POLICIES) {
      this.policies.set(policy.role, policy);
    }

    // Load custom policies
    if (customPolicies) {
      for (const policy of customPolicies) {
        this.customPolicies.set(`${policy.role}:custom`, policy);
      }
    }
  }

  /**
   * Check if a user has a specific permission
   */
  hasPermission(
    user: UserIdentity,
    permission: Permission,
    resourceId?: string
  ): boolean {
    // Check if user has the permission directly
    if (user.permissions.includes(permission)) {
      return true;
    }

    // Check role-based permissions
    for (const role of user.roles) {
      const policy = this.policies.get(role);
      if (!policy) continue;

      if (policy.permissions.includes(permission)) {
        // Check resource pattern match
        if (resourceId && !this.matchesResourcePattern(resourceId, policy.resourcePatterns)) {
          continue;
        }

        // Check conditions
        if (policy.conditions && !this.evaluateConditions(policy.conditions, user)) {
          continue;
        }

        return true;
      }
    }

    return false;
  }

  /**
   * Get all permissions for a user
   */
  getEffectivePermissions(user: UserIdentity): Permission[] {
    const permissions = new Set<Permission>(user.permissions);

    for (const role of user.roles) {
      const policy = this.policies.get(role);
      if (policy) {
        for (const permission of policy.permissions) {
          permissions.add(permission);
        }
      }
    }

    return Array.from(permissions);
  }

  /**
   * Check if user can access a specific resource type
   */
  canAccessResourceType(
    user: UserIdentity,
    resourceType: ResourceType,
    action: 'read' | 'write' | 'delete'
  ): boolean {
    const permissionMap: Record<ResourceType, Record<string, Permission>> = {
      viral_analysis: {
        read: 'viral_analysis:read',
        write: 'viral_analysis:write',
        delete: 'viral_analysis:delete',
      },
      content_script: {
        read: 'content_generation:read',
        write: 'content_generation:write',
        delete: 'content_generation:write',
      },
      ugc_brief: {
        read: 'content_generation:read',
        write: 'content_generation:write',
        delete: 'content_generation:write',
      },
      competitor_data: {
        read: 'competitor_intelligence:read',
        write: 'competitor_intelligence:write',
        delete: 'competitor_intelligence:write',
      },
      trend_data: {
        read: 'viral_analysis:read',
        write: 'viral_analysis:write',
        delete: 'viral_analysis:delete',
      },
      ai_model: {
        read: 'viral_analysis:read',
        write: 'settings:write',
        delete: 'settings:write',
      },
      user: {
        read: 'users:manage',
        write: 'users:manage',
        delete: 'users:manage',
      },
      api_key: {
        read: 'api_keys:manage',
        write: 'api_keys:manage',
        delete: 'api_keys:manage',
      },
      configuration: {
        read: 'settings:read',
        write: 'settings:write',
        delete: 'settings:write',
      },
      webhook: {
        read: 'settings:read',
        write: 'settings:write',
        delete: 'settings:write',
      },
    };

    const permission = permissionMap[resourceType]?.[action];
    if (!permission) return false;

    return this.hasPermission(user, permission);
  }

  /**
   * Validate that a role assignment is valid
   */
  isValidRoleAssignment(
    assignerRoles: UserRole[],
    targetRole: UserRole
  ): boolean {
    // Only admins can assign any role
    if (assignerRoles.includes('admin')) {
      return true;
    }

    // Non-admins cannot assign admin or api_service roles
    if (targetRole === 'admin' || targetRole === 'api_service') {
      return false;
    }

    return false;
  }

  /**
   * Get the policy for a specific role
   */
  getPolicy(role: UserRole): RBACPolicy | undefined {
    return this.policies.get(role);
  }

  /**
   * Add or update a custom policy
   */
  setCustomPolicy(policy: RBACPolicy): void {
    this.customPolicies.set(`${policy.role}:custom`, policy);
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private matchesResourcePattern(resourceId: string, patterns: string[]): boolean {
    for (const pattern of patterns) {
      if (pattern === '*') return true;
      
      // Convert glob pattern to regex
      const regexPattern = pattern
        .replace(/\*/g, '.*')
        .replace(/\?/g, '.');
      
      const regex = new RegExp(`^${regexPattern}$`);
      if (regex.test(resourceId)) {
        return true;
      }
    }
    return false;
  }

  private evaluateConditions(
    conditions: PolicyCondition[],
    user: UserIdentity
  ): boolean {
    for (const condition of conditions) {
      if (!this.evaluateCondition(condition, user)) {
        return false;
      }
    }
    return true;
  }

  private evaluateCondition(
    condition: PolicyCondition,
    _user: UserIdentity
  ): boolean {
    switch (condition.type) {
      case 'time_based':
        return this.evaluateTimeCondition(condition.config);
      case 'ip_based':
        // IP-based conditions would need request context
        // For now, return true (would be checked at request level)
        return true;
      case 'resource_owner':
        // Resource owner conditions need resource context
        return true;
      default:
        return true;
    }
  }

  private evaluateTimeCondition(config: Record<string, unknown>): boolean {
    const now = new Date();
    const currentHour = now.getHours();
    const currentDay = now.getDay();

    const allowedHours = config.allowedHours as number[] | undefined;
    const allowedDays = config.allowedDays as number[] | undefined;

    if (allowedHours && !allowedHours.includes(currentHour)) {
      return false;
    }

    if (allowedDays && !allowedDays.includes(currentDay)) {
      return false;
    }

    return true;
  }
}

// ============================================================================
// Permission Helpers
// ============================================================================

export function parsePermission(permission: Permission): {
  resource: string;
  action: string;
} {
  const [resource, action] = permission.split(':');
  return { resource, action };
}

export function buildPermission(resource: string, action: string): Permission {
  return `${resource}:${action}` as Permission;
}

export function isReadPermission(permission: Permission): boolean {
  return permission.endsWith(':read');
}

export function isWritePermission(permission: Permission): boolean {
  return permission.endsWith(':write');
}

export function isDeletePermission(permission: Permission): boolean {
  return permission.endsWith(':delete');
}

// ============================================================================
// Role Hierarchy
// ============================================================================

const ROLE_HIERARCHY: Record<UserRole, number> = {
  admin: 100,
  analyst: 50,
  content_creator: 40,
  viewer: 10,
  api_service: 80,
};

export function compareRoles(role1: UserRole, role2: UserRole): number {
  return ROLE_HIERARCHY[role1] - ROLE_HIERARCHY[role2];
}

export function getHighestRole(roles: UserRole[]): UserRole {
  return roles.reduce((highest, current) => 
    compareRoles(current, highest) > 0 ? current : highest
  );
}
