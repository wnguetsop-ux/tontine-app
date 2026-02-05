// src/services/payment.js

import { loadStripe } from '@stripe/stripe-js';
import { doc, updateDoc, addDoc, collection } from 'firebase/firestore';
import { db } from './firebase';

// ⚠️ REMPLACER PAR VOTRE CLÉ PUBLIQUE STRIPE
const stripePromise = loadStripe('pk_test_VOTRE_CLE_PUBLIQUE_STRIPE');

// Configuration
const STRIPE_PRICE_ID = 'price_VOTRE_PRICE_ID'; // Créer sur Stripe Dashboard
const FLUTTERWAVE_PUBLIC_KEY = 'FLWPUBK_TEST-VOTRE_CLE';
const API_URL = 'http://localhost:3001'; // URL de votre backend

/**
 * STRIPE - Créer session de paiement
 */
export async function createStripeCheckout(userId, userEmail) {
  try {
    const stripe = await stripePromise;

    // Appeler votre backend pour créer la session
    const response = await fetch(`${API_URL}/api/create-checkout-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        email: userEmail,
        priceId: STRIPE_PRICE_ID,
        successUrl: `${window.location.origin}/subscription/success`,
        cancelUrl: `${window.location.origin}/subscription/cancel`
      })
    });

    const { sessionId } = await response.json();

    // Rediriger vers Stripe Checkout
    const { error } = await stripe.redirectToCheckout({ sessionId });

    if (error) {
      throw new Error(error.message);
    }
  } catch (error) {
    console.error('Stripe error:', error);
    throw error;
  }
}

/**
 * FLUTTERWAVE - Créer paiement
 */
export async function createFlutterwavePayment(userId, userEmail, userName) {
  try {
    const FlutterwaveCheckout = window.FlutterwaveCheckout;
    
    FlutterwaveCheckout({
      public_key: FLUTTERWAVE_PUBLIC_KEY,
      tx_ref: `tontine_${userId}_${Date.now()}`,
      amount: 1, // 1 EUR
      currency: 'EUR',
      payment_options: 'card,mobilemoney,ussd',
      customer: {
        email: userEmail,
        name: userName
      },
      customizations: {
        title: 'Tontine Pour Tous - Abonnement PRO',
        description: 'Abonnement mensuel (1€/mois)',
        logo: 'https://votre-logo.png'
      },
      callback: async function(data) {
        if (data.status === 'successful') {
          // Enregistrer le paiement
          await handleSuccessfulPayment(userId, {
            amount: 1,
            currency: 'EUR',
            payment_method: 'flutterwave',
            payment_provider_id: data.transaction_id,
            status: 'completed'
          });
        }
      },
      onclose: function() {
        console.log('Payment modal closed');
      }
    });
  } catch (error) {
    console.error('Flutterwave error:', error);
    throw error;
  }
}

/**
 * Gérer paiement réussi - Activer PRO
 */
export async function handleSuccessfulPayment(userId, paymentData) {
  try {
    const now = new Date();
    const expiryDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // +30 jours

    // 1. Mettre à jour le statut utilisateur
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      subscription_status: 'pro',
      subscription_expires_at: expiryDate.toISOString(),
      updated_at: now.toISOString()
    });

    // 2. Enregistrer le paiement
    await addDoc(collection(db, 'payments'), {
      userId,
      ...paymentData,
      subscription_period_start: now.toISOString(),
      subscription_period_end: expiryDate.toISOString(),
      created_at: now.toISOString()
    });

    return { success: true, expiryDate };
  } catch (error) {
    console.error('Error activating PRO:', error);
    throw error;
  }
}

/**
 * Vérifier expiration abonnement
 */
export function isSubscriptionExpired(expiryDate) {
  if (!expiryDate) return true;
  return new Date(expiryDate) < new Date();
}

/**
 * Demander activation PRO (pour paiement manuel)
 */
export async function requestProActivation(userId, userEmail) {
  try {
    await addDoc(collection(db, 'subscription_requests'), {
      userId,
      userEmail,
      status: 'pending',
      requested_at: new Date().toISOString()
    });

    // Mettre à jour le statut utilisateur
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      subscription_status: 'pending'
    });

    return { success: true };
  } catch (error) {
    console.error('Error requesting PRO:', error);
    throw error;
  }
}