// Lambda: rotate-ws-token
// - Signs a new HS256 JWT using WS_JWT_SECRET
// - Writes it to Secrets Manager secret (JSON key: token)
// - Forces an ECS service deployment so the task reloads env (Option A)

const AWS = require('aws-sdk')
const crypto = require('crypto')

const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1'
const secrets = new AWS.SecretsManager({ region })
const ecs = new AWS.ECS({ region })

function b64url(buf) {
  return Buffer.from(buf)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
}

function b64urlJson(obj) {
  return b64url(JSON.stringify(obj))
}

function signHs256(secretString, payload, ttlSeconds) {
  const now = Math.floor(Date.now() / 1000)
  const header = { alg: 'HS256', typ: 'JWT' }
  const fullPayload = { ...payload, iat: now, exp: now + ttlSeconds }
  const signingInput = `${b64urlJson(header)}.${b64urlJson(fullPayload)}`
  const sig = crypto
    .createHmac('sha256', secretString)
    .update(signingInput)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
  return `${signingInput}.${sig}`
}

exports.handler = async () => {
  const WS_JWT_SECRET = process.env.WS_JWT_SECRET
  const SECRET_ID = process.env.SECRET_ID || 'onlyfans-ws'
  const AGENT_ID = process.env.AGENT_ID || 'huntaze-of-scrap'
  const TTL_SECONDS = parseInt(process.env.TTL_SECONDS || '3600', 10)
  const CLUSTER = process.env.CLUSTER || 'huntaze-cluster'
  const SERVICE = process.env.SERVICE || 'onlyfans-scraper'

  if (!WS_JWT_SECRET) {
    console.error('WS_JWT_SECRET missing')
    throw new Error('WS_JWT_SECRET missing')
  }

  const token = signHs256(WS_JWT_SECRET, { agentId: AGENT_ID }, TTL_SECONDS)

  await secrets
    .putSecretValue({
      SecretId: SECRET_ID,
      SecretString: JSON.stringify({ token }),
    })
    .promise()
  console.log('Updated secret', SECRET_ID)

  // Option A: force ECS new deployment to reload env
  await ecs
    .updateService({ cluster: CLUSTER, service: SERVICE, forceNewDeployment: true })
    .promise()
  console.log('Triggered ECS force new deployment', { cluster: CLUSTER, service: SERVICE })

  return { status: 'ok', rotatedAt: Date.now() }
}

