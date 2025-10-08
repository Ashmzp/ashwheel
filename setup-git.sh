#!/bin/bash

echo "🚀 Setting up Ashwheel for GitHub..."

# Check if git is initialized
if [ ! -d .git ]; then
    echo "📦 Initializing Git..."
    git init
fi

# Add all files
echo "📝 Adding files..."
git add .

# Commit
echo "💾 Creating commit..."
git commit -m "Initial commit - Ashwheel project with Coolify setup"

echo ""
echo "✅ Git setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Create private repository on GitHub: https://github.com/new"
echo "2. Repository name: ashwheel"
echo "3. Make it Private"
echo "4. Run these commands:"
echo ""
echo "   git remote add origin https://github.com/YOUR_USERNAME/ashwheel.git"
echo "   git branch -M main"
echo "   git push -u origin main"
echo ""
echo "5. Then setup in Coolify dashboard"
echo ""
