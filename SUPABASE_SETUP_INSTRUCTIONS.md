# 🔧 Supabase Setup Instructions

## ⚠️ CRITICAL: Disable Email Verification for Instant Login

### Step 1: Go to Supabase Dashboard
1. Open your Supabase project
2. Go to **Authentication** → **Providers** → **Email**

### Step 2: Disable Email Confirmation
Find and **UNCHECK** this option:
```
☐ Confirm email
```

### Step 3: Save Changes
Click **Save** button

---

## 📝 Run SQL Setup (Required)

### Go to SQL Editor and run:

```sql
-- ✅ 30-Day Trial System Setup

-- 1. Update the trigger function
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
    (CURRENT_DATE + INTERVAL '30 days')::date,
    3
  );
  RETURN new;
END;
$$;

-- 2. Attach trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_default_role();

-- 3. Fix existing users
UPDATE public.users 
SET max_devices = 3 
WHERE max_devices IS NULL;
```

---

## ✅ After Setup:
- New signups work instantly (no email verification)
- 30 days free trial
- 3 device limit
- Full access to all modules

---

## 🔐 Optional: Re-enable Email Verification Later
Once testing is done, you can re-enable email confirmation in Supabase settings.
