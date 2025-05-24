# PowerShell script to migrate data to DigitalOcean PostgreSQL
# Run this script after the database is created and connected to your app

Write-Host "=== CC Platform Data Migration to DigitalOcean ===" -ForegroundColor Green

# Check if required files exist
$requiredFiles = @(
    "db\schema.sql",
    "db\exported_data\users_data.csv",
    "db\exported_data\tasks_data.csv",
    "db\exported_data\solutions_data.csv",
    "db\exported_data\user_solved_tasks_data.csv"
)

Write-Host "Checking required files..." -ForegroundColor Yellow
foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "Found: $file" -ForegroundColor Green
    } else {
        Write-Host "Missing: $file" -ForegroundColor Red
        exit 1
    }
}

# Get database connection details from user
Write-Host ""
Write-Host "Please provide your DigitalOcean PostgreSQL connection details:" -ForegroundColor Yellow
Write-Host "You can find these in your DigitalOcean database dashboard" -ForegroundColor Gray

$dbHost = Read-Host "Database Host"
$dbPort = Read-Host "Database Port (default: 25060)"
$dbName = Read-Host "Database Name (default: defaultdb)"
$dbUser = Read-Host "Database User (default: doadmin)"
$dbPassword = Read-Host "Database Password" -AsSecureString

# Convert secure string to plain text for psql
$dbPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($dbPassword))

# Set defaults if empty
if ([string]::IsNullOrEmpty($dbPort)) { $dbPort = "25060" }
if ([string]::IsNullOrEmpty($dbName)) { $dbName = "defaultdb" }
if ([string]::IsNullOrEmpty($dbUser)) { $dbUser = "doadmin" }

# Create connection string
$connectionString = "postgresql://${dbUser}:${dbPasswordPlain}@${dbHost}:${dbPort}/${dbName}?sslmode=require"

Write-Host "`nTesting database connection..." -ForegroundColor Yellow

# Test connection
try {
    $testQuery = "SELECT version();"
    $result = psql $connectionString -c $testQuery 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Database connection successful!" -ForegroundColor Green
    } else {
        Write-Host "✗ Database connection failed!" -ForegroundColor Red
        Write-Host "Error: $result" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "✗ Error testing connection: $_" -ForegroundColor Red
    Write-Host "Make sure PostgreSQL client (psql) is installed and in your PATH" -ForegroundColor Yellow
    exit 1
}

Write-Host "`nCreating database schema..." -ForegroundColor Yellow
try {
    $result = psql $connectionString -f "db\schema.sql" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Schema created successfully!" -ForegroundColor Green
    } else {
        Write-Host "✗ Schema creation failed!" -ForegroundColor Red
        Write-Host "Error: $result" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "✗ Error creating schema: $_" -ForegroundColor Red
    exit 1
}

Write-Host "`nImporting data..." -ForegroundColor Yellow

# Import each CSV file
$csvFiles = @(
    @{file="db\exported_data\users_data.csv"; table="users"; columns="id, username, email, password, is_admin, created_at"},
    @{file="db\exported_data\tasks_data.csv"; table="tasks"; columns="id, title, content, language, difficulty, admin_id, is_active, created_at, updated_at"},
    @{file="db\exported_data\solutions_data.csv"; table="solutions"; columns="id, task_id, user_id, code, language, status, score, feedback, submitted_at, evaluated_at"},
    @{file="db\exported_data\user_solved_tasks_data.csv"; table="user_solved_tasks"; columns="user_id, task_id, solution_id, solved_at"}
)

foreach ($csv in $csvFiles) {
    Write-Host "Importing $($csv.table)..." -ForegroundColor Cyan
    try {
        $copyCommand = "\copy $($csv.table)($($csv.columns)) FROM '$($csv.file)' WITH CSV HEADER;"
        $result = psql $connectionString -c $copyCommand 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✓ $($csv.table) imported successfully!" -ForegroundColor Green
        } else {
            Write-Host "✗ Failed to import $($csv.table)!" -ForegroundColor Red
            Write-Host "Error: $result" -ForegroundColor Red
        }
    } catch {
        Write-Host "✗ Error importing $($csv.table): $_" -ForegroundColor Red
    }
}

Write-Host "`nUpdating sequences..." -ForegroundColor Yellow
try {
    $sequenceQueries = @(
        "SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));",
        "SELECT setval('tasks_id_seq', (SELECT MAX(id) FROM tasks));",
        "SELECT setval('solutions_id_seq', (SELECT MAX(id) FROM solutions));"
    )

    foreach ($query in $sequenceQueries) {
        $result = psql $connectionString -c $query 2>&1
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Warning: Sequence update failed: $result" -ForegroundColor Yellow
        }
    }
    Write-Host "✓ Sequences updated!" -ForegroundColor Green
} catch {
    Write-Host "Warning: Error updating sequences: $_" -ForegroundColor Yellow
}

Write-Host "`n=== Migration Summary ===" -ForegroundColor Green
Write-Host "✓ Database schema created" -ForegroundColor Green
Write-Host "✓ Data imported from CSV files" -ForegroundColor Green
Write-Host "✓ Sequences updated" -ForegroundColor Green

Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "1. Update your DigitalOcean App Platform environment variables" -ForegroundColor White
Write-Host "2. Add DATABASE_URL with the connection string" -ForegroundColor White
Write-Host "3. Deploy your application" -ForegroundColor White
Write-Host "4. Test the login functionality" -ForegroundColor White

Write-Host "`nConnection string for DATABASE_URL:" -ForegroundColor Cyan
Write-Host $connectionString -ForegroundColor White

Write-Host "`nMigration completed!" -ForegroundColor Green
