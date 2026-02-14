import express from "express";
import Stripe from "stripe";
import authMiddleware from "../middleware/auth.js";
import User from "../models/User.js";

const router = express.Router();

// Initialize Stripe inside the route to ensuring env vars are loaded
const getStripe = () => {
    if (!process.env.STRIPE_SECRET_KEY) {
        throw new Error("STRIPE_SECRET_KEY is missing in .env");
    }
    return new Stripe(process.env.STRIPE_SECRET_KEY);
};

const PLANS = {
    'monthly': {
        priceId: process.env.STRIPE_PRICE_ID_MONTHLY, // e.g., price_12345
        name: 'CampusMind Premium (Monthly)'
    },
    'yearly': {
        priceId: process.env.STRIPE_PRICE_ID_YEARLY,
        name: 'CampusMind Premium (Yearly)'
    }
};

// POST /api/payment/checkout - Create Checkout Session
router.post("/checkout", authMiddleware, async (req, res) => {
    const { plan } = req.body; // 'monthly' or 'yearly'

    if (!PLANS[plan]) {
        return res.status(400).json({ message: "Invalid plan selected" });
    }

    try {
        const stripe = getStripe();
        const user = await User.findById(req.user.userId);

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            customer_email: user.email,
            // Uses client_reference_id for user association (no custom fields)
            client_reference_id: user._id.toString(),
            line_items: [
                {
                    price: PLANS[plan].priceId,
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            success_url: `${process.env.CLIENT_URL}/dashboard?payment=success&plan=${plan}`,
            cancel_url: `${process.env.CLIENT_URL}/pricing?payment=cancelled`,
        });

        res.json({ url: session.url });

    } catch (error) {
        console.error("Stripe Checkout Error:", error);
        res.status(500).json({ message: "Failed to create checkout session" });
    }
});

// POST /api/payment/webhook - Stripe Webhook to update DB
// NOTE: This needs to be configured in Stripe Dashboard to point to your live server URL
router.post("/webhook", express.raw({ type: 'application/json' }), async (req, res) => {
    const stripe = getStripe();
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(
            req.body, 
            sig, 
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        console.error("Webhook Error:", err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const userId = session.client_reference_id;
        
        let plan = 'monthly';
        let currentPeriodEnd = null;
        try {
            if (session.subscription) {
                const subscription = await stripe.subscriptions.retrieve(session.subscription);
                const priceId = subscription.items?.data?.[0]?.price?.id;
                if (priceId === process.env.STRIPE_PRICE_ID_YEARLY) plan = 'yearly';
                currentPeriodEnd = subscription.current_period_end;
            }
            
            await User.findByIdAndUpdate(userId, {
                'subscription.status': 'active',
                'subscription.plan': plan,
                'subscription.stripeCustomerId': session.customer,
                'subscription.stripeSubscriptionId': session.subscription,
                'subscription.currentPeriodEnd': currentPeriodEnd ? new Date(currentPeriodEnd * 1000) : null
            });
            console.log(`User ${userId} upgraded to Premium (${plan})`);
        } catch (dbError) {
           console.error("DB Update Error", dbError); 
        }
    }

    res.json({ received: true });
});

export default router;
