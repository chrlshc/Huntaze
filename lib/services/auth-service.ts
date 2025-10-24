import { SignJWT, jwtVerify } from 'jose';
import { createHash, randomUUID } from 'crypto';
import { cookies, type UnsafeUnwrappedCookies } from 'next/headers';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);
const REFRESH_SECRET = new TextEncoder().encode(process.env.REFRESH_SECRET!);

export interface JWTPayload {
  sub: string; // userId
  email: string;
  subscription: 'free' | 'pro' | 'enterprise';
  iat: number;
  exp: number;
}

export interface RefreshTokenPayload {
  sub: string; // userId
  jti: string; // JWT ID for token identification
  iat: number;
  exp: number;
}

export class AuthService {
  /**
   * Génère un access token JWT
   */
  static async generateAccessToken(user: {
    id: string;
    email: string;
    subscription: 'free' | 'pro' | 'enterprise';
  }): Promise<string> {
    const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
      sub: user.id,
      email: user.email,
      subscription: user.subscription
    };

    return await new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('15m') // Access token court
      .sign(JWT_SECRET);
  }

  /**
   * Génère un refresh token avec rotation et hash
   */
  static async generateRefreshToken(userId: string): Promise<{
    token: string;
    jti: string;
    expiresAt: Date;
  }> {
    const jti = randomUUID();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 jours

    const payload: Omit<RefreshTokenPayload, 'iat' | 'exp'> = {
      sub: userId,
      jti
    };

    const token = await new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('30d')
      .sign(REFRESH_SECRET);

    // Hash du token pour stockage sécurisé
    const tokenHash = createHash('sha256').update(token).digest('hex');

    // Invalider les anciens refresh tokens de cet utilisateur
    await prisma.refreshToken.deleteMany({
      where: { userId }
    });

    // Stocker le hash du nouveau token
    await prisma.refreshToken.create({
      data: {
        userId,
        jti,
        tokenHash,
        expiresAt
      }
    });

    return { token, jti, expiresAt };
  }

  /**
   * Vérifie et décode un access token
   */
  static async verifyAccessToken(token: string): Promise<JWTPayload | null> {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      return payload as JWTPayload;
    } catch (error) {
      return null;
    }
  }

  /**
   * Vérifie un refresh token et effectue la rotation
   */
  static async refreshTokens(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresAt: Date;
  } | null> {
    try {
      // Vérifier le refresh token
      const { payload } = await jwtVerify(refreshToken, REFRESH_SECRET);
      const refreshPayload = payload as RefreshTokenPayload;

      // Hash du token reçu pour comparaison
      const tokenHash = createHash('sha256').update(refreshToken).digest('hex');

      // Vérifier que le token existe en base et n'est pas expiré
      const storedToken = await prisma.refreshToken.findFirst({
        where: {
          userId: refreshPayload.sub,
          jti: refreshPayload.jti,
          tokenHash,
          expiresAt: { gt: new Date() }
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              subscription: true,
              deletedAt: true
            }
          }
        }
      });

      if (!storedToken || storedToken.user.deletedAt) {
        return null;
      }

      // Générer de nouveaux tokens (rotation)
      const accessToken = await this.generateAccessToken({
        id: storedToken.user.id,
        email: storedToken.user.email,
        subscription: storedToken.user.subscription
      });

      const newRefreshToken = await this.generateRefreshToken(storedToken.user.id);

      return {
        accessToken,
        refreshToken: newRefreshToken.token,
        expiresAt: newRefreshToken.expiresAt
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Authentifie un utilisateur et génère les tokens
   */
  static async signIn(email: string, password: string): Promise<{
    user: {
      id: string;
      email: string;
      name: string;
      subscription: 'free' | 'pro' | 'enterprise';
    };
    accessToken: string;
    refreshToken: string;
    expiresAt: Date;
  } | null> {
    const user = await prisma.user.findUnique({
      where: { email, deletedAt: null },
      select: {
        id: true,
        email: true,
        name: true,
        passwordHash: true,
        subscription: true
      }
    });

    if (!user) {
      return null;
    }

    // Vérifier le mot de passe avec bcrypt (en attendant Argon2id)
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return null;
    }

    // Générer les tokens
    const accessToken = await this.generateAccessToken({
      id: user.id,
      email: user.email,
      subscription: user.subscription
    });

    const refreshTokenData = await this.generateRefreshToken(user.id);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        subscription: user.subscription
      },
      accessToken,
      refreshToken: refreshTokenData.token,
      expiresAt: refreshTokenData.expiresAt
    };
  }

  /**
   * Déconnecte un utilisateur en invalidant ses refresh tokens
   */
  static async signOut(userId: string): Promise<void> {
    await prisma.refreshToken.deleteMany({
      where: { userId }
    });
  }

  /**
   * Configure les cookies sécurisés
   */
  static setAuthCookies(tokens: {
    accessToken: string;
    refreshToken: string;
    expiresAt: Date;
  }): void {
    const cookieStore = (cookies() as unknown as UnsafeUnwrappedCookies);
    const isProduction = process.env.NODE_ENV === 'production';

    // Access token en cookie httpOnly
    cookieStore.set('access_token', tokens.accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 15 * 60, // 15 minutes
      path: '/'
    });

    // Refresh token en cookie httpOnly avec path spécifique
    cookieStore.set('refresh_token', tokens.refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      expires: tokens.expiresAt,
      path: '/api/auth/refresh'
    });
  }

  /**
   * Supprime les cookies d'authentification
   */
  static clearAuthCookies(): void {
    const cookieStore = (cookies() as unknown as UnsafeUnwrappedCookies);

    cookieStore.delete('access_token');
    cookieStore.delete('refresh_token');
  }

  /**
   * Récupère l'utilisateur depuis les cookies
   */
  static async getUserFromCookies(): Promise<JWTPayload | null> {
    const cookieStore = (cookies() as unknown as UnsafeUnwrappedCookies);
    const accessToken = cookieStore.get('access_token')?.value;

    if (!accessToken) {
      return null;
    }

    return this.verifyAccessToken(accessToken);
  }

  /**
   * Hash un mot de passe avec bcrypt (en attendant Argon2id)
   */
  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  /**
   * Valide la force d'un mot de passe
   */
  static validatePasswordStrength(password: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Le mot de passe doit contenir au moins 8 caractères');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Le mot de passe doit contenir au moins une majuscule');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Le mot de passe doit contenir au moins une minuscule');
    }

    if (!/\d/.test(password)) {
      errors.push('Le mot de passe doit contenir au moins un chiffre');
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Le mot de passe doit contenir au moins un caractère spécial');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}