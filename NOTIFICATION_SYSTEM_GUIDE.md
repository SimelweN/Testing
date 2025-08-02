# Notification System Architecture Guide

## Overview
The notification system provides real-time notifications to users about orders, deliveries, commits, and other important events. It uses Supabase's real-time capabilities for instant updates.

## System Components

### 1. Database Layer (`notifications` table)
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Row Level Security (RLS) Policies:**
- Users can view their own notifications
- Users can insert notifications for themselves  
- Users can update their own notifications (mark as read)
- Service role can manage all notifications (for system/admin notifications)

### 2. Service Layer (`src/services/notificationService.ts`)

**Core Functions:**
- `createNotification()` - Creates new notifications with validation
- `getNotifications()` - Retrieves user notifications with caching
- `markNotificationAsRead()` - Updates read status
- Specialized methods for different notification types (commits, deliveries, etc.)

**Error Handling:**
- Proper error serialization to prevent "[object Object]" display
- Structured logging with context and original error objects
- Fallback error messages for user-friendly display

### 3. React Hook (`src/hooks/useNotifications.ts`)

**Features:**
- Real-time subscription to database changes
- Automatic retry logic for network failures
- Caching and deduplication of notifications
- Session refresh for 403 errors
- Circuit breaker pattern to prevent infinite retries

**Singleton Pattern:**
Uses `NotificationManager` class to prevent multiple subscriptions and ensure efficient resource usage.

### 4. UI Components

#### Main Notification Page (`src/pages/NotificationsNew.tsx`)
- Categorizes notifications by type (commits, purchases, deliveries, admin, general)
- Welcome message for first-time users
- System broadcasts display
- Test notification button (development only)

#### Notification Badge (`src/components/NotificationBadge.tsx`)
- Shows unread count in header
- Real-time updates via `useNotifications` hook

#### Order Notification System (`src/components/notifications/OrderNotificationSystem.tsx`)
- Specialized component for order-related notifications
- Filtering and action buttons

## How It Works

### 1. Creating Notifications

**Server-Side (Supabase Functions):**
```typescript
// From edge functions
await NotificationService.createNotification({
  userId: 'user-uuid',
  type: 'purchase',
  title: 'Order Confirmed',
  message: 'Your order has been confirmed...'
});
```

**Client-Side:**
```typescript
// From React components
await NotificationService.createNotification({
  userId: user.id,
  type: 'test',
  title: 'Test Notification',
  message: 'This is a test notification'
});
```

### 2. Real-Time Updates

1. **Database Insert:** New notification inserted into `notifications` table
2. **Real-Time Trigger:** Supabase real-time detects the INSERT event
3. **Hook Update:** `useNotifications` receives the event via WebSocket
4. **Cache Invalidation:** Notification cache is cleared for the user
5. **UI Refresh:** Components automatically re-render with new data

### 3. Notification Flow

```
[Event Occurs] 
    ↓
[Service/Function Creates Notification]
    ↓  
[Database INSERT with RLS Check]
    ↓
[Real-time Event Broadcast]
    ↓
[NotificationManager Receives Event]
    ↓
[useNotifications Hook Updates]
    ↓
[UI Components Re-render]
    ↓
[User Sees Notification]
```

### 4. Error Handling

**Common Issues:**
- **RLS Policy Violation:** User trying to create notification for another user
- **Missing Required Fields:** userId, type, title, or message not provided
- **Authentication Issues:** Invalid or expired session
- **Network Problems:** Connection timeouts or failures

**Error Resolution:**
```typescript
// Proper error serialization
const serializeError = (error: any) => {
  if (error instanceof Error) {
    return {
      message: error.message,
      name: error.name,
      stack: error.stack
    };
  }
  
  if (typeof error === 'object') {
    return {
      message: error.message || error.details || 'Unknown error',
      code: error.code || error.status,
      details: error.details
    };
  }
  
  return { message: String(error) };
};
```

## Notification Types

1. **commit** - Seller commitment reminders and updates
2. **purchase** - Order confirmations and payment updates  
3. **delivery** - Shipping and tracking updates
4. **admin** - Administrative actions (removals, violations)
5. **general** - System announcements and updates
6. **test** - Development testing notifications

## Caching Strategy

- **Client-side cache:** 5-minute TTL for notification lists
- **Deduplication:** Prevents duplicate notifications in UI
- **Cleanup:** Automatic removal of old notifications (>200 items)
- **Invalidation:** Cache cleared when new notifications arrive

## Security

- **RLS Policies:** Ensure users only see their own notifications
- **Authentication Required:** All operations require valid session
- **Input Validation:** Required fields checked before database operations
- **Rate Limiting:** Prevents notification spam

## Development/Testing

**Test Notification Button:**
- Only visible in development mode
- Creates test notification for current user
- Useful for testing real-time updates and UI

**Debug Components:**
- `NotificationDebugger` - Tests valid and invalid notification creation
- Console logging with structured error information
- Error boundaries to catch rendering issues

## Troubleshooting

### "Failed to create notification" Errors

1. **Check RLS Policies:** Ensure user can insert notifications
2. **Verify Authentication:** User must be logged in with valid session
3. **Validate Data:** All required fields must be provided
4. **Check Console:** Look for detailed error information

### No Real-Time Updates

1. **Check WebSocket Connection:** Network issues may block real-time
2. **Verify Subscription:** Should see connection logs in console
3. **Authentication:** Real-time requires valid session
4. **Fallback:** Manual refresh still works if real-time fails

### Performance Issues

1. **Notification Limit:** Keep notifications under 200 per user
2. **Subscription Cleanup:** Ensure proper component unmounting
3. **Cache Management:** Monitor cache hit rates
4. **Batch Operations:** Use bulk operations for multiple notifications

## Migration and Setup

To replicate this system:

1. **Database Setup:**
   - Create notifications table
   - Set up RLS policies  
   - Enable real-time on table

2. **Service Integration:**
   - Install Supabase client
   - Set up authentication
   - Configure real-time subscriptions

3. **React Integration:**
   - Create notification service
   - Build useNotifications hook
   - Add UI components

4. **Testing:**
   - Add debug components
   - Test real-time functionality
   - Verify error handling

This notification system provides a robust, real-time communication channel between your application and users, with proper error handling, caching, and security measures.
