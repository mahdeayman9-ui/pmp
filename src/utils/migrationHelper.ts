import { supabase } from '../lib/supabase';

export const runProfileMigration = async () => {
  const migrationSQL = `
    -- Fix missing RLS policies for profiles table
    -- Allow users to insert their own profile
    DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
    CREATE POLICY "Users can insert own profile" ON profiles
      FOR INSERT WITH CHECK (auth.uid() = id);

    -- Allow users to update their own profile
    DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
    CREATE POLICY "Users can update own profile" ON profiles
      FOR UPDATE USING (auth.uid() = id);

    -- Allow authenticated users to view all profiles (for admin/manager functionality)
    DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON profiles;
    CREATE POLICY "Authenticated users can view all profiles" ON profiles
      FOR SELECT USING (auth.role() = 'authenticated');

    -- Allow authenticated users to insert profiles (for admin creating users)
    DROP POLICY IF EXISTS "Authenticated users can insert profiles" ON profiles;
    CREATE POLICY "Authenticated users can insert profiles" ON profiles
      FOR INSERT WITH CHECK (auth.role() = 'authenticated');

    -- Allow authenticated users to update profiles (for admin/manager functionality)
    DROP POLICY IF EXISTS "Authenticated users can update profiles" ON profiles;
    CREATE POLICY "Authenticated users can update profiles" ON profiles
      FOR UPDATE USING (auth.role() = 'authenticated');
  `;

  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });

    if (error) {
      console.error('Migration failed:', error);
      return { success: false, error };
    }

    console.log('Migration completed successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Migration error:', error);
    return { success: false, error };
  }
};