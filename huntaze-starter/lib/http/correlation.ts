import crypto from 'crypto'
import { NextRequest, NextResponse } from 'next/server'

type LogLevel = 'info' | 'warn' | 'error'

export function generateRequestId(prefix = 'req'): string {
  const timestamp = Date.now().toString(36)
  const random = crypto.randomBytes(8).toString('hex')
  return `${prefix}-${timestamp}-${random}`
}

export function getRequestId(req: NextRequest): string {
  return (
    req.headers.get('x-request-id') ||
    req.headers.get('X-Request-Id') ||
    generateRequestId()
  )
}

export function withRequestId<
  TArgs extends unknown[],
  THandler extends (req: NextRequest, ...args: TArgs) => Promise<NextResponse>
>(handler: THandler): THandler {
  return (async (req: NextRequest, ...args: TArgs) => {
    const requestId = getRequestId(req)
    const globalContext = globalThis as Record<string, unknown>
    globalContext['__currentRequestId'] = requestId

    try {
      const response = await handler(req, ...args)
      response.headers.set('X-Request-Id', requestId)
      return response
    } catch (error) {
      console.error(JSON.stringify({
        level: 'error',
        requestId,
        message: (error as Error)?.message,
        stack: (error as Error)?.stack,
        timestamp: new Date().toISOString(),
      }))

      const res = NextResponse.json({ error: 'Internal Server Error', requestId }, { status: 500 })
      res.headers.set('X-Request-Id', requestId)
      return res
    } finally {
      delete globalContext['__currentRequestId']
    }
  }) as THandler
}

export function log(level: LogLevel, message: string, data?: Record<string, unknown>) {
  const globalContext = globalThis as Record<string, unknown>
  const requestId = (globalContext['__currentRequestId'] as string | undefined) || 'no-request-id'
  const payload = {
    timestamp: new Date().toISOString(),
    level,
    requestId,
    message,
    ...data,
  }
  console[level](JSON.stringify(payload))
}

export const logger = {
  info: (message: string, data?: Record<string, unknown>) => log('info', message, data),
  warn: (message: string, data?: Record<string, unknown>) => log('warn', message, data),
  error: (message: string, data?: Record<string, unknown>) => log('error', message, data),
}

export function correlationMiddleware(req: NextRequest, res: NextResponse): NextResponse {
  const requestId = getRequestId(req)
  res.headers.set('X-Request-Id', requestId)
  return res
}
