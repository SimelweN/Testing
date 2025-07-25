#!/bin/bash

echo "🚀 Deploying courier-guy-lockers Edge Function"
echo "=============================================="

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

echo "📤 Deploying courier-guy-lockers function..."

if supabase functions deploy courier-guy-lockers --no-verify-jwt; then
    echo "✅ courier-guy-lockers deployed successfully!"
    echo ""
    echo "🧪 Next steps:"
    echo "1. Test the function using the API Debug tab in the Locker Search page"
    echo "2. Check function logs: supabase functions logs courier-guy-lockers"
    echo "3. The locker search should now return rich PUDO data with opening hours, box types, etc."
    echo ""
    echo "🔍 Expected benefits:"
    echo "- Real-time locker data from PUDO API"
    echo "- Opening hours and contact information"
    echo "- Box type specifications (lstTypesBoxes)"
    echo "- Accurate addresses and coordinates"
else
    echo "❌ Deployment failed!"
    echo ""
    echo "🔧 Troubleshooting:"
    echo "1. Make sure you're in the project root directory"
    echo "2. Check that supabase/functions/courier-guy-lockers/index.ts exists"
    echo "3. Verify your Supabase project permissions"
    echo "4. Check the function logs for any import/syntax errors"
fi

echo "=============================================="
