/**
 * 🛡️ OF Scraper Worker - BullMQ + Stealth Mode
 * 
 * Ce worker tourne sur AWS App Runner et traite les jobs de scraping
 * en arrière-plan avec Playwright Stealth.
 */

const { Worker } = require('bullmq');
const { chromium } = require('playwright-extra');
const stealthPlugin = require('puppeteer-extra-plugin-stealth');
const IORedis = require('ioredis');

// Active le mode furtif
chromium.use(stealthPlugin());

console.log('🚀 Starting OF Scraper Worker (BullMQ + Stealth)...');
console.log(`   Node version: ${process.version}`);
console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);

// User-Agents récents (rotation)
const USER_AGENTS = [
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1",
    "Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
];

function getRandomUserAgent() {
    return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

// Redis connection
const redisUrl = process.env.REDIS_URL;
if (!redisUrl) {
    console.error('❌ REDIS_URL is required');
    process.exit(1);
}

const connection = new IORedis(redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
});

connection.on('connect', () => console.log('✅ Redis connected'));
connection.on('error', (err) => console.error('❌ Redis error:', err.message));

/**
 * Scrape OnlyFans avec Playwright Stealth
 */
async function scrapeWithStealth(jobData, updateProgress) {
    const { cookies, userAgent, endpoint, proxyUrl, metadata } = jobData;
    const startTime = Date.now();

    let browser = null;
    try {
        await updateProgress(10);

        // 🛡️ Configuration STEALTH
        const launchOptions = { 
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--disable-blink-features=AutomationControlled',
                '--single-process'
            ]
        };
        
        if (proxyUrl) {
            launchOptions.proxy = { server: proxyUrl };
        }

        console.log('   Launching stealth browser...');
        browser = await chromium.launch(launchOptions);
        await updateProgress(30);
        
        // Contexte mobile réaliste
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
        await updateProgress(50);

        const page = await context.newPage();
        
        // Charger OF pour initialiser le contexte JS
        console.log('   Loading OnlyFans context...');
        await page.goto('https://onlyfans.com', { 
            waitUntil: 'domcontentloaded', 
            timeout: 30000 
        });
        await updateProgress(70);

        // Check if this is a send-message job
        const isSendMessage = metadata?.type === 'send-message';
        
        let data;
        if (isSendMessage && metadata?.messagePayload) {
            // 📤 POST message via in-page fetch
            console.log(`   Sending message to: ${endpoint}`);
            data = await page.evaluate(async ({ url, payload }) => {
                const resp = await fetch(url, {
                    method: 'POST',
                    headers: { 
                        'Accept': 'application/json, text/plain, */*',
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(payload),
                });
                if (!resp.ok) {
                    throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
                }
                return resp.json();
            }, { url: `https://onlyfans.com${endpoint}`, payload: metadata.messagePayload });
        } else {
            // 📥 GET data via in-page fetch
            console.log(`   Fetching API (in-context): ${endpoint}`);
            data = await page.evaluate(async ({ url }) => {
                const resp = await fetch(url, {
                    headers: { 'Accept': 'application/json, text/plain, */*' }
                });
                if (!resp.ok) {
                    throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
                }
                return resp.json();
            }, { url: `https://onlyfans.com${endpoint}` });
        }

        await browser.close();
        await updateProgress(100);
        
        const duration = Date.now() - startTime;
        console.log(`✅ ${isSendMessage ? 'Send' : 'Scrape'} success: ${endpoint} (${duration}ms)`);
        
        return { success: true, data, duration, mode: 'stealth' };

    } catch (error) {
        const duration = Date.now() - startTime;
        console.error(`❌ Scrape error: ${error.message} (${duration}ms)`);
        
        if (browser) {
            try { await browser.close(); } catch (e) {}
        }
        
        throw error;
    }
}

/**
 * Envoie un webhook de callback si configuré
 */
async function sendCallback(callbackUrl, jobId, result, metadata = {}) {
    if (!callbackUrl) return;
    
    try {
        const secret = process.env.SCRAPER_CALLBACK_SECRET || 'dev-secret';
        await fetch(callbackUrl, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'x-callback-secret': secret,
            },
            body: JSON.stringify({
                jobId,
                ...result,
                metadata,
                timestamp: new Date().toISOString(),
            }),
        });
        console.log(`📤 Callback sent to ${callbackUrl}`);
    } catch (error) {
        console.error(`❌ Callback failed: ${error.message}`);
    }
}

// Créer le Worker BullMQ
const worker = new Worker(
    'of-scraper',
    async (job) => {
        console.log(`\n📥 Processing job: ${job.id} (${job.name})`);
        console.log(`   User: ${job.data.userId}, Endpoint: ${job.data.endpoint}`);

        const updateProgress = async (percent) => {
            await job.updateProgress(percent);
        };

        try {
            const result = await scrapeWithStealth(job.data, updateProgress);
            
            // Callback si configuré (avec metadata)
            if (job.data.callbackUrl) {
                await sendCallback(job.data.callbackUrl, job.id, result, job.data.metadata || {});
            }
            
            return result;
        } catch (error) {
            const errorResult = {
                success: false,
                error: error.message,
            };
            
            // Callback même en cas d'erreur
            if (job.data.callbackUrl) {
                await sendCallback(job.data.callbackUrl, job.id, errorResult, job.data.metadata || {});
            }
            
            throw error;
        }
    },
    {
        connection,
        concurrency: 2, // 2 jobs en parallèle max (limite mémoire)
        limiter: {
            max: 10,
            duration: 60000, // Max 10 jobs par minute (rate limiting)
        },
    }
);

// Event handlers
worker.on('completed', (job, result) => {
    console.log(`✅ Job ${job.id} completed in ${result.duration}ms`);
});

worker.on('failed', (job, error) => {
    console.error(`❌ Job ${job?.id} failed: ${error.message}`);
});

worker.on('error', (error) => {
    console.error('❌ Worker error:', error.message);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('🛑 Shutting down worker...');
    await worker.close();
    await connection.quit();
    process.exit(0);
});

console.log('✅ Worker ready and listening for jobs...');
