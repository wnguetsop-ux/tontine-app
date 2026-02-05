import { loadStripe } from '@stripe/stripe-js';
import { doc, updateDoc, addDoc, collection } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Stripe public key (ENV)
 * ⚠️ DOIT être définie sur Vercel
 */
const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLIC_KEY
);

/**
 * STRIPE — PaymentIntent (Vercel Serverless)
 */
export async function payWithStripe(userId, userEmail) {
  try {
    const stripe = await stripePromise;

    // Appel API Vercel (PAS de localhost)
    const res = await fetch('/api/create-payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: 100, // 1€ = 100 centimes
        userId,
        email: userEmail,
      }),
    });

    if (!res.ok) {
      throw new Error('Stripe API error');
    }

    const { clientSecret } = await res.json();

    // Confirmer le paiement (ex: avec CardElement)
    const result = await stripe.confirmCardPayment(clientSecret);

    if (result.error) {
      throw new Error(result.error.message);
    }

    if (result.paymentIntent.status === 'succeeded') {
      await handleSuccessfulPayment(userId, {
        amount: 1,
        currency: 'EUR',
        payment_method: 'stripe',
        payment_provider_id: result.paymentIntent.id,
        status: 'completed',
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Stripe payment error:', error);
    throw error;
  }
}

/**
 * ACTIVER PRO APRÈS PAIEMENT
 */
export async function handleSuccessfulPayment(userId, paymentData) {
  const now = new Date();
  const expiryDate = new Date(
    now.getTime() + 30 * 24 * 60 * 60 * 1000
  );

  // User
  await updateDoc(doc(db, 'users', userId), {
    subscription_status: 'pro',
    subscription_expires_at: expiryDate.toISOString(),
    updated_at: now.toISOString(),
  });

  // Payment history
  await addDoc(collection(db, 'payments'), {
    userId,
    ...paymentData,
    subscription_period_start: now.toISOString(),
    subscription_period_end: expiryDate.toISOString(),
    created_at: now.toISOString(),
  });

  return { success: true, expiryDate };
}
