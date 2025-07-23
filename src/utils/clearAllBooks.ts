import { AdminUtilityService } from "@/services/admin/adminUtilityService";

/**
 * Clear all books from the platform
 * This is a wrapper around the admin service for backward compatibility
 */
export const clearAllBooks = async () => {
  return await AdminUtilityService.deleteAllBooks();
};
