
export interface Broadcast {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "success" | "error";
  priority: "low" | "normal" | "medium" | "high" | "urgent";
  active: boolean;
  createdAt: string;
  updatedAt?: string;
  expiresAt?: string;
  targetAudience?: "all" | "users" | "admin";
  createdBy?: string;
}
