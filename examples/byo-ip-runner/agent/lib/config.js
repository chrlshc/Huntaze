import path from 'path'
import os from 'os'

const DEFAULT_STORAGE_FILE = path.join(os.homedir(), '.byo-ip-of-storage.enc')

const DEFAULT_RATE_LIMITS = {
  send_dm: { capacity: 20, refillPerHour: 20, burst: 5 },
  broadcast_dm: { capacity: 5, refillPerHour: 5, burst: 1 },
  schedule_post: { capacity: 6, refillPerHour: 6, burst: 1 },
  scrape_subs: { capacity: 12, refillPerHour: 12, burst: 1 },
  scrape_messages: { capacity: 12, refillPerHour: 12, burst: 1 },
  check_notifications: { capacity: 120, refillPerHour: 600, burst: 5 }
}

function parseJsonEnv(name, fallback) {
  const raw = process.env[name]
  if (!raw) return fallback
  try {
    const parsed = JSON.parse(raw)
    return parsed
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn(`[agent-config] Failed to parse ${name}:`, err.message)
    return fallback
  }
}

export const AGENT_VERSION = '0.2.0'

export const STORAGE_FILE = process.env.BYO_AGENT_STORAGE_FILE || DEFAULT_STORAGE_FILE

export const STORAGE_KEY = process.env.BYO_AGENT_MASTER_KEY || null

export const RATE_LIMITS = parseJsonEnv('BYO_AGENT_RL_CONFIG', DEFAULT_RATE_LIMITS)

export const ONLYFANS_BASE_URL = process.env.BYO_AGENT_OF_BASE_URL || 'https://onlyfans.com'

export const LOGIN_TIMEOUT_MS = Number(process.env.BYO_AGENT_LOGIN_TIMEOUT_MS || 180000)

export const MAX_RETRIES = Number(process.env.BYO_AGENT_MAX_RETRIES || 3)

export const HEADLESS = String(process.env.BYO_AGENT_VISIBLE || 'false').toLowerCase() !== 'true'
