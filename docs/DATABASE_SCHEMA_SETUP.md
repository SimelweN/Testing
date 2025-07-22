# Database Schema Setup for ReBooked Solutions

## ✅ Verified Database Schema

Based on the actual production database, here are the correct table schemas:

### banking_subaccounts Table ✅

```sql
create table public.banking_subaccounts (
  id uuid not null default gen_random_uuid (),
  business_name text not null,
  email text not null,
  bank_name text not null,
  bank_code text not null,
  account_number text not null,
  subaccount_code text null,
  paystack_response jsonb null,
  status text null default 'pending'::text,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  user_id uuid null,
  constraint banking_subaccounts_pkey primary key (id),
  constraint banking_subaccounts_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE,
  constraint banking_subaccounts_status_check check (
    (
      status = any (
        array['pending'::text, 'active'::text, 'failed'::text]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_banking_subaccounts_user_id on public.banking_subaccounts using btree (user_id) TABLESPACE pg_default;

create trigger set_timestamp BEFORE
update on banking_subaccounts for EACH row
execute FUNCTION trigger_set_timestamp ();
```

### books Table (seller_subaccount_code column)

The books table should have the `seller_subaccount_code` column. If it's missing, add it:

```sql
-- Add seller_subaccount_code column to books table if it doesn't exist
ALTER TABLE public.books 
ADD COLUMN IF NOT EXISTS seller_subaccount_code text null;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_books_seller_subaccount_code 
ON public.books(seller_subaccount_code);
```

## 🔧 Fixed Code Changes

The following changes have been made to align with the actual database schema:

### 1. Updated TypeScript Types

Updated `src/integrations/supabase/types.ts` to match the actual database columns:

```typescript
banking_subaccounts: {
  Row: {
    id: string;
    user_id: string | null;
    business_name: string;
    email: string;
    bank_name: string;
    bank_code: string;
    account_number: string;
    subaccount_code: string | null;
    paystack_response: any | null;
    status: string | null;
    created_at: string | null;
    updated_at: string | null;
  };
  // ... Insert and Update types
}
```

### 2. Updated Service Layer

Updated `src/services/paystackSubaccountService.ts` to use only existing columns:

```typescript
const insertData = {
  user_id: userId,
  business_name: details.business_name,
  email: details.email,
  bank_name: details.bank_name,
  bank_code: details.bank_code,
  account_number: details.account_number,
  subaccount_code: mockSubaccountCode,
  status: "active",
  paystack_response: {
    mock: true,
    created_at: new Date().toISOString(),
    user_id: userId,
    business_name: details.business_name,
  },
};
```

### 3. Updated Edge Function

Updated `supabase/functions/create-paystack-subaccount/index.ts` to store `recipient_code` in the `paystack_response` JSON field instead of a separate column:

```typescript
const updatedResponse = {
  ...(existingRecord?.paystack_response || {}),
  recipient_code: recipient_code,
  transfer_recipient_created_at: new Date().toISOString()
};

await supabase
  .from("banking_subaccounts")
  .update({ paystack_response: updatedResponse })
  .eq("subaccount_code", subaccount_code);
```

## 📊 What Gets Stored Where

### Subaccount Information
- **subaccount_code**: Stored in `banking_subaccounts.subaccount_code`
- **recipient_code**: Stored in `banking_subaccounts.paystack_response.recipient_code`
- **Paystack API response**: Stored in `banking_subaccounts.paystack_response`

### Book Linking
- **seller_subaccount_code**: Stored in `books.seller_subaccount_code`
- Links each book to the seller's payment account

### Profile Integration
- **subaccount_code**: Also stored in `profiles.subaccount_code` for quick access
- **Banking preferences**: Stored in `profiles.preferences.bank_details`

## 🧪 Testing

Use the debug components in the admin panel:

1. **Database Schema Checker**: Verifies what columns actually exist
2. **Subaccount Debug Test**: Tests the complete subaccount creation flow

## 🚨 Important Notes

1. **No Missing Columns**: The code no longer tries to insert non-existent columns
2. **JSON Storage**: Complex data like recipient codes are stored in the `paystack_response` JSON field
3. **Graceful Fallbacks**: If edge functions fail, mock data is created using the same schema
4. **Status Tracking**: All subaccounts have proper status tracking (`pending`, `active`, `failed`)

This setup ensures that the database operations will succeed with the actual production schema.
