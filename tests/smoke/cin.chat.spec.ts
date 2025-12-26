import { test, expect } from '@playwright/test'

test('CIN chat returns 200 and echoes X-Request-Id', async ({ request }) => {
  const rid = `e2e-${Date.now()}`
  const res = await request.post('/api/cin/chat', {
    headers: { 'x-request-id': rid, 'content-type': 'application/json' },
    data: { message: 'ping' },
  })

  expect(res.status(), 'HTTP 200 attendu').toBe(200)
  const echoed = res.headers()['x-request-id']
  expect(echoed, 'X-Request-Id manquant').toBeTruthy()

  const body = await res.json().catch(() => ({} as any))
  expect(body, 'body manquant').toBeTruthy()
})

