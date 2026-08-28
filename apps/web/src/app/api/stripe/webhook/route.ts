import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { createAdminClient } from '@/lib/billing-server';
import { getStripe } from '@/lib/stripe';

export const runtime = 'nodejs';

async function syncSubscription(subscription: Stripe.Subscription) {
  const userId = subscription.metadata.supabase_user_id;
  const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id;
  if (!userId) throw new Error('Subscription is missing its RecruitMerge user id');
  const item = subscription.items.data[0];
  const currentPeriodEnd = item?.current_period_end;
  const { error } = await createAdminClient().from('billing_accounts').upsert({
    user_id: userId,
    stripe_customer_id: customerId,
    stripe_subscription_id: subscription.id,
    stripe_price_id: item?.price.id ?? null,
    subscription_status: subscription.status,
    current_period_end: currentPeriodEnd ? new Date(currentPeriodEnd * 1000).toISOString() : null,
    cancel_at_period_end: subscription.cancel_at_period_end,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' });
  if (error) throw error;
}

export async function POST(request: Request) {
  const signature = request.headers.get('stripe-signature');
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !secret) return NextResponse.json({ error: 'Webhook is not configured.' }, { status: 503 });

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(await request.text(), signature, secret);
  } catch {
    return NextResponse.json({ error: 'Invalid signature.' }, { status: 400 });
  }

  try {
    if (event.type === 'customer.subscription.created' || event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
      await syncSubscription(event.data.object);
    } else if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      if (typeof session.subscription === 'string') await syncSubscription(await getStripe().subscriptions.retrieve(session.subscription));
    }
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Unable to process Stripe webhook', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ error: 'Webhook processing failed.' }, { status: 500 });
  }
}
