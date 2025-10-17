import AWS from 'aws-sdk'

const ddb = new AWS.DynamoDB.DocumentClient()
const s3 = new AWS.S3()

export const handler = async (event: any) => {
  // EventBridge S3 event (Object Created)
  const detail = event.detail
  const bucket = detail?.bucket?.name as string
  const key = detail?.object?.key as string
  if (!bucket || !key) return
  if (!key.startsWith('jobs/') || !key.endsWith('/result.json')) return

  const jobId = key.split('/')[1]
  try {
    const obj = await s3.getObject({ Bucket: bucket, Key: key }).promise()
    const body = obj.Body?.toString('utf-8') || '{}'
    const parsed = JSON.parse(body)
    // Update job as succeeded (minimal)
    await ddb
      .update({
        TableName: process.env.JOBS_TABLE!,
        Key: { jobId },
        UpdateExpression: 'SET #s = :succ, completedAt = :now',
        ExpressionAttributeNames: { '#s': 'status' },
        ExpressionAttributeValues: { ':succ': 'succeeded', ':now': Date.now() },
      })
      .promise()
    console.log('Ingested result for', jobId, 'payload keys:', Object.keys(parsed || {}))
  } catch (e) {
    console.error('Result ingest failed', { bucket, key, err: (e as Error).message })
    throw e
  }
}

