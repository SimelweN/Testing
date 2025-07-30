import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BookDeletionService } from '@/services/bookDeletionService';
import { toast } from 'sonner';
import { AlertTriangle, Trash2, Eye, X } from 'lucide-react';

interface BookDeletionManagerProps {
  bookId: string;
  bookTitle: string;
  onDeleteSuccess: () => void;
  onCancel: () => void;
}

interface BlockerDetails {
  activeOrders: Array<{ id: string; status: string; buyer_email: string }>;
  saleCommitments: Array<{ id: string; status: string; user_id: string }>;
  reports: Array<{ id: string; reason: string; created_at: string }>;
  transactions: Array<{ id: string; status: string; amount: number }>;
}

export default function BookDeletionManager({ 
  bookId, 
  bookTitle, 
  onDeleteSuccess, 
  onCancel 
}: BookDeletionManagerProps) {
  const [isChecking, setIsChecking] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [canDelete, setCanDelete] = useState<boolean | null>(null);
  const [blockers, setBlockers] = useState<string[]>([]);
  const [blockerDetails, setBlockerDetails] = useState<BlockerDetails | null>(null);

  const checkDeletionConstraints = async () => {
    setIsChecking(true);
    try {
      const [constraintCheck, details] = await Promise.all([
        BookDeletionService.checkBookDeletionConstraints(bookId),
        BookDeletionService.getBookDeletionBlockers(bookId)
      ]);

      setCanDelete(constraintCheck.canDelete);
      setBlockers(constraintCheck.blockers);
      setBlockerDetails(details);

      if (!constraintCheck.canDelete) {
        toast.warning(`Cannot delete book: ${constraintCheck.blockers.join(', ')}`);
      } else {
        toast.success('Book is safe to delete');
      }
    } catch (error) {
      console.error('Error checking deletion constraints:', error);
      toast.error('Failed to check deletion constraints');
    } finally {
      setIsChecking(false);
    }
  };

  const performDeletion = async () => {
    if (!canDelete) {
      toast.error('Cannot delete book due to active references');
      return;
    }

    setIsDeleting(true);
    try {
      await BookDeletionService.deleteBookWithNotification(bookId, 'admin_action');
      toast.success('Book deleted successfully');
      onDeleteSuccess();
    } catch (error) {
      console.error('Error deleting book:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast.error(`Failed to delete book: ${errorMessage}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trash2 className="h-5 w-5 text-destructive" />
          Delete Book: {bookTitle}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Step 1: Check constraints */}
        <div className="space-y-2">
          <h3 className="font-medium">Step 1: Check Deletion Constraints</h3>
          <Button 
            onClick={checkDeletionConstraints} 
            disabled={isChecking}
            variant="outline"
            className="w-full"
          >
            <Eye className="h-4 w-4 mr-2" />
            {isChecking ? 'Checking...' : 'Check if book can be deleted'}
          </Button>
        </div>

        {/* Results */}
        {canDelete !== null && (
          <div className="space-y-4">
            {canDelete ? (
              <Alert className="border-green-200 bg-green-50">
                <AlertDescription className="text-green-800">
                  ✅ Book can be safely deleted. No active references found.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert className="border-orange-200 bg-orange-50">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-orange-800">
                  ⚠️ Cannot delete book. Found: {blockers.join(', ')}
                </AlertDescription>
              </Alert>
            )}

            {/* Detailed blocker information */}
            {blockerDetails && !canDelete && (
              <div className="space-y-3">
                <h4 className="font-medium text-sm">Blocking References:</h4>
                
                {blockerDetails.activeOrders.length > 0 && (
                  <div className="border rounded p-3 bg-gray-50">
                    <h5 className="font-medium text-sm mb-2">Active Orders ({blockerDetails.activeOrders.length})</h5>
                    <div className="space-y-1">
                      {blockerDetails.activeOrders.map((order) => (
                        <div key={order.id} className="flex items-center justify-between text-sm">
                          <span>Order {order.id.slice(0, 8)}...</span>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{order.status}</Badge>
                            <span className="text-gray-600">{order.buyer_email}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {blockerDetails.saleCommitments.length > 0 && (
                  <div className="border rounded p-3 bg-gray-50">
                    <h5 className="font-medium text-sm mb-2">Sale Commitments ({blockerDetails.saleCommitments.length})</h5>
                    <div className="space-y-1">
                      {blockerDetails.saleCommitments.map((commitment) => (
                        <div key={commitment.id} className="flex items-center justify-between text-sm">
                          <span>Commitment {commitment.id.slice(0, 8)}...</span>
                          <Badge variant="outline">{commitment.status}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {blockerDetails.transactions.length > 0 && (
                  <div className="border rounded p-3 bg-gray-50">
                    <h5 className="font-medium text-sm mb-2">Transactions ({blockerDetails.transactions.length})</h5>
                    <div className="space-y-1">
                      {blockerDetails.transactions.map((transaction) => (
                        <div key={transaction.id} className="flex items-center justify-between text-sm">
                          <span>Transaction {transaction.id.slice(0, 8)}...</span>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{transaction.status}</Badge>
                            <span className="text-gray-600">R{transaction.amount}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Alert>
                  <AlertDescription>
                    💡 <strong>Next Steps:</strong> To delete this book, you need to cancel or complete the above orders/commitments first. 
                    Contact the buyers/sellers or use the order management tools to resolve these dependencies.
                  </AlertDescription>
                </Alert>
              </div>
            )}

            {/* Step 2: Delete */}
            <div className="space-y-2">
              <h3 className="font-medium">Step 2: Delete Book</h3>
              <div className="flex gap-2">
                <Button
                  onClick={performDeletion}
                  disabled={!canDelete || isDeleting}
                  variant="destructive"
                  className="flex-1"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {isDeleting ? 'Deleting...' : 'Delete Book'}
                </Button>
                <Button onClick={onCancel} variant="outline">
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
