import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export interface AuthUser {
  userId: string;
  username: string;
  groups: string[];
  isAuthenticated: boolean;
}

export async function getServerAuth(): Promise<AuthUser | null> {
  const headersList = headers();
  const userId = headersList.get('x-user-id');
  const username = headersList.get('x-username');
  const groups = headersList.get('x-user-groups')?.split(',').filter(Boolean) || [];
  
  if (!userId) {
    return null;
  }
  
  return {
    userId,
    username,
    groups,
    isAuthenticated: true
  };
}

export async function requireAuth(): Promise<AuthUser> {
  const auth = await getServerAuth();
  
  if (!auth) {
    redirect('/auth');
  }
  
  return auth;
}

export async function requireRole(requiredRole: string): Promise<AuthUser> {
  const auth = await requireAuth();
  
  if (!auth.groups.includes(requiredRole)) {
    redirect('/unauthorized');
  }
  
  return auth;
}

export async function requireAnyRole(requiredRoles: string[]): Promise<AuthUser> {
  const auth = await requireAuth();
  
  const hasRole = requiredRoles.some(role => auth.groups.includes(role));
  
  if (!hasRole) {
    redirect('/unauthorized');
  }
  
  return auth;
}

// Helper to check permissions without redirecting
export async function hasPermission(permission: string): Promise<boolean> {
  const auth = await getServerAuth();
  
  if (!auth) {
    return false;
  }
  
  // Map permissions to roles (customize based on your needs)
  const permissionMap: Record<string, string[]> = {
    'admin.users.read': ['admin', 'moderator'],
    'admin.users.write': ['admin'],
    'billing.view': ['admin', 'billing'],
    'billing.manage': ['admin', 'billing'],
    'content.create': ['admin', 'creator', 'moderator'],
    'content.delete': ['admin', 'moderator'],
    'analytics.view': ['admin', 'creator', 'analyst'],
  };
  
  const allowedRoles = permissionMap[permission] || [];
  return allowedRoles.some(role => auth.groups.includes(role));
}

// Helper for conditional rendering in server components
export async function withAuth<T>(
  callback: (auth: AuthUser) => Promise<T>,
  fallback?: T
): Promise<T | undefined> {
  const auth = await getServerAuth();
  
  if (!auth) {
    return fallback;
  }
  
  return callback(auth);
}

// Example usage in a server component
/*
export default async function AdminDashboard() {
  const auth = await requireRole('admin');
  
  return (
    <div>
      <h1>Admin Dashboard - Welcome {auth.username}</h1>
      <p>User ID: {auth.userId}</p>
      <p>Roles: {auth.groups.join(', ')}</p>
    </div>
  );
}

// Or with conditional rendering
export default async function ProfilePage() {
  const isAdmin = await hasPermission('admin.users.read');
  
  return (
    <div>
      <h1>Profile</h1>
      {isAdmin && (
        <div>
          <h2>Admin Section</h2>
          <p>Only visible to admins</p>
        </div>
      )}
    </div>
  );
}
*/