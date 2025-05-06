import { loadStripe, Stripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { Stripe as ServerStripe } from 'stripe';

// Load Stripe on the client side
let stripePromise: Promise<Stripe | null>;
export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
  }
  return stripePromise;
};

// Initialize Stripe on the server side
let stripe: ServerStripe | null = null;
export const getServerStripe = () => {
  if (!stripe && process.env.STRIPE_SECRET_KEY) {
    stripe = new ServerStripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-04-30.basil',
    });
  }
  return stripe;
};

// Helper function to create a payment intent
export async function createPaymentIntent(amount: number, metadata: Record<string, any> = {}) {
  const stripe = getServerStripe();
  if (!stripe) throw new Error('Stripe not initialized');

  const paymentIntent = await stripe.paymentIntents.create({
    amount,
    currency: 'usd',
    metadata,
    automatic_payment_methods: {
      enabled: true,
    },
  });

  return paymentIntent;
}

// Helper function to retrieve a payment intent
export async function retrievePaymentIntent(paymentIntentId: string) {
  const stripe = getServerStripe();
  if (!stripe) throw new Error('Stripe not initialized');

  return await stripe.paymentIntents.retrieve(paymentIntentId);
}

// Helper function to update a payment intent
export async function updatePaymentIntent(
  paymentIntentId: string, 
  updateData: Partial<ServerStripe.PaymentIntentUpdateParams>
) {
  const stripe = getServerStripe();
  if (!stripe) throw new Error('Stripe not initialized');

  return await stripe.paymentIntents.update(
    paymentIntentId,
    updateData
  );
}

// Helper function to handle Stripe webhook event
export async function handleWebhookEvent(
  signature: string,
  payload: Buffer
): Promise<ServerStripe.Event> {
  const stripe = getServerStripe();
  if (!stripe) throw new Error('Stripe not initialized');

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) throw new Error('Stripe webhook secret not found');

  return stripe.webhooks.constructEvent(
    payload,
    signature,
    webhookSecret
  );
}
