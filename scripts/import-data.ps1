# Import Production Data to Local Supabase
# This script imports data from dump/data.sql

Write-Host "🔄 Importing production data to local Supabase..." -ForegroundColor Cyan
Write-Host ""

# Check if Supabase is running
Write-Host "✓ Checking Supabase status..." -ForegroundColor Yellow
$status = supabase status 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Supabase is not running!" -ForegroundColor Red
    Write-Host "Please start Supabase first: npm run db:start" -ForegroundColor Yellow
    exit 1
}
Write-Host "✓ Supabase is running" -ForegroundColor Green
Write-Host ""

# Check if data.sql exists
$dataFile = "dump\data.sql"
if (-not (Test-Path $dataFile)) {
    Write-Host "❌ data.sql not found in dump folder!" -ForegroundColor Red
    exit 1
}

$fileSize = (Get-Item $dataFile).Length / 1MB
Write-Host "📦 Data file size: $([math]::Round($fileSize, 2)) MB" -ForegroundColor Cyan
Write-Host ""

# Import data using docker exec
Write-Host "📥 Importing data (this may take a few minutes)..." -ForegroundColor Yellow

try {
    # Get the container name
    $containerName = "supabase_db_ashwheelpro"
    
    # Copy file to container and execute
    docker cp $dataFile ${containerName}:/tmp/data.sql
    
    # Execute SQL
    docker exec -i $containerName psql -U postgres -d postgres -f /tmp/data.sql
    
    # Clean up
    docker exec -i $containerName rm /tmp/data.sql
    
    Write-Host ""
    Write-Host "✅ Data imported successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "  1. Open Studio: http://localhost:54323" -ForegroundColor White
    Write-Host "  2. Check your tables for data" -ForegroundColor White
    Write-Host "  3. Run: npm run dev:local" -ForegroundColor White
    Write-Host ""
}
catch {
    Write-Host ""
    Write-Host "❌ Error importing data: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Alternative method:" -ForegroundColor Yellow
    Write-Host "  1. Open Studio: http://localhost:54323" -ForegroundColor White
    Write-Host "  2. Go to SQL Editor" -ForegroundColor White
    Write-Host "  3. Copy-paste contents of dump\data.sql" -ForegroundColor White
    Write-Host "  4. Execute the SQL" -ForegroundColor White
    exit 1
}
