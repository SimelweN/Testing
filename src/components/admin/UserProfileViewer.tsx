import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User, Mail, Phone, MapPin, Calendar, Shield, BookOpen, DollarSign } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import LoadingSpinner from "@/components/LoadingSpinner";
import { getUserProfile, getUserBookListings, AdminUser, AdminListing } from "@/services/admin/adminQueries";

interface UserProfileViewerProps {
  userId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus?: (userId: string, status: string) => void;
}

const UserProfileViewer: React.FC<UserProfileViewerProps> = ({
  userId,
  isOpen,
  onClose,
  onUpdateStatus,
}) => {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [bookListings, setBookListings] = useState<AdminListing[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && userId) {
      fetchUserData(userId);
    } else if (!isOpen) {
      setUser(null);
      setBookListings([]);
      setLoading(false);
      setError(null);
    }
  }, [userId, isOpen]);

  const fetchUserData = async (userId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch user profile and book listings in parallel
      const [userProfile, userBooks] = await Promise.all([
        getUserProfile(userId),
        getUserBookListings(userId)
      ]);
      
      setUser(userProfile);
      setBookListings(userBooks);
    } catch (error) {
      console.error("Error fetching user data:", error);
      setError(error instanceof Error ? error.message : "Failed to load user data");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-800";
      case "inactive":
        return "bg-gray-100 text-gray-800";
      case "suspended":
        return "bg-red-100 text-red-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  const getBookStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-800";
      case "sold":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <LoadingSpinner size="lg" text="Loading user profile..." />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center p-8">
            <DialogTitle className="sr-only">User Profile - Error</DialogTitle>
            <div className="text-center">
              <User className="h-12 w-12 text-red-300 mx-auto mb-4" />
              <p className="text-red-500 mb-2">Error loading user profile</p>
              <p className="text-gray-500 text-sm mb-4">{error}</p>
              <Button onClick={onClose} className="mt-4">
                Close
              </Button>
            </div>
          </div>
        ) : user ? (
          <div className="space-y-6">
            <DialogTitle className="sr-only">User Profile for {user.name}</DialogTitle>
            
            {/* Header */}
            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{user.name}</h2>
                  <p className="text-gray-600">{user.email}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={onClose}>
                ✕
              </Button>
            </div>

            {/* User Information */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  User Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Full Name</label>
                      <p className="text-base font-semibold text-gray-900">{user.name}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <div>
                        <label className="text-sm font-medium text-gray-600">Email Address</label>
                        <p className="text-sm text-gray-900">{user.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-gray-500" />
                      <div>
                        <label className="text-sm font-medium text-gray-600">Total Listings</label>
                        <p className="text-sm text-gray-900">{user.listingsCount} books</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Account Status</label>
                      <div className="mt-1">
                        <Badge className={getStatusColor(user.status)}>
                          {user.status}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <div>
                        <label className="text-sm font-medium text-gray-600">Member Since</label>
                        <p className="text-sm text-gray-900">{formatDate(user.createdAt)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-gray-500" />
                      <div>
                        <label className="text-sm font-medium text-gray-600">Active Listings</label>
                        <p className="text-sm text-gray-900">
                          {bookListings.filter(book => book.status === 'active').length} books
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                {onUpdateStatus && (
                  <div className="border-t pt-4">
                    <label className="text-sm font-medium text-gray-600 mb-3 block">
                      Account Actions
                    </label>
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onUpdateStatus(user.id, "active")}
                        disabled={user.status === "active"}
                      >
                        Activate Account
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onUpdateStatus(user.id, "inactive")}
                        disabled={user.status === "inactive"}
                      >
                        Deactivate Account
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => onUpdateStatus(user.id, "suspended")}
                        disabled={user.status === "suspended"}
                      >
                        Suspend Account
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Book Listings */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Book Listings ({bookListings.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {bookListings.length === 0 ? (
                  <div className="text-center py-8">
                    <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No book listings found</p>
                    <p className="text-gray-400 text-sm">This user hasn't listed any books yet</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Book Details</TableHead>
                          <TableHead>Author</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Listed Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {bookListings.map((book) => (
                          <TableRow key={book.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium text-gray-900">{book.title}</p>
                                <p className="text-xs text-gray-500">ID: {book.id.slice(-8)}</p>
                              </div>
                            </TableCell>
                            <TableCell className="text-gray-700">{book.author}</TableCell>
                            <TableCell className="font-medium text-green-600">
                              R{book.price.toFixed(2)}
                            </TableCell>
                            <TableCell>
                              <span className="capitalize text-gray-700">
                                {book.condition || 'Not specified'}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Badge className={getBookStatusColor(book.status)}>
                                {book.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-gray-600">
                              {book.created_at ? formatDate(book.created_at) : 'Unknown'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="flex items-center justify-center p-8">
            <DialogTitle className="sr-only">User Profile - User Not Found</DialogTitle>
            <div className="text-center">
              <User className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">User not found</p>
              <Button onClick={onClose} className="mt-4">
                Close
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default UserProfileViewer;
