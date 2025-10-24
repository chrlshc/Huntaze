import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { AuthService } from '@/lib/services/auth-service';

const signInSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis')
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = signInSchema.parse(body);

    // Authentifier l'utilisateur
    const result = await AuthService.signIn(email, password);

    if (!result) {
      return NextResponse.json(
        { error: 'Email ou mot de passe incorrect' },
        { status: 401 }
      );
    }

    // Configurer les cookies sécurisés
    AuthService.setAuthCookies({
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      expiresAt: result.expiresAt
    });

    // Retourner les informations utilisateur (sans les tokens)
    return NextResponse.json({
      user: result.user,
      message: 'Connexion réussie'
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Erreur lors de la connexion:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}