# 🚀 Development Workflow Guide

## Quick Start

### First Time Setup

```powershell
# 1. Start local Supabase
npm run db:start

# 2. Database is auto-configured with production schema
# (from supabase/migrations/20250124000000_initial_schema.sql)

# 3. Start development server
npm run dev:local

# 4. Open app
# http://localhost:3000

# 5. Access Supabase Studio
# http://localhost:54323
```

---

## Daily Development Workflow

### Morning: Start Development

```powershell
# Start Supabase (if not running)
npm run db:start

# Start app in local mode
npm run dev:local
```

### During Development

```powershell
# Make code changes
# Edit files in src/

# If database schema changes needed:
npm run db:migrate new_feature_name
# This creates: supabase/migrations/[timestamp]_new_feature_name.sql

# Test locally
# All changes reflect immediately
```

### Evening: Stop Services

```powershell
# Stop Supabase (optional - can keep running)
npm run db:stop
```

---

## Environment Configuration

### Local Development (`.env.local`)
- **Supabase URL**: `http://127.0.0.1:54321`
- **Database**: Local PostgreSQL
- **Auto-loaded** when running `npm run dev:local`

### Production (`.env.production`)
- **Supabase URL**: `https://supabase.ashwheel.cloud`
- **Database**: Production PostgreSQL on Hostinger VPS
- **Used by Coolify** during deployment

---

## Database Management

### Check Status
```powershell
npm run db:status
```

### Reset Database (Fresh Start)
```powershell
# WARNING: Deletes all local data
npm run db:reset

# Reapplies all migrations from supabase/migrations/
```

### Create Migration
```powershell
# After making schema changes in Studio
npm run db:migrate migration_name

# Example:
npm run db:migrate add_products_table
```

### Push Migrations to Production
```powershell
# Link to production first (one-time)
supabase link --project-ref <your-project-ref>

# Push migrations
npm run db:push
```

---

## Git Workflow

### Feature Development

```powershell
# 1. Create feature branch
git checkout -b feature/new-feature

# 2. Make changes
# Edit code, create migrations if needed

# 3. Test locally
npm run dev:local

# 4. Commit changes
git add .
git commit -m "feat: description of feature"

# 5. Push to GitHub
git push origin feature/new-feature
```

### Deployment to Production

```powershell
# 1. Merge to main
git checkout main
git merge feature/new-feature

# 2. Push to GitHub
git push origin main

# 3. Coolify auto-deploys
# - Detects push to main branch
# - Pulls latest code
# - Runs: npm run build:prod
# - Applies migrations (if any)
# - Deploys to ashwheel.cloud
```

---

## Available Scripts

### Development
- `npm run dev` - Start dev server (uses default .env)
- `npm run dev:local` - Start with local Supabase (uses .env.local)

### Build
- `npm run build` - Build for production
- `npm run build:prod` - Build with production env

### Database
- `npm run db:start` - Start local Supabase
- `npm run db:stop` - Stop local Supabase
- `npm run db:status` - Check Supabase status
- `npm run db:reset` - Reset database (apply migrations)
- `npm run db:migrate <name>` - Create new migration
- `npm run db:push` - Push migrations to production

### Setup
- `npm run setup:local` - Import production schema (first time)

---

## Database Migrations

### What are Migrations?

Migrations are SQL files that track database schema changes:

```
supabase/migrations/
├── 20250124000000_initial_schema.sql  (production schema)
├── 20250125120000_add_users_table.sql
└── 20250126150000_add_products_index.sql
```

### Creating a Migration

**Option 1: Using Studio** (Recommended)
1. Open Studio: http://localhost:54323
2. Make schema changes (create tables, add columns, etc.)
3. Run: `npm run db:migrate feature_name`
4. Migration file auto-created with your changes

**Option 2: Manual SQL**
1. Create file: `supabase/migrations/[timestamp]_name.sql`
2. Write SQL commands
3. Run: `npm run db:reset` to apply

### Applying Migrations

**Local:**
```powershell
npm run db:reset
```

**Production:**
```powershell
# Migrations auto-apply on Coolify deployment
# Or manually:
npm run db:push
```

---

## Troubleshooting

### Supabase Won't Start
```powershell
# Stop and clean
npm run db:stop
docker system prune -f

# Restart
npm run db:start
```

### Database Schema Out of Sync
```powershell
# Reset to migrations
npm run db:reset
```

### App Not Connecting to Local Supabase
```powershell
# Check Supabase is running
npm run db:status

# Verify .env.local exists
cat .env.local

# Restart app
npm run dev:local
```

### Migration Failed
```powershell
# Check migration file syntax
# Fix SQL errors

# Reset database
npm run db:reset
```

---

## Testing Before Deployment

### Checklist

- [ ] App runs locally: `npm run dev:local`
- [ ] All features work
- [ ] No console errors
- [ ] Database queries successful
- [ ] Migrations created (if schema changed)
- [ ] Code committed to Git
- [ ] Tests pass (if applicable)

### Production Build Test

```powershell
# Build locally to check for errors
npm run build:prod

# Preview production build
npm run preview
```

---

## Production Deployment

### Automatic (Recommended)

1. Push to `main` branch
2. Coolify auto-deploys
3. Check https://ashwheel.cloud

### Manual (If Needed)

1. Login to Coolify dashboard
2. Navigate to ashwheel project
3. Click "Deploy"
4. Monitor deployment logs

---

## Best Practices

### ✅ DO

- Always test locally before pushing
- Create migrations for schema changes
- Use descriptive commit messages
- Keep `.env.local` and `.env.production` updated
- Run `npm run db:status` to verify Supabase

### ❌ DON'T

- Don't commit `.env.local` or `.env.production` to Git
- Don't make schema changes directly on production
- Don't skip testing before deployment
- Don't delete migration files
- Don't use production credentials locally

---

## Quick Reference

| Task | Command |
|------|---------|
| Start local dev | `npm run dev:local` |
| Start Supabase | `npm run db:start` |
| Check DB status | `npm run db:status` |
| Create migration | `npm run db:migrate name` |
| Reset database | `npm run db:reset` |
| Build for prod | `npm run build:prod` |
| Deploy | `git push origin main` |

---

## Support

- **Supabase Studio**: http://localhost:54323
- **Local App**: http://localhost:3000
- **Production**: https://ashwheel.cloud
- **Supabase Docs**: https://supabase.com/docs

---

**Happy Coding! 🎉**
