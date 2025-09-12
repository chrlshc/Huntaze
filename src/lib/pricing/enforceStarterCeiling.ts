// Starter eligibility enforcement helper
// Business rule: if plan === starter and GMV > $2,000 for 2 consecutive cycles,
// gate automations (no auto-send) and require upgrade. Allow 1-cycle grace.

export type EnforcementState = 'ok' | 'warn_1' | 'blocked'

// Pure function: compute state from last two GMVs
export function enforceStarterCeilingState(lastTwoGMVs: number[], ceiling = 2000): EnforcementState {
  const [gmv0 = 0, gmv1 = 0] = lastTwoGMVs // latest first
  const over0 = gmv0 > ceiling
  const over1 = gmv1 > ceiling
  if (!over0 && !over1) return 'ok'
  if (over0 && !over1) return 'warn_1'
  return 'blocked'
}

// Orchestrator placeholder: integrate with your DB layer
// Implement getLastMonthlyGMVs/getAccount/setEnforcementState in your data layer
// and wire this function in a monthly cron or post-invoice hook.
export async function enforceStarterCeiling(accountId: string) {
  // NOTE: intentionally left unimplemented to avoid repo coupling.
  // Example signature for your adapters:
  // const acc = await getAccount(accountId)
  // if (acc.plan !== 'starter') return
  // const [gmv0, gmv1] = await getLastMonthlyGMVs(accountId, 2)
  // const state = enforceStarterCeilingState([gmv0, gmv1])
  // await setEnforcementState(accountId, state)
  return
}

