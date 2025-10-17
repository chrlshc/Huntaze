type FetchOptions = RequestInit & { json?: unknown }

type OverviewResponse = {
  stats: {
    revenue: number
    fans: number
    engagementRate: number
    avgRevenuePerFan: number
  }
  whales: Array<{
    id: string
    username?: string | null
    displayName?: string | null
    fanTier?: string | null
    totalSpent: number
    lifetimeValue: number
    lastPurchaseAt?: string | null
  }>
  opportunities: Array<{ title: string }>
}

type ChatResponse = {
  response: string
  actions?: Array<Record<string, unknown>>
  intent?: string
  stats?: Record<string, unknown>
}

type CinChatPayload = {
  response?: string
  message?: string
  actions?: Array<Record<string, unknown>>
  intent?: string
  stats?: Record<string, unknown>
}

async function request<T>(url: string, options: FetchOptions = {}): Promise<T> {
  const { json, headers, ...rest } = options
  const response = await fetch(url, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(headers || {}),
    },
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  })

  if (!response.ok) {
    const details = (await response.json().catch(() => ({}))) as Record<string, unknown>
    const message =
      (typeof details.error === 'string' ? details.error : undefined) ||
      (typeof details.message === 'string' ? details.message : undefined) ||
      response.statusText ||
      `Request to ${url} failed`
    throw new Error(message)
  }

  if (response.status === 204) {
    return {} as T
  }

  return (response.json() as Promise<T>)
}

let cachedOverview: OverviewResponse | null = null
let cacheTimestamp = 0
const CACHE_TTL_MS = 30_000

async function loadOverview(): Promise<OverviewResponse> {
  const now = Date.now()
  if (cachedOverview && now - cacheTimestamp < CACHE_TTL_MS) {
    return cachedOverview
  }

  const overview = await request<OverviewResponse>('/api/dashboard/overview')
  cachedOverview = overview
  cacheTimestamp = now
  return overview
}

export const cinAWSClient = {
  async getCreatorStats() {
    const overview = await loadOverview()
    return overview.stats
  },

  async getWhales() {
    const overview = await loadOverview()
    return overview.whales
  },

  subscribeToWhales(callback: (whale: OverviewResponse['whales'][number]) => void) {
    let cancelled = false
    const seen = new Set<string>()

    const poll = async () => {
      try {
        const whales = await this.getWhales()
        whales.forEach((whale) => {
          if (!seen.has(whale.id)) {
            seen.add(whale.id)
            callback(whale)
          }
        })
      } catch (error) {
        console.warn('[cin] Failed to refresh whales', error)
      } finally {
        if (!cancelled) {
          setTimeout(poll, 45_000)
        }
      }
    }

    void poll()

    return {
      unsubscribe() {
        cancelled = true
      },
    }
  },

  async chat(message: string): Promise<ChatResponse> {
    const payload = await request<CinChatPayload>('/api/cin/chat', {
      method: 'POST',
      json: { message },
    })

    return {
      response: payload.response || payload.message || 'I did not understand that.',
      actions: payload.actions || [],
      intent: payload.intent,
      stats: payload.stats,
    }
  },

  async scheduleContent(data: Record<string, unknown>) {
    return request('/api/content/schedule', {
      method: 'POST',
      json: data,
    })
  },
}
