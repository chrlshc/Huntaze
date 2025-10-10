import { redirect } from 'next/navigation'

export default function ManagerAIPage() {
  // Legacy alias: route to the current home/dashboard entry
  redirect('/home')
}
