import { NextResponse } from 'next/server';

// Simple unit economics calculator with env-backed defaults
const stripeCardPct = Number(process.env.STRIPE_CARD_PCT || 0.029);
const stripeCardFixed = Number(process.env.STRIPE_CARD_FIXED || 0.30);
const connectOverhead = Number(process.env.STRIPE_CONNECT_OVERHEAD_PCT || 0.005);

const feePct = {
  starter: Number(process.env.STRIPE_FEE_PCT_STARTER || 9) / 100,
  pro: Number(process.env.STRIPE_FEE_PCT_PRO || 7) / 100,
  scale: Number(process.env.STRIPE_FEE_PCT_SCALE || 5) / 100,
};

const price = { starter: 19, pro: 49, scale: 99 };

// Azure costs per 1k tokens
const inPer1k = Number(process.env.AZURE_COST_IN_PER1K || 0.005);
const outPer1k = Number(process.env.AZURE_COST_OUT_PER1K || 0.015);

// AI usage defaults (per plan)
const usage = {
  starter: { msgsPerDay: Number(process.env.PLAN_DEFAULT_MSGS_STARTER || 40), inTok: 300, outTok: 300, awsOverhead: Number(process.env.AWS_OVERHEAD_STARTER || 2) },
  pro:     { msgsPerDay: Number(process.env.PLAN_DEFAULT_MSGS_PRO || 120), inTok: 300, outTok: 300, awsOverhead: Number(process.env.AWS_OVERHEAD_PRO || 5) },
  scale:   { msgsPerDay: Number(process.env.PLAN_DEFAULT_MSGS_SCALE || 250), inTok: 300, outTok: 300, awsOverhead: Number(process.env.AWS_OVERHEAD_SCALE || 15) },
};

function calc(plan: 'starter'|'pro'|'scale', avgGMV: number) {
  const p = price[plan];
  const u = usage[plan];
  const days = 30;
  const inTokens  = u.msgsPerDay * days * u.inTok;
  const outTokens = u.msgsPerDay * days * u.outTok;
  const aiCost = (inTokens/1000)*inPer1k + (outTokens/1000)*outPer1k;
  const netSaaS = p - (stripeCardPct*p + stripeCardFixed);
  const commissionNet = (feePct[plan] - connectOverhead) * avgGMV;
  const margin = netSaaS + commissionNet - (aiCost + u.awsOverhead);
  return { aiCost:+aiCost.toFixed(2), netSaaS:+netSaaS.toFixed(2), commissionNet:+commissionNet.toFixed(2), margin:+margin.toFixed(2) };
}

export const runtime = 'nodejs';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const gmvStarter = Number(url.searchParams.get('gmv_starter') || 500);
  const gmvPro = Number(url.searchParams.get('gmv_pro') || 2000);
  const gmvScale = Number(url.searchParams.get('gmv_scale') || 10000);
  return NextResponse.json({
    inputs: { stripeCardPct, stripeCardFixed, connectOverhead, feePct, price, inPer1k, outPer1k, usage },
    results: {
      starter: calc('starter', gmvStarter),
      pro: calc('pro', gmvPro),
      scale: calc('scale', gmvScale),
    },
  });
}

