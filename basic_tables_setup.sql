-- ==============================================
-- BASIC TABLES SETUP FOR REBOOKED PLATFORM
-- ==============================================
-- Run this in Supabase SQL editor to create essential tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================
-- 1. PROFILES TABLE (if not exists)
-- ==============================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT,
    email TEXT,
    role TEXT DEFAULT 'user',
    status TEXT DEFAULT 'active',
    subaccount_code TEXT,
    phone TEXT,
    address TEXT,
    is_admin BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ==============================================
-- 2. BOOKS TABLE (if not exists)
-- ==============================================
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
    image_url TEXT,
    seller_subaccount_code TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ==============================================
-- 3. CONTACT MESSAGES TABLE
-- ==============================================
CREATE TABLE IF NOT EXISTS contact_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'unread' CHECK (status IN ('unread', 'read')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ==============================================
-- 4. REPORTS TABLE
-- ==============================================
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_id UUID REFERENCES auth.users(id),
    reported_item_id UUID,
    reported_item_type TEXT,
    reason TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dismissed')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ==============================================
-- 5. ENABLE ROW LEVEL SECURITY
-- ==============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- ==============================================
-- 6. CREATE BASIC RLS POLICIES
-- ==============================================

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can manage all profiles" ON profiles FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (role = 'admin' OR is_admin = true))
);

-- Books policies
CREATE POLICY "Anyone can view unsold books" ON books FOR SELECT USING (sold = false);
CREATE POLICY "Users can manage own books" ON books FOR ALL USING (auth.uid() = seller_id);
CREATE POLICY "Admins can manage all books" ON books FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (role = 'admin' OR is_admin = true))
);

-- Contact messages policies (admin only)
CREATE POLICY "Admins can manage contact messages" ON contact_messages FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (role = 'admin' OR is_admin = true))
);

-- Reports policies
CREATE POLICY "Users can view own reports" ON reports FOR SELECT USING (auth.uid() = reporter_id);
CREATE POLICY "Users can create reports" ON reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Admins can manage all reports" ON reports FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (role = 'admin' OR is_admin = true))
);

-- ==============================================
-- 7. CREATE TRIGGERS FOR UPDATED_AT
-- ==============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_books_updated_at BEFORE UPDATE ON books FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contact_messages_updated_at BEFORE UPDATE ON contact_messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================
-- 8. CREATE ADMIN USER (UPDATE EMAIL)
-- ==============================================
-- Replace 'your-email@example.com' with your actual email
INSERT INTO profiles (id, name, email, role, is_admin)
SELECT
    auth.uid(),
    'Admin User',
    'adminsimnli@gmail.com',
    'admin',
    true
WHERE NOT EXISTS (
    SELECT 1 FROM profiles WHERE email = 'adminsimnli@gmail.com'
);

-- ==============================================
-- NOTIFICATION
-- ==============================================
DO $$
BEGIN
    RAISE NOTICE 'Basic tables created successfully!';
    RAISE NOTICE '';
    RAISE NOTICE 'Tables created:';
    RAISE NOTICE '✅ profiles - User profiles and admin status';
    RAISE NOTICE '✅ books - Book listings and inventory';
    RAISE NOTICE '✅ contact_messages - Contact form submissions';
    RAISE NOTICE '✅ reports - User reports and moderation';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Update the admin email in the INSERT statement above';
    RAISE NOTICE '2. Run the seller payout schema if needed';
    RAISE NOTICE '3. Test your admin dashboard';
END $$;
