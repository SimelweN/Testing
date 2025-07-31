# Commit Expiry + Orders UI Fix Summary

## 🐛 Issues Fixed

### 1. Commit Expiry Countdown Not Working ✅
**Problem**: Commits over 48 hours old remained active indefinitely
**Root Cause**: Auto-expire function existed but wasn't scheduled to run automatically
**Solution**: 
- Created automated cron scheduling via `supabase/migrations/20250124000000_setup_commit_expiry_cron.sql`
- Function now runs every hour to expire commits older than 48 hours
- Added manual trigger function for testing

### 2. Book Purchases Not Visible in Orders ✅  
**Problem**: Orders with `pending_commit` status weren't showing in Orders section
**Root Cause**: OrderManagementView component wasn't including `pending_commit` in stats calculation
**Solution**:
- Updated `getOrderStats()` to include `pending_commit` in pending orders count
- Enhanced order filtering to show all relevant statuses
- Improved order display with proper book title fallbacks

### 3. UI Enhancement for Commit Status ✅
**Problem**: No clear indication of "Pending Commit" status or explanation
**Solution**:
- Added "Pending Commit" badge with amber styling
- Implemented tooltip explaining "Waiting for seller to confirm within 48 hours"  
- Added real-time countdown timer showing hours remaining
- Visual urgency indicators (red/pulsing) for commits with < 12 hours remaining

## 🔧 Key Changes Made

### Database Migration
- **File**: `supabase/migrations/20250124000000_setup_commit_expiry_cron.sql`
- **Function**: `auto_expire_commits_cron()` - Calls auto-expire edge function
- **Schedule**: Runs every hour at minute 0 (`0 * * * *`)
- **Testing**: `trigger_commit_expiry()` for manual testing

### Frontend Updates
- **File**: `src/components/orders/OrderManagementView.tsx`
- **Features**: 
  - Real-time countdown timers for pending commits
  - Enhanced tooltip with proper Radix UI implementation
  - Better status visualization with timeline
  - Proper handling of expired commits

## 🧪 Testing Guide

### 1. Test Automated Expiry
```sql
-- Check if cron job is scheduled
SELECT * FROM cron.job WHERE jobname = 'auto-expire-commits-hourly';

-- Manually trigger expiry (for testing)
SELECT trigger_commit_expiry();
```

### 2. Test Orders Display
1. Make a book purchase
2. Navigate to Activity Center → Orders tab
3. Verify order appears with "Pending Commit" status
4. Check tooltip on info icon shows explanation
5. Verify countdown timer shows remaining hours

### 3. Test Commit Expiry Flow
1. Create order with `pending_commit` status
2. Wait or manually set created_at to 48+ hours ago
3. Run auto-expire function
4. Verify order status changes to `declined`
5. Check buyer receives refund notification

## 📊 Expected Behavior

### Normal Flow
1. **Order Placed**: Shows in Orders as "Pending Commit" with 48h countdown
2. **Seller Commits**: Status changes to "Confirmed", countdown disappears
3. **Auto-Expiry**: If no action after 48h, automatically declines and refunds

### UI Indicators
- **Green dot**: Confirmed/completed steps
- **Amber dot**: Current pending commit step with countdown
- **Red dot**: Expired or failed steps
- **Pulsing animation**: Urgent (< 12h remaining)

## 🔍 Verification Checklist

- [ ] Orders with `pending_commit` status appear in Orders section
- [ ] Pending commit badge shows with proper styling
- [ ] Info tooltip explains 48-hour deadline
- [ ] Countdown timer updates every minute
- [ ] Urgent styling appears when < 12 hours remain
- [ ] Cron job is scheduled for hourly execution
- [ ] Auto-expire function processes expired commits
- [ ] Manual trigger function works for testing

## 🚀 Production Deployment Notes

1. **Database Migration**: Apply the cron migration in production
2. **Environment Variables**: Ensure `app.supabase_url` and `app.service_role_key` are set
3. **Monitoring**: Check cron job runs successfully every hour
4. **Testing**: Use manual trigger function to verify expiry works

## 📝 Technical Details

### Cron Schedule
- **Frequency**: Every hour (`0 * * * *`)
- **Function**: Calls `auto-expire-commits` edge function
- **Cleanup**: Automatically declines expired orders and issues refunds

### UI Components Used
- **Tooltip**: Radix UI tooltip with proper accessibility
- **Badges**: Styled with Tailwind classes for status indication  
- **Timers**: Real-time countdown with minute-level updates
- **Icons**: Lucide React icons for visual clarity

### Edge Function Integration
- **Auto-Expire**: `supabase/functions/auto-expire-commits/index.ts`
- **Decline Process**: Integrates with existing decline-commit function
- **Notifications**: Sends emails to admin and affected users

All fixes maintain existing functionality while adding the requested features for better user experience and automated system management.
