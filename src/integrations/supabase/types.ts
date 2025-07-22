export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      api_keys: {
        Row: {
          api_key: string;
          created_at: string | null;
          id: number;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          api_key: string;
          created_at?: string | null;
          id?: never;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          api_key?: string;
          created_at?: string | null;
          id?: never;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      books: {
        Row: {
          author: string;
          back_cover: string | null;
          category: string;
          condition: string;
          created_at: string;
          description: string;
          front_cover: string | null;
          grade: string | null;
          id: string;
          image_url: string;
                    inside_pages: string | null;
          seller_subaccount_code: string | null;
          pickup_address: Json | null;
          price: number;
          province: string | null;
          requires_banking_setup: boolean | null;
          seller_id: string;
          sold: boolean;
          availability: string | null; // 'available' | 'sold' | 'reserved' | 'unavailable'
          sold_at: string | null;
          title: string;
          university_year: string | null;
        };
        Insert: {
          author: string;
          back_cover?: string | null;
          category: string;
          condition: string;
          created_at?: string;
          description: string;
          front_cover?: string | null;
          grade?: string | null;
          id?: string;
          image_url: string;
                    inside_pages?: string | null;
          seller_subaccount_code?: string | null;
          pickup_address?: Json | null;
          price: number;
          province?: string | null;
          requires_banking_setup?: boolean | null;
          seller_id: string;
          sold?: boolean;
          availability?: string | null;
          sold_at?: string | null;
          title: string;
          university_year?: string | null;
        };
        Update: {
          author?: string;
          back_cover?: string | null;
          category?: string;
          condition?: string;
          created_at?: string;
          description?: string;
          front_cover?: string | null;
          grade?: string | null;
          id?: string;
          image_url?: string;
                    inside_pages?: string | null;
          seller_subaccount_code?: string | null;
          pickup_address?: Json | null;
          price?: number;
          province?: string | null;
          requires_banking_setup?: boolean | null;
          seller_id?: string;
          sold?: boolean;
          availability?: string | null;
          sold_at?: string | null;
          title?: string;
          university_year?: string | null;
        };
        Relationships: [];
      };
      broadcasts: {
        Row: {
          active: boolean;
          created_at: string;
          created_by: string | null;
          expires_at: string | null;
          id: string;
          message: string;
          priority: Database["public"]["Enums"]["broadcast_priority"];
          target_audience:
            | Database["public"]["Enums"]["broadcast_target_audience"]
            | null;
          title: string;
          type: Database["public"]["Enums"]["broadcast_type"];
          updated_at: string;
        };
        Insert: {
          active?: boolean;
          created_at?: string;
          created_by?: string | null;
          expires_at?: string | null;
          id?: string;
          message: string;
          priority?: Database["public"]["Enums"]["broadcast_priority"];
          target_audience?:
            | Database["public"]["Enums"]["broadcast_target_audience"]
            | null;
          title: string;
          type?: Database["public"]["Enums"]["broadcast_type"];
          updated_at?: string;
        };
        Update: {
          active?: boolean;
          created_at?: string;
          created_by?: string | null;
          expires_at?: string | null;
          id?: string;
          message?: string;
          priority?: Database["public"]["Enums"]["broadcast_priority"];
          target_audience?:
            | Database["public"]["Enums"]["broadcast_target_audience"]
            | null;
          title?: string;
          type?: Database["public"]["Enums"]["broadcast_type"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "broadcasts_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      contact_messages: {
        Row: {
          created_at: string;
          email: string;
          id: string;
          message: string;
          name: string;
          status: string;
          subject: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          email: string;
          id?: string;
          message: string;
          name: string;
          status?: string;
          subject: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          email?: string;
          id?: string;
          message?: string;
          name?: string;
          status?: string;
          subject?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      email_notifications: {
        Row: {
          created_at: string;
          email: string;
          id: string;
        };
        Insert: {
          created_at?: string;
          email: string;
          id?: string;
        };
        Update: {
          created_at?: string;
          email?: string;
          id?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          created_at: string;
          id: string;
          message: string;
          read: boolean;
          title: string;
          type: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          message: string;
          read?: boolean;
          title: string;
          type: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          message?: string;
          read?: boolean;
          title?: string;
          type?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          addresses_same: boolean | null;
          aps_score: number | null;
          banking_info: Json | null;
          banking_verified: boolean | null;
          banking_setup_at: string | null;
          bio: string | null;
          created_at: string;
          email: string | null;
          id: string;
          is_admin: boolean | null;
          name: string | null;
          paystack_subaccount_code: string | null;
          pickup_address: Json | null;
          profile_picture_url: string | null;
          shipping_address: Json | null;
          status: string | null;
          suspended_at: string | null;
          suspension_reason: string | null;
          updated_at: string;
        };
        Insert: {
          addresses_same?: boolean | null;
          aps_score?: number | null;
          banking_info?: Json | null;
          banking_verified?: boolean | null;
          banking_setup_at?: string | null;
          bio?: string | null;
          created_at?: string;
          email?: string | null;
          id: string;
          is_admin?: boolean | null;
          name?: string | null;
          paystack_subaccount_code?: string | null;
          pickup_address?: Json | null;
          profile_picture_url?: string | null;
          shipping_address?: Json | null;
          status?: string | null;
          suspended_at?: string | null;
          suspension_reason?: string | null;
          updated_at?: string;
        };
        Update: {
          addresses_same?: boolean | null;
          aps_score?: number | null;
          banking_info?: Json | null;
          banking_verified?: boolean | null;
          banking_setup_at?: string | null;
          bio?: string | null;
          created_at?: string;
          email?: string | null;
          id?: string;
          is_admin?: boolean | null;
          name?: string | null;
          paystack_subaccount_code?: string | null;
          pickup_address?: Json | null;
          profile_picture_url?: string | null;
          shipping_address?: Json | null;
          status?: string | null;
          suspended_at?: string | null;
          suspension_reason?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      reports: {
        Row: {
          book_id: string | null;
          book_title: string;
          created_at: string;
          id: string;
          reason: string;
          reported_user_id: string;
          reporter_user_id: string;
          seller_name: string;
          status: string;
          updated_at: string;
        };
        Insert: {
          book_id?: string | null;
          book_title: string;
          created_at?: string;
          id?: string;
          reason: string;
          reported_user_id: string;
          reporter_user_id: string;
          seller_name: string;
          status?: string;
          updated_at?: string;
        };
        Update: {
          book_id?: string | null;
          book_title?: string;
          created_at?: string;
          id?: string;
          reason?: string;
          reported_user_id?: string;
          reporter_user_id?: string;
          seller_name?: string;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reports_book_id_fkey";
            columns: ["book_id"];
            isOneToOne: false;
            referencedRelation: "books";
            referencedColumns: ["id"];
          },
        ];
      };
      sale_commitments: {
        Row: {
          id: string;
          book_id: string;
          seller_id: string;
          buyer_id: string;
          purchase_amount: number;
          delivery_fee: number;
          total_amount: number;
          status: string;
          committed_at: string | null;
          expires_at: string;
          payment_reference: string | null;
          payment_status: string;
          delivery_confirmed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          book_id: string;
          seller_id: string;
          buyer_id: string;
          purchase_amount: number;
          delivery_fee?: number;
          total_amount: number;
          status?: string;
          committed_at?: string | null;
          expires_at: string;
          payment_reference?: string | null;
          payment_status?: string;
          delivery_confirmed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          book_id?: string;
          seller_id?: string;
          buyer_id?: string;
          purchase_amount?: number;
          delivery_fee?: number;
          total_amount?: number;
          status?: string;
          committed_at?: string | null;
          expires_at?: string;
          payment_reference?: string | null;
          payment_status?: string;
          delivery_confirmed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "sale_commitments_book_id_fkey";
            columns: ["book_id"];
            isOneToOne: false;
            referencedRelation: "books";
            referencedColumns: ["id"];
          },
        ];
      };
      transactions: {
        Row: {
          book_id: string;
          book_title: string;
          buyer_id: string;
          commission: number;
          created_at: string;
          id: string;
          price: number;
          seller_id: string;
        };
        Insert: {
          book_id: string;
          book_title: string;
          buyer_id: string;
          commission: number;
          created_at?: string;
          id?: string;
          price: number;
          seller_id: string;
        };
        Update: {
          book_id?: string;
          book_title?: string;
          buyer_id?: string;
          commission?: number;
          created_at?: string;
          id?: string;
          price?: number;
          seller_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "transactions_book_id_fkey";
            columns: ["book_id"];
            isOneToOne: false;
            referencedRelation: "books";
            referencedColumns: ["id"];
          },
        ];
      };
      waitlist: {
        Row: {
          created_at: string;
          email: string;
          id: string;
          notified: boolean;
        };
        Insert: {
          created_at?: string;
          email: string;
          id?: string;
          notified?: boolean;
        };
        Update: {
          created_at?: string;
          email?: string;
          id?: string;
          notified?: boolean;
        };
                        Relationships: [];
      };
      banking_subaccounts: {
        Row: {
          id: string;
          user_id: string;
          subaccount_code: string;
          recipient_code: string | null;
          business_name: string;
          business_description: string | null;
          bank_code: string;
          account_number: string;
          account_name: string | null;
          percentage_charge: number;
          settlement_bank: string | null;
          is_verified: boolean;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          subaccount_code: string;
          recipient_code?: string | null;
          business_name: string;
          business_description?: string | null;
          bank_code: string;
          account_number: string;
          account_name?: string | null;
          percentage_charge?: number;
          settlement_bank?: string | null;
          is_verified?: boolean;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          subaccount_code?: string;
          recipient_code?: string | null;
          business_name?: string;
          business_description?: string | null;
          bank_code?: string;
          account_number?: string;
          account_name?: string | null;
          percentage_charge?: number;
          settlement_bank?: string | null;
          is_verified?: boolean;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "banking_subaccounts_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
                ];
      };
      payment_transactions: {
        Row: {
          id: string;
          order_id: string | null;
          paystack_reference: string;
          amount: number; // in kobo
          status: string; // 'pending' | 'success' | 'failed' | 'abandoned'
          payment_method: string | null;
          currency: string;
          customer_email: string;
          customer_name: string | null;
          metadata: Json | null;
          gateway_response: Json | null;
          paid_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_id?: string | null;
          paystack_reference: string;
          amount: number;
          status?: string;
          payment_method?: string | null;
          currency?: string;
          customer_email: string;
          customer_name?: string | null;
          metadata?: Json | null;
          gateway_response?: Json | null;
          paid_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string | null;
          paystack_reference?: string;
          amount?: number;
          status?: string;
          payment_method?: string | null;
          currency?: string;
          customer_email?: string;
          customer_name?: string | null;
          metadata?: Json | null;
          gateway_response?: Json | null;
          paid_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "payment_transactions_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          }
                ];
      };
      refund_transactions: {
        Row: {
          id: string;
          order_id: string | null;
          payment_reference: string;
          refund_reference: string | null;
          amount: number; // in kobo
          reason: string | null;
          status: string; // 'pending' | 'processing' | 'success' | 'failed'
          gateway_response: Json | null;
          initiated_by: string | null;
          initiated_at: string;
          processed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_id?: string | null;
          payment_reference: string;
          refund_reference?: string | null;
          amount: number;
          reason?: string | null;
          status?: string;
          gateway_response?: Json | null;
          initiated_by?: string | null;
          initiated_at?: string;
          processed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string | null;
          payment_reference?: string;
          refund_reference?: string | null;
          amount?: number;
          reason?: string | null;
          status?: string;
          gateway_response?: Json | null;
          initiated_by?: string | null;
          initiated_at?: string;
          processed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "refund_transactions_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          }
        ];
      };
      orders: {
        Row: {
          id: string;
          buyer_email: string;
          seller_id: string;
          amount: number; // in kobo (cents)
          paystack_ref: string;
          status: string; // 'pending' | 'paid' | 'cancelled' | 'refunded'
          items: Json; // JSONB array of order items
          shipping_address: Json | null; // JSONB shipping address
          delivery_data: Json | null; // JSONB delivery information
          metadata: Json | null; // JSONB additional metadata
          paid_at: string | null; // TIMESTAMP WITH TIME ZONE
          payment_held: boolean | null;
          created_at: string; // TIMESTAMP WITH TIME ZONE
          updated_at: string; // TIMESTAMP WITH TIME ZONE
          // Additional columns from order cancellation migration
          delivery_status: string | null;
          courier_booking_id: string | null;
          courier_service: string | null;
          pickup_scheduled_at: string | null;
          pickup_failed_at: string | null;
          pickup_failure_reason: string | null;
          rescheduled_at: string | null;
          cancelled_at: string | null;
          cancellation_reason: string | null;
          declined_at: string | null;
          decline_reason: string | null;
          delivery_info: Json | null;
          refund_status: string | null;
          refund_reference: string | null;
          refunded_at: string | null;
          total_refunded: number | null;
        };
        Insert: {
          id?: string;
          buyer_email: string;
          seller_id: string;
          amount: number;
          paystack_ref: string;
          status?: string;
          items?: Json;
          shipping_address?: Json | null;
          delivery_data?: Json | null;
          metadata?: Json | null;
          paid_at?: string | null;
          payment_held?: boolean | null;
          created_at?: string;
          updated_at?: string;
          delivery_status?: string | null;
          courier_booking_id?: string | null;
          courier_service?: string | null;
          pickup_scheduled_at?: string | null;
          pickup_failed_at?: string | null;
          pickup_failure_reason?: string | null;
          rescheduled_at?: string | null;
          cancelled_at?: string | null;
          cancellation_reason?: string | null;
          declined_at?: string | null;
          decline_reason?: string | null;
          delivery_info?: Json | null;
          refund_status?: string | null;
          refund_reference?: string | null;
          refunded_at?: string | null;
          total_refunded?: number | null;
        };
        Update: {
          id?: string;
          buyer_email?: string;
          seller_id?: string;
          amount?: number;
          paystack_ref?: string;
          status?: string;
          items?: Json;
          shipping_address?: Json | null;
          delivery_data?: Json | null;
          metadata?: Json | null;
          paid_at?: string | null;
          payment_held?: boolean | null;
          created_at?: string;
          updated_at?: string;
          delivery_status?: string | null;
          courier_booking_id?: string | null;
          courier_service?: string | null;
          pickup_scheduled_at?: string | null;
          pickup_failed_at?: string | null;
          pickup_failure_reason?: string | null;
          rescheduled_at?: string | null;
          cancelled_at?: string | null;
          cancellation_reason?: string | null;
          declined_at?: string | null;
          decline_reason?: string | null;
          delivery_info?: Json | null;
          refund_status?: string | null;
          refund_reference?: string | null;
          refunded_at?: string | null;
          total_refunded?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "orders_seller_id_fkey";
            columns: ["seller_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      delete_user_profile: {
        Args: { user_id: string };
        Returns: undefined;
      };
      generate_api_key: {
        Args: { user_id: string };
        Returns: string;
      };
      get_user_profile: {
        Args: { user_id: string };
        Returns: {
          id: string;
          name: string;
          email: string;
        }[];
      };
      has_role: {
        Args:
          | { user_id: number; role_name: string }
          | { user_id: string; role_name: string };
        Returns: boolean;
      };
      is_admin: {
        Args: { user_id: string };
        Returns: boolean;
      };
      list_all_profiles: {
        Args: Record<PropertyKey, never>;
        Returns: {
          id: string;
          username: string;
          email: string;
          created_at: string;
        }[];
      };
      update_user_profile: {
        Args: { user_id: string; new_name: string; new_email: string };
        Returns: undefined;
      };
    };
    Enums: {
      broadcast_priority: "low" | "normal" | "medium" | "high" | "urgent";
      broadcast_target_audience: "all" | "users" | "admin";
      broadcast_type: "info" | "warning" | "success" | "error";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DefaultSchema = Database[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      broadcast_priority: ["low", "normal", "medium", "high", "urgent"],
      broadcast_target_audience: ["all", "users", "admin"],
      broadcast_type: ["info", "warning", "success", "error"],
    },
  },
} as const;
