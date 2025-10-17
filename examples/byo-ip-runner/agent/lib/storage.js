import fs from 'fs/promises'
import { constants as fsConstants } from 'fs'
import crypto from 'crypto'
import { STORAGE_FILE, STORAGE_KEY } from './config.js'

const HEADER = Buffer.from('BYOIPOF1')

function deriveKey() {
  if (!STORAGE_KEY) return null
  const hash = crypto.createHash('sha256')
  hash.update(STORAGE_KEY)
  return hash.digest()
}

export async function ensureStorageFile() {
  try {
    await fs.access(STORAGE_FILE, fsConstants.F_OK)
    return true
  } catch {
    return false
  }
}

export async function clearStorage() {
  try {
    await fs.unlink(STORAGE_FILE)
  } catch {
    /* noop */
  }
}

export async function loadStorageState() {
  const key = deriveKey()
  if (!key) throw new Error('BYO_AGENT_MASTER_KEY not set; cannot decrypt storage state')
  const exists = await ensureStorageFile()
  if (!exists) throw new Error('storage_state_not_found')
  const raw = await fs.readFile(STORAGE_FILE)
  if (raw.length < HEADER.length + 28) throw new Error('storage_state_corrupted')
  const header = raw.subarray(0, HEADER.length)
  if (!header.equals(HEADER)) throw new Error('storage_state_invalid_header')
  const iv = raw.subarray(HEADER.length, HEADER.length + 12)
  const tag = raw.subarray(HEADER.length + 12, HEADER.length + 28)
  const ciphertext = raw.subarray(HEADER.length + 28)
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(tag)
  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()])
  return JSON.parse(decrypted.toString('utf8'))
}

export async function saveStorageState(state) {
  const key = deriveKey()
  if (!key) throw new Error('BYO_AGENT_MASTER_KEY not set; cannot encrypt storage state')
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  const plaintext = Buffer.from(JSON.stringify(state))
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()])
  const tag = cipher.getAuthTag()
  const payload = Buffer.concat([HEADER, iv, tag, ciphertext])
  await fs.writeFile(STORAGE_FILE, payload, { mode: 0o600 })
}

