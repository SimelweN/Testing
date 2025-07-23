import { AdminUtilityService } from "@/services/admin/adminUtilityService";

/**
 * Clear all books from the browse books section
 * This is a wrapper around the admin service for backward compatibility
 */
export const clearAllBrowseBooks = async () => {
  return await AdminUtilityService.deleteAllBooks();
};
