#!/bin/bash

# Edge Functions Deployment Script
# This script deploys all Edge Functions to Supabase

echo "🚀 Deploying Edge Functions to Supabase"
echo "========================================"

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Please install it first:"
    echo "   npm install -g supabase"
    exit 1
fi

# Check if logged in
echo "🔐 Checking Supabase authentication..."
if ! supabase projects list &> /dev/null; then
    echo "❌ Not logged in to Supabase. Please run:"
    echo "   supabase login"
    exit 1
fi

echo "✅ Supabase CLI authenticated"

# Link project (update with your project ref)
PROJECT_REF="eqamrjcdxdmayamtkpyf"
echo "🔗 Linking to project: $PROJECT_REF"
supabase link --project-ref $PROJECT_REF

# List of functions to deploy
FUNCTIONS=(
    "auto-expire-commits"
    "automate-delivery"
    "cancel-order"
    "check-expired-orders"
    "commit-to-sale"
    "courier-guy-quote"
    "courier-guy-shipment"
    "courier-guy-track"
    "create-order"
    "create-paystack-subaccount"
    "create-recipient"
    "debug-email-template"
    "decline-commit"
    "fastway-quote"
    "fastway-shipment"
    "fastway-track"
    "get-delivery-quotes"
    "health-test"
    "initialize-paystack-payment"
    "manage-paystack-subaccount"
    "mark-collected"
    # "pay-seller" - removed - no automated seller payments
    "paystack-refund-management"
    "paystack-split-management"
    # "paystack-transfer-management" - removed - no automated transfers
    "paystack-webhook"
    "process-book-purchase"
    "process-multi-seller-purchase"
    "process-order-reminders"
    "send-email"
    "verify-paystack-payment"
)

echo "📦 Deploying ${#FUNCTIONS[@]} Edge Functions..."
echo ""

# Deploy each function
DEPLOYED=0
FAILED=0

for func in "${FUNCTIONS[@]}"; do
    echo "📤 Deploying $func..."
    
    if supabase functions deploy $func --no-verify-jwt; then
        echo "   ✅ $func deployed successfully"
        ((DEPLOYED++))
    else
        echo "   ❌ $func deployment failed"
        ((FAILED++))
    fi
    echo ""
done

# Summary
echo "========================================"
echo "📊 Deployment Summary:"
echo "   ✅ Successful: $DEPLOYED"
echo "   ❌ Failed: $FAILED"
echo "   📦 Total: ${#FUNCTIONS[@]}"

if [ $FAILED -eq 0 ]; then
    echo ""
    echo "🎉 All Edge Functions deployed successfully!"
    echo ""
    echo "🔍 Next steps:"
    echo "1. Test your functions: node verify-deployment.js"
    echo "2. Check function logs: supabase functions logs <function-name>"
    echo "3. Verify in Supabase Dashboard"
else
    echo ""
    echo "⚠️  Some deployments failed. Check the errors above."
    echo ""
    echo "🔧 Troubleshooting:"
    echo "1. Check function syntax and imports"
    echo "2. Verify all required environment variables are set"
    echo "3. Ensure you have the correct project permissions"
fi

echo "========================================"
