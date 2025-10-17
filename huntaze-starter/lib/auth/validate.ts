import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/lib/auth/options'

type Role = 'admin' | 'creator' | 'manager' | 'viewer'
type RBAC = { resource: string; action: string; roles: Role[] }

const DEFAULT_DENY: RBAC[] = [
  { resource: 'messages', action: 'create', roles: ['admin', 'creator', 'manager'] },
  { resource: 'vault', action: 'write', roles: ['admin', 'creator', 'manager'] },
  { resource: 'insights', action: 'read', roles: ['admin', 'creator', 'manager', 'viewer'] },
]

export async function requireAuth(_req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || !session.user?.id) {
    return { ok: false as const, res: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }
  return { ok: true as const, session }
}

export function hasAccess(role: Role, resource: string, action: string) {
  const rule = DEFAULT_DENY.find((r) => r.resource === resource && r.action === action)
  if (!rule) return false
  return rule.roles.includes(role)
}

export function withAuth<T extends (req: NextRequest, session: Awaited<ReturnType<typeof getServerSession>>) => Promise<NextResponse>>(
  handler: T,
  rbac?: { resource: string; action: string },
) {
  return async (req: NextRequest) => {
    const auth = await requireAuth(req)
    if (!auth.ok) return auth.res
    const role = (auth.session.user?.role ?? 'viewer') as Role
    if (rbac && !hasAccess(role, rbac.resource, rbac.action)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    return handler(req, auth.session)
  }
}
