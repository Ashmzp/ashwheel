# 🔧 Coolify Labels Fix - Read-Only Issue Solution

## ❌ Problem
Coolify UI mein labels read-only hain, edit nahi kar sakte.

## ✅ Solution
Project mein `.coolify.yml` file add karo jo automatically labels apply karegi.

---

## 📋 Step-by-Step Instructions

### Step 1: Files Add Karo (Already Done ✅)
Maine ye files bana di hain:
- `.coolify.yml` - Coolify configuration with Traefik labels

### Step 2: Git Push Karo

```bash
# Local machine pe (Windows)
cd C:\Users\ASHISH\Desktop\ashwheel

# Add new file
git add .coolify.yml

# Commit
git commit -m "Add Coolify configuration with SSL labels"

# Push to GitHub
git push origin main
```

### Step 3: Coolify Mein Redeploy Karo

```bash
# Option A: Coolify UI se
1. Browser mein jao: http://your-vps-ip:8000
2. Ashwheel project kholo
3. "Redeploy" button click karo
4. Wait for deployment to complete

# Option B: SSH se manual
ssh root@your-vps-ip
cd /path/to/coolify/ashwheel
docker-compose down
docker-compose up -d
```

### Step 4: Verify

```bash
# Check if labels applied
docker inspect ashwheel-app | grep traefik

# Test HTTP redirect
curl -I http://ashwheel.cloud

# Test HTTPS
curl -I https://ashwheel.cloud
```

---

## 🎯 Alternative Method: Direct Docker Labels

Agar `.coolify.yml` kaam nahi kare, to Coolify UI mein:

### Method 1: Environment Variables Section
```
1. Coolify UI → Your Project → Settings
2. "Docker Compose Override" section dhundo
3. Ye paste karo:
```

```yaml
services:
  ashwheel:
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.ashwheel-http.rule=Host(`ashwheel.cloud`) || Host(`www.ashwheel.cloud`)"
      - "traefik.http.routers.ashwheel-http.entrypoints=http"
      - "traefik.http.routers.ashwheel-http.middlewares=redirect-to-https"
      - "traefik.http.routers.ashwheel-https.rule=Host(`ashwheel.cloud`) || Host(`www.ashwheel.cloud`)"
      - "traefik.http.routers.ashwheel-https.entrypoints=https"
      - "traefik.http.routers.ashwheel-https.tls=true"
      - "traefik.http.routers.ashwheel-https.tls.certresolver=letsencrypt"
      - "traefik.http.services.ashwheel.loadbalancer.server.port=80"
      - "traefik.http.middlewares.ashwheel-headers.headers.sslredirect=true"
      - "traefik.http.middlewares.ashwheel-headers.headers.stsSeconds=31536000"
      - "traefik.http.middlewares.ashwheel-headers.headers.stsIncludeSubdomains=true"
      - "traefik.http.middlewares.ashwheel-headers.headers.stsPreload=true"
      - "traefik.http.routers.ashwheel-https.middlewares=ashwheel-headers"
```

### Method 2: Coolify Domain Settings
```
1. Coolify UI → Your Project → Domains
2. Add domain: ashwheel.cloud
3. Enable "Generate SSL Certificate" toggle
4. Enable "Force HTTPS" toggle
5. Save
```

---

## 🚀 Complete Deployment Flow

```bash
# 1. Update Traefik (One-time)
ssh root@your-vps-ip
cd /data/coolify/proxy
nano docker-compose.yml
# Add email line: - '--certificatesresolvers.letsencrypt.acme.email=ash.mzp001@gmail.com'
docker-compose down && docker-compose up -d

# 2. Push .coolify.yml to GitHub
cd C:\Users\ASHISH\Desktop\ashwheel
git add .coolify.yml
git commit -m "Add Coolify SSL config"
git push origin main

# 3. Redeploy in Coolify UI
# Click "Redeploy" button

# 4. Wait 2-3 minutes for SSL certificate generation

# 5. Test
curl -I https://ashwheel.cloud
```

---

## 🔍 Debugging

### Check if labels are applied:
```bash
ssh root@your-vps-ip
docker inspect $(docker ps -q -f name=ashwheel) | grep -A 20 Labels
```

### Check Traefik routing:
```bash
docker logs coolify-proxy | grep ashwheel
```

### Check SSL certificate:
```bash
cat /data/coolify/proxy/traefik/acme.json | grep ashwheel
```

### Manual SSL certificate request:
```bash
# If auto-generation fails
docker exec coolify-proxy traefik healthcheck
```

---

## ✅ Success Checklist

- [ ] `.coolify.yml` file created
- [ ] File pushed to GitHub
- [ ] Redeployed in Coolify
- [ ] `http://ashwheel.cloud` redirects to HTTPS
- [ ] `https://ashwheel.cloud` shows green padlock
- [ ] No SSL warnings
- [ ] Application loads properly

---

## 💡 Pro Tips

1. **Coolify automatically reads** `.coolify.yml` from project root
2. **Labels priority**: `.coolify.yml` > Docker Compose Override > UI Settings
3. **SSL generation takes** 1-2 minutes on first deployment
4. **Certificate auto-renews** every 60 days
5. **Always test** with `curl -I` before browser (browser caches)

---

## 🆘 Still Not Working?

### Option: Manual Container Labels
```bash
ssh root@your-vps-ip

# Find your container
docker ps | grep ashwheel

# Stop container
docker stop ashwheel-app

# Remove container
docker rm ashwheel-app

# Run with labels
docker run -d \
  --name ashwheel-app \
  --network coolify \
  --label "traefik.enable=true" \
  --label "traefik.http.routers.ashwheel-https.rule=Host(\`ashwheel.cloud\`)" \
  --label "traefik.http.routers.ashwheel-https.entrypoints=https" \
  --label "traefik.http.routers.ashwheel-https.tls=true" \
  --label "traefik.http.routers.ashwheel-https.tls.certresolver=letsencrypt" \
  --label "traefik.http.services.ashwheel.loadbalancer.server.port=80" \
  your-ashwheel-image:latest
```

Koi problem ho to batao! 🚀
