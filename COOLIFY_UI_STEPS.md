# 🎯 Coolify UI mein Labels Kaise Set Karein

## 📍 Method 1: Domain Settings (Easiest - Recommended)

```
1. Coolify UI open karo: http://your-vps-ip:8000
2. Login karo
3. Ashwheel application select karo
4. Left sidebar mein "Domains" click karo
5. "Add Domain" button click karo
6. Domain enter karo: ashwheel.cloud
7. Toggle ON karo:
   ✅ Generate SSL Certificate
   ✅ Force HTTPS
8. Save karo
9. "Redeploy" button click karo
```

**Ye method automatically sahi labels generate karega!** ✅

---

## 📍 Method 2: Docker Compose Override (Manual)

Agar Method 1 kaam na kare:

```
1. Coolify UI → Your Application
2. "Configuration" ya "Settings" tab
3. "Docker Compose Override" section dhundo
4. Ye paste karo:
```

```yaml
version: '3.8'
services:
  app:
    labels:
      - "traefik.enable=true"
      - "traefik.http.services.ashwheel.loadbalancer.server.port=80"
      - "traefik.http.routers.ashwheel-http.rule=Host(`ashwheel.cloud`) || Host(`www.ashwheel.cloud`)"
      - "traefik.http.routers.ashwheel-http.entrypoints=http"
      - "traefik.http.routers.ashwheel-http.middlewares=redirect-to-https"
      - "traefik.http.routers.ashwheel-https.rule=Host(`ashwheel.cloud`) || Host(`www.ashwheel.cloud`)"
      - "traefik.http.routers.ashwheel-https.entrypoints=https"
      - "traefik.http.routers.ashwheel-https.tls=true"
      - "traefik.http.routers.ashwheel-https.tls.certresolver=letsencrypt"
      - "traefik.http.routers.ashwheel-https.service=ashwheel"
      - "traefik.http.middlewares.gzip.compress=true"
      - "traefik.http.routers.ashwheel-https.middlewares=gzip"
```

```
5. Save karo
6. Redeploy karo
```

---

## 📍 Method 3: Environment Variables Section

```
1. Coolify UI → Application → Configuration
2. "Build & Deploy" section
3. "Custom Docker Run Options" ya "Labels" field dhundo
4. Ek-ek karke labels add karo:
```

**Labels (one per line):**
```
traefik.enable=true
traefik.http.services.ashwheel.loadbalancer.server.port=80
traefik.http.routers.ashwheel-http.rule=Host(`ashwheel.cloud`)
traefik.http.routers.ashwheel-http.entrypoints=http
traefik.http.routers.ashwheel-http.middlewares=redirect-to-https
traefik.http.routers.ashwheel-https.rule=Host(`ashwheel.cloud`)
traefik.http.routers.ashwheel-https.entrypoints=https
traefik.http.routers.ashwheel-https.tls=true
traefik.http.routers.ashwheel-https.tls.certresolver=letsencrypt
traefik.http.routers.ashwheel-https.service=ashwheel
```

---

## 📍 Method 4: Direct File Edit (SSH)

Agar UI se kuch kaam na kare:

```bash
# 1. SSH into VPS
ssh root@your-vps-ip

# 2. Find your application's docker-compose file
cd /data/coolify/applications
ls -la
# Find your app folder (usually has UUID)

# 3. Edit docker-compose.yml
cd your-app-folder
nano docker-compose.yml

# 4. Labels section mein ye add karo:
```

```yaml
labels:
  - "traefik.enable=true"
  - "traefik.http.services.ashwheel.loadbalancer.server.port=80"
  - "traefik.http.routers.ashwheel-http.rule=Host(`ashwheel.cloud`)"
  - "traefik.http.routers.ashwheel-http.entrypoints=http"
  - "traefik.http.routers.ashwheel-http.middlewares=redirect-to-https"
  - "traefik.http.routers.ashwheel-https.rule=Host(`ashwheel.cloud`)"
  - "traefik.http.routers.ashwheel-https.entrypoints=https"
  - "traefik.http.routers.ashwheel-https.tls=true"
  - "traefik.http.routers.ashwheel-https.tls.certresolver=letsencrypt"
  - "traefik.http.routers.ashwheel-https.service=ashwheel"
```

```bash
# 5. Save: Ctrl+X, Y, Enter

# 6. Restart container
docker-compose down
docker-compose up -d

# 7. Check logs
docker logs -f your-container-name
```

---

## 🔍 Verify Labels Applied

```bash
# SSH into VPS
ssh root@your-vps-ip

# Find container name
docker ps | grep ashwheel

# Inspect labels
docker inspect <container-name> | grep -A 30 Labels

# Should show:
# "traefik.enable": "true"
# "traefik.http.routers.ashwheel-https.rule": "Host(`ashwheel.cloud`)"
# etc.
```

---

## ✅ Test SSL

```bash
# Test HTTP redirect
curl -I http://ashwheel.cloud
# Should return: 301 or 302 redirect to https://

# Test HTTPS
curl -I https://ashwheel.cloud
# Should return: 200 OK

# Check certificate
echo | openssl s_client -servername ashwheel.cloud -connect ashwheel.cloud:443 2>/dev/null | openssl x509 -noout -issuer
# Should show: Let's Encrypt
```

---

## 🎯 Recommended Approach

**Try in this order:**

1. ✅ **Method 1** (Domain Settings) - Easiest, Coolify handles everything
2. ✅ **Method 2** (Docker Compose Override) - If Method 1 doesn't work
3. ✅ **Method 4** (Direct SSH Edit) - Last resort

**Avoid Method 3** - UI labels section is usually read-only in Coolify.

---

## 🆘 Troubleshooting

### Labels not applying?
```bash
# Check Coolify logs
docker logs coolify -f

# Check Traefik logs
docker logs coolify-proxy -f | grep ashwheel
```

### SSL not generating?
```bash
# Check acme.json
cat /data/coolify/proxy/traefik/acme.json

# Check permissions
chmod 600 /data/coolify/proxy/traefik/acme.json

# Restart Traefik
cd /data/coolify/proxy
docker-compose restart
```

### Domain not resolving?
```bash
# Check DNS
nslookup ashwheel.cloud

# Check if port 80 is accessible
curl http://ashwheel.cloud

# Check firewall
ufw status
```

---

## 💡 Pro Tip

**Sabse easy**: Coolify UI mein Domain Settings use karo. Wo automatically:
- ✅ Sahi labels generate karega
- ✅ SSL certificate request karega
- ✅ HTTP to HTTPS redirect setup karega
- ✅ Certificate auto-renewal setup karega

Bas domain add karo aur toggles ON karo! 🚀
