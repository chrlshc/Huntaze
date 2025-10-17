#!/usr/bin/env node
import { readFileSync, writeFileSync, existsSync } from 'fs'

const [,, file, key, value] = process.argv
if (!file || !key) {
  console.error('Usage: env-set.mjs <file> <KEY> <VALUE>')
  process.exit(1)
}

const content = existsSync(file) ? readFileSync(file, 'utf8') : ''
const lines = content.split(/\r?\n/)
let found = false
const out = lines.map((l) => {
  if (l.startsWith(`${key}=`)) { found = true; return `${key}=${value}` }
  return l
})
if (!found) out.push(`${key}=${value}`)
writeFileSync(file, out.join('\n'))
console.log(`Set ${key}`)

