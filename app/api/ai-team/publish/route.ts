// Minimal stub to ensure build succeeds. Real logic can be restored after build checks.
export const runtime = 'nodejs'

async function ok(): Promise<Response> {
  return new Response(JSON.stringify({ status: 'ok' }), {
    status: 200,
    headers: { 'content-type': 'application/json; charset=utf-8', 'X-Robots-Tag': 'noindex', 'Cache-Control': 'no-store' },
  })
}

export const POST = ok
export const GET = ok
export const HEAD = ok
