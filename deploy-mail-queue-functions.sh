#!/bin/bash

echo "🚀 Deploying mail queue processing functions..."

# Deploy the mail queue processor
echo "📬 Deploying process-mail-queue function..."
supabase functions deploy process-mail-queue

# Deploy the mail queue cron scheduler
echo "⏰ Deploying mail-queue-cron function..."
supabase functions deploy mail-queue-cron

echo "✅ Mail queue functions deployed successfully!"

echo ""
echo "📋 Next steps:"
echo "1. Set up BREVO_SMTP_KEY secret: supabase secrets set BREVO_SMTP_KEY=\"your_key_here\""
echo "2. Set up cron job to call mail-queue-cron every 5 minutes"
echo "3. Test the functions using the Email Diagnostics panel in Developer tools"
echo ""
echo "🔧 To test manually:"
echo "curl -X POST \"https://your-project.supabase.co/functions/v1/process-mail-queue\" -H \"Authorization: Bearer \$SUPABASE_SERVICE_KEY\""
