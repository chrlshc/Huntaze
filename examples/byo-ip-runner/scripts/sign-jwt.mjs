#!/usr/bin/env node
import jwt from 'jsonwebtoken'

const secret = process.env.WS_JWT_SECRET || process.argv[2]
const agentId = process.env.AGENT_ID || process.argv[3] || 'DEV-AGENT-123'
const creatorId = process.env.CREATOR_ID || process.argv[4] || 'creator-xyz'
const ttl = Number(process.env.JWT_TTL || process.argv[5] || 300)

if (!secret) {
  console.error('Usage: WS_JWT_SECRET=secret node scripts/sign-jwt.mjs [secret] [agentId] [creatorId] [ttlSec]')
  process.exit(1)
}

const token = jwt.sign({ agentId, creatorId }, secret, { algorithm: 'HS256', expiresIn: ttl })
console.log(encodeURIComponent(token))

