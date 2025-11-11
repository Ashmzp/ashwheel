-- Fix RLS performance by wrapping auth functions in SELECT
-- This prevents re-evaluation for each row

-- Example fixes for common RLS policies
-- Replace: auth.uid() = user_id
-- With: (SELECT auth.uid()) = user_id

-- Note: You'll need to update your RLS policies manually
-- Here's the pattern to follow:

/*
-- Before (slow):
CREATE POLICY "policy_name" ON table_name
FOR ALL TO authenticated
USING (auth.uid() = user_id);

-- After (fast):
CREATE POLICY "policy_name" ON table_name  
FOR ALL TO authenticated
USING ((SELECT auth.uid()) = user_id);
*/

-- Check current RLS policies
SELECT schemaname, tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;