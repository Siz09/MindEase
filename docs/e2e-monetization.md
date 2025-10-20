MindEase — Monetization E2E (Day 7)

Goals

- Wire webhook-driven status changes into the UI without reload
- Show toasts on important state transitions
- Validate end‑to‑end: subscribe → active → use premium → cancel → gated again

Prerequisites

- Backend running with Stripe test keys and webhook configured
- Frontend running at the domain used in `stripe.checkout.success-url`
- User is logged in

Key UX Behaviors

- After Checkout success, the app polls `/api/subscription/status` for ~45s
  and flips the UI automatically when Stripe webhook lands.
- Toasts fire on transitions:
  - “Subscription activated” when status becomes `active`
  - “Canceled” when status becomes `canceled`
  - “Payment failed” when status becomes `past_due`

How Return From Checkout Works

1. Backend returns `{ sessionId, publishableKey }` from `POST /api/subscription/create`.
2. Frontend calls `stripe.redirectToCheckout({ sessionId })`.
3. Stripe redirects to the configured `success_url`, e.g.
   `/subscription/success?session_id=cs_test_...`.
4. Success page starts an intense poll (1.5s interval, up to 45s) against
   `/api/subscription/status` until it reads `active`, then navigates to
   `/subscription`. A sessionStorage flag ensures the subscription page also
   polls briefly as a fallback.

E2E Test Flow (Stripe Test Mode)

1. Subscribe
   - In the app, go to `Subscription` and click any plan.
   - Complete the Stripe Checkout with test card `4242 4242 4242 4242`.
2. Activation
   - On the success page, watch for the “Subscription activated” toast.
   - The `Status: active` pill should appear on `/subscription` without reload.
3. Use Premium
   - Visit any premium‑gated feature (e.g., Chat) and verify access works.
4. Cancel
   - From Stripe Dashboard (or Customer Portal if enabled), cancel the test
     subscription. The webhook will drive a status flip to `canceled`.
   - Return to the app’s Subscription page and observe the cancel toast and
     status change. Premium features become gated again.
5. Payment Failure (optional)
   - Trigger an `invoice.payment_failed` test event from Stripe to see the
     “Payment failed” toast and `past_due` state.

Notes

- Polling intervals are conservative; adjust in `Subscription.jsx` if you need
  faster or slower refresh.
- If webhooks are delayed, the UI shows a warning and continues normally — the
  state will update on the next poll.
