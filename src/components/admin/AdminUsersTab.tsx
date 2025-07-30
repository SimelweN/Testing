import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserX, CheckCircle, Eye, Users, UserPlus, Activity, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import UserProfileViewer from "./UserProfileViewer";
import { AdminUser } from "@/services/admin/adminQueries";
import { useIsMobile } from "@/hooks/use-mobile";

interface AdminUsersTabProps {
  users: AdminUser[];
  onUserAction: (userId: string, action: "suspend" | "activate" | "delete") => void;
}

const AdminUsersTab = ({ users, onUserAction }: AdminUsersTabProps) => {
  const isMobile = useIsMobile();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isProfileViewerOpen, setIsProfileViewerOpen] = useState(false);

  const handleViewProfile = (userId: string) => {
    setSelectedUserId(userId);
    setIsProfileViewerOpen(true);
  };

  const closeProfileViewer = () => {
    setIsProfileViewerOpen(false);
    setSelectedUserId(null);
  };

  // Mobile Card Component for Users
  const MobileUserCard = ({ user }: { user: AdminUser }) => (
    <Card className="mb-4 border-0 shadow-sm">
      <CardContent className="p-5">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-sm">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <div className="font-semibold text-gray-900">{user.name}</div>
                <div className="text-sm text-gray-500 truncate">{user.email}</div>
              </div>
            </div>
            <Badge
              variant={user.status === "active" ? "default" : "destructive"}
              className="text-xs"
            >
              {user.status}
            </Badge>
          </div>

          <div className="flex items-center justify-between text-sm text-gray-500 py-2 border-t border-gray-100">
            <span>{user.listingsCount} listings</span>
            <span>Joined: {new Date(user.createdAt).toLocaleDateString()}</span>
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleViewProfile(user.id)}
              className="flex-1"
            >
              <Eye className="h-3 w-3 mr-2" />
              View Profile
            </Button>

            {user.status === "active" ? (
              <Button
                size="sm"
                variant="destructive"
                onClick={() => onUserAction(user.id, "suspend")}
                className="flex-1"
              >
                <UserX className="h-3 w-3 mr-2" />
                Suspend
              </Button>
            ) : (
              <Button
                size="sm"
                variant="default"
                onClick={() => onUserAction(user.id, "activate")}
                className="flex-1"
              >
                <CheckCircle className="h-3 w-3 mr-2" />
                Activate
              </Button>
            )}
          </div>

          <Button
            size="sm"
            variant="destructive"
            onClick={() => {
              if (window.confirm(`Are you sure you want to permanently delete ${user.name}? This action cannot be undone and will remove all their data.`)) {
                onUserAction(user.id, "delete");
              }
            }}
            className="w-full mt-2"
          >
            <Trash2 className="h-3 w-3 mr-2" />
            Delete User
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl">
              <Users className="h-7 w-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                User Management
              </h2>
              <p className="text-gray-600 text-base">
                Manage registered users and their accounts
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">{users.length}</div>
              <div className="text-sm text-gray-600">Total Users</div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-green-600">
                {users.filter(u => u.status === 'active').length}
              </div>
              <div className="text-sm text-gray-600">Active Users</div>
            </div>
          </div>
        </div>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold">User Directory</CardTitle>
              <CardDescription className="text-base">
                View and manage user accounts ({users.length} total users)
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className={isMobile ? "p-4" : "p-6"}>
          {users.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No users found</p>
              <p className="text-gray-400 text-sm">Users will appear here once they register</p>
            </div>
          ) : isMobile ? (
            <div className="space-y-4">
              {users.map((user) => (
                <MobileUserCard key={user.id} user={user} />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-100">
                    <TableHead className="text-sm font-semibold text-gray-700 min-w-[140px]">
                      User
                    </TableHead>
                    <TableHead className="text-sm font-semibold text-gray-700 min-w-[200px]">
                      Email
                    </TableHead>
                    <TableHead className="text-sm font-semibold text-gray-700 min-w-[90px]">
                      Status
                    </TableHead>
                    <TableHead className="text-sm font-semibold text-gray-700 min-w-[90px]">
                      Listings
                    </TableHead>
                    <TableHead className="text-sm font-semibold text-gray-700 min-w-[100px]">
                      Join Date
                    </TableHead>
                    <TableHead className="text-sm font-semibold text-gray-700 min-w-[160px] text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id} className="border-gray-100 hover:bg-gray-50">
                      <TableCell className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold text-xs">
                              {user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="text-sm font-medium text-gray-900">
                            {user.name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        <div className="max-w-[180px] truncate">
                          {user.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            user.status === "active" ? "default" : "destructive"
                          }
                          className="text-xs font-medium"
                        >
                          {user.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Activity className="h-3 w-3 text-gray-400" />
                          {user.listingsCount}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewProfile(user.id)}
                            className="h-8 px-3 text-xs"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>

                          {user.status === "active" ? (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => onUserAction(user.id, "suspend")}
                              className="h-8 px-3 text-xs"
                            >
                              <UserX className="h-3 w-3 mr-1" />
                              Suspend
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => onUserAction(user.id, "activate")}
                              className="h-8 px-3 text-xs"
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Activate
                            </Button>
                          )}

                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              if (window.confirm(`Are you sure you want to permanently delete ${user.name}? This action cannot be undone and will remove all their data.`)) {
                                onUserAction(user.id, "delete");
                              }
                            }}
                            className="h-8 px-3 text-xs bg-red-600 hover:bg-red-700"
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <UserProfileViewer
        userId={selectedUserId}
        isOpen={isProfileViewerOpen}
        onClose={closeProfileViewer}
      />
    </div>
  );
};

export default AdminUsersTab;
