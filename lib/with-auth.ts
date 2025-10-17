import { requireUser, type AuthUser } from '@/lib/server-auth';

type Handler = (req: Request, ctx: { user: AuthUser }) => Promise<Response> | Response;

// Require an authenticated user; injects { user } into the handler ctx.
export function withAuth(handler: Handler) {
  return async (req: Request) => {
    const user = await requireUser();
    return handler(req, { user });
  };
}

// Optional auth variant for public endpoints
export function withOptionalAuth<T extends (req: Request, ctx: { user?: AuthUser | null }) => any>(handler: T) {
  return async (req: Request) => {
    const { getUser } = await import('@/lib/server-auth');
    const user = await getUser();
    return handler(req, { user });
  };
}

