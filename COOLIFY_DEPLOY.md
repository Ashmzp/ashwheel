# 🚀 Coolify Deployment - Ashwheel (FINAL STEPS)

## ✅ Current Status:
- ✅ Supabase Running: `supabase-k008ks4w48o8s00w4o4o0w0g`
- ✅ Kong URL: `http://supabasekong-k008ks4w48o8s00w4o4o0w0g.72.60.203.162.sslip.io`
- ✅ GitHub Repo: `https://github.com/Ashmzp/ashwheel.git`
- ✅ All files configured

---

## 🎯 DEPLOY NOW (Coolify Dashboard)

### Step 1: Access Coolify
```
http://72.60.203.162:8000
```

### Step 2: Create New Application

1. Click **"+ New Resource"**
2. Select **"Application"**
3. Choose **"Public Repository"** (since repo is public) or **"Private Repository"** (if private)

### Step 3: Configure Application

**Source:**
```
Type: Git
Repository: https://github.com/Ashmzp/ashwheel.git
Branch: main
```

**Build:**
```
Build Pack: Dockerfile
Dockerfile Location: ./Dockerfile
```

**General:**
```
Name: ashwheel
Port: 80 (Nginx will serve on port 80 inside container)
```

### Step 4: Environment Variables

Click **"Environment Variables"** tab and add:

```env
VITE_SUPABASE_URL=http://supabasekong-k008ks4w48o8s00w4o4o0w0g.72.60.203.162.sslip.io
VITE_SUPABASE_ANON_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc1OTgxMDgwMCwiZXhwIjo0OTE1NDg0NDAwLCJyb2xlIjoiYW5vbiJ9.Zr5uxuN4vUi_rjXKaEHXfmt8qVLzwv4JC14nH5T21OI
```

### Step 5: Domain Configuration

**Domains & HTTPS:**
```
Domain: ashwheel.cloud
Generate SSL: Yes (Let's Encrypt)
```

### Step 6: Deploy!

Click **"Deploy"** button

---

## 📊 Deployment Process

Coolify will:
1. Clone repository from GitHub
2. Build Docker image using Dockerfile
3. Install dependencies (npm ci)
4. Build React app (npm run build)
5. Create Nginx container
6. Expose on domain

**Build time:** ~5-10 minutes

---

## 🔍 Monitor Deployment

### Check Logs:
In Coolify dashboard → Your Application → **"Logs"** tab

### Common Build Logs:
```
✓ Cloning repository...
✓ Building Docker image...
✓ Installing dependencies...
✓ Building application...
✓ Starting container...
✓ Application deployed!
```

---

## ✅ Verify Deployment

### 1. Check Application Status
Coolify dashboard → Application should show **"Running"**

### 2. Test Domain
```bash
curl -I http://ashwheel.cloud
```

### 3. Test Supabase Connection
```bash
curl http://supabasekong-k008ks4w48o8s00w4o4o0w0g.72.60.203.162.sslip.io/rest/v1/
```

### 4. Open in Browser
```
http://ashwheel.cloud
or
https://ashwheel.cloud (if SSL enabled)
```

---

## 🗄️ Database Import (After Deployment)

### Upload SQL Files to VPS:
```bash
# From local machine
scp dump/schema.sql root@72.60.203.162:/tmp/
scp dump/roles.sql root@72.60.203.162:/tmp/
scp dump/data.sql root@72.60.203.162:/tmp/
```

### Import to PostgreSQL:
```bash
# SSH into VPS
ssh root@72.60.203.162

# Import schemas
PGPASSWORD="9vT309af5uEZF1qDUWVaeApR4cmfIZoG" psql -h localhost -U postgres -d postgres -f /tmp/schema.sql
PGPASSWORD="9vT309af5uEZF1qDUWVaeApR4cmfIZoG" psql -h localhost -U postgres -d postgres -f /tmp/roles.sql
PGPASSWORD="9vT309af5uEZF1qDUWVaeApR4cmfIZoG" psql -h localhost -U postgres -d postgres -f /tmp/data.sql
```

---

## 🔄 Update Deployment (Future Changes)

```bash
# Local machine
cd C:\Users\ASHISH\Desktop\ashwheel
git add .
git commit -m "Update changes"
git push origin main
```

Then in Coolify → Click **"Redeploy"**

---

## 🛠️ Troubleshooting

### Build Failed?
- Check Coolify logs
- Verify Dockerfile exists
- Check environment variables

### Application Not Starting?
- Check port configuration (should be 80)
- Verify Nginx config in container

### Supabase Connection Error?
- Verify Supabase Kong is running (healthy)
- Test URL: `curl http://supabasekong-k008ks4w48o8s00w4o4o0w0g.72.60.203.162.sslip.io`

### Domain Not Working?
- Check DNS A record: `ashwheel.cloud → 72.60.203.162`
- Wait 5-10 minutes for DNS propagation
- Check Coolify domain configuration

---

## 📋 Final Checklist

- [ ] Coolify dashboard accessible
- [ ] New application created
- [ ] Repository connected
- [ ] Environment variables added
- [ ] Domain configured
- [ ] Deployment started
- [ ] Build successful
- [ ] Application running
- [ ] Domain accessible
- [ ] Database imported
- [ ] Website working

---

## 🎉 Success!

Your website will be live at:
- **HTTP:** http://ashwheel.cloud
- **HTTPS:** https://ashwheel.cloud (if SSL enabled)

**Supabase Dashboard:**
- URL: `http://supabasekong-k008ks4w48o8s00w4o4o0w0g.72.60.203.162.sslip.io`
- User: `PIUiqmzlyeG2ZEak`
- Password: (from Coolify Supabase config)

---

**🚀 Ready to deploy! Go to Coolify dashboard and follow the steps above!**
