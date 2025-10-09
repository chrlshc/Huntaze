import { redirect } from 'next/navigation'

export const dynamic = 'force-static'

export default function OnlyFansIntegrationAlias() {
  // Alias to the OnlyFans connect page
  redirect('/platforms/connect/onlyfans')
}

