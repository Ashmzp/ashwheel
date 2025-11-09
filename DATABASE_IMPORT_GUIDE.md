# 📊 Database Import Guide - Supabase (Coolify)

## 🎯 Import Order (Important!)

```
1. schema.sql   (Tables, Functions, Triggers)
2. roles.sql    (User Roles & Permissions)
3. data.sql     (Your actual data - if any)
```

---

## 📍 Method 1: Via Supabase Studio (Recommended)

### Step 1: Access Supabase Studio
```
URL: https://supabase.ashwheel.cloud
Login with credentials from Coolify
```

### Step 2: Go to SQL Editor
1. Click **"SQL Editor"** in left sidebar
2. Click **"New Query"**

### Step 3: Import schema.sql

**Copy content from:** `dump/schema.sql`

1. Open `dump/schema.sql` in text editor
2. Copy ALL content (Ctrl+A, Ctrl+C)
3. Paste in SQL Editor
4. Click **"Run"** button
5. Wait for completion (may take 1-2 minutes)

✅ **Success:** You'll see "Success. No rows returned"

### Step 4: Import roles.sql

**Copy content from:** `dump/roles.sql`

1. Open `dump/roles.sql` in text editor
2. Copy ALL content
3. Paste in SQL Editor
4. Click **"Run"**

✅ **Success:** Roles created

### Step 5: Import data.sql (Optional)

**Only if you have existing data to import**

1. Open `dump/data.sql` in text editor
2. Copy ALL content
3. Paste in SQL Editor
4. Click **"Run"**

✅ **Success:** Data imported

---

## 📍 Method 2: Via psql Command Line

### Step 1: SSH into VPS

```bash
ssh root@31.97.235.213
```

### Step 2: Upload SQL Files

**From your local machine:**

```bash
# Upload files to VPS
scp dump/schema.sql root@31.97.235.213:/tmp/
scp dump/roles.sql root@31.97.235.213:/tmp/
scp dump/data.sql root@31.97.235.213:/tmp/
```

### Step 3: Get Database Credentials

**From Coolify UI:**
1. Go to Supabase service
2. Click **"Environment Variables"**
3. Note down:
   - `POSTGRES_PASSWORD`
   - Database name (usually `postgres`)

### Step 4: Import via psql

```bash
# SSH into VPS
ssh root@31.97.235.213

# Find Supabase container
docker ps | grep supabase

# Import schema
docker exec -i <supabase-db-container-name> psql -U postgres -d postgres < /tmp/schema.sql

# Import roles
docker exec -i <supabase-db-container-name> psql -U postgres -d postgres < /tmp/roles.sql

# Import data (if needed)
docker exec -i <supabase-db-container-name> psql -U postgres -d postgres < /tmp/data.sql
```

---

## 📍 Method 3: Via Coolify File Manager (Easiest)

### Step 1: Access Coolify

```
http://31.97.235.213:8000
```

### Step 2: Go to Supabase Service

1. Click on **Supabase** service
2. Go to **"Terminal"** or **"Execute Command"**

### Step 3: Upload and Import

```bash
# Create temp directory
mkdir -p /tmp/db-import

# Upload files via Coolify file manager
# Or use terminal to paste content

# Import schema
psql -U postgres -d postgres -f /tmp/db-import/schema.sql

# Import roles
psql -U postgres -d postgres -f /tmp/db-import/roles.sql

# Import data
psql -U postgres -d postgres -f /tmp/db-import/data.sql
```

---

## ✅ Verification Steps

### 1. Check Tables Created

**In Supabase Studio:**
1. Go to **"Table Editor"**
2. You should see tables like:
   - `users`
   - `customers`
   - `purchases`
   - `vehicle_invoices`
   - `job_cards`
   - `stock`
   - etc.

### 2. Check Functions

**In SQL Editor, run:**

```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_type = 'FUNCTION';
```

✅ Should show functions like:
- `generate_and_increment_invoice_no`
- `get_dashboard_stats`
- `track_vehicle_history_v13`
- etc.

### 3. Check Roles

**In SQL Editor, run:**

```sql
SELECT rolname FROM pg_roles WHERE rolname NOT LIKE 'pg_%';
```

✅ Should show roles like:
- `postgres`
- `anon`
- `authenticated`
- `service_role`

---

## 🛠️ Troubleshooting

### Error: "permission denied"

**Solution:**
```sql
-- Run as superuser
ALTER USER postgres WITH SUPERUSER;
```

### Error: "relation already exists"

**Solution:**
```sql
-- Drop existing tables first (CAREFUL!)
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;

-- Then re-import schema.sql
```

### Error: "function already exists"

**Solution:**
```sql
-- Drop all functions first
DROP FUNCTION IF EXISTS function_name CASCADE;

-- Or use CREATE OR REPLACE in schema.sql
```

### Import Taking Too Long

**Solution:**
- Import in smaller chunks
- Use `psql` command line (faster than Studio)
- Disable triggers temporarily:
  ```sql
  ALTER TABLE table_name DISABLE TRIGGER ALL;
  -- Import data
  ALTER TABLE table_name ENABLE TRIGGER ALL;
  ```

---

## 📋 Quick Checklist

- [ ] Supabase deployed in Coolify
- [ ] Supabase Studio accessible
- [ ] `schema.sql` imported successfully
- [ ] `roles.sql` imported successfully
- [ ] `data.sql` imported (if needed)
- [ ] Tables visible in Table Editor
- [ ] Functions created (check with SQL query)
- [ ] Test query works:
  ```sql
  SELECT * FROM users LIMIT 1;
  ```

---

## 🎯 After Import

### Update .env and Coolify Environment Variables

```env
VITE_SUPABASE_URL=https://supabase.ashwheel.cloud
VITE_SUPABASE_ANON_KEY=<FROM_COOLIFY_ENV_VARS>
```

### Test Connection from App

1. Deploy Ashwheel app in Coolify
2. Try to login
3. Check if data loads

---

## 📝 Important Notes

1. **Backup First:** Always backup before importing
2. **Order Matters:** Import schema → roles → data
3. **Check Logs:** Monitor Supabase logs in Coolify
4. **Test Queries:** Run test queries after import
5. **RLS Policies:** Check Row Level Security is enabled

---

**🎉 Database import complete! Ready to use!**
