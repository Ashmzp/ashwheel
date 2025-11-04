# 🔧 Traefik & Application Update Guide

## 📍 Step 1: Update Traefik Configuration

### Method 1: Via SSH (Recommended)

```bash
# 1. SSH into your VPS
ssh root@your-vps-ip

# 2. Navigate to Traefik directory
cd /data/coolify/proxy

# 3. Backup existing configuration
cp docker-compose.yml docker-compose.yml.backup

# 4. Edit the docker-compose.yml file
nano docker-compose.yml
```

**Ab file mein ye changes karo:**

1. **Command section mein add karo** (line 40 ke baad):
   ```yaml
   - '--certificatesresolvers.letsencrypt.acme.email=ash.mzp001@gmail.com'
   ```

2. **Labels section mein add karo** (existing labels ke baad):
   ```yaml
   # HTTP to HTTPS redirect
   - traefik.http.middlewares.redirect-to-https.redirectscheme.scheme=https
   - traefik.http.middlewares.redirect-to-https.redirectscheme.permanent=true
   - traefik.http.routers.http-catchall.rule=hostregexp(`{host:.+}`)
   - traefik.http.routers.http-catchall.entrypoints=http
   - traefik.http.routers.http-catchall.middlewares=redirect-to-https
   - traefik.http.routers.http-catchall.priority=1
   ```

3. **Save and exit**: `Ctrl+X`, then `Y`, then `Enter`

```bash
# 5. Restart Traefik
docker-compose down
docker-compose up -d

# 6. Verify Traefik is running
docker ps | grep coolify-proxy

# 7. Check logs
docker logs coolify-proxy -f
```

### Method 2: Via File Upload

```bash
# 1. Local machine se VPS pe file upload karo
scp docker-compose.traefik.yml root@your-vps-ip:/data/coolify/proxy/docker-compose.yml

# 2. SSH into VPS
ssh root@your-vps-ip

# 3. Restart Traefik
cd /data/coolify/proxy
docker-compose down
docker-compose up -d
```

---

## 📍 Step 2: Update Application Configuration (Coolify UI)

### Option A: Via Coolify Dashboard (Easiest)

```bash
# 1. Open browser
http://your-vps-ip:8000

# 2. Login to Coolify

# 3. Go to your Ashwheel project

# 4. Click on "Settings" or "Configuration"

# 5. Find "Labels" section

# 6. Add these labels one by one:
```

**Labels to add:**

```
traefik.enable=true
traefik.http.routers.ashwheel-http.rule=Host(`ashwheel.cloud`) || Host(`www.ashwheel.cloud`)
traefik.http.routers.ashwheel-http.entrypoints=http
traefik.http.routers.ashwheel-http.middlewares=redirect-to-https
traefik.http.routers.ashwheel-https.rule=Host(`ashwheel.cloud`) || Host(`www.ashwheel.cloud`)
traefik.http.routers.ashwheel-https.entrypoints=https
traefik.http.routers.ashwheel-https.tls=true
traefik.http.routers.ashwheel-https.tls.certresolver=letsencrypt
traefik.http.services.ashwheel.loadbalancer.server.port=80
traefik.http.middlewares.ashwheel-headers.headers.sslredirect=true
traefik.http.middlewares.ashwheel-headers.headers.stsSeconds=31536000
traefik.http.middlewares.ashwheel-headers.headers.stsIncludeSubdomains=true
traefik.http.middlewares.ashwheel-headers.headers.stsPreload=true
traefik.http.routers.ashwheel-https.middlewares=ashwheel-headers
```

```bash
# 7. Save configuration

# 8. Redeploy application (click "Deploy" button)
```

### Option B: Via Docker Compose (If using custom compose)

Agar aap apna khud ka docker-compose use kar rahe ho:

```bash
# 1. SSH into VPS
ssh root@your-vps-ip

# 2. Navigate to your app directory
cd /path/to/your/ashwheel/app

# 3. Create/Edit docker-compose.yml
nano docker-compose.yml
```

**Paste this content:**

```yaml
version: '3.8'

services:
  ashwheel:
    image: your-ashwheel-image:latest
    container_name: ashwheel-app
    restart: unless-stopped
    networks:
      - coolify
    environment:
      - VITE_SUPABASE_URL=${VITE_SUPABASE_URL}
      - VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY}
    labels:
      - traefik.enable=true
      - traefik.http.routers.ashwheel-http.rule=Host(`ashwheel.cloud`) || Host(`www.ashwheel.cloud`)
      - traefik.http.routers.ashwheel-http.entrypoints=http
      - traefik.http.routers.ashwheel-http.middlewares=redirect-to-https
      - traefik.http.routers.ashwheel-https.rule=Host(`ashwheel.cloud`) || Host(`www.ashwheel.cloud`)
      - traefik.http.routers.ashwheel-https.entrypoints=https
      - traefik.http.routers.ashwheel-https.tls=true
      - traefik.http.routers.ashwheel-https.tls.certresolver=letsencrypt
      - traefik.http.services.ashwheel.loadbalancer.server.port=80
      - traefik.http.middlewares.ashwheel-headers.headers.sslredirect=true
      - traefik.http.middlewares.ashwheel-headers.headers.stsSeconds=31536000
      - traefik.http.middlewares.ashwheel-headers.headers.stsIncludeSubdomains=true
      - traefik.http.middlewares.ashwheel-headers.headers.stsPreload=true
      - traefik.http.routers.ashwheel-https.middlewares=ashwheel-headers

networks:
  coolify:
    external: true
```

```bash
# 4. Save and exit: Ctrl+X, Y, Enter

# 5. Restart application
docker-compose down
docker-compose up -d
```

---

## 📍 Step 3: Verify Everything

```bash
# 1. Check if Traefik is running
docker ps | grep coolify-proxy

# 2. Check if app is running
docker ps | grep ashwheel

# 3. Test HTTP redirect
curl -I http://ashwheel.cloud
# Should return 301/302 redirect to HTTPS

# 4. Test HTTPS
curl -I https://ashwheel.cloud
# Should return 200 OK

# 5. Check SSL certificate
echo | openssl s_client -servername ashwheel.cloud -connect ashwheel.cloud:443 2>/dev/null | openssl x509 -noout -dates

# 6. Check Traefik logs
docker logs coolify-proxy -f

# 7. Check app logs
docker logs ashwheel-app -f
```

---

## 🎯 Quick Commands Summary

```bash
# Complete update in one go
ssh root@your-vps-ip << 'EOF'
cd /data/coolify/proxy
cp docker-compose.yml docker-compose.yml.backup
# Manually edit and add the labels
docker-compose down && docker-compose up -d
docker logs coolify-proxy -f
EOF
```

---

## ⚠️ Important Notes

1. **Traefik update** - Sirf ek baar karna hai
2. **App labels** - Coolify UI se add karna sabse easy hai
3. **Port 80** - Must be accessible for Let's Encrypt challenge
4. **DNS** - Pehle se point hona chahiye
5. **Backup** - Hamesha backup lo before changes

---

## 🆘 Troubleshooting

### Traefik start nahi ho raha?
```bash
docker logs coolify-proxy
# Check for errors
```

### SSL certificate generate nahi ho raha?
```bash
# Check acme.json permissions
chmod 600 /data/coolify/proxy/traefik/acme.json

# Check if port 80 is accessible
curl http://ashwheel.cloud
```

### Application accessible nahi hai?
```bash
# Check container status
docker ps -a | grep ashwheel

# Check logs
docker logs <container-name>
```

---

## ✅ Success Indicators

- ✅ `http://ashwheel.cloud` redirects to `https://ashwheel.cloud`
- ✅ Green padlock in browser
- ✅ Certificate issued by Let's Encrypt
- ✅ No SSL warnings
- ✅ Application loads properly

Koi problem ho to batao! 🚀
