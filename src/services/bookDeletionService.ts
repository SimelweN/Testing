import { supabase } from "@/integrations/supabase/client";
import { addNotification } from "./notificationService";
import { logError } from "@/utils/errorUtils";

export interface BookDeletionNotificationData {
  bookId: string;
  bookTitle: string;
  sellerId: string;
  reason: "admin_action" | "violation_reports" | "content_policy";
  adminId?: string;
}

/**
 * Service to handle book deletion notifications
 */
export class BookDeletionService {
  /**
   * Send notification when a book listing is deleted
   */
  static async notifyBookDeletion(
    data: BookDeletionNotificationData,
  ): Promise<void> {
    try {
      console.log("Sending book deletion notification:", data);

      // Prepare notification message based on deletion reason
      const subject = "Book Listing Removed";
      let message = `Your book listing "${data.bookTitle}" has been removed because it did not comply with ReBooked Solutions' guidelines outlined in our Terms and Conditions.\n\n`;

      if (data.reason === "violation_reports") {
        message +=
          "This may be due to multiple user reports or a violation of our content policies. ";
      } else if (data.reason === "admin_action") {
        message += "This action was taken by our moderation team. ";
      } else if (data.reason === "content_policy") {
        message += "This may be due to a violation of our content policies. ";
      }

      message +=
        "You may list the book again if it meets our standards.\n\nThank you for understanding.";

      // Send in-app notification
      await addNotification({
        userId: data.sellerId,
        title: subject,
        message: message,
        type: "warning",
        read: false,
      });

      // Log the notification for potential email/push notification processing
      console.log("Book deletion notification sent successfully:", {
        sellerId: data.sellerId,
        bookTitle: data.bookTitle,
        reason: data.reason,
      });
    } catch (error) {
      logError("BookDeletionService.notifyBookDeletion", error, {
        bookId: data.bookId,
        sellerId: data.sellerId,
      });
      throw new Error("Failed to send book deletion notification");
    }
  }

  /**
   * Get detailed information about what's blocking book deletion
   */
  static async getBookDeletionBlockers(bookId: string): Promise<{
    activeOrders: Array<{ id: string; status: string; buyer_email: string }>;
    saleCommitments: Array<{ id: string; status: string; user_id: string }>;
    reports: Array<{ id: string; reason: string; created_at: string }>;
    transactions: Array<{ id: string; status: string; amount: number }>;
  }> {
    try {
      const results = {
        activeOrders: [] as Array<{ id: string; status: string; buyer_email: string }>,
        saleCommitments: [] as Array<{ id: string; status: string; user_id: string }>,
        reports: [] as Array<{ id: string; reason: string; created_at: string }>,
        transactions: [] as Array<{ id: string; status: string; amount: number }>,
      };

      // Get detailed order information
      try {
        const { data: orders } = await supabase
          .from('orders')
          .select('id, status, buyer_email')
          .contains('items', [{ book_id: bookId }])
          .neq('status', 'cancelled')
          .neq('status', 'refunded');

        if (orders) {
          results.activeOrders = orders;
        }
      } catch (error) {
        console.warn('Could not fetch order details:', error);
      }

      // Get sale commitments
      const { data: commitments } = await supabase
        .from('sale_commitments')
        .select('id, status, user_id')
        .eq('book_id', bookId)
        .neq('status', 'cancelled');

      if (commitments) {
        results.saleCommitments = commitments;
      }

      // Get reports
      const { data: reports } = await supabase
        .from('reports')
        .select('id, reason, created_at')
        .eq('book_id', bookId);

      if (reports) {
        results.reports = reports;
      }

      // Get transactions
      const { data: transactions } = await supabase
        .from('transactions')
        .select('id, status, amount')
        .eq('book_id', bookId);

      if (transactions) {
        results.transactions = transactions;
      }

      return results;
    } catch (error) {
      console.warn('Error fetching book deletion blockers:', error);
      return {
        activeOrders: [],
        saleCommitments: [],
        reports: [],
        transactions: [],
      };
    }
  }

  /**
   * Check if a book can be safely deleted (no foreign key constraints)
   */
  static async checkBookDeletionConstraints(bookId: string): Promise<{
    canDelete: boolean;
    blockers: string[];
    details: {
      activeOrders: number;
      saleCommitments: number;
      reports: number;
      transactions: number;
    };
  }> {
    try {
      const blockers: string[] = [];
      const details = {
        activeOrders: 0,
        saleCommitments: 0,
        reports: 0,
        transactions: 0,
      };

      // Check for orders with book_id (if the column exists)
      try {
        const { data: orders, error: ordersError } = await supabase
          .from('orders')
          .select('id')
          .contains('items', [{ book_id: bookId }])
          .neq('status', 'cancelled')
          .neq('status', 'refunded');

        if (!ordersError && orders) {
          details.activeOrders = orders.length;
          if (orders.length > 0) {
            blockers.push(`${orders.length} active order(s)`);
          }
        }
      } catch (orderCheckError) {
        console.warn('Could not check orders table:', orderCheckError);
      }

      // Check for sale commitments
      const { data: commitments, error: commitError } = await supabase
        .from('sale_commitments')
        .select('id')
        .eq('book_id', bookId)
        .neq('status', 'cancelled');

      if (!commitError && commitments) {
        details.saleCommitments = commitments.length;
        if (commitments.length > 0) {
          blockers.push(`${commitments.length} active sale commitment(s)`);
        }
      }

      // Check for reports
      const { data: reports, error: reportsError } = await supabase
        .from('reports')
        .select('id')
        .eq('book_id', bookId);

      if (!reportsError && reports) {
        details.reports = reports.length;
        // Reports don't block deletion but we track them
      }

      // Check for transactions
      const { data: transactions, error: transError } = await supabase
        .from('transactions')
        .select('id')
        .eq('book_id', bookId);

      if (!transError && transactions) {
        details.transactions = transactions.length;
        if (transactions.length > 0) {
          blockers.push(`${transactions.length} payment transaction(s)`);
        }
      }

      return {
        canDelete: blockers.length === 0,
        blockers,
        details,
      };
    } catch (error) {
      logError('BookDeletionService.checkBookDeletionConstraints', error);
      return {
        canDelete: false,
        blockers: ['Unable to verify deletion constraints'],
        details: {
          activeOrders: 0,
          saleCommitments: 0,
          reports: 0,
          transactions: 0,
        },
      };
    }
  }

  /**
   * Delete a book and send notification to seller
   */
  static async deleteBookWithNotification(
    bookId: string,
    reason: "admin_action" | "violation_reports" | "content_policy",
    adminId?: string,
    forceDelete: boolean = false,
  ): Promise<void> {
    try {
      console.log("Deleting book with notification:", {
        bookId,
        reason,
        adminId,
      });

      // First, get book details before deletion
      const { data: book, error: bookError } = await supabase
        .from("books")
        .select("id, title, seller_id")
        .eq("id", bookId)
        .single();

      if (bookError) {
        logError(
          "BookDeletionService.deleteBookWithNotification - fetch book",
          bookError,
        );
        throw new Error("Failed to fetch book details before deletion");
      }

      if (!book) {
        throw new Error("Book not found");
      }

      // Check for foreign key constraints before deletion
      console.log('Checking deletion constraints for book:', bookId);
      const constraintCheck = await BookDeletionService.checkBookDeletionConstraints(bookId);

      if (!constraintCheck.canDelete) {
        if (!forceDelete) {
          const blockersList = constraintCheck.blockers.join(', ');
          throw new Error(
            `Cannot delete book: This book is referenced by ${blockersList}. ` +
            'Please resolve these dependencies before deleting the book.'
          );
        }

        // Force delete: Handle active orders and commitments
        console.log('Force delete requested, cancelling active orders and commitments...');

        // Cancel active orders using multiple approaches
        if (constraintCheck.details.activeOrders > 0) {
          console.log('Cancelling active orders...');

          // Approach 1: Try orders with direct book_id column (if it exists)
          try {
            const { data: directOrders, error: directError } = await supabase
              .from('orders')
              .select('id, status')
              .eq('book_id', bookId)
              .neq('status', 'cancelled')
              .neq('status', 'refunded');

            if (!directError && directOrders && directOrders.length > 0) {
              for (const order of directOrders) {
                await supabase
                  .from('orders')
                  .update({
                    status: 'cancelled',
                    cancelled_at: new Date().toISOString(),
                    cancellation_reason: `Book deleted by admin - Book ID: ${bookId}`,
                  })
                  .eq('id', order.id);
              }
              console.log(`Cancelled ${directOrders.length} orders with direct book_id`);
            }
          } catch (error) {
            console.log('No direct book_id column, trying items JSON approach...');
          }

          // Approach 2: Try orders with book_id in items JSON
          try {
            const { data: itemOrders } = await supabase
              .from('orders')
              .select('id, status, items')
              .neq('status', 'cancelled')
              .neq('status', 'refunded');

            if (itemOrders) {
              const relevantOrders = itemOrders.filter(order => {
                if (!order.items || !Array.isArray(order.items)) return false;
                return order.items.some((item: any) => item.book_id === bookId);
              });

              for (const order of relevantOrders) {
                await supabase
                  .from('orders')
                  .update({
                    status: 'cancelled',
                    cancelled_at: new Date().toISOString(),
                    cancellation_reason: `Book deleted by admin - Book ID: ${bookId}`,
                  })
                  .eq('id', order.id);
              }
              console.log(`Cancelled ${relevantOrders.length} orders with book_id in items`);
            }
          } catch (error) {
            console.warn('Error cancelling orders via items JSON:', error);
          }
        }

        // Cancel active sale commitments
        if (constraintCheck.details.saleCommitments > 0) {
          try {
            await supabase
              .from('sale_commitments')
              .update({
                status: 'cancelled',
                updated_at: new Date().toISOString(),
              })
              .eq('book_id', bookId)
              .neq('status', 'cancelled');

            console.log(`Cancelled ${constraintCheck.details.saleCommitments} sale commitments`);
          } catch (error) {
            console.warn('Error cancelling commitments during force delete:', error);
          }
        }

        console.log('Force delete cleanup completed, proceeding with deletion...');
      }

      console.log('Book is safe to delete, proceeding...');

      // Delete the book
      const { error: deleteError } = await supabase
        .from("books")
        .delete()
        .eq("id", bookId);

      if (deleteError) {
        // Log the error with proper serialization
        console.error("[BookDeletionService.deleteBookWithNotification - delete]", {
          message: deleteError.message || 'Unknown error',
          code: deleteError.code,
          details: deleteError.details,
          hint: deleteError.hint,
          bookId,
          timestamp: new Date().toISOString()
        });

        // Handle foreign key constraint errors specifically
        if (deleteError.code === '23503' && deleteError.message?.includes('orders_book_id_fkey')) {
          if (forceDelete) {
            // If this is a force delete, try additional cleanup approaches
            console.log('Foreign key constraint still blocking, trying additional cleanup...');

            try {
              // Try to delete orders with book_id column directly (if it exists)
              const { error: directDeleteError } = await supabase
                .from("orders")
                .delete()
                .eq("book_id", bookId);

              if (!directDeleteError) {
                console.log('Successfully deleted orders with direct book_id reference');

                // Try book deletion again
                const { error: retryDeleteError } = await supabase
                  .from("books")
                  .delete()
                  .eq("id", bookId);

                if (!retryDeleteError) {
                  console.log('Book deleted successfully after additional cleanup');
                  // Continue to notification logic
                } else {
                  throw new Error(`Force delete failed even after cleanup: ${retryDeleteError.message}`);
                }
              } else {
                throw new Error(`Cannot force delete: Unable to remove foreign key dependencies. Error: ${deleteError.message}`);
              }
            } catch (cleanupError) {
              throw new Error(`Force delete failed: ${cleanupError instanceof Error ? cleanupError.message : String(cleanupError)}`);
            }
          } else {
            throw new Error(`Cannot delete book: There are active orders referencing this book. Please cancel or complete these orders first before deleting the book.`);
          }
        }

        const errorMessage = deleteError.message || String(deleteError);
        throw new Error(`Failed to delete book: ${errorMessage}`);
      }

      // Send notification to the seller
      try {
        await BookDeletionService.notifyBookDeletion({
          bookId: book.id,
          bookTitle: book.title,
          sellerId: book.seller_id,
          reason,
          adminId,
        });
      } catch (notificationError) {
        console.warn(
          "Book deleted but notification failed:",
          notificationError,
        );
        // Don't fail the entire operation if notification fails
      }

      console.log("Book deleted and notification sent successfully:", bookId);
    } catch (error) {
      // Log error with proper serialization instead of using logError
      console.error("[BookDeletionService.deleteBookWithNotification]", {
        message: error instanceof Error ? error.message : String(error),
        name: error instanceof Error ? error.name : undefined,
        stack: error instanceof Error ? error.stack : undefined,
        bookId,
        reason,
        adminId,
        timestamp: new Date().toISOString()
      });

      // Ensure we're throwing proper error messages
      if (error instanceof Error) {
        throw error;
      }

      const errorMessage = typeof error === 'string' ? error : String(error);
      throw new Error(`Book deletion failed: ${errorMessage}`);
    }
  }

  /**
   * Check if a user has pickup address for listing validation
   */
  static async validateUserCanListBooks(userId: string): Promise<{
    canList: boolean;
    message?: string;
  }> {
    try {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("pickup_address")
        .eq("id", userId)
        .single();

      if (error) {
        logError("BookDeletionService.validateUserCanListBooks", error, {
          userId,
        });
        return {
          canList: false,
          message: "Unable to verify profile information",
        };
      }

      if (!profile?.pickup_address) {
        return {
          canList: false,
          message: "You need to add a pickup address before listing a book.",
        };
      }

      // Check if pickup address has required fields
      const pickupAddr = profile.pickup_address as any;
      if (
        !pickupAddr.streetAddress ||
        !pickupAddr.city ||
        !pickupAddr.province ||
        !pickupAddr.postalCode
      ) {
        return {
          canList: false,
          message:
            "Please complete your pickup address information before listing a book.",
        };
      }

      return { canList: true };
    } catch (error) {
      logError("BookDeletionService.validateUserCanListBooks", error, {
        userId,
      });
      return {
        canList: false,
        message: "Unable to verify pickup address",
      };
    }
  }

  /**
   * Deactivate all user listings when pickup address is removed
   */
  static async deactivateUserListings(userId: string): Promise<void> {
    try {
      console.log("Deactivating all listings for user:", userId);

      // Update all active listings to be unavailable
      const { error: updateError } = await supabase
        .from("books")
        .update({
          status: "unavailable",
          updated_at: new Date().toISOString(),
        })
        .eq("seller_id", userId)
        .eq("sold", false);

      if (updateError) {
        logError(
          "BookDeletionService.deactivateUserListings - update books",
          updateError,
        );
        throw new Error("Failed to deactivate user listings");
      }

      // Send notification to user about deactivated listings
      await addNotification({
        userId,
        title: "Listings Deactivated",
        message:
          "Your listing is currently unavailable because you removed your pickup address. Please add a pickup address to reactivate your listing(s).",
        type: "warning",
        read: false,
      });

      console.log("Successfully deactivated all listings for user:", userId);
    } catch (error) {
      logError("BookDeletionService.deactivateUserListings", error, {
        userId,
      });
      throw error;
    }
  }

  /**
   * Reactivate user listings when pickup address is added back
   */
  static async reactivateUserListings(userId: string): Promise<void> {
    try {
      console.log("Reactivating listings for user:", userId);

      // Update unavailable listings back to active
      const { error: updateError } = await supabase
        .from("books")
        .update({
          status: "active",
          updated_at: new Date().toISOString(),
        })
        .eq("seller_id", userId)
        .eq("status", "unavailable")
        .eq("sold", false);

      if (updateError) {
        logError(
          "BookDeletionService.reactivateUserListings - update books",
          updateError,
        );
        throw new Error("Failed to reactivate user listings");
      }

      // Send positive notification
      await addNotification({
        userId,
        title: "Listings Reactivated",
        message:
          "Your listings have been reactivated now that you have added a pickup address.",
        type: "success",
        read: false,
      });

      console.log("Successfully reactivated listings for user:", userId);
    } catch (error) {
      logError("BookDeletionService.reactivateUserListings", error, {
        userId,
      });
      throw error;
    }
  }
}

export default BookDeletionService;
