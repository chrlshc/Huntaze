import { Pool } from 'pg'

let _pool: Pool | null = null

export function getPg() {
  if (_pool) return _pool
  const conn = process.env.DATABASE_URL
  if (!conn) throw new Error('DATABASE_URL not set')
  _pool = new Pool({ connectionString: conn, max: 10 })
  return _pool
}

export async function query<T = any>(text: string, params?: any[]) {
  const pool = getPg()
  const res = await pool.query<T>(text, params)
  return res
}

