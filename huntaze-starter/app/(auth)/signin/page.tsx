"use client"

import { FormEvent, useState, Suspense } from "react"
import { signIn } from "next-auth/react"
import { useSearchParams } from "next/navigation"

import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"
import Label from "@/components/ui/Label"

function SignInForm() {
  const params = useSearchParams()
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [isSubmitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const callbackUrl = params?.get("callbackUrl") || "/marketing/planner"

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    const result = await signIn("credentials", {
      email,
      name,
      redirect: false,
      callbackUrl,
    })

    if (result?.error) {
      setError(result.error)
      setSubmitting(false)
      return
    }

    if (result?.ok) {
      window.location.href = result.url ?? callbackUrl
    } else {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-500/10 via-background to-background flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-lg">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 h-11 w-11 rounded-full bg-brand/10 ring-1 ring-brand/30" />
          <h1 className="text-xl font-semibold">Sign in to Huntaze</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Use any email to access the dashboard. Identity is mocked for this demo.
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="name">Name (optional)</Label>
            <Input
              id="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Taylor, Manager, ..."
            />
          </div>

          {error && (
            <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isSubmitting || !email}>
            {isSubmitting ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </div>
    </div>
  )
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading…</div>}>
      <SignInForm />
    </Suspense>
  )
}
