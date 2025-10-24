import { NextResponse } from 'next/server'

function sample(prob: number) {
  return Math.random() < prob
}

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get('content-type') || ''
    let body: any = null
    const raw = await req.text()
    // Drop overly large payloads
    if (raw && raw.length > 1_000_000) {
      return new NextResponse(null, { status: 204 })
    }
    if (raw) {
      if (contentType.includes('application/json') || contentType.includes('application/reports+json')) {
        body = JSON.parse(raw)
      } else if (contentType.includes('application/csp-report')) {
        // Legacy CSP report format
        body = JSON.parse(raw)
      } else {
        // Best-effort parse
        try { body = JSON.parse(raw) } catch { body = { raw } }
      }
    }

    const report = body?.['csp-report'] || body?.csp_report || body || {}
    // Redact potentially sensitive fields
    const redacted = {
      'effective-directive': report['effective-directive'],
      'violated-directive': report['violated-directive'],
      'blocked-uri': report['blocked-uri'],
      'original-policy': undefined, // omit noisy policy echo
      'disposition': report['disposition'],
      'source-file': report['source-file'],
      'line-number': report['line-number'],
      'column-number': report['column-number'],
      'status-code': report['status-code'],
      'referrer': report['referrer'],
      'document-uri': report['document-uri'],
      'script-sample': report['script-sample'],
      'timestamp': new Date().toISOString(),
    }

    // Sampling to avoid log floods
    const rate = Math.max(0, Math.min(1, parseFloat(process.env.CSP_REPORT_SAMPLE_RATE || '0.1')))
    if (sample(rate)) {
      console.warn('[CSP-REPORT]', JSON.stringify(redacted))
    }
  } catch (err) {
    console.error('[CSP-REPORT] error parsing', err)
  }
  return new NextResponse(null, { status: 204 })
}

export function GET() {
  return new NextResponse(null, { status: 204 })
}
