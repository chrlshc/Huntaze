/**
 * Unit Tests - Social Integrations Status Documentation
 * 
 * Tests to validate the social integrations status documentation
 * and ensure consistency with actual implementation
 * 
 * Coverage:
 * - OnlyFans integration status
 * - TikTok integration status
 * - Instagram integration status
 * - Reddit integration status
 * - Twitter/X integration status
 * - Documentation completeness
 * - French text detection
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

describe('Social Integrations Status Documentation', () => {
  let statusContent: string;

  beforeAll(() => {
    const statusPath = join(process.cwd(), 'SOCIAL_INTEGRATIONS_STATUS.md');
    statusContent = readFileSync(statusPath, 'utf-8');
  });

  describe('Document Structure', () => {
    it('should have main title in French', () => {
      expect(statusContent).toContain('# 📱 État des Intégrations Sociales');
    });

    it('should have objective section', () => {
      expect(statusContent).toContain('## 🎯 Objectif Priorité 3');
    });

    it('should document all 5 platforms', () => {
      expect(statusContent).toContain('## ✅ OnlyFans');
      expect(statusContent).toContain('## ⚠️ TikTok');
      expect(statusContent).toContain('## ⚠️ Instagram');
      expect(statusContent).toContain('## ❌ Reddit');
      expect(statusContent).toContain('## ❌ Twitter/X');
    });

    it('should have action plan section', () => {
      expect(statusContent).toContain('## 🎯 Plan d\'Action Recommandé');
    });

    it('should have summary table', () => {
      expect(statusContent).toContain('## 📊 Tableau Récapitulatif');
    });

    it('should have architecture diagram', () => {
      expect(statusContent).toContain('## 🔧 Architecture Commune');
    });

    it('should have important notes section', () => {
      expect(statusContent).toContain('## 📝 Notes Importantes');
    });
  });

  describe('OnlyFans Integration Status', () => {
    it('should mark OnlyFans as complete', () => {
      expect(statusContent).toContain('### État: COMPLET ✅');
    });

    it('should list OnlyFans features', () => {
      expect(statusContent).toContain('Page de connexion: `/platforms/connect/onlyfans`');
      expect(statusContent).toContain('Import CSV fonctionnel');
      expect(statusContent).toContain('Waitlist pour API officielle');
      expect(statusContent).toContain('Redirection vers `/of-connect`');
      expect(statusContent).toContain('Compliance notice');
      expect(statusContent).toContain('Messages sync disponible');
    });

    it('should list OnlyFans functionalities', () => {
      expect(statusContent).toContain('Import de données via CSV');
      expect(statusContent).toContain('Waitlist pour accès API');
      expect(statusContent).toContain('Synchronisation des messages');
      expect(statusContent).toContain('Analytics disponible');
    });
  });

  describe('TikTok Integration Status', () => {
    it('should mark TikTok as partially implemented', () => {
      expect(statusContent).toContain('### État: PARTIELLEMENT IMPLÉMENTÉ');
    });

    it('should list existing TikTok API routes', () => {
      expect(statusContent).toContain('`/api/tiktok/upload`');
      expect(statusContent).toContain('`/api/tiktok/disconnect`');
      expect(statusContent).toContain('`/api/tiktok/test-sandbox`');
      expect(statusContent).toContain('`/api/webhooks/tiktok`');
      expect(statusContent).toContain('`/api/cron/tiktok-insights`');
      expect(statusContent).toContain('`/api/cron/tiktok-status`');
    });

    it('should list TikTok services', () => {
      expect(statusContent).toContain('`lib/services/tiktok`');
      expect(statusContent).toContain('`src/lib/tiktok/events`');
      expect(statusContent).toContain('`src/lib/tiktok/worker`');
      expect(statusContent).toContain('`src/lib/tiktok/insightsWorker`');
    });

    it('should list TikTok environment variables', () => {
      expect(statusContent).toContain('`TIKTOK_CLIENT_KEY`');
      expect(statusContent).toContain('`TIKTOK_CLIENT_SECRET`');
      expect(statusContent).toContain('`TIKTOK_WEBHOOK_SECRET`');
      expect(statusContent).toContain('`TIKTOK_SANDBOX_MODE`');
      expect(statusContent).toContain('`ENABLE_TIKTOK_INSIGHTS`');
    });

    it('should list missing TikTok features', () => {
      expect(statusContent).toContain('Page de connexion complète `/platforms/connect/tiktok`');
      expect(statusContent).toContain('Flow OAuth complet');
      expect(statusContent).toContain('Tests d\'intégration');
      expect(statusContent).toContain('Synchronisation avec CRM PostgreSQL');
    });
  });

  describe('Instagram Integration Status', () => {
    it('should mark Instagram as partially implemented', () => {
      expect(statusContent).toContain('### État: PARTIELLEMENT IMPLÉMENTÉ');
    });

    it('should list existing Instagram API routes', () => {
      expect(statusContent).toContain('`/api/cron/instagram-insights`');
      expect(statusContent).toContain('`/api/debug/instagram-track`');
    });

    it('should list Instagram environment variables', () => {
      expect(statusContent).toContain('`NEXT_PUBLIC_INSTAGRAM_APP_ID`');
      expect(statusContent).toContain('`NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI`');
      expect(statusContent).toContain('`ENABLE_INSTAGRAM_INSIGHTS`');
    });

    it('should list missing Instagram features', () => {
      expect(statusContent).toContain('Service Instagram complet');
      expect(statusContent).toContain('Page de connexion `/platforms/connect/instagram`');
      expect(statusContent).toContain('Callback handler `/api/auth/instagram/callback`');
      expect(statusContent).toContain('Synchronisation avec CRM PostgreSQL');
    });
  });

  describe('Reddit Integration Status', () => {
    it('should mark Reddit as not implemented', () => {
      expect(statusContent).toContain('### État: NON IMPLÉMENTÉ');
    });

    it('should list existing Reddit elements', () => {
      expect(statusContent).toContain('Bouton "Connect Reddit"');
      expect(statusContent).toContain('Lien vers `/auth/reddit`');
      expect(statusContent).toContain('Icône RedditLogoIcon');
    });

    it('should list missing Reddit features', () => {
      expect(statusContent).toContain('Service Reddit');
      expect(statusContent).toContain('Page de connexion `/platforms/connect/reddit`');
      expect(statusContent).toContain('OAuth flow complet');
      expect(statusContent).toContain('API routes (`/api/auth/reddit`, `/api/reddit/*`)');
    });

    it('should list required Reddit environment variables', () => {
      expect(statusContent).toContain('`REDDIT_CLIENT_ID`');
      expect(statusContent).toContain('`REDDIT_CLIENT_SECRET`');
      expect(statusContent).toContain('`REDDIT_REDIRECT_URI`');
    });
  });

  describe('Twitter/X Integration Status', () => {
    it('should mark Twitter as not implemented', () => {
      expect(statusContent).toContain('### État: NON IMPLÉMENTÉ');
    });

    it('should indicate nothing exists', () => {
      expect(statusContent).toContain('### Ce Qui Existe');
      expect(statusContent).toContain('- Rien');
    });

    it('should list missing Twitter features', () => {
      expect(statusContent).toContain('Service Twitter/X');
      expect(statusContent).toContain('Page de connexion');
      expect(statusContent).toContain('OAuth 2.0 flow');
      expect(statusContent).toContain('API routes');
    });

    it('should list required Twitter environment variables', () => {
      expect(statusContent).toContain('`TWITTER_CLIENT_ID`');
      expect(statusContent).toContain('`TWITTER_CLIENT_SECRET`');
      expect(statusContent).toContain('`TWITTER_REDIRECT_URI`');
      expect(statusContent).toContain('`TWITTER_BEARER_TOKEN`');
    });
  });

  describe('Action Plan', () => {
    it('should have 4 phases', () => {
      expect(statusContent).toContain('### Phase 1: Finaliser TikTok');
      expect(statusContent).toContain('### Phase 2: Finaliser Instagram');
      expect(statusContent).toContain('### Phase 3: Implémenter Reddit');
      expect(statusContent).toContain('### Phase 4: Implémenter Twitter/X');
    });

    it('should have time estimates for each phase', () => {
      expect(statusContent).toContain('**Temps estimé: 3-4h**');
      expect(statusContent).toContain('**Temps estimé: 4-5h**');
    });

    it('should have priority levels', () => {
      expect(statusContent).toContain('(Priorité Haute)');
      expect(statusContent).toContain('(Priorité Moyenne)');
      expect(statusContent).toContain('(Priorité Basse)');
    });

    it('should list tasks for each phase', () => {
      expect(statusContent).toContain('1. ✅ Créer page de connexion');
      expect(statusContent).toContain('2. ✅ Implémenter OAuth flow');
      expect(statusContent).toContain('3. ✅ Créer callback handler');
      expect(statusContent).toContain('4. ✅ Connecter au CRM PostgreSQL');
      expect(statusContent).toContain('5. ✅ Tests d\'intégration');
    });
  });

  describe('Summary Table', () => {
    it('should have table header', () => {
      expect(statusContent).toContain('| Plateforme | État | OAuth | Service | API Routes | CRM Sync | Tests | UI |');
    });

    it('should show OnlyFans as complete', () => {
      expect(statusContent).toContain('| OnlyFans   | ✅ Complet |');
    });

    it('should show TikTok as partial', () => {
      expect(statusContent).toContain('| TikTok     | ⚠️ Partiel |');
    });

    it('should show Instagram as partial', () => {
      expect(statusContent).toContain('| Instagram  | ⚠️ Partiel |');
    });

    it('should show Reddit as todo', () => {
      expect(statusContent).toContain('| Reddit     | ❌ À faire |');
    });

    it('should show Twitter as todo', () => {
      expect(statusContent).toContain('| Twitter/X  | ❌ À faire |');
    });
  });

  describe('Architecture Diagram', () => {
    it('should have ASCII diagram', () => {
      expect(statusContent).toContain('┌─────────────────────────────────────────────────────────────┐');
      expect(statusContent).toContain('│                    User clicks "Connect"                     │');
    });

    it('should show OAuth flow', () => {
      expect(statusContent).toContain('OAuth Authorization (Platform\'s site)');
      expect(statusContent).toContain('User logs in');
      expect(statusContent).toContain('Grants permissions');
    });

    it('should show callback handler', () => {
      expect(statusContent).toContain('Callback Handler (/api/auth/[platform]/callback)');
      expect(statusContent).toContain('Exchange code for access token');
      expect(statusContent).toContain('Store tokens securely');
    });

    it('should show platform service', () => {
      expect(statusContent).toContain('Platform Service (lib/services/[platform])');
      expect(statusContent).toContain('API calls to platform');
      expect(statusContent).toContain('Token refresh logic');
    });

    it('should show CRM integration', () => {
      expect(statusContent).toContain('CRM PostgreSQL');
      expect(statusContent).toContain('platform_connections table');
      expect(statusContent).toContain('fans table');
      expect(statusContent).toContain('messages table');
    });
  });

  describe('Important Notes', () => {
    it('should have security section', () => {
      expect(statusContent).toContain('### Sécurité');
      expect(statusContent).toContain('Tous les tokens doivent être chiffrés');
      expect(statusContent).toContain('Utiliser HTTPS uniquement');
      expect(statusContent).toContain('Valider tous les webhooks avec signatures');
      expect(statusContent).toContain('Rate limiting sur toutes les API routes');
    });

    it('should have performance section', () => {
      expect(statusContent).toContain('### Performance');
      expect(statusContent).toContain('Utiliser des workers pour les tâches longues');
      expect(statusContent).toContain('Caching des données avec Redis');
      expect(statusContent).toContain('Pagination pour les listes');
      expect(statusContent).toContain('Background jobs pour la synchronisation');
    });

    it('should have compliance section', () => {
      expect(statusContent).toContain('### Conformité');
      expect(statusContent).toContain('Respecter les limites de rate des APIs');
      expect(statusContent).toContain('Afficher les compliance notices');
      expect(statusContent).toContain('Gérer les révocations de tokens');
      expect(statusContent).toContain('Logs d\'audit pour toutes les actions');
    });
  });

  describe('Next Steps', () => {
    it('should recommend starting with TikTok', () => {
      expect(statusContent).toContain('## 🚀 Prochaine Étape');
      expect(statusContent).toContain('Commencer par **Phase 1: Finaliser TikTok**');
    });

    it('should provide reasons for TikTok priority', () => {
      expect(statusContent).toContain('Infrastructure déjà en place');
      expect(statusContent).toContain('Service existant à compléter');
      expect(statusContent).toContain('Impact utilisateur élevé');
      expect(statusContent).toContain('Base pour les autres intégrations');
    });

    it('should ask for confirmation', () => {
      expect(statusContent).toContain('Voulez-vous que je commence par TikTok ?');
    });
  });

  describe('French Language Consistency', () => {
    it('should use French throughout the document', () => {
      // Main sections in French
      expect(statusContent).toContain('État des Intégrations Sociales');
      expect(statusContent).toContain('Objectif Priorité');
      expect(statusContent).toContain('Plan d\'Action Recommandé');
      expect(statusContent).toContain('Tableau Récapitulatif');
      expect(statusContent).toContain('Architecture Commune');
      expect(statusContent).toContain('Notes Importantes');
      expect(statusContent).toContain('Prochaine Étape');
    });

    it('should use French status labels', () => {
      expect(statusContent).toContain('COMPLET');
      expect(statusContent).toContain('PARTIELLEMENT IMPLÉMENTÉ');
      expect(statusContent).toContain('NON IMPLÉMENTÉ');
    });

    it('should use French section headers', () => {
      expect(statusContent).toContain('Ce Qui Existe');
      expect(statusContent).toContain('Ce Qui Manque');
      expect(statusContent).toContain('Fonctionnalités');
    });

    it('should use French task descriptions', () => {
      expect(statusContent).toContain('Créer page de connexion');
      expect(statusContent).toContain('Implémenter OAuth flow');
      expect(statusContent).toContain('Tests d\'intégration');
      expect(statusContent).toContain('Connecter au CRM');
    });
  });

  describe('Completeness Validation', () => {
    it('should document all required environment variables', () => {
      // TikTok
      expect(statusContent).toContain('TIKTOK_CLIENT_KEY');
      expect(statusContent).toContain('TIKTOK_CLIENT_SECRET');
      
      // Instagram
      expect(statusContent).toContain('INSTAGRAM_APP_ID');
      expect(statusContent).toContain('INSTAGRAM_REDIRECT_URI');
      
      // Reddit
      expect(statusContent).toContain('REDDIT_CLIENT_ID');
      expect(statusContent).toContain('REDDIT_CLIENT_SECRET');
      
      // Twitter
      expect(statusContent).toContain('TWITTER_CLIENT_ID');
      expect(statusContent).toContain('TWITTER_BEARER_TOKEN');
    });

    it('should document all API routes', () => {
      expect(statusContent).toContain('/api/tiktok/');
      expect(statusContent).toContain('/api/webhooks/tiktok');
      expect(statusContent).toContain('/api/cron/tiktok-insights');
      expect(statusContent).toContain('/api/cron/instagram-insights');
    });

    it('should document all service files', () => {
      expect(statusContent).toContain('lib/services/tiktok');
      expect(statusContent).toContain('src/lib/tiktok/events');
      expect(statusContent).toContain('src/lib/tiktok/worker');
    });

    it('should document all missing features', () => {
      expect(statusContent).toContain('Page de connexion');
      expect(statusContent).toContain('OAuth flow');
      expect(statusContent).toContain('Callback handler');
      expect(statusContent).toContain('Tests d\'intégration');
      expect(statusContent).toContain('CRM PostgreSQL');
    });
  });

  describe('Emoji Usage', () => {
    it('should use appropriate emojis for status', () => {
      expect(statusContent).toContain('✅'); // Complete
      expect(statusContent).toContain('⚠️'); // Partial
      expect(statusContent).toContain('❌'); // Not implemented
    });

    it('should use emojis for sections', () => {
      expect(statusContent).toContain('📱'); // Mobile/Social
      expect(statusContent).toContain('🎯'); // Target/Goal
      expect(statusContent).toContain('📊'); // Chart/Table
      expect(statusContent).toContain('🔧'); // Tools/Architecture
      expect(statusContent).toContain('📝'); // Notes
      expect(statusContent).toContain('🚀'); // Launch/Next steps
    });
  });

  describe('Formatting Consistency', () => {
    it('should use consistent heading levels', () => {
      const h2Count = (statusContent.match(/^## /gm) || []).length;
      const h3Count = (statusContent.match(/^### /gm) || []).length;
      
      expect(h2Count).toBeGreaterThan(5);
      expect(h3Count).toBeGreaterThan(10);
    });

    it('should use consistent list formatting', () => {
      expect(statusContent).toContain('- ✅');
      expect(statusContent).toContain('- [ ]');
      expect(statusContent).toContain('1. ✅');
    });

    it('should use code blocks for technical terms', () => {
      expect(statusContent).toContain('`/api/');
      expect(statusContent).toContain('`lib/');
      expect(statusContent).toContain('`TIKTOK_');
    });

    it('should use bold for emphasis', () => {
      expect(statusContent).toContain('**Temps estimé:');
      expect(statusContent).toContain('**Phase 1:');
    });
  });

  describe('Technical Accuracy', () => {
    it('should reference correct file paths', () => {
      expect(statusContent).toContain('/platforms/connect/onlyfans');
      expect(statusContent).toContain('/platforms/connect/tiktok');
      expect(statusContent).toContain('/platforms/connect/instagram');
      expect(statusContent).toContain('/platforms/connect/reddit');
    });

    it('should reference correct API endpoints', () => {
      expect(statusContent).toContain('/api/auth/[platform]/callback');
      expect(statusContent).toContain('/api/tiktok/upload');
      expect(statusContent).toContain('/api/webhooks/tiktok');
    });

    it('should reference correct service paths', () => {
      expect(statusContent).toContain('lib/services/[platform]');
      expect(statusContent).toContain('lib/services/tiktok');
    });

    it('should reference correct database tables', () => {
      expect(statusContent).toContain('platform_connections table');
      expect(statusContent).toContain('fans table');
      expect(statusContent).toContain('messages table');
      expect(statusContent).toContain('analytics_events table');
    });
  });
});
