import { Pool } from 'pg';
// Create a singleton pool instance
let pool = null;
export function getPool() {
    if (!pool) {
        // Enable SSL for AWS RDS connections (production and test environments)
        const useSSL = process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'test';
        
        pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: useSSL ? { rejectUnauthorized: false } : false,
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
        console.log('Executed query', { text, duration, rows: res.rowCount });
        return res;
    }
    catch (error) {
        console.error('Database query error:', error);
        throw error;
    }
}
export async function getClient() {
    const pool = getPool();
    return await pool.connect();
}
