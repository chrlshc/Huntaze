// Simplified no-op monitoring wrapper for build-time compatibility
type Handler = (req: Request) => Promise<Response>
export function withMonitoring(
  nameOrHandler: string | Handler,
  maybeHandler?: Handler,
  _opts?: { getUserId?: (req: Request) => any; [k: string]: any }
): Handler {
  const handler = (typeof nameOrHandler === 'function' ? nameOrHandler : (maybeHandler as Handler))
  return async (req: Request) => handler(req)
}

export async function initObservability() { /* no-op */ }
