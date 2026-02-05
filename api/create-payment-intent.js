import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  try {
    const { amount } = req.body;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount || 100,
      currency: "eur",
      payment_method_types: ["card"],
    });

    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error("🔥 STRIPE FULL ERROR 🔥", error);
    res.status(500).json({
      message: error.message,
      type: error.type,
      code: error.code,
      raw: error.raw,
    });
  }
}
