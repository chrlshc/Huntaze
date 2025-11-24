import { redirect } from 'next/navigation';
import { auth } from '@/auth';

export default async function HomePage() {
  const session = await auth();
  
  // Si l'utilisateur est connecté, rediriger vers le dashboard
  if (session?.user) {
    redirect('/dashboard');
  }
  
  // Sinon, rediriger vers la page de login
  redirect('/auth/login');
}
