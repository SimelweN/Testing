import { useState, useCallback } from "react";
import {
  commitBookSale,
  getCommitPendingBooks,
} from "@/services/commitService";
import { toast } from "sonner";

interface UseCommitReturn {
  isCommitting: boolean;
  commitBook: (bookId: string) => Promise<void>;
  pendingCommits: any[];
  refreshPendingCommits: () => Promise<void>;
  isLoading: boolean;
}

/**
 * Hook for managing book sale commits
 * Provides functionality for committing sales and tracking pending commits
 */
export const useCommit = (): UseCommitReturn => {
  const [isCommitting, setIsCommitting] = useState(false);
  const [pendingCommits, setPendingCommits] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const commitBook = useCallback(
    async (bookId: string) => {
      if (isCommitting) return;

      setIsCommitting(true);
      try {
        await commitBookSale(bookId);

        // Refresh pending commits after successful commit
        await refreshPendingCommits();

        toast.success(
          "Book sale committed successfully! Delivery process will begin shortly.",
        );
      } catch (error) {
        console.error("Failed to commit book sale:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Failed to commit sale";
        toast.error(errorMessage);
        throw error;
      } finally {
        setIsCommitting(false);
      }
    },
    [isCommitting],
  );

  const refreshPendingCommits = useCallback(async () => {
    setIsLoading(true);
    try {
      const pending = await getCommitPendingBooks();
      setPendingCommits(pending || []);
    } catch (error) {
      console.error("Failed to fetch pending commits:", error);
      // Set empty array instead of showing error to prevent UI crash
      setPendingCommits([]);
      // Only show error in development
      if (import.meta.env.DEV) {
        toast.error("Failed to fetch pending commits");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isCommitting,
    commitBook,
    pendingCommits,
    refreshPendingCommits,
    isLoading,
  };
};

export default useCommit;
