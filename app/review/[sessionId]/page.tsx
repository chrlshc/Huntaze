import React from 'react'

async function getSession(sessionId: string) {
  const r = await fetch(`/api/internal/autogen/sessions/${sessionId}`, { cache: 'no-store' })
  if (!r.ok) throw new Error('session fetch failed')
  return r.json()
}

export default async function ReviewPage({ params }: { params: { sessionId: string } }) {
  const s = await getSession(params.sessionId)
  const risk = s?.risk || { label: 'unknown', score: 0 }
  const draft = s?.draft || '[draft non persisté dans ce squelette]'

  async function decide(decision: 'approve' | 'reject') {
    'use server'
    await fetch(`/api/internal/autogen/sessions/${params.sessionId}/decision`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ decision }),
    })
  }

  return (
    <main style={{ maxWidth: 760, margin: '40px auto', fontFamily: 'sans-serif' }}>
      <h1>Revue session #{params.sessionId}</h1>
      <p>
        <b>Risk:</b> {risk.label} (score {risk.score})
      </p>
      <pre style={{ background: '#111', color: '#eee', padding: 16, borderRadius: 8 }}>{draft}</pre>
      <div style={{ display: 'flex', gap: 12 }}>
        <form action={async () => { 'use server'; await decide('approve') }}>
          <button type="submit">✅ Approuver &amp; Envoyer</button>
        </form>
        <form action={async () => { 'use server'; await decide('reject') }}>
          <button type="submit">🚫 Rejeter</button>
        </form>
      </div>
    </main>
  )
}
