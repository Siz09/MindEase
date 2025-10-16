#!/bin/bash

# Test script for the subscription endpoint  
# Usage: JWT_TOKEN=your_token_here ./test-subscription-endpoint.sh

if [ -z "$JWT_TOKEN" ]; then
  echo "Error: JWT_TOKEN environment variable is not set"
  echo "Usage: JWT_TOKEN=your_token_here ./test-subscription-endpoint.sh"
  exit 1
fi

echo "Testing Subscription Endpoint..."
echo "================================"

# Test 1: FREE plan
echo "1. Testing FREE plan..."
curl -X POST http://localhost:8080/api/subscription/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{"planType":"FREE"}' \
  -w "\nHTTP Status: %{http_code}\n\n"

echo "2. Testing MONTHLY plan (alias for PREMIUM)..."
curl -X POST http://localhost:8080/api/subscription/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{"planType":"monthly"}' \
  -w "\nHTTP Status: %{http_code}\n\n"

echo "3. Testing PREMIUM plan..."
curl -X POST http://localhost:8080/api/subscription/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{"planType":"PREMIUM"}' \
  -w "\nHTTP Status: %{http_code}\n\n"

echo "4. Testing invalid plan type..."
curl -X POST http://localhost:8080/api/subscription/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{"planType":"INVALID"}' \
  -w "\nHTTP Status: %{http_code}\n\n"

echo "5. Testing without authorization..."
curl -X POST http://localhost:8080/api/subscription/create \
  -H "Content-Type: application/json" \
  -d '{"planType":"FREE"}' \
  -w "\nHTTP Status: %{http_code}\n\n"

echo "================================"
echo "Test completed!"
echo ""
echo "Expected results:"
echo "- FREE plan: 200 OK with subscription data"
echo "- MONTHLY/PREMIUM: 200 OK with Stripe checkout data (if configured) or 500 if Stripe not configured"
echo "- Invalid plan: 400 Bad Request"
echo "- No auth: 401 Unauthorized"
