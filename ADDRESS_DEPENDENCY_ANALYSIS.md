# Address Column Dependencies Analysis

## 🔍 Current State Summary

Based on code analysis, your database has **mixed state** - some tables still have plaintext address columns while encrypted versions exist alongside them.

## 📊 Tables with Address Columns

### **Profiles Table**
- ✅ `pickup_address_encrypted` (encrypted)
- ✅ `shipping_address_encrypted` (encrypted)  
- ❌ `pickup_address` (plaintext - **SHOULD BE DROPPED**)
- ❌ `shipping_address` (plaintext - **SHOULD BE DROPPED**)

### **Books Table**  
- ✅ `pickup_address_encrypted` (encrypted)
- ❌ `pickup_address` (plaintext - **SHOULD BE DROPPED**)

### **Orders Table**
- ✅ `shipping_address_encrypted` (encrypted)
- ❌ `shipping_address` (plaintext - **SHOULD BE DROPPED**)

### **Payment_Transactions Table**
- ❌ `shipping_address` (plaintext - **NEEDS MIGRATION**)

## 🚨 Critical Dependencies Found

### **Frontend Components (High Priority)**
**Files using plaintext columns:**
1. `src/components/SimpleAddressDialog.tsx` - Lines 41-42
2. `src/components/profile/ModernAddressTab.tsx` - Lines 57-58  
3. `src/components/checkout/EnhancedShippingForm.tsx` - Lines 180-184
4. `src/components/AddressEditDialog.tsx` - Lines 52-76
5. `src/components/SimpleAddressEditDialog.tsx` - Lines 53-76
6. `src/components/EnhancedAddressEditDialog.tsx` - Lines 68-91

### **Backend Services (Critical)**
**Files accessing plaintext columns:**
1. `src/services/checkoutValidationService.ts` - Lines 50-63, 89-90
2. `src/services/bankingService.ts` - Lines 555-573
3. `src/services/addressValidationService.ts` - Lines 44-50
4. `src/services/automaticShipmentService.ts` - Lines 65-292
5. `src/services/bookDeletionService.ts` - Lines 500-509

### **Edge Functions (Database Access)**
**Functions using plaintext columns:**
1. `supabase/functions/process-book-purchase/index.ts` - Line 152
2. `supabase/functions/commit-to-sale/index.ts` - Lines 120, 193-215
3. `supabase/functions/create-order/index.ts` - Lines 94, 134, 202-242
4. `supabase/functions/courier-guy-shipment/index.ts` - Lines 22-82

### **Database Schema Issues**
**Tables still having plaintext columns:**
1. `payment_transactions.shipping_address` (JSONB)
2. Indexes may exist on dropped columns
3. Views and functions may reference old columns

## 🎯 Migration Strategy

### **Phase 1: Database Schema Cleanup**
```sql
-- 1. Check if plaintext columns still exist
SELECT column_name, table_name 
FROM information_schema.columns 
WHERE column_name IN ('pickup_address', 'shipping_address')
AND table_schema = 'public';

-- 2. Drop plaintext columns (if they still exist)
ALTER TABLE profiles DROP COLUMN IF EXISTS pickup_address;
ALTER TABLE profiles DROP COLUMN IF EXISTS shipping_address;
ALTER TABLE books DROP COLUMN IF EXISTS pickup_address;  
ALTER TABLE orders DROP COLUMN IF EXISTS shipping_address;

-- 3. Migrate payment_transactions to encrypted
ALTER TABLE payment_transactions RENAME COLUMN shipping_address TO shipping_address_old;
ALTER TABLE payment_transactions ADD COLUMN shipping_address_encrypted TEXT;
```

### **Phase 2: Code Migration (Priority Order)**

**1. Update Address Services (Core)**
- ✅ `src/services/addressService.ts` - Already uses encrypted
- ❌ `src/services/checkoutValidationService.ts` - **NEEDS UPDATE**
- ❌ `src/services/automaticShipmentService.ts` - **NEEDS UPDATE**

**2. Update Components (Frontend)**
- ❌ All address dialog components - **NEED MIGRATION**
- ❌ Profile tabs - **NEED MIGRATION**

**3. Update Edge Functions (Backend)**
- ❌ All edge functions accessing profile.pickup_address - **CRITICAL**

### **Phase 3: Data Migration**
```sql
-- Migrate existing data from plaintext to encrypted
-- (This would need to be done through edge functions)
```

## 🛠️ Recommended Action Plan

### **Immediate (Today)**
1. **Run the drop plaintext columns migration**
2. **Update core services to use decrypt functions**
3. **Fix critical edge functions**

### **Next (This Week)**  
1. **Update all frontend components**
2. **Migrate payment_transactions table**
3. **Test encrypted address flow end-to-end**

### **Final (Next Week)**
1. **Remove all plaintext address references**
2. **Update documentation**
3. **Verify security compliance**

## 🔧 Files Requiring Updates

### **High Priority (Breaks functionality)**
- `src/services/checkoutValidationService.ts`
- `src/services/automaticShipmentService.ts`  
- `supabase/functions/commit-to-sale/index.ts`
- `supabase/functions/process-book-purchase/index.ts`

### **Medium Priority (User experience)**
- All address dialog components
- Profile address tabs
- Checkout components

### **Low Priority (Legacy/Test)**
- Mock data files
- Debug utilities
- Migration scripts

## ⚠️ Risks

1. **Data Loss**: Dropping plaintext columns before migration
2. **App Breaks**: Services expect plaintext but only encrypted exists
3. **Performance**: Decryption overhead in frequently accessed paths
4. **Security**: Mixed plaintext/encrypted state creates vulnerabilities

## ✅ Next Steps

Please connect to Supabase so I can:
1. Verify current database schema state
2. Check which plaintext columns still exist
3. Plan safe migration order
4. Execute the migration systematically
