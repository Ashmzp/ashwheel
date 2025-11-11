-- Fix specific RLS policies that use uid() directly (performance issue)

-- 1. Fix active_sessions policy
DROP POLICY IF EXISTS "Users can view their own active sessions" ON active_sessions;
CREATE POLICY "Users can view their own active sessions" ON active_sessions
FOR SELECT TO authenticated
USING ((SELECT auth.uid()) = user_id);

-- 2. Fix data_entries policy  
DROP POLICY IF EXISTS "Allow full access to own data" ON data_entries;
CREATE POLICY "Allow full access to own data" ON data_entries
FOR ALL TO authenticated
USING ((SELECT auth.uid()) = user_id);

-- 3. Fix invoices policy
DROP POLICY IF EXISTS "Users can manage their own invoices" ON invoices;
CREATE POLICY "Users can manage their own invoices" ON invoices
FOR ALL TO authenticated
USING ((SELECT auth.uid()) = user_id);

-- 4. Fix journal_entries policy
DROP POLICY IF EXISTS "Users can manage their own journal entries" ON journal_entries;
CREATE POLICY "Users can manage their own journal entries" ON journal_entries
FOR ALL TO authenticated
USING ((SELECT auth.uid()) = user_id);

-- 5. Fix price_list policy
DROP POLICY IF EXISTS "Users can manage their own price list" ON price_list;
CREATE POLICY "Users can manage their own price list" ON price_list
FOR ALL TO authenticated
USING ((SELECT auth.uid()) = user_id);

-- 6. Fix receipts policy
DROP POLICY IF EXISTS "Users can manage their own receipts" ON receipts;
CREATE POLICY "Users can manage their own receipts" ON receipts
FOR ALL TO authenticated
USING ((SELECT auth.uid()) = user_id);

-- 7. Fix users policy
DROP POLICY IF EXISTS "Users can view and update their own data" ON users;
CREATE POLICY "Users can view and update their own data" ON users
FOR ALL TO authenticated
USING ((SELECT auth.uid()) = id);