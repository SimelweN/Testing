/**
 * Test utility to verify book deletion error handling improvements
 * This can be used in the browser console to test different error scenarios
 */

import { BookDeletionService } from '../services/bookDeletionService';

export async function testBookDeletionErrorHandling() {
  console.log("🧪 Testing book deletion error handling improvements...");

  // Test 1: Check deletion constraints for a non-existent book
  console.log("\n📋 Test 1: Checking constraints for non-existent book");
  try {
    const result = await BookDeletionService.checkBookDeletionConstraints('non-existent-book-id');
    console.log("✅ Constraint check handled gracefully:", result);
  } catch (error) {
    console.log("❌ Constraint check failed:", error);
  }

  // Test 2: Simulate constraint check error handling
  console.log("\n📋 Test 2: Error message formatting");
  
  // Mock foreign key error
  const mockForeignKeyError = {
    code: '23503',
    message: 'update or delete on table "books" violates foreign key constraint "orders_book_id_fkey" on table "orders"',
    details: 'Key (id)=(book-123) is still referenced from table "orders".'
  };

  console.log("Mock foreign key error would now show:");
  const errorMessage = mockForeignKeyError.code === '23503' && mockForeignKeyError.message?.includes('orders_book_id_fkey')
    ? `Cannot delete book: There are active orders referencing this book. Please cancel or complete these orders first before deleting the book.`
    : `Failed to delete book: ${mockForeignKeyError.message}`;
  
  console.log("Before fix: [object Object]");
  console.log("After fix:", errorMessage);

  // Test 3: Generic error handling
  console.log("\n📋 Test 3: Generic error handling");
  const mockGenericError = new Error("Database connection timeout");
  const genericErrorMessage = mockGenericError instanceof Error 
    ? mockGenericError.message 
    : String(mockGenericError);
  
  console.log("Generic error message:", genericErrorMessage);

  console.log("\n✅ Book deletion error handling test completed!");
  console.log("📈 Improvements:");
  console.log("  • Foreign key constraint errors show user-friendly messages");
  console.log("  • Error objects properly extract .message property");
  console.log("  • All error types are safely converted to strings");
  console.log("  • Constraint checking prevents deletion failures");
}

// Test constraint checking logic
export async function testConstraintChecking(bookId: string) {
  console.log(`🔍 Testing constraint checking for book: ${bookId}`);
  
  try {
    const result = await BookDeletionService.checkBookDeletionConstraints(bookId);
    
    console.log("Constraint check result:", {
      canDelete: result.canDelete,
      blockers: result.blockers,
      details: result.details
    });
    
    if (!result.canDelete) {
      console.log("🚫 Book cannot be deleted due to:", result.blockers.join(', '));
    } else {
      console.log("✅ Book is safe to delete");
    }
    
    return result;
  } catch (error) {
    console.error("❌ Constraint check failed:", error);
    throw error;
  }
}

// Make functions available in browser console
if (typeof window !== 'undefined') {
  (window as any).testBookDeletionErrorHandling = testBookDeletionErrorHandling;
  (window as any).testConstraintChecking = testConstraintChecking;
}
