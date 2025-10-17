import { NextRequest, NextResponse } from 'next/server'
import { SQSClient, GetQueueUrlCommand } from '@aws-sdk/client-sqs'
import { getAzureOpenAI, getDefaultAzureDeployment } from '@/lib/ai/azure-openai'

export const dynamic = 'force-dynamic'

async function checkInstagram() {
  const token = process.env.META_PAGE_ACCESS_TOKEN
  const igUser = process.env.IG_USER_ID
  if (!token) return { status: 'unconfigured', api_type: 'fallback', message: 'No META_PAGE_ACCESS_TOKEN' }
  try {
    const resp = await fetch(`https://graph.facebook.com/v18.0/${igUser ? igUser : 'me'}?access_token=${token}`, { cache: 'no-store' })
    const ok = resp.ok
    const usage = resp.headers.get('x-business-use-case-usage') || resp.headers.get('x-app-usage')
    return { status: ok ? 'healthy' : 'error', api_type: 'official_graph', rate_limit: usage || null }
  } catch (e: any) {
    return { status: 'error', api_type: 'official_graph', error: e?.message }
  }
}

async function checkTikTok() {
  const token = process.env.TT_ACCESS_TOKEN
  if (!token) return { status: 'unconfigured', api_type: 'fallback', message: 'No TT_ACCESS_TOKEN' }
  // Minimal health: token presence only (TikTok has no simple health endpoint)
  return { status: 'configured', api_type: 'official_content_api' }
}

async function checkReddit() {
  const ok = !!(process.env.REDDIT_CLIENT_ID && process.env.REDDIT_CLIENT_SECRET && process.env.REDDIT_USER && process.env.REDDIT_PASS)
  return ok ? { status: 'configured', api_type: 'praw' } : { status: 'unconfigured' }
}

async function checkAzure() {
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT
  const model = process.env.AZURE_OPENAI_DEPLOYMENT_NAME || getDefaultAzureDeployment()
  if (!endpoint || !process.env.AZURE_OPENAI_API_KEY) return { status: 'unconfigured' }
  try {
    await getAzureOpenAI() // ensure client constructible
    return { status: 'healthy', endpoint, model }
  } catch (e: any) {
    return { status: 'error', endpoint, model, error: e?.message }
  }
}

async function checkSQS() {
  try {
    const client = new SQSClient({ region: process.env.AWS_REGION || 'us-east-1' })
    const name = process.env.SQS_AI_QUEUE || 'huntaze-ai-processing'
    const resp = await client.send(new GetQueueUrlCommand({ QueueName: name }))
    return { status: resp.QueueUrl ? 'healthy' : 'error', queue: name, region: process.env.AWS_REGION || 'us-east-1' }
  } catch (e: any) {
    return { status: 'error', error: e?.message, region: process.env.AWS_REGION || 'us-east-1' }
  }
}

export async function GET(_req: NextRequest) {
  const [instagram, tiktok, reddit, azure_openai, sqs] = await Promise.all([
    checkInstagram(),
    checkTikTok(),
    checkReddit(),
    checkAzure(),
    checkSQS(),
  ])

  const all = { instagram, tiktok, reddit, azure_openai, sqs }
  const ok = Object.values(all).every((s: any) => ['healthy', 'configured'].includes(s.status))
  return NextResponse.json({ timestamp: new Date().toISOString(), overall_status: ok ? 'ok' : 'attention', platforms: all })
}

