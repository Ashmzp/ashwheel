# 🚀 Deployment Order - Ashwheel + Supabase on Coolify

## ⚡ Quick Deployment Steps (Follow in Order)

### 📍 VPS Details
- **IP:** 31.97.235.213
- **Panel:** Coolify (Port 8000)
- **Proxy:** Caddy (Auto SSL)

---

## Step 1️⃣: DNS Configuration (Do First!)

Login to your domain registrar and add:

```
A Record:  ashwheel.cloud          →  31.97.235.213
A Record:  www.ashwheel.cloud      →  31.97.235.213
A Record:  supabase.ashwheel.cloud →  31.97.235.213
A Record:  *.ashwheel.cloud        →  31.97.235.213
```

⏰ Wait 5-10 minutes for DNS propagation.

---

## Step 2️⃣: Deploy Supabase in Coolify

### 2.1 Login to Coolify
```
http://31.97.235.213:8000
```

### 2.2 Create Supabase Service

1. Click **"+ New Resource"**
2. Select **"Service"**
3. Search **"Supabase"**
4. Click on Supabase template

### 2.3 Configure Supabase

**Basic Settings:**
- **Name:** supabase
- **Domain:** `supabase.ashwheel.cloud`
- **SSL:** ✅ Enable

**Environment Variables:**
Coolify will auto-generate:
- `POSTGRES_PASSWORD`
- `JWT_SECRET`
- `ANON_KEY`
- `SERVICE_ROLE_KEY`

### 2.4 Deploy Supabase

1. Click **"Deploy"**
2. Wait 5-10 minutes
3. Check logs for any errors

### 2.5 Note Down Credentials

After deployment, go to **Environment Variables** tab and copy:
- ✅ `ANON_KEY` (you'll need this for Ashwheel app)
- ✅ `SERVICE_ROLE_KEY` (for admin operations)

### 2.6 Access Supabase Studio

```
URL: https://supabase.ashwheel.cloud
```

---

## Step 3️⃣: Import Database Schema

### 3.1 Open Supabase Studio
```
https://supabase.ashwheel.cloud
```

### 3.2 Go to SQL Editor

Click **"SQL Editor"** in left sidebar

### 3.3 Run Schema Files (In Order)

**File 1: schema.sql**
```sql
-- Copy entire content from dump/schema.sql
-- Paste in SQL Editor
-- Click "Run"
```

**File 2: roles.sql**
```sql
-- Copy entire content from dump/roles.sql
-- Paste in SQL Editor
-- Click "Run"
```

**File 3: data.sql (Optional - if you have seed data)**
```sql
-- Copy entire content from dump/data.sql
-- Paste in SQL Editor
-- Click "Run"
```

### 3.4 Verify Tables

Go to **"Table Editor"** and verify all tables are created.

---

## Step 4️⃣: Update Ashwheel Code

### 4.1 Update .env.example

Open `.env.example` and update:

```env
VITE_SUPABASE_URL=https://supabase.ashwheel.cloud
VITE_SUPABASE_ANON_KEY=<PASTE_ANON_KEY_FROM_COOLIFY>
```

### 4.2 Commit and Push

```bash
cd /mnt/c/Users/ASHISH/Desktop/ashwheel
git add .env.example
git commit -m "Update production Supabase URL"
git push
```

---

## Step 5️⃣: Deploy Ashwheel App in Coolify

### 5.1 Create New Application

1. Click **"+ New Resource"**
2. Select **"Application"**
3. Choose **"Private Repository"**

### 5.2 Configure Repository

**Repository Settings:**
- **Name:** ashwheel
- **Repository URL:** `https://github.com/Ashmzp/ashwheel.git`
- **Branch:** `main`
- **Build Pack:** Dockerfile

### 5.3 Configure Build

**Port Configuration:**
- **Port:** `80`
- **Publish Directory:** (leave empty)

**Domain Settings:**
- **Domain:** `ashwheel.cloud`
- **SSL:** ✅ Enable

### 5.4 Add Environment Variables

Click **"Environment Variables"** and add:

```env
VITE_SUPABASE_URL=https://supabase.ashwheel.cloud
VITE_SUPABASE_ANON_KEY=<PASTE_ANON_KEY_FROM_STEP_2.5>
```

### 5.5 Enable Auto Deploy (Optional)

- ✅ **Auto Deploy on Push:** Enable
- This will auto-deploy when you push to GitHub

### 5.6 Deploy Application

1. Click **"Deploy"**
2. Wait 3-5 minutes
3. Watch build logs

---

## Step 6️⃣: Verify Deployment

### 6.1 Check Supabase
```bash
curl https://supabase.ashwheel.cloud/rest/v1/
```
✅ Should return JSON response

### 6.2 Check Ashwheel App
```bash
curl https://ashwheel.cloud
```
✅ Should return HTML

### 6.3 Test in Browser

1. Open `https://ashwheel.cloud`
2. Try to signup/login
3. Check if data is saving to Supabase

---

## 🎉 Success Checklist

- [ ] DNS configured (all 4 records)
- [ ] Supabase deployed in Coolify
- [ ] Supabase accessible at https://supabase.ashwheel.cloud
- [ ] Database schema imported
- [ ] ANON_KEY copied from Coolify
- [ ] .env.example updated
- [ ] Code pushed to GitHub
- [ ] Ashwheel app deployed in Coolify
- [ ] App accessible at https://ashwheel.cloud
- [ ] SSL working on both domains
- [ ] Login/signup working
- [ ] Data saving to Supabase

---

## 🔄 Update Workflow (After Initial Setup)

```bash
# Make changes in code
git add .
git commit -m "Your changes"
git push

# If auto-deploy enabled, Coolify will deploy automatically
# Otherwise, click "Redeploy" in Coolify UI
```

---

## 🛠️ Common Issues

### Issue: Supabase not accessible
**Solution:** 
- Check DNS propagation: `nslookup supabase.ashwheel.cloud`
- Check Coolify logs
- Verify SSL certificate generated

### Issue: App can't connect to Supabase
**Solution:**
- Verify `VITE_SUPABASE_URL` in Coolify environment variables
- Check `VITE_SUPABASE_ANON_KEY` is correct
- Check browser console for CORS errors

### Issue: Build failed
**Solution:**
- Check Coolify build logs
- Verify Dockerfile is correct
- Check if environment variables are set

---

## 📞 Support

If stuck, check:
1. Coolify logs (click on service/app → Logs)
2. Browser console (F12)
3. Network tab for API errors

---

**🚀 Follow steps in order. Don't skip any step!**
