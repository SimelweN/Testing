import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, AlertTriangle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AdminListing } from "@/services/admin/adminQueries";
import { useIsMobile } from "@/hooks/use-mobile";
import { clearAllBooks } from "@/utils/clearAllBooks";
import { toast } from "sonner";
import { useState } from "react";

interface AdminListingsTabProps {
  listings: AdminListing[];
  onListingAction: (listingId: string, action: "delete") => void;
}

const AdminListingsTab = ({
  listings,
  onListingAction,
}: AdminListingsTabProps) => {
  const isMobile = useIsMobile();
  const [isClearing, setIsClearing] = useState(false);

  const handleClearAllBooks = async () => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ALL ${listings.length} books? This action cannot be undone.`,
    );

    if (!confirmed) return;

    setIsClearing(true);
    try {
      const result = await clearAllBooks();

      if (result.success) {
        toast.success(result.message);
        // Reload the page to refresh listings
        window.location.reload();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error(
        "Error clearing books:",
        error instanceof Error ? error.message : String(error),
      );
      toast.error("Failed to clear books");
    } finally {
      setIsClearing(false);
    }
  };

  if (!listings || listings.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg md:text-xl">
            Book Listings Management
          </CardTitle>
          <CardDescription className="text-sm">
            No listings found at the moment
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8">
          <p className="text-gray-500">No book listings to display</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="text-lg md:text-xl">
              Book Listings Management
            </CardTitle>
            <CardDescription className="text-sm">
              All listings are auto-approved and go live immediately (
              {listings.length} total)
            </CardDescription>
          </div>
          <Button
            onClick={handleClearAllBooks}
            disabled={isClearing || listings.length === 0}
            variant="destructive"
            size="sm"
            className="flex items-center gap-2"
          >
            <AlertTriangle className="h-4 w-4" />
            {isClearing
              ? "Clearing..."
              : `Clear All Books (${listings.length})`}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0 md:p-6">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs md:text-sm min-w-[120px]">
                  Title
                </TableHead>
                <TableHead className="text-xs md:text-sm min-w-[100px]">
                  Author
                </TableHead>
                <TableHead className="text-xs md:text-sm min-w-[80px]">
                  Price
                </TableHead>
                <TableHead className="text-xs md:text-sm min-w-[80px]">
                  Status
                </TableHead>
                <TableHead className="text-xs md:text-sm min-w-[100px]">
                  Seller
                </TableHead>
                <TableHead className="text-xs md:text-sm min-w-[80px] text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {listings.map((listing) => (
                <TableRow key={listing.id}>
                  <TableCell className="text-xs md:text-sm font-medium max-w-[150px] truncate">
                    {listing.title}
                  </TableCell>
                  <TableCell className="text-xs md:text-sm max-w-[120px] truncate">
                    {listing.author}
                  </TableCell>
                  <TableCell className="text-xs md:text-sm">
                    R{listing.price}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        listing.status === "active" ? "default" : "secondary"
                      }
                      className="text-xs"
                    >
                      {listing.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs md:text-sm max-w-[120px] truncate">
                    {listing.user}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => onListingAction(listing.id, "delete")}
                      className="h-7 w-7 p-0 md:h-8 md:w-auto md:px-2"
                    >
                      <Trash2 className="h-3 w-3 md:h-4 md:w-4" />
                      {!isMobile && <span className="ml-1">Delete</span>}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminListingsTab;
