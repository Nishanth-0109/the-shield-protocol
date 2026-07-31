@echo off
set "PATH=C:\Program Files\nodejs;%PATH%"
echo ========================================
echo The Shield Protocol - Backend Server
echo ========================================
echo.

cd /d "%~dp0backend"

echo Checking for node_modules...
if not exist "node_modules" (
    echo Installing backend dependencies...
    call npm install
    echo.
)

echo Starting backend server on http://localhost:5000
echo Press Ctrl+C to stop
echo.
call npm run dev

pause
