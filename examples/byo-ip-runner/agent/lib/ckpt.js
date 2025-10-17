import fs from 'fs/promises'
import os from 'os'
import path from 'path'

const CKPT_FILE = path.join(os.homedir(), '.byo-ip-ckpt.json')

async function loadAll() {
  try {
    const raw = await fs.readFile(CKPT_FILE, 'utf8')
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

export async function load(key) {
  const all = await loadAll()
  return all[key]
}

export async function save(key, value) {
  const all = await loadAll()
  all[key] = value
  await fs.writeFile(CKPT_FILE, JSON.stringify(all, null, 2))
}

