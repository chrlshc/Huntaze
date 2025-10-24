import http from 'k6/http'
import { check, sleep } from 'k6'

export const options = {
  scenarios: {
    smoke: { executor: 'constant-vus', vus: 5, duration: '1m' },
  },
  thresholds: {
    http_req_failed: ['rate<0.02'],
    http_req_duration: ['p(95)<3000'],
  },
}

const BASE = __ENV.BASE_URL || 'http://localhost:3000'
const ADMIN = __ENV.ADMIN_TOKEN || ''

export default function () {
  // 1) Azure smoke (optional)
  const smoke = http.get(`${BASE}/api/ai/azure/smoke`)
  check(smoke, { 'smoke 200/401/404': (r) => r.status === 200 || r.status === 404 || r.status === 401 })

  // 2) Plan Azure
  const planBody = JSON.stringify({ correlation: `C-${__ITER}-${Date.now()}`, period: 'next_week', platforms: ['instagram','tiktok'], preferences: { account_id: 'acct_k6' } })
  const plan = http.post(`${BASE}/api/ai-team/schedule/plan/azure`, planBody, { headers: { 'content-type': 'application/json' } })
  check(plan, { 'plan 202': (r) => r.status === 202 })
  let plan_id = ''
  try { plan_id = plan.json('plan_id') } catch {}

  // 3) Publish (simple content)
  const contents = [{ id: 'P1', idea: 'k6 test', text: 'Hello from k6', assets: [{ kind: 'image' }] }]
  const publish = http.post(`${BASE}/api/ai-team/publish`, JSON.stringify({ correlation: `C-${Date.now()}`, contents, platforms: ['instagram'] }), { headers: { 'content-type':'application/json' } })
  check(publish, { 'publish 202': (r) => r.status === 202 })

  // 4) Summary run
  const run = http.post(`${BASE}/api/analytics/ai/summary/run`, JSON.stringify({ account_id: 'acct_k6', period: '7d', platform: 'instagram' }), { headers: { 'content-type': 'application/json' } })
  check(run, { 'summary run 202': (r) => r.status === 202 })

  // 5) Admin outbox dispatcher (if token present)
  if (ADMIN) {
    const disp = http.post(`${BASE}/api/admin/outbox/dispatch`, null, { headers: { authorization: `Bearer ${ADMIN}` } })
    check(disp, { 'dispatch 200': (r) => r.status === 200 })
  }

  // 6) Get plan (if id)
  if (plan_id) {
    const getp = http.get(`${BASE}/api/ai-team/plan/${plan_id}`)
    check(getp, { 'plan get ok': (r) => r.status === 200 || r.status === 404 })
  }

  sleep(1)
}
