// Minimal server-side helpers (stubs). Replace with real implementations.

export async function getAccountId(): Promise<string> {
  // TODO: read from session
  return 'demo-account'
}

export async function getAccountPlan(_accountId: string): Promise<'starter' | 'pro' | 'scale' | 'enterprise'> {
  // TODO: read from DB
  return 'scale'
}

export async function getFanSegment(_fanId: string): Promise<'VIP' | 'Whale' | 'BigSpender' | 'Dormant' | 'New' | 'General'> {
  return 'General'
}

export async function detectRisk(_context: string): Promise<'SFW' | 'ToS_sensitive' | 'NSFW' | 'Unknown'> {
  return 'SFW'
}

