import { NextResponse } from 'next/server';
import { createAdminClient, isActiveSubscription, requireUser } from '@/lib/billing-server';
import { getAppUrl, getStripe } from '@/lib/stripe';

function randomLetters(length = 8) {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz';
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join('');
}

export async function POST(request: Request) {
  try {
    const user = await requireUser(request);
    if (!user?.email) return NextResponse.json({ error: 'Sign in to upgrade.' }, { status: 401 });
    const price = process.env.STRIPE_PRO_PRICE_ID;
    if (!price) return NextResponse.json({ error: 'Pro checkout is not available yet.' }, { status: 503 });

    const admin = createAdminClient();
    const stripe = getStripe();
    const { data: billing } = await admin.from('billing_accounts').select('stripe_customer_id,subscription_status').eq('user_id', user.id).maybeSingle();
    if (isActiveSubscription(billing?.subscription_status)) {
      return NextResponse.json({ error: 'Your Pro subscription is already active.' }, { status: 409 });
    }

    let customerId = billing?.stripe_customer_id as string | undefined;
    if (!customerId) {
      const customer = await stripe.customers.create({ email: user.email, metadata: { supabase_user_id: user.id } });
      customerId = customer.id;
      const { error } = await admin.from('billing_accounts').upsert({ user_id: user.id, stripe_customer_id: customerId, email: user.email }, { onConflict: 'user_id' });
      if (error) throw error;
    }

    const appUrl = getAppUrl();
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      client_reference_id: user.id,
      line_items: [{ price, quantity: 1 }],
      allow_promotion_codes: true,
      success_url: `${appUrl}/dashboard?billing=success`,
      cancel_url: `${appUrl}/dashboard?billing=cancelled`,
      subscription_data: { metadata: { supabase_user_id: user.id } },
      metadata: { supabase_user_id: user.id },
      integration_identifier: `recruitmerge_web_${randomLetters()}`,
    });
    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Unable to create checkout session', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ error: 'Unable to start checkout right now.' }, { status: 500 });
  }
}
