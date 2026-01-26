@echo off
echo ========================================
echo   Starting Buildline Backend
echo ========================================
echo.

cd backend

if not exist .env (
    echo ERROR: backend\.env file not found!
    echo Please run setup.bat first
    pause
    exit /b 1
)

echo Starting backend server on port 3001...
echo.
npm run dev
