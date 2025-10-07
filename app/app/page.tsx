import { redirect } from 'next/navigation';

export default function AppIndex() {
  // Send users to the main dashboard under the new shell
  redirect('/dashboard');
}

