// Minimal auth helper for build/runtime safe fallback.
// In production, replace with real auth (Cognito/NextAuth/etc.).

export type User = { id: string; email?: string | null }

export async function requireUser(): Promise<User> {
  // TODO: integrate real auth. For now, return a dev user to allow API handlers to run in non-auth contexts.
  return { id: 'dev-user', email: null }
}

