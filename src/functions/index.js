// functions/index.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const axios = require('axios');

admin.initializeApp();

// ========== STRIPE PAYMENT ==========
exports.createStripeCheckout = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { userEmail, userId } = data;

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: {
            name: 'Tontine Premium - Abonnement Mensuel',
            description: 'Membres illimités + toutes les fonctionnalités',
          },
          unit_amount: 1000, // 10.00 EUR en centimes
        },
        quantity: 1,
      }],
      mode: 'subscription',
      success_url: `${data.successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: data.cancelUrl,
      customer_email: userEmail,
      metadata: {
        userId: userId,
        plan: 'premium_monthly'
      }
    });

    return { sessionId: session.id, url: session.url };
  } catch (error) {
    console.error('Stripe error:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// Webhook Stripe pour activer l'abonnement
exports.stripeWebhook = functions.https.onRequest(async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = 'whsec_YOUR_WEBHOOK_SECRET'; // À configurer dans Stripe Dashboard

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const userId = session.metadata.userId;

    // Activer PRO
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + 1);

    await admin.firestore().collection('users').doc(userId).set({
      subscription_status: 'pro',
      subscription_expires_at: expiryDate.toISOString(),
      payment_method: 'stripe',
      stripe_customer_id: session.customer,
      updated_at: new Date().toISOString()
    }, { merge: true });

    // Enregistrer paiement
    await admin.firestore().collection('payments').add({
      userId: userId,
      amount: 10.00,
      currency: 'EUR',
      status: 'completed',
      method: 'stripe',
      stripe_session_id: session.id,
      created_at: new Date().toISOString()
    });
  }

  res.json({ received: true });
});

// ========== FLUTTERWAVE PAYMENT ==========
exports.createFlutterwavePayment = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { userEmail, userId, amount, currency } = data;

  try {
    const response = await axios.post('https://api.flutterwave.com/v3/payments', {
      tx_ref: `TXN_${Date.now()}_${userId}`,
      amount: amount || 10000, // 10000 FCFA
      currency: currency || 'XAF',
      redirect_url: data.redirectUrl,
      customer: {
        email: userEmail,
        name: data.userName || 'Client'
      },
      customizations: {
        title: 'Tontine Premium',
        description: 'Abonnement Premium - Membres illimités',
        logo: 'https://your-logo-url.com/logo.png'
      },
      meta: {
        userId: userId,
        plan: 'premium_monthly'
      }
    }, {
      headers: {
        'Authorization': `Bearer FLWSECK_TEST-c17d0feba447c5459ccb5cc2b99a1d6d-X`,
        'Content-Type': 'application/json'
      }
    });

    return { 
      link: response.data.data.link,
      reference: response.data.data.tx_ref 
    };
  } catch (error) {
    console.error('Flutterwave error:', error.response?.data || error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// Webhook Flutterwave pour vérifier paiement
exports.flutterwaveWebhook = functions.https.onRequest(async (req, res) => {
  const secretHash = 'YOUR_WEBHOOK_SECRET_HASH'; // À configurer dans Flutterwave Dashboard
  const signature = req.headers['verif-hash'];

  if (signature !== secretHash) {
    return res.status(401).send('Unauthorized');
  }

  const payload = req.body;

  if (payload.event === 'charge.completed' && payload.data.status === 'successful') {
    const userId = payload.data.meta.userId;

    // Activer PRO
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + 1);

    await admin.firestore().collection('users').doc(userId).set({
      subscription_status: 'pro',
      subscription_expires_at: expiryDate.toISOString(),
      payment_method: 'flutterwave',
      flutterwave_tx_ref: payload.data.tx_ref,
      updated_at: new Date().toISOString()
    }, { merge: true });

    // Enregistrer paiement
    await admin.firestore().collection('payments').add({
      userId: userId,
      amount: payload.data.amount,
      currency: payload.data.currency,
      status: 'completed',
      method: 'flutterwave',
      flutterwave_tx_ref: payload.data.tx_ref,
      created_at: new Date().toISOString()
    });
  }

  res.json({ status: 'success' });
});