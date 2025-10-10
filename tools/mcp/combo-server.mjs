// Huntaze MCP Combo Server (stdio)
// Exposes FS, HTTP, Git, and Env tools in a single process.

import path from 'node:path'
import fs from 'node:fs/promises'
import { execFile as _execFile } from 'node:child_process'
import { promisify } from 'node:util'
import fg from 'fast-glob'
import { z } from 'zod'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'

const execFile = promisify(_execFile)

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

function parseHttpAllowlist() {
  const envList = (process.env.MCP_HTTP_ALLOWLIST || '').split(',').map((s) => s.trim()).filter(Boolean)
  if (envList.length > 0) return envList
  return ['https://app.huntaze.com', 'https://app.huntaze.com/api']
}

function isHttpAllowed(urlStr) {
  const allow = parseHttpAllowlist()
  if (allow.length === 0) return false
  let url
  try { url = new URL(urlStr) } catch { return false }
  if (!['http:', 'https:'].includes(url.protocol)) return false
  return allow.some((base) => {
    try {
      const b = new URL(base)
      return url.origin === b.origin && url.pathname.startsWith(b.pathname || '/')
    } catch { return false }
  })
}

async function httpFetch(method, url, { headers = {}, json, timeoutMs = 10000 } = {}) {
  if (!isHttpAllowed(url)) throw new Error(`URL not allowed by MCP_HTTP_ALLOWLIST: ${url}`)
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(url, { method, headers, body: json !== undefined ? JSON.stringify(json) : undefined, signal: ctrl.signal })
    const ct = res.headers.get('content-type') || ''
    const body = ct.includes('application/json') ? await res.json().catch(() => null) : await res.text().catch(() => '')
    return { status: res.status, headers: Object.fromEntries(res.headers.entries()), body }
  } finally { clearTimeout(t) }
}

async function runGit(args, cwd = ROOT) {
  try {
    const { stdout } = await execFile('git', args, { cwd })
    return stdout
  } catch (e) {
    const msg = e?.stderr?.toString?.() || e?.message || 'git error'
    throw new Error(msg)
  }
}

function buildEnvAllowlist() {
  const fromEnv = (process.env.MCP_ENV_ALLOWLIST || '').split(',').map((s) => s.trim()).filter(Boolean)
  return new Set(['NODE_ENV', ...fromEnv])
}
function envIsAllowed(key) {
  if (key.startsWith('NEXT_PUBLIC_')) return true
  return buildEnvAllowlist().has(key)
}

const server = new McpServer({ name: 'huntaze-combo', version: '0.1.0' })

// FS tools
server.registerTool('fs.list_files', {
  description: 'List files under repository root using a glob pattern.',
  inputSchema: { directory: z.string().default('.'), pattern: z.string().default('**/*'), limit: z.number().int().positive().max(5000).default(500) }
}, async ({ directory, pattern, limit }) => {
  const base = assertInsideRoot(path.join(ROOT, directory))
  const entries = await fg(pattern, { cwd: base, dot: false, ignore: IGNORE, onlyFiles: true })
  const files = entries.slice(0, limit).map((p) => rel(path.join(base, p)))
  return { content: [{ type: 'text', text: JSON.stringify({ root: ROOT, directory: rel(base), count: files.length, files }, null, 2) }] }
})

server.registerTool('fs.read_file', {
  description: 'Read a text file under repository root. Returns UTF-8 text unless encoding=base64.',
  inputSchema: { path: z.string(), maxBytes: z.number().int().positive().max(5_000_000).default(262144), encoding: z.enum(['utf8', 'base64']).default('utf8') }
}, async ({ path: relPath, maxBytes, encoding }) => {
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
  } finally { await fh.close() }
})

server.registerTool('fs.search_text', {
  description: 'Search for a string in text files matched by glob. Returns file, line, snippet.',
  inputSchema: { query: z.string().min(1), glob: z.string().default('**/*.{ts,tsx,js,jsx,md,css,scss,mjs,cjs,json}'), directory: z.string().default('.'), caseSensitive: z.boolean().default(false), maxResults: z.number().int().positive().max(2000).default(200), maxFileBytes: z.number().int().positive().max(2_000_000).default(512000) }
}, async ({ query, glob, directory, caseSensitive, maxResults, maxFileBytes }) => {
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
})

// HTTP tools
server.registerTool('http.get', {
  description: 'HTTP GET (allowlisted origins only). Returns status, headers, body (json or text).',
  inputSchema: { url: z.string().url(), headers: z.record(z.string()).optional(), timeoutMs: z.number().int().min(1).max(60000).default(10000) }
}, async ({ url, headers, timeoutMs }) => {
  const result = await httpFetch('GET', url, { headers, timeoutMs })
  return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }
})

server.registerTool('http.post', {
  description: 'HTTP POST with JSON body (allowlisted origins only).',
  inputSchema: { url: z.string().url(), headers: z.record(z.string()).optional(), json: z.any().optional(), timeoutMs: z.number().int().min(1).max(60000).default(10000) }
}, async ({ url, headers = {}, json, timeoutMs }) => {
  headers = { 'content-type': 'application/json', ...headers }
  const result = await httpFetch('POST', url, { headers, json, timeoutMs })
  return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }
})

server.registerTool('http.head', {
  description: 'HTTP HEAD (allowlisted origins only). Returns status + headers only.',
  inputSchema: { url: z.string().url(), headers: z.record(z.string()).optional(), timeoutMs: z.number().int().min(1).max(60000).default(10000) }
}, async ({ url, headers, timeoutMs }) => {
  const { status, headers: h } = await httpFetch('HEAD', url, { headers, timeoutMs })
  return { content: [{ type: 'text', text: JSON.stringify({ status, headers: h }, null, 2) }] }
})

// Git tools
server.registerTool('git.log', {
  description: 'Show recent commits (oneline). Optionally limited to a path.',
  inputSchema: { path: z.string().optional(), max: z.number().int().positive().max(500).default(50) }
}, async ({ path: relPath, max }) => {
  const args = ['log', '--oneline', '-n', String(max)]
  if (relPath) { const abs = assertInsideRoot(path.join(ROOT, relPath)); args.push('--', abs) }
  const stdout = await runGit(args)
  return { content: [{ type: 'text', text: stdout.trim() }] }
})

server.registerTool('git.blame', {
  description: 'Blame a single line or whole file.',
  inputSchema: { file: z.string(), line: z.number().int().positive().optional() }
}, async ({ file, line }) => {
  const abs = assertInsideRoot(path.join(ROOT, file))
  const args = ['blame']
  if (line) args.push('-L', `${line},${line}`)
  args.push('--', abs)
  const stdout = await runGit(args)
  return { content: [{ type: 'text', text: stdout.trim() }] }
})

server.registerTool('git.show', {
  description: 'Show a file at a given revision (blob content).',
  inputSchema: { rev: z.string().regex(/^[0-9a-fA-F]{4,64}$/), path: z.string() }
}, async ({ rev, path: relPath }) => {
  const repoRel = path.posix.normalize(relPath)
  if (repoRel.startsWith('..')) throw new Error('Invalid path')
  const stdout = await runGit(['show', `${rev}:${repoRel}`])
  return { content: [{ type: 'text', text: stdout }] }
})

// Env tools
server.registerTool('env.get', {
  description: 'Get selected environment variables (NEXT_PUBLIC_* and allowlisted only).',
  inputSchema: { keys: z.array(z.string().min(1)).min(1) }
}, async ({ keys }) => {
  const out = {}
  for (const k of keys) {
    if (!envIsAllowed(k)) continue
    if (Object.prototype.hasOwnProperty.call(process.env, k)) out[k] = process.env[k]
  }
  return { content: [{ type: 'text', text: JSON.stringify(out, null, 2) }] }
})

server.registerTool('env.list', {
  description: 'List available env keys (NEXT_PUBLIC_* and allowlisted). Values are not returned.',
  inputSchema: { prefix: z.string().optional() }
}, async ({ prefix }) => {
  const keys = Object.keys(process.env).filter((k) => envIsAllowed(k) && (!prefix || k.startsWith(prefix)))
  return { content: [{ type: 'text', text: JSON.stringify({ count: keys.length, keys }, null, 2) }] }
})

async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
}

main().catch((err) => { console.error('[mcp-combo] error:', err); process.exit(1) })

