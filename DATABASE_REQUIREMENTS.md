# 🗄️ Database Requirements for ReBooked Platform

## 📋 **Essential Tables You Need to Create**

### 🔥 **CRITICAL - Must Have (For Basic Functionality)**

1. **`profiles`** - User profiles and basic info
   ```sql
   CREATE TABLE profiles (
       id UUID PRIMARY KEY REFERENCES auth.users(id),
       name TEXT,
       email TEXT,
       role TEXT DEFAULT 'user',
       status TEXT DEFAULT 'active',
       created_at TIMESTAMPTZ DEFAULT now()
   );
   ```

2. **`books`** - Book listings
   ```sql
   CREATE TABLE books (
       id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
       title TEXT NOT NULL,
       author TEXT NOT NULL,
       price DECIMAL(10,2) NOT NULL,
       seller_id UUID REFERENCES auth.users(id),
       sold BOOLEAN DEFAULT false,
       created_at TIMESTAMPTZ DEFAULT now()
   );
   ```

### 💰 **SELLER PAYOUT SYSTEM (For the admin dashboard you're building)**

3. **`seller_payouts`** - Main payout tracking
4. **`payout_items`** - Individual sales in each payout
5. **`transactions`** - All book sales and payments
6. **`banking_details`** - Seller banking information
7. **`commission_settings`** - Platform commission configuration

### 📊 **ADMIN DASHBOARD FEATURES**

8. **`contact_messages`** - Contact form submissions
9. **`reports`** - User reports and moderation
10. **`payout_notifications`** - Email/SMS notifications for payouts

## 🚀 **Quick Setup Commands**

### Step 1: Basic Tables (Run in Supabase SQL Editor)
```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT,
    email TEXT,
    role TEXT DEFAULT 'user',
    status TEXT DEFAULT 'active',
    subaccount_code TEXT,
    phone TEXT,
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Books table  
CREATE TABLE IF NOT EXISTS books (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    sold BOOLEAN DEFAULT false,
    category TEXT,
    condition TEXT,
    grade TEXT,
    university TEXT,
    university_year TEXT,
    description TEXT,
    seller_subaccount_code TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Contact messages
CREATE TABLE IF NOT EXISTS contact_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'unread',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Reports table
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_id UUID REFERENCES auth.users(id),
    reported_item_id UUID,
    reported_item_type TEXT,
    reason TEXT,
    description TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT now()
);
```

### Step 2: Seller Payout System (Use the file I created)
```bash
# Run the comprehensive seller payout schema
# Copy and paste the contents of database_schema_seller_payouts.sql into Supabase SQL editor
```

### Step 3: Enable Row Level Security
```sql
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Basic policies (users can see their own data)
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Anyone can view unsold books" ON books FOR SELECT USING (sold = false);
CREATE POLICY "Users can manage own books" ON books FOR ALL USING (auth.uid() = seller_id);

-- Admin policies
CREATE POLICY "Admins can manage all data" ON profiles FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

CREATE POLICY "Admins can manage all books" ON books FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

CREATE POLICY "Admins can manage messages" ON contact_messages FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

CREATE POLICY "Admins can manage reports" ON reports FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);
```

## 🔧 **Current Issues & Fixes**

### 1. Book Query Errors
The `books` table might be missing some columns. Add them:

```sql
-- Add missing columns to books table if they don't exist
ALTER TABLE books ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE books ADD COLUMN IF NOT EXISTS condition TEXT;
ALTER TABLE books ADD COLUMN IF NOT EXISTS grade TEXT;
ALTER TABLE books ADD COLUMN IF NOT EXISTS university TEXT;
ALTER TABLE books ADD COLUMN IF NOT EXISTS university_year TEXT;
ALTER TABLE books ADD COLUMN IF NOT EXISTS description TEXT;
```

### 2. Make an Admin User
```sql
-- Make yourself an admin
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'your-email@example.com';
```

## 📈 **Database Priority Order**

1. **Start Here** ⚡ - `profiles` + `books` (basic platform)
2. **Add Next** 💰 - Seller payout system (use my schema file)
3. **Then Add** 📊 - Contact messages & reports (admin features)
4. **Optional** 🎯 - Advanced features (analytics, notifications)

## 🚨 **Quick Troubleshooting**

### If you get "table does not exist" errors:
```sql
-- Check what tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';
```

### If you get permission errors:
```sql
-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'your_table_name';
```

### If admin dashboard doesn't work:
```sql
-- Make sure you're an admin
SELECT id, email, role FROM profiles WHERE email = 'your-email@example.com';

-- If role is null, set it to admin
UPDATE profiles SET role = 'admin' WHERE email = 'your-email@example.com';
```

## 📝 **Next Steps After Database Setup**

1. ✅ Run the basic tables SQL above
2. ✅ Run the seller payout schema (`database_schema_seller_payouts.sql`)
3. ✅ Make yourself an admin user
4. ✅ Test the admin dashboard
5. ✅ Set up your Paystack keys in environment variables
6. ✅ Test the seller payout workflow

Your seller payout system will then be fully functional with real database integration! 🎉
