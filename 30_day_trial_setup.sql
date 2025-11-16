-- ✅ 30-Day Trial System Setup
-- Run this SQL in Supabase SQL Editor

-- 1. Update the trigger function to add 30-day validity on signup
CREATE OR REPLACE FUNCTION public.handle_new_user_default_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.users (id, email, role, access, app_valid_till, max_devices)
  VALUES (
    new.id, 
    new.email, 
    'user', 
    jsonb_build_object(
        'customers', 'full',
        'purchases', 'full',
        'purchase_returns', 'full',
        'stock', 'full',
        'reports', 'full',
        'vehicle_invoices', 'full',
        'sales_returns', 'full',
        'bookings', 'full',
        'workshop_purchases', 'full',
        'wp_return', 'full',
        'workshop_inventory', 'full',
        'job_cards', 'full',
        'ws_return', 'full',
        'workshop_follow_up', 'full',
        'mis_report', 'full',
        'journal_entry', 'full',
        'party_ledger', 'full',
        'receipts', 'full'
    ),
    (CURRENT_DATE + INTERVAL '30 days')::date,  -- 30 days free trial
    1  -- Allow 1 device by default
  );
  RETURN new;
END;
$$;

-- 2. Verify the trigger is attached
-- (This should already exist, but just to confirm)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_default_role();

-- 3. Fix existing users who don't have max_devices set
UPDATE public.users 
SET max_devices = 1 
WHERE max_devices IS NULL AND role = 'user';

-- ✅ Done! Now new signups will get:
-- - 30 days free trial
-- - Full access to all modules
-- - Auto read-only mode after expiry
-- - 1 device limit (can be changed by admin)
