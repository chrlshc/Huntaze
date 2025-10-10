// Huntaze MCP HTTP Server
// Safe HTTP client tools with allowlist + timeouts.
// Usage: node mcp/http-server.mjs

import { z } from 'zod'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'

const server = new McpServer({ name: 'huntaze-http', version: '0.1.0' })

function parseAllowlist() {
  const envList = (process.env.MCP_HTTP_ALLOWLIST || '').split(',').map((s) => s.trim()).filter(Boolean)
  if (envList.length > 0) return envList
  // Default: strict to app.huntaze.com and its /api
  return ['https://app.huntaze.com', 'https://app.huntaze.com/api']
}

function isAllowed(urlStr) {
  const allow = parseAllowlist()
  if (allow.length === 0) return false
  let url
  try {
    url = new URL(urlStr)
  } catch {
    return false
  }
  if (!['http:', 'https:'].includes(url.protocol)) return false
  return allow.some((base) => {
    try {
      const b = new URL(base)
      return url.origin === b.origin && url.pathname.startsWith(b.pathname || '/')
    } catch {
      return false
    }
  })
}

async function doFetch(method, url, { headers = {}, json, timeoutMs = 10000 } = {}) {
  if (!isAllowed(url)) throw new Error(`URL not allowed by MCP_HTTP_ALLOWLIST: ${url}`)
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      method,
      headers,
      body: json !== undefined ? JSON.stringify(json) : undefined,
      signal: ctrl.signal
    })
    const ct = res.headers.get('content-type') || ''
    const body = ct.includes('application/json') ? await res.json().catch(() => null) : await res.text().catch(() => '')
    return { status: res.status, headers: Object.fromEntries(res.headers.entries()), body }
  } finally {
    clearTimeout(t)
  }
}

// http.get tool
server.registerTool(
  'http.get',
  {
    description: 'HTTP GET (allowlisted origins only). Returns status, headers, body (json or text).',
    inputSchema: {
      url: z.string().url(),
      headers: z.record(z.string()).optional(),
      timeoutMs: z.number().int().min(1).max(60000).default(10000)
    }
  },
  async ({ url, headers, timeoutMs }) => {
    const result = await doFetch('GET', url, { headers, timeoutMs })
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }
  }
)

// http.post tool (JSON only)
server.registerTool(
  'http.post',
  {
    description: 'HTTP POST with JSON body (allowlisted origins only).',
    inputSchema: {
      url: z.string().url(),
      headers: z.record(z.string()).optional(),
      json: z.any().optional(),
      timeoutMs: z.number().int().min(1).max(60000).default(10000)
    }
  },
  async ({ url, headers = {}, json, timeoutMs }) => {
    headers = { 'content-type': 'application/json', ...headers }
    const result = await doFetch('POST', url, { headers, json, timeoutMs })
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }
  }
)

// http.head tool
server.registerTool(
  'http.head',
  {
    description: 'HTTP HEAD (allowlisted origins only). Returns status + headers only.',
    inputSchema: {
      url: z.string().url(),
      headers: z.record(z.string()).optional(),
      timeoutMs: z.number().int().min(1).max(60000).default(10000)
    }
  },
  async ({ url, headers, timeoutMs }) => {
    const { status, headers: h } = await doFetch('HEAD', url, { headers, timeoutMs })
    return { content: [{ type: 'text', text: JSON.stringify({ status, headers: h }, null, 2) }] }
  }
)

async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
}

main().catch((err) => {
  console.error('[mcp-http] error:', err)
  process.exit(1)
})
