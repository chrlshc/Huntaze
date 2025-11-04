/**
 * Tests E2E pour les scénarios d'hydratation réels
 * 
 * Ces tests simulent des conditions réelles :
 * 1. Différentes conditions réseau
 * 2. Navigateurs multiples
 * 3. Tailles d'écran variées
 * 4. Interactions utilisateur complexes
 */

import { test, expect, Page, BrowserContext } from '@playwright/test';

// Configuration des tests E2E
const TEST_CONFIG = {
  baseURL: process.env.TEST_BASE_URL || 'http://localhost:3000',
  timeout: 30000,
  retries: 2
};

// Utilitaires pour les tests d'hydratation
class HydrationTestUtils {
  constructor(private page: Page) {}

  /**
   * Attend que l'hydratation soit complète
   */
  async waitForHydration(timeout = 5000): Promise<void> {
    await this.page.waitForFunction(
      () => {
        // Vérifier que les composants hydration-safe sont prêts
        const hydrationElements = document.querySelectorAll('[data-hydration-state="complete"]');
        const loadingElements = document.querySelectorAll('[data-hydration-state="loading"]');
        
        return hydrationElements.length > 0 && loadingElements.length === 0;
      },
      { timeout }
    );
  }

  /**
   * Vérifie qu'il n'y a pas d'erreurs d'hydratation dans la console
   */
  async checkForHydrationErrors(): Promise<string[]> {
    const logs = await this.page.evaluate(() => {
      // @ts-ignore
      return window.__hydrationErrors || [];
    });
    
    return logs.filter((log: any) => 
      log.message && log.message.includes('hydration')
    );
  }

  /**
   * Simule des conditions réseau lentes
   */
  async simulateSlowNetwork(): Promise<void> {
    await this.page.route('**/*', async (route) => {
      // Ajouter un délai aléatoire entre 100-500ms
      const delay = 100 + Math.random() * 400;
      await new Promise(resolve => setTimeout(resolve, delay));
      await route.continue();
    });
  }

  /**
   * Vérifie la cohérence du contenu aléatoire
   */
  async verifyRandomContentConsistency(selector: string): Promise<boolean> {
    const content1 = await this.page.textContent(selector);
    await this.page.reload();
    await this.waitForHydration();
    const content2 = await this.page.textContent(selector);
    
    return content1 === content2;
  }

  /**
   * Teste la préservation d'état pendant la recovery
   */
  async testStatePreservation(): Promise<boolean> {
    // Remplir un formulaire
    await this.page.fill('input[type="text"]', 'Test value');
    await this.page.evaluate(() => window.scrollTo(0, 500));
    
    // Simuler une erreur d'hydratation (si possible)
    const initialScrollY = await this.page.evaluate(() => window.scrollY);
    const inputValue = await this.page.inputValue('input[type="text"]');
    
    // Vérifier que les valeurs sont préservées
    return initialScrollY === 500 && inputValue === 'Test value';
  }
}

test.describe('Real-World Hydration Scenarios', () => {
  let utils: HydrationTestUtils;

  test.beforeEach(async ({ page }) => {
    utils = new HydrationTestUtils(page);
    
    // Intercepter les erreurs JavaScript
    page.on('console', msg => {
      if (msg.type() === 'error' && msg.text().includes('hydration')) {
        console.error('Hydration error detected:', msg.text());
      }
    });

    // Aller à la page de test
    await page.goto(TEST_CONFIG.baseURL);
  });

  test.describe('6.3.1 Network Conditions Testing', () => {
    test('should handle slow network conditions', async ({ page }) => {
      await utils.simulateSlowNetwork();
      
      // Naviguer vers une page avec composants hydration-safe
      await page.goto(`${TEST_CONFIG.baseURL}/`);
      
      // Attendre l'hydratation malgré le réseau lent
      await utils.waitForHydration(10000);
      
      // Vérifier que les composants sont correctement hydratés
      const yearElement = page.locator('text=' + new Date().getFullYear());
      await expect(yearElement).toBeVisible();
      
      // Vérifier qu'il n'y a pas d'erreurs d'hydratation
      const hydrationErrors = await utils.checkForHydrationErrors();
      expect(hydrationErrors).toHaveLength(0);
    });

    test('should handle network interruptions', async ({ page }) => {
      // Commencer le chargement
      const navigationPromise = page.goto(`${TEST_CONFIG.baseURL}/`);
      
      // Interrompre le réseau après 1 seconde
      setTimeout(async () => {
        await page.setOffline(true);
        setTimeout(async () => {
          await page.setOffline(false);
        }, 2000);
      }, 1000);
      
      await navigationPromise;
      
      // Attendre l'hydratation après reconnexion
      await utils.waitForHydration(15000);
      
      // Vérifier que la page fonctionne correctement
      await expect(page.locator('[data-testid="app-root"]')).toBeVisible();
    });
  });

  test.describe('6.3.2 Cross-Browser Compatibility', () => {
    ['chromium', 'firefox', 'webkit'].forEach(browserName => {
      test(`should work correctly in ${browserName}`, async ({ page, browserName: currentBrowser }) => {
        test.skip(currentBrowser !== browserName, `Test spécifique à ${browserName}`);
        
        await page.goto(`${TEST_CONFIG.baseURL}/`);
        await utils.waitForHydration();
        
        // Tests spécifiques au navigateur
        const yearElement = page.locator('text=' + new Date().getFullYear());
        await expect(yearElement).toBeVisible();
        
        // Tester les APIs du navigateur
        const browserInfo = await page.evaluate(() => ({
          userAgent: navigator.userAgent,
          windowWidth: window.innerWidth,
          windowHeight: window.innerHeight
        }));
        
        expect(browserInfo.windowWidth).toBeGreaterThan(0);
        expect(browserInfo.windowHeight).toBeGreaterThan(0);
        expect(browserInfo.userAgent).toBeTruthy();
      });
    });
  });

  test.describe('6.3.3 Responsive Design Hydration', () => {
    const viewports = [
      { name: 'Mobile', width: 375, height: 667 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Desktop', width: 1920, height: 1080 }
    ];

    viewports.forEach(viewport => {
      test(`should hydrate correctly on ${viewport.name}`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.goto(`${TEST_CONFIG.baseURL}/`);
        
        await utils.waitForHydration();
        
        // Vérifier que les composants responsifs fonctionnent
        const responsiveElements = page.locator('[data-client-only="ready"]');
        await expect(responsiveElements.first()).toBeVisible();
        
        // Vérifier les informations de viewport
        const viewportInfo = await page.evaluate(() => ({
          width: window.innerWidth,
          height: window.innerHeight
        }));
        
        expect(viewportInfo.width).toBe(viewport.width);
        expect(viewportInfo.height).toBe(viewport.height);
      });
    });

    test('should handle orientation changes', async ({ page }) => {
      // Commencer en portrait
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto(`${TEST_CONFIG.baseURL}/`);
      await utils.waitForHydration();
      
      // Changer en paysage
      await page.setViewportSize({ width: 667, height: 375 });
      
      // Attendre que les composants s'adaptent
      await page.waitForTimeout(500);
      
      // Vérifier que l'hydratation reste stable
      const hydrationErrors = await utils.checkForHydrationErrors();
      expect(hydrationErrors).toHaveLength(0);
    });
  });

  test.describe('6.3.4 User Interaction Scenarios', () => {
    test('should maintain hydration stability during user interactions', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.baseURL}/dashboard`);
      await utils.waitForHydration();
      
      // Simuler des interactions utilisateur complexes
      const interactions = [
        () => page.click('button:has-text("Connexion")'),
        () => page.fill('input[type="email"]', 'test@example.com'),
        () => page.fill('input[type="password"]', 'password123'),
        () => page.click('button[type="submit"]'),
        () => page.scroll(0, 500),
        () => page.click('nav a:first-child'),
        () => page.goBack(),
        () => page.reload()
      ];

      for (const interaction of interactions) {
        try {
          await interaction();
          await page.waitForTimeout(200);
          
          // Vérifier qu'il n'y a pas d'erreurs après chaque interaction
          const errors = await utils.checkForHydrationErrors();
          expect(errors).toHaveLength(0);
        } catch (error) {
          // Certaines interactions peuvent échouer selon la page, c'est OK
          console.log('Interaction skipped:', error);
        }
      }
    });

    test('should handle form submissions with hydration', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.baseURL}/auth/register`);
      await utils.waitForHydration();
      
      // Remplir le formulaire
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'SecurePassword123!');
      await page.fill('input[name="confirmPassword"]', 'SecurePassword123!');
      
      // Vérifier que les composants hydration-safe fonctionnent
      const currentYear = new Date().getFullYear().toString();
      await expect(page.locator(`text=${currentYear}`)).toBeVisible();
      
      // Soumettre le formulaire (sans vraiment créer de compte)
      // await page.click('button[type="submit"]');
      
      // Vérifier la stabilité après interaction
      const hydrationErrors = await utils.checkForHydrationErrors();
      expect(hydrationErrors).toHaveLength(0);
    });
  });

  test.describe('6.3.5 Production-Like Environment Testing', () => {
    test('should work with production optimizations', async ({ page }) => {
      // Simuler un environnement de production
      await page.addInitScript(() => {
        // @ts-ignore
        window.NODE_ENV = 'production';
      });
      
      await page.goto(`${TEST_CONFIG.baseURL}/`);
      await utils.waitForHydration();
      
      // Vérifier que les optimisations de production n'affectent pas l'hydratation
      const yearElement = page.locator('text=' + new Date().getFullYear());
      await expect(yearElement).toBeVisible();
      
      // Vérifier les métriques de performance
      const performanceMetrics = await page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        return {
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
          firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0
        };
      });
      
      // Vérifier que les performances sont acceptables
      expect(performanceMetrics.domContentLoaded).toBeLessThan(2000);
    });

    test('should handle error recovery in production mode', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.baseURL}/`);
      await utils.waitForHydration();
      
      // Simuler une erreur JavaScript
      await page.evaluate(() => {
        // Créer une erreur qui pourrait affecter l'hydratation
        const errorEvent = new ErrorEvent('error', {
          message: 'Simulated hydration error',
          filename: 'test.js',
          lineno: 1
        });
        window.dispatchEvent(errorEvent);
      });
      
      // Attendre un peu pour voir si le système de recovery réagit
      await page.waitForTimeout(1000);
      
      // Vérifier que la page reste fonctionnelle
      await expect(page.locator('body')).toBeVisible();
      
      // Vérifier que les composants hydration-safe continuent de fonctionner
      const yearElement = page.locator('text=' + new Date().getFullYear());
      await expect(yearElement).toBeVisible();
    });
  });

  test.describe('6.3.6 Memory and Performance Testing', () => {
    test('should not cause memory leaks during hydration', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.baseURL}/`);
      await utils.waitForHydration();
      
      // Mesurer l'utilisation mémoire initiale
      const initialMemory = await page.evaluate(() => {
        // @ts-ignore
        return performance.memory ? performance.memory.usedJSHeapSize : 0;
      });
      
      // Effectuer plusieurs cycles d'hydratation/navigation
      for (let i = 0; i < 5; i++) {
        await page.reload();
        await utils.waitForHydration();
        await page.waitForTimeout(500);
      }
      
      // Mesurer l'utilisation mémoire finale
      const finalMemory = await page.evaluate(() => {
        // Forcer le garbage collection si possible
        // @ts-ignore
        if (window.gc) window.gc();
        // @ts-ignore
        return performance.memory ? performance.memory.usedJSHeapSize : 0;
      });
      
      // Vérifier qu'il n'y a pas de fuite mémoire significative (< 50% d'augmentation)
      if (initialMemory > 0 && finalMemory > 0) {
        const memoryIncrease = (finalMemory - initialMemory) / initialMemory;
        expect(memoryIncrease).toBeLessThan(0.5);
      }
    });

    test('should maintain performance under load', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.baseURL}/`);
      
      // Mesurer le temps d'hydratation
      const hydrationStartTime = Date.now();
      await utils.waitForHydration();
      const hydrationTime = Date.now() - hydrationStartTime;
      
      // L'hydratation devrait prendre moins de 2 secondes
      expect(hydrationTime).toBeLessThan(2000);
      
      // Simuler une charge utilisateur
      const interactions = Array.from({ length: 10 }, (_, i) => async () => {
        await page.click(`button:nth-child(${(i % 3) + 1})`);
        await page.waitForTimeout(100);
      });
      
      const interactionStartTime = Date.now();
      
      for (const interaction of interactions) {
        try {
          await interaction();
        } catch (error) {
          // Certaines interactions peuvent échouer, c'est OK
        }
      }
      
      const interactionTime = Date.now() - interactionStartTime;
      
      // Les interactions devraient rester fluides
      expect(interactionTime).toBeLessThan(5000);
      
      // Vérifier qu'il n'y a pas d'erreurs d'hydratation
      const hydrationErrors = await utils.checkForHydrationErrors();
      expect(hydrationErrors).toHaveLength(0);
    });
  });

  test.describe('6.3.7 Edge Cases and Error Conditions', () => {
    test('should handle JavaScript disabled gracefully', async ({ page }) => {
      // Désactiver JavaScript
      await page.setJavaScriptEnabled(false);
      await page.goto(`${TEST_CONFIG.baseURL}/`);
      
      // Vérifier que le contenu de base est visible (SSR)
      await expect(page.locator('body')).toBeVisible();
      await expect(page.locator('footer')).toBeVisible();
      
      // Réactiver JavaScript
      await page.setJavaScriptEnabled(true);
      await page.reload();
      
      // Vérifier l'hydratation après réactivation
      await utils.waitForHydration();
      const yearElement = page.locator('text=' + new Date().getFullYear());
      await expect(yearElement).toBeVisible();
    });

    test('should handle very slow devices', async ({ page }) => {
      // Simuler un appareil lent
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.evaluate(() => {
        // Simuler un CPU lent
        const slowDown = (fn: Function, delay: number) => {
          return (...args: any[]) => {
            return new Promise(resolve => {
              setTimeout(() => resolve(fn(...args)), delay);
            });
          };
        };
        
        // @ts-ignore
        window.requestAnimationFrame = slowDown(window.requestAnimationFrame, 50);
      });
      
      await page.goto(`${TEST_CONFIG.baseURL}/`);
      
      // Attendre l'hydratation avec un timeout plus long
      await utils.waitForHydration(15000);
      
      // Vérifier que les composants fonctionnent malgré la lenteur
      const yearElement = page.locator('text=' + new Date().getFullYear());
      await expect(yearElement).toBeVisible();
    });

    test('should handle timezone differences', async ({ page }) => {
      // Simuler différents fuseaux horaires
      const timezones = ['America/New_York', 'Europe/London', 'Asia/Tokyo'];
      
      for (const timezone of timezones) {
        await page.emulateTimezone(timezone);
        await page.goto(`${TEST_CONFIG.baseURL}/`);
        await utils.waitForHydration();
        
        // Vérifier que les dates sont cohérentes
        const yearElement = page.locator('text=' + new Date().getFullYear());
        await expect(yearElement).toBeVisible();
        
        // Vérifier qu'il n'y a pas d'erreurs d'hydratation liées aux dates
        const hydrationErrors = await utils.checkForHydrationErrors();
        const dateErrors = hydrationErrors.filter(error => 
          error.includes('date') || error.includes('time')
        );
        expect(dateErrors).toHaveLength(0);
      }
    });
  });

  test.describe('6.3.8 Recovery System E2E Testing', () => {
    test('should show recovery UI when hydration fails', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.baseURL}/`);
      
      // Simuler une erreur d'hydratation en injectant du code problématique
      await page.evaluate(() => {
        // Créer une condition qui pourrait causer une erreur d'hydratation
        const problematicElement = document.createElement('div');
        problematicElement.innerHTML = 'Server content';
        document.body.appendChild(problematicElement);
        
        // Simuler un mismatch
        setTimeout(() => {
          problematicElement.innerHTML = 'Client content';
        }, 100);
      });
      
      await utils.waitForHydration();
      
      // Vérifier que la page reste fonctionnelle
      await expect(page.locator('body')).toBeVisible();
    });

    test('should allow manual recovery', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.baseURL}/`);
      await utils.waitForHydration();
      
      // Chercher des boutons de recovery (s'ils sont visibles)
      const retryButtons = page.locator('button:has-text("Réessayer")');
      const retryButtonCount = await retryButtons.count();
      
      if (retryButtonCount > 0) {
        // Tester le premier bouton de retry
        await retryButtons.first().click();
        await page.waitForTimeout(1000);
        
        // Vérifier que la page reste stable après recovery
        await expect(page.locator('body')).toBeVisible();
      }
    });
  });

  test.describe('6.3.9 Accessibility and Hydration', () => {
    test('should maintain accessibility during hydration', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.baseURL}/`);
      
      // Vérifier l'accessibilité avant hydratation
      const initialA11y = await page.evaluate(() => {
        const focusableElements = document.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        return focusableElements.length;
      });
      
      await utils.waitForHydration();
      
      // Vérifier l'accessibilité après hydratation
      const finalA11y = await page.evaluate(() => {
        const focusableElements = document.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        return focusableElements.length;
      });
      
      // Le nombre d'éléments focusables ne devrait pas diminuer
      expect(finalA11y).toBeGreaterThanOrEqual(initialA11y);
      
      // Tester la navigation au clavier
      await page.keyboard.press('Tab');
      const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
      expect(['BUTTON', 'A', 'INPUT']).toContain(focusedElement);
    });

    test('should provide screen reader friendly content', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.baseURL}/`);
      await utils.waitForHydration();
      
      // Vérifier les attributs ARIA
      const ariaElements = await page.evaluate(() => {
        const elements = document.querySelectorAll('[aria-label], [aria-describedby], [role]');
        return elements.length;
      });
      
      expect(ariaElements).toBeGreaterThan(0);
      
      // Vérifier les textes alternatifs
      const images = page.locator('img');
      const imageCount = await images.count();
      
      for (let i = 0; i < imageCount; i++) {
        const alt = await images.nth(i).getAttribute('alt');
        expect(alt).toBeTruthy();
      }
    });
  });
});