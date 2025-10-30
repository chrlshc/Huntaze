/**
 * OnlyFans Load Testing with k6
 * 
 * Run with: k6 run tests/load/onlyfans-campaign.load.test.js
 * 
 * Environment Variables:
 * - API_BASE: Base URL for API (default: https://huntaze.com/api)
 * - TEST_TOKEN: Authentication token for API calls
 * - LOAD_PROFILE: light|medium|heavy (default: medium)
 * 
 * Scenarios:
 * 1. campaign-create: 100 → 500 creators
 * 2. message-rate: 1,000 messages/min constant
 * 3. fan-browse: 10,000 fans loaded
 * 4. spike: 10x traffic spike
 * 5. browser-worker: ECS Fargate task execution
 */

import http from 'k6/http';
import { check, sleep } from 'k6';

const LOAD_PROFILES = {
    light: { campaignTarget: 100, messageRate: 500, fanVUs: 25, spikeTarget: 250 },
    medium: { campaignTarget: 500, messageRate: 1000, fanVUs: 50, spikeTarget: 500 },
    heavy: { campaignTarget: 1000, messageRate: 2000, fanVUs: 100, spikeTarget: 1000 }
};

const profile = LOAD_PROFILES[__ENV.LOAD_PROFILE || 'medium'];

export const options = {
    discardResponseBodies: true,
    thresholds: {
        http_req_duration: ['p(95)<500', 'p(99)<900'],
        http_req_failed: ['rate<0.01'],
        'http_req_duration{scenario:message-rate}': ['p(95)<400'],
        'http_req_duration{scenario:browser-worker}': ['p(95)<30000', 'p(99)<60000'],
        'browser_task_success_rate': ['rate>0.95'],
    },
    scenarios: {
        'campaign-create': {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [
                { duration: '2m', target: Math.floor(profile.campaignTarget * 0.2) },
                { duration: '5m', target: Math.floor(profile.campaignTarget * 0.2) },
                { duration: '2m', target: profile.campaignTarget },
                { duration: '5m', target: profile.campaignTarget },
                { duration: '2m', target: 0 },
            ],
            exec: 'createCampaign',
            tags: { scenario: 'campaign-create' },
        },
        'message-rate': {
            executor: 'constant-arrival-rate',
            rate: profile.messageRate,
            timeUnit: '1m',
            duration: '10m',
            preAllocatedVUs: Math.floor(profile.messageRate / 10),
            maxVUs: Math.floor(profile.messageRate * 0.6),
            exec: 'sendMessage',
            tags: { scenario: 'message-rate' },
        },
        'fan-browse': {
            executor: 'per-vu-iterations',
            vus: profile.fanVUs,
            iterations: 200,
            exec: 'listFans',
            maxDuration: '10m',
            tags: { scenario: 'fan-browse' },
        },
        'spike': {
            executor: 'ramping-arrival-rate',
            startRate: 0,
            timeUnit: '1s',
            preAllocatedVUs: Math.floor(profile.spikeTarget * 0.1),
            maxVUs: profile.spikeTarget * 2,
            stages: [
                { duration: '1m', target: Math.floor(profile.spikeTarget * 0.1) },
                { duration: '2m', target: profile.spikeTarget }, // spike
                { duration: '2m', target: Math.floor(profile.spikeTarget * 0.1) },
            ],
            exec: 'healthPing',
            tags: { scenario: 'spike' },
        },
        'browser-worker': {
            executor: 'constant-vus',
            vus: 5,
            duration: '5m',
            exec: 'testBrowserWorker',
            tags: { scenario: 'browser-worker' },
        },
    },
};

const BASE = __ENV.API_BASE ?? 'https://huntaze.com/api';
const TOKEN = __ENV.TEST_TOKEN;

function headers() {
    return {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${TOKEN}`,
        },
    };
}

export function createCampaign() {
    const payload = JSON.stringify({
        name: 'Load Test Campaign',
        audience: ['active_subscribers'],
        content: 'Test message'
    });
    const res = http.post(`${BASE}/onlyfans/campaigns`, payload, headers());
    check(res, {
        '201 created': r => r.status === 201,
        'resp < 500ms': r => r.timings.duration < 500,
    });
    sleep(0.1);
}

export function sendMessage() {
    const payload = JSON.stringify({
        userId: `u_${Math.ceil(Math.random() * 10000)}`,
        content: 'hello'
    });
    const res = http.post(`${BASE}/onlyfans/messages`, payload, headers());
    check(res, { '200|201': r => r.status === 200 || r.status === 201 });
}

export function listFans() {
    const res = http.get(`${BASE}/fans?limit=100&cursor=`, headers());
    check(res, { '200 ok': r => r.status === 200 });
}

export function healthPing() {
    const res = http.get(`${BASE}/health`, headers());
    check(res, { '200 ok': r => r.status === 200 });
}

export function testBrowserWorker() {
    const payload = JSON.stringify({
        action: 'send',
        userId: `load_test_user_${Math.ceil(Math.random() * 100)}`,
        data: {
            content: `Load test message ${Date.now()}`,
            conversationId: `conv_${Math.ceil(Math.random() * 1000)}`
        }
    });
    
    const res = http.post(`${BASE}/onlyfans/browser-worker`, payload, {
        ...headers(),
        timeout: '60s' // Browser tasks can take longer
    });
    
    const success = check(res, {
        'browser task accepted': r => r.status === 200 || r.status === 202,
        'response time < 30s': r => r.timings.duration < 30000,
        'no server errors': r => r.status < 500,
    });
    
    // Custom metric for browser task success rate
    if (success) {
        __VU.metrics.browser_task_success_rate.add(1);
    } else {
        __VU.metrics.browser_task_success_rate.add(0);
    }
    
    sleep(Math.random() * 2 + 1); // 1-3 second delay between tasks
}
