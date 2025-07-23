import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User, Mail, Phone, MapPin, Calendar, Shield } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import LoadingSpinner from "@/components/LoadingSpinner";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  created_at: string;
  status: string;
  role?: string;
  last_login?: string;
}

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
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && userId) {
      setLoading(true);
      // For now, create a mock user profile based on the userId
      // In a real implementation, you would fetch the user data from an API
      setTimeout(() => {
        setUser({
          id: userId,
          name: `User ${userId.slice(-4)}`,
          email: `user${userId.slice(-4)}@example.com`,
          phone: "+27 123 456 7890",
          address: "123 Example Street, Cape Town, South Africa",
          created_at: new Date().toISOString(),
          status: "active",
          role: "user",
          last_login: new Date().toISOString(),
        });
        setLoading(false);
      }, 500);
    } else if (!isOpen) {
      setUser(null);
      setLoading(false);
    }
  }, [userId, isOpen]);

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

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <LoadingSpinner size="lg" text="Loading user profile..." />
          </div>
        ) : user ? (
          <Card className="border-0 shadow-none">
            <DialogTitle className="sr-only">User Profile</DialogTitle>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  User Profile
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={onClose}>
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Name</label>
                    <p className="text-lg font-semibold">{user.name}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <div>
                      <label className="text-sm font-medium text-gray-600">
                        Email
                      </label>
                      <p className="text-sm">{user.email}</p>
                    </div>
                  </div>

                  {user.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <div>
                        <label className="text-sm font-medium text-gray-600">
                          Phone
                        </label>
                        <p className="text-sm">{user.phone}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Status
                    </label>
                    <div className="mt-1">
                      <Badge className={getStatusColor(user.status)}>
                        {user.status}
                      </Badge>
                    </div>
                  </div>

                  {user.role && (
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-gray-500" />
                      <div>
                        <label className="text-sm font-medium text-gray-600">
                          Role
                        </label>
                        <p className="text-sm capitalize">{user.role}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <div>
                      <label className="text-sm font-medium text-gray-600">
                        Member Since
                      </label>
                      <p className="text-sm">{formatDate(user.created_at)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Address */}
              {user.address && (
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Address
                    </label>
                    <p className="text-sm">{user.address}</p>
                  </div>
                </div>
              )}

              {/* Last Login */}
              {user.last_login && (
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Last Login
                  </label>
                  <p className="text-sm">{formatDate(user.last_login)}</p>
                </div>
              )}

              {/* Actions */}
              {onUpdateStatus && (
                <div className="border-t pt-4">
                  <label className="text-sm font-medium text-gray-600 mb-3 block">
                    Actions
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onUpdateStatus(user.id, "active")}
                      disabled={user.status === "active"}
                    >
                      Activate
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onUpdateStatus(user.id, "inactive")}
                      disabled={user.status === "inactive"}
                    >
                      Deactivate
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => onUpdateStatus(user.id, "suspended")}
                      disabled={user.status === "suspended"}
                    >
                      Suspend
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="flex items-center justify-center p-8">
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
