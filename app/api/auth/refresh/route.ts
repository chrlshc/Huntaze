import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { AuthService } from '@/lib/services/auth-service';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const refreshToken = cookieStore.get('refresh_token')?.value;

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'Refresh token manquant' },
        { status: 401 }
      );
    }

    // Effectuer la rotation des tokens
    const result = await AuthService.refreshTokens(refreshToken);

    if (!result) {
      // Token invalide ou expiré, supprimer les cookies
      AuthService.clearAuthCookies();
      return NextResponse.json(
        { error: 'Refresh token invalide ou expiré' },
        { status: 401 }
      );
    }

    // Configurer les nouveaux cookies
    AuthService.setAuthCookies({
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      expiresAt: result.expiresAt
    });

    return NextResponse.json({
      message: 'Tokens renouvelés avec succès'
    });

  } catch (error) {
    console.error('Erreur lors du renouvellement des tokens:', error);
    
    // En cas d'erreur, supprimer les cookies pour forcer une nouvelle connexion
    AuthService.clearAuthCookies();
    
    return NextResponse.json(
      { error: 'Erreur lors du renouvellement des tokens' },
      { status: 500 }
    );
  }
}