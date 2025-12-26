// 🛡️ STEALTH MODE - OF Scraper Worker
const express = require('express');
const { chromium } = require('playwright-extra');
const stealthPlugin = require('puppeteer-extra-plugin-stealth');

// Active le mode furtif (masque navigator.webdriver, etc.)
chromium.use(stealthPlugin());

const app = express();
app.use(express.json({ limit: '10mb' }));

console.log('🚀 Starting OF Scraper Worker (STEALTH MODE)...');
console.log(`   Node version: ${process.version}`);
console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);

// Liste de User-Agents récents (rotation)
const USER_AGENTS = [
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1",
    "Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
];

function getRandomUserAgent() {
    return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

// Health check pour AWS App Runner
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        mode: 'stealth',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({ 
        service: 'OF Scraper Worker',
        version: '2.0.0-stealth',
        endpoints: ['/health', '/scrape']
    });
});

// Endpoint de scraping STEALTH
app.post('/scrape', async (req, res) => {
    const { cookies, userAgent, endpoint, proxyUrl } = req.body;

    if (!cookies || !endpoint) {
        return res.status(400).json({ 
            success: false,
            error: 'Missing parameters: cookies and endpoint required' 
        });
    }

    console.log(`📡 Scrape request: ${endpoint}`);
    const startTime = Date.now();

    let browser = null;
    try {
        // 🛡️ Configuration STEALTH du navigateur
        const launchOptions = { 
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--disable-blink-features=AutomationControlled', // 🛡️ Masque le bot
                '--single-process'
            ]
        };
        
        if (proxyUrl) {
            launchOptions.proxy = { server: proxyUrl };
        }

        console.log('   Launching stealth browser...');
        browser = await chromium.launch(launchOptions);
        
        // 🛡️ Contexte mobile avec User-Agent rotatif
        const selectedUA = userAgent || getRandomUserAgent();
        const context = await browser.newContext({
            userAgent: selectedUA,
            viewport: { width: 390, height: 844 },
            deviceScaleFactor: 3,
            isMobile: true,
            hasTouch: true,
            locale: 'en-US',
            timezoneId: 'America/New_York'
        });

        // Parser et ajouter les cookies
        const cookieList = cookies.split(';').map(c => {
            const [name, ...valueParts] = c.trim().split('=');
            return { 
                name: name.trim(), 
                value: valueParts.join('=') || '', 
                domain: '.onlyfans.com', 
                path: '/' 
            };
        }).filter(c => c.name);
        
        await context.addCookies(cookieList);
        console.log(`   Added ${cookieList.length} cookies (UA: ${selectedUA.substring(0, 30)}...)`);

        const page = await context.newPage();
        
        // 🛡️ Charger OnlyFans pour initialiser le contexte JS (signatures, etc.)
        console.log('   Loading OnlyFans context...');
        await page.goto('https://onlyfans.com', { 
            waitUntil: 'domcontentloaded', 
            timeout: 30000 
        });

        // 🛡️ L'ASTUCE MAGIQUE : page.evaluate()
        // Le fetch s'exécute DANS le navigateur, avec les signatures OF natives
        console.log(`   Fetching API (in-context): ${endpoint}`);
        const data = await page.evaluate(async ({ url }) => {
            // Cette fonction s'exécute dans le contexte du navigateur
            // Les headers de signature sont ajoutés automatiquement par OF
            const resp = await fetch(url, {
                headers: { 
                    'Accept': 'application/json, text/plain, */*'
                    // 🛡️ PAS de App-Token hardcodé - le navigateur gère
                }
            });
            if (!resp.ok) {
                throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
            }
            return resp.json();
        }, { url: `https://onlyfans.com${endpoint}` });

        await browser.close();
        
        const duration = Date.now() - startTime;
        console.log(`✅ Success (stealth): ${endpoint} (${duration}ms)`);
        
        res.json({ success: true, data, duration, mode: 'stealth' });

    } catch (error) {
        const duration = Date.now() - startTime;
        console.error(`❌ Error: ${error.message} (${duration}ms)`);
        
        if (browser) {
            try { await browser.close(); } catch (e) {}
        }
        
        res.status(500).json({ 
            success: false, 
            error: error.message,
            duration 
        });
    }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ OF Worker (STEALTH) listening on 0.0.0.0:${PORT}`);
});
