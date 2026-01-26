@echo off
echo ========================================
echo   Starting Buildline Frontend
echo ========================================
echo.

cd frontend

if not exist .env (
    echo ERROR: frontend\.env file not found!
    echo Please run setup.bat first
    pause
    exit /b 1
)

echo Starting frontend dev server on port 3000...
echo.
npm run dev
