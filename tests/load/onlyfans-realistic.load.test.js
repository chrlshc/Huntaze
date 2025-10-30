/**
 * OnlyFans Realistic Load Testing with k6
 * 
 * Based on real OnlyFans limits (2025):
 * - Established accounts: 250 msgs/day, 10 msgs/min
 * - Power accounts: 400 msgs/day, 15 msgs/min
 * - Realistic delays: 2-4 seconds between messages
 * 
 * Run with: k6 run tests/load/onlyfans-realistic.load.test.js
 * 
 * Scenarios:
 * 1. normal_load: 50 creators (typical beta load)
 * 2. launch_spike: 100 creators (launch day)
 * 3. mass_campaign: 30 creators × 200 msgs = 6,000 msgs
 * 4. daily_endurance: 40 creators over 2 hours
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const messagesSent = new Rate('messages_sent_success');
const rateLimitHits = new Rate('rate_limit_hits');
const messageDuration = new Trend('message_send_duration');

export const options = {
    discardResponseBodies: true,
    scenarios: {
        // Scenario 1: Normal load (50 active creators)
        normal_load: {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [
                { duration: '2m', target: 50 },   // Ramp up
                { duration: '10m', target: 50 },  // Plateau
                { duration: '2m', target: 0 }     // Ramp down
            ],
            gracefulRampDown: '30s',
            exec: 'sendRealisticMessage',
            tags: { scenario: 'normal_load' },
        },

        // Scenario 2: Launch spike (100 creators simultaneous)
        launch_spike: {
            executor: 'ramping-vus',
            startTime: '15m',
            startVUs: 50,
            stages: [
                { duration: '30s', target: 100 }, // Fast spike
                { duration: '5m', target: 100 },  // Maintain
                { duration: '1m', target: 50 }    // Return to normal
            ],
            exec: 'sendRealisticMessage',
            tags: { scenario: 'launch_spike' },
        },

        // Scenario 3: Mass campaign (200 msgs/creator)
        mass_campaign: {
            executor: 'per-vu-iterations',
            startTime: '25m',
            vus: 30,
            iterations: 200,  // 30 creators × 200 msgs = 6,000 msgs
            maxDuration: '30m',
            exec: 'sendRealisticMessage',
            tags: { scenario: 'mass_campaign' },
        },

        // Scenario 4: Daily endurance (typical day)
        daily_endurance: {
            executor: 'constant-vus',
            startTime: '60m',
            vus: 40,
            duration: '2h',
            exec: 'sendRealisticMessage',
            tags: { scenario: 'daily_endurance' },
        }
    },

    thresholds: {
        // Performance
        'http_req_duration': ['p(95)<500', 'p(99)<1000'],
        'message_send_duration': ['p(95)<300'],

        // Reliability
        'http_req_failed': ['rate<0.01'],        // <1% errors
        'messages_sent_success': ['rate>0.99'],   // >99% success

        // Rate limiting (adjusted to realistic limits)
        'rate_limit_hits': ['rate<0.05']         // <5% hit rate limit OK
    }
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const API_TOKEN = __ENV.API_TOKEN || 'test-token';

// Account type distribution
function getAccountType() {
    const rand = Math.random();
    if (rand < 0.3) return 'new';          // 30% new
    if (rand < 0.8) return 'established';  // 50% established
    if (rand < 0.95) return 'power';       // 15% power
    return 'vip';                          // 5% VIP
}

// Realistic delays by account type
const DELAYS = {
    new: [3, 6],
    established: [2, 4],
    power: [1.5, 3],
    vip: [1, 2]
};

export function sendRealisticMessage() {
    const accountType = getAccountType();
    const [minDelay, maxDelay] = DELAYS[accountType];

    // Send DM message
    const payload = JSON.stringify({
        recipientId: `fan-${Math.floor(Math.random() * 1000)}`,
        content: `Hey! How are you? 😊`,
        accountType: accountType
    });

    const params = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_TOKEN}`
        }
    };

    const startTime = Date.now();
    const res = http.post(`${BASE_URL}/api/onlyfans/messages`, payload, params);
    const duration = Date.now() - startTime;

    // Metrics
    messageDuration.add(duration);

    const success = check(res, {
        'status is 200': (r) => r.status === 200,
        'response time < 500ms': (r) => r.timings.duration < 500,
        'no rate limit': (r) => r.status !== 429
    });

    messagesSent.add(success);
    rateLimitHits.add(res.status === 429);

    // Handle rate limit
    if (res.status === 429) {
        const retryAfter = res.headers['Retry-After'] || 60;
        console.log(`⚠️  Rate limited, waiting ${retryAfter}s`);
        sleep(retryAfter);
    } else {
        // Realistic random delay
        const delay = minDelay + Math.random() * (maxDelay - minDelay);
        sleep(delay);
    }
}

// Final metrics summary
export function handleSummary(data) {
    const summary = {
        'total_messages': data.metrics.iterations.values.count,
        'success_rate': data.metrics.messages_sent_success.values.rate * 100,
        'rate_limit_hits': data.metrics.rate_limit_hits.values.rate * 100,
        'p95_duration': data.metrics.message_send_duration.values['p(95)'],
        'p99_duration': data.metrics.message_send_duration.values['p(99)']
    };

    console.log('\n📊 RÉSULTATS LOAD TEST');
    console.log('═══════════════════════════════════════');
    console.log(`✉️  Messages envoyés : ${summary.total_messages}`);
    console.log(`✅ Taux de succès : ${summary.success_rate.toFixed(2)}%`);
    console.log(`⚠️  Rate limit hits : ${summary.rate_limit_hits.toFixed(2)}%`);
    console.log(`⚡ P95 latency : ${summary.p95_duration.toFixed(0)}ms`);
    console.log(`⚡ P99 latency : ${summary.p99_duration.toFixed(0)}ms`);
    console.log('═══════════════════════════════════════\n');

    return {
        'stdout': JSON.stringify(summary, null, 2),
        'summary.json': JSON.stringify(data, null, 2)
    };
}
