#!/bin/bash

echo "🔍 Checking VPS Configuration for Ashwheel..."
echo "================================================"
echo ""

# Check OS
echo "✅ OS Information:"
cat /etc/os-release | grep PRETTY_NAME
echo ""

# Check Coolify
echo "🐳 Checking Coolify..."
if command -v coolify &> /dev/null; then
    echo "✅ Coolify installed"
    coolify version 2>/dev/null || echo "Coolify version check failed"
else
    echo "❌ Coolify not found"
fi
echo ""

# Check Docker
echo "🐋 Checking Docker..."
if command -v docker &> /dev/null; then
    echo "✅ Docker installed"
    docker --version
    echo "Docker status:"
    systemctl is-active docker
else
    echo "❌ Docker not installed"
fi
echo ""

# Check PostgreSQL
echo "🗄️ Checking PostgreSQL..."
if command -v psql &> /dev/null; then
    echo "✅ PostgreSQL installed"
    psql --version
else
    echo "❌ PostgreSQL not installed"
fi
echo ""

# Check Nginx
echo "🌐 Checking Nginx..."
if command -v nginx &> /dev/null; then
    echo "✅ Nginx installed"
    nginx -v 2>&1
    echo "Nginx status:"
    systemctl is-active nginx 2>/dev/null || echo "Not running"
else
    echo "⚠️ Nginx not installed (Coolify uses Traefik)"
fi
echo ""

# Check ports
echo "🔌 Checking Open Ports..."
echo "Port 80 (HTTP):"
netstat -tuln | grep :80 || echo "Not listening"
echo "Port 443 (HTTPS):"
netstat -tuln | grep :443 || echo "Not listening"
echo "Port 8000 (Coolify):"
netstat -tuln | grep :8000 || echo "Not listening"
echo ""

# Check disk space
echo "💾 Disk Space:"
df -h / | tail -1
echo ""

# Check memory
echo "🧠 Memory Usage:"
free -h | grep Mem
echo ""

# Check if Supabase is running
echo "🔧 Checking Supabase..."
docker ps | grep supabase || echo "⚠️ Supabase containers not found"
echo ""

# Check SSH keys
echo "🔑 Checking SSH Keys..."
if [ -f ~/.ssh/authorized_keys ]; then
    echo "✅ SSH keys configured"
    echo "Number of keys: $(wc -l < ~/.ssh/authorized_keys)"
else
    echo "❌ No SSH keys found"
fi
echo ""

echo "================================================"
echo "✅ VPS Check Complete!"
echo ""
echo "📋 Next Steps:"
echo "1. If Coolify is running, access: http://72.60.203.162:8000"
echo "2. Deploy Ashwheel from GitHub: https://github.com/Ashmzp/ashwheel.git"
echo "3. Add environment variables in Coolify"
echo ""
