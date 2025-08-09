import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Edit,
  Trash2,
  Eye,
  User,
  Clock,
  CheckCircle,
  AlertTriangle,
  Star,
  BookOpen,
  MessageSquare,
  Calendar,
  Shield,
  UserX,
  Pause,
  CreditCard,
  Activity,
  Settings,
  TrendingUp,
  Award,
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

  // Commit data will be fetched from API when the feature is ready
  const commitData = {
    totalCommits: null,
    activeCommits: null,
    completedCommits: null,
    averageResponseTime: null,
    reliabilityScore: null,
    recentCommits: [],
  };

  const tabsConfig = [
    {
      id: "listings",
      label: "My Books",
      icon: BookOpen,
      color: "emerald",
      count: activeListings.length,
      description: "Your active listings",
    },
    {
      id: "activity",
      label: "Activity",
      icon: Activity,
      color: "blue",
      description: "View activity center",
    },
    ...(isOwnProfile
      ? [
          {
            id: "account",
            label: "Account",
            icon: User,
            color: "purple",
            description: "Personal information",
          },
          {
            id: "addresses",
            label: "Addresses",
            icon: Settings,
            color: "orange",
            description: "Pickup & shipping addresses",
          },
          {
            id: "banking",
            label: "Banking",
            icon: CreditCard,
            color: "green",
            description: "Payment & banking details",
          },
          {
            id: "commit",
            label: "Commit System",
            icon: Award,
            color: "indigo",
            description: "Sales commitments",
          },
        ]
      : []),
  ];

  return (
    <div className="w-full">
      <Tabs defaultValue="listings" className="w-full">
        {/* Modern Tab Navigation */}
        <div className="mb-8">
          <TabsList className="w-full bg-white/50 backdrop-blur-sm border-2 border-gray-100 rounded-2xl p-2 shadow-lg">
            <div
              className={`w-full ${
                isMobile
                  ? "grid grid-cols-2 gap-2"
                  : "flex justify-center items-center gap-2"
              }`}
            >
              {tabsConfig.map((tab) => {
                const Icon = tab.icon;
                const colorClasses = {
                  emerald:
                    "data-[state=active]:bg-emerald-600 hover:bg-emerald-50 border-emerald-200",
                  blue: "data-[state=active]:bg-blue-600 hover:bg-blue-50 border-blue-200",
                  purple:
                    "data-[state=active]:bg-purple-600 hover:bg-purple-50 border-purple-200",
                  orange:
                    "data-[state=active]:bg-orange-600 hover:bg-orange-50 border-orange-200",
                  green:
                    "data-[state=active]:bg-green-600 hover:bg-green-50 border-green-200",
                  indigo:
                    "data-[state=active]:bg-indigo-600 hover:bg-indigo-50 border-indigo-200",
                };

                return (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className={`
                      ${isMobile ? "flex-col py-4 px-3" : "flex-row py-3 px-6"}
                      relative overflow-hidden rounded-xl border-2 border-transparent
                      data-[state=active]:text-white data-[state=active]:shadow-lg
                      transition-all duration-300 ease-out transform
                      hover:scale-105 hover:shadow-md
                      ${colorClasses[tab.color as keyof typeof colorClasses]}
                    `}
                  >
                    <div
                      className={`flex items-center gap-3 ${isMobile ? "flex-col text-center" : ""}`}
                    >
                      <div className="relative">
                        <Icon className="h-5 w-5" />
                        {tab.count !== undefined && (
                          <Badge
                            className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs bg-red-500 text-white border-2 border-white"
                            variant="secondary"
                          >
                            {tab.count}
                          </Badge>
                        )}
                      </div>
                      <div className={isMobile ? "text-center" : ""}>
                        <div className="font-semibold text-sm">{tab.label}</div>
                        {!isMobile && (
                          <div className="text-xs opacity-70">
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
            <Card className="border-2 border-emerald-100 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-t-lg">
                <CardTitle className="text-xl md:text-2xl flex items-center gap-3">
                  <BookOpen className="h-6 w-6 text-emerald-600" />
                  My Book Collection
                  <Badge className="bg-emerald-600 text-white">
                    {activeListings.length} books
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {isLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
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
                        className="bg-emerald-600 hover:bg-emerald-700"
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
                          className="group hover:shadow-xl transition-all duration-300 border-2 border-gray-100 hover:border-emerald-200 overflow-hidden"
                        >
                          <div className="relative">
                            <img
                              src={book.frontCover || book.imageUrl}
                              alt={book.title}
                              className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute top-2 right-2">
                              <Badge className="bg-emerald-600 text-white">
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
                                className="w-full border-emerald-200 text-emerald-700 hover:bg-emerald-50"
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
                                    className="border-blue-200 text-blue-700 hover:bg-blue-50"
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
                                    className="border-red-200 text-red-700 hover:bg-red-50"
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
            <Card className="border-2 border-blue-100 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-t-lg">
                <CardTitle className="text-xl md:text-2xl flex items-center gap-3">
                  <Activity className="h-6 w-6 text-blue-600" />
                  Activity Dashboard
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Commit Stats */}
                  <Card className="border border-blue-100">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-blue-600" />
                        Performance Stats
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-4 bg-gray-50 rounded-xl">
                          <div className="text-3xl font-bold text-gray-600">
                            {commitData.totalCommits ?? "-"}
                          </div>
                          <div className="text-xs text-gray-500">
                            Total Sales
                          </div>
                        </div>
                        <div className="text-center p-4 bg-green-50 rounded-xl">
                          <div className="text-3xl font-bold text-green-600">
                            {commitData.completedCommits ?? "-"}
                          </div>
                          <div className="text-xs text-gray-500">Completed</div>
                        </div>
                        <div className="text-center p-4 bg-blue-50 rounded-xl">
                          <div className="text-3xl font-bold text-blue-600">
                            {commitData.reliabilityScore ?? "-"}%
                          </div>
                          <div className="text-xs text-gray-500">
                            Reliability
                          </div>
                        </div>
                        <div className="text-center p-4 bg-orange-50 rounded-xl">
                          <div className="text-3xl font-bold text-orange-600">
                            {commitData.activeCommits ?? "-"}
                          </div>
                          <div className="text-xs text-gray-500">Active</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Recent Activity */}
                  <Card className="border border-blue-100">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-blue-600" />
                        Recent Activity
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-8">
                        <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <h3 className="font-medium text-gray-600 mb-1">
                          No Recent Activity
                        </h3>
                        <p className="text-gray-500 text-sm">
                          Your recent activity will appear here
                        </p>
                      </div>
                    </CardContent>
                  </Card>
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
