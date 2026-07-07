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
            // Include CHECKOUT_SESSION_ID so the frontend can verify payment immediately
            // (webhook updates can be slightly delayed).
            success_url: `${process.env.CLIENT_URL}/dashboard?payment=success&session_id={CHECKOUT_SESSION_ID}&plan=${plan}`,
            cancel_url: `${process.env.CLIENT_URL}/pricing?payment=cancelled&session_id={CHECKOUT_SESSION_ID}`,
        });

        res.json({ url: session.url });

    } catch (error) {
        console.error("Stripe Checkout Error:", error);
        res.status(500).json({ message: "Failed to create checkout session" });
    }
});

// POST /api/payment/verify - Verify checkout payment + update user right away
// This reduces reliance on webhook timing for the "Premium" UI update.
router.post("/verify", authMiddleware, async (req, res) => {
    const { session_id } = req.body;

    if (!session_id) {
        return res.status(400).json({ message: "Missing session_id" });
    }

    try {
        const stripe = getStripe();
        const session = await stripe.checkout.sessions.retrieve(session_id);

        if (!session || session.payment_status !== "paid") {
            return res.status(400).json({ message: "Payment not completed yet" });
        }

        const sessionUserId = session.client_reference_id;
        if (!sessionUserId) {
            return res.status(400).json({ message: "Invalid checkout session" });
        }

        // Ensure the session belongs to the logged-in user.
        if (sessionUserId.toString() !== req.user.userId.toString()) {
            return res.status(403).json({ message: "This checkout session does not belong to your account" });
        }

        let plan = "monthly";
        let currentPeriodEnd = null;

        if (session.subscription) {
            const subscription = await stripe.subscriptions.retrieve(session.subscription);
            const priceId = subscription.items?.data?.[0]?.price?.id;

            if (priceId === process.env.STRIPE_PRICE_ID_YEARLY) plan = "yearly";
            currentPeriodEnd = subscription.current_period_end
                ? new Date(subscription.current_period_end * 1000)
                : null;
        }

        await User.findByIdAndUpdate(req.user.userId, {
            'subscription.status': 'active',
            'subscription.plan': plan,
            'subscription.stripeCustomerId': session.customer,
            'subscription.stripeSubscriptionId': session.subscription,
            'subscription.currentPeriodEnd': currentPeriodEnd
        });

        return res.json({ success: true, message: "Payment verified", plan });
    } catch (error) {
        console.error("Stripe Verify Error:", error);
        return res.status(500).json({ message: "Failed to verify payment session" });
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
