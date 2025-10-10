// Huntaze MCP Env Server
// Read-only environment introspection with strict allowlist to avoid secret leakage.
// Usage: node mcp/env-server.mjs

import { z } from 'zod'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'

const server = new McpServer({ name: 'huntaze-env', version: '0.1.0' })

function buildAllowlist() {
  const fromEnv = (process.env.MCP_ENV_ALLOWLIST || '').split(',').map((s) => s.trim()).filter(Boolean)
  return new Set(['NODE_ENV', ...fromEnv])
}

function isAllowed(key) {
  if (key.startsWith('NEXT_PUBLIC_')) return true
  return buildAllowlist().has(key)
}

server.registerTool(
  'env.get',
  {
    description: 'Get selected environment variables (NEXT_PUBLIC_* and allowlisted only).',
    inputSchema: {
      keys: z.array(z.string().min(1)).min(1)
    }
  },
  async ({ keys }) => {
    const out = {}
    for (const k of keys) {
      if (!isAllowed(k)) continue
      if (Object.prototype.hasOwnProperty.call(process.env, k)) out[k] = process.env[k]
    }
    return { content: [{ type: 'text', text: JSON.stringify(out, null, 2) }] }
  }
)

server.registerTool(
  'env.list',
  {
    description: 'List available env keys (NEXT_PUBLIC_* and allowlisted). Values are not returned.',
    inputSchema: { prefix: z.string().optional() }
  },
  async ({ prefix }) => {
    const keys = Object.keys(process.env).filter((k) => isAllowed(k) && (!prefix || k.startsWith(prefix)))
    return { content: [{ type: 'text', text: JSON.stringify({ count: keys.length, keys }, null, 2) }] }
  }
)

async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
}

main().catch((err) => {
  console.error('[mcp-env] error:', err)
  process.exit(1)
})

