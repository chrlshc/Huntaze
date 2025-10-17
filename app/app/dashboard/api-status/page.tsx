"use client";
import React, { useEffect, useState } from 'react'

type Status = {
  status: 'healthy' | 'configured' | 'fallback' | 'unconfigured' | 'warning' | 'error'
  api_type?: string
  rate_limit?: string | null
  message?: string
  error?: string
  endpoint?: string
  model?: string
  queue?: string
  region?: string
  last_checked?: string
}

type Platforms = {
  instagram: Status
  tiktok: Status
  reddit: Status
  azure_openai: Status
  sqs: Status
}

export default function APIStatusDashboard() {
  const [data, setData] = useState<{ overall_status: string; platforms: Platforms } | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchStatus = async () => {
    setLoading(true)
    try {
      const r = await fetch('/api/health/platforms', { cache: 'no-store' })
      const j = await r.json()
      setData(j)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStatus()
    const id = setInterval(fetchStatus, 30000)
    return () => clearInterval(id)
  }, [])

  const statusCls = (s?: string) => {
    switch (s) {
      case 'healthy': return 'bg-green-100 text-green-800 border-green-200'
      case 'configured': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'fallback': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'unconfigured': return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'error': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const Card = ({ title, s }: { title: string; s: Status }) => (
    <div className={`p-4 rounded-lg border ${statusCls(s?.status)}`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold">{title}</h3>
        <span className="text-xs uppercase tracking-wide">{s?.status}</span>
      </div>
      <div className="text-sm space-y-1">
        {s?.api_type && <p>API: {s.api_type}</p>}
        {s?.endpoint && <p>Endpoint: {s.endpoint}</p>}
        {s?.model && <p>Model: {s.model}</p>}
        {s?.queue && <p>Queue: {s.queue}</p>}
        {s?.region && <p>Region: {s.region}</p>}
        {s?.rate_limit && <p>Rate Limit: {s.rate_limit}</p>}
        {s?.message && <p>{s.message}</p>}
        {s?.error && <p>Error: {s.error}</p>}
      </div>
    </div>
  )

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">API Status Dashboard</h1>
        <button onClick={fetchStatus} className="px-3 py-2 rounded bg-black text-white text-sm">{loading ? 'Loading…' : 'Refresh'}</button>
      </div>

      {data && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card title="Instagram" s={data.platforms.instagram} />
          <Card title="TikTok" s={data.platforms.tiktok} />
          <Card title="Reddit" s={data.platforms.reddit} />
          <Card title="Azure OpenAI" s={data.platforms.azure_openai} />
          <Card title="SQS" s={data.platforms.sqs} />
        </div>
      )}
    </div>
  )
}

