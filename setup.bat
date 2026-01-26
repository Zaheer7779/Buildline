@echo off
echo ========================================
echo   BUILDLINE - Local Setup Wizard
echo ========================================
echo.

echo Step 1: Check if .env files exist
if exist backend\.env (
    echo [OK] Backend .env exists
) else (
    echo [ACTION NEEDED] Backend .env is missing!
    echo Creating backend\.env from template...
    copy backend\.env.example backend\.env
    echo.
    echo IMPORTANT: Edit backend\.env with your Supabase credentials!
    echo File location: backend\.env
    echo.
)

if exist frontend\.env (
    echo [OK] Frontend .env exists
) else (
    echo [ACTION NEEDED] Frontend .env is missing!
    echo Creating frontend\.env from template...
    copy frontend\.env.example frontend\.env
    echo.
    echo IMPORTANT: Edit frontend\.env with your Supabase credentials!
    echo File location: frontend\.env
    echo.
)

echo.
echo ========================================
echo   Next Steps:
echo ========================================
echo.
echo 1. Create a Supabase project at: https://supabase.com
echo 2. Run the database migrations (in Supabase SQL Editor):
echo    - supabase/migrations/001_initial_schema.sql
echo    - supabase/migrations/002_views_and_functions.sql
echo    - supabase/migrations/003_seed_data.sql
echo.
echo 3. Edit these files with your Supabase credentials:
echo    - backend\.env
echo    - frontend\.env
echo.
echo 4. Run: start-backend.bat  (in a new terminal)
echo 5. Run: start-frontend.bat (in another new terminal)
echo.
echo For detailed instructions, see: START_LOCAL.md
echo.
pause
