import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UserProfile } from "@/types/address";
import EmailChangeDialog from "@/components/EmailChangeDialog";

interface AccountInformationProps {
  profile: UserProfile;
  onProfileUpdate: (updatedProfile: UserProfile) => void;
}

const AccountInformation = ({
  profile,
  onProfileUpdate,
}: AccountInformationProps) => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showEmailChange, setShowEmailChange] = useState(false);
  const [formData, setFormData] = useState({
    name: profile.name || "",
    bio: profile.bio || "",
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!user?.id) {
      toast.error("User not authenticated");
      return;
    }

    setIsSaving(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .update({
          name: formData.name,
          bio: formData.bio,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)
        .select()
        .single();

      if (error) throw error;

      // Convert the Supabase response to UserProfile type
      const updatedProfile: UserProfile = {
        ...profile,
        name: data.name,
        bio: data.bio,
        updated_at: data.updated_at,
        pickup_address:
          typeof data.pickup_address === "object" &&
          data.pickup_address !== null
            ? (data.pickup_address as {
                street: string;
                city: string;
                postal_code: string;
                province: string;
              })
            : undefined,
        shipping_address:
          typeof data.shipping_address === "object" &&
          data.shipping_address !== null
            ? (data.shipping_address as {
                street: string;
                city: string;
                postal_code: string;
                province: string;
              })
            : undefined,
      };

      onProfileUpdate(updatedProfile);
      setIsEditing(false);
      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: profile.name || "",
      bio: profile.bio || "",
    });
    setIsEditing(false);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Display Name</Label>
              {isEditing ? (
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Enter your display name"
                />
              ) : (
                <p className="text-sm text-gray-600 mt-1">
                  {profile.name || "No name set"}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="bio">Bio</Label>
              {isEditing ? (
                <textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => handleInputChange("bio", e.target.value)}
                  placeholder="Tell us about yourself..."
                  className="min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              ) : (
                <p className="text-sm text-gray-600 mt-1">
                  {profile.bio || "No bio added yet"}
                </p>
              )}
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div>
              <Label>Email Address</Label>
              <div className="flex items-center justify-between mt-1">
                <span className="text-sm text-gray-600">{user?.email}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowEmailChange(true)}
                >
                  Change Email
                </Button>
              </div>
            </div>

            <div>
              <Label>Account Status</Label>
              <div className="mt-1">
                <Badge
                  variant={
                    profile.status === "active" ? "default" : "destructive"
                  }
                >
                  {profile.status === "active" ? "Active" : "Suspended"}
                </Badge>
              </div>
              {profile.status === "suspended" && profile.suspension_reason && (
                <Alert className="mt-2" variant="destructive">
                  <AlertDescription>
                    Suspension reason: {profile.suspension_reason}
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <div>
              <Label>Member Since</Label>
              <p className="text-sm text-gray-600 mt-1">
                {new Date(profile.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            {isEditing ? (
              <>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
              </>
            ) : (
              <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
            )}
          </div>
        </CardContent>
      </Card>

      <EmailChangeDialog
        open={showEmailChange}
        onOpenChange={setShowEmailChange}
      />
    </>
  );
};

export default AccountInformation;
