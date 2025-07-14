import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Calendar, Store } from "lucide-react";

interface SellerInfoProps {
  seller: {
    id: string;
    name: string;
    email: string;
  };
  onViewProfile: () => void;
}

const SellerInfo = ({ seller, onViewProfile }: SellerInfoProps) => {
  console.log("SellerInfo received seller data:", seller);

  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="font-semibold text-lg mb-3">About the Seller</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-gray-500" />
            <span className="font-medium">{seller?.name || "Loading..."}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600">
              Member since {new Date().getFullYear()}
            </span>
          </div>
        </div>
        <div className="mt-4 space-y-3">
          <Button
            onClick={onViewProfile}
            className="w-full bg-book-600 hover:bg-book-700"
          >
            <Store className="h-4 w-4 mr-2" />
            View {seller?.name}'s ReBooked Mini
          </Button>
          <div className="p-3 bg-book-50 rounded-lg">
            <p className="text-sm text-book-800">
              🛍️ See all books from this seller in their mini storefront
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SellerInfo;
