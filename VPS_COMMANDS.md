# 🖥️ VPS Setup Commands - Ashwheel

## 🔐 SSH Login

```bash
ssh root@72.60.203.162
```

---

## 📋 Step 1: Check VPS Status

```bash
# Download and run check script
curl -o vps-check.sh https://raw.githubusercontent.com/Ashmzp/ashwheel/main/vps-check.sh
chmod +x vps-check.sh
./vps-check.sh
```

**OR manually paste script:**

```bash
cat > vps-check.sh << 'EOF'
#!/bin/bash
echo "🔍 VPS Status Check..."
echo "OS: $(cat /etc/os-release | grep PRETTY_NAME)"
echo "Docker: $(docker --version 2>/dev/null || echo 'Not installed')"
echo "Coolify: $(docker ps | grep coolify | wc -l) containers"
echo "Supabase: $(docker ps | grep supabase | wc -l) containers"
echo "Disk: $(df -h / | tail -1 | awk '{print $4}') free"
echo "Memory: $(free -h | grep Mem | awk '{print $4}') free"
echo "Ports: "
netstat -tuln | grep -E ':80|:443|:8000'
EOF

chmod +x vps-check.sh
./vps-check.sh
```

---

## 🔧 Step 2: Setup VPS (if needed)

```bash
# Download setup script
curl -o vps-setup.sh https://raw.githubusercontent.com/Ashmzp/ashwheel/main/vps-setup.sh
chmod +x vps-setup.sh
./vps-setup.sh
```

**OR manually:**

```bash
# Add SSH key
mkdir -p ~/.ssh
echo "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIKaIjwT9bbh0MBXxwvpyeUNOKktOV4wg9FHUFV4R3Oe2 ash.mzp001@gmail.com" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys

# Check Docker
docker --version

# Check Coolify
docker ps | grep coolify

# Check Supabase
docker ps | grep supabase
```

---

## 🗄️ Step 3: Import Database Schema

```bash
# Create temp directory
mkdir -p /tmp/ashwheel-db

# Download SQL files (you need to upload these first)
# Using SCP from local machine:
# scp dump/*.sql root@72.60.203.162:/tmp/ashwheel-db/

# OR create them manually on VPS
cd /tmp/ashwheel-db

# Import to PostgreSQL
PGPASSWORD="9vT309af5uEZF1qDUWVaeApR4cmfIZoG" psql -h localhost -U postgres -d postgres -f schema.sql
PGPASSWORD="9vT309af5uEZF1qDUWVaeApR4cmfIZoG" psql -h localhost -U postgres -d postgres -f roles.sql
PGPASSWORD="9vT309af5uEZF1qDUWVaeApR4cmfIZoG" psql -h localhost -U postgres -d postgres -f data.sql
```

---

## 🐳 Step 4: Coolify Deployment

### Access Coolify Dashboard:
```
http://72.60.203.162:8000
```

### Configuration:

1. **Create New Application**
   - Click "+ New Resource"
   - Select "Application"
   - Choose "Git Repository"

2. **Repository Settings:**
   ```
   Repository: https://github.com/Ashmzp/ashwheel.git
   Branch: main
   Build Pack: Dockerfile
   ```

3. **Environment Variables:**
   ```env
   VITE_SUPABASE_URL=http://supabasekong-gs0sgokso0s4go8wgswoosc0.72.60.203.162.sslip.io
   VITE_SUPABASE_ANON_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc1OTgxMDgwMCwiZXhwIjo0OTE1NDg0NDAwLCJyb2xlIjoiYW5vbiJ9.Zr5uxuN4vUi_rjXKaEHXfmt8qVLzwv4JC14nH5T21OI
   ```

4. **Domain:**
   ```
   ashwheel.cloud
   ```

5. **Deploy!**

---

## 🔍 Troubleshooting Commands

### Check Coolify logs:
```bash
docker logs -f $(docker ps | grep coolify | awk '{print $1}' | head -1)
```

### Check Supabase:
```bash
docker ps | grep supabase
curl http://supabasekong-gs0sgokso0s4go8wgswoosc0.72.60.203.162.sslip.io
```

### Check deployed app:
```bash
docker ps | grep ashwheel
```

### Restart Coolify:
```bash
docker restart $(docker ps | grep coolify | awk '{print $1}')
```

### Check disk space:
```bash
df -h
docker system df
```

### Clean Docker:
```bash
docker system prune -a
```

---

## 📤 Upload Files to VPS (from local)

```bash
# Upload SQL files
scp dump/*.sql root@72.60.203.162:/tmp/

# Upload scripts
scp vps-check.sh vps-setup.sh root@72.60.203.162:~/
```

---

## ✅ Verification

```bash
# Check if website is accessible
curl -I http://ashwheel.cloud

# Check SSL
curl -I https://ashwheel.cloud

# Check Supabase connection
curl http://supabasekong-gs0sgokso0s4go8wgswoosc0.72.60.203.162.sslip.io/rest/v1/
```

---

## 🎯 Quick Deploy Checklist

- [ ] SSH access working
- [ ] Docker running
- [ ] Coolify accessible (port 8000)
- [ ] Supabase running
- [ ] Database schema imported
- [ ] GitHub repository connected in Coolify
- [ ] Environment variables added
- [ ] Domain configured
- [ ] Deployment successful
- [ ] Website accessible

---

**🚀 Your SSH Key is configured!**
**📦 Repository: https://github.com/Ashmzp/ashwheel.git**
**🌐 Deploy at: http://72.60.203.162:8000**
