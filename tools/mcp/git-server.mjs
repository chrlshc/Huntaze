// Huntaze MCP Git Server
// Exposes minimal git inspection tools (log, blame, show) via MCP.
// Usage: node mcp/git-server.mjs

import path from 'node:path'
import { promisify } from 'node:util'
import { execFile as _execFile } from 'node:child_process'
import { z } from 'zod'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'

const execFile = promisify(_execFile)
const ROOT = path.resolve(process.env.MCP_FS_ROOT || process.cwd())

function assertInsideRoot(targetPath) {
  const resolved = path.resolve(targetPath)
  const rootWithSep = ROOT.endsWith(path.sep) ? ROOT : ROOT + path.sep
  if (resolved !== ROOT && !resolved.startsWith(rootWithSep)) {
    throw new Error(`Path escapes root: ${resolved}`)
  }
  return resolved
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

const server = new McpServer({ name: 'huntaze-git', version: '0.1.0' })

// git.log tool
server.registerTool(
  'git.log',
  {
    description: 'Show recent commits (oneline). Optionally limited to a path.',
    inputSchema: {
      path: z.string().optional().describe('Restrict log to a file or directory (relative to repo root)'),
      max: z.number().int().positive().max(500).default(50)
    }
  },
  async ({ path: relPath, max }) => {
    const args = ['log', '--oneline', `-n`, String(max)]
    if (relPath) {
      const abs = assertInsideRoot(path.join(ROOT, relPath))
      args.push('--', abs)
    }
    const stdout = await runGit(args)
    return { content: [{ type: 'text', text: stdout.trim() }] }
  }
)

// git.blame tool
server.registerTool(
  'git.blame',
  {
    description: 'Blame a single line or whole file.',
    inputSchema: {
      file: z.string().describe('File path relative to repo root'),
      line: z.number().int().positive().optional()
    }
  },
  async ({ file, line }) => {
    const abs = assertInsideRoot(path.join(ROOT, file))
    const args = ['blame']
    if (line) args.push('-L', `${line},${line}`)
    args.push('--', abs)
    const stdout = await runGit(args)
    return { content: [{ type: 'text', text: stdout.trim() }] }
  }
)

// git.show tool (file at revision)
server.registerTool(
  'git.show',
  {
    description: 'Show a file at a given revision (blob content).',
    inputSchema: {
      rev: z.string().regex(/^[0-9a-fA-F]{4,64}$/).describe('Git revision (sha prefix)'),
      path: z.string().describe('File path relative to repo root')
    }
  },
  async ({ rev, path: relPath }) => {
    const repoRel = path.posix.normalize(relPath.replaceAll('\\', '/'))
    if (repoRel.startsWith('..')) throw new Error('Invalid path')
    const stdout = await runGit(['show', `${rev}:${repoRel}`])
    return { content: [{ type: 'text', text: stdout }] }
  }
)

async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
}

main().catch((err) => {
  console.error('[mcp-git] error:', err)
  process.exit(1)
})

