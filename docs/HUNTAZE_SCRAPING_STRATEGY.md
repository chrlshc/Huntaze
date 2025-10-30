# 🕷️ HUNTAZE - Stratégie de Scraping OnlyFans

## ⚠️ Avertissement

**Le scraping OnlyFans n'est pas officiellement supporté.**

**Risques:**
- Suspension du compte créateur
- Blocage IP
- Détection et bannissement
- Responsabilité légale

**Décision:** Huntaze utilise le scraping malgré les risques pour offrir ses fonctionnalités.

---

## 🎯 Objectifs du Scraping

### Données à Récupérer

1. **Messages**
   - Conversations avec les fans
   - Historique des messages
   - Métadonnées (date, statut, etc.)

2. **Profils Fans**
   - Informations de base
   - Historique d'achats
   - Niveau d'engagement
   - Préférences

3. **Contenu**
   - Posts publiés
   - Statistiques d'engagement
   - Revenus par post

4. **Analytics**
   - Revenus totaux
   - Abonnements actifs
   - Taux de rétention
   - Performance du contenu

---

## 🛠️ Architecture Technique

### 1. Scraping Respectueux

```typescript
// Configuration du scraper
const scraperConfig = {
  // Rate limiting pour éviter la détection
  requestsPerMinute: 10,
  delayBetweenRequests: 6000, // 6 secondes
  
  // User-Agent réaliste
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  
  // Rotation de proxies
  useProxies: true,
  proxyRotation: true,
  
  // Retry avec backoff
  maxRetries: 3,
  retryDelay: 30000, // 30 secondes
  
  // Heures creuses
  preferredHours: [2, 3, 4, 5], // 2h-6h du matin
};
```

### 2. Authentification

```typescript
// Gestion des sessions OnlyFans
class OnlyFansSession {
  private cookies: Map<string, string>;
  private authToken: string;
  
  async authenticate(credentials: Credentials) {
    // 1. Login via formulaire OnlyFans
    const response = await fetch('https://onlyfans.com/api2/v2/users/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': scraperConfig.userAgent,
      },
      body: JSON.stringify({
        username: credentials.username,
        password: credentials.password,
      }),
    });
    
    // 2. Extraire les cookies et tokens
    this.cookies = this.extractCookies(response);
    this.authToken = response.headers.get('x-bc');
    
    // 3. Stocker la session de manière sécurisée
    await this.storeSession();
  }
  
  async refreshSession() {
    // Rafraîchir la session avant expiration
    // OnlyFans sessions expirent après ~24h
  }
}
```

### 3. Scraping des Messages

```typescript
// Scraper de messages OnlyFans
class OnlyFansMessageScraper {
  async scrapeMessages(userId: string): Promise<Message[]> {
    const messages: Message[] = [];
    let offset = 0;
    const limit = 10; // Petit batch pour éviter détection
    
    while (true) {
      // Rate limiting
      await this.delay(scraperConfig.delayBetweenRequests);
      
      // Requête API OnlyFans
      const response = await fetch(
        `https://onlyfans.com/api2/v2/chats/${userId}/messages?limit=${limit}&offset=${offset}`,
        {
          headers: {
            'Authorization': `Bearer ${this.authToken}`,
            'User-Agent': scraperConfig.userAgent,
            'Cookie': this.formatCookies(),
          },
        }
      );
      
      if (!response.ok) {
        if (response.status === 429) {
          // Rate limited - attendre plus longtemps
          await this.delay(60000); // 1 minute
          continue;
        }
        throw new Error(`Scraping failed: ${response.status}`);
      }
      
      const data = await response.json();
      messages.push(...data.list);
      
      // Pagination
      if (!data.hasMore) break;
      offset += limit;
    }
    
    return messages;
  }
  
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### 4. Détection et Mitigation

```typescript
// Stratégies anti-détection
class AntiDetectionService {
  // 1. Rotation de User-Agents
  private userAgents = [
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
  ];
  
  getRandomUserAgent(): string {
    return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
  }
  
  // 2. Délais aléatoires
  getRandomDelay(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  
  // 3. Simulation de comportement humain
  async simulateHumanBehavior() {
    // Scroll aléatoire
    await this.randomScroll();
    
    // Pauses aléatoires
    await this.delay(this.getRandomDelay(1000, 5000));
    
    // Mouvements de souris (si headless browser)
    await this.randomMouseMovement();
  }
  
  // 4. Détection de blocage
  async checkIfBlocked(response: Response): Promise<boolean> {
    // Vérifier les signes de blocage
    if (response.status === 403) return true;
    if (response.status === 429) return true;
    
    const body = await response.text();
    if (body.includes('captcha')) return true;
    if (body.includes('blocked')) return true;
    
    return false;
  }
}
```

---

## 🔄 Synchronisation

### Stratégie de Sync

```typescript
// Service de synchronisation
class OnlyFansSyncService {
  async syncCreatorData(creatorId: string) {
    try {
      // 1. Sync messages (prioritaire)
      await this.syncMessages(creatorId);
      
      // 2. Sync fans profiles
      await this.syncFans(creatorId);
      
      // 3. Sync content
      await this.syncContent(creatorId);
      
      // 4. Sync analytics
      await this.syncAnalytics(creatorId);
      
      // Marquer comme synced
      await this.updateSyncStatus(creatorId, 'success');
      
    } catch (error) {
      if (error.message.includes('blocked')) {
        // Compte bloqué - alerter le créateur
        await this.alertCreator(creatorId, 'scraping_blocked');
      }
      
      await this.updateSyncStatus(creatorId, 'failed', error);
    }
  }
  
  // Sync incrémental (seulement les nouveaux messages)
  async syncMessages(creatorId: string) {
    const lastSyncTime = await this.getLastSyncTime(creatorId, 'messages');
    
    // Scraper seulement les messages depuis lastSyncTime
    const newMessages = await scraper.scrapeMessagesSince(
      creatorId,
      lastSyncTime
    );
    
    // Sauvegarder en DB
    await db.messages.createMany({
      data: newMessages,
    });
  }
}
```

### Fréquence de Sync

```typescript
// Planification des syncs
const syncSchedule = {
  // Messages: toutes les 5 minutes (temps réel)
  messages: {
    interval: 5 * 60 * 1000,
    priority: 'high',
  },
  
  // Fans: toutes les heures
  fans: {
    interval: 60 * 60 * 1000,
    priority: 'medium',
  },
  
  // Content: toutes les 6 heures
  content: {
    interval: 6 * 60 * 60 * 1000,
    priority: 'low',
  },
  
  // Analytics: une fois par jour
  analytics: {
    interval: 24 * 60 * 60 * 1000,
    priority: 'low',
  },
};
```

---

## 🚨 Gestion des Risques

### 1. Détection de Blocage

```typescript
// Monitoring du scraping
class ScrapingMonitor {
  async checkHealth(creatorId: string): Promise<ScrapingHealth> {
    const recentAttempts = await this.getRecentAttempts(creatorId, 24); // 24h
    
    const failureRate = recentAttempts.filter(a => a.failed).length / recentAttempts.length;
    
    if (failureRate > 0.5) {
      return {
        status: 'critical',
        message: 'Taux d\'échec élevé - possible blocage',
        action: 'pause_scraping',
      };
    }
    
    if (failureRate > 0.2) {
      return {
        status: 'warning',
        message: 'Taux d\'échec modéré',
        action: 'reduce_frequency',
      };
    }
    
    return {
      status: 'healthy',
      message: 'Scraping fonctionne normalement',
      action: 'continue',
    };
  }
}
```

### 2. Fallback Manuel

```typescript
// Si scraping bloqué, fallback vers saisie manuelle
class FallbackService {
  async handleScrapingFailure(creatorId: string) {
    // 1. Alerter le créateur
    await this.notifyCreator(creatorId, {
      type: 'scraping_failed',
      message: 'La synchronisation automatique a échoué. Veuillez saisir vos données manuellement.',
      actions: [
        { label: 'Saisir manuellement', url: '/manual-sync' },
        { label: 'Réessayer', action: 'retry_scraping' },
      ],
    });
    
    // 2. Activer le mode manuel
    await this.enableManualMode(creatorId);
    
    // 3. Désactiver le scraping temporairement
    await this.pauseScraping(creatorId, 24 * 60 * 60 * 1000); // 24h
  }
}
```

### 3. Documentation Utilisateur

```markdown
## ⚠️ Synchronisation OnlyFans

Huntaze synchronise automatiquement vos données OnlyFans.

**Comment ça marche:**
- Connexion sécurisée à votre compte OnlyFans
- Récupération de vos messages, fans, contenu
- Synchronisation toutes les 5 minutes

**Risques:**
- OnlyFans peut détecter et bloquer la synchronisation
- Votre compte pourrait être suspendu
- En cas de blocage, vous devrez saisir les données manuellement

**Que faire si ça ne marche plus:**
1. Vérifier que votre compte OnlyFans est actif
2. Réessayer la synchronisation
3. Si échec persistant, utiliser le mode manuel
4. Contacter le support Huntaze

**Mode manuel:**
Si la synchronisation automatique échoue, vous pouvez:
- Saisir les messages manuellement
- Importer des exports OnlyFans
- Utiliser Huntaze sans synchronisation
```

---

## 📊 Métriques de Scraping

```typescript
// Tracking des performances
interface ScrapingMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  rateLimitHits: number;
  blockedAttempts: number;
  lastSuccessfulSync: Date;
  dataFreshness: number; // minutes
}
```

---

**⚠️ DISCLAIMER:**

Le scraping OnlyFans est utilisé à vos propres risques.
Huntaze n'est pas responsable des suspensions de compte
ou autres conséquences liées à l'utilisation du scraping.

En utilisant Huntaze, vous acceptez ces risques.
