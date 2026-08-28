import { spawnSync } from 'node:child_process';
import Stripe from 'stripe';

const secretKey = process.env.STRIPE_SECRET_KEY;
if (!secretKey) throw new Error('STRIPE_SECRET_KEY is unavailable');

const stripe = new Stripe(secretKey, { apiVersion: '2026-07-29.dahlia' });
const appUrl = 'https://recruitmerge.vercel.app';

function setVercelEnv(name, value, { sensitive = false } = {}) {
  const args = ['vercel', 'env', 'add', name, 'production,preview', '--force', '--yes', sensitive ? '--sensitive' : '--no-sensitive'];
  const result = spawnSync('npx', args, { input: `${value}\n`, encoding: 'utf8' });
  if (result.status !== 0) throw new Error(`Unable to configure ${name}: ${result.stderr || result.stdout}`);
}

const products = await stripe.products.list({ active: true, limit: 100 });
let product = products.data.find((item) => item.metadata.app === 'recruitmerge' && item.metadata.tier === 'pro');
if (!product) {
  product = await stripe.products.create({
    name: 'RecruitMerge Pro',
    description: 'Unlimited candidate workspace, CSV export, and all future RecruitMerge Pro tools.',
    metadata: { app: 'recruitmerge', tier: 'pro' },
  });
}

const prices = await stripe.prices.list({ product: product.id, active: true, limit: 100 });
let price = prices.data.find((item) => item.currency === 'usd' && item.unit_amount === 1500 && item.recurring?.interval === 'month');
if (!price) {
  price = await stripe.prices.create({
    product: product.id,
    currency: 'usd',
    unit_amount: 1500,
    recurring: { interval: 'month' },
    nickname: 'RecruitMerge Pro Monthly',
  });
}

const webhookUrl = `${appUrl}/api/stripe/webhook`;
const endpoints = await stripe.webhookEndpoints.list({ limit: 100 });
let endpoint = endpoints.data.find((item) => item.url === webhookUrl && item.status === 'enabled');
if (!endpoint) {
  endpoint = await stripe.webhookEndpoints.create({
    url: webhookUrl,
    description: 'RecruitMerge subscription status sync',
    enabled_events: [
      'checkout.session.completed',
      'customer.subscription.created',
      'customer.subscription.updated',
      'customer.subscription.deleted',
    ],
    metadata: { app: 'recruitmerge' },
  });
  if (!endpoint.secret) throw new Error('Stripe did not return the new webhook signing secret');
  setVercelEnv('STRIPE_WEBHOOK_SECRET', endpoint.secret, { sensitive: true });
}

setVercelEnv('STRIPE_PRO_PRICE_ID', price.id);
setVercelEnv('NEXT_PUBLIC_APP_URL', appUrl);

console.log(JSON.stringify({
  product: product.name,
  price: '$15/month',
  webhook: webhookUrl,
  webhookStatus: endpoint.status,
}));
