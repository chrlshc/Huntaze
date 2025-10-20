import { NextRequest, NextResponse } from 'next/server'

/**
 * TikTok OAuth v2 authorize entrypoint
 * - Uses server var `TIKTOK_CLIENT_KEY` (fallback to `NEXT_PUBLIC_TIKTOK_CLIENT_KEY` for safety)
 * - Redirect URI from `NEXT_PUBLIC_TIKTOK_REDIRECT_URI` or derived from request origin
 * - Uses v2 authorize endpoint per latest docs
 */
export async function GET(request: NextRequest) {
  const origin = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin
  const clientKey = process.env.TIKTOK_CLIENT_KEY || process.env.NEXT_PUBLIC_TIKTOK_CLIENT_KEY || ''
  const redirectUri = process.env.NEXT_PUBLIC_TIKTOK_REDIRECT_URI || `${origin.replace(/\/$/, '')}/auth/tiktok/callback`
  const scopes = process.env.TIKTOK_SCOPES || 'user.info.basic,video.upload,video.publish'

  if (!clientKey) {
    return NextResponse.json({ error: 'TikTok client key not configured' }, { status: 500 })
  }

  const state = Math.random().toString(36).slice(2)
  const authUrl = new URL('https://www.tiktok.com/v2/auth/authorize/')
  authUrl.searchParams.set('client_key', clientKey)
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('scope', scopes)
  authUrl.searchParams.set('redirect_uri', redirectUri)
  authUrl.searchParams.set('state', state)

  return NextResponse.redirect(authUrl.toString())
}
