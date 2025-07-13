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
import { UserX, CheckCircle, Eye } from "lucide-react";
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
  onUserAction: (userId: string, action: "suspend" | "activate") => void;
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
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="font-medium text-gray-900">{user.name}</div>
            <Badge
              variant={user.status === "active" ? "default" : "destructive"}
              className="text-xs"
            >
              {user.status}
            </Badge>
          </div>

          <div className="text-sm text-gray-600 truncate">{user.email}</div>

          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>{user.listingsCount} listings</span>
            <span>Joined: {new Date(user.createdAt).toLocaleDateString()}</span>
          </div>

          <div className="flex gap-2 pt-2 border-t">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleViewProfile(user.id)}
              className="flex-1"
            >
              <Eye className="h-3 w-3 mr-1" />
              View Profile
            </Button>

            {user.status === "active" ? (
              <Button
                size="sm"
                variant="destructive"
                onClick={() => onUserAction(user.id, "suspend")}
                className="flex-1"
              >
                <UserX className="h-3 w-3 mr-1" />
                Suspend
              </Button>
            ) : (
              <Button
                size="sm"
                variant="default"
                onClick={() => onUserAction(user.id, "activate")}
                className="flex-1"
              >
                <CheckCircle className="h-3 w-3 mr-1" />
                Activate
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <>
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg md:text-xl">User Management</CardTitle>
          <CardDescription className="text-sm">
            Manage registered users and their accounts ({users.length} total
            users)
          </CardDescription>
        </CardHeader>
        <CardContent className={isMobile ? "p-4" : "p-0 md:p-6"}>
          {users.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No users found</p>
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
                  <TableRow>
                    <TableHead className="text-xs md:text-sm min-w-[100px]">
                      Name
                    </TableHead>
                    <TableHead className="text-xs md:text-sm min-w-[150px]">
                      Email
                    </TableHead>
                    <TableHead className="text-xs md:text-sm min-w-[80px]">
                      Status
                    </TableHead>
                    <TableHead className="text-xs md:text-sm min-w-[80px]">
                      Listings
                    </TableHead>
                    <TableHead className="text-xs md:text-sm min-w-[80px]">
                      Joined
                    </TableHead>
                    <TableHead className="text-xs md:text-sm min-w-[150px] text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="text-xs md:text-sm font-medium">
                        {user.name}
                      </TableCell>
                      <TableCell className="text-xs md:text-sm">
                        <div className="max-w-[150px] truncate">
                          {user.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            user.status === "active" ? "default" : "destructive"
                          }
                          className="text-xs"
                        >
                          {user.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs md:text-sm">
                        {user.listingsCount}
                      </TableCell>
                      <TableCell className="text-xs md:text-sm">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewProfile(user.id)}
                            className="h-7 w-7 p-0 md:h-8 md:w-auto md:px-2"
                          >
                            <Eye className="h-3 w-3 md:h-4 md:w-4" />
                            <span className="ml-1 hidden md:inline">View</span>
                          </Button>

                          {user.status === "active" ? (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => onUserAction(user.id, "suspend")}
                              className="h-7 w-7 p-0 md:h-8 md:w-auto md:px-2"
                            >
                              <UserX className="h-3 w-3 md:h-4 md:w-4" />
                              <span className="ml-1 hidden md:inline">
                                Suspend
                              </span>
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => onUserAction(user.id, "activate")}
                              className="h-7 w-7 p-0 md:h-8 md:w-auto md:px-2"
                            >
                              <CheckCircle className="h-3 w-3 md:h-4 md:w-4" />
                              <span className="ml-1 hidden md:inline">
                                Activate
                              </span>
                            </Button>
                          )}
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
    </>
  );
};

export default AdminUsersTab;
