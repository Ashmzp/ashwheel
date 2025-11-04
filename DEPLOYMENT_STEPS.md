# 🚀 Ashwheel Deployment Steps - Hostinger VPS + Coolify

## ✅ Pre-requisites Check
- [x] VPS Server (Hostinger)
- [x] Coolify Installed
- [x] Firewall Ports: 80, 443, 22, 8000, 6001, 60002, 3000, 5432
- [x] DNS: ashwheel.cloud → Your VPS IP
- [x] Email: ash.mzp001@gmail.com

## 📋 Step-by-Step Deployment

### 1. Update Traefik Configuration

```bash
# SSH into your VPS
ssh root@your-vps-ip

# Stop existing Traefik
cd /data/coolify/proxy
docker-compose down

# Backup existing config
cp docker-compose.yml docker-compose.yml.backup

# Update docker-compose.yml with new configuration
# (Use the docker-compose.traefik.yml content)

# Start Traefik
docker-compose up -d

# Check logs
docker logs coolify-proxy -f
```

### 2. Deploy Ashwheel via Coolify UI

1. **Login to Coolify**: `http://your-vps-ip:8000`

2. **Create New Project**:
   - Name: Ashwheel
   - Type: Docker Compose / Dockerfile

3. **Connect GitHub Repository**:
   - Repository: Your private GitHub repo
   - Branch: main

4. **Add Environment Variables**:
   ```
   VITE_SUPABASE_URL=your-supabase-url
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

5. **Configure Domain**:
   - Domain: `ashwheel.cloud`
   - Enable HTTPS: ✅
   - Certificate Resolver: letsencrypt

6. **Add Traefik Labels** (in Coolify UI):
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
   ```

7. **Deploy**: Click Deploy button

### 3. Verify SSL Certificate

```bash
# Check certificate
curl -I https://ashwheel.cloud

# Check Traefik logs
docker logs coolify-proxy | grep ashwheel

# Check acme.json
cat /data/coolify/proxy/traefik/acme.json
```

### 4. DNS Configuration

Ensure these DNS records exist:
```
A     ashwheel.cloud        → Your-VPS-IP
A     www.ashwheel.cloud    → Your-VPS-IP
```

### 5. Nginx Configuration (If using Nginx separately)

If you're using Nginx in front of Traefik:

```nginx
# /etc/nginx/sites-available/ashwheel.cloud

server {
    listen 80;
    server_name ashwheel.cloud www.ashwheel.cloud;
    
    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Note**: Agar Traefik use kar rahe ho, to Nginx ki zarurat nahi hai. Traefik khud SSL handle karega.

## 🔧 Troubleshooting

### SSL Certificate not generating?

```bash
# Check Traefik logs
docker logs coolify-proxy -f

# Verify port 80 is accessible
curl http://ashwheel.cloud/.well-known/acme-challenge/test

# Check acme.json permissions
chmod 600 /data/coolify/proxy/traefik/acme.json
```

### Application not accessible?

```bash
# Check if container is running
docker ps | grep ashwheel

# Check container logs
docker logs <container-id>

# Check Traefik routing
docker exec coolify-proxy traefik healthcheck
```

### Port conflicts?

```bash
# Check what's using port 80/443
netstat -tulpn | grep :80
netstat -tulpn | grep :443

# Stop Nginx if running
systemctl stop nginx
systemctl disable nginx
```

## ✅ Final Checklist

- [ ] Traefik running with updated config
- [ ] Application deployed via Coolify
- [ ] DNS pointing to VPS IP
- [ ] SSL certificate generated (check https://ashwheel.cloud)
- [ ] HTTP redirects to HTTPS
- [ ] All features working
- [ ] Environment variables set correctly

## 🎯 Important Notes

1. **Traefik handles SSL** - No need for separate Nginx SSL config
2. **Let's Encrypt email**: ash.mzp001@gmail.com
3. **Certificate auto-renewal** - Traefik handles it automatically
4. **Firewall**: Keep only necessary ports open (80, 443, 22, 8000)
5. **Coolify dashboard**: Access at `http://your-vps-ip:8000`

## 📞 Support

If issues persist:
1. Check Traefik logs: `docker logs coolify-proxy -f`
2. Check app logs: `docker logs <app-container> -f`
3. Verify DNS propagation: `nslookup ashwheel.cloud`
4. Test SSL: `curl -vI https://ashwheel.cloud`
