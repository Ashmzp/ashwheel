# 🚀 Ashwheel Production Deployment Guide

## ✅ Setup Complete - Ready to Deploy!

### 📋 Current Configuration:
- **VPS IP:** 31.97.235.213 (Hostinger KVM4)
- **Domain:** ashwheel.cloud (DNS configured ✅)
- **Panel:** Coolify
- **Proxy:** Caddy (built-in)
- **SSL:** Nginx + Let's Encrypt (automatic)
- **Database:** Supabase (self-hosted on 72.60.203.162)

---

## 🎯 Coolify Deployment Steps:

### 1. Login to Coolify
```
URL: http://31.97.235.213:8000 (or your Coolify URL)
```

### 2. Create New Application
1. Click **"+ New Resource"**
2. Select **"Application"**
3. Choose **"Private Repository"** (GitHub)

### 3. Configure Application

**Repository Settings:**
- **Name:** ashwheel
- **Repository URL:** `https://github.com/Ashmzp/ashwheel.git`
- **Branch:** `main`
- **Build Pack:** Dockerfile

**Port Configuration:**
- **Port:** 80
- **Publish Directory:** (leave empty - using Dockerfile)

**Domain Settings:**
- **Domain:** `ashwheel.cloud`
- **SSL:** Enable (Caddy will auto-generate)

### 4. Environment Variables
Add in Coolify UI:
```env
VITE_SUPABASE_URL=http://supabasekong-k008ks4w48o8s00w4o4o0w0g.72.60.203.162.sslip.io
VITE_SUPABASE_ANON_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc1OTgxMDgwMCwiZXhwIjo0OTE1NDg0NDAwLCJyb2xlIjoiYW5vbiJ9.Zr5uxuN4vUi_rjXKaEHXfmt8qVLzwv4JC14nH5T21OI
```

### 5. Deploy Settings
- ✅ Enable **Auto Deploy** (deploy on git push)
- ✅ Enable **Build Logs**
- ✅ Set **Health Check** (optional)

### 6. Deploy!
Click **"Deploy"** button and wait 3-5 minutes.

---

## 🔄 Update Workflow:

```bash
# Make changes in code
git add .
git commit -m "Your update message"
git push

# Coolify will auto-deploy! 🚀
```

---

## 🧪 Testing After Deployment:

1. **Check Website:**
   - https://ashwheel.cloud
   - https://www.ashwheel.cloud

2. **Test Supabase Connection:**
   - Login functionality
   - Database queries
   - Real-time features

3. **Check SSL:**
   - Green padlock in browser
   - Certificate valid

---

## 🛠️ Troubleshooting:

### Build Failed?
```bash
# Check Coolify logs
# Common issues:
# - Environment variables missing
# - Node version mismatch
# - Build timeout
```

### Domain Not Working?
```bash
# Verify DNS (wait 5-10 min after changes)
nslookup ashwheel.cloud

# Should show: 31.97.235.213
```

### Supabase Connection Error?
```bash
# Check if Supabase is running
curl http://supabasekong-k008ks4w48o8s00w4o4o0w0g.72.60.203.162.sslip.io

# Verify environment variables in Coolify UI
```

---

## 📊 Files Structure (Production Ready):

```
✅ Dockerfile              - Multi-stage build
✅ nginx-docker.conf       - Nginx config inside container
✅ .coolify.yml           - Coolify configuration (Caddy)
✅ .env                   - Local development
✅ .env.example           - Template for production
✅ package.json           - Dependencies
✅ vite.config.js         - Build configuration
❌ docker-compose.app.yml - DELETED (Traefik not needed)
❌ docker-compose.traefik.yml - DELETED (Using Caddy)
```

---

## 🎉 Success Checklist:

- [x] DNS configured (31.97.235.213)
- [x] Dockerfile ready
- [x] Nginx config ready
- [x] Supabase configured
- [x] .coolify.yml updated (Caddy)
- [x] Traefik files removed
- [ ] Deploy in Coolify UI
- [ ] Test website
- [ ] Verify SSL

---

**🚀 Ready to Deploy! Follow steps above in Coolify UI.**
