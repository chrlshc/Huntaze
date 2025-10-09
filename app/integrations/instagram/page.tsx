import { redirect } from 'next/navigation'

export const dynamic = 'force-static'

export default function InstagramIntegrationAlias() {
  // Alias route: keep external links stable; send users to the connect hub
  redirect('/platforms/connect')
}

