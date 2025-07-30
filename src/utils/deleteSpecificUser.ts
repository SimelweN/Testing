import { UserDeletionService } from "@/services/admin/userDeletionService";

/**
 * Utility to delete the specific user "simelwengcobo@icloud.com"
 * Run this function once to clean up the user's data
 */
export async function deleteSpecificUserData() {
  const email = "simelwengcobo@icloud.com";
  
  console.log("🗑️ Starting deletion of user:", email);
  
  // First, search for the user's data
  const searchResult = await UserDeletionService.searchUserData(email);
  
  if (!searchResult.found) {
    console.log("✅ User not found - no data to delete");
    return {
      success: true,
      message: "User not found - no data to delete",
      searchResult,
    };
  }
  
  console.log("📋 Found user data:", searchResult);
  
  // If data found, proceed with deletion
  const deletionReport = await UserDeletionService.deleteUserCompletely(email);
  
  console.log("🎯 Deletion completed:", deletionReport);
  
  return {
    success: deletionReport.success,
    message: deletionReport.success 
      ? `Successfully deleted user and ${Object.values(deletionReport.deletedRecords).reduce((sum, count) => sum + count, 0)} records`
      : `Deletion failed: ${deletionReport.errors.join(", ")}`,
    searchResult,
    deletionReport,
  };
}

// Export for console access if needed
if (typeof window !== 'undefined') {
  (window as any).deleteSpecificUserData = deleteSpecificUserData;
}
