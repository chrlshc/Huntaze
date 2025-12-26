import { describe, it, expect } from 'vitest';

const databaseUrl = process.env.DATABASE_URL;
const describeDb = databaseUrl ? describe : describe.skip;

describeDb('Database performance', () => {
  it('DATABASE_URL is a valid Postgres connection string', () => {
    const parsed = new URL(databaseUrl as string);
    expect(['postgres:', 'postgresql:']).toContain(parsed.protocol);
    expect(parsed.hostname.length).toBeGreaterThan(0);
    expect(parsed.pathname.length).toBeGreaterThan(1);
  });
});
