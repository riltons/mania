import Stripe from 'stripe';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY')!;
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;
const stripe = new Stripe(stripeSecret, { apiVersion: '2022-11-15' });

serve(async (req) => {
  const payload = await req.text();
  const sig = req.headers.get('stripe-signature')!;
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, sig, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  console.log('⚡️ Stripe Webhook received:', event.type);
  // TODO: tratar eventos, ex:
  // if (event.type === 'invoice.payment_succeeded') { ... }

  return new Response(JSON.stringify({ received: true }), { status: 200 });
});
