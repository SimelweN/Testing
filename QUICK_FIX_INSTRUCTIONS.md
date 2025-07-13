# Quick Fix Instructions

## Issue 1: Can't Add Study Resources

**Problem**: Database tables for study resources don't exist yet.

**Solution**:

### Option A: Manual Database Setup (Recommended)

1. Go to your Supabase project dashboard
2. Click on "SQL Editor" in the left menu
3. Copy the entire content from `database_setup.sql` file
4. Paste it into the SQL editor
5. Click "Run" to execute the script
6. Refresh the admin page

### Option B: Use Admin Interface

1. Go to Admin Dashboard → Utilities tab
2. Look for the "Database Status" section
3. Click "Try Auto-Setup" (may not work depending on permissions)
4. If it fails, follow Option A

## Issue 2: Demo Books Still Present

**Problem**: Demo/test books need to be removed from the database.

**Solution**:

1. Go to Admin Dashboard → Utilities tab
2. Click the red "Delete Demo Books Now" button in the header
3. This will immediately scan for and delete books with demo patterns like:
   - Titles containing: test, demo, sample, example, placeholder, dummy, fake, mock
   - Generic titles like "Book 1", "Title", "Name"
   - Very short random titles
   - Books with "untitled" or "no title"

## Expected Results

After following these steps:

- ✅ You should be able to create study resources and tips
- ✅ Demo books should be removed from the platform
- ✅ Database statistics should show updated counts
- ✅ Study resources page should work properly

## If You Still Have Issues

1. Check the browser console for error messages
2. Verify your admin role is set correctly in the database
3. Ensure your Supabase project has the proper permissions
4. Try refreshing the page after each fix

## Database Table Schema Created

The setup will create two new tables:

- `study_resources` - For admin-created study materials
- `study_tips` - For admin-created study tips

Both tables have proper Row Level Security (RLS) policies that allow:

- Anyone to view active/published content
- Only admins to create, edit, and delete content
