import { redirect } from 'next/navigation'

// Enable static generation for optimal performance and SEO
export const dynamic = 'force-static'

export default function ContactAlias() {
  redirect('/support')
}

