# 🚀 Ashwheel.cloud Deployment Guide

## ✅ Configuration Complete
- Supabase URL: `http://supabasekong-gs0sgokso0s4go8wgswoosc0.72.60.203.162.sslip.io`
- Domain: `ashwheel.cloud`
- VPS IP: `72.60.203.162`

---

## 📋 VPS Setup Commands

### 1. SSH into VPS
```bash
ssh root@72.60.203.162
```

### 2. Install Required Software
```bash
# Update system
apt update && apt upgrade -y

# Install Nginx
apt install nginx -y

# Install Node.js (if needed for future)
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install nodejs -y

# Install Certbot for SSL
apt install certbot python3-certbot-nginx -y
```

### 3. Create Website Directory
```bash
mkdir -p /var/www/ashwheel.cloud
chown -R www-data:www-data /var/www/ashwheel.cloud
chmod -R 755 /var/www/ashwheel.cloud
```

### 4. Setup Nginx Configuration
```bash
# Copy nginx.conf to VPS
nano /etc/nginx/sites-available/ashwheel.cloud

# Paste the content from nginx.conf file
# Then create symlink
ln -s /etc/nginx/sites-available/ashwheel.cloud /etc/nginx/sites-enabled/

# Test Nginx config
nginx -t

# Restart Nginx
systemctl restart nginx
systemctl enable nginx
```

### 5. Setup SSL Certificate (Optional but Recommended)
```bash
certbot --nginx -d ashwheel.cloud -d www.ashwheel.cloud
```

### 6. Import Database Schema
```bash
# Copy SQL files to VPS
scp dump/*.sql root@72.60.203.162:/tmp/

# SSH into VPS and import
ssh root@72.60.203.162
psql -h localhost -U postgres -d postgres -f /tmp/schema.sql
psql -h localhost -U postgres -d postgres -f /tmp/roles.sql
psql -h localhost -U postgres -d postgres -f /tmp/data.sql
```

---

## 🏗️ Build & Deploy

### Method 1: Manual Deployment (Windows)
```bash
# 1. Build project locally
npm run build

# 2. Upload to VPS using WinSCP or FileZilla
# Source: dist/
# Destination: root@72.60.203.162:/var/www/ashwheel.cloud/
```

### Method 2: Using Git (Recommended)
```bash
# On VPS
cd /var/www/ashwheel.cloud
git clone https://github.com/your-repo/ashwheel.git .
npm install
npm run build
mv dist/* .
rm -rf dist node_modules src
```

### Method 3: Using deploy.sh (Linux/WSL)
```bash
# Make script executable
chmod +x deploy.sh

# Run deployment
./deploy.sh
```

---

## 🔧 DNS Configuration

Point your domain to VPS:
```
A Record: ashwheel.cloud → 72.60.203.162
A Record: www.ashwheel.cloud → 72.60.203.162
```

---

## ✅ Verification Steps

1. **Check Nginx Status**
```bash
systemctl status nginx
```

2. **Check Website**
```bash
curl http://ashwheel.cloud
```

3. **Check Logs**
```bash
tail -f /var/log/nginx/error.log
tail -f /var/log/nginx/access.log
```

---

## 🔄 Update Deployment

```bash
# Build new version
npm run build

# Upload to VPS
scp -r dist/* root@72.60.203.162:/var/www/ashwheel.cloud/

# Or use deploy.sh
./deploy.sh
```

---

## 🛠️ Troubleshooting

### Issue: 502 Bad Gateway
```bash
systemctl restart nginx
```

### Issue: Permission Denied
```bash
chown -R www-data:www-data /var/www/ashwheel.cloud
chmod -R 755 /var/www/ashwheel.cloud
```

### Issue: Supabase Connection Failed
- Check `.env` file has correct credentials
- Rebuild project: `npm run build`
- Verify Supabase is running on VPS

---

## 📱 PWA Configuration

Service Worker already configured in `public/sw.js`
Manifest file: `public/manifest.json`

---

## 🎯 Quick Deploy Checklist

- [ ] VPS setup complete
- [ ] Nginx installed & configured
- [ ] Domain DNS pointed to VPS
- [ ] SSL certificate installed
- [ ] Database schema imported
- [ ] Project built (`npm run build`)
- [ ] Files uploaded to `/var/www/ashwheel.cloud/`
- [ ] Nginx restarted
- [ ] Website accessible at ashwheel.cloud

---

**🎉 Your website will be live at: http://ashwheel.cloud**
