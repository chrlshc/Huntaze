#!/usr/bin/env node
import { franc } from 'franc'
import { globby } from 'globby'
import fs from 'node:fs'

const files = await globby([
  'app/**/*.{tsx,ts,jsx,js}',
  'components/**/*.{tsx,ts,jsx,js}',
  'lib/copy/**/*.json'
], { gitignore: true })

const offenders = []
for (const f of files) {
  const text = fs.readFileSync(f, 'utf8')
  // Skip minimized/large files quickly
  if (text.length < 20) continue
  const lang = franc(text, { minLength: 20 })
  if (lang && lang !== 'eng' && lang !== 'und') offenders.push([f, lang])
}

if (offenders.length) {
  console.error('Non-English text detected:')
  for (const [f, lang] of offenders) console.error(` - ${f} (${lang})`)
  process.exit(1)
} else {
  console.log('English-only check passed.')
}

