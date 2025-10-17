import { APIGatewayProxyWebsocketEventV2 } from 'aws-lambda'
import AWS from 'aws-sdk'
import jwt from 'jsonwebtoken'

const ddb = new AWS.DynamoDB.DocumentClient()

export const handler = async (event: APIGatewayProxyWebsocketEventV2) => {
  const { connectionId, domainName, stage } = event.requestContext
  if (!connectionId) return { statusCode: 400, body: 'missing connection' }

  const params = (event as any).queryStringParameters as Record<string, string> | undefined
  const raw = params?.token || ''
  if (!raw) return { statusCode: 401, body: 'missing token' }

  const token = decodeURIComponent(raw)
  const secret = process.env.WS_JWT_SECRET

  let agentId = ''
  let creatorId = ''
  if (secret && secret.length > 0) {
    try {
      const decoded = jwt.verify(token, secret, { algorithms: ['HS256'] }) as any
      agentId = String(decoded.agentId || '')
      creatorId = String(decoded.creatorId || '')
      if (!agentId) return { statusCode: 401, body: 'invalid token' }
    } catch {
      return { statusCode: 401, body: 'invalid token' }
    }
  } else {
    // DEV fallback: trust token as agentId (not for prod)
    agentId = token.slice(0, 128) || `agent-${connectionId}`
  }

  await ddb
    .put({
      TableName: process.env.AGENTS_TABLE!,
      Item: {
        agentId,
        creatorId: creatorId || undefined,
        connectionId,
        wsEndpoint: `https://${domainName}/${stage}`,
        status: 'online',
        lastHbAt: Date.now(),
        version: params?.v ?? 'unknown',
      },
    })
    .promise()

  return { statusCode: 200, body: 'connected' }
}
