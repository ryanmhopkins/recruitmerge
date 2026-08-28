import { NextResponse } from 'next/server';
import { createAdminClient, requireUser } from '@/lib/billing-server';
import { getAppUrl, getStripe } from '@/lib/stripe';

export async function POST(request: Request) {
  try {
    const user = await requireUser(request);
    if (!user) return NextResponse.json({ error: 'Sign in to manage billing.' }, { status: 401 });
    const admin = createAdminClient();
    const { data: billing } = await admin.from('billing_accounts').select('stripe_customer_id').eq('user_id', user.id).maybeSingle();
    if (!billing?.stripe_customer_id) return NextResponse.json({ error: 'No billing account found.' }, { status: 404 });
    const session = await getStripe().billingPortal.sessions.create({
      customer: billing.stripe_customer_id,
      return_url: `${getAppUrl()}/dashboard`,
    });
    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Unable to create billing portal session', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ error: 'Unable to open billing right now.' }, { status: 500 });
  }
}
