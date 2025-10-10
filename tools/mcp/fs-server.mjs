// Huntaze MCP Filesystem Server
// Exposes safe, read-only filesystem tools for agents via MCP (stdio transport).
// Usage: node mcp/fs-server.mjs

import path from 'node:path'
import fs from 'node:fs/promises'
import fg from 'fast-glob'
import { z } from 'zod'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'

const ROOT = path.resolve(process.env.MCP_FS_ROOT || process.cwd())
const IGNORE = ['**/node_modules/**', '**/.git/**', '**/.next/**', '**/dist/**', '**/build/**']

function assertInsideRoot(targetPath) {
  const resolved = path.resolve(targetPath)
  const rootWithSep = ROOT.endsWith(path.sep) ? ROOT : ROOT + path.sep
  if (resolved !== ROOT && !resolved.startsWith(rootWithSep)) {
    throw new Error(`Path escapes root: ${resolved}`)
  }
  return resolved
}

function rel(p) {
  return path.relative(ROOT, p) || '.'
}

const server = new McpServer({ name: 'huntaze-fs', version: '0.1.0' })

// list_files tool
server.registerTool(
  'fs.list_files',
  {
    description: 'List files under repository root using a glob pattern.',
    inputSchema: {
      directory: z.string().default('.').describe('Base directory relative to repo root'),
      pattern: z.string().default('**/*').describe('Glob pattern (fast-glob)'),
      limit: z.number().int().positive().max(5000).default(500).describe('Max files to return')
    }
  },
  async ({ directory, pattern, limit }) => {
    const base = assertInsideRoot(path.join(ROOT, directory))
    const entries = await fg(pattern, { cwd: base, dot: false, ignore: IGNORE, onlyFiles: true })
    const files = entries.slice(0, limit).map((p) => rel(path.join(base, p)))
    return { content: [{ type: 'text', text: JSON.stringify({ root: ROOT, directory: rel(base), count: files.length, files }, null, 2) }] }
  }
)

// read_file tool
server.registerTool(
  'fs.read_file',
  {
    description: 'Read a text file under repository root. Returns UTF-8 text unless encoding=base64.',
    inputSchema: {
      path: z.string().describe('File path relative to repo root'),
      maxBytes: z.number().int().positive().max(5_000_000).default(262144).describe('Max bytes to read'),
      encoding: z.enum(['utf8', 'base64']).default('utf8')
    }
  },
  async ({ path: relPath, maxBytes, encoding }) => {
    const abs = assertInsideRoot(path.join(ROOT, relPath))
    const st = await fs.stat(abs)
    const shouldTruncate = st.size > maxBytes
    const fh = await fs.open(abs, 'r')
    try {
      const buf = Buffer.alloc(Math.min(Number(maxBytes), st.size))
      await fh.read(buf, 0, buf.length, 0)
      const body = encoding === 'base64' ? buf.toString('base64') : buf.toString('utf8')
      const meta = { path: rel(abs), size: st.size, truncated: shouldTruncate, encoding }
      return { content: [{ type: 'text', text: JSON.stringify({ meta, body }, null, 2) }] }
    } finally {
      await fh.close()
    }
  }
)

// search_text tool
server.registerTool(
  'fs.search_text',
  {
    description: 'Search for a string in text files matched by glob. Returns file, line, snippet.',
    inputSchema: {
      query: z.string().min(1).describe('Text to search (literal match)'),
      glob: z.string().default('**/*.{ts,tsx,js,jsx,md,css,scss,mjs,cjs,json}'),
      directory: z.string().default('.'),
      caseSensitive: z.boolean().default(false),
      maxResults: z.number().int().positive().max(2000).default(200),
      maxFileBytes: z.number().int().positive().max(2_000_000).default(512000)
    }
  },
  async ({ query, glob, directory, caseSensitive, maxResults, maxFileBytes }) => {
    const base = assertInsideRoot(path.join(ROOT, directory))
    const matcher = await fg(glob, { cwd: base, dot: false, ignore: IGNORE, onlyFiles: true })
    const needle = caseSensitive ? query : query.toLowerCase()
    const out = []
    for (const entry of matcher) {
      if (out.length >= maxResults) break
      const abs = path.join(base, entry)
      const st = await fs.stat(abs)
      if (st.size > maxFileBytes) continue
      const text = await fs.readFile(abs, 'utf8').catch(() => '')
      const hay = caseSensitive ? text : text.toLowerCase()
      if (hay.includes(needle)) {
        const lines = text.split(/\r?\n/)
        for (let i = 0; i < lines.length && out.length < maxResults; i++) {
          const lineHay = caseSensitive ? lines[i] : lines[i].toLowerCase()
          if (lineHay.includes(needle)) {
            out.push({ file: rel(path.join(base, entry)), line: i + 1, snippet: lines[i].slice(0, 500) })
          }
        }
      }
    }
    return { content: [{ type: 'text', text: JSON.stringify({ root: ROOT, directory: rel(base), query, count: out.length, results: out }, null, 2) }] }
  }
)

async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
}

main().catch((err) => {
  console.error('[mcp-fs] error:', err)
  process.exit(1)
})

