# 🚨 Coolify Deployment Fix - Search Functionality

## Problem
Search functionality not working after Coolify deployment due to missing environment variables.

## Root Cause
- VITE_SUPABASE_ANON_KEY is not set properly in Coolify
- Database connection failing in production
- Environment variables not being passed to build process

## Fix Steps

### 1. Get Supabase Keys from Coolify
```bash
# Go to Coolify Dashboard
# Navigate to: Services → Supabase → Environment Variables
# Copy the ANON_KEY value
```

### 2. Update Coolify Environment Variables
In Coolify Dashboard → Your Ashwheel App → Environment Variables:

```env
VITE_SUPABASE_URL=https://supabase.ashwheel.cloud
VITE_SUPABASE_ANON_KEY=<PASTE_ACTUAL_KEY_HERE>
VITE_ADMIN_EMAIL=your-admin-email@example.com
VITE_ADMIN_PASSWORD=your-secure-password
```

### 3. Verify Build Args in Coolify
Make sure build arguments are passed correctly:
- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY

### 4. Redeploy
After setting environment variables, redeploy the application.

## Quick Test
After deployment, check browser console:
- No Supabase connection errors
- Search input should filter results
- Network tab should show API calls to Supabase

## Debug Commands
```bash
# Check if env vars are available in build
console.log(import.meta.env.VITE_SUPABASE_URL)
console.log(import.meta.env.VITE_SUPABASE_ANON_KEY)
```