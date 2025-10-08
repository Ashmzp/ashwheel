# 🚀 Coolify Deployment Guide - Ashwheel

## ✅ Prerequisites Done
- ✅ Dockerfile created
- ✅ nginx-docker.conf created
- ✅ .env configured
- ✅ .gitignore setup

---

## 📋 Ubuntu PowerShell Commands

### 1. Navigate to Project
```bash
cd /mnt/c/Users/ASHISH/Desktop/ashwheel
```

### 2. Initialize Git (if not done)
```bash
git init
git add .
git commit -m "Initial commit - Ashwheel project"
```

### 3. Create GitHub Private Repository
```bash
# Go to GitHub and create private repo: ashwheel
# Then run:
git remote add origin https://github.com/YOUR_USERNAME/ashwheel.git
git branch -M main
git push -u origin main
```

---

## 🎯 Coolify Setup Steps

### 1. Login to Coolify
- URL: Your Coolify dashboard
- Login with credentials

### 2. Create New Application
1. Click **"+ New Resource"**
2. Select **"Application"**
3. Choose **"Public Repository"** or **"Private Repository"**

### 3. Configure Application

**Basic Settings:**
- **Name:** ashwheel
- **Repository:** `https://github.com/YOUR_USERNAME/ashwheel.git`
- **Branch:** `main`
- **Build Pack:** Dockerfile

**Environment Variables:**
Add these in Coolify:
```
VITE_SUPABASE_URL=http://supabasekong-gs0sgokso0s4go8wgswoosc0.72.60.203.162.sslip.io
VITE_SUPABASE_ANON_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc1OTgxMDgwMCwiZXhwIjo0OTE1NDg0NDAwLCJyb2xlIjoiYW5vbiJ9.Zr5uxuN4vUi_rjXKaEHXfmt8qVLzwv4JC14nH5T21OI
```

**Domain Settings:**
- Add domain: `ashwheel.cloud`
- Enable SSL (Let's Encrypt)

### 4. Deploy
- Click **"Deploy"**
- Wait for build to complete
- Access at: `https://ashwheel.cloud`

---

## 🔄 Update Deployment

```bash
cd /mnt/c/Users/ASHISH/Desktop/ashwheel
git add .
git commit -m "Update changes"
git push
```

Coolify will auto-deploy on push!

---

## 🛠️ Troubleshooting

### Build Failed?
Check Coolify logs for errors

### Environment Variables Not Working?
Rebuild application in Coolify

### Domain Not Working?
Check DNS settings:
- A Record: ashwheel.cloud → VPS IP
- Wait 5-10 minutes for propagation

---

## 📱 Database Import

```bash
ssh root@72.60.203.162
psql -U postgres -d postgres -f /tmp/schema.sql
psql -U postgres -d postgres -f /tmp/roles.sql
psql -U postgres -d postgres -f /tmp/data.sql
```

---

**🎉 Done! Your app will be live at: https://ashwheel.cloud**
