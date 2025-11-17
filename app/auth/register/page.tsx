import { redirect } from 'next/navigation';

// Force dynamic rendering to avoid static prerender issues
export const dynamic = 'force-dynamic';

export default function RegisterRedirect() {
  // Server-side redirect to unified auth page
  redirect('/auth');
}
