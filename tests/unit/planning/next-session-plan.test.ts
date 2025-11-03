/**
 * Unit Tests - Next Session Plan Validation
 * 
 * Tests to validate the next session plan structure and content
 * Based on: NEXT_SESSION_PLAN.md
 * 
 * Coverage:
 * - Plan structure validation
 * - Task priorities and estimates
 * - Reddit integration requirements
 * - Documentation requirements
 * - Deployment checklist
 * - Current state validation
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

describe('Next Session Plan - Validation', () => {
  let planContent: string;

  beforeAll(() => {
    const planPath = join(process.cwd(), 'NEXT_SESSION_PLAN.md');
    expect(existsSync(planPath)).toBe(true);
    planContent = readFileSync(planPath, 'utf-8');
  });

  describe('Plan Structure', () => {
    it('should have main objectives section', () => {
      expect(planContent).toContain('## Objectifs');
      expect(planContent).toContain('Tester Instagram');
      expect(planContent).toContain('Ajouter Reddit');
      expect(planContent).toContain('Documenter');
      expect(planContent).toContain('Lancer');
    });

    it('should have Instagram testing section', () => {
      expect(planContent).toContain('## 1. Tests Instagram');
      expect(planContent).toContain('Tests à exécuter');
      expect(planContent).toContain('Vérifications manuelles');
    });

    it('should have Reddit integration section', () => {
      expect(planContent).toContain('## 2. Reddit Integration');
      expect(planContent).toContain('Architecture Reddit');
      expect(planContent).toContain('Fichiers à créer');
    });

    it('should have documentation section', () => {
      expect(planContent).toContain('## 3. Documentation');
      expect(planContent).toContain('Documents à créer');
    });

    it('should have deployment section', () => {
      expect(planContent).toContain('## 4. Déploiement');
      expect(planContent).toContain('Checklist');
    });

    it('should have priorities section', () => {
      expect(planContent).toContain('## Priorités');
      expect(planContent).toContain('Must Have');
      expect(planContent).toContain('Nice to Have');
    });

    it('should have time estimation table', () => {
      expect(planContent).toContain('## Estimation Temps');
      expect(planContent).toContain('| Tâche | Temps | Priorité |');
    });

    it('should have current state section', () => {
      expect(planContent).toContain('## État Actuel');
      expect(planContent).toContain('Complété:');
      expect(planContent).toContain('À faire:');
    });
  });

  describe('Instagram Testing Requirements', () => {
    it('should list unit test commands', () => {
      expect(planContent).toContain('npm test tests/unit/services/instagramOAuth.test.ts');
      expect(planContent).toContain('npm test tests/unit/services/instagramPublish.test.ts');
      expect(planContent).toContain('npm test tests/unit/db/repositories/instagramAccountsRepository.test.ts');
    });

    it('should list integration test commands', () => {
      expect(planContent).toContain('npm test tests/integration/api/instagram-oauth-endpoints.test.ts');
      expect(planContent).toContain('npm test tests/integration/api/instagram-publish-endpoints.test.ts');
      expect(planContent).toContain('npm test tests/integration/db/instagram-accounts-repository.test.ts');
    });

    it('should have manual verification checklist', () => {
      expect(planContent).toContain('OAuth flow fonctionne');
      expect(planContent).toContain('Publishing fonctionne');
      expect(planContent).toContain('Webhooks configurés');
      expect(planContent).toContain('Database tables créées');
      expect(planContent).toContain('Repositories fonctionnent');
    });

    it('should estimate 30-45 minutes for testing', () => {
      expect(planContent).toContain('30-45 min');
    });
  });

  describe('Reddit Integration Requirements', () => {
    it('should define Reddit architecture', () => {
      expect(planContent).toContain('Architecture Reddit');
      expect(planContent).toContain('OAuth: Reddit OAuth 2.0');
      expect(planContent).toContain('Token lifetime');
      expect(planContent).toContain('Publishing');
      expect(planContent).toContain('Subreddits');
    });

    it('should list service files to create', () => {
      expect(planContent).toContain('lib/services/redditOAuth.ts');
      expect(planContent).toContain('lib/services/redditPublish.ts');
    });

    it('should list API endpoint files to create', () => {
      expect(planContent).toContain('app/api/auth/reddit/route.ts');
      expect(planContent).toContain('app/api/auth/reddit/callback/route.ts');
      expect(planContent).toContain('app/api/reddit/publish/route.ts');
    });

    it('should list UI files to create', () => {
      expect(planContent).toContain('app/platforms/connect/reddit/page.tsx');
      expect(planContent).toContain('components/platforms/RedditDashboardWidget.tsx');
    });

    it('should describe OAuth flow', () => {
      expect(planContent).toContain('Reddit OAuth Flow');
      expect(planContent).toContain('User clicks "Connect Reddit"');
      expect(planContent).toContain('Redirect to Reddit OAuth');
      expect(planContent).toContain('Exchange for access + refresh tokens');
      expect(planContent).toContain('Store encrypted tokens');
    });

    it('should describe publishing API', () => {
      expect(planContent).toContain('Reddit Publishing');
      expect(planContent).toContain('POST /api/reddit/publish');
      expect(planContent).toContain('subreddit');
      expect(planContent).toContain('type');
      expect(planContent).toContain('title');
      expect(planContent).toContain('content');
    });

    it('should list required environment variables', () => {
      expect(planContent).toContain('REDDIT_CLIENT_ID');
      expect(planContent).toContain('REDDIT_CLIENT_SECRET');
      expect(planContent).toContain('REDDIT_REDIRECT_URI');
      expect(planContent).toContain('REDDIT_USER_AGENT');
    });

    it('should estimate 3-4 hours for Reddit integration', () => {
      expect(planContent).toContain('3-4 heures');
    });
  });

  describe('Documentation Requirements', () => {
    it('should list user guide document', () => {
      expect(planContent).toContain('docs/USER_GUIDE.md');
      expect(planContent).toContain('Comment connecter TikTok');
      expect(planContent).toContain('Comment connecter Instagram');
      expect(planContent).toContain('Comment connecter Reddit');
      expect(planContent).toContain('Comment publier du contenu');
      expect(planContent).toContain('Troubleshooting');
    });

    it('should list developer guide document', () => {
      expect(planContent).toContain('docs/DEVELOPER_GUIDE.md');
      expect(planContent).toContain('Architecture overview');
      expect(planContent).toContain('OAuth flows');
      expect(planContent).toContain('Database schema');
      expect(planContent).toContain('API endpoints');
      expect(planContent).toContain('Testing guide');
    });

    it('should list deployment guide document', () => {
      expect(planContent).toContain('docs/DEPLOYMENT.md');
      expect(planContent).toContain('Variables d\'environnement');
      expect(planContent).toContain('Database setup');
      expect(planContent).toContain('Webhook configuration');
      expect(planContent).toContain('Production checklist');
    });

    it('should estimate 1-2 hours for documentation', () => {
      expect(planContent).toContain('1-2h');
    });
  });

  describe('Deployment Checklist', () => {
    it('should have pre-deployment checklist', () => {
      expect(planContent).toContain('Pré-déploiement:');
      expect(planContent).toContain('Tous les tests passent');
      expect(planContent).toContain('Variables d\'environnement configurées');
      expect(planContent).toContain('Database migrée');
      expect(planContent).toContain('Webhooks configurés');
      expect(planContent).toContain('Code commité et pushé');
    });

    it('should have deployment commands', () => {
      expect(planContent).toContain('git add .');
      expect(planContent).toContain('git commit');
      expect(planContent).toContain('git push origin main');
      expect(planContent).toContain('npm run migrate:prod');
    });

    it('should have post-deployment checklist', () => {
      expect(planContent).toContain('Post-déploiement:');
      expect(planContent).toContain('Tester OAuth');
      expect(planContent).toContain('Tester publishing');
      expect(planContent).toContain('Vérifier webhooks');
      expect(planContent).toContain('Monitorer logs');
      expect(planContent).toContain('Vérifier métriques');
    });

    it('should estimate 30 minutes for deployment', () => {
      expect(planContent).toContain('30 min');
    });
  });

  describe('Priorities', () => {
    it('should define must-have priorities', () => {
      expect(planContent).toContain('Must Have (Critique)');
      expect(planContent).toContain('Tests Instagram passent');
      expect(planContent).toContain('Reddit OAuth + Publishing');
      expect(planContent).toContain('Documentation basique');
      expect(planContent).toContain('Déploiement');
    });

    it('should define nice-to-have priorities', () => {
      expect(planContent).toContain('Nice to Have (Optionnel)');
      expect(planContent).toContain('Monitoring dashboards');
      expect(planContent).toContain('Alertes avancées');
      expect(planContent).toContain('Tests E2E complets');
      expect(planContent).toContain('Documentation extensive');
    });
  });

  describe('Time Estimation', () => {
    it('should have time estimation table', () => {
      expect(planContent).toContain('| Tâche | Temps | Priorité |');
      expect(planContent).toContain('| Tests Instagram | 30-45 min | Critique |');
      expect(planContent).toContain('| Reddit OAuth | 1-1.5h | Critique |');
      expect(planContent).toContain('| Reddit Publishing | 1-1.5h | Critique |');
      expect(planContent).toContain('| Reddit UI | 30-45 min | Critique |');
      expect(planContent).toContain('| Documentation | 1-2h | Important |');
      expect(planContent).toContain('| Déploiement | 30 min | Critique |');
    });

    it('should have total time estimate', () => {
      expect(planContent).toContain('**TOTAL**');
      expect(planContent).toContain('5-7 heures');
    });

    it('should mark all critical tasks', () => {
      const criticalTasks = [
        'Tests Instagram',
        'Reddit OAuth',
        'Reddit Publishing',
        'Reddit UI',
        'Déploiement'
      ];

      criticalTasks.forEach(task => {
        const taskLine = planContent.split('\n').find(line => line.includes(task));
        expect(taskLine).toBeTruthy();
        expect(taskLine).toContain('Critique');
      });
    });
  });

  describe('Current State', () => {
    it('should list completed items', () => {
      expect(planContent).toContain('Complété:');
      expect(planContent).toContain('TikTok (OAuth, Publishing, Webhooks, UI)');
      expect(planContent).toContain('Instagram (OAuth, Publishing, Webhooks, CRM, UI)');
      expect(planContent).toContain('Database migrations');
      expect(planContent).toContain('Token encryption');
      expect(planContent).toContain('Shared infrastructure');
    });

    it('should list pending items', () => {
      expect(planContent).toContain('À faire:');
      expect(planContent).toContain('Tests Instagram');
      expect(planContent).toContain('Reddit integration');
      expect(planContent).toContain('Documentation');
      expect(planContent).toContain('Déploiement');
    });

    it('should use checkmarks for completed items', () => {
      expect(planContent).toContain('✅ TikTok');
      expect(planContent).toContain('✅ Instagram');
      expect(planContent).toContain('✅ Database migrations');
      expect(planContent).toContain('✅ Token encryption');
    });

    it('should use forward arrows for pending items', () => {
      expect(planContent).toContain('⏭️ Tests Instagram');
      expect(planContent).toContain('⏭️ Reddit integration');
      expect(planContent).toContain('⏭️ Documentation');
      expect(planContent).toContain('⏭️ Déploiement');
    });
  });

  describe('Useful Commands', () => {
    it('should list test commands', () => {
      expect(planContent).toContain('## Commandes Utiles');
      expect(planContent).toContain('npm test');
      expect(planContent).toContain('npm test tests/unit/services/');
      expect(planContent).toContain('npm test tests/integration/api/');
      expect(planContent).toContain('npm test -- --coverage');
    });

    it('should list database commands', () => {
      expect(planContent).toContain('npm run migrate');
      expect(planContent).toContain('npm run migrate:prod');
      expect(planContent).toContain('npm run migrate:rollback');
    });

    it('should list deployment commands', () => {
      expect(planContent).toContain('npm run build');
      expect(planContent).toContain('npm start');
      expect(planContent).toContain('npm run logs');
    });
  });

  describe('Important Notes', () => {
    it('should document Reddit rate limits', () => {
      expect(planContent).toContain('Reddit Rate Limits');
      expect(planContent).toContain('60 requests/minute');
    });

    it('should document Reddit OAuth behavior', () => {
      expect(planContent).toContain('Reddit OAuth');
      expect(planContent).toContain('Refresh tokens ne expirent pas');
    });

    it('should document Reddit permissions', () => {
      expect(planContent).toContain('Reddit Subreddits');
      expect(planContent).toContain('User doit avoir permissions');
    });

    it('should document Reddit content rules', () => {
      expect(planContent).toContain('Reddit Content');
      expect(planContent).toContain('Respecter rules de chaque subreddit');
    });
  });

  describe('Session Summary', () => {
    it('should summarize current session', () => {
      expect(planContent).toContain('Session actuelle:');
      expect(planContent).toContain('Instagram OAuth + Publishing + Webhooks + CRM');
    });

    it('should outline next session', () => {
      expect(planContent).toContain('Prochaine session:');
      expect(planContent).toContain('Tester Instagram');
      expect(planContent).toContain('Implémenter Reddit');
      expect(planContent).toContain('Documenter');
      expect(planContent).toContain('Déployer');
    });

    it('should state final result', () => {
      expect(planContent).toContain('Résultat final:');
      expect(planContent).toContain('TikTok + Instagram + Reddit complets et en production');
    });

    it('should show token usage', () => {
      expect(planContent).toContain('Tokens utilisés cette session:');
      expect(planContent).toContain('135K/200K');
      expect(planContent).toContain('67.5%');
    });

    it('should provide recommendation', () => {
      expect(planContent).toContain('Recommandation:');
      expect(planContent).toContain('Nouvelle session pour Reddit avec contexte frais');
    });
  });

  describe('Plan Completeness', () => {
    it('should have all 4 main sections', () => {
      const mainSections = [
        '## 1. Tests Instagram',
        '## 2. Reddit Integration',
        '## 3. Documentation',
        '## 4. Déploiement'
      ];

      mainSections.forEach(section => {
        expect(planContent).toContain(section);
      });
    });

    it('should have supporting sections', () => {
      const supportingSections = [
        '## Priorités',
        '## Estimation Temps',
        '## État Actuel',
        '## Commandes Utiles',
        '## Notes Importantes',
        '## Résumé'
      ];

      supportingSections.forEach(section => {
        expect(planContent).toContain(section);
      });
    });

    it('should have clear action items', () => {
      // Should have checkboxes for actionable items
      const checkboxCount = (planContent.match(/- \[ \]/g) || []).length;
      expect(checkboxCount).toBeGreaterThan(10);
    });

    it('should have code examples', () => {
      // Should have code blocks
      const codeBlockCount = (planContent.match(/```/g) || []).length;
      expect(codeBlockCount).toBeGreaterThan(10);
    });

    it('should have time estimates for all tasks', () => {
      const tasks = [
        'Tests Instagram',
        'Reddit OAuth',
        'Reddit Publishing',
        'Reddit UI',
        'Documentation',
        'Déploiement'
      ];

      tasks.forEach(task => {
        const taskSection = planContent.split('\n').find(line => 
          line.includes(task) && line.includes('|')
        );
        expect(taskSection).toBeTruthy();
      });
    });
  });

  describe('Reddit Integration Completeness', () => {
    it('should define all required Reddit services', () => {
      expect(planContent).toContain('redditOAuth.ts');
      expect(planContent).toContain('redditPublish.ts');
    });

    it('should define all required Reddit API routes', () => {
      expect(planContent).toContain('app/api/auth/reddit/route.ts');
      expect(planContent).toContain('app/api/auth/reddit/callback/route.ts');
      expect(planContent).toContain('app/api/reddit/publish/route.ts');
    });

    it('should define all required Reddit UI components', () => {
      expect(planContent).toContain('app/platforms/connect/reddit/page.tsx');
      expect(planContent).toContain('components/platforms/RedditDashboardWidget.tsx');
    });

    it('should mention existing database tables', () => {
      expect(planContent).toContain('Tables déjà créées dans migration existante');
      expect(planContent).toContain('reddit_posts');
      expect(planContent).toContain('oauth_accounts');
    });

    it('should define Reddit post types', () => {
      expect(planContent).toContain('type": "link|text|image');
    });

    it('should define all Reddit environment variables', () => {
      const envVars = [
        'REDDIT_CLIENT_ID',
        'REDDIT_CLIENT_SECRET',
        'REDDIT_REDIRECT_URI',
        'REDDIT_USER_AGENT'
      ];

      envVars.forEach(envVar => {
        expect(planContent).toContain(envVar);
      });
    });
  });

  describe('Documentation Completeness', () => {
    it('should cover all platforms in user guide', () => {
      const platforms = ['TikTok', 'Instagram', 'Reddit'];
      
      platforms.forEach(platform => {
        expect(planContent).toContain(`Comment connecter ${platform}`);
      });
    });

    it('should include troubleshooting in user guide', () => {
      expect(planContent).toContain('Troubleshooting');
    });

    it('should cover technical topics in developer guide', () => {
      const topics = [
        'Architecture overview',
        'OAuth flows',
        'Database schema',
        'API endpoints',
        'Testing guide'
      ];

      topics.forEach(topic => {
        expect(planContent).toContain(topic);
      });
    });

    it('should cover deployment topics', () => {
      const topics = [
        'Variables d\'environnement',
        'Database setup',
        'Webhook configuration',
        'Production checklist'
      ];

      topics.forEach(topic => {
        expect(planContent).toContain(topic);
      });
    });
  });

  describe('Validation - Plan Quality', () => {
    it('should have realistic time estimates', () => {
      // Total should be 5-7 hours
      expect(planContent).toContain('5-7 heures');
      
      // Individual tasks should be reasonable
      expect(planContent).toContain('30-45 min'); // Testing
      expect(planContent).toContain('1-1.5h'); // OAuth
      expect(planContent).toContain('1-2h'); // Documentation
    });

    it('should prioritize critical tasks', () => {
      const criticalCount = (planContent.match(/Critique/g) || []).length;
      expect(criticalCount).toBeGreaterThanOrEqual(5);
    });

    it('should have clear success criteria', () => {
      expect(planContent).toContain('Résultat final:');
      expect(planContent).toContain('TikTok + Instagram + Reddit complets');
      expect(planContent).toContain('en production');
    });

    it('should acknowledge current progress', () => {
      expect(planContent).toContain('✅ TikTok');
      expect(planContent).toContain('✅ Instagram');
      expect(planContent).toContain('✅ Database migrations');
    });

    it('should have actionable next steps', () => {
      const nextSteps = [
        'Tester Instagram',
        'Implémenter Reddit',
        'Documenter',
        'Déployer'
      ];

      nextSteps.forEach(step => {
        expect(planContent).toContain(step);
      });
    });
  });
});
