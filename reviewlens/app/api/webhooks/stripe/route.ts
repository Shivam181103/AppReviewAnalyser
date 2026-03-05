import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabase';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      
      await supabaseAdmin
        .from('users')
        .update({
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: session.subscription as string,
          subscription_status: 'active',
        })
        .eq('clerk_id', session.metadata?.clerk_id);
      break;
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      
      const plan = subscription.items.data[0].price.id === process.env.STRIPE_PRICE_ID_STARTER
        ? 'starter'
        : subscription.items.data[0].price.id === process.env.STRIPE_PRICE_ID_PRO
        ? 'pro'
        : subscription.items.data[0].price.id === process.env.STRIPE_PRICE_ID_AGENCY
        ? 'agency'
        : 'free';

      await supabaseAdmin
        .from('users')
        .update({
          plan,
          subscription_status: subscription.status,
        })
        .eq('stripe_customer_id', subscription.customer as string);
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      
      await supabaseAdmin
        .from('users')
        .update({
          plan: 'free',
          subscription_status: 'canceled',
          stripe_subscription_id: null,
        })
        .eq('stripe_customer_id', subscription.customer as string);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
