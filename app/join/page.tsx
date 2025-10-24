export const dynamic = 'force-static'

export default function JoinBetaPage({ searchParams }: { searchParams?: Record<string, string> }) {
  const email = (searchParams && searchParams['email']) || ''
  return (
    <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-gray-100">
      <div className="max-w-xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold mb-2">Join the Huntaze Beta</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-6">We’re onboarding a limited set of creators. No credit card required.</p>

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            const form = e.currentTarget as HTMLFormElement
            const email = (form.elements.namedItem('email') as HTMLInputElement)?.value
            const name = (form.elements.namedItem('name') as HTMLInputElement)?.value
            fetch('/api/auth/signup', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, name }) })
              .then(() => { window.location.href = '/auth' })
              .catch(() => { window.location.href = '/auth' })
          }}
        >
          <div>
            <label className="block text-sm mb-1" htmlFor="name">Name</label>
            <input id="name" name="name" className="w-full rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-zinc-900 px-3 py-2" placeholder="Your name" />
          </div>
          <div>
            <label className="block text-sm mb-1" htmlFor="email">Email</label>
            <input id="email" name="email" type="email" defaultValue={email} required className="w-full rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-zinc-900 px-3 py-2" placeholder="you@example.com" />
          </div>
          <button type="submit" className="w-full rounded-lg px-4 py-2 bg-black text-white dark:bg-white dark:text-black font-semibold">Request Access</button>
        </form>

        <div className="text-xs text-gray-500 mt-4">By joining the beta you agree to the Terms and Privacy Policy.</div>
      </div>
    </div>
  )
}
