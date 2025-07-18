import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
  MapPin,
  TrendingUp,
  Award,
  Star,
  Plus,
  ShoppingBag,
  Calendar,
  Target,
  ArrowRight,
} from "lucide-react";
import { Book } from "@/types/book";
import ProfileEditDialog from "@/components/ProfileEditDialog";
import UnavailableBookCard from "@/components/UnavailableBookCard";
import BankingProfileTab from "@/components/profile/BankingProfileTab";
import CommitTab from "@/components/profile/CommitTab";
import AccountInformation from "@/components/profile/AccountInformation";
import ModernAddressTab from "@/components/profile/ModernAddressTab";
import { UserProfile, AddressData, Address } from "@/types/address";

interface ModernUserProfileTabsProps {
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

const ModernUserProfileTabs = ({
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
}: ModernUserProfileTabsProps) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isTemporarilyAway, setIsTemporarilyAway] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // Quick stats for overview
  const stats = {
    totalBooks: activeListings.length,
    totalValue: activeListings.reduce((sum, book) => sum + book.price, 0),
    avgPrice:
      activeListings.length > 0
        ? Math.round(
            activeListings.reduce((sum, book) => sum + book.price, 0) /
              activeListings.length,
          )
        : 0,
    recentlyAdded: activeListings.filter((book) => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return new Date(book.createdAt) > weekAgo;
    }).length,
  };

  const tabsConfig = [
    {
      id: "overview",
      label: "Overview",
      icon: Target,
      description: "Dashboard & insights",
      showOnMobile: true,
    },
    {
      id: "books",
      label: "Books",
      icon: BookOpen,
      count: activeListings.length,
      description: "Your book collection",
      showOnMobile: true,
    },
    {
      id: "activity",
      label: "Activity",
      icon: Activity,
      description: "Sales & purchases",
      showOnMobile: true,
    },
    ...(isOwnProfile
      ? [
          {
            id: "account",
            label: "Account",
            icon: User,
            description: "Personal info",
            showOnMobile: true,
          },
          {
            id: "addresses",
            label: "Addresses",
            icon: MapPin,
            description: "Delivery settings",
            showOnMobile: false, // Hide on mobile to reduce clutter
          },
          {
            id: "banking",
            label: "Banking",
            icon: CreditCard,
            description: "Payment setup",
            showOnMobile: false, // Hide on mobile to reduce clutter
          },
          {
            id: "settings",
            label: "Settings",
            icon: Settings,
            description: "Preferences",
            showOnMobile: true,
          },
        ]
      : []),
  ];

  const visibleTabs = isMobile
    ? tabsConfig.filter((tab) => tab.showOnMobile)
    : tabsConfig;

  const QuickActionCard = ({
    icon: Icon,
    title,
    description,
    onClick,
    color = "gray",
  }: {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    description: string;
    onClick: () => void;
    color?: string;
  }) => (
    <Card
      className={`cursor-pointer transition-all duration-200 hover:shadow-md border-l-4 border-l-${color}-500 hover:border-l-${color}-600`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg bg-${color}-100`}>
            <Icon className={`h-5 w-5 text-${color}-600`} />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-sm">{title}</h4>
            <p className="text-xs text-gray-600">{description}</p>
          </div>
          <ArrowRight className="h-4 w-4 text-gray-400" />
        </div>
      </CardContent>
    </Card>
  );

  const StatCard = ({
    icon: Icon,
    label,
    value,
    color = "blue",
  }: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: string | number;
    color?: string;
  }) => (
    <div className="text-center p-4 bg-gradient-to-br from-white to-gray-50 rounded-xl border border-gray-200">
      <div
        className={`inline-flex items-center justify-center w-12 h-12 rounded-full bg-${color}-100 mb-3`}
      >
        <Icon className={`h-6 w-6 text-${color}-600`} />
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-sm text-gray-600">{label}</div>
    </div>
  );

  return (
    <div className="w-full">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {/* Modern Tab Navigation */}
        <div className="mb-6">
          <TabsList className="w-full bg-gray-50 border border-gray-200 rounded-xl p-1">
            <div
              className={`w-full ${
                isMobile
                  ? "grid grid-cols-2 gap-1"
                  : "flex items-center gap-1 overflow-x-auto"
              }`}
            >
              {visibleTabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className={`
                      ${isMobile ? "flex-col py-3 px-2 min-h-[60px]" : "flex-row py-2 px-4 min-w-[120px]"}
                      relative rounded-lg font-medium
                      data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm
                      hover:bg-white/60 transition-all duration-200
                      text-gray-600 text-center justify-center
                      flex-shrink-0
                    `}
                  >
                    <div
                      className={`flex items-center gap-2 ${isMobile ? "flex-col" : ""}`}
                    >
                      <div className="relative">
                        <Icon className="h-4 w-4" />
                        {tab.count !== undefined && tab.count > 0 && (
                          <Badge className="absolute -top-2 -right-2 h-4 w-4 p-0 text-xs bg-blue-600 text-white rounded-full flex items-center justify-center">
                            {tab.count > 99 ? "99+" : tab.count}
                          </Badge>
                        )}
                      </div>
                      <div className={isMobile ? "text-center" : ""}>
                        <div className="text-xs font-semibold">{tab.label}</div>
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

          {/* Mobile Additional Actions */}
          {isMobile && isOwnProfile && (
            <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveTab("addresses")}
                className="flex-shrink-0"
              >
                <MapPin className="h-4 w-4 mr-2" />
                Addresses
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveTab("banking")}
                className="flex-shrink-0"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Banking
              </Button>
            </div>
          )}
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Quick Stats */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-blue-600" />
                    Dashboard Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <StatCard
                      icon={BookOpen}
                      label="Total Books"
                      value={stats.totalBooks}
                      color="blue"
                    />
                    <StatCard
                      icon={TrendingUp}
                      label="Total Value"
                      value={`R${stats.totalValue}`}
                      color="green"
                    />
                    <StatCard
                      icon={Star}
                      label="Avg Price"
                      value={`R${stats.avgPrice}`}
                      color="yellow"
                    />
                    <StatCard
                      icon={Calendar}
                      label="New This Week"
                      value={stats.recentlyAdded}
                      color="purple"
                    />
                  </div>

                  {isOwnProfile && (
                    <div className="pt-4 border-t border-gray-200">
                      <h4 className="font-semibold mb-3">Quick Actions</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <QuickActionCard
                          icon={Plus}
                          title="List New Book"
                          description="Add a book to sell"
                          onClick={() => navigate("/create-listing")}
                          color="blue"
                        />
                        <QuickActionCard
                          icon={Activity}
                          title="View Activity"
                          description="Check sales & purchases"
                          onClick={() => navigate("/activity")}
                          color="green"
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-green-600" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Profile Updated</p>
                        <p className="text-xs text-gray-600">2 hours ago</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">New Book Listed</p>
                        <p className="text-xs text-gray-600">1 day ago</p>
                      </div>
                    </div>
                    <div className="text-center pt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setActiveTab("activity")}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        View All Activity
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Books Tab */}
          <TabsContent value="books" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-blue-600" />
                  My Book Collection
                  <Badge variant="secondary">
                    {activeListings.length} books
                  </Badge>
                </CardTitle>
                {isOwnProfile && (
                  <Button onClick={() => navigate("/create-listing")} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Book
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-600 mt-4">Loading your books...</p>
                  </div>
                ) : activeListings.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <BookOpen className="h-10 w-10 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">
                      {isOwnProfile
                        ? "No Books Listed Yet"
                        : "No Books Available"}
                    </h3>
                    <p className="text-gray-500 mb-6 max-w-md mx-auto">
                      {isOwnProfile
                        ? "Start building your book collection by listing your first book!"
                        : "This user hasn't listed any books yet."}
                    </p>
                    {isOwnProfile && (
                      <Button onClick={() => navigate("/create-listing")}>
                        <Plus className="h-4 w-4 mr-2" />
                        List Your First Book
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
                          className="group hover:shadow-lg transition-all duration-300 overflow-hidden border-0 bg-gradient-to-br from-white to-gray-50"
                        >
                          <div className="relative">
                            <img
                              src={book.frontCover || book.imageUrl}
                              alt={book.title}
                              className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute top-2 right-2">
                              <Badge className="bg-green-600 text-white shadow-md">
                                R{book.price}
                              </Badge>
                            </div>
                            <div className="absolute bottom-2 left-2">
                              <Badge
                                variant="secondary"
                                className="bg-white/90 text-gray-700"
                              >
                                {book.condition}
                              </Badge>
                            </div>
                          </div>
                          <CardContent className="p-4">
                            <h4 className="font-bold text-sm mb-1 line-clamp-2 group-hover:text-blue-600 transition-colors">
                              {book.title}
                            </h4>
                            <p className="text-gray-600 text-xs mb-3">
                              by {book.author}
                            </p>

                            <div className="space-y-2">
                              <Button
                                onClick={() => navigate(`/books/${book.id}`)}
                                variant="outline"
                                size="sm"
                                className="w-full border-gray-200 hover:border-blue-300 hover:text-blue-600"
                              >
                                <Eye className="h-3 w-3 mr-2" />
                                View
                              </Button>

                              {isOwnProfile && (
                                <div className="grid grid-cols-2 gap-2">
                                  <Button
                                    onClick={() => onEditBook(book.id)}
                                    variant="ghost"
                                    size="sm"
                                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                  >
                                    <Edit className="h-3 w-3 mr-1" />
                                    Edit
                                  </Button>
                                  <Button
                                    onClick={() =>
                                      onDeleteBook(book.id, book.title)
                                    }
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
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

          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-green-600" />
                  Activity & Sales Center
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Activity className="h-10 w-10 text-green-600" />
                  </div>

                  <h3 className="text-2xl font-bold text-gray-800 mb-3">
                    Complete Activity Center
                  </h3>

                  <p className="text-gray-600 mb-8 max-w-lg mx-auto">
                    Track your marketplace journey with detailed insights into
                    sales, purchases, and performance metrics.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto mb-8">
                    <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                      <Award className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                      <h4 className="font-semibold text-blue-900">
                        Commitments
                      </h4>
                      <p className="text-blue-700 text-sm">
                        48-hour sales system
                      </p>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200">
                      <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
                      <h4 className="font-semibold text-green-900">
                        Sales History
                      </h4>
                      <p className="text-green-700 text-sm">
                        Track all transactions
                      </p>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
                      <Star className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                      <h4 className="font-semibold text-purple-900">
                        Performance
                      </h4>
                      <p className="text-purple-700 text-sm">
                        Seller analytics
                      </p>
                    </div>
                  </div>

                  <Button
                    onClick={() => navigate("/activity")}
                    className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-semibold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all"
                  >
                    <Activity className="h-5 w-5 mr-2" />
                    Open Activity Center
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Other tabs remain the same but with modern styling */}
          {isOwnProfile && (
            <>
              <TabsContent value="account" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5 text-blue-600" />
                      Account Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <AccountInformation
                      profile={profile}
                      isTemporarilyAway={isTemporarilyAway}
                      setIsTemporarilyAway={setIsTemporarilyAway}
                      setIsEditDialogOpen={setIsEditDialogOpen}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="addresses" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-blue-600" />
                      Delivery Addresses
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ModernAddressTab
                      addressData={addressData}
                      onSaveAddresses={onSaveAddresses}
                      isLoading={isLoadingAddress}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="banking" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-blue-600" />
                      Banking & Payments
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <BankingProfileTab />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="settings" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5 text-blue-600" />
                      Settings & Preferences
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <h4 className="font-medium">Commit System</h4>
                          <p className="text-sm text-gray-600">
                            Manage sales commitments
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setActiveTab("activity")}
                        >
                          Configure
                        </Button>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <h4 className="font-medium">Notifications</h4>
                          <p className="text-sm text-gray-600">
                            Email and push preferences
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate("/settings")}
                        >
                          Manage
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </>
          )}
        </div>
      </Tabs>

      {/* Profile Edit Dialog */}
      {profile && (
        <ProfileEditDialog
          isOpen={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          currentProfile={profile}
        />
      )}
    </div>
  );
};

export default ModernUserProfileTabs;
