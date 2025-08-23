import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  User,
  BookOpen,
  Settings,
  MapPin,
  CreditCard,
  Plus,
  Edit,
  Trash2,
  AlertTriangle,
  Mail,
  Calendar,
  Package,
  TrendingUp,
  Share2,
  Eye,
} from "lucide-react";
import { getUserBooks } from "@/services/book/bookQueries";
import { deleteBook } from "@/services/book/bookMutations";
import { saveUserAddresses, getUserAddresses, updateBooksPickupAddress } from "@/services/addressService";
import { Book } from "@/types/book";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import ModernAddressTab from "@/components/profile/ModernAddressTab";
import BankingProfileTab from "@/components/profile/BankingProfileTab";
import ShareProfileDialog from "@/components/ShareProfileDialog";
import ShareReminderBanner from "@/components/ShareReminderBanner";
import ProfileEditDialog from "@/components/ProfileEditDialog";
import TransparencyModal from "@/components/TransparencyModal";
import { UserProfile, AddressData, Address } from "@/types/address";
import { handleAddressError, getUserFriendlyErrorMessage } from "@/utils/errorDisplayUtils";

const Profile = () => {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState("overview");
  const [activeListings, setActiveListings] = useState<Book[]>([]);
  const [isLoadingListings, setIsLoadingListings] = useState(true);
    const [addressData, setAddressData] = useState<AddressData | null>(null);
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);
  const [deletingBooks, setDeletingBooks] = useState<Set<string>>(new Set());
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isTransparencyModalOpen, setIsTransparencyModalOpen] = useState(false);

  const loadActiveListings = useCallback(async () => {
    if (!user?.id) return;

    try {
      setIsLoadingListings(true);
      const books = await getUserBooks(user.id);
      const activeBooks = Array.isArray(books)
        ? books.filter((book) => !book.sold)
        : [];
      setActiveListings(activeBooks);
    } catch (error) {
      console.error("Error loading active listings:", error);
      toast.error("Failed to load active listings");
      setActiveListings([]);
    } finally {
      setIsLoadingListings(false);
    }
  }, [user?.id]);

  const loadUserAddresses = useCallback(async () => {
    if (!user?.id) return;

    try {
      const data = await getUserAddresses(user.id);
      setAddressData(data);
    } catch (error) {
      const formattedError = handleAddressError(error, "load");
      console.error(formattedError.developerMessage, formattedError.originalError);
      toast.error(formattedError.userMessage);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      loadActiveListings();
      loadUserAddresses();
    }
  }, [user?.id, loadActiveListings, loadUserAddresses]);

  const handleDeleteBook = async (bookId: string, bookTitle: string) => {
    if (!bookId) {
      toast.error("Book ID is missing");
      return;
    }

    if (
      !confirm(
        `Are you sure you want to delete "${bookTitle}"? This action cannot be undone.`,
      )
    ) {
      return;
    }

    setDeletingBooks((prev) => new Set(prev).add(bookId));

    try {
      await deleteBook(bookId, false); // Normal delete first
      toast.success("Book deleted successfully");
      await loadActiveListings();
    } catch (error: unknown) {
      // If deletion failed due to active orders, offer force delete option for admins
      const errorMessage = error instanceof Error ? error.message : String(error);

      if (errorMessage.includes("active order(s)") && profile?.is_admin) {
        const forceConfirm = confirm(
          `${errorMessage}\n\nAs an admin, you can force delete this book which will:\n` +
          "• Cancel all active orders for this book\n" +
          "• Trigger refunds for buyers\n" +
          "• Permanently remove the book\n\n" +
          "Do you want to force delete?"
        );

        if (forceConfirm) {
          try {
            await deleteBook(bookId, true); // Force delete
            toast.success("Book force deleted successfully - orders cancelled and refunds initiated");
            await loadActiveListings();
          } catch (forceError: unknown) {
            const forceErrorMessage = forceError instanceof Error ? forceError.message : String(forceError);
            toast.error(`Force delete failed: ${forceErrorMessage}`);
          }
        }
      } else {
        const errorMessage = error instanceof Error ? error.message : String(error);
        toast.error(`Failed to delete book: ${errorMessage}`);
      }
    } finally {
      setDeletingBooks((prev) => {
        const newSet = new Set(prev);
        newSet.delete(bookId);
        return newSet;
      });
    }
  };

  const handleEditBook = (bookId: string) => {
    if (!bookId) {
      toast.error("Book ID is missing");
      return;
    }
    navigate(`/edit-book/${bookId}`);
  };

  const handleSaveAddresses = async (
    pickup: Address,
    shipping: Address,
    same: boolean,
  ) => {
    if (!user?.id) return;

    setIsLoadingAddress(true);
    try {
      await saveUserAddresses(user.id, pickup, shipping, same);
      await loadUserAddresses();

      // Update all user's book listings with the new pickup address and province
      try {
        const updateResult = await updateBooksPickupAddress(user.id, pickup);
        if (updateResult.success && updateResult.updatedCount > 0) {
          console.log(`Updated ${updateResult.updatedCount} book listings with new address and province`);
        }
      } catch (bookUpdateError) {
        console.warn("Failed to update book listings with new address:", bookUpdateError);
        // Don't fail the whole operation if book updates fail
      }

      toast.success("Addresses saved successfully");
    } catch (error) {
      const formattedError = handleAddressError(error, "save");
      console.error(formattedError.developerMessage, formattedError.originalError);
      toast.error(formattedError.userMessage);
      throw error;
    } finally {
      setIsLoadingAddress(false);
    }
  };

  if (!profile || !user) {
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

  const stats = {
    totalBooks: activeListings.length,
    totalValue: activeListings.reduce(
      (sum, book) => sum + (book.price || 0),
      0,
    ),
    avgPrice:
      activeListings.length > 0
        ? activeListings.reduce((sum, book) => sum + (book.price || 0), 0) /
          activeListings.length
        : 0,
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Profile Header */}
        <div className="mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                <Avatar className="w-20 h-20">
                  <AvatarFallback className="bg-book-100 text-book-600 text-xl font-semibold">
                    {profile.name?.charAt(0)?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-3">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                      {profile.name || "Anonymous User"}
                    </h1>
                    <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                      <div className="flex items-center gap-1">
                        <Mail className="w-4 h-4" />
                        {user.email}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Joined{" "}
                        {new Date().toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="flex flex-wrap gap-6">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-book-600" />
                      <span className="font-semibold">{stats.totalBooks}</span>
                      <span className="text-gray-600">Books Listed</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-green-600" />
                      <span className="font-semibold">
                        R{stats.totalValue.toFixed(0)}
                      </span>
                      <span className="text-gray-600">Total Value</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => setIsTransparencyModalOpen(true)}
                    variant="outline"
                    className="border-blue-600 text-blue-600 hover:bg-blue-50"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Transparency
                  </Button>

                  <Button
                    onClick={() => navigate("/create-listing")}
                    className="bg-book-600 hover:bg-book-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    List a Book
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              {!isMobile && "Overview"}
            </TabsTrigger>
            <TabsTrigger value="books" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              {!isMobile && "My Books"}
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              {!isMobile && "Settings"}
            </TabsTrigger>
            <TabsTrigger value="addresses" className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              {!isMobile && "Addresses"}
            </TabsTrigger>
          </TabsList>

                    {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <ShareReminderBanner
              userId={user?.id || ""}
              userName={profile?.name || ""}
              onShare={() => setIsShareDialogOpen(true)}
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <BookOpen className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats.totalBooks}</p>
                      <p className="text-gray-600">Active Listings</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-green-100 rounded-lg">
                      <TrendingUp className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">
                        R{stats.totalValue.toFixed(0)}
                      </p>
                      <p className="text-gray-600">Total Value</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-yellow-100 rounded-lg">
                      <TrendingUp className="w-6 h-6 text-yellow-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">
                        R{stats.avgPrice.toFixed(0)}
                      </p>
                      <p className="text-gray-600">Avg Price</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
                        </div>

            {/* Share Your Profile */}
            <Card className="bg-gradient-to-r from-book-50 to-book-100 border-book-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-book-800">
                      Share Your ReBooked Mini Page
                    </h3>
                    <p className="text-book-700 text-sm">
                      Share your profile to help your books sell faster! Post it on social media, send to classmates, or share in study groups.
                    </p>
                  </div>
                  <Button
                    onClick={() => setIsShareDialogOpen(true)}
                    className="bg-book-600 hover:bg-book-700 text-white"
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Share Profile
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activeListings.length === 0 ? (
                    <div className="text-center py-8">
                      <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No books listed yet</p>
                      <Button
                        onClick={() => navigate("/create-listing")}
                        className="mt-4 bg-book-600 hover:bg-book-700"
                      >
                        List Your First Book
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {activeListings.slice(0, 3).map((book) => (
                        <div
                          key={book.id}
                          className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg"
                        >
                          <img
                            src={
                              book.frontCover ||
                              book.imageUrl ||
                              "/placeholder.svg"
                            }
                            alt={book.title}
                            className="w-12 h-16 object-cover rounded"
                          />
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">
                              {book.title}
                            </h4>
                            <p className="text-sm text-gray-600">
                              by {book.author}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-book-600">
                              R{book.price}
                            </p>
                            <Badge variant="secondary" className="text-xs">
                              {book.condition}
                            </Badge>
                          </div>
                        </div>
                      ))}
                      {activeListings.length > 3 && (
                        <Button
                          variant="outline"
                          onClick={() => setActiveTab("books")}
                          className="w-full"
                        >
                          View All {activeListings.length} Books
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Books Tab */}
          <TabsContent value="books" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>My Books ({activeListings.length})</CardTitle>
                <Button
                  onClick={() => navigate("/create-listing")}
                  className="bg-book-600 hover:bg-book-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Book
                </Button>
              </CardHeader>
              <CardContent>
                {isLoadingListings ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-book-600 mx-auto"></div>
                    <p className="text-gray-600 mt-2">Loading books...</p>
                  </div>
                ) : activeListings.length === 0 ? (
                  <div className="text-center py-12">
                    <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      No books listed
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Start selling by listing your first book
                    </p>
                    <Button
                      onClick={() => navigate("/create-listing")}
                      className="bg-book-600 hover:bg-book-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      List Your First Book
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {activeListings.map((book) => (
                      <Card
                        key={book.id}
                        className="hover:shadow-md transition-shadow"
                      >
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            <img
                              src={
                                book.frontCover ||
                                book.imageUrl ||
                                "/placeholder.svg"
                              }
                              alt={book.title}
                              className="w-full h-48 object-cover rounded-lg"
                            />
                            <div>
                              <h4 className="font-semibold text-gray-900 line-clamp-2">
                                {book.title}
                              </h4>
                              <p className="text-sm text-gray-600">
                                by {book.author}
                              </p>
                              <div className="flex items-center justify-between mt-2">
                                <p className="text-lg font-bold text-book-600">
                                  R{book.price}
                                </p>
                                <Badge variant="secondary">
                                  {book.condition}
                                </Badge>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditBook(book.id)}
                                className="flex-1"
                              >
                                <Edit className="w-4 h-4 mr-1" />
                                Edit
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleDeleteBook(book.id, book.title)
                                }
                                disabled={deletingBooks.has(book.id)}
                                className="flex-1 text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4 mr-1" />
                                Delete
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      value={profile.name || ""}
                      readOnly
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditDialogOpen(true)}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={user.email || ""}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                  />
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Banking Information</h3>
                  <BankingProfileTab userId={user.id} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Addresses Tab */}
          <TabsContent value="addresses" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Delivery Addresses</CardTitle>
              </CardHeader>
              <CardContent>
                <ModernAddressTab
                  addressData={addressData}
                  onSaveAddresses={handleSaveAddresses}
                  isLoading={isLoadingAddress}
                  userId={user.id}
                />
              </CardContent>
            </Card>
          </TabsContent>
                </Tabs>
      </div>

      <ShareProfileDialog
        isOpen={isShareDialogOpen}
        onClose={() => setIsShareDialogOpen(false)}
        userId={user?.id || ""}
        userName={profile?.name || "Anonymous User"}
        isOwnProfile={true}
      />

      <ProfileEditDialog
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
      />

      <TransparencyModal
        isOpen={isTransparencyModalOpen}
        onClose={() => setIsTransparencyModalOpen(false)}
      />
    </Layout>
  );
};

export default Profile;
