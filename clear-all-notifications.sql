-- Clear all notifications from the database
-- This will remove all existing notifications so we can start fresh

DELETE FROM notifications;

-- Reset the sequence if using serial IDs (this is optional since we use UUIDs)
-- ALTER SEQUENCE notifications_id_seq RESTART WITH 1;

-- Confirm deletion
SELECT COUNT(*) as remaining_notifications FROM notifications;
