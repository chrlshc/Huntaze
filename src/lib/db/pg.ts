import { Pool, QueryResult, QueryResultRow } from 'pg'

let _pool: Pool | null = null
let loggedDbTarget = false

type DbSslInfo = {
  enabled: boolean
  mode: string
  rejectUnauthorized?: boolean
}

function parseDatabaseUrl(conn?: string): URL | null {
  if (!conn) return null
  try {
    return new URL(conn)
  } catch {
    return null
  }
}

function resolveSslConfig(conn?: string): { ssl: false | { rejectUnauthorized: boolean }; info: DbSslInfo } {
  const url = parseDatabaseUrl(conn)
  const rawMode = (url?.searchParams.get('sslmode') ?? process.env.PGSSLMODE ?? '').toLowerCase()
  const mode = rawMode || 'default'
  const host = url?.hostname ?? ''
  const isLocalHost = host === 'localhost' || host === '127.0.0.1' || host === '::1'

  if (rawMode === 'disable') {
    return { ssl: false, info: { enabled: false, mode } }
  }

  const shouldEnable = rawMode
    ? rawMode !== 'disable'
    : process.env.NODE_ENV === 'production' || !isLocalHost
  if (!shouldEnable) {
    return { ssl: false, info: { enabled: false, mode } }
  }

  const rejectUnauthorized = rawMode === 'verify-full' || rawMode === 'verify-ca'
  return { ssl: { rejectUnauthorized }, info: { enabled: true, mode, rejectUnauthorized } }
}

function logDatabaseTarget(conn: string | undefined, sslInfo: DbSslInfo) {
  if (loggedDbTarget) return
  if (process.env.E2E_TESTING !== '1' && process.env.LOG_DB_TARGET !== '1') return

  const url = parseDatabaseUrl(conn)
  const database = url?.pathname?.replace(/^\//, '') || 'unknown'
  const host = url?.hostname || 'unknown'
  const port = url?.port || '5432'

  console.info('[db] database target', {
    configured: !!url,
    host,
    port,
    database,
    ssl: sslInfo.enabled ? `enabled (${sslInfo.mode})` : 'disabled',
    rejectUnauthorized: sslInfo.enabled ? sslInfo.rejectUnauthorized ?? false : undefined,
  })

  loggedDbTarget = true
}

export function getPg() {
  if (_pool) return _pool
  const conn = process.env.DATABASE_URL
  if (!conn) throw new Error('DATABASE_URL not set')
  const { ssl, info } = resolveSslConfig(conn)
  logDatabaseTarget(conn, info)
  _pool = new Pool({ connectionString: conn, max: 10, ssl })
  return _pool
}

export async function query<T extends QueryResultRow = QueryResultRow>(text: string, params?: any[]): Promise<QueryResult<T>> {
  const pool = getPg()
  const res = await pool.query<T>(text, params)
  return res
}
