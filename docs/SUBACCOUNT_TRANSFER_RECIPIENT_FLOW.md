# Subaccount + Transfer Recipient Creation Flow

## ✅ Overview

When creating a Paystack subaccount in ReBooked Solutions, the system automatically creates **BOTH** a subaccount and a transfer recipient using the same banking details. This ensures that:

1. **Subaccount** - Can receive split payments when customers purchase books
2. **Transfer Recipient** - Can receive direct payouts when sellers are paid

## 🔄 Automatic Flow

### What Happens When You Create a Subaccount:

1. **Subaccount Creation**
   - Creates Paystack subaccount with seller's banking details
   - Stores subaccount_code in database
   - Links to seller's profile

2. **Transfer Recipient Creation** *(Automatic)*
   - Uses the **SAME** banking details (bank_code, account_number, business_name)
   - Creates Paystack transfer recipient
   - Stores recipient_code in database
   - Links to the same subaccount record

3. **Database Updates**
   - Updates `banking_subaccounts` table with both codes
   - Updates seller's profile with subaccount_code
   - Updates all seller's books with subaccount_code

## 🎯 Implementation Locations

### Edge Function (Primary Logic)
- **File**: `supabase/functions/create-paystack-subaccount/index.ts`
- **Lines**: 682-731
- **What it does**: Creates both subaccount and transfer recipient, stores both codes

### Frontend Components Using This:

1. **PaystackTransferTester** ✅
   - Location: `src/components/admin/PaystackTransferTester.tsx`
   - Shows success message with both codes
   - Displays result badges for both subaccount and recipient

2. **PaystackSystemTestComponent** ✅
   - Location: `src/components/admin/PaystackSystemTestComponent.tsx`
   - Enhanced with subaccount creation tab
   - Shows information about what gets created

3. **PaystackDemo** ✅
   - Location: `src/pages/PaystackDemo.tsx`
   - Uses supabase.functions.invoke to call edge function
   - Shows success toast with both codes

4. **AdminPaystackTestingTab** ✅
   - Includes PaystackTransferTester which has full functionality

## 📊 Database Schema

### banking_subaccounts Table
```sql
CREATE TABLE banking_subaccounts (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  subaccount_code TEXT NOT NULL,          -- Paystack subaccount code
  recipient_code TEXT NULL,               -- Paystack transfer recipient code
  business_name TEXT NOT NULL,
  bank_code TEXT NOT NULL,
  account_number TEXT NOT NULL,
  -- ... other fields
);
```

## 🧪 Testing

### Success Indicators:
- ✅ Success toast shows both subaccount_code AND recipient_code
- ✅ Database record has both codes populated
- ✅ Can use subaccount for split payments
- ✅ Can use recipient for direct transfers

### Example Success Response:
```json
{
  "success": true,
  "message": "Banking details and subaccount created successfully! Transfer recipient also created.",
  "subaccount_code": "ACCT_abc123def456",
  "recipient_code": "RCP_xyz789uvw012",
  "user_id": "user-uuid",
  "data": {
    "subaccount_code": "ACCT_abc123def456",
    "recipient_code": "RCP_xyz789uvw012",
    "business_name": "John's Textbook Store",
    "bank_name": "Standard Bank",
    "account_number_masked": "****6789"
  }
}
```

## 🔧 How to Test

1. **Go to any Paystack test component**:
   - Admin Dashboard → Paystack Testing → PaystackTransferTester → "Subaccounts" tab
   - Admin Dashboard → Paystack Testing → PaystackSystemTestComponent → "Add Subaccounts" tab
   - PaystackDemo → "Subaccounts" tab

2. **Fill in the form**:
   - Business Name: "Test Business"
   - Email: "test@example.com"
   - Bank: Select any SA bank (e.g., Standard Bank - 058)
   - Account Number: Any valid format (e.g., "1234567890")

3. **Click "Create Subaccount"**

4. **Verify Success**:
   - Should see success toast with BOTH subaccount_code and recipient_code
   - Should see result badges showing both codes
   - Database should have both codes in banking_subaccounts table

## 🚨 Error Handling

### If Transfer Recipient Creation Fails:
- Subaccount creation still succeeds
- Warning message shown: "Transfer recipient creation failed or skipped"
- recipient_code field remains NULL in database
- System still functional for split payments, but direct transfers won't work

### Common Causes:
- Invalid bank details
- Paystack API issues
- Network connectivity problems
- Missing PAYSTACK_SECRET_KEY environment variable

## 💡 Benefits

1. **One-Step Setup**: Sellers only need to create subaccount once
2. **Dual Functionality**: Can receive both split payments and direct transfers
3. **Consistent Banking Details**: Same bank account used for both operations
4. **Automatic Linking**: Both codes stored together for easy reference
5. **Fallback Graceful**: If recipient creation fails, subaccount still works

This ensures that when sellers set up their banking details, they're immediately ready for both receiving split payments from customer purchases AND receiving direct payouts from the admin.
