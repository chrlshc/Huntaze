import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { AuthService } from '@/lib/services/auth-service';
import { prisma } from '@/lib/db';

const signUpSchema = z.object({
  email: z.string().email('Email invalide'),
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères')
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name, password } = signUpSchema.parse(body);

    // Valider la force du mot de passe
    const passwordValidation = AuthService.validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { error: 'Mot de passe trop faible', details: passwordValidation.errors },
        { status: 400 }
      );
    }

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Un compte avec cet email existe déjà' },
        { status: 409 }
      );
    }

    // Hasher le mot de passe
    const passwordHash = await AuthService.hashPassword(password);

    // Créer l'utilisateur
    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        subscription: 'FREE',
        role: 'CREATOR'
      },
      select: {
        id: true,
        email: true,
        name: true,
        subscription: true
      }
    });

    // Générer les tokens
    const accessToken = await AuthService.generateAccessToken({
      id: user.id,
      email: user.email,
      subscription: user.subscription.toLowerCase() as 'free' | 'pro' | 'enterprise'
    });

    const refreshTokenData = await AuthService.generateRefreshToken(user.id);

    // Configurer les cookies sécurisés
    AuthService.setAuthCookies({
      accessToken,
      refreshToken: refreshTokenData.token,
      expiresAt: refreshTokenData.expiresAt
    });

    // Retourner les informations utilisateur
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        subscription: user.subscription.toLowerCase()
      },
      message: 'Compte créé avec succès'
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Erreur lors de l\'inscription:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}