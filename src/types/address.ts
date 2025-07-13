export interface Address {
  street: string;
  city: string;
  province: string;
  postalCode: string;
  streetAddress?: string; // For backend compatibility
  instructions?: string; // For additional details like unit numbers, gate codes, etc.
}

export interface AddressData {
  pickup_address?: Address;
  shipping_address?: Address;
  addresses_same?: boolean;
}

export interface UserProfile {
  id: string;
  name?: string;
  email?: string;
  isAdmin?: boolean;
  avatar_url?: string;
  bio?: string;
  university?: string;
  status?: "active" | "suspended" | string; // string for flexibility if other statuses exist
  suspension_reason?: string;
  created_at: string; // Assuming this is always present
  pickup_address?: Address; // Added from profiles table schema
  shipping_address?: Address; // Added from profiles table schema
  addresses_same?: boolean; // Added from profiles table schema
  profile_picture_url?: string; // Added from profiles table schema
  updated_at?: string; // Added from profiles table schema
  pending_email?: string; // From emailChangeService logic potentially on profiles
  pending_email_token?: string;
  pending_email_expires_at?: string;
}

export interface UserStats {
  totalListings: number;
  activeSales: number;
  totalSales: number;
  totalEarnings: number;
  completedSales: number;
  rating?: number;
  lastActive?: string;
}

export interface DebugInfo {
  url: string;
  hash: string;
  search: string;
  hasSession: boolean;
  sessionUser: string;
  timestamp: string;
}

export interface DatabaseTestResult {
  type: "error" | "success" | "info" | "data";
  content: string | unknown[];
}
