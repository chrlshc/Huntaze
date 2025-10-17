import AWS from 'aws-sdk'
import WebSocket from 'ws'
import puppeteer from 'puppeteer-extra'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'
import type { Page } from 'puppeteer'
import { randomUUID } from 'crypto'
import { z } from 'zod'

const s3 = new AWS.S3()

puppeteer.use(StealthPlugin())

const PROFILE_LIBRARY = [
  {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.5993.118 Safari/537.36',
    language: 'en-US,en;q=0.9',
    timezone: 'America/New_York',
    viewport: { width: 1920, height: 1080 },
    devicePixelRatio: 1
  },
  {
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 13_5_2) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Safari/605.1.15',
    language: 'fr-FR,fr;q=0.9',
    timezone: 'Europe/Paris',
    viewport: { width: 1440, height: 900 },
    devicePixelRatio: 2
  }
]

const incomingJobSchema = z.object({
  jobId: z.string(),
  type: z.literal('onlyfans_scrape'),
  scrapeType: z.enum(['posts', 'messages', 'analytics']).default('posts'),
  creatorId: z.string().optional(),
  payload: z
    .object({
      profile: z.number().min(0).max(PROFILE_LIBRARY.length - 1).optional(),
      cookies: z
        .array(
          z.object({
            domain: z.string(),
            name: z.string(),
            value: z.string(),
            path: z.string().optional(),
            expires: z.number().optional(),
            httpOnly: z.boolean().optional(),
            secure: z.boolean().optional(),
            sameSite: z.enum(['Strict', 'Lax', 'None']).optional()
          })
        )
        .optional(),
      credentials: z
        .object({
          email: z.string().email(),
          password: z.string()
        })
        .optional()
    })
    .optional()
})

type IncomingJob = z.infer<typeof incomingJobSchema>

type JobResult = {
  jobId: string
  status: 'success' | 'failed'
  scrapeType: IncomingJob['scrapeType']
  data?: unknown
  error?: string
}

class OnlyfansScraperAgent {
  private readonly wsUrl: string
  private readonly agentId: string
  private readonly region: string
  private readonly resultBucket?: string
  private connection?: WebSocket

  constructor() {
    const wsUrl = process.env.WS_URL
    if (!wsUrl) {
      throw new Error('WS_URL env var is required')
    }
    this.wsUrl = wsUrl
    this.agentId = process.env.AGENT_ID || randomUUID()
    this.region = process.env.AWS_REGION || 'us-east-1'
    this.resultBucket = process.env.RESULT_BUCKET
  }

  async start() {
    await this.openConnection()
  }

  private async openConnection() {
    return new Promise<void>((resolve, reject) => {
      // The dispatcher expects a JWT in the query string param `token`.
      // If WS_TOKEN is set, append it to the WS_URL as ?token=...
      const token = process.env.WS_TOKEN || ''
      const version = process.env.AGENT_VERSION || 'dev'
      let url = this.wsUrl
      const sep = url.includes('?') ? '&' : '?'
      if (token) url = `${url}${sep}token=${encodeURIComponent(token)}&v=${encodeURIComponent(version)}`

      const ws = new WebSocket(url)
      this.connection = ws

      ws.on('open', () => {
        console.log('[agent] connected to dispatcher')
        this.send({
          t: 'register',
          agentId: this.agentId,
          capabilities: ['onlyfans_scrape'],
          version: process.env.AGENT_VERSION || 'dev'
        })
        resolve()
      })

      ws.on('message', async (buffer: any) => {
        try {
          const payload = JSON.parse(buffer.toString())
          if (payload.t === 'job_assign') {
            await this.handleJob(payload.job)
          }
        } catch (error) {
          console.error('[agent] failed to parse message', error)
        }
      })

      ws.on('close', (code: number) => {
        console.warn(`[agent] connection closed ${code}, retrying in 5s`)
        setTimeout(() => this.openConnection(), 5_000)
      })

      ws.on('error', (error: unknown) => {
        console.error('[agent] websocket error', error)
        reject(error)
      })
    })
  }

  private send(payload: unknown) {
    if (!this.connection || this.connection.readyState !== WebSocket.OPEN) {
      console.warn('[agent] cannot send, socket not open')
      return
    }
    this.connection.send(JSON.stringify(payload))
  }

  private async handleJob(rawJob: unknown) {
    const parseResult = incomingJobSchema.safeParse(rawJob)
    if (!parseResult.success) {
      console.error('[agent] invalid job payload', parseResult.error)
      return
    }
    const job = parseResult.data
    console.log(`[agent] received job ${job.jobId} (${job.scrapeType})`)

    try {
      const profile = PROFILE_LIBRARY[job.payload?.profile ?? Math.floor(Math.random() * PROFILE_LIBRARY.length)]
      const browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          `--user-agent=${profile.userAgent}`,
          `--lang=${profile.language}`,
          `--window-size=${profile.viewport.width},${profile.viewport.height}`
        ]
      })

      const page = await browser.newPage()
      await page.setViewport(profile.viewport)
      await this.applyFingerprint(page, profile)

      if (job.payload?.cookies) {
        await page.setCookie(...job.payload.cookies)
      }

      const result = await this.scrape(page, job.scrapeType)
      await browser.close()

      const jobResult: JobResult = {
        jobId: job.jobId,
        scrapeType: job.scrapeType,
        status: 'success',
        data: result
      }

      await this.persistResult(jobResult)
      this.send({ t: 'job_complete', agentId: this.agentId, ...jobResult })
    } catch (error) {
      console.error('[agent] job failed', error)
      const jobResult: JobResult = {
        jobId: job.jobId,
        scrapeType: job.scrapeType,
        status: 'failed',
        error: error instanceof Error ? error.message : 'unknown error'
      }
      this.send({ t: 'job_error', agentId: this.agentId, ...jobResult })
    }
  }

  private async applyFingerprint(page: Page, profile: (typeof PROFILE_LIBRARY)[number]) {
    await page.emulateTimezone(profile.timezone)

    await page.setExtraHTTPHeaders({
      'Accept-Language': profile.language,
      'Cache-Control': 'no-cache'
    })

    await page.evaluateOnNewDocument((dpi: number) => {
      Object.defineProperty(window, 'devicePixelRatio', {
        get: () => dpi
      })
    }, profile.devicePixelRatio)

    await page.evaluateOnNewDocument(() => {
      const toDataURL = HTMLCanvasElement.prototype.toDataURL
      HTMLCanvasElement.prototype.toDataURL = function (...args: Parameters<typeof toDataURL>) {
        return 'data:image/png;base64,OF_PROFILE_CANVAS_HASH'
      }

      const getImageData = CanvasRenderingContext2D.prototype.getImageData
      CanvasRenderingContext2D.prototype.getImageData = function (...args: Parameters<typeof getImageData>) {
        const data = getImageData.call(this, ...args)
        return data
      }

      const getParameter = WebGLRenderingContext.prototype.getParameter
      WebGLRenderingContext.prototype.getParameter = function (parameter: GLenum) {
        if (parameter === 37445) return 'NVIDIA Corporation'
        if (parameter === 37446) return 'NVIDIA GeForce GTX 1080/PCIe/SSE2'
        return getParameter.call(this, parameter)
      }
    })
  }

  private async scrape(page: Page, scrapeType: IncomingJob['scrapeType']) {
    switch (scrapeType) {
      case 'messages':
        return this.scrapeMessages(page)
      case 'analytics':
        return this.scrapeAnalytics(page)
      case 'posts':
      default:
        return this.scrapePosts(page)
    }
  }

  private async scrapePosts(page: Page) {
    await page.goto('https://onlyfans.com/my/posts', { waitUntil: 'networkidle2' })
    await this.humanPause(2_000, 4_000)

    await this.simulateScroll(page, 3)

    const posts = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('[data-testid="post-card"]'))
      return cards.slice(0, 10).map((card) => ({
        id: card.getAttribute('data-post-id'),
        title: card.querySelector('[data-testid="post-title"]')?.textContent?.trim(),
        postedAt: card.querySelector('time')?.getAttribute('datetime'),
        likes: card.querySelector('[data-testid="post-likes"]')?.textContent,
        comments: card.querySelector('[data-testid="post-comments"]')?.textContent
      }))
    })

    return { posts, scrapedAt: new Date().toISOString() }
  }

  private async scrapeMessages(page: Page) {
    await page.goto('https://onlyfans.com/my/chats', { waitUntil: 'networkidle2' })
    await this.humanPause(2_000, 3_500)

    await this.simulateScroll(page, 2)

    const messages = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('[data-testid="chat-thread"]'))
      return rows.slice(0, 20).map((row) => ({
        threadId: row.getAttribute('data-thread-id'),
        username: row.querySelector('[data-testid="chat-username"]')?.textContent?.trim(),
        preview: row.querySelector('[data-testid="chat-preview"]')?.textContent?.trim(),
        timestamp: row.querySelector('time')?.getAttribute('datetime')
      }))
    })

    return { messages, scrapedAt: new Date().toISOString() }
  }

  private async scrapeAnalytics(page: Page) {
    await page.goto('https://onlyfans.com/my/statements', { waitUntil: 'networkidle2' })
    await this.humanPause(2_500, 4_500)

    const summary = await page.evaluate(() => {
      const parseAmount = (selector: string) => {
        const text = document.querySelector(selector)?.textContent || '0'
        return Number(text.replace(/[^0-9.,-]/g, '').replace(',', '.'))
      }

      return {
        revenueToday: parseAmount('[data-testid="revenue-today"]'),
        revenueMonth: parseAmount('[data-testid="revenue-month"]'),
        newSubscribers: Number(document.querySelector('[data-testid="subs-new"]')?.textContent || '0'),
        churnRate: Number(document.querySelector('[data-testid="subs-churn"]')?.textContent || '0')
      }
    })

    return { summary, scrapedAt: new Date().toISOString() }
  }

  private async simulateScroll(page: Page, iterations: number) {
    for (let i = 0; i < iterations; i++) {
      await page.mouse.move(50 + Math.random() * 300, 200 + Math.random() * 200, { steps: 12 })
      await page.mouse.wheel({ deltaY: 400 + Math.random() * 200 })
      await this.humanPause(700, 1_500)
    }
  }

  private async humanPause(min: number, max: number) {
    const delay = min + Math.random() * (max - min)
    return new Promise((resolve) => setTimeout(resolve, delay))
  }

  private async persistResult(result: JobResult) {
    if (!this.resultBucket || result.status !== 'success') {
      return
    }
    const key = `onlyfans/${result.scrapeType}/${result.jobId}.json`
    await s3
      .putObject({
        Bucket: this.resultBucket,
        Key: key,
        Body: JSON.stringify(result.data ?? {}),
        ContentType: 'application/json'
      })
      .promise()
  }
}

async function bootstrap() {
  const agent = new OnlyfansScraperAgent()
  await agent.start()
}

bootstrap().catch((error) => {
  console.error('[agent] fatal error', error)
  process.exit(1)
})
