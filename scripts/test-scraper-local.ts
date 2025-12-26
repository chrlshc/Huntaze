#!/usr/bin/env npx ts-node
/**
 * Test local du scraper OnlyFans avec ton IP
 * 
 * Usage:
 *   npx ts-node scripts/test-scraper-local.ts
 * 
 * Ou avec proxy:
 *   PROXY_SERVER=http://proxy:port npx ts-node scripts/test-scraper-local.ts
 */

import { chromium } from 'playwright';
import type { BrowserContext, Page } from 'playwright';

// ============================================================================
// CONFIG - Modifie ces valeurs
// ============================================================================
const CONFIG = {
  // Mode headless (false = voir le navigateur)
  headless: false,
  
  // Proxy (optionnel) - laisse vide pour utiliser ton IP directe
  proxy: process.env.PROXY_SERVER || '',
  proxyUser: process.env.PROXY_USER || '',
  proxyPass: process.env.PROXY_PASS || '',
  
  // Timeout en ms
  timeout: 60000,
};

// Target API endpoints
const TARGET_URLS = [
  '/api2/v2/payouts/stats',
  '/api2/v2/users/me/stats',
  '/api2/v2/earnings/chart',
  '/api2/v2/payouts/summary',
  '/api2/v2/users/me',
  '/api2/v2/subscriptions/count',
];

interface CapturedData {
  url: string;
  data: any;
  timestamp: string;
}

async function testScraper() {
  console.log('🚀 Démarrage du test scraper OnlyFans...\n');
  console.log(`📍 Mode: ${CONFIG.headless ? 'Headless' : 'Visible (tu verras le navigateur)'}`);
  console.log(`🌐 Proxy: ${CONFIG.proxy || 'Aucun (ton IP directe)'}\n`);

  const launchOpts: any = {
    headless: CONFIG.headless,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  };

  if (CONFIG.proxy) {
    launchOpts.proxy = {
      server: CONFIG.proxy,
      ...(CONFIG.proxyUser && CONFIG.proxyPass 
        ? { username: CONFIG.proxyUser, password: CONFIG.proxyPass } 
        : {}),
    };
  }

  const browser = await chromium.launch(launchOpts);
  const context = await browser.newContext({
    locale: 'en-US',
    timezoneId: 'America/New_York',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
    viewport: { width: 1366, height: 768 },
  });

  const page = await context.newPage();
  const capturedData: CapturedData[] = [];

  // Intercepter les réponses API
  page.on('response', async (response) => {
    const url = response.url();
    
    for (const targetUrl of TARGET_URLS) {
      if (url.includes(targetUrl) && response.status() === 200) {
        try {
          const data = await response.json();
          capturedData.push({
            url: targetUrl,
            data,
            timestamp: new Date().toISOString(),
          });
          console.log(`✅ Capturé: ${targetUrl}`);
        } catch (e) {
          console.log(`⚠️  Échec parsing JSON: ${targetUrl}`);
        }
        break;
      }
    }
  });

  try {
    // Étape 1: Aller sur la page d'accueil OnlyFans (pas /login directement)
    console.log('\n📱 Navigation vers OnlyFans...');
    await page.goto('https://onlyfans.com', { 
      waitUntil: 'domcontentloaded',
      timeout: CONFIG.timeout 
    });

    // Étape 2: Attendre que l'utilisateur se connecte manuellement
    console.log('\n⏳ CONNECTE-TOI MANUELLEMENT dans le navigateur...');
    console.log('   Clique sur "Log in" et connecte-toi.');
    console.log('   (Le script attend que tu sois sur /my/... ou /home)\n');

    // Attendre que l'URL change vers une page authentifiée
    await page.waitForURL((url) => {
      const path = new URL(url).pathname;
      return path.startsWith('/my/') || path === '/home';
    }, { timeout: 300000 }); // 5 minutes pour se connecter

    console.log('✅ Connexion détectée!\n');

    // Étape 3: Aller sur la page des stats financières
    console.log('📊 Navigation vers les stats financières...');
    await page.goto('https://onlyfans.com/my/statements/earnings-stats', {
      waitUntil: 'domcontentloaded',
      timeout: CONFIG.timeout,
    });

    // Attendre que les API répondent
    console.log('⏳ Attente des réponses API (10s)...');
    await page.waitForTimeout(10000);

    // Étape 4: Aller sur la page des statistiques
    console.log('📈 Navigation vers les statistiques...');
    await page.goto('https://onlyfans.com/my/statistics', {
      waitUntil: 'domcontentloaded',
      timeout: CONFIG.timeout,
    });
    await page.waitForTimeout(5000);

    // Étape 5: Afficher les résultats
    console.log('\n' + '='.repeat(60));
    console.log('📋 RÉSULTATS DU SCRAPING');
    console.log('='.repeat(60) + '\n');

    if (capturedData.length === 0) {
      console.log('❌ Aucune donnée capturée. Possible causes:');
      console.log('   - Session invalide');
      console.log('   - OnlyFans a changé ses endpoints');
      console.log('   - Problème de timing');
    } else {
      console.log(`✅ ${capturedData.length} endpoint(s) capturé(s):\n`);
      
      for (const item of capturedData) {
        console.log(`📍 ${item.url}`);
        console.log(JSON.stringify(item.data, null, 2).slice(0, 500));
        if (JSON.stringify(item.data).length > 500) {
          console.log('   ... (tronqué)');
        }
        console.log('');
      }
    }

    // Sauvegarder les données
    const outputPath = `/tmp/scraper-test-${Date.now()}.json`;
    const fs = await import('fs/promises');
    await fs.writeFile(outputPath, JSON.stringify(capturedData, null, 2));
    console.log(`💾 Données sauvegardées: ${outputPath}`);

  } catch (error: any) {
    console.error('\n❌ Erreur:', error.message);
  } finally {
    // Garder le navigateur ouvert pour debug
    console.log('\n🔍 Navigateur ouvert pour inspection. Ctrl+C pour fermer.');
    
    // Attendre 60s avant de fermer
    await new Promise(resolve => setTimeout(resolve, 60000));
    
    await browser.close();
  }
}

// Run
testScraper().catch(console.error);
