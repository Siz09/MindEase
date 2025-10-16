# Testing Stripe Subscription Endpoint

## Prerequisites

1. Make sure you have added your Stripe keys to the `.env` file:

   ```
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

2. Start the backend server:
   ```bash
   cd backend
   ./mvnw spring-boot:run
   ```

## Test the Endpoint

### 1. First, get a JWT token (you'll need to login first)

```bash
# Login to get JWT token (replace with your actual credentials)
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "firebaseToken": "your-firebase-token"
  }'
```

### 2. Test FREE Plan (should work without Stripe API calls)

```bash
curl -X POST http://localhost:8080/api/subscription/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "planType": "FREE"
  }'
```

**Expected Response:**

```json
{
  "success": true,
  "message": "Free subscription activated",
  "data": {
    "subscriptionId": "uuid-here",
    "planType": "FREE",
    "status": "ACTIVE",
    "checkoutUrl": null
  }
}
```

### 3. Test PREMIUM/MONTHLY Plan (will create Stripe checkout session)

```bash
# Using PREMIUM
curl -X POST http://localhost:8080/api/subscription/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "planType": "PREMIUM"
  }'

# Or using MONTHLY alias
curl -X POST http://localhost:8080/api/subscription/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "planType": "monthly"
  }'
```

**Expected Response:**

```json
{
  "checkoutSessionId": "cs_test_...",
  "publishableKey": "pk_test_...",
  "clientSecret": "cs_test_...",
  "checkoutUrl": "https://checkout.stripe.com/...",
  "subscriptionId": "uuid-here",
  "planType": "PREMIUM",
  "status": "INCOMPLETE"
}
```

### 4. Test Invalid Plan Type

```bash
curl -X POST http://localhost:8080/api/subscription/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "planType": "INVALID_PLAN"
  }'
```

**Expected Response:**

```json
{
  "success": false,
  "message": "Invalid plan type. Must be FREE, PREMIUM, or ENTERPRISE"
}
```

### 5. Test without Authorization

```bash
curl -X POST http://localhost:8080/api/subscription/create \
  -H "Content-Type: application/json" \
  -d '{
    "planType": "FREE"
  }'
```

**Expected Response:**

```
401 Unauthorized
```

## Notes

- The FREE plan will work even if Stripe is not configured
- PREMIUM and ENTERPRISE plans require valid Stripe configuration
- You'll need to replace `YOUR_JWT_TOKEN` with an actual JWT token from login
- Make sure your Stripe test keys are properly set in the `.env` file

## Frontend Integration

Once you get the response from the create endpoint, use it like this:

```javascript
// Get the response from your API call
const response = await fetch('/api/subscription/create', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${jwtToken}`,
  },
  body: JSON.stringify({ planType: 'monthly' }),
});

const data = await response.json();

// Use Stripe to redirect to checkout
const stripe = await loadStripe(data.publishableKey);
await stripe.redirectToCheckout({ sessionId: data.checkoutSessionId });
```

## Test Card Numbers (Stripe Test Mode)

Use these test card numbers in Stripe Checkout:

- **Success**: `4242 4242 4242 4242` (any future date, any CVC, any ZIP)
- **Insufficient funds**: `4000 0000 0000 0002`
- **Declined**: `4000 0000 0000 0002`
- **3D Secure authentication**: `4000 0025 0000 3155`
- **Requires authentication**: `4000 0027 6000 3184`

For more test cards, see: https://stripe.com/docs/testing#cards

## Common Gotchas & Quick Checks

1. **403 on /create** → Your JWT isn't recognized
   - Ensure `Authorization: Bearer ...` header is correct
   - Verify your security config allows authenticated POST requests

2. **400 Invalid price** → Double-check you used recurring prices
   - Verify price IDs match your Stripe dashboard
   - Make sure prices are set to recurring/subscription mode

3. **Session creates but returns no subscription** → That's expected!
   - Day 3 webhook will capture `stripe_subscription_id`
   - Webhook will flip status from INCOMPLETE to ACTIVE

4. **"Payment system is not configured"** → Check your `.env` file has the correct Stripe keys
5. **"User not found"** → Make sure you're using a valid JWT token from a logged-in user
6. **"No API key provided"** → Stripe keys are not being loaded from environment variables
