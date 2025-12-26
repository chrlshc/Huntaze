import { Pool } from 'pg';

// Create a singleton pool instance
let pool = null;
let loggedDbTarget = false;

function parseDatabaseUrl(conn) {
  if (!conn) return null;
  try {
    return new URL(conn);
  } catch {
    return null;
  }
}

function resolveSslConfig(conn) {
  const url = parseDatabaseUrl(conn);
  const rawMode = ((url?.searchParams.get('sslmode') ?? process.env.PGSSLMODE ?? '')).toLowerCase();
  const mode = rawMode || 'default';
  const host = url?.hostname ?? '';
  const isLocalHost = host === 'localhost' || host === '127.0.0.1' || host === '::1';

  if (rawMode === 'disable') {
    return { ssl: false, info: { enabled: false, mode } };
  }

  const shouldEnable = rawMode
    ? rawMode !== 'disable'
    : process.env.NODE_ENV === 'production' || !isLocalHost;

  if (!shouldEnable) {
    return { ssl: false, info: { enabled: false, mode } };
  }

  const rejectUnauthorized = rawMode === 'verify-full' || rawMode === 'verify-ca';
  return { ssl: { rejectUnauthorized }, info: { enabled: true, mode, rejectUnauthorized } };
}

function logDatabaseTarget(conn, sslInfo) {
  if (loggedDbTarget) return;
  if (process.env.E2E_TESTING !== '1' && process.env.LOG_DB_TARGET !== '1') return;

  const url = parseDatabaseUrl(conn);
  const database = url?.pathname?.replace(/^\//, '') || 'unknown';
  const host = url?.hostname || 'unknown';
  const port = url?.port || '5432';

  console.info('[db] database target', {
    configured: !!url,
    host,
    port,
    database,
    ssl: sslInfo.enabled ? `enabled (${sslInfo.mode})` : 'disabled',
    rejectUnauthorized: sslInfo.enabled ? sslInfo.rejectUnauthorized ?? false : undefined,
  });

  loggedDbTarget = true;
}

export function getPool() {
  if (!pool) {
    const { ssl, info } = resolveSslConfig(process.env.DATABASE_URL);
    logDatabaseTarget(process.env.DATABASE_URL, info);

    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
    });
  }
  return pool;
}

export async function query(text, params) {
  const pool = getPool();
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    if (process.env.NODE_ENV !== 'production' && process.env.LOG_DB_QUERIES === '1') {
      console.log('Executed query', { text, duration, rows: res.rowCount });
    }
    return res;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

export async function getClient() {
  const pool = getPool();
  return await pool.connect();
}
