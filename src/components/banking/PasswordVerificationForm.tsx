import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lock, Eye, EyeOff, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PasswordVerificationFormProps {
  onVerified: () => void;
  onCancel: () => void;
}

export default function PasswordVerificationForm({ onVerified, onCancel }: PasswordVerificationFormProps) {
  const [password, setPassword] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleVerifyPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password.trim()) {
      setError("Please enter your password");
      return;
    }

    setIsVerifying(true);
    setError("");

    try {
      // Get current user session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.email) {
        throw new Error("No active session found");
      }

      // Attempt to sign in with the provided password to verify it
      const { data, error } = await supabase.auth.signInWithPassword({
        email: session.user.email,
        password: password,
      });

      if (error) {
        if (error.message.includes("Invalid") || error.message.includes("password")) {
          setError("Incorrect password. Please try again.");
        } else {
          setError("Password verification failed. Please try again.");
        }
        return;
      }

      if (data.user) {
        toast.success("Password verified successfully");
        onVerified();
      } else {
        setError("Password verification failed. Please try again.");
      }
    } catch (err: any) {
      console.error("Password verification error:", err);
      setError("An error occurred during verification. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Security Notice */}
      <Alert className="border-yellow-200 bg-yellow-50">
        <Shield className="h-4 w-4 text-yellow-600" />
        <AlertDescription className="text-yellow-800">
          <strong>Security Verification Required</strong>
          <br />
          Please confirm your password to access banking details for security purposes.
        </AlertDescription>
      </Alert>

      <form onSubmit={handleVerifyPassword} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-medium">
            Confirm Your Password *
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`pl-10 pr-10 h-11 rounded-lg border-2 focus:border-blue-600 focus:ring-blue-600 ${
                error ? "border-red-300 focus:border-red-500" : ""
              }`}
              placeholder="Enter your current password"
              required
              disabled={isVerifying}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0 text-gray-400 hover:text-gray-600"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isVerifying}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
          {error && (
            <p className="text-sm text-red-600 mt-1">{error}</p>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <Button 
            type="submit" 
            disabled={isVerifying || !password.trim()}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            {isVerifying ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Verifying...
              </>
            ) : (
              <>
                <Lock className="h-4 w-4 mr-2" />
                Verify Password
              </>
            )}
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            disabled={isVerifying}
          >
            Cancel
          </Button>
        </div>
      </form>

      <div className="text-center">
        <p className="text-xs text-gray-500">
          This is the same password you use to log into your account
        </p>
      </div>
    </div>
  );
}
