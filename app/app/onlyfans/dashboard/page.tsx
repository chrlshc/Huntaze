import { redirect } from 'next/navigation'

export default function OnlyFansDashboardAlias() {
  // Legacy alias: route to the current OnlyFans hub page
  redirect('/onlyfans-assisted')
}
