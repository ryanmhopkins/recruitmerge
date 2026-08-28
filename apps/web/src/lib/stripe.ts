import 'server-only';
import Stripe from 'stripe';

let stripeClient: Stripe | null = null;

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('Stripe is not configured');
  stripeClient ??= new Stripe(key, {
    apiVersion: '2026-07-29.dahlia',
    typescript: true,
  });
  return stripeClient;
}

export function getAppUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || 'https://recruitmerge.vercel.app').replace(/\/$/, '');
}
