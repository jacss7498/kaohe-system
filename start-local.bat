@echo off
echo ========================================
echo Local Startup Script (No Docker)
echo ========================================
echo.

echo [1/2] Starting Backend...
start "Backend Server" cmd /k "cd backend && npm run dev"

echo [2/2] Starting Frontend...
start "Frontend Server" cmd /k "cd frontend && npm run dev"

echo.
echo Services are starting in new windows.
echo Please wait for them to initialize.
echo.
echo Frontend will be available at: http://localhost:5173
echo Backend will be available at: http://localhost:3001
echo.
pause
