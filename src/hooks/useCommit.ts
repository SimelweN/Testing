import { useState, useCallback } from "react";
import {
  commitBookSale,
  declineBookSale,
  getCommitPendingBooks,
} from "@/services/commitService";
import { toast } from "sonner";

interface PendingCommit {
  id: string;
  bookId: string;
  title: string;
  expiresAt: string;
  bookTitle: string;
  buyerName: string;
  price: number;
  earnings?: number;
  platformFee?: number;
  author?: string;
  imageUrl?: string;
  condition?: string;
  buyerEmail?: string;
}

interface UseCommitReturn {
  isCommitting: boolean;
  isDeclining: boolean;
  commitBook: (bookId: string) => Promise<void>;
  declineBook: (bookId: string) => Promise<void>;
  pendingCommits: PendingCommit[];
  refreshPendingCommits: () => Promise<void>;
  isLoading: boolean;
}

/**
 * Hook for managing book sale commits
 * Provides functionality for committing sales and tracking pending commits
 */
export const useCommit = (): UseCommitReturn => {
  const [isCommitting, setIsCommitting] = useState(false);
  const [isDeclining, setIsDeclining] = useState(false);
  const [pendingCommits, setPendingCommits] = useState<PendingCommit[]>([]);
  const [isLoading, setIsLoading] = useState(false);

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
    [isCommitting, refreshPendingCommits],
  );

  const declineBook = useCallback(
    async (bookId: string) => {
      if (isDeclining) return;

      setIsDeclining(true);
      try {
        await declineBookSale(bookId);

        // Refresh pending commits after successful decline
        await refreshPendingCommits();

        toast.success(
          "Sale declined successfully. The book is now available again and the buyer will receive a full refund.",
        );
      } catch (error) {
        console.error("Failed to decline book sale:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Failed to decline sale";
        toast.error(errorMessage);
        throw error;
      } finally {
        setIsDeclining(false);
      }
    },
    [isDeclining, refreshPendingCommits],
  );

  return {
    isCommitting,
    isDeclining,
    commitBook,
    declineBook,
    pendingCommits,
    refreshPendingCommits,
    isLoading,
  };
};

export default useCommit;
