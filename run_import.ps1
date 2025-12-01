# Self-hosted Supabase import script
# Run from project root directory

Write-Host "Step 1: Resetting database..." -ForegroundColor Yellow
docker exec -i supabase-db psql -U postgres -d postgres < reset_database.sql

Write-Host "Step 2: Importing data..." -ForegroundColor Yellow
docker exec -i supabase-db psql -U postgres -d postgres < dump/data.sql

Write-Host "Done!" -ForegroundColor Green
