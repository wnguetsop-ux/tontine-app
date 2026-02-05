// backend/server.js
// À créer dans un dossier séparé "backend"

const express = require('express');
const cors = require('cors');
const stripe = require('stripe')('sk_test_VOTRE_CLE_SECRETE_STRIPE'); // ⚠️ REMPLACER
const admin = require('firebase-admin');

// Initialiser Firebase Admin
const serviceAccount = require('./serviceAccountKey.json'); // ⚠️ Télécharger depuis Firebase Console

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.raw({ type: 'application/json' }));

/**
 * Créer session Stripe Checkout
 */
app.post('/api/create-checkout-session', async (req, res) => {
  try {
    const { userId, email, priceId, successUrl, cancelUrl } = req.body;

    const session = await stripe.checkout.sessions.create({
      customer_email: email,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId, // Prix créé dans Stripe Dashboard
          quantity: 1,
        },
      ],
      mode: 'subscription', // ou 'payment' pour paiement unique
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId: userId
      }
    });

    res.json({ sessionId: session.id });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Webhook Stripe - Activation automatique PRO
 */
app.post('/webhook/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = 'whsec_VOTRE_WEBHOOK_SECRET'; // ⚠️ Depuis Stripe Dashboard

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Gérer l'événement
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      await handleSuccessfulCheckout(session);
      break;

    case 'invoice.payment_succeeded':
      const invoice = event.data.object;
      await handleSuccessfulPayment(invoice);
      break;

    case 'invoice.payment_failed':
      const failedInvoice = event.data.object;
      await handleFailedPayment(failedInvoice);
      break;

    case 'customer.subscription.deleted':
      const subscription = event.data.object;
      await handleSubscriptionCanceled(subscription);
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
});

/**
 * Gérer checkout réussi - Activer PRO
 */
async function handleSuccessfulCheckout(session) {
  try {
    const userId = session.metadata.userId;
    const now = new Date();
    const expiryDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // +30 jours

    // Mettre à jour l'utilisateur
    await db.collection('users').doc(userId).update({
      subscription_status: 'pro',
      subscription_expires_at: expiryDate.toISOString(),
      stripe_customer_id: session.customer,
      updated_at: now.toISOString()
    });

    // Enregistrer le paiement
    await db.collection('payments').add({
      userId: userId,
      amount: session.amount_total / 100, // Stripe utilise des centimes
      currency: session.currency.toUpperCase(),
      payment_method: 'stripe',
      payment_provider_id: session.id,
      status: 'completed',
      subscription_period_start: now.toISOString(),
      subscription_period_end: expiryDate.toISOString(),
      created_at: now.toISOString()
    });

    console.log(`✅ PRO activated for user ${userId}`);
  } catch (error) {
    console.error('Error handling successful checkout:', error);
  }
}

/**
 * Gérer paiement récurrent réussi
 */
async function handleSuccessfulPayment(invoice) {
  try {
    const customerId = invoice.customer;
    
    // Trouver l'utilisateur par stripe_customer_id
    const usersSnapshot = await db.collection('users')
      .where('stripe_customer_id', '==', customerId)
      .limit(1)
      .get();

    if (usersSnapshot.empty) {
      console.error('User not found for customer:', customerId);
      return;
    }

    const userDoc = usersSnapshot.docs[0];
    const userId = userDoc.id;

    // Prolonger l'abonnement de 30 jours
    const currentExpiry = userDoc.data().subscription_expires_at;
    const baseDate = currentExpiry && new Date(currentExpiry) > new Date() 
      ? new Date(currentExpiry) 
      : new Date();
    const newExpiry = new Date(baseDate.getTime() + 30 * 24 * 60 * 60 * 1000);

    await db.collection('users').doc(userId).update({
      subscription_status: 'pro',
      subscription_expires_at: newExpiry.toISOString(),
      updated_at: new Date().toISOString()
    });

    // Enregistrer le paiement
    await db.collection('payments').add({
      userId: userId,
      amount: invoice.amount_paid / 100,
      currency: invoice.currency.toUpperCase(),
      payment_method: 'stripe',
      payment_provider_id: invoice.id,
      status: 'completed',
      subscription_period_start: baseDate.toISOString(),
      subscription_period_end: newExpiry.toISOString(),
      created_at: new Date().toISOString()
    });

    console.log(`✅ Subscription renewed for user ${userId}`);
  } catch (error) {
    console.error('Error handling successful payment:', error);
  }
}

/**
 * Gérer échec de paiement
 */
async function handleFailedPayment(invoice) {
  try {
    const customerId = invoice.customer;
    
    const usersSnapshot = await db.collection('users')
      .where('stripe_customer_id', '==', customerId)
      .limit(1)
      .get();

    if (!usersSnapshot.empty) {
      const userId = usersSnapshot.docs[0].id;
      
      // Enregistrer l'échec
      await db.collection('payments').add({
        userId: userId,
        amount: invoice.amount_due / 100,
        currency: invoice.currency.toUpperCase(),
        payment_method: 'stripe',
        payment_provider_id: invoice.id,
        status: 'failed',
        created_at: new Date().toISOString()
      });

      console.log(`❌ Payment failed for user ${userId}`);
    }
  } catch (error) {
    console.error('Error handling failed payment:', error);
  }
}

/**
 * Gérer annulation d'abonnement
 */
async function handleSubscriptionCanceled(subscription) {
  try {
    const customerId = subscription.customer;
    
    const usersSnapshot = await db.collection('users')
      .where('stripe_customer_id', '==', customerId)
      .limit(1)
      .get();

    if (!usersSnapshot.empty) {
      const userId = usersSnapshot.docs[0].id;
      
      await db.collection('users').doc(userId).update({
        subscription_status: 'free',
        subscription_expires_at: null,
        updated_at: new Date().toISOString()
      });

      console.log(`🔚 Subscription canceled for user ${userId}`);
    }
  } catch (error) {
    console.error('Error handling subscription cancellation:', error);
  }
}

/**
 * Vérifier et mettre à jour les abonnements expirés (CRON)
 */
async function checkExpiredSubscriptions() {
  try {
    const now = new Date();
    
    const expiredUsers = await db.collection('users')
      .where('subscription_status', '==', 'pro')
      .where('subscription_expires_at', '<', now.toISOString())
      .get();

    for (const doc of expiredUsers.docs) {
      await doc.ref.update({
        subscription_status: 'free',
        updated_at: now.toISOString()
      });
      
      console.log(`⏰ Subscription expired for user ${doc.id}`);
    }

    console.log(`Checked ${expiredUsers.size} expired subscriptions`);
  } catch (error) {
    console.error('Error checking expired subscriptions:', error);
  }
}

// Exécuter la vérification toutes les heures
setInterval(checkExpiredSubscriptions, 60 * 60 * 1000);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📝 Stripe webhook: http://localhost:${PORT}/webhook/stripe`);
});