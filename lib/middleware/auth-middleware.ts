import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/services/auth-service';

export interface AuthenticatedRequest extends NextRequest {
  user: {
    id: string;
    email: string;
    subscription: 'free' | 'pro' | 'enterprise';
  };
}

/**
 * Middleware d'authentification pour les API routes
 */
export async function withAuth(
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    try {
      // Essayer de récupérer l'utilisateur depuis les cookies
      let user = await AuthService.getUserFromCookies();

      // Si pas de cookie ou token expiré, essayer le header Authorization
      if (!user) {
        const authHeader = req.headers.get('authorization');
        if (authHeader?.startsWith('Bearer ')) {
          const token = authHeader.substring(7);
          user = await AuthService.verifyAccessToken(token);
        }
      }

      if (!user) {
        return NextResponse.json(
          { error: 'Non authentifié' },
          { status: 401 }
        );
      }

      // Ajouter les informations utilisateur à la requête
      const authenticatedReq = req as AuthenticatedRequest;
      authenticatedReq.user = {
        id: user.sub,
        email: user.email,
        subscription: user.subscription
      };

      // Ajouter les headers pour les middlewares suivants
      req.headers.set('x-user-id', user.sub);
      req.headers.set('x-user-email', user.email);
      req.headers.set('x-user-subscription', user.subscription);

      return handler(authenticatedReq);
    } catch (error) {
      console.error('Erreur dans le middleware d\'authentification:', error);
      return NextResponse.json(
        { error: 'Erreur d\'authentification' },
        { status: 500 }
      );
    }
  };
}

/**
 * Middleware pour vérifier les permissions par abonnement
 */
export function withSubscription(
  requiredSubscription: 'pro' | 'enterprise',
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
) {
  return withAuth(async (req: AuthenticatedRequest) => {
    const userSubscription = req.user.subscription;
    
    // Vérifier si l'utilisateur a le bon niveau d'abonnement
    const subscriptionLevels = {
      free: 0,
      pro: 1,
      enterprise: 2
    };

    const userLevel = subscriptionLevels[userSubscription];
    const requiredLevel = subscriptionLevels[requiredSubscription];

    if (userLevel < requiredLevel) {
      return NextResponse.json(
        { 
          error: 'Abonnement insuffisant',
          required: requiredSubscription,
          current: userSubscription
        },
        { status: 403 }
      );
    }

    return handler(req);
  });
}

/**
 * Middleware pour vérifier les rôles
 */
export function withRole(
  requiredRole: 'admin',
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
) {
  return withAuth(async (req: AuthenticatedRequest) => {
    // Pour l'instant, on vérifie juste l'authentification
    // Dans le futur, on pourrait ajouter la vérification du rôle depuis la base
    
    // TODO: Récupérer le rôle depuis la base de données
    // const user = await prisma.user.findUnique({
    //   where: { id: req.user.id },
    //   select: { role: true }
    // });
    
    // if (user?.role !== requiredRole.toUpperCase()) {
    //   return NextResponse.json(
    //     { error: 'Permissions insuffisantes' },
    //     { status: 403 }
    //   );
    // }

    return handler(req);
  });
}

/**
 * Middleware pour les limites de taux (rate limiting)
 */
export function withRateLimit(
  maxRequests: number,
  windowMs: number,
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
) {
  // Map pour stocker les compteurs par utilisateur
  const requestCounts = new Map<string, { count: number; resetTime: number }>();

  return withAuth(async (req: AuthenticatedRequest) => {
    const userId = req.user.id;
    const now = Date.now();
    const windowStart = now - windowMs;

    // Nettoyer les anciens compteurs
    for (const [key, data] of requestCounts.entries()) {
      if (data.resetTime < now) {
        requestCounts.delete(key);
      }
    }

    // Vérifier le compteur pour cet utilisateur
    const userCount = requestCounts.get(userId);
    
    if (!userCount) {
      // Premier appel dans cette fenêtre
      requestCounts.set(userId, { count: 1, resetTime: now + windowMs });
    } else if (userCount.count >= maxRequests) {
      // Limite atteinte
      return NextResponse.json(
        { 
          error: 'Trop de requêtes',
          retryAfter: Math.ceil((userCount.resetTime - now) / 1000)
        },
        { 
          status: 429,
          headers: {
            'Retry-After': Math.ceil((userCount.resetTime - now) / 1000).toString()
          }
        }
      );
    } else {
      // Incrémenter le compteur
      userCount.count++;
    }

    return handler(req);
  });
}