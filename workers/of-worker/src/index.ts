import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager'
import { chromium, BrowserContext } from 'playwright'

const s3 = new S3Client({})
const sm = new SecretsManagerClient({})

async function getSecret(name: string) {
  const r = await sm.send(new GetSecretValueCommand({ SecretId: name }))
  return r.SecretString ? JSON.parse(r.SecretString) : {}
}

async function run() {
  let job: any
  const resultsBucket = process.env.RESULTS_BUCKET!
  const s3Key = process.env.JOB_S3_KEY
  if (s3Key) {
    const obj = await s3.send(new GetObjectCommand({ Bucket: resultsBucket, Key: s3Key }))
    const body = await (obj.Body as any).transformToString()
    job = JSON.parse(body)
  } else if (process.env.JOB_JSON_B64) {
    job = JSON.parse(Buffer.from(process.env.JOB_JSON_B64!, 'base64').toString('utf8'))
  } else {
    throw new Error('No JOB_S3_KEY or JOB_JSON_B64 provided')
  }
  const creatorId = process.env.CREATOR_ID!
  const jobId = process.env.JOB_ID ?? `job-${Date.now()}`

  const cookiesSecret = await getSecret(`of/cookies/${creatorId}`)
  const proxySecret = await getSecret(`of/proxy/${creatorId}`)

  const browser = await chromium.launch({
    headless: true,
    args: ['--disable-dev-shm-usage', '--no-sandbox'],
    proxy: proxySecret.url ? { server: proxySecret.url } : undefined,
  })

  let context: BrowserContext
  if (cookiesSecret?.storageState) {
    context = await browser.newContext({ storageState: cookiesSecret.storageState })
  } else {
    context = await browser.newContext()
    if (Array.isArray(cookiesSecret?.cookies)) {
      await context.addCookies(cookiesSecret.cookies)
    }
  }
  const page = await context.newPage()

  // Simple router
  let result: any = { ok: true }
  const action = job.type || job.action
  switch (action) {
    case 'check_notifications':
      // TODO: navigate and scrape
      result.notifications = []
      break
    default:
      result = { ok: false, error: `unknown_action:${action}` }
  }

  await s3.send(new PutObjectCommand({
    Bucket: resultsBucket,
    Key: `jobs/${jobId}/result.json`,
    Body: JSON.stringify({ jobId, creatorId, result }, null, 2),
    ContentType: 'application/json',
  }))

  await browser.close()
}

run().catch((e) => {
  console.error('WORKER_ERROR', e?.message)
  process.exitCode = 1
})
