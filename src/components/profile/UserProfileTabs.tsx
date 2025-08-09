import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Edit,
  Trash2,
  Eye,
  User,
  BookOpen,
  CreditCard,
  Activity,
  Settings,
  TrendingUp,
  Award,
  Star,
} from "lucide-react";
import { Book } from "@/types/book";
import ProfileEditDialog from "@/components/ProfileEditDialog";
import UnavailableBookCard from "@/components/UnavailableBookCard";
import BankingProfileTab from "@/components/profile/BankingProfileTab";
import CommitTab from "@/components/profile/CommitTab";
import AccountInformation from "@/components/profile/AccountInformation";
import ModernAddressTab from "@/components/profile/ModernAddressTab";
import { UserProfile, AddressData, Address } from "@/types/address";

interface UserProfileTabsProps {
  activeListings: Book[];
  isLoading: boolean;
  onEditBook: (bookId: string) => void;
  onDeleteBook: (bookId: string, bookTitle: string) => void;
  profile: UserProfile | null;
  addressData: AddressData | null;
  isOwnProfile: boolean;
  userId: string;
  userName: string;
  onSaveAddresses?: (
    pickup: Address,
    shipping: Address,
    same: boolean,
  ) => Promise<void>;
  isLoadingAddress?: boolean;
  deletingBooks?: Set<string>;
}

const UserProfileTabs = ({
  activeListings,
  isLoading,
  onEditBook,
  onDeleteBook,
  profile,
  addressData,
  isOwnProfile,
  userId,
  userName,
  onSaveAddresses,
  isLoadingAddress = false,
  deletingBooks = new Set(),
}: UserProfileTabsProps) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isTemporarilyAway, setIsTemporarilyAway] = useState(false);

  const tabsConfig = [
    {
      id: "listings",
      label: "My Books",
      icon: BookOpen,
      count: activeListings.length,
      description: "Your active listings",
    },
    {
      id: "activity",
      label: "Activity",
      icon: Activity,
      description: "View activity center",
    },
    ...(isOwnProfile
      ? [
          {
            id: "account",
            label: "Account",
            icon: User,
            description: "Personal information",
          },
          {
            id: "addresses",
            label: "Addresses",
            icon: Settings,
            description: "Pickup & shipping addresses",
          },
          {
            id: "banking",
            label: "Banking",
            icon: CreditCard,
            description: "Payment & banking details",
          },
          {
            id: "commit",
            label: "Commit System",
            icon: Award,
            description: "Sales commitments",
          },
        ]
      : []),
  ];

  return (
    <div className="w-full">
      <Tabs defaultValue="listings" className="w-full">
        {/* Clean Tab Navigation */}
        <div className="mb-8">
          <TabsList className="w-full bg-white border border-gray-200 rounded-lg p-2">
            <div
              className={`w-full ${
                isMobile
                  ? "grid grid-cols-2 gap-3"
                  : "flex justify-start items-center gap-3 overflow-x-auto"
              }`}
            >
              {tabsConfig.map((tab) => {
                const Icon = tab.icon;

                return (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className={`
                      ${isMobile ? "flex-col py-4 px-3 min-h-[70px]" : "flex-row py-3 px-5 min-w-[140px]"}
                      relative rounded-lg
                      data-[state=active]:bg-gray-900 data-[state=active]:text-white
                      hover:bg-gray-50 data-[state=active]:hover:bg-gray-800
                      transition-all duration-200
                      text-gray-600 text-center justify-center
                      border border-transparent data-[state=active]:border-gray-700
                      flex-shrink-0
                    `}
                  >
                    <div
                      className={`flex items-center gap-3 ${isMobile ? "flex-col text-center" : ""}`}
                    >
                      <div className="relative">
                        <Icon className="h-5 w-5" />
                        {tab.count !== undefined && tab.count > 0 && (
                          <Badge
                            className="absolute -top-1 -right-1 h-3 w-3 p-0 text-xs bg-gray-900 text-white border border-white"
                            variant="secondary"
                          >
                            {tab.count > 9 ? "9+" : tab.count}
                          </Badge>
                        )}
                      </div>
                      <div className={isMobile ? "text-center" : ""}>
                        <div className="font-semibold text-sm whitespace-nowrap">
                          {tab.label}
                        </div>
                        {!isMobile && (
                          <div className="text-xs opacity-70 whitespace-nowrap">
                            {tab.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </TabsTrigger>
                );
              })}
            </div>
          </TabsList>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          <TabsContent value="listings" className="space-y-6">
            <Card className="border border-gray-200">
              <CardHeader className="bg-gray-50 border-b border-gray-200">
                <CardTitle className="text-xl md:text-2xl flex items-center gap-3 text-gray-900">
                  <BookOpen className="h-6 w-6 text-gray-700" />
                  My Book Collection
                  <Badge className="bg-gray-900 text-white">
                    {activeListings.length} books
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {isLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
                    <p className="text-gray-600 mt-4">Loading your books...</p>
                  </div>
                ) : activeListings.length === 0 ? (
                  <div className="text-center py-12">
                    <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">
                      {isOwnProfile
                        ? "No Books Listed Yet"
                        : "No Books Available"}
                    </h3>
                    <p className="text-gray-500 mb-6">
                      {isOwnProfile
                        ? "Start by adding your first book to the marketplace!"
                        : "This user hasn't listed any books yet."}
                    </p>
                    {isOwnProfile && (
                      <Button
                        onClick={() => navigate("/sell")}
                        className="bg-gray-900 hover:bg-gray-800 text-white"
                      >
                        List Your First Book
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {activeListings.map((book) => {
                      const isUnavailable =
                        (book as Book & { status?: string }).status ===
                        "unavailable";

                      if (isUnavailable) {
                        return (
                          <UnavailableBookCard
                            key={book.id}
                            book={book}
                            onEdit={isOwnProfile ? onEditBook : undefined}
                            onDelete={isOwnProfile ? onDeleteBook : undefined}
                            isOwnProfile={isOwnProfile}
                          />
                        );
                      }

                      return (
                        <Card
                          key={book.id}
                          className="group hover:shadow-md transition-all duration-300 border border-gray-200 hover:border-gray-300 overflow-hidden"
                        >
                          <div className="relative">
                            <img
                              src={book.frontCover || book.imageUrl}
                              alt={book.title}
                              className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute top-2 right-2">
                              <Badge className="bg-gray-900 text-white">
                                R{book.price}
                              </Badge>
                            </div>
                          </div>
                          <CardContent className="p-4">
                            <h4 className="font-bold text-lg mb-2 line-clamp-2">
                              {book.title}
                            </h4>
                            <p className="text-gray-600 text-sm mb-3">
                              by {book.author}
                            </p>

                            <div className="space-y-3">
                              <Button
                                onClick={() => navigate(`/books/${book.id}`)}
                                variant="outline"
                                size="sm"
                                className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </Button>

                              {isOwnProfile && (
                                <div className="grid grid-cols-2 gap-2">
                                  <Button
                                    onClick={() => onEditBook(book.id)}
                                    variant="outline"
                                    size="sm"
                                    className="border-gray-300 text-gray-700 hover:bg-gray-50"
                                  >
                                    <Edit className="h-3 w-3 mr-1" />
                                    Edit
                                  </Button>
                                  <Button
                                    onClick={() =>
                                      onDeleteBook(book.id, book.title)
                                    }
                                    variant="outline"
                                    size="sm"
                                    className="border-red-300 text-red-600 hover:bg-red-50"
                                    disabled={deletingBooks.has(book.id)}
                                  >
                                    <Trash2 className="h-3 w-3 mr-1" />
                                    {deletingBooks.has(book.id)
                                      ? "..."
                                      : "Delete"}
                                  </Button>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            <Card className="border border-gray-200">
              <CardHeader className="bg-gray-50 border-b border-gray-200">
                <CardTitle className="text-xl md:text-2xl flex items-center gap-3 text-gray-900">
                  <Activity className="h-6 w-6 text-gray-700" />
                  Activity & Commit Center
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="text-center py-12">
                  <div className="bg-gray-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                    <Activity className="h-12 w-12 text-gray-600" />
                  </div>

                  <h3 className="text-2xl font-bold text-gray-800 mb-3">
                    Full Activity Center Available
                  </h3>

                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    View your complete activity history, manage sale
                    commitments, track purchases, and monitor your marketplace
                    performance in our dedicated activity center.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto mb-8">
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <Award className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                      <h4 className="font-semibold text-gray-900">
                        Sale Commitments
                      </h4>
                      <p className="text-gray-600 text-sm">
                        48-hour commitment system
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <TrendingUp className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                      <h4 className="font-semibold text-gray-900">
                        Purchase History
                      </h4>
                      <p className="text-gray-600 text-sm">
                        Track all your orders
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <Star className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                      <h4 className="font-semibold text-gray-900">
                        Performance Stats
                      </h4>
                      <p className="text-gray-600 text-sm">
                        Seller metrics & ratings
                      </p>
                    </div>
                  </div>

                  <Button
                    onClick={() => navigate("/activity")}
                    className="bg-gray-900 hover:bg-gray-800 text-white font-semibold px-8 py-3 text-lg transition-all"
                  >
                    <Activity className="h-5 w-5 mr-2" />
                    Open Activity Center
                  </Button>

                  <p className="text-gray-500 text-sm mt-4">
                    Get a comprehensive view of all your ReBooked Marketplace activity
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {isOwnProfile && (
            <>
              <TabsContent value="account" className="space-y-6">
                <AccountInformation
                  profile={profile}
                  isTemporarilyAway={isTemporarilyAway}
                  setIsTemporarilyAway={setIsTemporarilyAway}
                  setIsEditDialogOpen={setIsEditDialogOpen}
                />
              </TabsContent>

              <TabsContent value="addresses" className="space-y-6">
                <ModernAddressTab
                  addressData={addressData}
                  onSaveAddresses={onSaveAddresses}
                  isLoading={isLoadingAddress}
                />
              </TabsContent>

              <TabsContent value="banking" className="space-y-6">
                <BankingProfileTab />
              </TabsContent>

              <TabsContent value="commit" className="space-y-6">
                <CommitTab />
              </TabsContent>
            </>
          )}
        </div>
      </Tabs>

      {/* Dialogs */}
      {profile && (
        <ProfileEditDialog
          isOpen={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
        />
      )}
    </div>
  );
};

export default UserProfileTabs;
