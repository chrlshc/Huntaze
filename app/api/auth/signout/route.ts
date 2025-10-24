import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/services/auth-service';

export async function POST(request: NextRequest) {
  try {
    // Récupérer l'utilisateur depuis les cookies
    const user = await AuthService.getUserFromCookies();

    if (user) {
      // Invalider tous les refresh tokens de l'utilisateur
      await AuthService.signOut(user.sub);
    }

    // Supprimer les cookies d'authentification
    AuthService.clearAuthCookies();

    return NextResponse.json({
      message: 'Déconnexion réussie'
    });

  } catch (error) {
    console.error('Erreur lors de la déconnexion:', error);
    
    // Même en cas d'erreur, supprimer les cookies
    AuthService.clearAuthCookies();
    
    return NextResponse.json({
      message: 'Déconnexion effectuée'
    });
  }
}