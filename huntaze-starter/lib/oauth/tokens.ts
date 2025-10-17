import { DynamoDBClient, UpdateItemCommand } from '@aws-sdk/client-dynamodb'

export type Provider = 'tiktok' | 'reddit' | 'instagram-graph' | 'instagram-basic'

export interface OAuthTokenRecord {
  userId: string
  provider: Provider
  accessToken: string
  refreshToken?: string
  expiresAt?: Date
  scopes?: string[]
  providerUserId?: string
  extra?: Record<string, any>
}

function getRegion(): string {
  return process.env.AWS_REGION || process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1'
}

function getTable(): string {
  return process.env.TOKENS_TABLE || 'huntaze-oauth-tokens'
}

export async function saveOAuthToken(rec: OAuthTokenRecord): Promise<void> {
  const ddb = new DynamoDBClient({ region: getRegion() })
  const TableName = getTable()
  const nowIso = new Date().toISOString()

  const expr: string[] = [
    '#at = :at',
    '#ua = :ua',
  ]
  const names: Record<string, string> = { '#at': 'access_token', '#ua': 'updated_at' }
  const values: Record<string, any> = {
    ':at': { S: rec.accessToken },
    ':ua': { S: nowIso },
  }
  if (rec.refreshToken !== undefined) { expr.push('#rt = :rt'); names['#rt'] = 'refresh_token'; values[':rt'] = { S: rec.refreshToken } }
  if (rec.expiresAt) { expr.push('#ea = :ea'); names['#ea'] = 'expires_at'; values[':ea'] = { S: rec.expiresAt.toISOString() } }
  if (rec.expiresAt) { expr.push('#eae = :eae'); names['#eae'] = 'expires_at_epoch'; values[':eae'] = { N: String(Math.floor(rec.expiresAt.getTime() / 1000)) } }
  if (rec.scopes) { expr.push('#sc = :sc'); names['#sc'] = 'scopes'; values[':sc'] = { SS: rec.scopes } }
  if (rec.providerUserId) { expr.push('#puid = :puid'); names['#puid'] = 'provider_user_id'; values[':puid'] = { S: rec.providerUserId } }
  if (rec.extra) { expr.push('#extra = :extra'); names['#extra'] = 'extra'; values[':extra'] = { S: JSON.stringify(rec.extra) } }

  // optional TTL: expire 1 day after token expiry if provided
  if (rec.expiresAt) {
    const ttl = Math.floor(rec.expiresAt.getTime() / 1000) - 86400
    if (ttl > 0) { expr.push('#ttl = :ttl'); names['#ttl'] = 'ttl'; values[':ttl'] = { N: String(ttl) } }
  }

  await ddb.send(new UpdateItemCommand({
    TableName,
    Key: {
      userId: { S: rec.userId },
      provider: { S: rec.provider },
    },
    UpdateExpression: `SET ${expr.join(', ')}`,
    ExpressionAttributeNames: names,
    ExpressionAttributeValues: values,
  }))
}
