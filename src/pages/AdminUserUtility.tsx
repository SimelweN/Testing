import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Search, Trash2, UserCheck, AlertTriangle } from "lucide-react";
import { UserDeletionService } from "@/services/admin/userDeletionService";
import { deleteSpecificUserData } from "@/utils/deleteSpecificUser";
import Layout from "@/components/Layout";

const AdminUserUtility = () => {
  const [searchInput, setSearchInput] = useState("");
  const [searchResult, setSearchResult] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSearch = async () => {
    if (!searchInput.trim()) {
      toast.error("Please enter a user ID or email");
      return;
    }

    setIsSearching(true);
    try {
      const result = await UserDeletionService.searchUserData(searchInput.trim());
      setSearchResult(result);
      
      if (result.found) {
        toast.success("User found");
      } else {
        toast.info("User not found");
      }
    } catch (error) {
      toast.error("Search failed");
      console.error("Search error:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleDelete = async (userIdOrEmail: string) => {
    const confirmMessage = `Are you sure you want to permanently delete all data for "${userIdOrEmail}"? This action cannot be undone.`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    setIsDeleting(true);
    try {
      const report = await UserDeletionService.deleteUserCompletely(userIdOrEmail);
      
      if (report.success) {
        const totalDeleted = Object.values(report.deletedRecords).reduce((sum, count) => sum + count, 0);
        toast.success(`User deleted successfully! Removed ${totalDeleted} records.`);
        
        // Clear search result since user is deleted
        setSearchResult(null);
        setSearchInput("");
      } else {
        toast.error(`Deletion failed: ${report.errors.join(", ")}`);
      }
      
      console.log("Deletion report:", report);
    } catch (error) {
      toast.error("Deletion failed");
      console.error("Deletion error:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteSpecificUser = async () => {
    const confirmMessage = `Are you sure you want to delete all data for "simelwengcobo@icloud.com"?`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    setIsDeleting(true);
    try {
      const result = await deleteSpecificUserData();
      
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
      
      console.log("Specific user deletion result:", result);
    } catch (error) {
      toast.error("Failed to delete specific user");
      console.error("Specific user deletion error:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Admin User Management Utility
            </h1>
            <p className="text-gray-600">
              Search for users and manage user data deletion
            </p>
          </div>

          {/* Quick Action for Specific User */}
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-800 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Quick Action: Delete Specific User
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-700 mb-4">
                Delete all data for user: <strong>simelwengcobo@icloud.com</strong>
              </p>
              <Button
                onClick={handleDeleteSpecificUser}
                disabled={isDeleting}
                variant="destructive"
                className="w-full"
              >
                {isDeleting ? "Deleting..." : "Delete simelwengcobo@icloud.com"}
              </Button>
            </CardContent>
          </Card>

          {/* User Search */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Search User Data
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter user ID or email address"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                />
                <Button
                  onClick={handleSearch}
                  disabled={isSearching}
                  variant="outline"
                >
                  {isSearching ? "Searching..." : "Search"}
                </Button>
              </div>

              {searchResult && (
                <div className="mt-4 p-4 border rounded-lg">
                  {searchResult.found ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <UserCheck className="h-5 w-5 text-green-600" />
                        <Badge variant="default">User Found</Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <strong>User ID:</strong> {searchResult.userId}
                        </div>
                        <div>
                          <strong>Email:</strong> {searchResult.email}
                        </div>
                        <div>
                          <strong>Name:</strong> {searchResult.name}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2">Data Found:</h4>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div>Profiles: {searchResult.dataFound.profiles}</div>
                          <div>Books: {searchResult.dataFound.books}</div>
                          <div>Orders: {searchResult.dataFound.orders}</div>
                          <div>Notifications: {searchResult.dataFound.notifications}</div>
                          <div>Transactions: {searchResult.dataFound.transactions}</div>
                          <div>Banking: {searchResult.dataFound.banking}</div>
                          <div>Other: {searchResult.dataFound.other}</div>
                        </div>
                      </div>

                      <Button
                        onClick={() => handleDelete(searchResult.email || searchResult.userId)}
                        disabled={isDeleting}
                        variant="destructive"
                        className="w-full"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        {isDeleting ? "Deleting..." : "Delete All User Data"}
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Search className="h-5 w-5" />
                      <span>User not found</span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default AdminUserUtility;
