'use strict';
// Durable idempotence store (Postgres) for published posts
// Uses env POSTGRES_* to connect, creates table if needed, inserts unique idempotency key

const { Client } = require('pg')

async function connect() {
  const host = process.env.POSTGRES_HOST
  const database = process.env.POSTGRES_DB || 'huntaze'
  const user = process.env.POSTGRES_USER || 'huntazeadmin'
  const password = process.env.POSTGRES_PASSWORD
  if (!host || !password) throw new Error('Postgres not configured (POSTGRES_HOST/POSTGRES_PASSWORD)')
  const client = new Client({ host, database, user, password })
  await client.connect()
  return client
}

async function ensureTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS published_posts (
      id SERIAL PRIMARY KEY,
      idempotency_key TEXT UNIQUE,
      platform TEXT NOT NULL,
      campaign_id TEXT,
      content_id TEXT,
      post_id TEXT,
      permalink TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `)
}

async function recordPost({ idempotencyKey, platform, campaignId, contentId, postId, permalink }) {
  const client = await connect()
  try {
    await ensureTable(client)
    await client.query(
      `INSERT INTO published_posts (idempotency_key, platform, campaign_id, content_id, post_id, permalink)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (idempotency_key) DO NOTHING`,
      [idempotencyKey, platform, campaignId || null, contentId || null, postId || null, permalink || null]
    )
  } finally {
    await client.end()
  }
}

module.exports = { recordPost }

