# Coolify Deployment Steps

## 1. GitHub Push (Local)
```bash
git add .
git commit -m "fix: coolify deployment with proper env vars"
git push origin main
```

## 2. Coolify Dashboard Settings

### A. Domain Configuration
1. Go to: **Coolify Dashboard** → **Resources** → **Your App**
2. Click **Domains** tab
3. Remove existing domain if any
4. Add new domain: `ashwheel.cloud`
5. Enable **Generate SSL Certificate** (Let's Encrypt)
6. Click **Save**

### B. Environment Variables
1. Go to **Environment Variables** tab
2. Add these variables:
```
VITE_SUPABASE_URL=http://supabasekong-k008ks4w48o8s00w4o4o0w0g.72.60.203.162.sslip.io
VITE_SUPABASE_ANON_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc1OTgxMDgwMCwiZXhwIjo0OTE1NDg0NDAwLCJyb2xlIjoiYW5vbiJ9.Zr5uxuN4vUi_rjXKaEHXfmt8qVLzwv4JC14nH5T21OI
```
3. Click **Save**

### C. Build Configuration
1. Go to **General** tab
2. Verify:
   - **Build Pack**: Dockerfile
   - **Dockerfile Location**: ./Dockerfile
   - **Port**: 80
3. Click **Save**

## 3. Deploy
1. Click **Deploy** button (top right)
2. Wait for build to complete (5-10 minutes)
3. Check build logs for errors

## 4. Verify
```bash
# SSH to VPS
ssh root@72.60.203.162

# Check container
docker ps | grep ashwheel

# Check logs
docker logs <container-name>

# Test locally
curl -I http://localhost:80
```

## 5. If Still 404
1. Check Traefik logs: `docker logs coolify-proxy --tail 100`
2. Verify domain in Coolify points to correct container
3. Restart Traefik: `docker restart coolify-proxy`

## Files Changed
- ✅ Dockerfile (ENV vars added)
- ✅ public/_redirects (SPA routing)
- ✅ nginx-docker.conf (already correct)
