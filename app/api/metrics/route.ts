import { NextResponse } from 'next/server'

// Force Node.js runtime and dynamic rendering to ensure prom-client APIs are available
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function handler() {
  try {
    const { register, collectDefaultMetrics, contentType } = await import('prom-client')
    
    // Idempotent: collectDefaultMetrics only runs once per process
    collectDefaultMetrics()
    
    const body = await register.metrics()
    return new NextResponse(body, {
      status: 200,
      headers: { 'content-type': contentType },
    })
  } catch (error) {
    console.error('Metrics unavailable:', error)
    return NextResponse.json(
      { error: 'Metrics unavailable' },
      { status: 500 }
    )
  }
}

export const GET = handler
export const HEAD = handler
