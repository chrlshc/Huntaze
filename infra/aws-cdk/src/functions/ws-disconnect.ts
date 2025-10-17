import { APIGatewayProxyWebsocketEventV2 } from 'aws-lambda'
import AWS from 'aws-sdk'

const ddb = new AWS.DynamoDB.DocumentClient()

export const handler = async (event: APIGatewayProxyWebsocketEventV2) => {
  const { connectionId } = event.requestContext
  if (!connectionId) return { statusCode: 200, body: 'ok' }

  const scan = await ddb
    .scan({
      TableName: process.env.AGENTS_TABLE!,
      FilterExpression: 'connectionId = :cid',
      ExpressionAttributeValues: { ':cid': connectionId },
      Limit: 1,
    })
    .promise()

  if ((scan.Items ?? []).length) {
    const item = scan.Items![0]
    await ddb
      .update({
        TableName: process.env.AGENTS_TABLE!,
        Key: { agentId: item.agentId },
        UpdateExpression: 'SET #s = :status REMOVE connectionId',
        ExpressionAttributeNames: { '#s': 'status' },
        ExpressionAttributeValues: { ':status': 'offline' },
      })
      .promise()
  }

  return { statusCode: 200, body: 'disconnected' }
}
