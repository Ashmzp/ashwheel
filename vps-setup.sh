#!/bin/bash

echo "🚀 Setting up VPS for Ashwheel Deployment..."
echo "================================================"
echo ""

# Add SSH key if not exists
echo "🔑 Setting up SSH Key..."
mkdir -p ~/.ssh
chmod 700 ~/.ssh

SSH_KEY="ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIKaIjwT9bbh0MBXxwvpyeUNOKktOV4wg9FHUFV4R3Oe2 ash.mzp001@gmail.com"

if grep -q "AAAAC3NzaC1lZDI1NTE5AAAAIKaIjwT9bbh0MBXxwvpyeUNOKktOV4wg9FHUFV4R3Oe2" ~/.ssh/authorized_keys 2>/dev/null; then
    echo "✅ SSH key already exists"
else
    echo "$SSH_KEY" >> ~/.ssh/authorized_keys
    chmod 600 ~/.ssh/authorized_keys
    echo "✅ SSH key added"
fi
echo ""

# Check and install Docker if needed
echo "🐋 Checking Docker..."
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    systemctl enable docker
    systemctl start docker
    echo "✅ Docker installed"
else
    echo "✅ Docker already installed"
fi
echo ""

# Check PostgreSQL connection
echo "🗄️ Checking PostgreSQL..."
if command -v psql &> /dev/null; then
    echo "✅ PostgreSQL available"
    echo "Testing connection..."
    PGPASSWORD="9vT309af5uEZF1qDUWVaeApR4cmfIZoG" psql -h localhost -U postgres -d postgres -c "SELECT version();" 2>/dev/null && echo "✅ PostgreSQL connection successful" || echo "⚠️ PostgreSQL connection failed"
else
    echo "⚠️ PostgreSQL not installed locally (might be in Docker)"
fi
echo ""

# Check Coolify
echo "🐳 Checking Coolify..."
if docker ps | grep -q coolify; then
    echo "✅ Coolify is running"
    docker ps | grep coolify
else
    echo "⚠️ Coolify not running"
    echo "To install Coolify, run:"
    echo "curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash"
fi
echo ""

# Check Supabase
echo "🔧 Checking Supabase..."
if docker ps | grep -q supabase; then
    echo "✅ Supabase is running"
    docker ps | grep supabase | awk '{print $NF}'
else
    echo "⚠️ Supabase not running"
fi
echo ""

# Create deployment directory
echo "📁 Creating deployment directory..."
mkdir -p /var/www/ashwheel.cloud
chown -R $USER:$USER /var/www/ashwheel.cloud
chmod -R 755 /var/www/ashwheel.cloud
echo "✅ Directory created: /var/www/ashwheel.cloud"
echo ""

# Firewall check
echo "🔥 Checking Firewall..."
if command -v ufw &> /dev/null; then
    echo "UFW Status:"
    ufw status | head -5
    echo ""
    echo "Opening required ports..."
    ufw allow 80/tcp 2>/dev/null
    ufw allow 443/tcp 2>/dev/null
    ufw allow 8000/tcp 2>/dev/null
    ufw allow 22/tcp 2>/dev/null
    echo "✅ Ports configured"
else
    echo "⚠️ UFW not installed"
fi
echo ""

echo "================================================"
echo "✅ VPS Setup Complete!"
echo ""
echo "📋 Access Points:"
echo "- Coolify Dashboard: http://72.60.203.162:8000"
echo "- Supabase: http://supabasekong-gs0sgokso0s4go8wgswoosc0.72.60.203.162.sslip.io"
echo "- Website (after deploy): http://ashwheel.cloud"
echo ""
echo "🚀 Next: Deploy from Coolify dashboard"
echo "   Repository: https://github.com/Ashmzp/ashwheel.git"
echo ""
