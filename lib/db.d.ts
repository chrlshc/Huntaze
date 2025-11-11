import { Pool } from 'pg';
export declare function getPool(): Pool;
export declare function query(text: string, params?: any[]): Promise<import("pg").QueryResult<any>>;
export declare function getClient(): Promise<import("pg").PoolClient>;
