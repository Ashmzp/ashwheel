# Coolify Deployment Fix - KVM4 VPS

## Problem
404 error - Domain resolves but routes not working

## Solution

### 1. Coolify Environment Variables
Go to: **Application → Environment Variables**

Add these:
```
VITE_SUPABASE_URL=http://supabasekong-k008ks4w48o8s00w4o4o0w0g.72.60.203.162.sslip.io
VITE_SUPABASE_ANON_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc1OTgxMDgwMCwiZXhwIjo0OTE1NDg0NDAwLCJyb2xlIjoiYW5vbiJ9.Zr5uxuN4vUi_rjXKaEHXfmt8qVLzwv4JC14nH5T21OI
```

### 2. Coolify Build Settings
- **Build Pack**: Dockerfile
- **Dockerfile Location**: ./Dockerfile
- **Port**: 80
- **Build Command**: (leave empty - Dockerfile handles it)

### 3. Domain Settings
- **Domain**: ashwheel.cloud
- **SSL**: Let's Encrypt (auto)

### 4. Deploy
```bash
git add .
git commit -m "fix: coolify deployment"
git push origin main
```

Then in Coolify: Click **Redeploy**

### 5. Check Logs
If still 404:
- Check Build Logs
- Check Application Logs
- Verify `/usr/share/nginx/html/index.html` exists in container

### 6. Manual Check (SSH to VPS)
```bash
# Find container
docker ps | grep ashwheel

# Check files
docker exec -it <container-id> ls -la /usr/share/nginx/html

# Check nginx
docker exec -it <container-id> cat /etc/nginx/conf.d/default.conf
```

## Files Updated
- ✅ Dockerfile (added ENV vars)
- ✅ nginx-docker.conf (already correct)
- ✅ public/_redirects (SPA fallback)
