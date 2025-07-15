# Banking Subaccounts Table Structure

This document outlines the exact structure of the `banking_subaccounts` table as implemented.

## Table Structure: banking_subaccounts

### Primary Key

- **id** (UUID) - Primary key with auto-generated UUID

### Links to Users

- **user_id** (UUID) - Foreign key to `auth.users(id)` with CASCADE delete
- **email** (TEXT) - User's email address

### Links to Books

- **Books table** has `seller_subaccount_code` column that references `banking_subaccounts.subaccount_code`
- The `subaccount_code` is also duplicated in the **profiles table** for quick access

### Key Columns

- **subaccount_code** (TEXT) - The actual Paystack subaccount code for payment routing
- **business_name** (TEXT) - Business name for the subaccount
- **bank_name** (TEXT) - Bank name
- **bank_code** (TEXT) - Bank code for the bank
- **account_number** (TEXT) - Bank account number
- **paystack_response** (JSONB) - Full Paystack API response
- **status** (TEXT) - Status: 'pending', 'active', or 'failed'

### Timestamps

- **created_at** (TIMESTAMP WITH TIME ZONE) - When record was created
- **updated_at** (TIMESTAMP WITH TIME ZONE) - When record was last updated

### Security

- **Row Level Security (RLS)** ensures users can only access their own subaccounts
- **Policies** restrict all operations (SELECT, INSERT, UPDATE, DELETE) to the user who owns the record
- **Service role policy** allows backend operations

## Related Tables

### profiles table

- **subaccount_code** (TEXT) - References `banking_subaccounts.subaccount_code` for quick access

### books table

- **seller_subaccount_code** (TEXT) - References `banking_subaccounts.subaccount_code` for payment routing

## Indexes

- **Unique index** on `user_id` to ensure one banking account per user
- **Index** on `subaccount_code` for fast lookups
- **Index** on `books.seller_subaccount_code` for payment queries
- **Index** on `profiles.subaccount_code` for quick access

## Triggers and Functions

- **Auto-update trigger** maintains `updated_at` timestamp
- **Auto-link function** automatically links books and profiles when subaccount is created/updated

## Migration File

The table is created by: `supabase/migrations/20250114000003_create_banking_subaccounts.sql`

## Example Usage

```sql
-- Get user's banking details
SELECT * FROM banking_subaccounts WHERE user_id = 'user-uuid';

-- Get books linked to a subaccount
SELECT * FROM books WHERE seller_subaccount_code = 'ACCT_xxxxxxxxx';

-- Quick profile lookup
SELECT subaccount_code FROM profiles WHERE id = 'user-uuid';
```

## RLS Policies

1. **Users can view own banking details** - SELECT using `auth.uid() = user_id`
2. **Users can insert own banking details** - INSERT with check `auth.uid() = user_id`
3. **Users can update own banking details** - UPDATE using `auth.uid() = user_id`
4. **Users can delete own banking details** - DELETE using `auth.uid() = user_id`
5. **Service role can manage banking subaccounts** - ALL operations for service role
