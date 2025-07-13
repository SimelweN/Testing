import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Layout from "@/components/Layout";
import ProfileHeader from "@/components/ProfileHeader";
import ShareProfileDialog from "@/components/ShareProfileDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { getUserBooks } from "@/services/book/bookQueries";
import { Book } from "@/types/book";
import { ArrowLeft, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { logError, getErrorMessage } from "@/utils/errorUtils";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  created_at: string;
}

const UserProfile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [userBooks, setUserBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);

  useEffect(() => {
    if (userId) {
      loadUserProfile();
      loadUserBooks();
    }
  }, [userId, loadUserProfile, loadUserBooks]);

  const loadUserProfile = async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, name, email, created_at")
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        logError("Error fetching user profile", error);
        toast.error(getErrorMessage(error, "Failed to load user profile"));
        return;
      }

      setProfile(data);
    } catch (error) {
      logError("Error loading profile", error);
      toast.error(getErrorMessage(error, "Failed to load user profile"));
    }
  };

  const loadUserBooks = async () => {
    if (!userId) return;

    try {
      setIsLoading(true);
      const books = await getUserBooks(userId);
      const activeBooks = books.filter((book) => !book.sold);
      setUserBooks(activeBooks);
    } catch (error) {
      logError("Error loading user books", error);
      toast.error(getErrorMessage(error, "Failed to load user books"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewBook = (bookId: string) => {
    navigate(`/books/${bookId}`);
  };

  const handleShareProfile = () => {
    setIsShareDialogOpen(true);
  };

  if (!profile && !isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-6 text-book-600"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <div className="text-center">
            <h2 className="text-2xl font-semibold mb-4">User not found</h2>
            <p className="text-gray-600">
              The user profile you're looking for doesn't exist.
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-book-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading profile...</p>
          </div>
        </div>
      </Layout>
    );
  }

  const userData = {
    id: profile?.id || "",
    name: profile?.name || "Anonymous User",
    joinDate: profile?.created_at || new Date().toISOString(),
    isVerified: false,
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-4 md:py-8 max-w-6xl">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-4 md:mb-6 text-book-600 p-2"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">Back</span>
        </Button>

        {/* Profile Header */}
        <div className="mb-6 md:mb-8">
          <ProfileHeader
            userData={userData}
            isOwnProfile={false}
            onShareProfile={handleShareProfile}
          />
        </div>

        {/* Active Listings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg md:text-xl lg:text-2xl">
              Active Listings ({userBooks.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {userBooks.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">
                  This user has no active listings.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {userBooks.map((book) => (
                  <div
                    key={book.id}
                    className="border rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow"
                  >
                    <img
                      src={book.frontCover || book.imageUrl}
                      alt={book.title}
                      className="w-full h-24 sm:h-32 object-cover rounded mb-3"
                    />
                    <h4 className="font-semibold text-sm truncate">
                      {book.title}
                    </h4>
                    <p className="text-xs text-gray-600 truncate">
                      by {book.author}
                    </p>
                    <p className="text-sm font-bold text-book-600 mt-2">
                      R{book.price}
                    </p>
                    <Button
                      onClick={() => handleViewBook(book.id)}
                      variant="outline"
                      size="sm"
                      className="w-full mt-3 text-xs"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View Book
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <ShareProfileDialog
          isOpen={isShareDialogOpen}
          onClose={() => setIsShareDialogOpen(false)}
          userId={profile?.id || ""}
          userName={profile?.name || "Anonymous User"}
          isOwnProfile={false}
        />
      </div>
    </Layout>
  );
};

export default UserProfile;
