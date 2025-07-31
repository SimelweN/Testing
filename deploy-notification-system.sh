#!/bin/bash

# Notification System Backend Setup Script
# Run this script to set up the notification system in your Supabase backend

echo "🔧 Setting up notification system backend..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Please install it first:"
    echo "   npm install -g supabase"
    exit 1
fi

# Check if we're in a Supabase project
if [ ! -f "supabase/config.toml" ]; then
    echo "❌ Not in a Supabase project directory. Please run from your project root."
    exit 1
fi

echo "📊 Applying database migrations..."

# Apply the RLS policy fix
echo "  - Fixing notifications RLS policies..."
supabase db push --include-all

if [ $? -eq 0 ]; then
    echo "✅ Database migrations applied successfully"
else
    echo "❌ Database migration failed"
    exit 1
fi

echo "🚀 Deploying edge functions..."

# Deploy the test notification function
echo "  - Deploying test-notification function..."
supabase functions deploy test-notification

if [ $? -eq 0 ]; then
    echo "✅ test-notification function deployed"
else
    echo "❌ Failed to deploy test-notification function"
fi

echo ""
echo "🎉 Notification system setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Test notifications using the test-notification edge function"
echo "2. Verify RLS policies are working correctly"
echo "3. Check that users can create and view their own notifications"
echo ""
echo "🧪 Test your setup:"
echo "   - Use the 'Test Notification' button in your app"
echo "   - Or call the edge function directly:"
echo "   curl -X POST 'https://your-project.supabase.co/functions/v1/test-notification' \\"
echo "     -H 'Authorization: Bearer YOUR_ANON_KEY' \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"userId\": \"your-user-id\", \"title\": \"Test\", \"message\": \"Hello!\"}'"
echo ""
echo "🔍 Debug notifications:"
echo "   - Check browser console for detailed error logs"
echo "   - Review Supabase logs for RLS policy violations"
echo "   - Verify user authentication state"
