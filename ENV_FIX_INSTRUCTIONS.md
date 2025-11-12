# 🔑 Environment Variables Fix

## ❌ Problem Found!

Tumhare `.env` file me **ANON_KEY placeholder** hai:
```
VITE_SUPABASE_ANON_KEY=GET_FROM_COOLIFY_AFTER_DEPLOYMENT
```

Ye actual key nahi hai! Isliye sab API calls 404 de rahi hain.

---

## ✅ Solution

### Step 1: Supabase Dashboard se Key Lo

1. **Supabase Dashboard** kholo: https://supabase.ashwheel.cloud
2. **Settings** → **API** section me jao
3. **anon/public key** copy karo (ye `eyJ...` se start hoga)

### Step 2: Local .env Update Karo

`.env` file me paste karo:
```env
VITE_SUPABASE_URL=https://supabase.ashwheel.cloud
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvdXItcHJvamVjdC1pZCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjg5MDAwMDAwLCJleHAiOjE4NDY4MDAwMDB9.YOUR_ACTUAL_KEY_HERE
```

### Step 3: Coolify Environment Variables Update Karo

1. **Coolify Dashboard** kholo
2. Tumhare **Ashwheel project** me jao
3. **Environment Variables** section me jao
4. `VITE_SUPABASE_ANON_KEY` ko actual key se update karo
5. **Redeploy** karo

### Step 4: Test Karo

```bash
# Local test
npm run dev

# Browser me jao aur Vehicle Invoices page kholo
# Data load hona chahiye ✅
```

---

## 🔒 Security Note

**IMPORTANT:** `.env` file ko git me commit mat karo!

Already `.gitignore` me hai:
```
.env
.env.local
.env.production
```

---

## 🎯 Quick Fix (Local Development)

Agar abhi test karna hai:

1. Supabase dashboard se anon key copy karo
2. `.env` file me paste karo
3. `npm run dev` restart karo
4. Browser refresh karo

**Bas! Sab kaam karega!** 🚀
