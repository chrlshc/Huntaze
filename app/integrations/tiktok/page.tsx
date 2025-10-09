import { redirect } from 'next/navigation'

export const dynamic = 'force-static'

export default function TikTokIntegrationAlias() {
  // Alias to the TikTok OAuth flow page
  redirect('/auth/tiktok')
}

