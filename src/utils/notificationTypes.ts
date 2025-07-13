/**
 * Valid notification types as defined by the database check constraint
 */
export type ValidNotificationType = "info" | "warning" | "success" | "error";

/**
 * Notification type constants to prevent typos
 */
export const NOTIFICATION_TYPES = {
  INFO: "info" as const,
  WARNING: "warning" as const,
  SUCCESS: "success" as const,
  ERROR: "error" as const,
} as const;

/**
 * Map activity types to appropriate notification types
 */
export const getNotificationTypeForActivity = (
  activityType: string,
): ValidNotificationType => {
  switch (activityType) {
    case "purchase":
    case "sale":
    case "listing_created":
      return NOTIFICATION_TYPES.SUCCESS;

    case "listing_deleted":
    case "wishlist_removed":
      return NOTIFICATION_TYPES.WARNING;

    case "rating_received":
    case "rating_given":
      return NOTIFICATION_TYPES.SUCCESS;

    case "login":
    case "profile_updated":
    case "book_viewed":
    case "search":
    case "wishlist_added":
    default:
      return NOTIFICATION_TYPES.INFO;
  }
};

/**
 * Validate if a notification type is valid
 */
export const isValidNotificationType = (
  type: string,
): type is ValidNotificationType => {
  return Object.values(NOTIFICATION_TYPES).includes(
    type as ValidNotificationType,
  );
};

/**
 * Get a safe notification type (defaults to 'info' if invalid)
 */
export const getSafeNotificationType = (
  type: string,
): ValidNotificationType => {
  return isValidNotificationType(type) ? type : NOTIFICATION_TYPES.INFO;
};
