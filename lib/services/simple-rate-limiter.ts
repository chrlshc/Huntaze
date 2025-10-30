/**
 * Simple Rate Limiter - Version Allégée pour Déploiement Immédiat
 * 
 * Version simplifiée du MultiLayerRateLimiter qui fonctionne sans Redis
 * Utilise la mémoire locale avec fallback gracieux
 */

export interface RateLimitResult {
  allowed: boolean;
  retryAfter?: number;
  layer: 'memory' | 'none';
  reason?: string;
}

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  keyGenerator?: (userId: string, action: string) => string;
}

export class SimpleRateLimiter {
  private requests = new Map<string, number[]>();
  private config: RateLimitConfig;

  constructor(config: Partial<RateLimitConfig> = {}) {
    this.config = {
      maxRequests: 30, // 30 requêtes par fenêtre
      windowMs: 60000, // 1 minute
      keyGenerator: (userId, action) => `${userId}:${action}`,
      ...config
    };

    // Nettoyage automatique toutes les 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  /**
   * Vérifie si une requête est autorisée
   */
  async checkLimit(userId: string, action: 'message' | 'profile_view' | 'content_post'): Promise<RateLimitResult> {
    const key = this.config.keyGenerator!(userId, action);
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    // Récupérer les requêtes existantes pour cette clé
    let userRequests = this.requests.get(key) || [];
    
    // Filtrer les requêtes dans la fenêtre de temps
    userRequests = userRequests.filter(timestamp => timestamp > windowStart);

    // Vérifier si on dépasse la limite
    if (userRequests.length >= this.config.maxRequests) {
      const oldestRequest = Math.min(...userRequests);
      const retryAfter = Math.ceil((oldestRequest + this.config.windowMs - now) / 1000);

      return {
        allowed: false,
        retryAfter: Math.max(retryAfter, 1),
        layer: 'memory',
        reason: `Rate limit exceeded: ${userRequests.length}/${this.config.maxRequests} requests in window`
      };
    }

    // Ajouter la nouvelle requête
    userRequests.push(now);
    this.requests.set(key, userRequests);

    return {
      allowed: true,
      layer: 'memory'
    };
  }

  /**
   * Enregistre le succès d'une opération
   */
  async recordSuccess(action: string): Promise<void> {
    // Dans cette version simple, on ne fait rien de spécial
    // Mais on garde l'interface pour compatibilité future
  }

  /**
   * Enregistre l'échec d'une opération
   */
  async recordFailure(action: string, error: any): Promise<void> {
    // Dans cette version simple, on log juste l'erreur
    console.warn(`[SimpleRateLimiter] Action ${action} failed:`, error.message);
  }

  /**
   * Obtient les statistiques actuelles
   */
  getStats(): { totalKeys: number; totalRequests: number } {
    let totalRequests = 0;
    for (const requests of this.requests.values()) {
      totalRequests += requests.length;
    }

    return {
      totalKeys: this.requests.size,
      totalRequests
    };
  }

  /**
   * Nettoie les anciennes entrées
   */
  private cleanup(): void {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    for (const [key, requests] of this.requests.entries()) {
      const validRequests = requests.filter(timestamp => timestamp > windowStart);
      
      if (validRequests.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, validRequests);
      }
    }
  }

  /**
   * Remet à zéro toutes les limites (utile pour les tests)
   */
  reset(): void {
    this.requests.clear();
  }
}

/**
 * Factory pour créer des rate limiters configurés
 */
export class RateLimiterFactory {
  static createOnlyFansLimiter(): SimpleRateLimiter {
    return new SimpleRateLimiter({
      maxRequests: 30, // 30 messages par minute
      windowMs: 60000
    });
  }

  static createInstagramLimiter(): SimpleRateLimiter {
    return new SimpleRateLimiter({
      maxRequests: 100, // Plus permissif pour Instagram
      windowMs: 60000
    });
  }

  static createGeneralLimiter(): SimpleRateLimiter {
    return new SimpleRateLimiter({
      maxRequests: 50,
      windowMs: 60000
    });
  }
}

/**
 * Instance globale pour utilisation simple
 */
export const globalRateLimiter = new SimpleRateLimiter();