import { NextRequest, NextResponse } from 'next/server'
import { queueManager } from '@/lib/queue/queue-manager'
import { requireInternalKey } from '@/lib/api/internal-auth'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const guard = requireInternalKey(req)
  if (guard) return guard
  try {
    const body = await req.json().catch(() => ({}))
    const userId = body.userId || 'test-user'

    const message = {
      type: 'publish_content' as const,
      userId,
      payload: {
        platform: body.platform || 'reddit',
        contentId: body.contentId || `content-${Date.now()}`,
        subreddit: body.subreddit || 'OnlyFans101',
        content: {
          title: body.title || 'Sample Post Title',
          description: body.description || 'This is a sample description generated for testing the pipeline.',
          mediaUrls: body.mediaUrls || [],
          tags: body.tags || ['sample', 'test'],
          contentType: body.contentType || 'photos',
          isNsfw: body.isNsfw ?? true,
        },
        options: body.options || {},
      },
    }

    await queueManager.queueAIProcessing(message)
    return NextResponse.json({ ok: true, enqueued: message })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || 'enqueue_failed' }, { status: 500 })
  }
}
