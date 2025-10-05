type Ctx = Record<string, unknown>

export const makeReqLogger = (ctx: Ctx = {}) => {
  const base = { timestamp: new Date().toISOString(), ...ctx }
  return {
    info: (event: string, data?: Record<string, unknown>) =>
      console.log(JSON.stringify({ level: 'info', event, ...base, ...(data || {}) })),
    warn: (event: string, data?: Record<string, unknown>) =>
      console.warn(JSON.stringify({ level: 'warn', event, ...base, ...(data || {}) })),
    error: (event: string, data?: Record<string, unknown>) =>
      console.error(JSON.stringify({ level: 'error', event, ...base, ...(data || {}) })),
  }
}

