@echo off
echo === CC Platform Data Migration ===
echo.

echo Please provide your DigitalOcean PostgreSQL connection details:
echo You can find these in your DigitalOcean database dashboard
echo.

set /p DB_HOST="Database Host: "
set /p DB_PORT="Database Port (default 25060): "
set /p DB_NAME="Database Name (default defaultdb): "
set /p DB_USER="Database User (default doadmin): "
set /p DB_PASSWORD="Database Password: "

if "%DB_PORT%"=="" set DB_PORT=25060
if "%DB_NAME%"=="" set DB_NAME=defaultdb
if "%DB_USER%"=="" set DB_USER=doadmin

set CONNECTION_STRING=postgresql://%DB_USER%:%DB_PASSWORD%@%DB_HOST%:%DB_PORT%/%DB_NAME%?sslmode=require

echo.
echo Testing connection...
psql "%CONNECTION_STRING%" -c "SELECT version();" > nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Cannot connect to database!
    echo Please check your connection details and try again.
    pause
    exit /b 1
)
echo Connection successful!

echo.
echo Creating schema...
psql "%CONNECTION_STRING%" -f "db\schema.sql"
if %errorlevel% neq 0 (
    echo ERROR: Schema creation failed!
    pause
    exit /b 1
)
echo Schema created successfully!

echo.
echo Importing data...

echo Importing users...
psql "%CONNECTION_STRING%" -c "\copy users(id, username, email, password, is_admin, created_at) FROM 'db/exported_data/users_data.csv' WITH CSV HEADER;"

echo Importing tasks...
psql "%CONNECTION_STRING%" -c "\copy tasks(id, title, content, language, difficulty, admin_id, is_active, created_at) FROM 'db/exported_data/tasks_data.csv' WITH CSV HEADER;"

echo Importing solutions...
psql "%CONNECTION_STRING%" -c "\copy solutions(id, task_id, user_id, code, language, status, score, feedback, submitted_at, evaluated_at) FROM 'db/exported_data/solutions_data.csv' WITH CSV HEADER;"

echo Importing user_solved_tasks...
psql "%CONNECTION_STRING%" -c "\copy user_solved_tasks(user_id, task_id, solution_id, solved_at) FROM 'db/exported_data/user_solved_tasks_data.csv' WITH CSV HEADER;"

echo.
echo Updating sequences...
psql "%CONNECTION_STRING%" -c "SELECT setval('users_id_seq', (SELECT MAX(id) FROM users)); SELECT setval('tasks_id_seq', (SELECT MAX(id) FROM tasks)); SELECT setval('solutions_id_seq', (SELECT MAX(id) FROM solutions));"

echo.
echo === Migration completed! ===
echo.
echo Your DATABASE_URL for DigitalOcean App Platform:
echo %CONNECTION_STRING%
echo.
echo Next steps:
echo 1. Add DATABASE_URL environment variable to your DigitalOcean app
echo 2. Deploy your application
echo 3. Test the login functionality
echo.
pause
