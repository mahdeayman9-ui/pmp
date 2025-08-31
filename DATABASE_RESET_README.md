# 🗑️ PMP Database Reset Guide

## 🚨 Problem Analysis

Based on your error when creating projects with the admin user, the issues were likely caused by:

### **1. Complex RLS Policies**
- The previous schema had overly complex Row Level Security policies
- Recursive policy functions causing infinite loops
- Permission conflicts between different policy rules

### **2. Missing Foreign Key Data**
- Projects table referenced teams/companies that didn't exist
- Missing default company and team setup
- Broken referential integrity

### **3. Authentication Loops**
- Fixed in the previous update with loop prevention flags
- Session handling issues causing repeated auth attempts

## 🛠️ Solution: Complete Database Reset

### **Step 1: Backup (Optional)**
If you have important data, export it first from Supabase Dashboard.

### **Step 2: Reset Database**
1. **Go to your Supabase project dashboard**
2. **Navigate to SQL Editor**
3. **Copy and paste the entire content of `database-reset.sql`**
4. **Click "Run" to execute**

### **Step 3: Verify Setup**
After running the reset script, you should see:
- ✅ All tables created successfully
- ✅ Default company "إدارة المشاريع" created
- ✅ Default team "فريق التطوير" created
- ✅ RLS policies configured
- ✅ Indexes created

### **Step 4: Test the Application**
1. **Clear browser cache/cookies** for your PMP app
2. **Login with admin credentials**
3. **Try creating a new project** - it should work now!

## 📋 What Was Fixed

### **Simplified Schema**
- Removed complex team_members relationships
- Simplified foreign key constraints
- Cleaner table structure

### **Better RLS Policies**
- Removed recursive policy functions
- Simplified permission checks
- Clear separation of concerns

### **Default Data**
- Pre-created company and team
- Proper relationships established
- Ready-to-use setup

### **Improved Error Handling**
- Better constraint handling
- Graceful fallbacks for missing data
- Clear error messages

## 🔍 Key Changes Made

### **Before (Problematic)**
```sql
-- Complex recursive policies
CREATE POLICY "Users can view team memberships in their teams" ON team_members
  FOR SELECT USING (is_user_in_team(team_id));

-- Required complex function
CREATE OR REPLACE FUNCTION is_user_in_team(team_uuid UUID, user_uuid UUID DEFAULT auth.uid())
```

### **After (Clean)**
```sql
-- Simple direct policies
CREATE POLICY "Users can view team projects" ON projects
  FOR SELECT USING (
    team_id IN (
      SELECT team_id FROM profiles WHERE id = auth.uid()
    ) OR created_by = auth.uid()
  );
```

## 🚀 Next Steps

1. **Run the database reset script**
2. **Clear browser data**
3. **Test project creation**
4. **Create additional teams/users as needed**
5. **Start building your projects!**

## 📞 Support

If you encounter any issues after the reset:
1. Check the browser console for error messages
2. Verify your Supabase connection settings
3. Ensure the default company/team were created
4. Try logging out and back in

The new schema is much more robust and should handle all your project management needs without the previous permission and relationship issues.