import { NextRequest, NextResponse } from 'next/server'
import { AWSXRay } from '@/lib/observability/xray-init'
import { getRequestId } from '@/lib/http/correlation'
import { trackAPIRequest } from './cloudwatch-metrics'

type Handler = (req: NextRequest) => Promise<NextResponse>

export function withMonitoring(handler: Handler, name?: string): Handler {
  return async (req: NextRequest) => {
    const requestId = getRequestId(req)
    const globalContext = globalThis as Record<string, unknown>
    globalContext['__currentRequestId'] = requestId

    const start = Date.now()
    const segment = AWSXRay.getSegment?.()
    const subsegment = segment?.addNewSubsegment(name || req.nextUrl.pathname)

    try {
      const response = await handler(req)
      const duration = Date.now() - start

      trackAPIRequest(req.nextUrl.pathname, req.method, response.status, duration)
      response.headers.set('X-Request-Id', requestId)

      subsegment?.addAnnotation('requestId', requestId)
      subsegment?.addAnnotation('status', response.status)
      subsegment?.addAnnotation('duration_ms', duration)
      subsegment?.close()

      return response
    } catch (error) {
      const duration = Date.now() - start
      trackAPIRequest(req.nextUrl.pathname, req.method, 500, duration)
      if (error instanceof Error) {
        subsegment?.addError(error)
        subsegment?.close(error)
      } else {
        subsegment?.addError(new Error('unknown_error'))
        subsegment?.close()
      }

      console.error(JSON.stringify({
        level: 'error',
        requestId,
        path: req.nextUrl.pathname,
        message: error instanceof Error ? error.message : 'unknown_error',
        timestamp: new Date().toISOString(),
      }))

      const res = NextResponse.json({ error: 'Internal Server Error', requestId }, { status: 500 })
      res.headers.set('X-Request-Id', requestId)
      return res
    } finally {
      delete globalContext['__currentRequestId']
    }
  }
}
