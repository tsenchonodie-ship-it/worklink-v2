import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

app.post('/create-payment-intent', async (req, res) => {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) {
    return res.status(500).json({ error: 'Missing STRIPE_SECRET_KEY.' });
  }

  try {
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(stripeSecretKey, { apiVersion: '2025-02-24.acacia' });
    const { amount = 25600, currency = 'usd' } = req.body || {};

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      automatic_payment_methods: { enabled: true },
    });

    return res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Unable to create payment intent.' });
  }
});

const port = process.env.PORT || 4242;
app.listen(port, () => {
  console.log(`Stripe server listening on http://127.0.0.1:${port}`);
});
