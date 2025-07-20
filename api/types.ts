import type { VercelRequest, VercelResponse } from '@vercel/node';

export type { VercelRequest, VercelResponse };

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface OrderItem {
  book_id: string;
  seller_id: string;
  price: number;
  title?: string;
  author?: string;
}

export interface ShippingAddress {
  street: string;
  city: string;
  province: string;
  postal_code: string;
  suburb?: string;
}

export interface PaystackData {
  email: string;
  amount: number;
  currency: string;
  callback_url: string;
  metadata: Record<string, any>;
  subaccount?: string;
  split?: {
    type: string;
    currency: string;
    subaccounts: Array<{
      subaccount: string;
      share: number;
    }>;
    bearer_type: string;
    bearer_subaccount: string;
  };
}

export interface CreateOrderRequest {
  user_id: string;
  items: OrderItem[];
  total_amount: number;
  shipping_address: ShippingAddress;
  payment_reference: string;
  payment_data?: any;
}

export interface InitializePaymentRequest {
  user_id: string;
  items: OrderItem[];
  total_amount: number;
  shipping_address: ShippingAddress;
  email: string;
  metadata?: Record<string, any>;
}

export interface VerifyPaymentRequest {
  reference: string;
}

export interface PaystackWebhookEvent {
  event: string;
  data: {
    reference: string;
    amount: number;
    status: string;
    [key: string]: any;
  };
}
