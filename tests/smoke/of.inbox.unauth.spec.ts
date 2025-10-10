import { test, expect } from '@playwright/test'

test('OF inbox is gated (401 without auth)', async ({ request }) => {
  const res = await request.get('/api/of/inbox')
  expect(res.status(), '401 attendu sans access_token').toBe(401)
  const body = await res.json().catch(() => ({} as any))
  expect(body?.error, 'message d\'erreur attendu').toBeTruthy()
})

