import { test, expect } from '@playwright/test'

test('CIN status (badge) returns 200 and echoes X-Request-Id', async ({ request }) => {
  const res = await request.get('/api/cin/status?badge=true')

  expect(res.status(), 'HTTP 200 attendu').toBe(200)
  const echoed = res.headers()['x-request-id']
  expect(echoed, 'X-Request-Id manquant').toBeTruthy()

  const body = await res.json().catch(() => ({} as any))
  expect(body?.type, 'type attendu="alerts"').toBe('alerts')
  expect(typeof body?.count, 'count numérique attendu').toBe('number')
})

