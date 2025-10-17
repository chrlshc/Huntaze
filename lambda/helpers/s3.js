// Helper to presign S3 GET URLs using AWS SDK v3
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3')
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner')

const REGION = process.env.AWS_REGION || process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1'
const s3 = new S3Client({ region: REGION })

async function presignGetUrl({ bucket, key, expiresInSec = 3600, responseContentType }) {
  const cmd = new GetObjectCommand({ Bucket: bucket, Key: key, ...(responseContentType ? { ResponseContentType: responseContentType } : {}) })
  return getSignedUrl(s3, cmd, { expiresIn: expiresInSec })
}

module.exports = { presignGetUrl }

