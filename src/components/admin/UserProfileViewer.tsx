import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Book, Calendar, Mail, MapPin } from "lucide-react";
import { getUserProfile, AdminUser } from "@/services/admin/adminQueries";
import { getUserBooks } from "@/services/book/bookQueries";
import { Book as BookType } from "@/types/book";

interface UserProfileViewerProps {
  userId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

const UserProfileViewer = ({
  userId,
  isOpen,
  onClose,
}: UserProfileViewerProps) => {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [userBooks, setUserBooks] = useState<BookType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userId && isOpen) {
      loadUserProfile(userId);
    }
  }, [userId, isOpen]);

  const loadUserProfile = async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      console.log("Loading profile for user ID:", id);

      // Load profile and books separately to handle errors better
      const profilePromise = getUserProfile(id).catch((err) => {
        console.error("Error loading profile:", err);
        return null;
      });

      const booksPromise = getUserBooks(id).catch((err) => {
        console.error("Error loading books:", err);
        return [];
      });

      const [profileData, booksData] = await Promise.all([
        profilePromise,
        booksPromise,
      ]);

      console.log("Profile data loaded:", profileData);
      console.log("Books data loaded:", booksData?.length || 0, "books");

      if (!profileData && (!booksData || booksData.length === 0)) {
        setError("Failed to load user data. Please try again.");
        return;
      }

      setUser(profileData);
      setUserBooks(booksData || []);

      if (!profileData) {
        setError("User profile not found");
      }
    } catch (error) {
      console.error("Error loading user profile:", error);
      setError("Failed to load user profile");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !userId) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>User Profile</DialogTitle>
          <DialogDescription>
            View detailed user information and activity
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            <span className="ml-2">Loading user profile...</span>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-500 mb-2">{error}</p>
            <Button
              onClick={() => userId && loadUserProfile(userId)}
              variant="outline"
              size="sm"
            >
              Try Again
            </Button>
          </div>
        ) : user ? (
          <div className="space-y-6">
            {/* User Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src="" />
                    <AvatarFallback>
                      <User className="h-8 w-8" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-xl font-semibold">{user.name}</h3>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        user.status === "active" ? "default" : "destructive"
                      }
                    >
                      {user.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    Joined {new Date(user.createdAt).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Book className="h-4 w-4" />
                    {user.listingsCount} listings
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* User's Books */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Book className="h-5 w-5" />
                  Book Listings ({userBooks.length})
                </CardTitle>
                <CardDescription>All books listed by this user</CardDescription>
              </CardHeader>
              <CardContent>
                {userBooks.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">
                    No books listed yet
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {userBooks.map((book) => (
                      <div key={book.id} className="border rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <img
                            src={book.frontCover || book.imageUrl}
                            alt={book.title}
                            className="w-16 h-20 object-cover rounded"
                          />
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">
                              {book.title}
                            </h4>
                            <p className="text-xs text-gray-600">
                              {book.author}
                            </p>
                            <div className="flex items-center justify-between mt-2">
                              <span className="font-semibold text-green-600">
                                R{book.price.toFixed(2)}
                              </span>
                              <Badge
                                variant={book.sold ? "destructive" : "default"}
                                className="text-xs"
                              >
                                {book.sold ? "Sold" : "Active"}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">User not found</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default UserProfileViewer;
