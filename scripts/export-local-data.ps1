# PowerShell script to export data from local PostgreSQL database
# This script exports all data to CSV files for migration to DigitalOcean

param(
    [string]$DbHost = "localhost",
    [string]$DbPort = "5432",
    [string]$DbName = "cf_platform",
    [string]$DbUser = "postgres",
    [string]$DbPassword = "Donthack23_",
    [string]$OutputDir = ".\db\exported_data"
)

# Set environment variable for password
$env:PGPASSWORD = $DbPassword

# Create output directory if it doesn't exist
if (!(Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir -Force
    Write-Host "Created output directory: $OutputDir" -ForegroundColor Green
}

Write-Host "Starting data export from local PostgreSQL database..." -ForegroundColor Yellow
Write-Host "Database: $DbName on $DbHost:$DbPort" -ForegroundColor Cyan

try {
    # Export users table
    Write-Host "Exporting users table..." -ForegroundColor Blue
    psql -h $DbHost -p $DbPort -U $DbUser -d $DbName -c "\copy (SELECT id, username, email, password, is_admin, created_at FROM users) TO '$OutputDir\users_data.csv' WITH CSV HEADER"
    
    # Export tasks table
    Write-Host "Exporting tasks table..." -ForegroundColor Blue
    psql -h $DbHost -p $DbPort -U $DbUser -d $DbName -c "\copy (SELECT id, title, content, language, difficulty, admin_id, is_active, created_at FROM tasks) TO '$OutputDir\tasks_data.csv' WITH CSV HEADER"
    
    # Export solutions table
    Write-Host "Exporting solutions table..." -ForegroundColor Blue
    psql -h $DbHost -p $DbPort -U $DbUser -d $DbName -c "\copy (SELECT id, task_id, user_id, code, language, status, score, feedback, submitted_at, evaluated_at FROM solutions) TO '$OutputDir\solutions_data.csv' WITH CSV HEADER"
    
    # Export user_solved_tasks table
    Write-Host "Exporting user_solved_tasks table..." -ForegroundColor Blue
    psql -h $DbHost -p $DbPort -U $DbUser -d $DbName -c "\copy (SELECT user_id, task_id, solution_id, solved_at FROM user_solved_tasks) TO '$OutputDir\user_solved_tasks_data.csv' WITH CSV HEADER"
    
    Write-Host "Data export completed successfully!" -ForegroundColor Green
    Write-Host "Exported files are located in: $OutputDir" -ForegroundColor Cyan
    
    # List exported files
    Write-Host "`nExported files:" -ForegroundColor Yellow
    Get-ChildItem $OutputDir -Filter "*.csv" | ForEach-Object {
        $size = [math]::Round($_.Length / 1KB, 2)
        Write-Host "  - $($_.Name) ($size KB)" -ForegroundColor White
    }
    
} catch {
    Write-Host "Error during export: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Clear password environment variable
$env:PGPASSWORD = $null

Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "1. Upload these CSV files to your DigitalOcean database server" -ForegroundColor White
Write-Host "2. Run the import script on DigitalOcean to load the data" -ForegroundColor White
Write-Host "3. Deploy your application to DigitalOcean App Platform" -ForegroundColor White
