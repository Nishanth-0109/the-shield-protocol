@echo off
set "PATH=C:\Program Files\nodejs;%PATH%"
echo ========================================
echo The Shield Protocol - Frontend Server
echo ========================================
echo.

cd /d "%~dp0frontend"

echo Checking for node_modules...
if not exist "node_modules" (
    echo Installing frontend dependencies...
    call npm install
    echo.
)

echo Starting frontend server on http://localhost:5173
echo Press Ctrl+C to stop
echo.
call npm run dev

pause
