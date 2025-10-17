/* eslint-disable i18next/no-literal-string */
"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Badge from "@/components/ui/Badge"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { cinAWSClient } from "@/lib/cin/client"
import {
  AlertCircle,
  DollarSign,
  MessageCircle,
  Send,
  TrendingUp,
  Users,
  Zap
} from "lucide-react"

type CreatorStats = {
  revenue: number
  fans: number
  engagementRate: number
  avgRevenuePerFan: number
}

type WhaleFan = {
  id: string
  username?: string | null
  displayName?: string | null
  fanTier?: string | null
  totalSpent: number
  lifetimeValue: number
  lastPurchaseAt?: string | null
}

type Message = {
  id: string
  text: string
  sender: "user" | "ai"
  timestamp: Date
  intent?: string
  actions?: Array<Record<string, unknown>>
}

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })
const percent = new Intl.NumberFormat("en-US", { style: "percent", maximumFractionDigits: 1 })

export function CinAIChat() {
  const [stats, setStats] = useState<CreatorStats | null>(null)
  const [whales, setWhales] = useState<WhaleFan[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [newWhale, setNewWhale] = useState<WhaleFan | null>(null)
  const chatViewportRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let active = true

    const bootstrap = async () => {
      try {
        const [creatorStats, whaleList] = await Promise.all([
          cinAWSClient.getCreatorStats(),
          cinAWSClient.getWhales(),
        ])
        if (!active) return
        setStats(creatorStats)
        setWhales(whaleList)
      } catch (error) {
        if (!active) return
        const message = error instanceof Error ? error.message : "Unable to load CIN overview data."
        console.error("[cin] failed to load overview", error)
        setErrorMessage(message)
      }
    }

    bootstrap()
    const subscription = cinAWSClient.subscribeToWhales((whale) => {
      if (!active) return
      setNewWhale(whale)
      setWhales((prev) => {
        if (prev.find((item) => item.id === whale.id)) return prev
        return [whale, ...prev]
      })
      setTimeout(() => {
        if (active) setNewWhale(null)
      }, 5000)
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    const viewport = chatViewportRef.current
    if (!viewport) return
    viewport.scrollTop = viewport.scrollHeight
  }, [messages])

  const statCards = useMemo(() => {
    if (!stats) return []
    return [
      { label: "Monthly revenue", value: currency.format(stats.revenue), icon: DollarSign },
      { label: "Active fans", value: stats.fans.toLocaleString('en-US'), icon: Users },
      { label: "Engagement rate", value: percent.format(stats.engagementRate || 0), icon: TrendingUp },
      { label: "Revenue / fan", value: currency.format(stats.avgRevenuePerFan || 0), icon: MessageCircle },
    ]
  }, [stats])

  async function sendMessage() {
    if (!input.trim() || loading) return

    const userMessage: Message = {
      id: crypto.randomUUID(),
      text: input,
      sender: "user",
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setLoading(true)

    try {
      setErrorMessage(null)
      const response = await cinAWSClient.chat(userMessage.text)

      const aiMessage: Message = {
        id: crypto.randomUUID(),
        text: response.response,
        sender: "ai",
        timestamp: new Date(),
        intent: response.intent,
        actions: response.actions,
      }
      setMessages((prev) => [...prev, aiMessage])

      if (response.stats) {
        setStats((prev) => ({ ...prev, ...(response.stats as CreatorStats) }))
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "CIN AI failed to respond."
      console.error("[cin] chat error", error)
      setErrorMessage(message)
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          text: "I ran into an error. Please try again in a moment.",
          sender: "ai",
          timestamp: new Date(),
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  async function handleAction(action: Record<string, unknown>) {
    const type = action?.type
    if (type === "schedule") {
      await cinAWSClient.scheduleContent(action)
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          text: "Scheduling request queued. A manager will review before publishing.",
          sender: "ai",
          timestamp: new Date(),
        },
      ])
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
      <div className="flex flex-col gap-6">
        {newWhale && (
          <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            <div className="flex-1">
              <div className="font-medium">New {newWhale.fanTier?.toUpperCase() || "VIP"} detected</div>
              <div className="text-muted-foreground">
                {currency.format(newWhale.lifetimeValue)} lifetime spend — reach out manually to secure the upsell.
              </div>
            </div>
          </div>
        )}

        {statCards.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2">
            {statCards.map(({ label, value, icon: Icon }) => (
              <Card key={label}>
                <CardContent className="flex items-center justify-between py-4">
                  <div>
                    <div className="text-sm text-muted-foreground">{label}</div>
                    <div className="text-xl font-semibold">{value}</div>
                  </div>
                  <span className="rounded-full bg-brand/10 p-2 text-brand">
                    <Icon className="h-5 w-5" />
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Card className="flex h-[560px] flex-col">
          <CardHeader className="flex flex-col gap-1">
            <CardTitle>CIN AI Command Center</CardTitle>
            <CardDescription>Ask for scheduling help, pricing advice, or whale follow-ups.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-4">
            <div ref={chatViewportRef} className="flex-1 space-y-4 overflow-y-auto pr-2">
              {messages.length === 0 && (
                <div className="rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">
                  Start a conversation — CIN AI can orchestrate schedules, prep A/B tests, and surface high-value fans.
                </div>
              )}

              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[70%] rounded-lg px-4 py-3 text-sm leading-relaxed shadow-sm ${
                      message.sender === "user"
                        ? "bg-brand text-white"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{message.text}</div>
                    {message.intent && (
                      <Badge variant="info" className="mt-2">
                        {message.intent}
                      </Badge>
                    )}
                    {message.actions && message.actions.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {message.actions.map((action, index) => (
                          <Button
                            key={index}
                            size="sm"
                            variant="secondary"
                            className="w-full"
                            onClick={() => handleAction(action)}
                          >
                            <Zap className="mr-2 h-4 w-4" />
                            {action.label ?? "Run action"}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {errorMessage && (
              <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {errorMessage}
              </div>
            )}

            <form
              className="flex items-center gap-3"
              onSubmit={(event) => {
                event.preventDefault()
                void sendMessage()
              }}
            >
              <Input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ask CIN AI how to grow revenue this week..."
              />
              <Button type="submit" disabled={loading || !input.trim()}>
                <Send className="mr-2 h-4 w-4" />
                {loading ? "Sending…" : "Send"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>High-value fans</CardTitle>
            <CardDescription>Whales and VIPs detected in the last 90 days.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {whales.length === 0 ? (
              <div className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
                Not enough data yet. Connect OnlyFans to start tracking whales.
              </div>
            ) : (
              whales.slice(0, 6).map((whale) => (
                <div key={whale.id} className="rounded-lg border border-border p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{whale.displayName || whale.username || `Fan ${whale.id}`}</div>
                      <div className="text-xs text-muted-foreground">
                        Lifetime value: {currency.format(whale.lifetimeValue)}
                      </div>
                    </div>
                    <Badge variant="outline">{(whale.fanTier || 'vip').toUpperCase()}</Badge>
                  </div>
                  {whale.lastPurchaseAt && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      Last purchase: {new Date(whale.lastPurchaseAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Playbook</CardTitle>
            <CardDescription>Quick wins surfaced by CIN AI.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <div className="rounded-md bg-brand/10 p-2 text-brand"><Zap className="h-4 w-4" /></div>
              <div>
                <div className="font-medium">Schedule tonight's teaser at 21:00</div>
                <p className="text-muted-foreground">Peak conversions happen between 20:30 and 22:00 for your audience.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="rounded-md bg-brand/10 p-2 text-brand"><DollarSign className="h-4 w-4" /></div>
              <div>
                <div className="font-medium">Launch a $19 PPV bundle for whales</div>
                <p className="text-muted-foreground">Recent whales have spent {currency.format(220)} on average in the last 30 days.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="rounded-md bg-brand/10 p-2 text-brand"><Users className="h-4 w-4" /></div>
              <div>
                <div className="font-medium">Send a check-in DM to inactive VIPs</div>
                <p className="text-muted-foreground">3 VIP fans have been inactive for 10+ days. A manual nudge often reactivates them.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
