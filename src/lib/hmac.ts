import crypto from 'crypto'

const SECRET = process.env.AUTOGEN_HMAC_SECRET || 'change-me'

export function verifyHmac(body: string, signature: string) {
  const h = crypto.createHmac('sha256', SECRET).update(Buffer.from(body, 'utf8')).digest('hex')
  return signature === `sha256=${h}`
}

