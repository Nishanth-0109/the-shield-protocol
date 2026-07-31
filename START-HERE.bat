@echo off
set "PATH=C:\Program Files\nodejs;%PATH%"
echo ========================================================
echo    The Shield Protocol - QR and Email Automation
echo ========================================================
echo.
echo This will open TWO terminal windows:
echo   1. Backend Server  (http://localhost:5000)
echo   2. Frontend Server (http://localhost:5173)
echo.
echo After both servers start, open your browser to:
echo    http://localhost:5173
echo.
echo Login:
echo    Email:    admin@shieldprotocol.com
echo    Password: ShieldAdmin@2026
echo.
echo ========================================================
pause

start "Backend - The Shield Protocol" cmd /k "%~dp0start-backend.bat"
timeout /t 2 >nul
start "Frontend - The Shield Protocol" cmd /k "%~dp0start-frontend.bat"

echo.
echo Both servers are starting...
echo Check the two new windows for progress.
echo.
pause
