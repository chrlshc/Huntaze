import { Pool } from 'pg';

// Create a singleton pool instance
// Reset pool on module reload in dev
let pool: Pool | null = null;
let loggedDbTarget = false;

// Force pool reset in development when DATABASE_URL changes
if (process.env.NODE_ENV === 'development') {
  pool = null;
}

type DbTarget = {
  configured: boolean;
  host: string;
  port: string;
  database: string;
};

type DbSslInfo = {
  enabled: boolean;
  mode: string;
  rejectUnauthorized?: boolean;
};

function parseDatabaseUrl(conn?: string): URL | null {
  if (!conn) return null;
  try {
    return new URL(conn);
  } catch {
    return null;
  }
}

function describeDatabaseTarget(conn?: string): DbTarget {
  const url = parseDatabaseUrl(conn);
  if (!url) {
    return {
      configured: false,
      host: 'unknown',
      port: 'unknown',
      database: 'unknown',
    };
  }

  const database = url.pathname.replace(/^\//, '') || 'unknown';

  return {
    configured: true,
    host: url.hostname || 'unknown',
    port: url.port || '5432',
    database,
  };
}

function resolveSslConfig(conn?: string): { ssl: false | { rejectUnauthorized: boolean }; info: DbSslInfo } {
  const url = parseDatabaseUrl(conn);
  const rawMode = (url?.searchParams.get('sslmode') ?? process.env.PGSSLMODE ?? '').toLowerCase();
  const mode = rawMode || 'default';
  const host = url?.hostname ?? '';
  const isLocalHost = host === 'localhost' || host === '127.0.0.1' || host === '::1';

  // Explicitly disable SSL only if sslmode=disable
  if (rawMode === 'disable') {
    return { ssl: false, info: { enabled: false, mode } };
  }

  // Enable SSL if sslmode is set (require, prefer, verify-full, etc.),
  // or if we're not on localhost (remote DBs often require SSL).
  const shouldEnable = rawMode
    ? rawMode !== 'disable'
    : process.env.NODE_ENV === 'production' || !isLocalHost;
  if (!shouldEnable) {
    return { ssl: false, info: { enabled: false, mode } };
  }

  // For AWS RDS, we need rejectUnauthorized: false unless using verify-full/verify-ca
  const rejectUnauthorized = rawMode === 'verify-full' || rawMode === 'verify-ca';
  return { ssl: { rejectUnauthorized }, info: { enabled: true, mode, rejectUnauthorized } };
}

function logDatabaseTarget(conn: string | undefined, sslInfo: DbSslInfo) {
  if (loggedDbTarget) return;
  if (process.env.E2E_TESTING !== '1' && process.env.LOG_DB_TARGET !== '1') return;

  const target = describeDatabaseTarget(conn);
  console.info('[db] database target', {
    configured: target.configured,
    host: target.host,
    port: target.port,
    database: target.database,
    ssl: sslInfo.enabled ? `enabled (${sslInfo.mode})` : 'disabled',
    rejectUnauthorized: sslInfo.enabled ? sslInfo.rejectUnauthorized ?? false : undefined,
  });

  loggedDbTarget = true;
}

export function getPool(): Pool {
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

export async function query(text: string, params?: any[]) {
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
